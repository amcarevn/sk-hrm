import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { attendanceService } from '../services/attendance.service';

// Types for attendance data
export interface AttendanceDay {
  date: Date;
  day: number;
  weekday: number;
  weekday_label: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name: string | null;
  is_leave: boolean;
  day_status: string;
  status_badge: string | null;
  engine_context: {
    is_holiday: boolean;
    is_leave_day: boolean;
    is_absent: boolean;
    is_incomplete: boolean;
    work_credit: number;
    penalty_amount: number;
    overtime_hours: number;
    extra_hours: number;
    night_shift_sessions: number;
    live_sessions: number;
    late_minutes: number;
    early_leave_minutes: number;
    rules_applied: string[];
  };
  shifts: Array<{
    shift_type: string;
    shift_label: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
    status_color: string;
  }>;
  registrations: any[];
  raw_checkin_checkout?: Array<{
    check_in: string | null;
    check_out: string | null;
  }>;
  // Compatibility fields for AttendanceManagement.tsx
  approvedExplanations?: any[];
  approvedRegistrations?: any[];
  approvedLeaveRequests?: any[];
  approvedOnlineWorks?: any[];
  // UI extended fields
  dayStatusSummary?: {
    has_approved_explanation: boolean;
    has_approved_registration: boolean;
    has_approved_leave: boolean;
    has_approved_online_work: boolean;
    has_pending_request: boolean;
    summary_text: string;
    display_color: string;
  };
  // Fallback for old UI logic or specific convenience
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
  evening: AttendanceStatus;
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'incomplete_attendance'
  | 'off'
  | 'holiday'
  | 'no_data';

export interface AttendanceCalendarProps {
  year?: number;
  month?: number; // 0-indexed (0 = January, 11 = December)
  onDateClick?: (date: Date, dayData?: AttendanceDay) => void;
  onMonthChange?: (date: Date) => void;
  employeeId?: number;
  departmentId?: number;
  refreshTrigger?: number;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  onDateClick,
  onMonthChange,
  employeeId,
  departmentId,
  refreshTrigger,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(year, month, 1));
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);

  // Map API shift status string to AttendanceStatus
  const mapShiftStatus = (shift: any): AttendanceStatus => {
    if (!shift) return 'no_data';
    switch ((shift.status || '').toUpperCase()) {
      case 'PRESENT': return 'present';
      case 'ABSENT': return 'absent';
      case 'HALF_DAY': return 'present';
      case 'INCOMPLETE_ATTENDANCE': return 'incomplete_attendance';
      case 'FORGOT_CC': return 'incomplete_attendance';
      case 'LATE': return 'late';
      case 'EARLY_LEAVE': return 'late';
      case 'EMPTY': return 'no_data';
      default: return 'no_data';
    }
  };

  // Map day_status to display color
  const getDayStatusDisplayColor = (dayStatus: string): string => {
    switch (dayStatus) {
      case 'FULL': return 'green';
      case 'HALF': return 'orange';
      case 'ABSENT': return 'red';
      case 'LATE_EARLY': return 'yellow';
      case 'FORGOT_CC': return 'purple';
      case 'LEAVE': return 'gray';
      case 'HOLIDAY': return 'blue';
      default: return 'default';
    }
  };

  // Map day_status to summary badge text
  const getDayStatusSummaryText = (dayItem: any): string => {
    if (dayItem.status_badge) return dayItem.status_badge;
    switch (dayItem.day_status) {
      case 'FULL': return 'Đủ công';
      case 'HALF': return 'Nửa công';
      case 'ABSENT': return 'Vắng';
      case 'LATE_EARLY': {
        const late = dayItem.engine_context?.late_minutes || 0;
        const early = dayItem.engine_context?.early_leave_minutes || 0;
        if (late > 0 && early > 0) return 'Muộn/Sớm';
        if (late > 0) return 'Đi muộn';
        if (early > 0) return 'Về sớm';
        return 'Muộn/Sớm';
      }
      case 'FORGOT_CC': return 'Quên chấm công';
      case 'LEAVE': return 'Nghỉ phép';
      case 'HOLIDAY': return 'Lễ';
      default: return '';
    }
  };

  // Fetch calendar data from API
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // API expects 1-indexed month

      const params: any = { year, month };
      if (employeeId) params.employee_id = employeeId;
      if (departmentId) params.department_id = departmentId;

      console.log('AttendanceCalendar fetching calendar data with params:', params);

      const responseData = await attendanceService.getCalendarView(params);

      // Support new API format: { success: true, data: { calendar: [...], ... } }
      // and old format: { calendar_data: [...], ... }
      const calendarDays: any[] =
        (responseData as any)?.data?.calendar ||
        (responseData as any)?.calendar_data ||
        [];

      const transformedData: AttendanceDay[] = calendarDays.map((dayItem: any) => {
        // Parse date as local time (append T00:00:00 to avoid UTC offset shifting the day)
        const date = new Date(dayItem.date + 'T00:00:00');

        const morningShift = dayItem.shifts?.find((s: any) => s.shift_type === 'MORNING');
        const afternoonShift = dayItem.shifts?.find((s: any) => s.shift_type === 'AFTERNOON');
        const eveningShift = dayItem.shifts?.find((s: any) => s.shift_type === 'EVENING');

        // Map statuses for compatibility
        let morning = dayItem.is_holiday ? 'holiday' : mapShiftStatus(morningShift);
        let afternoon = dayItem.is_holiday ? 'holiday' : mapShiftStatus(afternoonShift);
        let evening = dayItem.is_holiday ? 'holiday' : mapShiftStatus(eveningShift);

        // If day is incomplete or has FORGOT_CC status, force absent shifts to incomplete_attendance (purple)
        const isForgotCC = dayItem.day_status === 'FORGOT_CC' || dayItem.engine_context?.is_incomplete;
        if (isForgotCC) {
          if (morning === 'absent') morning = 'incomplete_attendance';
          if (afternoon === 'absent') afternoon = 'incomplete_attendance';
          if (evening === 'absent') evening = 'incomplete_attendance';
        }

        // Process registrations for summary and compatibility
        const registrations = dayItem.registrations || [];
        const approvedExplanations = registrations
          .filter((r: any) => r.event_type === 'explanation' && r.data?.status === 'APPROVED')
          .map((r: any) => ({
            ...r.data,
            reason: r.explanation || r.data?.reason,
          }));

        const approvedRegistrations = registrations
          .filter((r: any) => ['overtime', 'extra_hours', 'night_shift', 'live'].includes(r.event_type) && r.data?.status === 'APPROVED')
          .map((r: any) => r.data);

        const onlineWorkRequests = registrations
          .filter((r: any) => r.event_type === 'online_work' && r.data?.status === 'APPROVED')
          .map((r: any) => r.data);

        const hasApprovedExplanations = approvedExplanations.length > 0;
        const hasApprovedRegistration = approvedRegistrations.length > 0;
        const hasPendingRequest = registrations.some((r: any) =>
          ['explanation', 'overtime', 'extra_hours', 'night_shift', 'live', 'online_work', 'leave'].includes(r.event_type) &&
          r.data?.status === 'PENDING'
        );
        const hasApprovedOnlineWork = onlineWorkRequests.length > 0;

        let summaryText = getDayStatusSummaryText(dayItem);
        if (isForgotCC) {
          summaryText = 'Quên chấm công';
        } else if (!summaryText && hasApprovedExplanations) {
          summaryText = approvedExplanations[0].reason || 'Có đơn đã duyệt';
        }

        // Determine display color: priority Green > Purple > others
        let displayColor = getDayStatusDisplayColor(dayItem.day_status);
        if (dayItem.engine_context?.work_credit >= 1.0) {
          displayColor = 'green';
        } else if (isForgotCC) {
          displayColor = 'purple';
        } else if (dayItem.status_badge === 'Nghỉ phép tháng') {
          displayColor = 'green';
        }

        return {
          ...dayItem, // Spread all fields from API
          date,
          morning,
          afternoon,
          evening,
          // Compatibility fields for AttendanceManagement.tsx
          approvedExplanations,
          approvedRegistrations,
          approvedLeaveRequests: dayItem.is_leave ? [{ leave: true }] : [],
          approvedOnlineWorks: onlineWorkRequests,
          dayStatusSummary: {
            has_approved_explanation: hasApprovedExplanations,
            has_approved_registration: hasApprovedRegistration,
            has_approved_leave: dayItem.is_leave || false,
            has_approved_online_work: hasApprovedOnlineWork,
            has_pending_request: hasPendingRequest,
            summary_text: summaryText,
            display_color: displayColor,
          },
        };
      });

      setAttendanceData(transformedData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, employeeId, departmentId]);

  // Navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const goToToday = () => {
    const newDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  // Get day names in Vietnamese
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Get month name in Vietnamese
  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  // Get status color
  // Fetch data when month or triggers change
  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, employeeId, departmentId, refreshTrigger]);

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'late':
        return 'bg-yellow-500';
      case 'incomplete_attendance':
        return 'bg-purple-500';
      case 'off':
        return 'bg-gray-300';
      case 'holiday':
        return 'bg-blue-300';
      case 'no_data':
        return 'bg-gray-400';
      default:
        return 'bg-gray-200';
    }
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  // Adjust for Vietnamese week (Monday first)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Create empty cells for days before the first day of month
  const emptyCells = Array.from({ length: adjustedFirstDay }, (_, i) => i);

  // Helper: Get full Vietnamese day name
  const getDayNameFull = (dayOfWeek: number): string => {
    const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return names[dayOfWeek];
  };

  // Helper: Get badge style for a day
  const getDayBadgeStyle = (day: AttendanceDay): string => {
    // Priority 1: Pending requests should be highly visible
    if (day.dayStatusSummary?.has_pending_request) {
      return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 animate-pulse font-medium';
    }

    // Priority 2: Approved requests
    if (day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration) {
      return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300 font-medium';
    }

    // Priority 3: Late/Early badge
    const late = day.engine_context?.late_minutes || 0;
    const early = day.engine_context?.early_leave_minutes || 0;
    if (late > 0 || early > 0) {
      return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300';
    }

    if (day.dayStatusSummary?.display_color === 'purple') {
      return 'bg-purple-100 text-purple-700 ring-1 ring-purple-300';
    }

    if (day.dayStatusSummary?.display_color === 'green') {
      if (day.dayStatusSummary?.has_approved_leave) {
        return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300';
      }
      return 'bg-green-100 text-green-700 ring-1 ring-green-300';
    }
    if (day.dayStatusSummary?.display_color === 'yellow') {
      return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300 animate-pulse';
    }
    if (day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration) {
      return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300';
    }
    const hasIncomplete = day.engine_context?.is_incomplete;
    if (hasIncomplete) return 'bg-purple-100 text-purple-700 ring-1 ring-purple-300';
    const allNoData = day.shifts?.every(s => s.status === 'EMPTY');
    if (allNoData) return 'bg-gray-100 text-gray-500';
    const allAbsent = day.engine_context?.is_absent;
    if (allAbsent) return 'bg-red-100 text-red-700';

    if (day.engine_context?.work_credit >= 1.0) return 'bg-green-100 text-green-700';
    if (day.engine_context?.work_credit >= 0.5) return 'bg-orange-100 text-orange-700';

    if (day.engine_context?.work_credit === 0) {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-gray-100 text-gray-500';
  };

  // Helper: Get badge text for a day
  const getDayBadgeText = (day: AttendanceDay): string => {
    if (day.dayStatusSummary?.has_pending_request) return 'Chờ duyệt';
    if (day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration) return 'Đã duyệt';
    if (day.dayStatusSummary?.summary_text) return day.dayStatusSummary.summary_text;
    const hasIncomplete = day.engine_context?.is_incomplete;
    if (hasIncomplete) return 'Quên chấm công';

    const allNoData = day.shifts?.every(s => s.status === 'EMPTY');
    if (allNoData) return 'Chưa có dữ liệu';

    const late = day.engine_context?.late_minutes || 0;
    const early = day.engine_context?.early_leave_minutes || 0;
    if (late > 0 && early > 0) return 'Đi muộn - Về sớm';
    if (late > 0) return 'Đi muộn';
    if (early > 0) return 'Về sớm';

    if (day.engine_context?.work_credit >= 1.0) return 'Đủ công';
    if (day.engine_context?.work_credit >= 0.5) return 'Nửa công';
    if (day.engine_context?.work_credit > 0) return 'Thiếu công';
    return 'Vắng mặt';
  };

  // Helper: Check if day has attendance data
  const dayHasData = (day: AttendanceDay): boolean => {
    return !day.shifts?.every(s => s.status === 'EMPTY');
  };

  // Helper: Get info box style based on penalty case
  const getInfoBoxStyle = (day: AttendanceDay): string => {
    const hasLate = Number(day.engine_context?.late_minutes) > 0;
    const hasEarly = Number(day.engine_context?.early_leave_minutes) > 0;
    if (hasLate && hasEarly) return 'bg-red-50 border-red-200';
    if (hasLate || hasEarly) return 'bg-orange-50 border-orange-200';
    return 'bg-slate-50 border-slate-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-100 rounded-lg"></div>
          <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-lg border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Tháng trước"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-900 min-w-[130px] md:min-w-[160px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Tháng sau"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium"
        >
          Hôm nay
        </button>
      </div>

      {/* Legend - compact chips */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-4 py-2.5 md:px-6 md:py-3 border-b border-gray-100 bg-gray-50/50">
        {[
          { color: 'bg-green-500', label: 'Đủ công' },
          { color: 'bg-orange-500', label: 'Nửa công' },
          { color: 'bg-red-500', label: 'Vắng' },
          { color: 'bg-yellow-500', label: 'Muộn/Sớm' },
          { color: 'bg-purple-500', label: 'Quên CC' },
          { color: 'bg-gray-300', label: 'Nghỉ' },
          { color: 'bg-blue-300', label: 'Lễ' },
          { color: 'bg-gray-400', label: 'Trống' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${item.color}`} />
            <span className="text-[10px] md:text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="p-3 md:p-5">
        {/* ===== DESKTOP: Calendar Grid (md+) ===== */}
        <div className="hidden md:block">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className={`text-center text-xs font-semibold uppercase tracking-wider py-2 rounded-lg
                  ${index >= 5 ? 'text-red-400 bg-red-50/50' : 'text-gray-400'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1.5">
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {attendanceData.map((day, index) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              const hasData = dayHasData(day);

              return (
                <div
                  key={index}
                  onClick={() => onDateClick && onDateClick(day.date, day)}
                  className={`group relative flex flex-col rounded-xl p-2 transition-all duration-200 cursor-pointer min-h-[120px]
                    hover:shadow-lg hover:-translate-y-0.5
                    ${isToday
                      ? 'ring-2 ring-primary-500 bg-primary-50/40 shadow-sm'
                      : day.dayStatusSummary?.display_color === 'green'
                        ? 'ring-2 ring-green-400 bg-green-50/30'
                        : day.dayStatusSummary?.display_color === 'purple'
                          ? 'ring-2 ring-purple-400 bg-purple-50/30'
                          : day.dayStatusSummary?.display_color === 'orange'
                            ? 'ring-2 ring-orange-300 bg-orange-50/30'
                            : day.dayStatusSummary?.display_color === 'red'
                              ? 'ring-2 ring-red-200 bg-red-50/30'
                              : day.dayStatusSummary?.display_color === 'blue'
                                ? 'ring-2 ring-blue-300 bg-blue-50/30'
                                : day.dayStatusSummary?.display_color === 'yellow'
                                  ? 'ring-2 ring-yellow-300 bg-yellow-50/30'
                                  : 'border border-gray-200 bg-gray-50/50'}
                  `}
                >
                  {/* Date + work coefficient */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-sm font-bold leading-none
                        ${isToday
                          ? 'bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                          : isWeekend ? 'text-red-500' : 'text-gray-800'}`}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.engine_context?.work_credit !== undefined && day.engine_context.work_credit > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md shadow-sm">
                        {day.engine_context.work_credit} công
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <>
                      {/* Shift rows - static Morning, Afternoon, Evening distributed by time */}
                      <div className="space-y-1 mb-1.5">
                        {(() => {
                          const morningInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };
                          const afternoonInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };
                          const eveningInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };

                          day.raw_checkin_checkout?.forEach(raw => {
                            if (raw.check_in) {
                              const hour = parseInt(raw.check_in.split(':')[0]);
                              if (hour < 12) {
                                morningInfo.in = raw.check_in.substring(0, 5);
                                morningInfo.hasIn = true;
                              } else if (hour < 18) {
                                afternoonInfo.in = raw.check_in.substring(0, 5);
                                afternoonInfo.hasIn = true;
                              } else {
                                eveningInfo.in = raw.check_in.substring(0, 5);
                                eveningInfo.hasIn = true;
                              }
                            }
                            if (raw.check_out) {
                              const hour = parseInt(raw.check_out.split(':')[0]);
                              if (hour < 13) {
                                morningInfo.out = raw.check_out.substring(0, 5);
                                morningInfo.hasOut = true;
                              } else if (hour < 19) {
                                afternoonInfo.out = raw.check_out.substring(0, 5);
                                afternoonInfo.hasOut = true;
                              } else {
                                eveningInfo.out = raw.check_out.substring(0, 5);
                                eveningInfo.hasOut = true;
                              }
                            }
                          });

                          return [
                            { key: 'MORNING', label: 'Sáng', status: day.morning, info: morningInfo },
                            { key: 'AFTERNOON', label: 'Chiều', status: day.afternoon, info: afternoonInfo },
                            { key: 'EVENING', label: 'Tối', status: day.evening, info: eveningInfo },
                          ].map((shift) => (
                            <div key={shift.key} className="flex items-center justify-between min-h-[16px]">
                              <div className="flex items-center gap-1 overflow-hidden">
                                <div className={`w-2 h-2 shrink-0 rounded-full ${getStatusColor(shift.status)}`} />
                                <span className="text-[10px] text-gray-500 truncate">{shift.label}</span>
                              </div>
                              <div className="flex gap-1 shrink-0 items-center">
                                {shift.info.hasIn && (
                                  <span className="text-[10px] font-mono text-gray-700 font-bold">
                                    {shift.info.in}
                                  </span>
                                )}
                                {shift.info.hasIn && shift.info.hasOut && (
                                  <span className="text-[9px] text-gray-300">|</span>
                                )}
                                {shift.info.hasOut && (
                                  <span className="text-[10px] font-mono text-gray-700 font-bold">
                                    {shift.info.out}
                                  </span>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Penalty info - only show when has issues */}
                      {(Number(day.engine_context?.late_minutes) > 0 || Number(day.engine_context?.early_leave_minutes) > 0) && (
                        <div className={`p-1.5 rounded-lg border text-[9px] space-y-0.5 ${getInfoBoxStyle(day)}`}>
                          {Number(day.engine_context.late_minutes) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-600">Đi muộn</span>
                              <span className="font-bold text-orange-700">{day.engine_context.late_minutes} phút</span>
                            </div>
                          )}
                          {Number(day.engine_context.early_leave_minutes) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-600">Về sớm</span>
                              <span className="font-bold text-orange-700">{day.engine_context.early_leave_minutes} phút</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Status badge - always at bottom */}
                  <div className="mt-auto pt-1.5">
                    <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-center truncate ${getDayBadgeStyle(day)}`}>
                      {getDayBadgeText(day)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== MOBILE: List View (<md) ===== */}
        <div className="md:hidden space-y-1">
          {attendanceData.map((day, index) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
            const hasData = dayHasData(day);

            return (
              <div
                key={index}
                onClick={() => onDateClick && onDateClick(day.date, day)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all
                  ${isToday
                    ? 'ring-2 ring-primary-500 bg-primary-50/50 shadow-sm'
                    : day.dayStatusSummary?.display_color === 'green'
                      ? 'ring-1 ring-green-300 bg-green-50/30'
                      : day.dayStatusSummary?.display_color === 'purple'
                        ? 'ring-1 ring-purple-300 bg-purple-50/30'
                        : 'border border-gray-100 bg-gray-50/50 hover:bg-gray-50 active:bg-gray-100'}`}
              >
                {/* Date block */}
                <div
                  className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0
                    ${isToday
                      ? 'bg-primary-500 text-white'
                      : isWeekend
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-700'}`}
                >
                  <span className="text-sm font-bold leading-none">{day.date.getDate()}</span>
                  <span className="text-[8px] leading-none mt-0.5 opacity-70">
                    {getDayNameFull(day.date.getDay())}
                  </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  {hasData ? (
                    <div className="space-y-1">
                      {(() => {
                        const morningInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };
                        const afternoonInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };
                        const eveningInfo = { in: '--:--', out: '--:--', hasIn: false, hasOut: false };

                        day.raw_checkin_checkout?.forEach(raw => {
                          if (raw.check_in) {
                            const hour = parseInt(raw.check_in.split(':')[0]);
                            if (hour < 12) {
                              morningInfo.in = raw.check_in.substring(0, 5);
                              morningInfo.hasIn = true;
                            } else if (hour < 18) {
                              afternoonInfo.in = raw.check_in.substring(0, 5);
                              afternoonInfo.hasIn = true;
                            } else {
                              eveningInfo.in = raw.check_in.substring(0, 5);
                              eveningInfo.hasIn = true;
                            }
                          }
                          if (raw.check_out) {
                            const hour = parseInt(raw.check_out.split(':')[0]);
                            if (hour < 13) {
                              morningInfo.out = raw.check_out.substring(0, 5);
                              morningInfo.hasOut = true;
                            } else if (hour < 19) {
                              afternoonInfo.out = raw.check_out.substring(0, 5);
                              afternoonInfo.hasOut = true;
                            } else {
                              eveningInfo.out = raw.check_out.substring(0, 5);
                              eveningInfo.hasOut = true;
                            }
                          }
                        });

                        return [
                          { key: 'MORNING', label: 'Sáng', status: day.morning, info: morningInfo },
                          { key: 'AFTERNOON', label: 'Chiều', status: day.afternoon, info: afternoonInfo },
                          { key: 'EVENING', label: 'Tối', status: day.evening, info: eveningInfo },
                        ].map((shift) => (
                          <div key={shift.key} className="flex items-center gap-2 min-h-[18px]">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(shift.status)}`} />
                            <span className="text-xs text-gray-500 w-12">{shift.label}:</span>
                            <div className="flex items-center gap-1.5 min-w-[70px]">
                              {shift.info.hasIn && (
                                <span className="text-xs font-mono font-bold text-gray-700">
                                  {shift.info.in}
                                </span>
                              )}
                              {shift.info.hasIn && shift.info.hasOut && (
                                <span className="text-xs text-gray-300">-</span>
                              )}
                              {shift.info.hasOut && (
                                <span className="text-xs font-mono font-bold text-gray-700">
                                  {shift.info.out}
                                </span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                      {(Number(day.engine_context?.late_minutes) > 0 || Number(day.engine_context?.early_leave_minutes) > 0) && (
                        <div className="text-[10px] text-orange-600 mt-0.5">
                          {Number(day.engine_context.late_minutes) > 0 && `Đi muộn ${day.engine_context.late_minutes} phút`}
                          {Number(day.engine_context.late_minutes) > 0 && Number(day.engine_context.early_leave_minutes) > 0 && ' · '}
                          {Number(day.engine_context.early_leave_minutes) > 0 && `Về sớm ${day.engine_context.early_leave_minutes} phút`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`text-[11px] ${day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration ? 'text-blue-600' : 'text-gray-400'}`}>
                      {day.dayStatusSummary?.summary_text || 'Chưa có dữ liệu'}
                    </span>
                  )}
                </div>

                {/* Work coefficient */}
                {day.engine_context?.work_credit !== undefined && day.engine_context.work_credit > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 shadow-sm">
                    {day.engine_context.work_credit} công
                  </span>
                )}

                {/* Badge */}
                <div className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${getDayBadgeStyle(day)}`}>
                  {getDayBadgeText(day)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
