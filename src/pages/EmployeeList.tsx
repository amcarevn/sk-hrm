import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesAPI, departmentsAPI, Employee, sendAccountEmailsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    probation: 0,
    inactive: 0,
    male: 0,
    female: 0,
    other: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const isAdmin = user?.role === 'admin' || user?.is_super_admin === true;
  const fetchEmployees = async (search = '', status = 'all', department = 'all') => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (status !== 'all') params.employment_status = status;
      if (department !== 'all') params.department = department;
      
      const response = await employeesAPI.list(params);
      setEmployees(response.results);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhân viên');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await employeesAPI.stats();
      setStats({
        total: statsData.total,
        active: statsData.active,
        probation: statsData.probation,
        inactive: statsData.inactive,
        male: statsData.gender_stats.male,
        female: statsData.gender_stats.female,
        other: statsData.gender_stats.other
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.list();
      setDepartments(response.results || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
    fetchDepartments();
  }, []);

  // Effect for real-time search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchEmployees(searchTerm, statusFilter, departmentFilter);
    }, 300); // 300ms debounce delay

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, statusFilter, departmentFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(searchTerm, statusFilter, departmentFilter);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    // Don't call fetchEmployees here, the useEffect will handle it
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        await employeesAPI.delete(id);
        fetchEmployees(); // Refresh the list
        fetchStats(); // Refresh stats
      } catch (err: any) {
        alert('Xóa thất bại: ' + (err.message || 'Lỗi không xác định'));
      }
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await employeesAPI.activate(id);
      fetchEmployees(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (err: any) {
      alert('Kích hoạt thất bại: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await employeesAPI.deactivate(id);
      fetchEmployees(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (err: any) {
      alert('Vô hiệu hóa thất bại: ' + (err.message || 'Lỗi không xác định'));
    }
  };
  const handleSendAllEmails = async () => {
    if (!window.confirm(
      '⚠️ BẠN CÓ CHẮC CHẮN?\n\n' +
      'Hành động này sẽ:\n' +
      '✓ Reset password TẤT CẢ nhân viên đang làm việc\n' +
      '✓ Gửi email thông tin đăng nhập mới cho họ\n\n' +
      'Bạn có muốn tiếp tục?'
    )) {
      return;
    }

    try {
      const response = await sendAccountEmailsAPI.sendEmails({ send_all: true });
      
      if (response.success) {
        // Hiển thị thông báo chi tiết
        alert(
          `✅ THÀNH CÔNG!\n\n` +
          `${response.message}\n\n` +
          `📊 Thống kê:\n` +
          `- Tổng số email: ${response.total}\n` +
          `- Số password đã reset: ${response.passwords_reset}\n` +
          `- Thời gian ước tính: ${response.estimated_time}\n` +
          // `- Batch ID: ${response.batch_id}\n\n` +
          `💡 Email sẽ được gửi tự động trong background.`
        );
        
        // Optional: Poll status để hiển thị progress
        if (response.batch_id) {
          pollBatchStatus(response.batch_id);
        }
      } else {
        alert(`❌ ${response.message}`);
      }
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.message || 'Không thể gửi email'}`);
    }
  };

  // ✅ THÊM function poll status (optional)
  const pollBatchStatus = async (batchId: string) => {
    let pollCount = 0;
    const maxPolls = 30; // Poll tối đa 30 lần (5 phút nếu 10s/lần)
    
    const checkStatus = async () => {
      try {
        const status = await sendAccountEmailsAPI.checkBatchStatus(batchId);
        
        console.log(
          `📧 Email Progress [${status.status}]: ` +
          `${status.sent}/${status.total} sent ` +
          `(${status.progress_percentage}%) | ` +
          `Failed: ${status.failed} | Pending: ${status.pending}`
        );
        
        pollCount++;
        
        // Nếu chưa hoàn thành và chưa poll quá nhiều lần
        if (status.status !== 'COMPLETED' && pollCount < maxPolls) {
          setTimeout(checkStatus, 10000); // Check lại sau 10 giây
        } else if (status.status === 'COMPLETED') {
          console.log('✅ All emails sent successfully!');
          // Optional: Hiển thị notification
          if (status.sent > 0) {
            alert(
              `🎉 ĐÃ GỬI XONG TẤT CẢ EMAIL!\n\n` +
              `✓ Đã gửi: ${status.sent}/${status.total}\n` +
              `✗ Thất bại: ${status.failed}\n` +
              `📅 Hoàn thành lúc: ${new Date(status.completed_at || '').toLocaleString('vi-VN')}`
            );
          }
        }
      } catch (error) {
        console.error('Error checking batch status:', error);
      }
    };
    
    // Bắt đầu check sau 10 giây
    setTimeout(checkStatus, 10000);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đang làm việc</span>;
      case 'INACTIVE':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Đã nghỉ</span>;
      case 'PROBATION':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Thử việc</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'M': return 'Nam';
      case 'F': return 'Nữ';
      case 'O': return 'Khác';
      default: return gender;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
        <p className="text-gray-600 mt-2">
          Quản lý thông tin nhân viên, phòng ban, chức vụ và các thông tin liên quan.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Statistics Section - At the top as requested */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhân viên</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 text-sm">Tổng số</h3>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 text-sm">Đang làm việc</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.active}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 text-sm">Thử việc</h3>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.probation}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900 text-sm">Đã nghỉ</h3>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.inactive}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-900 text-sm">Nam</h3>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.male}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="font-medium text-pink-900 text-sm">Nữ</h3>
              <p className="text-2xl font-bold text-pink-700 mt-1">{stats.female}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 text-sm">Khác</h3>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.other}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm nhân viên</h3>
            {loading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Đang tìm kiếm...
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm theo mã, tên, số điện thoại
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mã NV, tên hoặc số điện thoại..."
                />
                <p className="text-xs text-gray-500 mt-1">Tìm kiếm tự động khi bạn gõ</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang làm việc</option>
                  <option value="PROBATION">Thử việc</option>
                  <option value="INACTIVE">Đã nghỉ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Danh sách nhân viên</h2>
            <p className="text-gray-500 text-sm">Tổng số: {employees.length} nhân viên</p>
          </div>
            <div className="flex space-x-2">
              {isAdmin &&(
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  onClick={handleSendAllEmails}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  📧 Gửi email cho tất cả
                </button>
              )}
              <button 
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                onClick={() => navigate('/dashboard/organization-chart')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Sơ đồ tổ chức
              </button>
              <button 
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                onClick={() => navigate('/dashboard/employees/create')}
              >
                + Thêm nhân viên
              </button>
            </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Đã xảy ra lỗi</p>
            <p className="text-gray-500 mt-1">{error}</p>
            <button 
              onClick={() => fetchEmployees()}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : employees.length === 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chức vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900">Chưa có nhân viên nào</p>
                      <p className="text-gray-500 mt-1">Bắt đầu bằng cách thêm nhân viên mới</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã NV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giới tính
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chức vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                        <div className="text-sm text-gray-500">{employee.phone_number || 'Chưa có số điện thoại'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getGenderText(employee.gender)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department?.name || 'Chưa phân phòng'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.position?.title || 'Chưa phân chức vụ'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.employment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/dashboard/employees/${employee.id}`)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
                          >
                            Sửa
                          </button>
                          {employee.employment_status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleDeactivate(employee.id)}
                              className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md hover:bg-amber-100 hover:border-amber-300 transition-colors"
                            >
                              Vô hiệu hóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(employee.id)}
                              className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
                            >
                              Kích hoạt
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
