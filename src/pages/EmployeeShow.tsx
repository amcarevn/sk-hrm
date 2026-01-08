import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesAPI, Employee } from '../utils/api';

const EmployeeShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEmployee(parseInt(id));
    }
  }, [id]);

  const loadEmployee = async (employeeId: number) => {
    try {
      setLoading(true);
      const data = await employeesAPI.getById(employeeId);
      setEmployee(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhân viên');
      console.error('Error loading employee:', err);
    } finally {
      setLoading(false);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Đang làm việc';
      case 'INACTIVE': return 'Đã nghỉ';
      case 'PROBATION': return 'Thử việc';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'PROBATION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin nhân viên...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Đã xảy ra lỗi</p>
          <p className="text-gray-500 mt-1">{error || 'Không tìm thấy nhân viên'}</p>
          <button 
            onClick={() => navigate('/dashboard/employees')}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/employees')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
        >
          ← Quay lại danh sách
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
            <p className="text-gray-600 mt-2">Mã nhân viên: {employee.employee_id}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sửa thông tin
            </button>
            <button
              onClick={() => navigate('/dashboard/employees')}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Danh sách nhân viên
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mã nhân viên</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.employee_id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Họ tên</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.full_name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Giới tính</h3>
                <p className="mt-1 text-sm text-gray-900">{getGenderText(employee.gender)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ngày sinh</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Số điện thoại</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.phone_number || 'Chưa cập nhật'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email cá nhân</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.personal_email || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Trạng thái làm việc</h3>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.employment_status)}`}>
                  {getStatusText(employee.employment_status)}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ngày bắt đầu</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {employee.start_date ? new Date(employee.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ngày kết thúc</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {employee.end_date ? new Date(employee.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phòng ban</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.department?.name || 'Chưa phân phòng'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Chức vụ</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.position?.title || 'Chưa phân chức vụ'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Người quản lý</h3>
                <p className="mt-1 text-sm text-gray-900">{employee.manager?.full_name || 'Chưa có'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Thông tin ngân hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tên ngân hàng</h4>
                <p className="mt-1 text-sm text-gray-900">{employee.bank_name || 'Chưa cập nhật'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Số tài khoản</h4>
                <p className="mt-1 text-sm text-gray-900">{employee.bank_account || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Thông tin tài khoản hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tên đăng nhập</h4>
                <p className="mt-1 text-sm text-gray-900">{employee.user?.username || 'Chưa có tài khoản'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                <p className="mt-1 text-sm text-gray-900">{employee.user?.email || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Ngày tạo: {new Date(employee.created_at).toLocaleDateString('vi-VN')}
              {employee.updated_at !== employee.created_at && (
                <span className="ml-4">
                  Cập nhật lần cuối: {new Date(employee.updated_at).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Sửa thông tin
              </button>
              <button
                onClick={() => navigate('/dashboard/employees')}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeShow;
