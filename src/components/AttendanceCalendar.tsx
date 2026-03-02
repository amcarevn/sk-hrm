import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { attendanceService } from '../services/attendance.service';

// Types for attendance data
export interface AttendanceDay {
  date: Date;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
  evening: AttendanceStatus;
  firstCheckIn?: string; // Check-in đầu tiên của ngày
  lastCheckOut?: string; // Check-out cuối cùng của ngày
  notes?: string;
  workCoefficient?: number;
  appliedRules?: any[];
  lateMinutes?: number; // Số phút đi muộn
  earlyLeaveMinutes?: number; // Số phút về sớm
  // Thông tin đơn đã duyệt
  approvedExplanations?: any[];
  approvedRegistrations?: any[];
  approvedLeaveRequests?: any[];
  approvedOnlineWorks?: any[];
  penalty?: number;
  dayStatusSummary?: {
    has_approved_explanation: boolean;
    has_approved_registration: boolean;
    has_approved_leave: boolean;
    has_approved_online_work: boolean;
    has_pending_request: boolean;
    summary_text: string;
    display_color: string;
  };
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
      case 'LATE_EARLY': return 'Muộn/Sớm';
      case 'FORGOT_CC': return 'Quên CC';
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

        let morning: AttendanceStatus;
        let afternoon: AttendanceStatus;
        let evening: AttendanceStatus;

        if (dayItem.is_holiday) {
          morning = 'holiday';
          afternoon = 'holiday';
          evening = 'holiday';
        } else {
          morning = mapShiftStatus(morningShift);
          afternoon = mapShiftStatus(afternoonShift);
          evening = mapShiftStatus(eveningShift);
        }

        // Extract check-in / check-out times from shifts
        const allCheckIns: string[] = [];
        const allCheckOuts: string[] = [];
        (dayItem.shifts || []).forEach((shift: any) => {
          if (shift.check_in) allCheckIns.push(shift.check_in.substring(0, 5));
          if (shift.check_out) allCheckOuts.push(shift.check_out.substring(0, 5));
        });

        const firstCheckIn = allCheckIns.length > 0 ? allCheckIns.sort()[0] : undefined;
        const lastCheckOut = allCheckOuts.length > 0 ? allCheckOuts.sort().reverse()[0] : undefined;

        // Work coefficient based on day_status
        let workCoefficient = 0;
        switch (dayItem.day_status) {
          case 'FULL': workCoefficient = 1.0; break;
          case 'HALF': workCoefficient = 0.5; break;
          case 'LATE_EARLY': workCoefficient = 1.0; break;
          case 'FORGOT_CC': workCoefficient = 0; break;
          default: workCoefficient = 0;
        }

        const isLeave = dayItem.is_leave || false;

        // Process registrations to extract approved explanations
        const registrations = dayItem.registrations || [];
        const approvedExplanationItems = registrations
          .filter((r: any) => r.event_type === 'explanation' && r.data?.status === 'APPROVED')
          .map((r: any) => ({
            request_code: r.data?.request_code,
            original_status: r.data?.original_status,
            expected_status: r.data?.expected_status,
            approved_by_name: r.data?.approved_by_name || r.data?.hr_approved_by_name,
            approved_at: r.data?.approved_at || r.data?.hr_approved_at,
            reason: r.explanation || r.data?.reason,
          }));
        const hasApprovedExplanations = approvedExplanationItems.length > 0;

        // For EMPTY days with approved registrations, use the registration reason as summary text
        let summaryText = getDayStatusSummaryText(dayItem);
        if (!summaryText && hasApprovedExplanations) {
          summaryText = approvedExplanationItems[0].reason || 'Có đơn đã duyệt';
        }

