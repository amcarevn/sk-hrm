import React, { useEffect, useMemo, useState } from 'react';
import { employeesAPI, companyConfigAPI, shiftRegistrationsAPI } from '../utils/api';
import type { ShiftConfig, ShiftRegistration as ShiftRegistrationType } from '../utils/api';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const getMonday = (d: Date): Date => {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7; // số ngày kể từ Thứ 2
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const fmtDM = (d: Date): string =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

const fmtTime = (t?: string): string => (t ? t.slice(0, 5) : '');

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Đã huỷ', className: 'bg-gray-100 text-gray-500' },
};

const ShiftRegistration: React.FC = () => {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [weekMonday, setWeekMonday] = useState<Date>(() => addDays(getMonday(new Date()), 7));
  const [existingReg, setExistingReg] = useState<ShiftRegistrationType | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({}); // dateYMD -> shiftId (0 = Nghỉ)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i)),
    [weekMonday]
  );

  const shiftOptions = useMemo(
    () => [
      { value: 0, label: 'Nghỉ' },
      ...shifts.map((s) => ({
        value: s.id,
        label: `${s.name} (${fmtTime(s.start_time)}–${fmtTime(s.end_time)})`,
      })),
    ],
    [shifts]
  );

  // Hạn đăng ký: hết Thứ 6 (23:59) tuần liền trước
  const deadline = useMemo(() => {
    if (existingReg?.registration_deadline) return new Date(existingReg.registration_deadline);
    const fri = addDays(weekMonday, -3);
    fri.setHours(23, 59, 59, 999);
    return fri;
  }, [existingReg, weekMonday]);

  const pastDeadline = new Date() > deadline;
  const isReadOnly =
    !!existingReg && (existingReg.status === 'PENDING' || existingReg.status === 'APPROVED');
  const canEdit = !noProfile && !isReadOnly && !pastDeadline;

  // Load nhân viên hiện tại + danh mục ca (1 lần)
  useEffect(() => {
    (async () => {
      try {
        const [me, shiftRes] = await Promise.all([
          employeesAPI.me(),
          companyConfigAPI.listShiftConfigs({ page_size: 200 }),
        ]);
        setEmployeeId(me.id);
        setShifts(shiftRes.results || []);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setNoProfile(true);
        } else {
          console.error('Lỗi tải dữ liệu ca làm:', err);
        }
      }
    })();
  }, []);

  // Load đăng ký của tuần đang chọn
  useEffect(() => {
    if (employeeId == null) {
      if (noProfile) setLoading(false);
      return;
    }
    fetchWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, weekMonday]);

  const fetchWeek = async () => {
    if (employeeId == null) return;
    setLoading(true);
    setMessage(null);
    try {
      const regs = await shiftRegistrationsAPI.list({
        week_start_date: toYMD(weekMonday),
        employee: employeeId,
      });
      const reg = regs.find((r) => r.employee === employeeId) || null;
      setExistingReg(reg);

      const sel: Record<string, number> = {};
      weekDates.forEach((d) => {
        sel[toYMD(d)] = 0;
      });
      if (reg) {
        reg.days.forEach((day) => {
          sel[day.date] = day.shift ?? 0;
        });
      }
      setSelections(sel);
    } catch (err) {
      console.error('Lỗi tải đăng ký tuần:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildDays = () =>
    weekDates.map((d) => {
      const ymd = toYMD(d);
      const v = selections[ymd] || 0;
      return { date: ymd, shift: v === 0 ? null : v };
    });

  // Lưu (tạo mới hoặc cập nhật) — trả về bản ghi sau lưu
  const persist = async (): Promise<ShiftRegistrationType> => {
    const payload = { week_start_date: toYMD(weekMonday), days: buildDays() };
    if (existingReg) {
      return shiftRegistrationsAPI.update(existingReg.id, payload);
    }
    return shiftRegistrationsAPI.create(payload);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const reg = await persist();
      setExistingReg(reg);
      setMessage({ type: 'success', text: 'Đã lưu nháp đăng ký ca.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: extractError(err, 'Lưu nháp thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const reg = await persist();
      const submitted = await shiftRegistrationsAPI.submit(reg.id);
      setExistingReg(submitted);
      setMessage({ type: 'success', text: 'Đã gửi đăng ký ca cho quản lý duyệt.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: extractError(err, 'Gửi duyệt thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  const extractError = (err: any, fallback: string): string => {
    const data = err?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (Array.isArray(data) && data.length) return String(data[0]);
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      const v = data[firstKey];
      if (Array.isArray(v)) return `${firstKey}: ${v[0]}`;
      if (typeof v === 'string') return v;
    }
    return fallback;
  };

  const statusBadge = existingReg ? STATUS_BADGE[existingReg.status] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Đăng ký ca làm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chọn ca làm cho từng ngày trong tuần và gửi quản lý duyệt
          </p>
        </div>
        {statusBadge && (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        )}
      </div>

      {noProfile ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm font-semibold text-gray-700">Tài khoản chưa gắn hồ sơ nhân viên</p>
          <p className="text-xs text-gray-400 mt-1">
            Vui lòng liên hệ HR để được gắn hồ sơ trước khi đăng ký ca.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Week navigator */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={() => setWeekMonday((w) => addDays(w, -7))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" /> Tuần trước
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-900">
                <ClockIcon className="h-5 w-5 text-primary-600" />
                Tuần {fmtDM(weekDates[0])} – {fmtDM(weekDates[6])}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Hạn đăng ký: {deadline.toLocaleString('vi-VN')}
              </p>
            </div>
            <button
              onClick={() => setWeekMonday((w) => addDays(w, 7))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Tuần sau <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              <p className="text-sm text-gray-500">Đang tải...</p>
            </div>
          ) : (
            <>
              {/* Trạng thái / thông báo */}
              {existingReg?.status === 'REJECTED' && existingReg.reject_reason && (
                <div className="mx-5 mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Đơn bị từ chối: {existingReg.reject_reason}. Vui lòng chỉnh lại và gửi duyệt
                    lại.
                  </span>
                </div>
              )}
              {isReadOnly && (
                <div className="mx-5 mt-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  {existingReg?.status === 'PENDING'
                    ? 'Đơn đang chờ quản lý duyệt — không thể chỉnh sửa.'
                    : 'Đơn đã được duyệt — không thể chỉnh sửa.'}
                </div>
              )}
              {!isReadOnly && pastDeadline && (
                <div className="mx-5 mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Đã quá hạn đăng ký cho tuần này (hạn: hết Thứ 6 tuần trước).
                </div>
              )}
              {message && (
                <div
                  className={`mx-5 mt-4 flex items-center gap-2 text-sm rounded-xl px-3 py-2 border ${
                    message.type === 'success'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              {/* Lưới ngày */}
              <div className="p-5 space-y-3">
                {weekDates.map((d, idx) => {
                  const ymd = toYMD(d);
                  return (
                    <div
                      key={ymd}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <div className="sm:w-40 flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{DAY_LABELS[idx]}</p>
                        <p className="text-xs text-gray-400">{fmtDM(d)}</p>
                      </div>
                      <div className="flex-1">
                        {canEdit ? (
                          <SelectBox<number>
                            label=""
                            value={selections[ymd] ?? 0}
                            options={shiftOptions}
                            onChange={(v) => setSelections((prev) => ({ ...prev, [ymd]: v }))}
                            placeholder="Chọn ca..."
                            searchable
                            portal
                          />
                        ) : (
                          <span className="text-sm text-gray-700">
                            {shiftOptions.find((o) => o.value === (selections[ymd] ?? 0))?.label ||
                              'Nghỉ'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              {canEdit && (
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu nháp'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                  >
                    {saving ? 'Đang gửi...' : 'Gửi duyệt'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShiftRegistration;
