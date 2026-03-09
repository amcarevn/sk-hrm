import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { employeesAPI, departmentsAPI } from '../utils/api';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  BellAlertIcon,
  DocumentTextIcon,
  ScaleIcon,
  DocumentDuplicateIcon,
  CogIcon,
  ArrowRightIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';

const formatBirthDate = (dateOfBirth: string): string => {
  const parts = dateOfBirth.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateOfBirth;
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [birthdayEmployees, setBirthdayEmployees] = useState<Array<{
    employee_id: number;
    full_name: string;
    date_of_birth: string;
    department: { id: number; name: string; code: string } | null;
  }>>([]);
  const [tomorrowBirthdayEmployees, setTomorrowBirthdayEmployees] = useState<Array<{
    employee_id: number;
    full_name: string;
    date_of_birth: string;
    department: { id: number; name: string; code: string } | null;
  }>>([]);

  useEffect(() => {
    fetchEmployeeData();
    fetchBirthdaysToday();
    fetchBirthdaysTomorrow();
  }, []);

  const fetchBirthdaysToday = async () => {
    try {
      const data = await employeesAPI.birthdays_today();
      setBirthdayEmployees(data);
    } catch (err) {
      console.error('Error fetching birthdays:', err);
    }
  };

  const fetchBirthdaysTomorrow = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowStr = `${year}-${month}-${day}`;
      const data = await employeesAPI.birthdays_today(tomorrowStr);
      setTomorrowBirthdayEmployees(data);
    } catch (err) {
      console.error('Error fetching tomorrow birthdays:', err);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const emp = await employeesAPI.me();
      setEmployee(emp);
      
      if (emp.department?.id) {
        try {
          const dept = await departmentsAPI.getById(emp.department.id);
          setDepartment(dept);
        } catch (err) {
          console.error('Error fetching department:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate working days based on start date
  const calculateWorkingDays = () => {
    if (!employee?.start_date) return 0;
    
    const startDate = new Date(employee.start_date);
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const userStats = [
    { label: 'Ngày làm việc', value: employee ? calculateWorkingDays().toString() : '0', change: '', icon: CalendarIcon, color: 'bg-blue-100 text-blue-600' },
    { label: 'Điểm danh', value: '0%', change: '', icon: ClockIcon, color: 'bg-green-100 text-green-600' },
    { label: 'Thông báo', value: '0', change: '', icon: BellAlertIcon, color: 'bg-yellow-100 text-yellow-600' },
  ];

  const quickActions = [
    { title: 'Xin nghỉ phép', description: 'Đăng ký nghỉ phép năm, nghỉ ốm', icon: CalendarIcon, color: 'bg-blue-50 text-blue-700', path: '/dashboard/approvals' },
    { title: 'Báo cáo công việc', description: 'Gửi báo cáo tuần/tháng', icon: DocumentTextIcon, color: 'bg-green-50 text-green-700', path: '/company/internal-forms' },
    { title: 'Đề xuất', description: 'Đề xuất công tác, mua sắm', icon: ScaleIcon, color: 'bg-yellow-50 text-yellow-700', path: '/dashboard/approvals' },
    { title: 'Đào tạo', description: 'Đăng ký khóa đào tạo', icon: UserGroupIcon, color: 'bg-purple-50 text-purple-700', path: '/company/training' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chào mừng trở lại, {user?.username || 'Nhân viên'}!</h1>
            <p className="mt-2 text-primary-100">
              Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Mã NV: {user?.username || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                <span>Phòng: {loading ? 'Đang tải...' : (department?.name || employee?.department?.name || 'Chưa phân phòng')}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <button
              onClick={() => navigate('/dashboard/me')}
              className="inline-flex items-center px-6 py-3 border-2 border-white text-sm font-medium rounded-lg text-white hover:bg-white hover:text-primary-700 transition-colors"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Xem hồ sơ cá nhân
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <span className="ml-2 text-sm font-medium text-green-600">{stat.change}</span>
                </div>
              </div>
              <div className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Birthday Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <CakeIcon className="h-6 w-6 text-pink-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">🎂 Chúc mừng sinh nhật</h2>
        </div>
        {birthdayEmployees.length === 0 ? (
          <p className="text-sm text-gray-500">Hôm nay không có nhân viên nào có sinh nhật.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdayEmployees.map((emp) => (
              <div key={emp.employee_id} className="flex items-center space-x-4 p-4 bg-pink-50 border border-pink-200 rounded-xl">
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎉</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{emp.full_name}</p>
                  {emp.department && (
                    <p className="text-sm text-gray-500">{emp.department.name}</p>
                  )}
                  <p className="text-xs text-pink-600 mt-1">
                    {formatBirthDate(emp.date_of_birth)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tomorrow's Birthdays */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <CakeIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-500">Sinh nhật ngày mai</h3>
          </div>
          {tomorrowBirthdayEmployees.length === 0 ? (
            <p className="text-sm text-gray-400">Ngày mai không có nhân viên nào có sinh nhật.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tomorrowBirthdayEmployees.map((emp) => (
                <div key={emp.employee_id} className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎂</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">{emp.full_name}</p>
                    {emp.department && (
                      <p className="text-sm text-gray-400">{emp.department.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatBirthDate(emp.date_of_birth)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Thao tác nhanh</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
          >
            Xem Dashboard <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className={`h-12 w-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-gray-900 text-center">{action.title}</h3>
              <p className="text-sm text-gray-500 text-center mt-2">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Company Information Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Thông tin công ty</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tài liệu đào tạo, thông báo, quyết định, nội quy lao động và các thông tin nội bộ
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Nội bộ công ty</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Training Documents Button */}
          <button
            onClick={() => navigate('/company/training')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-center">Tài liệu đào tạo hội nhập</h3>
            <p className="text-sm text-gray-500 text-center mt-2">Tài liệu hướng dẫn và đào tạo nhân viên mới</p>
          </button>

          {/* Labor Rules Button */}
          <button
            onClick={() => navigate('/company/labor-rules')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-center">Nội quy lao động</h3>
            <p className="text-sm text-gray-500 text-center mt-2">Quy định và nội quy làm việc trong công ty</p>
          </button>

          {/* Internal Forms Button */}
          <button
            onClick={() => navigate('/company/internal-forms')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-center">Mẫu giấy tờ nội bộ</h3>
            <p className="text-sm text-gray-500 text-center mt-2">Các mẫu đơn, biểu mẫu sử dụng nội bộ</p>
          </button>

          {/* Work Procedures Button */}
          <button
            onClick={() => navigate('/company/work-procedures')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-center">Quy trình làm việc</h3>
            <p className="text-sm text-gray-500 text-center mt-2">Quy trình làm việc của các bộ phận</p>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Announcements */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Thông báo mới nhất</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Thông báo về chính sách mới</p>
                    <p className="text-xs text-gray-500 mt-1">Đăng ngày: 05/01/2026</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lịch đào tạo tháng 1</p>
                    <p className="text-xs text-gray-500 mt-1">Đăng ngày: 03/01/2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Liên kết nhanh</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/company/policies')} className="flex items-center justify-between w-full p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <span>Chính sách công ty</span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => navigate('/company/decisions')} className="flex items-center justify-between w-full p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <span>Quyết định ban hành</span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => navigate('/dashboard/organization-chart')} className="flex items-center justify-between w-full p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <span>Sơ đồ tổ chức</span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
