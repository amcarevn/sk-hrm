import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeesAPI, departmentsAPI, Employee, Department } from '../utils/api';
import {
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BanknotesIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  IdentificationIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: number;
  employee_id: string;
  full_name: string;
  position_title: string;
  phone_number?: string;
  personal_email?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phone_number: '',
    personal_email: '',
    bank_name: '',
    bank_account: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch the current authenticated user's employee profile
      const emp = await employeesAPI.me();
      setEmployee(emp);
      
      // Set initial form values
      setEditForm({
        phone_number: emp.phone_number || '',
        personal_email: emp.personal_email || '',
        bank_name: emp.bank_name || '',
        bank_account: emp.bank_account || '',
      });

      // Fetch department details
      if (emp.department?.id) {
        try {
          const dept = await departmentsAPI.getById(emp.department.id);
          setDepartment(dept);
        } catch (err) {
          console.error('Error fetching department:', err);
        }
      }

      // Fetch manager details
      if (emp.manager?.id) {
        try {
          const mgr = await employeesAPI.getById(emp.manager.id);
          setManager(mgr);
        } catch (err) {
          console.error('Error fetching manager:', err);
        }
      }

      // Fetch team members (employees in same department)
      if (emp.department?.id) {
        try {
          const deptEmployees = await departmentsAPI.employees(emp.department.id, { page_size: 20 });
          const team = deptEmployees.results
            .filter(e => e.id !== emp.id)
            .map(e => ({
              id: e.id,
              employee_id: e.employee_id,
              full_name: e.full_name,
              position_title: e.position?.title || 'Chưa phân chức vụ',
              phone_number: e.phone_number,
              personal_email: e.personal_email,
            }));
          setTeamMembers(team);
        } catch (err) {
          console.error('Error fetching team members:', err);
        }
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError('Không thể tải thông tin cá nhân. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSave = async (field: string) => {
    if (!employee) return;

    try {
      const updateData: any = {};
      updateData[field] = editForm[field as keyof typeof editForm];

      await employeesAPI.partialUpdate(employee.id, updateData);
      
      // Update local employee data
      setEmployee(prev => prev ? { ...prev, ...updateData } : null);
      setEditingField(null);
      
      alert('Cập nhật thành công!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Cập nhật thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleCancel = () => {
    if (employee) {
      setEditForm({
        phone_number: employee.phone_number || '',
        personal_email: employee.personal_email || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
      });
    }
    setEditingField(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'M': return 'Nam';
      case 'F': return 'Nữ';
      case 'O': return 'Khác';
      default: return gender;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
            <button
              onClick={fetchProfileData}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy thông tin nhân viên</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vui lòng liên hệ quản trị viên để được hỗ trợ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý thông tin cá nhân và tài khoản ngân hàng
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <UserIcon className="h-4 w-4 mr-1" />
            {employee.employment_status === 'ACTIVE' ? 'Đang làm việc' : 
             employee.employment_status === 'PROBATION' ? 'Đang thử việc' : 'Đã nghỉ việc'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h2>
              <div className="flex items-center space-x-2">
                <IdentificationIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Mã NV: {employee.employee_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">{employee.full_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-900">{getGenderText(employee.gender)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {employee.date_of_birth ? formatDate(employee.date_of_birth) : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày vào làm
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {employee.start_date ? formatDate(employee.start_date) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  {editingField === 'phone_number' ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave('phone_number')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('phone_number')}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {editingField === 'phone_number' ? (
                  <input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {employee.phone_number || 'Chưa cập nhật'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email cá nhân
                  </label>
                  {editingField === 'personal_email' ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave('personal_email')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('personal_email')}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {editingField === 'personal_email' ? (
                  <input
                    type="email"
                    value={editForm.personal_email}
                    onChange={(e) => handleInputChange('personal_email', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Nhập email cá nhân"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {employee.personal_email || 'Chưa cập nhật'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bank Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Thông tin ngân hàng</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Tên ngân hàng
                  </label>
                  {editingField === 'bank_name' ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave('bank_name')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('bank_name')}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {editingField === 'bank_name' ? (
                  <input
                    type="text"
                    value={editForm.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Nhập tên ngân hàng"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {employee.bank_name || 'Chưa cập nhật'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Số tài khoản
                  </label>
                  {editingField === 'bank_account' ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave('bank_account')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('bank_account')}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {editingField === 'bank_account' ? (
                  <input
                    type="text"
                    value={editForm.bank_account}
                    onChange={(e) => handleInputChange('bank_account', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Nhập số tài khoản"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {employee.bank_account || 'Chưa cập nhật'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Department and Team Info */}
        <div className="space-y-6">
          {/* Department Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Thông tin phòng ban</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {department?.name || employee.department?.name || 'Chưa phân phòng'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã phòng ban
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-900">
                    {department?.code || employee.department?.code || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-900">
                    {department?.description || 'Không có mô tả'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Manager Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Quản lý trực tiếp</h2>
            
            {manager ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên
                  </label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manager.full_name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã nhân viên
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-900">{manager.employee_id}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chức vụ
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-900">
                      {manager.position?.title || 'Chưa phân chức vụ'}
                    </span>
                  </div>
                </div>

                {manager.phone_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{manager.phone_number}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Không có quản lý trực tiếp</p>
              </div>
            )}
          </div>

          {/* Team Members Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Thành viên trong team</h2>
              <span className="text-sm text-gray-500">{teamMembers.length} thành viên</span>
            </div>
            
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{member.full_name}</h4>
                        <p className="text-sm text-gray-500">{member.position_title}</p>
                        <p className="text-sm text-gray-500">Mã NV: {member.employee_id}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {member.phone_number && (
                        <div className="flex items-center text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          <span>{member.phone_number}</span>
                        </div>
                      )}
                      {member.personal_email && (
                        <div className="flex items-center text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          <span className="truncate">{member.personal_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {teamMembers.length > 5 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Và {teamMembers.length - 5} thành viên khác
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Không có thành viên trong team</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
