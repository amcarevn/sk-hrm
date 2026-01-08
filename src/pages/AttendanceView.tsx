import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { 
  XMarkIcon, 
  CalendarIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { employeesAPI, departmentsAPI } from '../utils/api';
import axios from 'axios';

interface Employee {
  id: number;
  full_name: string;
  employee_id: string;
  department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  status_display: string;
  shift_type: string;
  shift_type_display: string;
  working_hours: number;
  notes: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
}

const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  // Fetch employees and departments on component mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // Fetch attendance data when filters change
  useEffect(() => {
    if (selectedEmployee || selectedDepartment) {
      fetchAttendanceData();
      fetchCalendarData();
    }
  }, [selectedEmployee, selectedDepartment]);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.list();
      setEmployees(response.results || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.list();
      setDepartments(response.results || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Create axios instance with auth token
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = "https://beautycare-uat.amcare.vn";
      
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      const params = new URLSearchParams();
      if (selectedEmployee) params.append('employee_id', selectedEmployee.toString());
      if (selectedDepartment) params.append('department_id', selectedDepartment.toString());
      
      // Get current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      params.append('start_date', startDate.toISOString().split('T')[0]);
      params.append('end_date', endDate.toISOString().split('T')[0]);

      // Fetch attendance records
      const attendanceResponse = await axiosInstance.get(`/api-hrm/attendance/?${params}`);
      setAttendanceRecords(attendanceResponse.data.results || attendanceResponse.data);

      // Fetch statistics
      const statsResponse = await axiosInstance.get(`/api-hrm/attendance/stats/?${params}`);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Fallback to mock data if API is not available
      const mockAttendanceRecords: AttendanceRecord[] = [
        {
          id: 1,
          attendance_date: '2026-01-09',
          check_in: '08:00',
          check_out: '17:30',
          status: 'PRESENT',
          status_display: 'Đủ công',
          shift_type: 'FULL_DAY',
          shift_type_display: 'Cả ngày',
          working_hours: 8.5,
          notes: '',
          employee_name: 'Nguyễn Văn A',
          employee_code: 'NV001',
          department_name: 'IT - Công nghệ thông tin'
        },
        {
          id: 2,
          attendance_date: '2026-01-08',
          check_in: '08:15',
          check_out: '17:45',
          status: 'LATE',
          status_display: 'Đi muộn',
          shift_type: 'FULL_DAY',
          shift_type_display: 'Cả ngày',
          working_hours: 8.5,
          notes: 'Vào muộn 15 phút',
          employee_name: 'Nguyễn Văn A',
          employee_code: 'NV001',
          department_name: 'IT - Công nghệ thông tin'
        },
        {
          id: 3,
          attendance_date: '2026-01-07',
          check_in: '08:00',
          check_out: '17:00',
          status: 'PRESENT',
          status_display: 'Đủ công',
          shift_type: 'FULL_DAY',
          shift_type_display: 'Cả ngày',
          working_hours: 8.0,
          notes: '',
          employee_name: 'Nguyễn Văn A',
          employee_code: 'NV001',
          department_name: 'IT - Công nghệ thông tin'
        }
      ];
      
      setAttendanceRecords(mockAttendanceRecords);

      // Mock statistics
      const mockStats = {
        statistics: {
          status_summary: {
            PRESENT: 2,
            LATE: 1,
            ABSENT: 0,
            EARLY_LEAVE: 0,
            HALF_DAY: 0
          },
          total_working_hours: 25.0
        }
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      // Create axios instance with auth token
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = "https://beautycare-uat.amcare.vn";
      
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      const params = new URLSearchParams();
      if (selectedEmployee) params.append('employee_id', selectedEmployee.toString());
      if (selectedDepartment) params.append('department_id', selectedDepartment.toString());
      
      const today = new Date();
      params.append('year', today.getFullYear().toString());
      params.append('month', (today.getMonth() + 1).toString());

      const response = await axiosInstance.get(`/api-hrm/attendance/calendar_view/?${params}`);
      setCalendarData(response.data.calendar_data || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      // Fallback to mock data
      const mockCalendarData = [
        {
          date: '2026-01-09',
          status: 'PRESENT',
          status_display: 'Đủ công'
        },
        {
          date: '2026-01-08',
          status: 'LATE',
          status_display: 'Đi muộn'
        },
        {
          date: '2026-01-07',
          status: 'PRESENT',
          status_display: 'Đủ công'
        }
      ];
      setCalendarData(mockCalendarData);
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEmployee(value ? parseInt(value) : null);
    if (value) {
      setSelectedDepartment(null); // Clear department if employee is selected
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDepartment(value ? parseInt(value) : null);
    if (value) {
      setSelectedEmployee(null); // Clear employee if department is selected
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // In a real implementation, you would fetch attendance details for this date
    console.log('Selected date:', date);
  };

  const handleClearFilters = () => {
    setSelectedEmployee(null);
    setSelectedDepartment(null);
    setAttendanceRecords([]);
    setStats(null);
    setCalendarData([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'EARLY_LEAVE': return 'bg-orange-100 text-orange-800';
      case 'HALF_DAY': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSelectedEmployeeName = () => {
    if (!selectedEmployee) return '';
    const employee = employees.find(emp => emp.id === selectedEmployee);
    return employee ? employee.full_name : '';
  };

  const getSelectedDepartmentName = () => {
    if (!selectedDepartment) return '';
    const department = departments.find(dept => dept.id === selectedDepartment);
    return department ? department.name : '';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Xem chấm công</h1>
        <p className="text-gray-600 mt-2">
          Xem và lọc chấm công theo nhân viên hoặc phòng ban
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {showFilters ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Ẩn bộ lọc
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                Hiện bộ lọc
              </>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Filter */}
            <div>
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Lọc theo nhân viên
                </div>
              </label>
              <select
                id="employee"
                value={selectedEmployee || ''}
                onChange={handleEmployeeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_id} - {employee.full_name}
                    {employee.department && ` (${employee.department.name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Lọc theo phòng ban
                </div>
              </label>
              <select
                id="department"
                value={selectedDepartment || ''}
                onChange={handleDepartmentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.code} - {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Selected Filters Display */}
        {(selectedEmployee || selectedDepartment) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-blue-900">Bộ lọc đang áp dụng:</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEmployee && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Nhân viên: {getSelectedEmployeeName()}
                    </span>
                  )}
                  {selectedDepartment && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      Phòng ban: {getSelectedDepartmentName()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-1">Hướng dẫn:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chọn nhân viên để xem chấm công của nhân viên đó</li>
            <li>Chọn phòng ban để xem chấm công của toàn bộ phòng ban</li>
            <li>Chỉ có thể chọn một trong hai: nhân viên HOẶC phòng ban</li>
            <li>Dữ liệu sẽ tự động cập nhật khi thay đổi bộ lọc</li>
          </ul>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Statistics Section */}
      {stats && !loading && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê chấm công</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 text-sm">Ngày có mặt</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {stats.statistics.status_summary?.PRESENT || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 text-sm">Ngày đi muộn</h3>
              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {stats.statistics.status_summary?.LATE || 0}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900 text-sm">Ngày vắng mặt</h3>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {stats.statistics.status_summary?.ABSENT || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 text-sm">Tổng giờ làm</h3>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {stats.statistics.total_working_hours?.toFixed(1) || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {calendarData.length > 0 && !loading && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lịch chấm công</h2>
            <div className="text-sm text-gray-600">
              <CalendarIcon className="h-5 w-5 inline mr-1" />
              Tháng hiện tại
            </div>
          </div>
          <AttendanceCalendar 
            onDateClick={handleDateClick}
            employeeId={selectedEmployee || undefined}
          />
        </div>
      )}

      {/* Attendance Records Table */}
      {attendanceRecords.length > 0 && !loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết chấm công</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedEmployee ? `Nhân viên: ${getSelectedEmployeeName()}` : ''}
              {selectedDepartment ? `Phòng ban: ${getSelectedDepartmentName()}` : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ ra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.attendance_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.employee_name} ({record.employee_code})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.department_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.check_in || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.check_out || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.working_hours.toFixed(1)} giờ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination would go here in a real implementation */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{attendanceRecords.length}</span> bản ghi
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Trước
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !selectedEmployee && !selectedDepartment && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn bộ lọc</h3>
          <p className="text-gray-600 mb-4">
            Vui lòng chọn nhân viên hoặc phòng ban để xem chấm công
          </p>
        </div>
      )}

      {!loading && (selectedEmployee || selectedDepartment) && attendanceRecords.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu chấm công</h3>
          <p className="text-gray-600">
            Không tìm thấy bản ghi chấm công nào cho bộ lọc đã chọn
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
