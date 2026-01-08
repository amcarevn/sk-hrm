import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { rolesAPI, permissionsAPI, Permission } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const RoleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isSystem: false,
    permissions: [] as string[],
  });

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const permissionsData = await permissionsAPI.list();
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setError('Lỗi khi tải danh sách quyền hạn');
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tên vai trò là bắt buộc';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tên vai trò phải có ít nhất 2 ký tự';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tên vai trò không được vượt quá 100 ký tự';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePermissionChange = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter((p) => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: permissions.map((p) => p.name),
    }));
  };

  const handleClearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isSystem: formData.isSystem,
        permissions: formData.permissions,
      };

      await rolesAPI.create(roleData);

      setSuccess('Tạo vai trò thành công!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/roles');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create role:', err);
      setError(err.response?.data?.message || 'Lỗi khi tạo vai trò');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionDisplayName = (permission: Permission) => {
    const resourceMap: { [key: string]: string } = {
      user: 'Người dùng',
      role: 'Vai trò',
      chatbot: 'Chatbot',
      document: 'Tài liệu',
      conversation: 'Cuộc hội thoại',
      apikey: 'API Key',
      facebook: 'Facebook',
      dashboard: 'Dashboard',
      analytics: 'Phân tích',
      system: 'Hệ thống',
    };

    const actionMap: { [key: string]: string } = {
      read: 'Xem',
      create: 'Tạo',
      update: 'Cập nhật',
      delete: 'Xóa',
      manage: 'Quản lý',
    };

    const resource = resourceMap[permission.resource] || permission.resource;
    const action = actionMap[permission.action] || permission.action;

    return `${action} ${resource}`;
  };

  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: { [key: string]: Permission[] } = {};

    permissions.forEach((permission) => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });

    return grouped;
  };

  const groupedPermissions = groupPermissionsByResource(permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/roles')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Quay lại
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tạo vai trò mới
              </h1>
              <p className="mt-2 text-gray-600">
                Tạo vai trò mới và phân quyền cho hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Thành công
                </h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên vai trò <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên vai trò"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập mô tả vai trò (tùy chọn)"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isSystem"
                      checked={formData.isSystem}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Vai trò hệ thống (không thể xóa)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Quyền hạn</h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllPermissions}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(
                  ([resource, resourcePermissions]) => (
                    <div
                      key={resource}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
                        {resource === 'user'
                          ? 'Người dùng'
                          : resource === 'role'
                            ? 'Vai trò'
                            : resource === 'chatbot'
                              ? 'Chatbot'
                              : resource === 'document'
                                ? 'Tài liệu'
                                : resource === 'conversation'
                                  ? 'Cuộc hội thoại'
                                  : resource === 'apikey'
                                    ? 'API Key'
                                    : resource === 'facebook'
                                      ? 'Facebook'
                                      : resource === 'dashboard'
                                        ? 'Dashboard'
                                        : resource === 'analytics'
                                          ? 'Phân tích'
                                          : resource === 'system'
                                            ? 'Hệ thống'
                                            : resource}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {resourcePermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(
                                permission.name
                              )}
                              onChange={() =>
                                handlePermissionChange(permission.name)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {getPermissionDisplayName(permission)}
                            </span>
                            {permission.description && (
                              <span className="ml-2 text-xs text-gray-500">
                                - {permission.description}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {formData.permissions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Đã chọn <strong>{formData.permissions.length}</strong> quyền
                    hạn
                  </p>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/roles')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                {loading ? 'Đang tạo...' : 'Tạo vai trò'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleCreate;