        return {
          date,
          morning,
          afternoon,
          evening,
          firstCheckIn,
          lastCheckOut,
          notes: dayItem.status_badge || undefined,
          workCoefficient,
          appliedRules: [],
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          approvedExplanations: approvedExplanationItems,
          approvedRegistrations: [],
          approvedLeaveRequests: isLeave ? [{ leave: true }] : [],
          approvedOnlineWorks: [],
          penalty: 0,
          dayStatusSummary: {
            has_approved_explanation: hasApprovedExplanations,
            has_approved_registration: false,
            has_approved_leave: isLeave,
            has_approved_online_work: false,
            has_pending_request: false,
            summary_text: summaryText,
            display_color: getDayStatusDisplayColor(dayItem.day_status),
          },
        };
      });

      setAttendanceData(transformedData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      // Fallback to mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data as fallback
  const generateMockData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get days in month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Generate mock data
    const data: AttendanceDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      // Generate random attendance status for demo
      const statuses: AttendanceStatus[] = [
        'present',
        'absent',
        'late',
        'incomplete_attendance',
        'off',
        'holiday',
      ];
      const randomStatus = () =>
        statuses[Math.floor(Math.random() * statuses.length)];

      // Generate random check-in/check-out times for demo (only for present/late/incomplete_attendance statuses)
      let firstCheckIn: string | undefined = undefined;
      let lastCheckOut: string | undefined = undefined;

      const status = randomStatus();
      if (
        status === 'present' ||
        status === 'late' ||
        status === 'incomplete_attendance'
      ) {
        const randomHourIn = Math.floor(Math.random() * 3) + 7;
        const randomMinuteIn = Math.floor(Math.random() * 60);
        const randomHourOut = Math.floor(Math.random() * 3) + 16;
        const randomMinuteOut = Math.floor(Math.random() * 60);

        firstCheckIn = `${String(randomHourIn).padStart(2, '0')}:${String(randomMinuteIn).padStart(2, '0')}`;
        lastCheckOut = `${String(randomHourOut).padStart(2, '0')}:${String(randomMinuteOut).padStart(2, '0')}`;
      }

      data.push({
        date,
        morning: randomStatus(),
        afternoon: randomStatus(),
        evening: randomStatus(),
        firstCheckIn,
        lastCheckOut,
        penalty: 0,
        notes:
          day % 7 === 0 ? 'Chủ nhật' : day % 5 === 0 ? 'Nghỉ lễ' : undefined,
      });
    }

    setAttendanceData(data);
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
    if (day.dayStatusSummary?.display_color === 'green') {
      return 'bg-green-100 text-green-700 ring-1 ring-green-300';
    }
    if (day.dayStatusSummary?.display_color === 'yellow') {
      return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300 animate-pulse';
    }
    if (day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration) {
      return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300';
    }
    const hasIncomplete = day.morning === 'incomplete_attendance' || day.afternoon === 'incomplete_attendance' || day.evening === 'incomplete_attendance';
    if (hasIncomplete) return 'bg-purple-100 text-purple-700';
    const allNoData = day.morning === 'no_data' && day.afternoon === 'no_data' && day.evening === 'no_data';
    if (allNoData) return 'bg-gray-100 text-gray-500';
    const allAbsent = day.morning === 'absent' && day.afternoon === 'absent' && day.evening === 'absent';
    if (allAbsent) return 'bg-red-100 text-red-700';
    if ((day.lateMinutes && day.lateMinutes > 0) || (day.earlyLeaveMinutes && day.earlyLeaveMinutes > 0)) {
      return 'bg-yellow-100 text-yellow-700';
    }
    if (day.workCoefficient && day.workCoefficient >= 1.0) return 'bg-green-100 text-green-700';
    if (day.workCoefficient && day.workCoefficient >= 0.5) return 'bg-orange-100 text-orange-700';
    if (day.workCoefficient === 0 || day.morning === 'absent' || day.afternoon === 'absent' || day.evening === 'absent') {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-gray-100 text-gray-500';
  };

  // Helper: Get badge text for a day
  const getDayBadgeText = (day: AttendanceDay): string => {
    if (day.dayStatusSummary?.summary_text) return day.dayStatusSummary.summary_text;
    const hasIncomplete = day.morning === 'incomplete_attendance' || day.afternoon === 'incomplete_attendance' || day.evening === 'incomplete_attendance';
    if (hasIncomplete) return 'Quên chấm công';
    const allNoData = day.morning === 'no_data' && day.afternoon === 'no_data' && day.evening === 'no_data';
    if (allNoData) return 'Chưa có dữ liệu';
    const hasLate = day.lateMinutes && day.lateMinutes > 0;
    const hasEarly = day.earlyLeaveMinutes && day.earlyLeaveMinutes > 0;
    if (hasLate && hasEarly) return 'Đi muộn - Về sớm';
    if (hasLate) return 'Đi muộn';
    if (hasEarly) return 'Về sớm';
    if (day.workCoefficient && day.workCoefficient >= 1.0) return 'Đủ công';
    if (day.workCoefficient && day.workCoefficient >= 0.5) return 'Nửa công';
    if (day.workCoefficient && day.workCoefficient > 0) return 'Thiếu công';
    return 'Vắng mặt';
  };

  // Helper: Check if day has attendance data
  const dayHasData = (day: AttendanceDay): boolean => {
    return !(day.morning === 'no_data' && day.afternoon === 'no_data' && day.evening === 'no_data');
  };

  // Helper: Get info box style based on penalty case
  const getInfoBoxStyle = (day: AttendanceDay): string => {
    const hasLate = Number(day.lateMinutes) > 0;
    const hasEarly = Number(day.earlyLeaveMinutes) > 0;
    if (hasLate && hasEarly) return 'bg-red-50 border-red-200';
    if (hasLate || hasEarly) return 'bg-orange-50 border-orange-200';
    return 'bg-slate-50 border-slate-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
                  className={`group relative flex flex-col rounded-xl p-2 transition-all duration-200 cursor-pointer
                    hover:shadow-lg hover:-translate-y-0.5
                    ${isToday
                      ? 'ring-2 ring-primary-500 bg-primary-50/40 shadow-sm'
                      : day.dayStatusSummary?.display_color === 'green'
                        ? 'ring-2 ring-green-400 bg-green-50/30'
                        : 'border border-gray-200 hover:border-gray-300'}
                    ${isWeekend && !isToday && day.dayStatusSummary?.display_color !== 'green'
                      ? 'bg-gray-50/80'
                      : !isToday && day.dayStatusSummary?.display_color !== 'green'
                        ? 'bg-white' : ''}`}
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
                    {hasData && day.workCoefficient !== undefined && day.workCoefficient > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                        {day.workCoefficient}
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <>
                      {/* Shift rows - vertical with check-in/out times */}
                      <div className="space-y-1 mb-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(day.morning)}`} />
                            <span className="text-[10px] text-gray-500">Sáng</span>
                          </div>
                          {day.firstCheckIn && (
                            <span className="text-[10px] font-medium text-gray-600 font-mono">{day.firstCheckIn}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(day.afternoon)}`} />
                            <span className="text-[10px] text-gray-500">Chiều</span>
                          </div>
                          {day.lastCheckOut && (
                            <span className="text-[10px] font-medium text-gray-600 font-mono">{day.lastCheckOut}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(day.evening)}`} />
                            <span className="text-[10px] text-gray-500">Tối</span>
                          </div>
                        </div>
                      </div>

                      {/* Penalty info - only show when has issues */}
                      {(Number(day.lateMinutes) > 0 || Number(day.earlyLeaveMinutes) > 0) && (
                        <div className={`p-1.5 rounded-lg border text-[9px] space-y-0.5 ${getInfoBoxStyle(day)}`}>
                          {Number(day.lateMinutes) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-600">Muộn</span>
                              <span className="font-bold text-orange-700">{day.lateMinutes} phút</span>
                            </div>
                          )}
                          {Number(day.earlyLeaveMinutes) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-orange-600">Sớm</span>
                              <span className="font-bold text-orange-700">{day.earlyLeaveMinutes} phút</span>
                            </div>
                          )}
                          {Number(day.penalty) > 0 && (
                            <div className="flex justify-between border-t border-red-200/50 pt-0.5">
                              <span className="text-red-600 font-medium">Phạt</span>
                              <span className="font-bold text-red-700">{(day.penalty || 0).toLocaleString('vi-VN')}đ</span>
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
                      : 'border border-gray-100 hover:bg-gray-50 active:bg-gray-100'}`}
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
                    <>
                      {(day.firstCheckIn || day.lastCheckOut) && (
                        <div className="text-xs text-gray-700 font-mono font-medium">
                          {day.firstCheckIn || '--:--'} &rarr; {day.lastCheckOut || '--:--'}
                        </div>
                      )}
                      {(Number(day.lateMinutes) > 0 || Number(day.earlyLeaveMinutes) > 0) && (
                        <div className="text-[10px] text-orange-600 mt-0.5">
                          {Number(day.lateMinutes) > 0 && `Muộn ${day.lateMinutes}p`}
                          {Number(day.lateMinutes) > 0 && Number(day.earlyLeaveMinutes) > 0 && ' · '}
                          {Number(day.earlyLeaveMinutes) > 0 && `Sớm ${day.earlyLeaveMinutes}p`}
                          {Number(day.penalty) > 0 && (
                            <span className="text-red-600 font-medium"> · -{(day.penalty || 0).toLocaleString('vi-VN')}đ</span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={`text-[11px] ${day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration ? 'text-blue-600' : 'text-gray-400'}`}>
                      {day.dayStatusSummary?.has_approved_explanation || day.dayStatusSummary?.has_approved_registration
                        ? day.approvedExplanations?.[0]?.reason || 'Có đơn đã duyệt'
                        : 'Chưa có dữ liệu'}
                    </span>
                  )}
                </div>

                {/* Work coefficient */}
                {hasData && day.workCoefficient !== undefined && day.workCoefficient > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                    {day.workCoefficient}
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
