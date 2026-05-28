import React, { useEffect, useState } from 'react';
import { shiftRegistrationsAPI } from '../utils/api';
import type { ShiftRegistration as ShiftRegistrationType } from '../utils/api';
import {
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const fmtDate = (ymd: string): string => {
  const d = new Date(ymd);
  return `${WD[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
};

const fmtRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const f = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${f(s)} – ${f(e)}`;
};

const fmtTime = (t?: string): string => (t ? t.slice(0, 5) : '');

const ShiftApproval: React.FC = () => {
  const [items, setItems] = useState<ShiftRegistrationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ShiftRegistrationType | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftRegistrationsAPI.pendingApprovals();
      setItems(data);
    } catch (err) {
      console.error('Lỗi tải danh sách chờ duyệt:', err);
      setError('Không thể tải danh sách đơn chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (reg: ShiftRegistrationType) => {
    setProcessingId(reg.id);
    try {
      await shiftRegistrationsAPI.approve(reg.id);
      setItems((prev) => prev.filter((r) => r.id !== reg.id));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Duyệt thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    setProcessingId(rejectTarget.id);
    try {
      await shiftRegistrationsAPI.reject(rejectTarget.id, rejectReason.trim());
      setItems((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Duyệt ca làm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Duyệt đăng ký ca làm theo tuần của nhân viên cấp dưới
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
          <ClockIcon className="h-4 w-4" />
          {items.length} chờ duyệt
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchPending} className="btn-primary text-xs px-4 py-2 mt-4">
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Không có đơn chờ duyệt</p>
          <p className="text-xs text-gray-400 mt-1">
            Các đăng ký ca của cấp dưới sẽ hiển thị ở đây khi cần duyệt.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((reg) => (
            <div key={reg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {reg.employee_detail?.full_name || `NV #${reg.employee}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {reg.employee_detail?.employee_id ? `${reg.employee_detail.employee_id} · ` : ''}
                    Tuần {fmtRange(reg.week_start_date, reg.week_end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectTarget(reg);
                      setRejectReason('');
                    }}
                    disabled={processingId === reg.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(reg)}
                    disabled={processingId === reg.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {processingId === reg.id ? 'Đang xử lý...' : 'Duyệt'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {reg.days
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((day) => (
                    <div
                      key={day.date}
                      className="border border-gray-100 rounded-xl px-3 py-2 text-center"
                    >
                      <p className="text-xs text-gray-400">{fmtDate(day.date)}</p>
                      {day.shift_detail ? (
                        <>
                          <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                            {day.shift_detail.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {fmtTime(day.shift_detail.start_time)}–{fmtTime(day.shift_detail.end_time)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-gray-400 mt-1">Nghỉ</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setRejectTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Từ chối đăng ký ca</h3>
            <p className="text-xs text-gray-400 mb-4">
              {rejectTarget.employee_detail?.full_name} · Tuần{' '}
              {fmtRange(rejectTarget.week_start_date, rejectTarget.week_end_date)}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="input-field w-full"
              placeholder="Nhập lý do từ chối..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Huỷ
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === rejectTarget.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === rejectTarget.id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftApproval;
