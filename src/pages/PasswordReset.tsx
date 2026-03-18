// pages/PasswordReset.tsx

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { employeesAPI, departmentsAPI, managementApi } from '../utils/api';

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  personal_email?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface FilterParams {
  employee_id: string;
  full_name: string;
  department: string;
}

export default function PasswordReset() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<FilterParams>({
    employee_id: '',
    full_name: '',
    department: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // Filter employees whenever filters change
  useEffect(() => {
    applyFilters();
  }, [filters, employees]);

  // ========================================
  // FIX: Sửa lại fetchEmployees function
  // ========================================
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      console.log('🔄 Fetching employees...');
      
      // ✅ ĐÚNG: Sử dụng employeesAPI từ utils/api.ts với endpoint /api-hrm/employees/
      const response = await employeesAPI.list({
        page_size: 1000,
      });
      
      console.log('📊 Response data:', response);
      console.log('✅ Employees loaded:', response.results);
      setEmployees(response.results);
      
    } catch (error: any) {
      console.error('❌ Error fetching employees:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setMessage({ 
        type: 'error', 
        text: `Không thể tải danh sách nhân viên: ${error.response?.data?.detail || error.message}` 
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FIX: Sửa lại fetchDepartments function
  // ========================================
  const fetchDepartments = async () => {
    try {
      console.log('🔄 Fetching departments...');
      
      // ✅ ĐÚNG: Sử dụng departmentsAPI từ utils/api.ts
      const response = await departmentsAPI.list({
        page_size: 1000
      });
      
      console.log('📊 Departments response:', response);
      console.log('✅ Departments loaded:', response.results);
      setDepartments(response.results);
      
    } catch (error: any) {
      console.error('❌ Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // ========================================
  // Apply filters to employees
  // ========================================
  const applyFilters = () => {
    let filtered = employees;

    if (filters.employee_id) {
      filtered = filtered.filter(emp =>
        emp.employee_id.toLowerCase().includes(filters.employee_id.toLowerCase())
      );
    }

    if (filters.full_name) {
      filtered = filtered.filter(emp =>
        emp.full_name?.toLowerCase().includes(filters.full_name.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(emp =>
        emp.department?.code === filters.department
      );
    }

    console.log('🔍 Filtered employees:', filtered);
    setFilteredEmployees(filtered);
    setSelectedEmployee(null);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPassword = async (employee: Employee) => {
    if (!window.confirm(`Bạn có chắc muốn reset mật khẩu cho nhân viên ${employee.full_name}?`)) {
      return;
    }

    try {
      setResetting(true);
      setMessage(null);
      
      console.log('🔄 Resetting password for employee:', employee.id);
      
      // ✅ ĐÚNG: POST /api-hrm/employees/{id}/reset-password/ (action của EmployeeViewSet)
      const response = await managementApi.post(
        `/api-hrm/employees/${employee.id}/reset-password/`,
        {}
      );

      console.log('✅ Reset password response:', response.data);

      setMessage({
        type: 'success',
        text: `✅ Đã reset mật khẩu thành công cho ${employee.full_name}. Hệ thống đã gửi email thông tin tài khoản mới.`,
      });

      // Refresh employee list
      fetchEmployees();
      setSelectedEmployee(null);

    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Lỗi khi reset mật khẩu';
      setMessage({
        type: 'error',
        text: `❌ ${errorMsg}`,
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Mật Khẩu Nhân Viên</h1>
          <p className="mt-2 text-gray-600">
            Sử dụng công cụ này để reset mật khẩu cho nhân viên quên mật khẩu. Hệ thống sẽ gửi email tài khoản mới đến nhân viên.
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Tìm kiếm nhân viên</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Employee ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã nhân viên
              </label>
              <input
                type="text"
                name="employee_id"
                value={filters.employee_id}
                onChange={handleFilterChange}
                placeholder="VD: TA00001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Full Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên
              </label>
              <input
                type="text"
                name="full_name"
                value={filters.full_name}
                onChange={handleFilterChange}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban
              </label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Tất cả phòng ban --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                setFilters({ employee_id: '', full_name: '', department: '' });
                setSelectedEmployee(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">Đang tải danh sách nhân viên...</p>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">
                  {employees.length === 0
                    ? 'Không tìm thấy nhân viên nào. Có lỗi khi tải dữ liệu.'
                    : 'Không có kết quả phù hợp với bộ lọc'}
                </p>
              </div>
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Mã NV
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map(employee => (
                    <tr
                      key={employee.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedEmployee?.id === employee.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.employee_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.personal_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleResetPassword(employee)}
                          disabled={resetting}
                          className={`inline-flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                            resetting
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          {resetting ? 'Đang xử lý...' : 'Reset'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredEmployees.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Hiển thị {filteredEmployees.length} kết quả
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Thông tin cần biết</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Mật khẩu mới sẽ được tạo ngẫu nhiên: <code className="bg-blue-100 px-2 py-1 rounded">amcare@XXXXX</code></li>
            <li>✓ Email thông tin tài khoản sẽ được gửi đến nhân viên</li>
            <li>✓ Nhân viên PHẢI đổi mật khẩu sau lần đăng nhập đầu tiên</li>
            <li>✓ Hệ thống sẽ ghi nhận lịch sử reset mật khẩu</li>
          </ul>
        </div>

        {/* Debug Info - Chỉ hiển thị khi có lỗi */}
        {employees.length === 0 && !loading && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Debug Info</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Không có dữ liệu nhân viên được tải</li>
              <li>• Vui lòng mở DevTools (F12) → Console để xem chi tiết lỗi</li>
              <li>• Kiểm tra API endpoint: /api/employees/</li>
              <li>• Kiểm tra authentication token</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}