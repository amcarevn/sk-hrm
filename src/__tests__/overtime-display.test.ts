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
 *
 * Bug 2026-09-30 (TA00289, 3/9/2026, báo lại lần 2 sau fix trên): ngày có
 * NHIỀU đơn Tăng ca đã duyệt cùng lúc — 1 đơn "khớp" checkout muộn (0.5 giờ)
 * + 1 đơn khác không liên quan checkout ("Trực trưa 1 tiếng") — nên
 * auto_overtime_hours=0.5 (chỉ phần khớp checkout) nhưng overtime_hours
 * (tang_ca, tổng thật đã cộng của CẢ 2 đơn) = 1.5. Logic cũ ưu tiên autoHours
 * bất cứ khi nào > 0 nên chỉ hiện 0.5, thiếu mất 1 giờ của đơn "Trực trưa".
 * Fix: phải ưu tiên realHours (tổng thật) khi > 0, chỉ dùng autoHours làm
 * fallback khi realHours = 0 (case SK00507 ở trên).
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helper copy từ AttendanceCalendar.tsx (card compact, sau fix 2026-09-30)
// ---------------------------------------------------------------------------

interface EngineContext {
  auto_overtime_hours?: number;
  overtime_hours?: number;
  auto_overtime_minutes?: number;
}

const getOvertimeBadge = (
  engineContext: EngineContext | undefined
): { hours: number; isExactCheckoutMatch: boolean } | null => {
  const autoHours = Number(engineContext?.auto_overtime_hours) || 0;
  const realHours = Number(engineContext?.overtime_hours) || 0;
  const displayHours = realHours > 0 ? realHours : autoHours;
  if (displayHours <= 0) return null;
  return { hours: displayHours, isExactCheckoutMatch: autoHours > 0 && autoHours === realHours };
};

describe('getOvertimeBadge (card lịch chấm công)', () => {
  it('case bình thường: checkout muộn tự phát hiện, khớp đúng 1 đơn đã duyệt', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 1.0, overtime_hours: 1.0, auto_overtime_minutes: 63 });
    expect(badge).toEqual({ hours: 1.0, isExactCheckoutMatch: true });
  });

  it('bug SK00507 16/9: auto=0 nhưng overtime_hours=1.5 (đơn tăng ca duyệt tay, không khớp checkout muộn) vẫn phải hiện', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0.0, overtime_hours: 1.5, auto_overtime_minutes: 0 });
    expect(badge).toEqual({ hours: 1.5, isExactCheckoutMatch: false });
  });

  it('bug TA00289 3/9 (2 đơn cùng ngày): auto=0.5 (khớp checkout) nhưng overtime_hours=1.5 (cộng thêm đơn Trực trưa 1h) → phải hiện TỔNG 1.5, không phải 0.5', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0.5, overtime_hours: 1.5, auto_overtime_minutes: 33 });
    expect(badge).toEqual({ hours: 1.5, isExactCheckoutMatch: false });
  });

  it('cả hai đều 0 → không hiện badge', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0, overtime_hours: 0 });
    expect(badge).toBeNull();
  });

  it('engine_context undefined → không hiện badge, không throw', () => {
    const badge = getOvertimeBadge(undefined);
    expect(badge).toBeNull();
  });

  it('auto_overtime_hours khớp đúng overtime_hours (case thường: chỉ 1 đơn, khớp checkout)', () => {
    const badge = getOvertimeBadge({ auto_overtime_hours: 0.5, overtime_hours: 0.5 });
    expect(badge).toEqual({ hours: 0.5, isExactCheckoutMatch: true });
  });
});
