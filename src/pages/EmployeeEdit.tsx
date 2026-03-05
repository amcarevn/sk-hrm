import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  employeesAPI,
  departmentsAPI,
  positionsAPI,
  EmployeeUpdateData,
} from '../utils/api';
import { SelectBox } from '@/components/LandingLayout/SelectBox';

const EmployeeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  console.log('EmployeeEdit:', employees);
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
    is_hr: false,
  });

  console.log('Form Data:', formData);

  useEffect(() => {
    if (id) {
      loadEmployee(parseInt(id));
      loadDepartments();
      loadPositions();
      loadEmployees();
    }
  }, [id]);

  const loadEmployee = async (employeeId: number) => {
    try {
      setLoadingEmployee(true);
      const employee = await employeesAPI.getById(employeeId);
      console.log('EmployeeEdit:', employee);
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
        manager_id:
          typeof employee.manager === 'number'
            ? employee.manager
            : employee.manager?.id,
        is_hr: employee.is_hr || false,
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

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.list({ page_size: 1000 });
      setEmployees(response.results);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        ...(formData.date_of_birth && {
          date_of_birth: formData.date_of_birth,
        }),
        ...(formData.phone_number && {
          phone_number: formData.phone_number.trim(),
        }),
        ...(formData.personal_email && {
          personal_email: formData.personal_email.trim(),
        }),
        ...(formData.bank_name && { bank_name: formData.bank_name.trim() }),
        ...(formData.bank_account && {
          bank_account: formData.bank_account.trim(),
        }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
        ...(formData.position_id && { position_id: formData.position_id }),
        ...(formData.department_id && {
          department_id: formData.department_id,
        }),
        ...(formData.manager_id !== undefined && { manager_id: formData.manager_id }),
        is_hr: formData.is_hr,
      };

      await employeesAPI.update(parseInt(id!), employeeData);

      setSuccess('Cập nhật nhân viên thành công!');

      setTimeout(() => {
        navigate(`/dashboard/employees/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Lỗi khi cập nhật nhân viên'
      );
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
      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/dashboard/employees/${id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
        >
          ← Quay lại chi tiết
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Chỉnh sửa nhân viên
        </h1>
        <p className="text-gray-600 mt-2">Cập nhật thông tin nhân viên</p>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* ===== SUCCESS ===== */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* ===== FORM CARD ===== */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ================= THÔNG TIN CÁ NHÂN ================= */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin cá nhân
            </h2>

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
                  placeholder="NV001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <SelectBox
                label="Giới tính *"
                value={formData.gender}
                placeholder="Chọn giới tính"
                options={[
                  { label: 'Nam', value: 'M' },
                  { label: 'Nữ', value: 'F' },
                  { label: 'Khác', value: 'O' },
                ]}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: value as 'M' | 'F' | 'O' | undefined,
                  }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleInputChange}
                  placeholder="1995-01-01"
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
                  placeholder="0123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="example@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ================= THÔNG TIN CÔNG VIỆC ================= */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin công việc
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectBox
                label="Trạng thái làm việc"
                value={formData.employment_status}
                placeholder="Chọn trạng thái"
                options={[
                  { label: 'Đang làm việc', value: 'ACTIVE' },
                  { label: 'Thử việc', value: 'PROBATION' },
                  { label: 'Đã nghỉ', value: 'INACTIVE' },
                ]}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    employment_status: value as
                      | 'ACTIVE'
                      | 'PROBATION'
                      | 'INACTIVE'
                      | undefined,
                  }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date || ''}
                  onChange={handleInputChange}
                  placeholder="2024-01-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                  placeholder="2025-01-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <SelectBox
                label="Phòng ban"
                value={formData.department_id}
                placeholder="Chọn phòng ban"
                options={departments.map((dept) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, department_id: value }))
                }
              />

              <SelectBox
                label="Chức vụ"
                value={formData.position_id}
                placeholder="Chọn chức vụ"
                options={positions.map((pos) => ({
                  label: pos.title,
                  value: pos.id,
                }))}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, position_id: value }))
                }
              />

              <SelectBox
                label="Quản lý trực tiếp"
                value={formData.manager_id}
                placeholder="Chọn quản lý trực tiếp"
                options={[
                  { label: 'Không có quản lý', value: null },
                  ...employees
                    .filter(
                      (emp) =>
                        emp.id !== parseInt(id!) &&
                        positions.find((p) => p.id === emp.position?.id)
                          ?.is_management === true
                    )
                    .map((emp) => ({
                      label: `${emp.full_name} (${emp.employee_id}) - ${emp.department?.name ?? 'Chưa có phòng ban'}`,
                      value: emp.id,
                    })),
                ]}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, manager_id: value ?? undefined }))
                }
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 border rounded-lg p-4 bg-gray-50">
            <label className="flex gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={formData.is_hr}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_hr: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="font-medium">Nhân viên HR</p>
                <p className="text-xs text-gray-500">
                  Nhân viên HR có quyền duyệt đơn, truy cập vào các chức năng
                  quản lý nhân sự
                </p>
              </div>
            </label>
          </div>

          {/* ================= THÔNG TIN TÀI KHOẢN / NGÂN HÀNG ================= */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin tài khoản / ngân hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleInputChange}
                  placeholder="Vietcombank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ================= ACTION BUTTONS ================= */}
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
