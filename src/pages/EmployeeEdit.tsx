import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesAPI, departmentsAPI, positionsAPI, EmployeeUpdateData } from '../utils/api';

const EmployeeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<EmployeeUpdateData>({
    employee_id: '',
    full_name: '',
    gender: 'M',
    date_of_birth: '',
    phone_number: '',
    personal_email: '',
    bank_name: '',
    bank_account: '',
    employment_status: 'ACTIVE',
    start_date: '',
    end_date: '',
    position_id: undefined,
    department_id: undefined,
    manager_id: undefined,
  });

  useEffect(() => {
    if (id) {
      loadEmployee(parseInt(id));
      loadDepartments();
      loadPositions();
    }
  }, [id]);

  const loadEmployee = async (employeeId: number) => {
    try {
      setLoadingEmployee(true);
      const employee = await employeesAPI.getById(employeeId);
      
      setFormData({
        employee_id: employee.employee_id || '',
        full_name: employee.full_name || '',
        gender: employee.gender || 'M',
        date_of_birth: employee.date_of_birth || '',
        phone_number: employee.phone_number || '',
        personal_email: employee.personal_email || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        employment_status: employee.employment_status || 'ACTIVE',
        start_date: employee.start_date || '',
        end_date: employee.end_date || '',
        position_id: employee.position?.id,
        department_id: employee.department?.id,
        manager_id: employee.manager?.id,
      });
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhân viên');
      console.error('Error loading employee:', err);
    } finally {
      setLoadingEmployee(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.list();
      setDepartments(response.results);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await positionsAPI.list();
      setPositions(response.results);
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.full_name) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const employeeData: EmployeeUpdateData = {
        employee_id: formData.employee_id.trim(),
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        employment_status: formData.employment_status,
        ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
        ...(formData.phone_number && { phone_number: formData.phone_number.trim() }),
        ...(formData.personal_email && { personal_email: formData.personal_email.trim() }),
        ...(formData.bank_name && { bank_name: formData.bank_name.trim() }),
        ...(formData.bank_account && { bank_account: formData.bank_account.trim() }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
        ...(formData.position_id && { position_id: Number(formData.position_id) }),
        ...(formData.department_id && { department_id: Number(formData.department_id) }),
        ...(formData.manager_id && { manager_id: Number(formData.manager_id) }),
      };

      await employeesAPI.update(parseInt(id!), employeeData);
      
      setSuccess('Cập nhật nhân viên thành công!');
      
      setTimeout(() => {
        navigate(`/dashboard/employees/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật nhân viên');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin nhân viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/dashboard/employees/${id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
        >
          ← Quay lại chi tiết
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa nhân viên</h1>
        <p className="text-gray-600 mt-2">Cập nhật thông tin nhân viên</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã nhân viên *
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NV001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ tên *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Nam</option>
                <option value="1">Nữ</option>
                <option value="2">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email cá nhân
              </label>
              <input
                type="email"
                name="personal_email"
                value={formData.personal_email || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái làm việc
              </label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Đang làm việc</option>
                <option value="PROBATION">Thử việc</option>
                <option value="INACTIVE">Đã nghỉ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban
              </label>
              <select
                name="department_id"
                value={formData.department_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chức vụ
              </label>
              <select
                name="position_id"
                value={formData.position_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn chức vụ</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên ngân hàng
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vietcombank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tài khoản
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/employees/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeEdit;
