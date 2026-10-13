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
  ChildCareRegime,
  listChildCareRegimes,
  createChildCareRegime,
  updateChildCareRegime,
  deleteChildCareRegime,
} from '../services/permission-config.service';

const firstDayOfMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const formatDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

const apiError = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return err?.message || fallback;
};

/**
 * Chế độ con nhỏ (HCNS SK 2026-10-13): không còn là một ca làm việc riêng. Admin/HR
 * chọn người hưởng kèm khoảng ngày; trong khoảng đó mỗi ngày được đi muộn tối đa 60
 * phút và về sớm tối đa 60 phút (mỗi chiều) mà không tính lỗi / phạt.
 */
const ChildCareRegimeTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regimes, setRegimes] = useState<ChildCareRegime[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const flashSaved = () => {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, rows] = await Promise.all([
          employeesAPI.list({ page_size: 1000, is_active: true }),
          listChildCareRegimes(),
        ]);
        setEmployees(empRes.results);
        setRegimes(rows);
      } catch (err: any) {
        setError(apiError(err, 'Không thể tải dữ liệu'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    return employees.filter(
      e => !q || e.full_name.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q),
    );
  }, [employees, empSearch]);
  const picked = employees.find(e => e.id === pickedId) ?? null;

  const handleAdd = async () => {
    if (!pickedId) {
      setError('Chọn nhân viên trước.');
      return;
    }
    if (!startDate) {
      setError('Chọn Từ ngày.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const row = await createChildCareRegime({
        employee: pickedId, start_date: startDate, end_date: endDate || null, note: note.trim(),
      });
      setRegimes(prev => [row, ...prev]);
      setPickedId(null);
      setEndDate('');
      setNote('');
      flashSaved();
    } catch (err: any) {
      setError(apiError(err, 'Thêm thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleEndDateChange = async (row: ChildCareRegime, value: string) => {
    setError(null);
    try {
      const updated = await updateChildCareRegime(row.id, { end_date: value || null });
      setRegimes(prev => prev.map(r => (r.id === row.id ? updated : r)));
      flashSaved();
    } catch (err: any) {
      setError(apiError(err, 'Cập nhật thất bại'));
    }
  };

  const handleDelete = async (row: ChildCareRegime) => {
    setError(null);
    try {
      await deleteChildCareRegime(row.id);
      setRegimes(prev => prev.filter(r => r.id !== row.id));
      flashSaved();
    } catch (err: any) {
      setError(apiError(err, 'Xoá thất bại'));
    }
  };

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
      <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3">
        <p className="text-sm font-medium text-pink-800">Chế độ con nhỏ</p>
        <p className="text-xs text-pink-700 mt-0.5 leading-relaxed">
          Trong khoảng ngày được chọn, mỗi ngày nhân viên được <strong>đi muộn tối đa 60 phút</strong> và{' '}
          <strong>về sớm tối đa 60 phút</strong> mà không tính lỗi, không bị phạt, công vẫn đủ. Phần vượt 60 phút tính
          như bình thường. Hết chế độ thì đặt <strong>Đến ngày</strong> — đừng xoá, xoá sẽ mất luôn chế độ ở các tháng
          trước khi tính lại công.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Thêm người hưởng chế độ</p>
              <p className="text-xs text-gray-400">{picked ? `Đã chọn: ${picked.full_name}` : 'Chọn 1 nhân viên'}</p>
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
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[260px] divide-y divide-gray-50 bg-white">
            {filteredEmployees.map(e => (
              <label
                key={e.id}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  pickedId === e.id ? 'bg-primary-50' : 'hover:bg-primary-50'
                }`}
              >
                <input
                  type="radio"
                  name="child-care-employee"
                  className="border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={pickedId === e.id}
                  onChange={() => setPickedId(e.id)}
                />
                <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{e.employee_id}</span>
                <span className="font-medium text-gray-800 truncate">{e.full_name}</span>
              </label>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Không có kết quả</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Từ ngày
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Đến ngày (không bắt buộc)
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
            </label>
          </div>
          <input
            type="text"
            placeholder="Ghi chú (vd: con sinh 05/2026)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field"
          />
          <button type="button" onClick={handleAdd} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Thêm'}
          </button>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircleIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Đang hưởng chế độ</p>
                <p className="text-xs text-gray-400">{regimes.length} dòng</p>
              </div>
            </div>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircleIcon className="h-4 w-4" />
                Đã lưu
              </span>
            )}
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[520px] divide-y divide-gray-50 bg-white">
            {regimes.map(r => (
              <div key={r.id} className="flex flex-col gap-1.5 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{r.employee_code}</span>
                    <span className="font-medium text-gray-800 truncate">{r.employee_name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0 text-xs font-semibold"
                  >
                    Xoá
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-16 text-xs text-gray-600">
                  <span>Từ {formatDate(r.start_date)}</span>
                  <span className="text-gray-300">→</span>
                  <label className="flex items-center gap-1">
                    Đến
                    <input
                      type="date"
                      value={r.end_date ?? ''}
                      min={r.start_date}
                      onChange={e => handleEndDateChange(r, e.target.value)}
                      className="rounded-md border border-gray-200 px-1.5 py-0.5 text-xs"
                    />
                  </label>
                  {!r.end_date && <span className="text-emerald-600">(chưa hết hạn)</span>}
                </div>
                {(r.department_name || r.note) && (
                  <p className="pl-0 sm:pl-16 text-[11px] text-gray-400 truncate">
                    {[r.department_name, r.note].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ))}
            {regimes.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Chưa có ai hưởng chế độ con nhỏ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildCareRegimeTab;
