import React, { useEffect, useMemo, useState } from 'react';
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
  getMissingWorkdayPenaltyConfig,
  updateMissingWorkdayPenaltyConfig,
} from '../services/permission-config.service';

const formatVnd = (n: number) => n.toLocaleString('vi-VN');

const toggle = (set: Set<number>, id: number, on: boolean) => {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
};

/**
 * Chế độ Trưởng phòng — gộp 2 danh sách HCNS tự chọn cho cùng nhóm Trưởng phòng
 * (backend vẫn là 2 cấu hình riêng):
 *  - Hạn mức giải trình: Đi muộn + Về sớm gộp chung tối đa N lần/tháng, Quên chấm công
 *    tối đa M lần/tháng (N, M lưu ở backend, sửa ngay trên tab này)
 *    (ManagerExplanationQuotaConfig).
 *  - Phạt thiếu công: TP không lương cứng đi thiếu công chuẩn thì phạt
 *    mốc lương / công chuẩn × số công thiếu, tính lúc chốt công (MissingWorkdayPenaltyConfig).
 */
const ManagerPoliciesTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Thứ tự các dòng trong bảng; một người có thể đang bỏ tick cả 2 (chưa lưu).
  const [rowIds, setRowIds] = useState<number[]>([]);
  const [quotaIds, setQuotaIds] = useState<Set<number>>(new Set());
  const [penaltyIds, setPenaltyIds] = useState<Set<number>>(new Set());
  // Hạn mức giải trình cấp TP — lấy từ backend (ManagerExplanationQuotaConfig), không đặt sẵn số ở web.
  const [maxLateEarly, setMaxLateEarly] = useState('');
  const [maxIncomplete, setMaxIncomplete] = useState('');
  const [baseAmount, setBaseAmount] = useState('10000000');
  const [withBasicSalary, setWithBasicSalary] = useState<Set<number>>(new Set());

  const [empSearch, setEmpSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const applyConfigs = (
    quota: Awaited<ReturnType<typeof getManagerExplanationQuotaConfig>>,
    penalty: Awaited<ReturnType<typeof getMissingWorkdayPenaltyConfig>>,
  ) => {
    setQuotaIds(new Set(quota.eligible_employees));
    setPenaltyIds(new Set(penalty.eligible_employees));
    setRowIds(Array.from(new Set([...quota.eligible_employees, ...penalty.eligible_employees])));
    setMaxLateEarly(String(quota.max_late_early_explanations));
    setMaxIncomplete(String(quota.max_incomplete_attendance_explanations));
    setBaseAmount(String(Math.round(Number(penalty.base_amount))));
    setWithBasicSalary(new Set(penalty.eligible_employees_detail.filter(e => e.has_basic_salary).map(e => e.id)));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, quota, penalty] = await Promise.all([
          employeesAPI.list({ page_size: 1000, is_active: true }),
          getManagerExplanationQuotaConfig(),
          getMissingWorkdayPenaltyConfig(),
        ]);
        setEmployees(empRes.results);
        applyConfigs(quota, penalty);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasBasicSalary = (e: Employee) => withBasicSalary.has(e.id) || Number(e.basic_salary) > 0;

  const addRow = (e: Employee) => {
    setRowIds(prev => (prev.includes(e.id) ? prev : [...prev, e.id]));
    // Thêm mới: mặc định áp hạn mức giải trình TP; phạt thiếu công chỉ tick sẵn cho người
    // hồ sơ đang không có lương cơ bản.
    setQuotaIds(prev => toggle(prev, e.id, true));
    if (e.basic_salary !== undefined && !(Number(e.basic_salary) > 0)) {
      setPenaltyIds(prev => toggle(prev, e.id, true));
    }
  };

  const removeRow = (id: number) => {
    setRowIds(prev => prev.filter(x => x !== id));
    setQuotaIds(prev => toggle(prev, id, false));
    setPenaltyIds(prev => toggle(prev, id, false));
  };

  const handleSave = async () => {
    const amount = Number(baseAmount.replace(/\D/g, ''));
    if (!amount) {
      setError('Mốc lương tính phạt phải lớn hơn 0');
      return;
    }
    const lateEarly = Number(maxLateEarly);
    const incomplete = Number(maxIncomplete);
    if (maxLateEarly === '' || maxIncomplete === '' || !Number.isInteger(lateEarly) || !Number.isInteger(incomplete)
        || lateEarly < 0 || incomplete < 0) {
      setError('Hạn mức giải trình phải là số nguyên ≥ 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const [quota, penalty] = await Promise.all([
        updateManagerExplanationQuotaConfig({
          eligible_employees: Array.from(quotaIds),
          max_late_early_explanations: lateEarly,
          max_incomplete_attendance_explanations: incomplete,
        }),
        updateMissingWorkdayPenaltyConfig({ eligible_employees: Array.from(penaltyIds), base_amount: amount }),
      ]);
      applyConfigs(quota, penalty);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (err: any) {
      const data = err?.response?.data;
      setError(data?.base_amount?.[0] || data?.detail || err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    return employees.filter(
      e => !q || e.full_name.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q),
    );
  }, [employees, empSearch]);
  const rows = rowIds
    .map(id => employees.find(e => e.id === id))
    .filter((e): e is Employee => Boolean(e));
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
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-sm font-medium text-amber-800">Chế độ Trưởng phòng — HCNS tự chọn từng người</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Hạn mức giải trình:</strong> Đi muộn + Về sớm gộp chung tối đa{' '}
          <strong>{maxLateEarly || '—'} lần/tháng</strong>, Quên chấm công tối đa{' '}
          <strong>{maxIncomplete || '—'} lần/tháng</strong>, không giới hạn số phút đi muộn / về sớm — thay cho hạn
          mức từng loại của nhân viên thường.
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Phạt thiếu công</strong> (TP không có lương cứng): không đi đủ công chuẩn của tháng (số ngày trong
          tháng trừ Chủ nhật) thì phạt <strong>mốc lương / công chuẩn × số công thiếu</strong> — VD 26 công chuẩn, đi
          24 công → phạt {formatVnd(Math.round((amountNumber / 26) * 2))}đ. Tính lúc <strong>chốt công</strong>, đổi
          danh sách thì chốt công lại tháng đó.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:w-60">
          Đi muộn + Về sớm (lần/tháng)
          <input
            type="number"
            min={0}
            step={1}
            value={maxLateEarly}
            onChange={e => setMaxLateEarly(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:w-60">
          Quên chấm công (lần/tháng)
          <input
            type="number"
            min={0}
            step={1}
            value={maxIncomplete}
            onChange={e => setMaxIncomplete(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:w-80">
          Mốc lương tính phạt thiếu công (VNĐ)
          <input
            type="text"
            inputMode="numeric"
            value={amountNumber ? formatVnd(amountNumber) : ''}
            onChange={e => setBaseAmount(e.target.value.replace(/\D/g, ''))}
            className="input-field"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nhân viên</p>
              <p className="text-xs text-gray-400">Tick để thêm vào danh sách Trưởng phòng</p>
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
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[440px] divide-y divide-gray-50 bg-white">
            {filteredEmployees.map(e => (
              <label
                key={e.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={rowIds.includes(e.id)}
                  onChange={ev => (ev.target.checked ? addRow(e) : removeRow(e.id))}
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

        <div className="lg:col-span-3 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircleIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Trưởng phòng</p>
              <p className="text-xs text-gray-400">
                {rows.length} người · hạn mức giải trình TP {quotaIds.size} · phạt thiếu công {penaltyIds.size}
              </p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-auto max-h-[480px] bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Nhân viên</th>
                  <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                    Hạn mức giải trình TP
                  </th>
                  <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">Phạt thiếu công</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(e => (
                  <tr key={e.id}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{e.employee_id}</span>
                        <span className="font-medium text-gray-800 truncate">{e.full_name}</span>
                      </div>
                      {penaltyIds.has(e.id) && hasBasicSalary(e) && (
                        <span className="mt-1 inline-block text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5">
                          Đang có lương cơ bản
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Hạn mức giải trình TP — ${e.full_name}`}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                        checked={quotaIds.has(e.id)}
                        onChange={ev => setQuotaIds(prev => toggle(prev, e.id, ev.target.checked))}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Phạt thiếu công — ${e.full_name}`}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                        checked={penaltyIds.has(e.id)}
                        onChange={ev => setPenaltyIds(prev => toggle(prev, e.id, ev.target.checked))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(e.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-xs font-semibold"
                      >
                        Bỏ
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-xs text-gray-400 text-center py-6">Chưa chọn Trưởng phòng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
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

export default ManagerPoliciesTab;
