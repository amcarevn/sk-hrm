  import React, { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { API_BASE_URL } from '../utils/api';
  import {
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    PlayIcon,
    CheckIcon,
    XMarkIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    PlusIcon,
  } from '@heroicons/react/24/outline';
  import onboardingService from '../services/onboarding.service';
  import TasksSection from './TasksSection';
  import DocumentsSection from './DocumentsSection';
  import { useAuth } from '../contexts/AuthContext';

  // ============================================
  // TYPE DEFINITIONS
  // ============================================

  type OnboardingTask = {
    id: number;
    name: string;
    description: string;
    task_type: string;
    order: number;
    deadline: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    assigned_to: number | null;
    assigned_to_name: string | null;
    completion_note: string;
    attachment: string | null;
    started_at: string | null;
    completed_at: string | null;
    is_overdue: boolean;
    days_until_deadline: number | null;
    checklist_items: ChecklistItem[];
  };

  type ChecklistItem = {
    id: number;
    title: string;
    description: string;
    order: number;
    is_completed: boolean;
    is_required: boolean;
    completed_at: string | null;
    completed_by: number | null;
    completed_by_name: string | null;
  };

  // ✅ FIXED: Made template_source and template_source_name optional
  type OnboardingDocument = {
    id: number;
    document_name: string;
    document_type: 'CONTRACT' | 'REGULATION' | 'HANDBOOK' | 'FORM' | 'TRAINING' | 'SAFETY' | 'POLICY' | 'OTHER';
    description: string;
    file: string;
    is_required: boolean;
    requires_signature: boolean;
    is_read: boolean;
    is_signed: boolean;
    signed_at: string | null;
    signature_file: string | null;
    uploaded_at: string;
    uploaded_by: number | null;
    uploaded_by_name: string | null;
    template_source?: number | null; // ✅ Optional
    template_source_name?: string | null; // ✅ Optional
  };

  type OnboardingDetail = {
    id: number;
    onboarding_code: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string;
    position: { id: number; title: string } | null;
    department: { id: number; name: string } | null;
    direct_manager: { id: number; full_name: string } | null;
    hr_responsible: { id: number; full_name: string } | null;
    start_date: string;
    expected_end_date: string | null;
    contract_type: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    progress_percentage: number;
    employee: { id: number; full_name: string; employee_id: string } | null;
    tasks: OnboardingTask[];
    documents: OnboardingDocument[];
    created_at: string;
    notes: string;
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const showError = (msg: string) => {
    console.error('ERROR:', msg);
    window.alert(msg);
  };

  const showSuccess = (msg: string) => {
    console.log('SUCCESS:', msg);
    window.alert(msg);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // ============================================
  // MAIN COMPONENT
  // ============================================

  const OnboardingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userRole = user?.role?.toUpperCase() || 'USER';
    const MANAGER_POSITIONS = ['Trưởng phòng', 'Leader', 'Phó giám đốc', 'Giám đốc', 'Phó phòng'];
    const userPosition = user?.employee_profile?.position || user?.hrm_user?.position || null;
    const isManager = userPosition ? MANAGER_POSITIONS.includes(userPosition) : false;
    const isEmployee = (userRole === 'STAFF' || userRole === 'CUSTOMER') && !isManager;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [onboarding, setOnboarding] = useState<OnboardingDetail | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'documents'>('info');
    useEffect(() => {
      if (isEmployee) setActiveTab('documents');
    }, [isEmployee]);

    // ============================================
    // API CALLS
    // ============================================

    const fetchOnboardingDetail = async () => {
      if (!id) {
        setError('Không tìm thấy ID onboarding');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching onboarding detail for ID:', id);
        const data = await onboardingService.get(parseInt(id));
        console.log('✅ Onboarding data received:', data);

        // ⭐ NORMALIZE DATA - Convert progress_percentage from string to number
        if (data.progress_percentage !== undefined && data.progress_percentage !== null) {
          data.progress_percentage = typeof data.progress_percentage === 'string'
            ? parseFloat(data.progress_percentage)
            : data.progress_percentage;
        }

        setOnboarding(data as any);
      } catch (error: any) {
        console.error('❌ FETCH DETAIL ERROR:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải thông tin quy trình onboarding';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const handleStartProcess = async () => {
      if (!id || !onboarding) return;

      if (!confirm('Bạn có chắc muốn bắt đầu quy trình onboarding này?')) return;

      try {
        await onboardingService.start(parseInt(id));
        showSuccess('Đã bắt đầu quy trình onboarding');
        await fetchOnboardingDetail();
      } catch (error: any) {
        console.error('START PROCESS ERROR:', error);
        showError(error.response?.data?.message || 'Không thể bắt đầu quy trình onboarding');
      }
    };
    const handleApproveEmployeeInfo = async () => {
      if (!id || !onboarding) return;
      if (!confirm('Xác nhận duyệt thông tin nhân viên đã điền?')) return;

      try {
        const task4 = onboarding.tasks?.find(t => t.order === 4);
        if (!task4) return;
        
        await onboardingService.completeTask(
          task4.id,
          'Quản lý trực tiếp đã xác nhận thông tin nhân viên'
        );
        showSuccess('Đã duyệt thông tin nhân viên');
        await fetchOnboardingDetail();
      } catch (error: any) {
        showError(error.response?.data?.message || 'Không thể duyệt thông tin');
      }
    };
    const handleCompleteProcess = async () => {
      if (!id || !onboarding) return;

      if (!confirm('Bạn có chắc muốn hoàn thành quy trình onboarding này?')) return;

      try {
        await onboardingService.complete(parseInt(id));
        showSuccess('Đã hoàn thành quy trình onboarding');
        await fetchOnboardingDetail();
      } catch (error: any) {
        console.error('COMPLETE PROCESS ERROR:', error);
        showError(error.response?.data?.message || 'Không thể hoàn thành quy trình onboarding');
      }
    };

    useEffect(() => {
      console.log('🚀 Component mounted, ID:', id);
      fetchOnboardingDetail();
    }, [id]);

    // ============================================
    // RENDER HELPERS
    // ============================================

    const renderInfoTab = () => {
      if (!onboarding) return null;

      return (
        <div className="space-y-6">
          {/* Candidate Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Thông tin ứng viên
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Họ và tên</label>
                <p className="font-medium">{onboarding.candidate_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium">{onboarding.candidate_email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Số điện thoại</label>
                <p className="font-medium">{onboarding.candidate_phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Mã onboarding</label>
                <p className="font-medium text-blue-600">{onboarding.onboarding_code || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">💼</span>
              Thông tin công việc
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Vị trí</label>
                <p className="font-medium">{onboarding.position?.title || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phòng ban</label>
                <p className="font-medium">{onboarding.department?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Quản lý trực tiếp</label>
                <p className="font-medium">{onboarding.direct_manager?.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">HR phụ trách</label>
                <p className="font-medium">{onboarding.hr_responsible?.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Ngày bắt đầu</label>
                <p className="font-medium">{onboarding.start_date || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Ngày kết thúc dự kiến</label>
                <p className="font-medium">{onboarding.expected_end_date || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Loại hợp đồng</label>
                <p className="font-medium">{onboarding.contract_type || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Employee Link */}
          {onboarding.employee && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-900 flex items-center">
                <span className="mr-2">✅</span>
                Nhân viên đã tạo
              </h3>
              <p className="text-blue-700 mb-3">
                Hồ sơ nhân viên đã được tạo: <span className="font-medium">{onboarding.employee.full_name}</span>
                {' '}(Mã: {onboarding.employee.employee_id})
              </p>
              <button
                onClick={() => navigate(`/dashboard/employees/${onboarding.employee?.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Xem hồ sơ nhân viên
              </button>
            </div>
          )}
          {/* Duyệt thông tin nhân viên - hiển thị khi task 4 đang IN_PROGRESS */}
          {(() => {
            const task4 = onboarding.tasks?.find(t => t.order === 4);
            if (!task4 || task4.status !== 'IN_PROGRESS') return null;
            return (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <h3 className="text-lg font-semibold mb-2 text-amber-900 flex items-center">
                  <span className="mr-2">⏳</span>
                  Chờ duyệt thông tin nhân viên
                </h3>
                <p className="text-amber-700 mb-4">
                  Nhân viên đã điền xong thông tin onboarding. Vui lòng kiểm tra và xác nhận.
                </p>
                <button
                  onClick={handleApproveEmployeeInfo}
                  className="flex items-center px-6 py-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Duyệt thông tin nhân viên
                </button>
              </div>
            );
          })()}
          {/* Notes */}
          {onboarding.notes && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="mr-2">📝</span>
                Ghi chú
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{onboarding.notes}</p>
            </div>
          )}

          {/* Action Buttons based on status */}
          <div className="bg-gray-50 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Thao tác</h3>
            {onboarding.status === 'DRAFT' && (
              <button
                onClick={handleStartProcess}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Bắt đầu quy trình
              </button>
            )}

            {onboarding.status === 'IN_PROGRESS' && (
              <button
                onClick={handleCompleteProcess}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Hoàn thành quy trình
              </button>
            )}

            {onboarding.status === 'COMPLETED' && (
              <div className="text-green-600 flex items-center">
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                <span className="font-medium">Quy trình đã hoàn thành</span>
              </div>
            )}
          </div>
        </div>
      );
    };

    // ============================================
    // MAIN RENDER
    // ============================================

    // Loading State
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <span className="text-lg text-gray-600">Đang tải thông tin...</span>
          </div>
        </div>
      );
    }

    // Error State
    if (error) {
      return (
        <div className="p-6">
          <button
            onClick={() => navigate('/dashboard/onboarding')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Lỗi tải dữ liệu</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchOnboardingDetail}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No Data State
    if (!onboarding) {
      return (
        <div className="p-6">
          <button
            onClick={() => navigate('/dashboard/onboarding')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách
          </button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">Không tìm thấy dữ liệu</h3>
                <p className="text-yellow-700 mt-1">Không tìm thấy quy trình onboarding với ID: {id}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main Content
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/onboarding')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {onboarding.candidate_name}
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                {onboarding.position?.title || 'N/A'} - {onboarding.department?.name || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(onboarding.status)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành</span>
            <span className="text-lg font-bold text-gray-900">
              {(() => {
                const progress = onboarding.progress_percentage;
                if (progress == null || typeof progress !== 'number' || isNaN(progress)) {
                  return '0%';
                }
                return `${Math.round(progress)}%`;
              })()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(() => {
                  const progress = onboarding.progress_percentage;
                  if (progress == null || typeof progress !== 'number' || isNaN(progress)) {
                    return 0;
                  }
                  return Math.max(0, Math.min(100, progress));
                })()}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {onboarding.tasks?.filter(t => t.status === 'COMPLETED').length || 0} / {onboarding.tasks?.length || 0} tasks hoàn thành
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {!isEmployee && (
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Thông tin chung
                </button>
              )}
              {!isEmployee && (
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tasks ({onboarding.tasks?.length || 0})
                </button>
              )}
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tài liệu ({onboarding.documents?.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'tasks' && (
              <TasksSection
                tasks={onboarding.tasks || []}
                onboardingId={onboarding.id}
                onUpdate={fetchOnboardingDetail}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsSection
                documents={onboarding.documents || []}
                onboardingId={onboarding.id}
                onUpdate={fetchOnboardingDetail}
                isReadOnly={isEmployee}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  export default OnboardingDetail;