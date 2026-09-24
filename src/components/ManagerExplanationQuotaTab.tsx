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
  getManagerExplanationQuotaConfig,
  updateManagerExplanationQuotaConfig,
} from '../services/permission-config.service';

function toggleId(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const ManagerExplanationQuotaTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);
  const [maxExplanations, setMaxExplanations] = useState<number>(5);

  const [empSearch, setEmpSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, config] = await Promise.all([
        employeesAPI.list({ page_size: 1000, is_active: true }),
        getManagerExplanationQuotaConfig(),
      ]);
      setEmployees(empRes.results);
      setEmployeeIds(config.eligible_employees);
      setMaxExplanations(config.max_explanations);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateManagerExplanationQuotaConfig({ eligible_employees: employeeIds });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Lưu thất bại');
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
        <p className="text-sm font-medium text-amber-800">Hạn mức giải trình gộp cấp Trưởng phòng</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Nhân viên được chọn bên dưới sẽ được giải trình Đi muộn/Về sớm/Quên chấm công GỘP CHUNG
          tối đa <strong>{maxExplanations} lần/tháng</strong> — không tách riêng mỗi loại 1 lần/tháng
          như quy định mặc định của nhân viên thường. HR tự chọn từng người cụ thể, không suy ra tự
          động theo chức danh/vị trí.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chọn nhân viên */}
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

        {/* Danh sách đã chọn */}
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

export default ManagerExplanationQuotaTab;
