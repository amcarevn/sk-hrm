import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL }from '../utils/api';
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

// ============================================
// TYPE DEFINITIONS
// ============================================

type DocumentTemplate = {
  id: number;
  template_name: string;
  document_type: string;
  document_type_display: string;
  description: string;
  file: string;
  file_url?: string;
  is_required: boolean;
  requires_signature: boolean;
  is_active: boolean;
  apply_to_all_new_onboarding: boolean;
  position_count: number;
  department_count: number;
  usage_count: number;
  created_by_name: string;
  created_at: string;
};

type Position = {
  id: number;
  title: string;
  code: string;
};

type Department = {
  id: number;
  name: string;
  code: string;
};

type TemplateForm = {
  template_name: string;
  document_type: string;
  description: string;
  file: File | null;
  is_required: boolean;
  requires_signature: boolean;
  is_active: boolean;
  apply_to_all_new_onboarding: boolean;
  position_ids: number[];
  department_ids: number[];
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

const showError = (msg: string) => window.alert(msg);
const showSuccess = (msg: string) => window.alert(msg);

const getDocumentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    CONTRACT: 'bg-blue-100 text-blue-800',
    REGULATION: 'bg-purple-100 text-purple-800',
    HANDBOOK: 'bg-green-100 text-green-800',
    FORM: 'bg-yellow-100 text-yellow-800',
    TRAINING: 'bg-orange-100 text-orange-800',
    SAFETY: 'bg-red-100 text-red-800',
    POLICY: 'bg-indigo-100 text-indigo-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.OTHER;
};

// ============================================
// MAIN COMPONENT
// ============================================

const DocumentTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<TemplateForm>({
    template_name: '',
    document_type: 'OTHER',
    description: '',
    file: null,
    is_required: false,
    requires_signature: false,
    is_active: true,
    apply_to_all_new_onboarding: true,
    position_ids: [],
    department_ids: [],
  });

  // ============================================
  // API CALLS
  // ============================================

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api-hrm/onboarding-document-templates/`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to fetch templates');

      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('FETCH TEMPLATES ERROR:', error);
      showError('Không thể tải danh sách templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api-hrm/positions/`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setPositions(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('FETCH POSITIONS ERROR:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api-hrm/departments/`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('FETCH DEPARTMENTS ERROR:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchPositions();
    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (!formData.template_name.trim()) {
      showError('Vui lòng nhập tên template');
      return;
    }

    if (!formData.file && !editingTemplate) {
      showError('Vui lòng chọn file tài liệu');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('template_name', formData.template_name);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('is_required', String(formData.is_required));
      formDataToSend.append('requires_signature', String(formData.requires_signature));
      formDataToSend.append('is_active', String(formData.is_active));
      formDataToSend.append('apply_to_all_new_onboarding', String(formData.apply_to_all_new_onboarding));

      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      // Add position and department IDs
      formDataToSend.append('position_ids', JSON.stringify(formData.position_ids));
      formDataToSend.append('department_ids', JSON.stringify(formData.department_ids));

      const url = editingTemplate
        ? `http://localhost:8000/api-hrm/onboarding-document-templates/${editingTemplate.id}/`
        : 'http://localhost:8000/api-hrm/onboarding-document-templates/';

      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formDataToSend,
      });

      if (!res.ok) throw new Error('Failed to save template');

      showSuccess(editingTemplate ? 'Cập nhật template thành công' : 'Tạo template thành công');
      handleCloseModal();
      fetchTemplates();
    } catch (error) {
      console.error('SAVE TEMPLATE ERROR:', error);
      showError('Không thể lưu template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api-hrm/onboarding-document-templates/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to delete template');

      showSuccess('Xóa template thành công');
      fetchTemplates();
    } catch (error) {
      console.error('DELETE TEMPLATE ERROR:', error);
      showError('Không thể xóa template');
    }
  };

  const handleSyncToActive = async (id: number) => {
    if (!confirm('Đồng bộ template này tới tất cả quy trình onboarding đang active?')) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api-hrm/onboarding-document-templates/${id}/sync_to_active/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      const result = await res.json();

      if (!result.success) {
        showError(result.message || 'Đồng bộ thất bại');
        return;
      }

      showSuccess(result.message);
      fetchTemplates();
    } catch (error) {
      console.error('SYNC ERROR:', error);
      showError('Không thể đồng bộ template');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api-hrm/onboarding-document-templates/${id}/toggle_active/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      const result = await res.json();

      if (!result.success) {
        showError(result.message || 'Thao tác thất bại');
        return;
      }

      showSuccess(result.message);
      fetchTemplates();
    } catch (error) {
      console.error('TOGGLE ERROR:', error);
      showError('Không thể thay đổi trạng thái');
    }
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      document_type: template.document_type,
      description: template.description,
      file: null,
      is_required: template.is_required,
      requires_signature: template.requires_signature,
      is_active: template.is_active,
      apply_to_all_new_onboarding: template.apply_to_all_new_onboarding,
      position_ids: [],
      department_ids: [],
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      template_name: '',
      document_type: 'OTHER',
      description: '',
      file: null,
      is_required: false,
      requires_signature: false,
      is_active: true,
      apply_to_all_new_onboarding: true,
      position_ids: [],
      department_ids: [],
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates Tài liệu Onboarding</h1>
        <p className="text-gray-600 mt-2">
          Quản lý tài liệu chung cho tất cả quy trình onboarding. Upload 1 lần, áp dụng cho nhiều nhân viên.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Danh sách Templates</h2>
            <p className="text-gray-500 text-sm">
              Có {templates.length} templates • Tổng {templates.reduce((sum, t) => sum + t.usage_count, 0)} lượt sử dụng
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Tạo Template Mới
          </button>
        </div>

        {/* Templates Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cấu hình
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Áp dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Chưa có template nào. Tạo template đầu tiên!
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{template.template_name}</p>
                          {template.description && (
                            <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(
                          template.document_type
                        )}`}
                      >
                        {template.document_type_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {template.is_required && (
                          <span className="text-xs text-red-600">• Bắt buộc</span>
                        )}
                        {template.requires_signature && (
                          <span className="text-xs text-purple-600">• Yêu cầu ký</span>
                        )}
                        {template.is_active ? (
                          <span className="text-xs text-green-600">• Đang hoạt động</span>
                        ) : (
                          <span className="text-xs text-gray-400">• Đã tắt</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {template.apply_to_all_new_onboarding ? (
                          <span className="text-green-600">✓ Tự động</span>
                        ) : (
                          <span className="text-gray-500">Thủ công</span>
                        )}
                        {(template.position_count > 0 || template.department_count > 0) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {template.position_count} vị trí • {template.department_count} phòng ban
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {template.usage_count} lần
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(template.file_url || template.file, '_blank')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem file"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                          title="Sửa"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSyncToActive(template.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Đồng bộ tới onboarding đang active"
                        >
                          <CloudArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(template.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                          title={template.is_active ? 'Tắt' : 'Bật'}
                        >
                          {template.is_active ? (
                            <XCircleIcon className="w-4 h-4" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow p-6 my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingTemplate ? 'Sửa Template' : 'Tạo Template Mới'}
            </h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.template_name}
                  onChange={(e) =>
                    setFormData({ ...formData, template_name: e.target.value })
                  }
                  placeholder="VD: Nội quy lao động công ty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Loại tài liệu <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                >
                  <option value="CONTRACT">Hợp đồng</option>
                  <option value="REGULATION">Nội quy</option>
                  <option value="HANDBOOK">Sổ tay nhân viên</option>
                  <option value="FORM">Mẫu biểu</option>
                  <option value="TRAINING">Tài liệu đào tạo</option>
                  <option value="SAFETY">An toàn lao động</option>
                  <option value="POLICY">Chính sách công ty</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả về tài liệu này..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  File tài liệu {!editingTemplate && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  className="w-full border rounded-md px-3 py-2"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                {formData.file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Đã chọn: {formData.file.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vị trí áp dụng</label>
                  <select
                    multiple
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.position_ids.map(String)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions).map(
                        (option) => Number(option.value)
                      );
                      setFormData({ ...formData, position_ids: selectedIds });
                    }}
                    size={4}
                  >
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Để trống = áp dụng cho tất cả vị trí
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phòng ban áp dụng</label>
                  <select
                    multiple
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.department_ids.map(String)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions).map(
                        (option) => Number(option.value)
                      );
                      setFormData({ ...formData, department_ids: selectedIds });
                    }}
                    size={4}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Để trống = áp dụng cho tất cả phòng ban
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.apply_to_all_new_onboarding}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apply_to_all_new_onboarding: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    Tự động áp dụng cho onboarding mới
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.is_required}
                    onChange={(e) =>
                      setFormData({ ...formData, is_required: e.target.checked })
                    }
                  />
                  <span className="text-sm">Bắt buộc</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.requires_signature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_signature: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">Yêu cầu ký</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  <span className="text-sm">Kích hoạt ngay</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                {submitting && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                {submitting ? 'Đang lưu...' : editingTemplate ? 'Cập nhật' : 'Tạo Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplates;