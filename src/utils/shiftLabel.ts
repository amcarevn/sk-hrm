/**
 * Nhãn hiển thị ca làm khi nhân viên chọn ca (đăng ký ca tuần, đơn đổi ca).
 *
 * Trước đây chỉ hiện "tên (giờ vào–giờ ra)" nên D13 (ca gãy khối kinh doanh,
 * 09:00–12:00 + 17h30–23h online, tính cả ngày) trông y hệt M12 (ca sáng
 * 09:00–12:00) — NV chọn nhầm D13 khi chỉ làm buổi sáng và được tính thừa
 * 0.5 công (case SK00015 6/9/2026). Giờ kèm loại ca + mô tả cấu hình của ca.
 */

const SHIFT_TYPE_LABELS: Record<string, string> = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  FULL_DAY: 'Cả ngày',
};

type ShiftLike = {
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  shift_type?: string | null;
  description?: string | null;
};

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** Mô tả ca trên 1 dòng (cấu hình có thể xuống dòng), rỗng nếu ca không có mô tả. */
export const shiftNote = (s: ShiftLike): string =>
  (s.description || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(', ');

export const shiftOptionLabel = (s: ShiftLike): string => {
  const parts = [`${s.name} (${hhmm(s.start_time)}–${hhmm(s.end_time)})`];
  const type = s.shift_type ? SHIFT_TYPE_LABELS[s.shift_type] : '';
  if (type) parts.push(type);
  const note = shiftNote(s);
  if (note) parts.push(note);
  return parts.join(' · ');
};
