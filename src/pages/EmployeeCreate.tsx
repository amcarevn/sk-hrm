import React, { useState, useEffect } from 'react';
import { employeesAPI, departmentsAPI, positionsAPI, EmployeeCreateData } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EmployeeCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<EmployeeCreateData>({
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
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    position_id: undefined,
    department_id: undefined,
    manager_id: undefined,
  });

  useEffect(() => {
    loadDepartments();
    loadPositions();
  }, []);

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
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.full_name || !formData.username || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const employeeData: EmployeeCreateData = {
        employee_id: formData.employee_id.trim(),
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        username: formData.username.trim(),
        password: formData.password,
        employment_status: formData.employment_status,
        ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
        ...(formData.phone_number && { phone_number: formData.phone_number.trim() }),
        ...(formData.personal_email && { personal_email: formData.personal_email.trim() }),
        ...(formData.email && { email: formData.email.trim() }),
        ...(formData.first_name && { first_name: formData.first_name.trim() }),
        ...(formData.last_name && { last_name: formData.last_name.trim() }),
        ...(formData.bank_name && { bank_name: formData.bank_name.trim() }),
        ...(formData.bank_account && { bank_account: formData.bank_account.trim() }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
        ...(formData.position_id && { position_id: Number(formData.position_id) }),
        ...(formData.department_id && { department_id: Number(formData.department_id) }),
        ...(formData.manager_id && { manager_id: Number(formData.manager_id) }),
      };

      await employeesAPI.create(employeeData);
      
      setSuccess('Tạo nhân viên thành công!');
      
      setTimeout(() => {
        navigate('/dashboard/employees');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create employee:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi tạo nhân viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/employees')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
        >
          ← Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
        <p className="text-gray-600 mt-2">Tạo hồ sơ nhân viên mới</p>
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
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
                <option value="O">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
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
                value={formData.phone_number}
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
                value={formData.personal_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="nguyenvana"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (tài khoản)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="employee@company.com"
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
                value={formData.start_date}
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
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/employees')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeCreate;
