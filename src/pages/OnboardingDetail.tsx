import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import  API_BASE_URL from '../utils/api';
import ContractSection from './ContractSection';
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
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import onboardingService from '../services/onboarding.service';
import TasksSection from './TasksSection';
import DocumentsSection from './DocumentsSection';
import { useAuth } from '../contexts/AuthContext';
import { employeesAPI, SuperAdminEmployee } from '../utils/api';

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
  template_source?: number | null;
  template_source_name?: string | null;
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
  probation_period_months?: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress_percentage: number;
  employee: { id: number; full_name: string; employee_id: string } | null;
  created_by?: { id: number; full_name: string; employee_id: string } | null;
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  contracts?: { id: number }[];
  created_at: string;
  notes: string;
  // Personal info (filled by employee)
  desired_employee_id?: string;
  citizen_id?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  permanent_address?: string;
  current_address?: string;
  // Education
  education_level?: string;
  university?: string;
  major?: string;
  graduation_year?: number | null;
  // Financial / Banking
  salary?: number | string | null;
  salary_note?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  tax_code?: string;
  tax_dependents?: number;
  // Uploaded files
  cv_file?: string | null;
  id_card_front?: string | null;
  id_card_back?: string | null;
  diploma_file?: string | null;
  // Status flags
  employee_info_completed?: boolean;
  employee_info_completed_at?: string | null;
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

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PROBATION: 'Thử việc',
  DEFINITE: 'Có thời hạn',
  INDEFINITE: 'Vô thời hạn',
  SEASONAL: 'Theo mùa vụ',
  PART_TIME: 'Bán thời gian',
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
  const isManager = user?.employee_profile?.is_manager || user?.hrm_user?.is_manager || false;
  const isEmployee = (userRole === 'STAFF' || userRole === 'CUSTOMER') && !isManager;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingDetail | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<SuperAdminEmployee | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'documents' | 'contracts'>('info');

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
      const data = await onboardingService.get(parseInt(id));

      if (data.progress_percentage !== undefined && data.progress_percentage !== null) {
        data.progress_percentage = typeof data.progress_percentage === 'string'
          ? parseFloat(data.progress_percentage)
          : data.progress_percentage;
      }

      setOnboarding(data as any);

      // Fetch full employee profile for admins when employee record exists
      if (userRole === 'ADMIN' && (data as any).employee?.employee_id) {
        try {
          const profile = await employeesAPI.getByEmployeeId((data as any).employee.employee_id);
          setEmployeeProfile(profile);
        } catch (profileErr) {
          console.warn('Could not load employee profile:', profileErr);
          setEmployeeProfile(null);
        }
      }
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
      showError(error.response?.data?.message || 'Không thể bắt đầu quy trình onboarding');
    }
  };

  const handleApproveEmployeeInfo = async () => {
    if (!id || !onboarding) return;
    if (!confirm('Xác nhận duyệt thông tin nhân viên đã điền?')) return;
    try {
      const task4 = onboarding.tasks?.find(t => t.order === 4);
      if (!task4) return;
      await onboardingService.completeTask(task4.id, 'Quản lý trực tiếp đã xác nhận thông tin nhân viên');
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
      showError(error.response?.data?.message || 'Không thể hoàn thành quy trình onboarding');
    }
  };

  useEffect(() => {
    fetchOnboardingDetail();
  }, [id]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderInfoTab = () => {
    if (!onboarding) return null;

    return (
      <div className="space-y-6">
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
              <p className="font-medium">{CONTRACT_TYPE_LABELS[onboarding.contract_type] || onboarding.contract_type || 'N/A'}</p>
            </div>
            {onboarding.probation_period_months != null && (
              <div>
                <label className="text-sm text-gray-600">Thời gian thử việc</label>
                <p className="font-medium">{onboarding.probation_period_months} tháng</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee-filled personal information — only visible to admin */}
        {userRole === 'ADMIN' && onboarding.employee_info_completed && (
          <>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🪪</span>
                Thông tin cá nhân (nhân sự tự nhập)
                {onboarding.employee_info_completed_at && (
                  <span className="ml-3 text-xs font-normal text-gray-500">
                    Hoàn thành lúc: {new Date(onboarding.employee_info_completed_at).toLocaleString('vi-VN')}
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Số CMND / CCCD</label>
                  <p className="font-medium">{onboarding.citizen_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày sinh</label>
                  <p className="font-medium">
                    {onboarding.date_of_birth
                      ? new Date(onboarding.date_of_birth).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Giới tính</label>
                  <p className="font-medium">{onboarding.gender ? (GENDER_LABELS[onboarding.gender] || onboarding.gender) : 'N/A'}</p>
                </div>
                {onboarding.desired_employee_id && (
                  <div>
                    <label className="text-sm text-gray-600">Mã nhân viên mong muốn</label>
                    <p className="font-medium">{onboarding.desired_employee_id}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">Địa chỉ thường trú</label>
                  <p className="font-medium">{onboarding.permanent_address || 'N/A'}</p>
                </div>
                {onboarding.current_address && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Địa chỉ hiện tại</label>
                    <p className="font-medium">{onboarding.current_address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎓</span>
                Trình độ học vấn
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Trình độ</label>
                  <p className="font-medium">{onboarding.education_level || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Trường đại học / cao đẳng</label>
                  <p className="font-medium">{onboarding.university || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chuyên ngành</label>
                  <p className="font-medium">{onboarding.major || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Năm tốt nghiệp</label>
                  <p className="font-medium">{onboarding.graduation_year ?? 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">💳</span>
                Thông tin tài chính & ngân hàng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Mức lương</label>
                  <p className="font-medium">
                    {onboarding.salary != null && onboarding.salary !== '' && !isNaN(Number(onboarding.salary))
                      ? Number(onboarding.salary).toLocaleString('vi-VN') + ' đ'
                      : 'N/A'}
                  </p>
                </div>
                {onboarding.salary_note && (
                  <div>
                    <label className="text-sm text-gray-600">Ghi chú lương</label>
                    <p className="font-medium">{onboarding.salary_note}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Ngân hàng</label>
                  <p className="font-medium">{onboarding.bank_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số tài khoản</label>
                  <p className="font-medium">{onboarding.bank_account_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chủ tài khoản</label>
                  <p className="font-medium">{onboarding.bank_account_holder || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mã số thuế</label>
                  <p className="font-medium">{onboarding.tax_code || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số người phụ thuộc</label>
                  <p className="font-medium">{onboarding.tax_dependents ?? 'N/A'}</p>
                </div>
              </div>
            </div>

            {(onboarding.cv_file || onboarding.id_card_front || onboarding.id_card_back || onboarding.diploma_file) && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📎</span>
                  Hồ sơ đính kèm
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {onboarding.cv_file && (
                    <div>
                      <label className="text-sm text-gray-600">CV</label>
                      <a
                        href={onboarding.cv_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mt-1 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-1" />
                        Xem CV
                      </a>
                    </div>
                  )}
                  {onboarding.id_card_front && (
                    <div>
                      <label className="text-sm text-gray-600">CCCD mặt trước</label>
                      <a
                        href={onboarding.id_card_front}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mt-1 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-1" />
                        Xem ảnh
                      </a>
                    </div>
                  )}
                  {onboarding.id_card_back && (
                    <div>
                      <label className="text-sm text-gray-600">CCCD mặt sau</label>
                      <a
                        href={onboarding.id_card_back}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mt-1 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-1" />
                        Xem ảnh
                      </a>
                    </div>
                  )}
                  {onboarding.diploma_file && (
                    <div>
                      <label className="text-sm text-gray-600">Bằng cấp</label>
                      <a
                        href={onboarding.diploma_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mt-1 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-1" />
                        Xem tài liệu
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

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

        {/* Admin-only: Full employee profile from super-admin API */}
        {userRole === 'ADMIN' && employeeProfile && (
          <>
            {/* Account & Status */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Hồ sơ nhân viên hệ thống
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Mã nhân viên</label>
                  <p className="font-medium text-indigo-700">{employeeProfile.employee_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Họ và tên</label>
                  <p className="font-medium">{employeeProfile.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Giới tính</label>
                  <p className="font-medium">
                    {employeeProfile.gender === 'M' ? 'Nam' : employeeProfile.gender === 'F' ? 'Nữ' : employeeProfile.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày sinh</label>
                  <p className="font-medium">
                    {employeeProfile.date_of_birth
                      ? new Date(employeeProfile.date_of_birth).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số điện thoại</label>
                  <p className="font-medium">{employeeProfile.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email cá nhân</label>
                  <p className="font-medium">{employeeProfile.personal_email || 'N/A'}</p>
                </div>
                {employeeProfile.user && (
                  <div>
                    <label className="text-sm text-gray-600">Tài khoản hệ thống</label>
                    <p className="font-medium">{employeeProfile.user.username}</p>
                  </div>
                )}
                {employeeProfile.user?.email && (
                  <div>
                    <label className="text-sm text-gray-600">Email tài khoản</label>
                    <p className="font-medium">{employeeProfile.user.email}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Trạng thái</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    employeeProfile.employment_status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : employeeProfile.employment_status === 'PROBATION'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employeeProfile.employment_status === 'ACTIVE' ? 'Đang làm việc'
                      : employeeProfile.employment_status === 'PROBATION' ? 'Thử việc'
                      : employeeProfile.employment_status === 'INACTIVE' ? 'Đã nghỉ'
                      : employeeProfile.employment_status}
                  </span>
                </div>
                {employeeProfile.start_date && (
                  <div>
                    <label className="text-sm text-gray-600">Ngày vào làm</label>
                    <p className="font-medium">{new Date(employeeProfile.start_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {employeeProfile.end_date && (
                  <div>
                    <label className="text-sm text-gray-600">Ngày kết thúc</label>
                    <p className="font-medium">{new Date(employeeProfile.end_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Identity (CCCD) */}
            {(employeeProfile.cccd_number || employeeProfile.cccd_issue_date || employeeProfile.cccd_issue_place || employeeProfile.birth_place || employeeProfile.permanent_residence) && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🪪</span>
                  Thông tin CCCD / Giấy tờ tùy thân
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Số CCCD</label>
                    <p className="font-medium font-mono">{employeeProfile.cccd_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ngày cấp CCCD</label>
                    <p className="font-medium">
                      {employeeProfile.cccd_issue_date
                        ? new Date(employeeProfile.cccd_issue_date).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </p>
                  </div>
                  {employeeProfile.cccd_issue_place && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Nơi cấp CCCD</label>
                      <p className="font-medium">{employeeProfile.cccd_issue_place}</p>
                    </div>
                  )}
                  {employeeProfile.birth_place && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Nơi sinh</label>
                      <p className="font-medium">{employeeProfile.birth_place}</p>
                    </div>
                  )}
                  {employeeProfile.permanent_residence && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Địa chỉ thường trú</label>
                      <p className="font-medium">{employeeProfile.permanent_residence}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Salary & Contract */}
            {(employeeProfile.basic_salary != null || employeeProfile.contract_type) && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">💰</span>
                  Lương & Hợp đồng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {employeeProfile.basic_salary != null && (
                    <div>
                      <label className="text-sm text-gray-600">Lương cơ bản</label>
                      <p className="font-medium text-green-700 text-lg">
                        {Number(employeeProfile.basic_salary).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  )}
                  {employeeProfile.contract_type && (
                    <div>
                      <label className="text-sm text-gray-600">Loại hợp đồng</label>
                      <p className="font-medium">{employeeProfile.contract_type_display || CONTRACT_TYPE_LABELS[employeeProfile.contract_type] || employeeProfile.contract_type}</p>
                    </div>
                  )}
                  {employeeProfile.probation_months != null && (
                    <div>
                      <label className="text-sm text-gray-600">Thời gian thử việc</label>
                      <p className="font-medium">{employeeProfile.probation_months} tháng</p>
                    </div>
                  )}
                  {employeeProfile.probation_end_date && (
                    <div>
                      <label className="text-sm text-gray-600">Ngày kết thúc thử việc</label>
                      <p className="font-medium">{new Date(employeeProfile.probation_end_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {employeeProfile.probation_salary_percentage != null && (
                    <div>
                      <label className="text-sm text-gray-600">% lương thử việc</label>
                      <p className="font-medium">{employeeProfile.probation_salary_percentage_display || `${employeeProfile.probation_salary_percentage}%`}</p>
                    </div>
                  )}
                  {employeeProfile.bank_name && (
                    <div>
                      <label className="text-sm text-gray-600">Ngân hàng</label>
                      <p className="font-medium">{employeeProfile.bank_name}</p>
                    </div>
                  )}
                  {employeeProfile.bank_account && (
                    <div>
                      <label className="text-sm text-gray-600">Số tài khoản</label>
                      <p className="font-medium font-mono">{employeeProfile.bank_account}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Status */}
            {employeeProfile.file_status && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Trạng thái hồ sơ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Trạng thái hồ sơ</label>
                    <p className="font-medium">{employeeProfile.file_status_display || employeeProfile.file_status}</p>
                  </div>
                  {employeeProfile.file_submission_deadline && (
                    <div>
                      <label className="text-sm text-gray-600">Hạn nộp hồ sơ</label>
                      <p className="font-medium">{new Date(employeeProfile.file_submission_deadline).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {employeeProfile.file_submission_date && (
                    <div>
                      <label className="text-sm text-gray-600">Ngày nộp hồ sơ</label>
                      <p className="font-medium">{new Date(employeeProfile.file_submission_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {employeeProfile.file_review_notes && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Ghi chú hồ sơ</label>
                      <p className="font-medium">{employeeProfile.file_review_notes}</p>
                    </div>
                  )}
                  {employeeProfile.training_presentation_viewed != null && (
                    <div>
                      <label className="text-sm text-gray-600">Đã xem bài thuyết trình đào tạo</label>
                      <p className="font-medium">
                        {employeeProfile.training_presentation_viewed ? (
                          <span className="text-green-600">✓ Đã xem</span>
                        ) : (
                          <span className="text-gray-500">Chưa xem</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extra Info (parsed JSON) */}
            {employeeProfile.extra_info && (() => {
              try {
                const extra = typeof employeeProfile.extra_info === 'string'
                  ? JSON.parse(employeeProfile.extra_info)
                  : employeeProfile.extra_info;
                const entries = Object.entries(extra).filter(([, v]) => v !== null && v !== '');
                if (entries.length === 0) return null;
                const EXTRA_LABELS: Record<string, string> = {
                  facebook_link: 'Facebook',
                  work_type: 'Hình thức làm việc',
                  citizen_id_issue_date: 'Ngày cấp CMND/CCCD',
                  allowance_notes: 'Phụ cấp (ghi chú)',
                };
                return (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="mr-2">ℹ️</span>
                      Thông tin bổ sung
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {entries.map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm text-gray-600">{EXTRA_LABELS[key] || key}</label>
                          {String(value).startsWith('http') ? (
                            <a
                              href={String(value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block font-medium text-blue-600 hover:text-blue-800 underline truncate"
                            >
                              {String(value)}
                            </a>
                          ) : (
                            <p className="font-medium">{String(value)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch (parseErr) {
                console.warn('Could not parse extra_info JSON:', parseErr, employeeProfile.extra_info);
                return null;
              }
            })()}
          </>
        )}

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

        {onboarding.notes && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <span className="mr-2">📝</span>
              Ghi chú
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{onboarding.notes}</p>
          </div>
        )}

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
            <h1 className="text-3xl font-bold text-gray-900">{onboarding.candidate_name}</h1>
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
              if (progress == null || typeof progress !== 'number' || isNaN(progress)) return '0%';
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
                if (progress == null || typeof progress !== 'number' || isNaN(progress)) return 0;
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tasks ({onboarding.tasks?.length || 0})
              </button>
            )}
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tài liệu ({onboarding.documents?.length || 0})
            </button>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('contracts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contracts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hợp đồng ({onboarding.contracts?.length || 0})
              </button>
            )}
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
          {activeTab === 'contracts' && (
            <ContractSection
              onboardingId={onboarding.id}
              employeeId={onboarding.employee?.id || null}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingDetail;