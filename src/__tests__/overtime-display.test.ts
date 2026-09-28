/**
 * Test cho logic hiển thị badge "Tăng ca" trên AttendanceCalendar.tsx
 *
 * Bug 2026-09-28 (SK00507, 16/9/2026): NV quên chấm công (không check-in bình
 * thường) rồi tạo tay đơn Tăng ca cho khung giờ khác — không khớp pattern
 * "checkout muộn hơn giờ kết thúc ca > 30 phút" nên auto_overtime_hours = 0,
 * dù đơn đã được duyệt và overtime_hours (tang_ca thực đã cộng, xem
 * hrm/attendance_views.py engine_context.overtime_hours = agg_effects['tang_ca'])
 * = 1.5. Trước fix, card lịch chỉ check auto_overtime_hours > 0 nên không hiện
 * gì cả, khiến NV hiểu lầm tăng ca không được tính.
 *
 * Xác nhận qua gọi trực tiếp AttendanceCalendarView trên production (SK00507,
 * 16/9/2026): engine_context = { overtime_hours: 1.5, auto_overtime_hours: 0.0,
 * auto_overtime_minutes: 0 }.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helper copy từ AttendanceCalendar.tsx (card compact, sau fix 2026-09-28)
// ---------------------------------------------------------------------------

interface EngineContext {
  auto_overtime_hours?: number;
  overtime_hours?: number;
  auto_overtime_minutes?: number;
}

const getOvertimeBadge = (engineContext: EngineContext | undefined): { hours: number; isAuto: boolean } | null => {
  const autoHours = Number(engineContext?.auto_overtime_hours) || 0;
  const realHours = Number(engineContext?.overtime_hours) || 0;
  const displayHours = autoHours > 0 ? autoHours : realHours;
  if (displayHours <= 0) return null;
  return { hours: displayHours, isAuto: autoHours > 0 };
};

describe('getOvertimeBadge (card lịch chấm công)', () => {
  it('dùng auto_overtime_hours khi có (case bình thường: checkout muộn tự phát hiện)', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 1.0, overtime_hours: 1.0, auto_overtime_minutes: 63 });
    expect(badge).toEqual({ hours: 1.0, isAuto: true });
  });

  it('bug SK00507 16/9: auto=0 nhưng overtime_hours=1.5 (đơn tăng ca duyệt tay, không khớp checkout muộn) vẫn phải hiện', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0.0, overtime_hours: 1.5, auto_overtime_minutes: 0 });
    expect(badge).toEqual({ hours: 1.5, isAuto: false });
  });

  it('cả hai đều 0 → không hiện badge', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0, overtime_hours: 0 });
    expect(badge).toBeNull();
  });

  it('engine_context undefined → không hiện badge, không throw', () => {
    const badge = getOvertimeBadge(undefined);
    expect(badge).toBeNull();
  });

  it('auto_overtime_hours ưu tiên hơn overtime_hours khi cả hai đều > 0 (case thường: khớp nhau)', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0.5, overtime_hours: 0.5 });
    expect(badge).toEqual({ hours: 0.5, isAuto: true });
  });
});
