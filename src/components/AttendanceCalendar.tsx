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
  approvedLeaveRequests?: any[];
  dayStatusSummary?: {
    has_approved_explanation: boolean;
    has_approved_leave: boolean;
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
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  onDateClick,
  onMonthChange,
  employeeId,
  departmentId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(year, month, 1));
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch calendar data from API
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // API expects 1-indexed month

      const params: any = {
        year,
        month,
      };

      if (employeeId) {
        params.employee_id = employeeId;
      }

      if (departmentId) {
        params.department_id = departmentId;
      }

      console.log(
        'AttendanceCalendar fetching calendar data with params:',
        params
      );

      const data = await attendanceService.getCalendarView(params);

      // Transform API data to our local format
      const daysInMonth = new Date(year, month, 0).getDate();
      const transformedData: AttendanceDay[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        // Format date as YYYY-MM-DD in local timezone (not UTC)
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Find attendance records for this date
        const dayRecords =
          data.calendar_data?.filter(
            (record: any) => record.date === dateStr
          ) || [];

        // Find records for each shift type
        const morningRecord = dayRecords.find(
          (record: any) =>
            record.shift_type === 'MORNING' || record.shift_type === 'FULL_DAY'
        );
        const afternoonRecord = dayRecords.find(
          (record: any) =>
            record.shift_type === 'AFTERNOON' ||
            record.shift_type === 'FULL_DAY'
        );
        const eveningRecord = dayRecords.find(
          (record: any) => record.shift_type === 'EVENING'
        );

        // Determine status for each shift
        let morning: AttendanceStatus = 'off';
        let afternoon: AttendanceStatus = 'off';
        let evening: AttendanceStatus = 'off';
        let firstCheckIn: string | undefined = undefined;
        let lastCheckOut: string | undefined = undefined;
        let notes = '';
        let workCoefficient = 1.0;
        let appliedRules: any[] = [];
        let lateMinutes = 0;
        let earlyLeaveMinutes = 0;
        let approvedExplanations: any[] = [];
        let approvedLeaveRequests: any[] = [];
        let dayStatusSummary = {
          has_approved_explanation: false,
          has_approved_leave: false,
          has_pending_request: false,
          summary_text: '',
          display_color: 'default',
        };

        if (dayRecords.length > 0) {
          // Use the first record for work coefficient and applied rules (if available)
          const firstRecord = dayRecords[0];
          workCoefficient = firstRecord.work_coefficient || 0.0;
          appliedRules = firstRecord.applied_rules || [];
          lateMinutes = firstRecord.late_minutes || 0;
          earlyLeaveMinutes = firstRecord.early_leave_minutes || 0;

          // Get approved requests information
          approvedExplanations =
            (firstRecord as any).approved_explanations || [];
          approvedLeaveRequests =
            (firstRecord as any).approved_leave_requests || [];
          dayStatusSummary = (firstRecord as any).day_status_summary || {
            has_approved_explanation: false,
            has_approved_leave: false,
            has_pending_request: false,
            summary_text: '',
            display_color: 'default',
          };

          // Helper function to determine status for a record
          const getStatusForRecord = (
            record: any,
            shift: 'morning' | 'afternoon' | 'evening'
          ): AttendanceStatus => {
            if (!record) return 'no_data';

            const status = record.status?.toLowerCase();
            const hasCheckIn =
              record.check_in &&
              record.check_in !== null &&
              record.check_in !== '';
            const hasCheckOut =
              record.check_out &&
              record.check_out !== null &&
              record.check_out !== '';
            const workingHours = record.working_hours || 0;

            // Handle INCOMPLETE_ATTENDANCE status (quên chấm công)
            // Xác định dựa trên thời gian của check_in:
            // - Nếu check_in >= 12:00 → Quên chấm ca sáng, value trong check_in thực ra là check_out
            // - Nếu check_in < 12:00 → Chấm ca sáng đúng, quên chấm ca chiều
            if (status === 'incomplete_attendance') {
              if (hasCheckIn && !hasCheckOut) {
                const checkInTime = record.check_in
                  ? record.check_in.substring(0, 5)
                  : ''; // HH:MM

                if (checkInTime >= '12:00') {
                  // Case 1: check_in >= 12:00 (vd: 18:24)
                  // => Quên chấm ca sáng, value trong check_in thực ra là check_out (chấm về chiều)
                  if (shift === 'morning') {
                    return 'no_data'; // Quên chấm buổi sáng
                  } else if (shift === 'afternoon') {
                    return 'incomplete_attendance'; // Có chấm về chiều (value nằm sai ở check_in)
                  } else if (shift === 'evening') {
                    return 'no_data';
                  }
                } else {
                  // Case 2: check_in < 12:00 (vd: 08:22)
                  // => Chấm ca sáng đúng, quên chấm ca chiều
                  if (shift === 'morning') {
                    return 'incomplete_attendance'; // Có chấm vào sáng
                  } else if (shift === 'afternoon') {
                    return 'no_data'; // Quên chấm về chiều
                  } else if (shift === 'evening') {
                    return 'no_data';
                  }
                }
              } else if (!hasCheckIn && hasCheckOut) {
                // check_in null, check_out có value
                // => Có chấm ca sáng, quên chấm ca chiều (hoặc ngược lại tùy thời gian)
                const checkOutTime = record.check_out
                  ? record.check_out.substring(0, 5)
                  : '';

                if (checkOutTime < '12:00') {
                  // check_out < 12:00 → thực ra là check_in sáng
                  if (shift === 'morning') {
                    return 'incomplete_attendance';
                  } else if (shift === 'afternoon') {
                    return 'no_data';
                  } else if (shift === 'evening') {
                    return 'no_data';
                  }
                } else {
                  // check_out >= 12:00 → đúng là check_out chiều
                  if (shift === 'morning') {
                    return 'no_data';
                  } else if (shift === 'afternoon') {
                    return 'incomplete_attendance';
                  } else if (shift === 'evening') {
                    return 'no_data';
                  }
                }
              }
              // Nếu cả hai đều có hoặc đều không có, vẫn trả incomplete_attendance
              return 'incomplete_attendance';
            }

            // If there's a record but no check_in and no check_out, it's absent (red color)
            if (!hasCheckIn && !hasCheckOut) {
              return 'absent';
            }

            const hasValidAttendanceData =
              hasCheckIn && hasCheckOut && workingHours > 0;

            if (!hasValidAttendanceData) {
              return 'no_data';
            }

            // Check late_minutes và early_leave_minutes để hiển thị màu vàng (đi muộn/về sớm)
            // QUAN TRỌNG: Phải check TRƯỚC logic HALF_DAY + FULL_DAY để đảm bảo hiển thị đúng màu vàng
            const lateMinutes = record.late_minutes || 0;
            const earlyLeaveMinutes = record.early_leave_minutes || 0;

            // Ca sáng: nếu có đi muộn (late_minutes > 0) → hiển thị màu vàng
            if (shift === 'morning' && lateMinutes > 0) {
              return 'late';
            }

            // Ca chiều: nếu có về sớm (early_leave_minutes > 0) → hiển thị màu vàng
            if (shift === 'afternoon' && earlyLeaveMinutes > 0) {
              return 'late';
            }

            // Handle HALF_DAY status for FULL_DAY shift type
            // Cả ca sáng và ca chiều đều hiển thị màu xanh (present)
            // Chỉ áp dụng nếu KHÔNG có đi muộn/về sớm (đã check ở trên)
            if (record.shift_type === 'FULL_DAY' && status === 'half_day') {
              if (shift === 'morning' || shift === 'afternoon') {
                return 'present'; // Cả 2 ca đều hiển thị màu xanh
              } else if (shift === 'evening') {
                return 'no_data';
              }
            }

            if (status === 'late' || status === 'LATE') {
              return 'late';
            } else if (status === 'early_leave' || status === 'EARLY_LEAVE') {
              return 'incomplete_attendance';
            } else if (status === 'absent' || status === 'ABSENT') {
              return 'absent';
            } else if (workingHours > 0) {
              return 'present';
            } else {
              return 'no_data';
            }
          };

          // Get status for each shift
          morning = getStatusForRecord(morningRecord, 'morning');
          afternoon = getStatusForRecord(afternoonRecord, 'afternoon');
          evening = getStatusForRecord(eveningRecord, 'evening');

          // Extract all check-in/check-out times for the day
          const allCheckIns: string[] = [];
          const allCheckOuts: string[] = [];

          [morningRecord, afternoonRecord, eveningRecord].forEach((record) => {
            if (!record) return;

            const recordStatus = record.status?.toLowerCase();
            const hasRecordCheckIn =
              record.check_in &&
              record.check_in !== null &&
              record.check_in !== '';
            const hasRecordCheckOut =
              record.check_out &&
              record.check_out !== null &&
              record.check_out !== '';

            // Handle INCOMPLETE_ATTENDANCE: swap check_in/check_out values based on time
            if (recordStatus === 'incomplete_attendance') {
              if (hasRecordCheckIn && !hasRecordCheckOut) {
                const checkInTime = record.check_in.substring(0, 5); // HH:MM

                if (checkInTime >= '12:00') {
                  // Case 1: check_in >= 12:00 (vd: 18:24)
                  // => Value trong check_in thực ra là check_out, swap sang allCheckOuts
                  allCheckOuts.push(checkInTime);
                } else {
                  // Case 2: check_in < 12:00 (vd: 08:22)
                  // => Value đúng là check_in, giữ nguyên
                  allCheckIns.push(checkInTime);
                }
              } else if (!hasRecordCheckIn && hasRecordCheckOut) {
                const checkOutTime = record.check_out.substring(0, 5);

                if (checkOutTime < '12:00') {
                  // check_out < 12:00 → thực ra là check_in, swap sang allCheckIns
                  allCheckIns.push(checkOutTime);
                } else {
                  // check_out >= 12:00 → đúng là check_out, giữ nguyên
                  allCheckOuts.push(checkOutTime);
                }
              } else {
                // Normal case - có cả hai hoặc không có gì
                if (hasRecordCheckIn) {
                  allCheckIns.push(record.check_in.substring(0, 5));
                }
                if (hasRecordCheckOut) {
                  allCheckOuts.push(record.check_out.substring(0, 5));
                }
              }
            } else {
              // Normal status - no swap needed
              if (hasRecordCheckIn) {
                allCheckIns.push(record.check_in.substring(0, 5));
              }
              if (hasRecordCheckOut) {
                allCheckOuts.push(record.check_out.substring(0, 5));
              }
            }
          });

          // Find first check-in (earliest time)
          if (allCheckIns.length > 0) {
            firstCheckIn = allCheckIns.sort()[0];
          }

          // Find last check-out (latest time)
          if (allCheckOuts.length > 0) {
            lastCheckOut = allCheckOuts.sort().reverse()[0];
          }

          // Build notes
          notes = firstRecord.notes || '';

          // Add late minutes to notes if applicable
          if (firstRecord.late_minutes && firstRecord.late_minutes > 0) {
            if (notes) {
              notes += ` | Đi muộn: ${firstRecord.late_minutes} phút`;
            } else {
              notes = `Đi muộn: ${firstRecord.late_minutes} phút`;
            }
          }

          // Add early leave minutes to notes if applicable
          if (
            firstRecord.early_leave_minutes &&
            firstRecord.early_leave_minutes > 0
          ) {
            if (notes) {
              notes += ` | Về sớm: ${firstRecord.early_leave_minutes} phút`;
            } else {
              notes = `Về sớm: ${firstRecord.early_leave_minutes} phút`;
            }
          }

          // Add approved requests information to notes
          // if (approvedExplanations.length > 0) {
          //   if (notes) {
          //     notes += ` | Giải trình đã duyệt: ${approvedExplanations.length}`;
          //   } else {
          //     notes = `Giải trình đã duyệt: ${approvedExplanations.length}`;
          //   }
          // }

          if (approvedLeaveRequests.length > 0) {
            if (notes) {
              notes += ` | Nghỉ phép đã duyệt: ${approvedLeaveRequests.length}`;
            } else {
              notes = `Nghỉ phép đã duyệt: ${approvedLeaveRequests.length}`;
            }
          }

          // Check for incomplete data notes - only set if we don't already have notes
          if (
            morning === 'no_data' &&
            afternoon === 'no_data' &&
            evening === 'no_data' &&
            !notes
          ) {
            notes = 'Chưa có dữ liệu';
          }

          // Add rule information to notes if available
          // if (appliedRules.length > 0) {
          //   const ruleNames = appliedRules.map((rule: any) => rule.rule_name || rule.rule_code).join(', ');
          //   if (notes) {
          //     notes += ` | Quy tắc: ${ruleNames}`;
          //   } else {
          //     notes = `Quy tắc: ${ruleNames}`;
          //   }

          //   // Add work coefficient to notes
          //   if (workCoefficient !== 1.0) {
          //     notes += ` | Hệ số: ${workCoefficient.toFixed(2)}`;
          //   }
          // }
        } else {
          // No attendance record for this day - always mark as no_data (gray color)
          morning = 'no_data';
          afternoon = 'no_data';
          evening = 'no_data';
          notes = '';
        }

        // Check if it's weekend (for existing records)
        // Removed weekend text from notes as requested
        // const dayOfWeek = date.getDay();
        // if (dayOfWeek === 0 || dayOfWeek === 6) {
        //   const weekendText = dayOfWeek === 0 ? 'Chủ nhật' : 'Thứ 7';
        //   if (!notes) {
        //     notes = weekendText;
        //   } else if (!notes.includes('Chủ nhật') && !notes.includes('Thứ 7')) {
        //     // Only add weekend text if not already present
        //     notes += ` | ${weekendText}`;
        //   }
        // }

        transformedData.push({
          date,
          morning,
          afternoon,
          evening,
          firstCheckIn,
          lastCheckOut,
          notes: notes || undefined,
          workCoefficient,
          appliedRules,
          lateMinutes,
          earlyLeaveMinutes,
          approvedExplanations,
          approvedLeaveRequests,
          dayStatusSummary,
        });
      }

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

    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get days in month
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
        // Generate random times between 7:00-9:00 for check-in and 16:00-18:00 for check-out
        const randomHourIn = Math.floor(Math.random() * 3) + 7; // 7-9
        const randomMinuteIn = Math.floor(Math.random() * 60);
        const randomHourOut = Math.floor(Math.random() * 3) + 16; // 16-18
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

  // Get status text
  const getStatusText = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present':
        return 'Đủ công';
      case 'absent':
        return 'Vắng mặt';
      case 'late':
        return 'Đi muộn - Về sớm';
      case 'incomplete_attendance':
        return 'Quên chấm công';
      case 'off':
        return 'Nghỉ';
      case 'holiday':
        return 'Lễ';
      case 'no_data':
        return 'Chưa có dữ liệu';
      default:
        return '';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Calendar header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Tháng trước"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <h2 className="text-xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Tháng sau"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Hôm nay
        </button>
      </div>

      {/* Legend */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-700">Đủ công</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
          <span className="text-sm text-gray-700">Nửa công</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm text-gray-700">Vắng mặt</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm text-gray-700">Đi muộn - Về sớm</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
          <span className="text-sm text-gray-700">Quên chấm công</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-sm text-gray-700">Nghỉ</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-300 mr-2"></div>
          <span className="text-sm text-gray-700">Ngày lễ</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-400 mr-2"></div>
          <span className="text-sm text-gray-700">Chưa có dữ liệu</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
          <span className="text-sm text-gray-700">Có đơn đã duyệt</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className="text-center font-medium text-gray-700 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="h-32"></div>
            ))}

            {/* Days of the month */}
            {attendanceData.map((day, index) => {
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isWeekend =
                day.date.getDay() === 0 || day.date.getDay() === 6;

              // Kiểm tra ngày có dữ liệu hay không
              const hasData = !(
                day.morning === 'no_data' &&
                day.afternoon === 'no_data' &&
                day.evening === 'no_data'
              );

              return (
                <div
                  key={index}
                  onClick={() => hasData && onDateClick && onDateClick(day.date, day)}
                  className={`h-32 border rounded-lg p-2 transition-all ${
                    hasData
                      ? 'cursor-pointer hover:shadow-md'
                      : 'cursor-default opacity-70'
                  } ${isToday ? 'border-2 border-primary-500' : 'border-gray-200'
                    } ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
                >
                  {/* Date header */}
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`font-medium ${isToday
                          ? 'text-primary-600'
                          : isWeekend
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}
                    >
                      {day.date.getDate()}
                    </span>
                    <div className="flex flex-col items-end">
                      {day.dayStatusSummary?.has_approved_explanation ||
                        day.dayStatusSummary?.has_approved_leave ? (
                        <span className="text-xs text-green-600 bg-green-100 px-1 rounded mb-1">
                          ✓ Đã duyệt
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Shift indicators with check-in/check-out times */}
                  <div className="space-y-1">
                    {/* Morning shift with check-in time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(day.morning)} mr-1`}
                        ></div>
                        <span className="text-xs text-gray-600">Sáng</span>
                      </div>
                      {day.firstCheckIn && (
                        <span className="text-xs font-medium text-gray-700">
                          {day.firstCheckIn}
                        </span>
                      )}
                    </div>

                    {/* Afternoon shift */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(day.afternoon)} mr-1`}
                        ></div>
                        <span className="text-xs text-gray-600">Chiều</span>
                      </div>
                      {day.lastCheckOut && (
                        <span className="text-xs font-medium text-gray-700">
                          {day.lastCheckOut}
                        </span>
                      )}
                      {/* Empty space to align with other rows */}
                    </div>

                    {/* Evening shift with check-out time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(day.evening)} mr-1`}
                        ></div>
                        <span className="text-xs text-gray-600">Tối</span>
                      </div>
                    </div>
                  </div>

                  {/* Status summary */}
                  <div className="mt-1">
                    <div
                      className={`text-xs px-2 py-1 rounded-full text-center ${day.dayStatusSummary?.display_color === 'green'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : day.morning === 'incomplete_attendance' ||
                            day.afternoon === 'incomplete_attendance' ||
                            day.evening === 'incomplete_attendance'
                            ? 'bg-purple-100 text-purple-800'
                            : day.morning === 'no_data' &&
                              day.afternoon === 'no_data' &&
                              day.evening === 'no_data'
                              ? 'bg-gray-200 text-gray-700'
                              : day.morning === 'absent' &&
                                day.afternoon === 'absent' &&
                                day.evening === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : (day.lateMinutes && day.lateMinutes > 0) ||
                                  (day.earlyLeaveMinutes && day.earlyLeaveMinutes > 0)
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : day.workCoefficient &&
                                    day.workCoefficient >= 1.0
                                    ? 'bg-green-100 text-green-800'
                                    : day.workCoefficient &&
                                      day.workCoefficient >= 0.5 &&
                                      day.workCoefficient < 1.0
                                      ? 'bg-orange-100 text-orange-800'
                                      : day.workCoefficient === 0 ||
                                        day.morning === 'absent' ||
                                        day.afternoon === 'absent' ||
                                        day.evening === 'absent'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {day.dayStatusSummary?.summary_text
                        ? day.dayStatusSummary.summary_text
                        : day.morning === 'incomplete_attendance' ||
                          day.afternoon === 'incomplete_attendance' ||
                          day.evening === 'incomplete_attendance'
                          ? getStatusText('incomplete_attendance')
                          : day.morning === 'no_data' &&
                            day.afternoon === 'no_data' &&
                            day.evening === 'no_data'
                            ? getStatusText('no_data')
                            : (day.lateMinutes && day.lateMinutes > 0) ||
                              (day.earlyLeaveMinutes && day.earlyLeaveMinutes > 0)
                              ? // Hiển thị text cụ thể: "Đi muộn", "Về sớm", hoặc "Đi muộn - Về sớm"
                                // Ca sáng bắt đầu 8h30, ca chiều kết thúc 17h30
                                (day.lateMinutes && day.lateMinutes > 0) && (day.earlyLeaveMinutes && day.earlyLeaveMinutes > 0)
                                  ? 'Đi muộn - Về sớm'
                                  : (day.lateMinutes && day.lateMinutes > 0)
                                    ? 'Đi muộn'
                                    : 'Về sớm'
                              : day.workCoefficient && day.workCoefficient >= 1.0
                                ? getStatusText('present')
                                : day.workCoefficient &&
                                  day.workCoefficient >= 0.5 &&
                                  day.workCoefficient < 1.0
                                  ? 'Nửa công'
                                  : day.workCoefficient && day.workCoefficient > 0
                                    ? getStatusText('incomplete_attendance')
                                    : getStatusText('absent')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium mb-1">Hướng dẫn:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click vào ngày có dữ liệu để xem chi tiết chấm công (ngày không có dữ liệu sẽ mờ và không thể click)</li>
          <li>Màu xanh lá: Đủ công cả 3 ca (sáng, chiều, tối)</li>
          <li>Màu cam: Nửa công (hệ số công từ 0.5 đến dưới 1.0)</li>
          <li>Màu đỏ: Không có công ở tất cả các ca</li>
          <li>Màu vàng: Có ít nhất 1 ca đi muộn</li>
          <li>Màu tím: Có ít nhất 1 ca quên chấm công</li>
          <li>Màu xám nhạt: Ngày nghỉ</li>
          <li>Màu xanh dương: Ngày lễ</li>
          <li>Màu xám đậm: Chưa có dữ liệu chấm công</li>
          <li>Viền xanh lá: Có đơn giải trình hoặc nghỉ phép đã duyệt</li>
          <li>Biểu tượng ✓: Có đơn đã được duyệt trong ngày</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
