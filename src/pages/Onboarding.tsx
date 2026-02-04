import React, { useState, useEffect } from 'react';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

// ============================================
// TYPE DEFINITIONS
// ============================================

type OnboardingStage = 1 | 2 | 3;
type OnboardingProgress = 'RECEIVE_DOC' | 'SIGN_CONTRACT' | 'TRAINING' | 'HANDOVER';

type Department = {
  id: number;
  name: string;
  code: string;
};

type OnboardingItem = {
  id: number;
  onboarding_code?: string;
  
  // Backend fields (từ serializer)
  candidate_name: string;
  candidate_email?: string;
  position?: {
    id: number;
    title: string;
    code: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
  department_name?: string;
  start_date: string;
  stage: OnboardingStage;
  stage_display?: string;
  progress: OnboardingProgress;
  progress_display?: string;
  
  // Alias fields for display (match với frontend cũ)
  full_name?: string;
  position_title?: string;
};

type OnboardingForm = {
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  position_title: string;
  department_id: number | '';
  start_date: string;
  stage: OnboardingStage | '';
  progress: string;
  // Đã xoá trường employee_code
};


type ApiResponse<T> = {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
} | T[];

// ============================================
// CONSTANTS
// ============================================

const PROGRESS_MAP: Record<string, OnboardingProgress> = {
  'Tiếp nhận hồ sơ': 'RECEIVE_DOC',
  'Ký hợp đồng': 'SIGN_CONTRACT',
  'Đào tạo': 'TRAINING',
  'Bàn giao công việc': 'HANDOVER',
};

const REVERSE_PROGRESS_MAP: Record<OnboardingProgress, string> = {
  'RECEIVE_DOC': 'Tiếp nhận hồ sơ',
  'SIGN_CONTRACT': 'Ký hợp đồng',
  'TRAINING': 'Đào tạo',
  'HANDOVER': 'Bàn giao công việc',
};

const STAGE_MAP: Record<OnboardingStage, string> = {
  1: 'Ứng viên mới',
  2: 'Đang onboarding',
  3: 'Hoàn thành',
};

// ============================================
// MAIN COMPONENT
// ============================================

const Onboarding: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OnboardingItem | null>(null);
  const [onboardings, setOnboardings] = useState<OnboardingItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<OnboardingForm>({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    position_title: '',
    department_id: '',
    start_date: '',
    stage: '',
    progress: 'Tiếp nhận hồ sơ',
    // Đã xoá trường employee_code
  });

  // ============================================
  // API FUNCTIONS
  // ============================================

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });
  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:8000/api-hrm/departments/', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Fetch departments failed');

      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('FETCH DEPARTMENTS ERROR:', error);
      message.error('Không thể tải danh sách phòng ban');
    }
  };

  const fetchOnboardings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api-hrm/onboardings/', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse<OnboardingItem> = await res.json();
      
      // Xử lý pagination response hoặc array response
      const items = Array.isArray(data) ? data : (data.results || []);
      
      // Normalize data: map backend fields -> frontend display
      const normalizedItems = items.map(item => ({
        ...item,
        full_name: item.candidate_name || item.full_name || 'N/A',
        position_title: item.position?.title || item.position_title || 'N/A',
        department_name: item.department?.name || item.department_name || 'N/A',
        stage_display: item.stage_display || STAGE_MAP[item.stage] || 'N/A',
        progress_display: item.progress_display || REVERSE_PROGRESS_MAP[item.progress] || 'N/A',
      }));
      
      setOnboardings(normalizedItems);
    } catch (error) {
      console.error('FETCH ERROR:', error);
      message.error('Không thể tải danh sách ứng viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
    fetchDepartments();
  }, []);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleSave = async () => {
    // Validation
    if (!formData.candidate_name.trim()) {
      message.error('Vui lòng nhập tên ứng viên');
      return;
    }
    if (!formData.candidate_email.trim()) {
      message.error('Vui lòng nhập email');
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.candidate_email)) {
      message.error('Email không hợp lệ');
      return;
    }
    if (!formData.candidate_phone.trim()) {
      message.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.position_title.trim()) {
      message.error('Vui lòng nhập vị trí');
      return;
    }
    if (!formData.department_id) {
      message.error('Vui lòng chọn phòng ban');
      return;
    }
    if (!formData.start_date) {
      message.error('Vui lòng chọn ngày bắt đầu');
      return;
    }
    if (!formData.stage) {
      message.error('Vui lòng chọn giai đoạn');
      return;
    }

    setSubmitting(true);

    const payload = {
      candidate_name: formData.candidate_name.trim(),
      candidate_email: formData.candidate_email.trim(),
      candidate_phone: formData.candidate_phone.trim(),
      position_title: formData.position_title.trim(),
      department: formData.department_id,
      start_date: formData.start_date,
      stage: Number(formData.stage),
      progress: PROGRESS_MAP[formData.progress],
    };

    try {
      const isEditing = editingItem !== null;
      const url = isEditing 
        ? `http://localhost:8000/api-hrm/onboardings/${editingItem.id}/`
        : 'http://localhost:8000/api-hrm/onboardings/';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`${method} FAILED:`, errorData);
        
        // Xử lý lỗi cụ thể từ backend
        if (errorData.candidate_name) {
          message.error(`Tên ứng viên: ${errorData.candidate_name[0]}`);
        } else if (errorData.candidate_email) {
          message.error(`Email: ${errorData.candidate_email[0]}`);
        } else if (errorData.candidate_phone) {
          message.error(`Số điện thoại: ${errorData.candidate_phone[0]}`);
        } else if (errorData.detail) {
          message.error(errorData.detail);
        } else {
          message.error('Lưu thất bại. Vui lòng kiểm tra lại thông tin.');
        }
        return;
      }

      const data = await res.json();
      console.log(`${method} SUCCESS:`, data);

      const successMessage = isEditing 
        ? 'Chỉnh sửa thông tin ứng viên thành công' 
        : 'Thêm ứng viên thành công';
      message.success(successMessage);

      await fetchOnboardings();
      handleCloseModal();
    } catch (error) {
      console.error('API ERROR:', error);
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá ứng viên này?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api-hrm/onboardings/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Delete failed');
      }

      message.success('Xoá thành công');
      await fetchOnboardings();
    } catch (error) {
      console.error('DELETE ERROR:', error);
      message.error('Xoá thất bại. Vui lòng thử lại.');
    }
  };

  // ============================================
  // MODAL HANDLERS
  // ============================================

  const handleViewDetail = (item: OnboardingItem) => {
    setEditingItem(item);
    setViewDetailModal(true);
  };

  const handleEdit = (item: OnboardingItem) => {
    setEditingItem(item);
    setFormData({
      candidate_name: item.candidate_name || item.full_name || '',
      candidate_email: item.candidate_email || '',
      candidate_phone: '', // Backend không trả về phone trong list, để trống
      position_title: item.position?.title || item.position_title || '',
      department_id: item.department?.id || '',
      start_date: item.start_date,
      stage: item.stage,
      progress: item.progress_display || REVERSE_PROGRESS_MAP[item.progress] || 'Tiếp nhận hồ sơ',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingItem(null);
    setFormData({
      candidate_name: '',
      candidate_email: '',
      candidate_phone: '',
      position_title: '',
      department_id: '',
      start_date: '',
      stage: '',
      progress: 'Tiếp nhận hồ sơ',
    });
  };

  const handleCloseDetailModal = () => {
    setViewDetailModal(false);
    setEditingItem(null);
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const stats = {
    newCandidates: onboardings.filter(o => o.stage === 1).length,
    inProgress: onboardings.filter(o => o.stage === 2).length,
    completed: onboardings.filter(o => o.stage === 3).length,
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboard nhân sự</h1>
        <p className="text-gray-600 mt-2">
          Quản lý quy trình tuyển dụng và onboarding nhân viên mới.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quy trình onboarding</h2>
            <p className="text-gray-500 text-sm">
              Có {onboardings.length} ứng viên đang trong quá trình onboarding
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Mẫu quy trình
            </button>
            <button
              onClick={() => setOpenModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              + Tạo quy trình mới
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Ứng viên mới</h3>
            <p className="text-3xl font-bold text-blue-700 mt-2">{stats.newCandidates}</p>
            <p className="text-blue-600 text-sm mt-1">Chờ xử lý hồ sơ</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900">Đang onboarding</h3>
            <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.inProgress}</p>
            <p className="text-yellow-600 text-sm mt-1">Trong quá trình nhập việc</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Hoàn thành</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">{stats.completed}</p>
            <p className="text-green-600 text-sm mt-1">Đã onboard thành công</p>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ứng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giai đoạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiến độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <LoadingOutlined className="text-2xl text-blue-600 mr-2" />
                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : onboardings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="text-lg font-medium text-gray-900">
                        Chưa có ứng viên nào
                      </p>
                      <p className="text-gray-500 mt-1">
                        Bắt đầu bằng cách thêm ứng viên mới
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                onboardings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.full_name || item.candidate_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.position_title || item.position?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.department_name || item.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.start_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.stage_display || STAGE_MAP[item.stage]}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.progress_display || REVERSE_PROGRESS_MAP[item.progress]}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Xem chi tiết"
                        >
                          <EyeOutlined className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600 hover:text-yellow-800 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <EditOutlined className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xoá"
                        >
                          <DeleteOutlined className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Onboarding Steps Info */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Các bước onboarding tiêu chuẩn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900">Tiếp nhận hồ sơ</h4>
              </div>
              <p className="text-gray-600 text-sm">Kiểm tra và xác nhận hồ sơ ứng viên</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900">Ký hợp đồng</h4>
              </div>
              <p className="text-gray-600 text-sm">Chuẩn bị và ký kết hợp đồng lao động</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900">Đào tạo</h4>
              </div>
              <p className="text-gray-600 text-sm">Đào tạo nội quy, quy trình công việc</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <h4 className="font-medium text-gray-900">Bàn giao công việc</h4>
              </div>
              <p className="text-gray-600 text-sm">Bàn giao thiết bị và công việc chính thức</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Chỉnh sửa ứng viên' : 'Thêm ứng viên onboarding'}
            </h3>

            <div className="space-y-4">
              {/* Đã xoá trường nhập mã nhân viên */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên ứng viên <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.candidate_name}
                  onChange={(e) =>
                    setFormData({ ...formData, candidate_name: e.target.value })
                  }
                  placeholder="Nhập tên ứng viên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.candidate_email}
                  onChange={(e) =>
                    setFormData({ ...formData, candidate_email: e.target.value })
                  }
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.candidate_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, candidate_phone: e.target.value })
                  }
                  placeholder="0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.position_title}
                  onChange={(e) =>
                    setFormData({ ...formData, position_title: e.target.value })
                  }
                  placeholder="Nhập vị trí"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_id: Number(e.target.value),
                    })
                  }
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Giai đoạn <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: Number(e.target.value) as OnboardingStage })
                  }
                >
                  <option value="">-- Chọn giai đoạn --</option>
                  <option value={1}>Ứng viên mới</option>
                  <option value={2}>Đang onboarding</option>
                  <option value={3}>Hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tiến độ</label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({ ...formData, progress: e.target.value })
                  }
                >
                  <option>Tiếp nhận hồ sơ</option>
                  <option>Ký hợp đồng</option>
                  <option>Đào tạo</option>
                  <option>Bàn giao công việc</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <LoadingOutlined />}
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewDetailModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin ứng viên</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Tên ứng viên</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.full_name || editingItem.candidate_name}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Vị trí</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.position_title || editingItem.position?.title || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Phòng ban</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.department_name || editingItem.department?.name || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.start_date}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Giai đoạn</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.stage_display || STAGE_MAP[editingItem.stage]}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Tiến độ</p>
                <p className="text-lg font-medium text-gray-900">
                  {editingItem.progress_display || REVERSE_PROGRESS_MAP[editingItem.progress]}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseDetailModal}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;