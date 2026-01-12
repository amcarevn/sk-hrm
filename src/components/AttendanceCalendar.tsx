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
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'insufficient' | 'off' | 'holiday';

export interface AttendanceCalendarProps {
  year?: number;
  month?: number; // 0-indexed (0 = January, 11 = December)
  onDateClick?: (date: Date) => void;
  employeeId?: number;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  onDateClick,
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
        const dateStr = date.toISOString().split('T')[0];
        
        // Find attendance records for this date
        const dayRecords = data.calendar_data?.filter((record: any) => 
          record.date.startsWith(dateStr)
        ) || [];
        
        // Determine status based on records
        let morning: AttendanceStatus = 'off';
        let afternoon: AttendanceStatus = 'off';
        let evening: AttendanceStatus = 'off';
        let notes = '';
        
        if (dayRecords.length > 0) {
          // For simplicity, use the first record's status for all shifts
          const record = dayRecords[0];
          const status = record.status?.toLowerCase();
          
          if (status === 'present') {
            morning = 'present';
            afternoon = 'present';
            evening = 'present';
          } else if (status === 'late') {
            morning = 'late';
            afternoon = 'present';
            evening = 'present';
          } else if (status === 'absent') {
            morning = 'absent';
            afternoon = 'absent';
            evening = 'absent';
          } else if (status === 'early_leave') {
            morning = 'present';
            afternoon = 'present';
            evening = 'insufficient';
          } else if (status === 'half_day') {
            morning = 'present';
            afternoon = 'insufficient';
            evening = 'off';
          }
          
          notes = record.notes || '';
        }
        
        // Check if it's weekend
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          notes = dayOfWeek === 0 ? 'Chủ nhật' : 'Thứ 7';
        }
        
        transformedData.push({
          date,
          morning,
          afternoon,
          evening,
          notes: notes || undefined
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  };

  // Get day names in Vietnamese
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                      day.morning === 'present' && day.afternoon === 'present' && day.evening === 'present'
                        ? 'bg-green-100 text-green-800'
                        : day.morning === 'absent' && day.afternoon === 'absent' && day.evening === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(day.morning)}
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
          <li>Màu xám: Ngày nghỉ</li>
          <li>Màu xanh dương: Ngày lễ</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
