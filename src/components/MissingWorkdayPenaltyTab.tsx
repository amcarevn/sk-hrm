import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { employeesAPI } from '../utils/api';
import { Employee } from '../utils/api/types';
import {
  getMissingWorkdayPenaltyConfig,
  updateMissingWorkdayPenaltyConfig,
} from '../services/permission-config.service';

function toggleId(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const formatVnd = (n: number) => n.toLocaleString('vi-VN');

/**
 * Phạt thiếu công cho Trưởng phòng không có lương cứng (HCNS SK 2026-10-12):
 * không đi đủ công chuẩn của tháng thì phạt mốc lương / công chuẩn × số công thiếu.
 * HCNS tự chọn người áp dụng. Phạt tính lúc chốt công.
 */
const MissingWorkdayPenaltyTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);
  const [baseAmount, setBaseAmount] = useState<string>('10000000');
  const [withBasicSalary, setWithBasicSalary] = useState<Set<number>>(new Set());

  const [empSearch, setEmpSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const applyConfig = (config: Awaited<ReturnType<typeof getMissingWorkdayPenaltyConfig>>) => {
    setEmployeeIds(config.eligible_employees);
    setBaseAmount(String(Math.round(Number(config.base_amount))));
    setWithBasicSalary(new Set(config.eligible_employees_detail.filter(e => e.has_basic_salary).map(e => e.id)));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, config] = await Promise.all([
          employeesAPI.list({ page_size: 1000, is_active: true }),
          getMissingWorkdayPenaltyConfig(),
        ]);
        setEmployees(empRes.results);
        applyConfig(config);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    const amount = Number(baseAmount.replace(/\D/g, ''));
    if (!amount) {
      setError('Mốc lương phải lớn hơn 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const config = await updateMissingWorkdayPenaltyConfig({ eligible_employees: employeeIds, base_amount: amount });
      applyConfig(config);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (err: any) {
      const data = err?.response?.data;
      setError(data?.base_amount?.[0] || data?.detail || err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(
    e =>
      !empSearch ||
      e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(empSearch.toLowerCase())
  );
  const selectedEmployees = employees.filter(e => employeeIds.includes(e.id));
  const amountNumber = Number(baseAmount.replace(/\D/g, '')) || 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm font-medium text-amber-800">Phạt thiếu công — Trưởng phòng không có lương cứng</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Người được chọn bên dưới nếu không đi đủ <strong>công chuẩn của tháng</strong> (số ngày trong tháng trừ
          Chủ nhật) sẽ bị phạt: <strong>mốc lương / công chuẩn × số công thiếu</strong>. VD tháng 26 công chuẩn, đi 24
          công → phạt {formatVnd(Math.round((amountNumber / 26) * 2))}đ. Công tính là tổng công chốt (gồm nghỉ phép có
          lương, lễ). Phạt được tính lúc <strong>chốt công</strong> — đổi danh sách thì chốt công lại tháng đó.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Mốc lương tính phạt (VNĐ)
          <input
            type="text"
            inputMode="numeric"
            value={amountNumber ? formatVnd(amountNumber) : ''}
            onChange={e => setBaseAmount(e.target.value.replace(/\D/g, ''))}
            className="input-field sm:w-56"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nhân viên</p>
              <p className="text-xs text-gray-400">Đã chọn: {employeeIds.length}</p>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã NV..."
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[400px] divide-y divide-gray-50 bg-white">
            {filteredEmployees.map(e => (
              <label
                key={e.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={employeeIds.includes(e.id)}
                  onChange={() => setEmployeeIds(prev => toggleId(prev, e.id))}
                />
                <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{e.employee_id}</span>
                <span className="font-medium text-gray-800 truncate">{e.full_name}</span>
              </label>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Không có kết quả</p>
            )}
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircleIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Đang được áp dụng</p>
              <p className="text-xs text-gray-400">{selectedEmployees.length} nhân viên</p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[440px] divide-y divide-gray-50 bg-white">
            {selectedEmployees.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{e.employee_id}</span>
                  <span className="font-medium text-gray-800 truncate">{e.full_name}</span>
                  {withBasicSalary.has(e.id) && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 shrink-0">
                      Đang có lương cơ bản
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEmployeeIds(prev => toggleId(prev, e.id))}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0 text-xs font-semibold"
                >
                  Bỏ
                </button>
              </div>
            ))}
            {selectedEmployees.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Chưa chọn nhân viên nào</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedAt && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            Đã lưu
          </span>
        )}
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default MissingWorkdayPenaltyTab;
