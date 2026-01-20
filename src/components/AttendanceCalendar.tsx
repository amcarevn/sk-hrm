import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { attendanceService } from '../services/attendance.service';

// Types for attendance data
export interface AttendanceDay {
  date: Date;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
  evening: AttendanceStatus;
  notes?: string;
  workCoefficient?: number;
  appliedRules?: any[];
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'insufficient' | 'off' | 'holiday' | 'no_data';

export interface AttendanceCalendarProps {
  year?: number;
  month?: number; // 0-indexed (0 = January, 11 = December)
  onDateClick?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  employeeId?: number;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  onDateClick,
  onMonthChange,
  employeeId
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
      
      const data = await attendanceService.getCalendarView({
        year,
        month,
        employee_id: employeeId
      });
      
        // Transform API data to our local format
        const daysInMonth = new Date(year, month, 0).getDate();
        const transformedData: AttendanceDay[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day);
          // Format date as YYYY-MM-DD in local timezone (not UTC)
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Find attendance records for this date
          const dayRecords = data.calendar_data?.filter((record: any) => 
            record.date === dateStr
          ) || [];
          
          // Find records for each shift type
          const morningRecord = dayRecords.find((record: any) => 
            record.shift_type === 'MORNING' || record.shift_type === 'FULL_DAY'
          );
          const afternoonRecord = dayRecords.find((record: any) => 
            record.shift_type === 'AFTERNOON' || record.shift_type === 'FULL_DAY'
          );
          const eveningRecord = dayRecords.find((record: any) => 
            record.shift_type === 'EVENING'
          );
          
          // Determine status for each shift
          let morning: AttendanceStatus = 'off';
          let afternoon: AttendanceStatus = 'off';
          let evening: AttendanceStatus = 'off';
          let notes = '';
          let workCoefficient = 1.0;
          let appliedRules: any[] = [];
          
          if (dayRecords.length > 0) {
            // Use the first record for work coefficient and applied rules (if available)
            const firstRecord = dayRecords[0];
            workCoefficient = firstRecord.work_coefficient || 0.0;
            appliedRules = firstRecord.applied_rules || [];
            
            // Helper function to determine status for a record
            const getStatusForRecord = (record: any, shift: 'morning' | 'afternoon' | 'evening'): AttendanceStatus => {
              if (!record) return 'no_data';
              
              const status = record.status?.toLowerCase();
              const hasCheckIn = record.check_in && record.check_in !== null && record.check_in !== '';
              const hasCheckOut = record.check_out && record.check_out !== null && record.check_out !== '';
              const workingHours = record.working_hours || 0;
              
              // If there's a record but no check_in and no check_out, it's absent (red color)
              if (!hasCheckIn && !hasCheckOut) {
                return 'absent';
              }
              
              const hasValidAttendanceData = hasCheckIn && hasCheckOut && workingHours > 0;
              
              if (!hasValidAttendanceData) {
                return 'no_data';
              }
              
              // Handle HALF_DAY status for FULL_DAY shift type
              if (record.shift_type === 'FULL_DAY' && status === 'half_day') {
                // For HALF_DAY status, determine which half was worked based on check_out time
                // If check_out is around noon or earlier, assume morning shift was worked
                // If check_in is around noon or later, assume afternoon shift was worked
                const checkOutTime = record.check_out ? record.check_out.substring(0, 5) : ''; // HH:MM
                const checkInTime = record.check_in ? record.check_in.substring(0, 5) : ''; // HH:MM
                
                // Default: assume morning was worked if we can't determine
                const workedMorning = !checkOutTime || checkOutTime <= '12:00' || (checkInTime && checkInTime < '12:00');
                
                if (shift === 'morning') {
                  return workedMorning ? 'present' : 'no_data';
                } else if (shift === 'afternoon') {
                  return workedMorning ? 'no_data' : 'present';
                } else if (shift === 'evening') {
                  // Evening is always no_data for HALF_DAY
                  return 'no_data';
                }
              }
              
              if (status === 'late' || status === 'LATE') {
                return 'late';
              } else if (status === 'early_leave' || status === 'EARLY_LEAVE') {
                return 'insufficient';
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
            if (firstRecord.early_leave_minutes && firstRecord.early_leave_minutes > 0) {
              if (notes) {
                notes += ` | Về sớm: ${firstRecord.early_leave_minutes} phút`;
              } else {
                notes = `Về sớm: ${firstRecord.early_leave_minutes} phút`;
              }
            }
            
            // Check for incomplete data notes - only set if we don't already have notes
            if (morning === 'no_data' && afternoon === 'no_data' && evening === 'no_data' && !notes) {
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
            notes: notes || undefined,
            workCoefficient,
            appliedRules
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
      const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'insufficient', 'off', 'holiday'];
      const randomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];
      
      data.push({
        date,
        morning: randomStatus(),
        afternoon: randomStatus(),
        evening: randomStatus(),
        notes: day % 7 === 0 ? 'Chủ nhật' : day % 5 === 0 ? 'Nghỉ lễ' : undefined
      });
    }
    
    setAttendanceData(data);
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, employeeId]);

  // Navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const goToToday = () => {
    const newDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    setCurrentDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  // Get day names in Vietnamese
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Get month name in Vietnamese
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Get status color
  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'insufficient': return 'bg-purple-500';
      case 'off': return 'bg-gray-300';
      case 'holiday': return 'bg-blue-300';
      case 'no_data': return 'bg-gray-400';
      default: return 'bg-gray-200';
    }
  };

  // Get status text
  const getStatusText = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present': return 'Đủ công';
      case 'absent': return 'Không có công';
      case 'late': return 'Đi muộn';
      case 'insufficient': return 'Thiếu công';
      case 'off': return 'Nghỉ';
      case 'holiday': return 'Lễ';
      case 'no_data': return 'Chưa có dữ liệu';
      default: return '';
    }
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
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
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-700">Đủ công</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm text-gray-700">Không có công</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm text-gray-700">Đi muộn</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
          <span className="text-sm text-gray-700">Thiếu công</span>
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
              const isToday = day.date.toDateString() === new Date().toDateString();
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              
              return (
                <div
                  key={index}
                  onClick={() => onDateClick && onDateClick(day.date)}
                  className={`h-32 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    isToday ? 'border-2 border-primary-500' : 'border-gray-200'
                  } ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
                >
                  {/* Date header */}
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium ${
                      isToday ? 'text-primary-600' : 
                      isWeekend ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {day.notes && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                        {day.notes}
                      </span>
                    )}
                  </div>

                  {/* Shift indicators */}
                  <div className="space-y-1">
                    {/* Morning shift */}
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(day.morning)} mr-1`}></div>
                      <span className="text-xs text-gray-600">Sáng</span>
                    </div>
                    
                    {/* Afternoon shift */}
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(day.afternoon)} mr-1`}></div>
                      <span className="text-xs text-gray-600">Chiều</span>
                    </div>
                    
                    {/* Evening shift */}
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(day.evening)} mr-1`}></div>
                      <span className="text-xs text-gray-600">Tối</span>
                    </div>
                  </div>

                  {/* Status summary */}
                  <div className="mt-2">
                    <div className={`text-xs px-2 py-1 rounded-full text-center ${
                      day.morning === 'no_data' && day.afternoon === 'no_data' && day.evening === 'no_data'
                        ? 'bg-gray-200 text-gray-700'
                        : day.workCoefficient && day.workCoefficient >= 1.0
                        ? 'bg-green-100 text-green-800'
                        : day.workCoefficient && day.workCoefficient === 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {day.morning === 'no_data' && day.afternoon === 'no_data' && day.evening === 'no_data'
                        ? getStatusText('no_data')
                        : day.workCoefficient && day.workCoefficient >= 1.0 
                        ? getStatusText('present')
                        : day.workCoefficient && day.workCoefficient >= 0.5
                        ? 'Nửa công'
                        : day.workCoefficient && day.workCoefficient > 0
                        ? getStatusText('insufficient')
                        : getStatusText('absent')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 text-sm">Ngày đủ công</h3>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {attendanceData.filter(d => 
              d.morning === 'present' && d.afternoon === 'present' && d.evening === 'present'
            ).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-medium text-red-900 text-sm">Ngày không có công</h3>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {attendanceData.filter(d => 
              d.morning === 'absent' && d.afternoon === 'absent' && d.evening === 'absent'
            ).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-900 text-sm">Ngày đi muộn</h3>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {attendanceData.filter(d => 
              d.morning === 'late' || d.afternoon === 'late' || d.evening === 'late'
            ).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-900 text-sm">Ngày thiếu công</h3>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {attendanceData.filter(d => 
              d.morning === 'insufficient' || d.afternoon === 'insufficient' || d.evening === 'insufficient'
            ).length}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium mb-1">Hướng dẫn:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click vào ngày để xem chi tiết chấm công</li>
          <li>Màu xanh lá: Đủ công cả 3 ca (sáng, chiều, tối)</li>
          <li>Màu đỏ: Không có công ở tất cả các ca</li>
          <li>Màu vàng: Có ít nhất 1 ca đi muộn</li>
          <li>Màu tím: Có ít nhất 1 ca thiếu công</li>
          <li>Màu xám nhạt: Ngày nghỉ</li>
          <li>Màu xanh dương: Ngày lễ</li>
          <li>Màu xám đậm: Chưa có dữ liệu chấm công</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
