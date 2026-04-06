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
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import onboardingService from '../services/onboarding.service';
import TasksSection from './TasksSection';
import DocumentsSection from './DocumentsSection';
import { useAuth } from '../contexts/AuthContext';
import { employeesAPI, SuperAdminEmployee, departmentsAPI, positionsAPI, Department, Position } from '../utils/api';

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
  file_url?: string;
  is_required: boolean;
  requires_signature: boolean;
  is_read: boolean;
  is_signed: boolean;
  signed_at: string | null;
  signature_file: string | null;
  signature_file_url?: string;
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
  rank?: string;
  section?: string;
  doctor_team?: string;
  birth_place?: string;
  ethnicity?: string;
  nationality?: string;
  marital_status?: string;
  work_form?: string;
  region?: string;
  block?: string;
  employment_status_notes?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress_percentage: number;
  employee: { id: number; full_name: string; employee_id: string } | null;
  created_by?: { id: number; full_name: string; employee_id: string } | null;
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  contracts?: { id: number }[];
  created_at: string;
  notes: string;
  desired_employee_id?: string;
  citizen_id?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  permanent_address?: string;
  current_address?: string;
  education_level?: string;
  university?: string;
  major?: string;
  graduation_year?: number | null;
  salary?: number | string | null;
  salary_note?: string;
  allowance?: number | string | null;
  bank_name?: string;
  bank_account?: string;
  bank_account_holder?: string;
  bank_branch?: string;
  tax_code?: string;
  tax_dependents?: number;
  social_insurance_number?: string | null;
  cv_file?: string | null;
  cv_file_url?: string | null;
  id_card_front?: string | null;
  id_card_front_url?: string | null;
  id_card_back?: string | null;
  id_card_back_url?: string | null;
  diploma_file?: string | null;
  diploma_file_url?: string | null;
  citizen_id_file?: string | null;
  citizen_id_file_url?: string | null;
  vneid_screenshot_url?: string | null;
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

const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'Độc thân',
  MARRIED: 'Đã kết hôn',
  DIVORCED: 'Ly hôn',
  WIDOWED: 'Góa',
};

const WORK_FORM_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
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
// EDIT SECTION TYPES & CONSTANTS
// ============================================

type EditSection =
  | 'employee_info'
  | 'job'
  | 'personal'
  | 'education'
  | 'financial'
  | 'emp_cccd'
  | 'emp_salary';

const CONTRACT_OPTIONS = [
  { value: 'PROBATION', label: 'Thử việc' },
  { value: 'DEFINITE', label: 'Có thời hạn' },
  { value: 'INDEFINITE', label: 'Vô thời hạn' },
  { value: 'SEASONAL', label: 'Theo mùa vụ' },
  { value: 'PART_TIME', label: 'Bán thời gian' },
];

const PROBATION_RATE_OPTIONS = [
  { value: 'OPTION_1', label: 'Tháng đầu 85%, tháng sau 100%' },
  { value: 'OPTION_2', label: 'Tháng đầu 100%, tháng sau 100%' },
];



const withCurrentOption = (
  options: { value: string; label: string }[],
  currentValue: string | undefined
) => {
  if (!currentValue) return options;
  const exists = options.some(opt => opt.value === currentValue);
  return exists ? options : [{ value: currentValue, label: currentValue }, ...options];
};

const CCCD_ISSUE_PLACE_OPTIONS = [
  { value: 'POLICE_ADMIN', label: 'Cục cảnh sát Quản lý hành chính về Trật tự xã hội' },
  { value: 'MINISTRY_PUBLIC_SECURITY', label: 'Bộ Công An' },
];

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Chưa có dữ liệu';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ============================================
// EDIT FIELD — defined OUTSIDE main component to prevent focus loss on re-render
// ============================================

interface EditFieldProps {
  label: string;
  name: string;
  type?: string;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  editData: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

const EditField: React.FC<EditFieldProps> = ({
  label, name, type = 'text', options, readOnly = false, editData, onChange,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (readOnly) return;
    const value = type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value;
    onChange(name, value);
  };

  const commonClass = `w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
  }`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {options ? (
        <select
          value={editData[name] ?? ''}
          onChange={handleChange}
          disabled={readOnly}
          className={commonClass}
        >
          <option value="">-- Chọn --</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={editData[name] ?? ''}
          onChange={handleChange}
          rows={3}
          readOnly={readOnly}
          className={commonClass}
        />
      ) : (
        <input
          type={type}
          value={editData[name] ?? ''}
          onChange={handleChange}
          readOnly={readOnly}
          className={commonClass}
        />
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/)) return 'image';
  if (clean.endsWith('.pdf')) return 'pdf';
  return 'other';
};

const normalizeFileUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

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
  const [previewFile, setPreviewFile] = useState<{ url: string; label: string; type: 'image' | 'pdf' } | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  // Stable handler — prevents EditField re-mount on every keystroke
  const handleEditFieldChange = React.useCallback((name: string, value: any) => {
    setEditData(prev => ({ ...prev, [name]: value }));
  }, []);

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

  const openEdit = (section: EditSection, initialData: Record<string, any>) => {
    setEditSection(section);
    setEditData(initialData);
  };

  const handleSaveEdit = async () => {
    if (!id || !editSection) return;
    setEditLoading(true);
    try {
      const empId = employeeProfile?.employee_id;

      // ── Thông tin nhân viên ──
      if (editSection === 'employee_info') {
        await onboardingService.superAdminPartialUpdate(parseInt(id), {
          candidate_name: editData.full_name,
          candidate_email: editData.personal_email,
          candidate_phone: editData.phone_number,
          marital_status: editData.marital_status || null,
        });
        if (empId) {
          await employeesAPI.partialUpdateByEmployeeId(empId, {
            full_name: editData.full_name,
            gender: editData.gender,
            date_of_birth: editData.date_of_birth || null,
            phone_number: editData.phone_number,
            personal_email: editData.personal_email,
            ethnicity: editData.ethnicity,
            nationality: editData.nationality,
            marital_status: editData.marital_status || null,
          });
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }
        await fetchOnboardingDetail();
      }
      // ── Thông tin công việc ──
      else if (editSection === 'job') {
        const onboardingData: Record<string, any> = {};
        const employeeData: Record<string, any> = {};

        // Fields to update in onboarding
        if ('department_id' in editData && editData.department_id) onboardingData.department = Number(editData.department_id);
        if ('position_id' in editData && editData.position_id) onboardingData.position = Number(editData.position_id);
        if ('rank' in editData) onboardingData.rank = editData.rank;
        if ('section' in editData) onboardingData.section = editData.section;
        if ('doctor_team' in editData) onboardingData.doctor_team = editData.doctor_team;
        if ('work_form' in editData) onboardingData.work_form = editData.work_form;
        if ('region' in editData) onboardingData.region = editData.region;
        if ('block' in editData) onboardingData.block = editData.block;
        if ('start_date' in editData) onboardingData.start_date = editData.start_date;

        // Fields to update in employee
        if ('department_id' in editData && editData.department_id) employeeData.department_id = Number(editData.department_id);
        if ('position_id' in editData && editData.position_id) employeeData.position_id = Number(editData.position_id);
        if ('rank' in editData) employeeData.rank = editData.rank;
        if ('section' in editData) employeeData.section = editData.section;
        if ('doctor_team' in editData) employeeData.doctor_team = editData.doctor_team;
        if ('work_form' in editData) employeeData.work_form = editData.work_form;
        if ('region' in editData) employeeData.region = editData.region;
        if ('block' in editData) employeeData.block = editData.block;
        if ('employment_status' in editData) employeeData.employment_status = editData.employment_status;
        if ('employment_status_notes' in editData) employeeData.employment_status_notes = editData.employment_status_notes;
        if ('start_date' in editData) employeeData.start_date = editData.start_date;

        // Update onboarding
        if (Object.keys(onboardingData).length > 0) {
          await onboardingService.superAdminPartialUpdate(parseInt(id), onboardingData);
        }

        // Update employee profile
        if (empId && Object.keys(employeeData).length > 0) {
          await employeesAPI.partialUpdateByEmployeeId(empId, employeeData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }

        await fetchOnboardingDetail();
      }
      // ── Giấy tờ tùy thân & địa chỉ ──
      else if (editSection === 'personal') {
        const onboardingData: Record<string, any> = {};
        const employeeData: Record<string, any> = {};

        // Fields to update in onboarding
        if ('birth_place' in editData) onboardingData.birth_place = editData.birth_place;
        if ('permanent_residence' in editData) onboardingData.permanent_address = editData.permanent_residence;
        if ('current_address' in editData) onboardingData.current_address = editData.current_address;
        if ('social_insurance_number' in editData) onboardingData.social_insurance_number = editData.social_insurance_number;
        if ('tax_code' in editData) onboardingData.tax_code = editData.tax_code;

        // Fields to update in employee
        if ('cccd_number' in editData) employeeData.cccd_number = editData.cccd_number;
        if ('cccd_issue_date' in editData) employeeData.cccd_issue_date = editData.cccd_issue_date || null;
        if ('cccd_issue_place' in editData) employeeData.cccd_issue_place = editData.cccd_issue_place;
        if ('birth_place' in editData) employeeData.birth_place = editData.birth_place;
        if ('permanent_residence' in editData) employeeData.permanent_residence = editData.permanent_residence;
        if ('current_address' in editData) employeeData.current_address = editData.current_address;
        if ('social_insurance_number' in editData) employeeData.social_insurance_number = editData.social_insurance_number;
        if ('tax_code' in editData) employeeData.tax_code = editData.tax_code;

        // Update onboarding
        if (Object.keys(onboardingData).length > 0) {
          await onboardingService.superAdminPartialUpdate(parseInt(id), onboardingData);
        }

        // Update employee profile
        if (empId && Object.keys(employeeData).length > 0) {
          await employeesAPI.partialUpdateByEmployeeId(empId, employeeData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }

        await fetchOnboardingDetail();
      }
      // ── Trình độ học vấn ──
      else if (editSection === 'education') {
        const onboardingData: Record<string, any> = {};
        const employeeData: Record<string, any> = {};

        // Fields to update in onboarding
        if ('education_level' in editData) onboardingData.education_level = editData.education_level;
        if ('university' in editData) onboardingData.university = editData.university;
        if ('major' in editData) onboardingData.major = editData.major;
        if ('graduation_year' in editData) onboardingData.graduation_year = editData.graduation_year || null;

        // Fields to update in employee (extra_info)
        if ('education_level' in editData) employeeData.education_level = editData.education_level;

        // Update onboarding
        if (Object.keys(onboardingData).length > 0) {
          await onboardingService.superAdminPartialUpdate(parseInt(id), onboardingData);
        }

        // Update employee profile
        if (empId && (Object.keys(employeeData).length > 0 || ('university' in editData || 'major' in editData || 'graduation_year' in editData))) {
          const updateData = { ...employeeData };
          if ('university' in editData || 'major' in editData || 'graduation_year' in editData) {
            updateData.extra_info = JSON.stringify({
              ...(() => {
                try {
                  return typeof employeeProfile?.extra_info === 'string'
                    ? JSON.parse(employeeProfile.extra_info || '{}')
                    : (employeeProfile?.extra_info || {});
                } catch {
                  return {};
                }
              })(),
              university: editData.university || undefined,
              major: editData.major || undefined,
              graduation_year: editData.graduation_year || undefined,
            });
          }
          await employeesAPI.partialUpdateByEmployeeId(empId, updateData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }

        await fetchOnboardingDetail();
      }
      // ── Thông tin tài chính & ngân hàng ──
      else if (editSection === 'financial') {
        const onboardingData: Record<string, any> = {};
        const employeeData: Record<string, any> = {};

        // Fields to update in onboarding
        if ('bank_name' in editData) onboardingData.bank_name = editData.bank_name;
        if ('bank_account' in editData) onboardingData.bank_account = editData.bank_account;
        if ('bank_account_holder' in editData) onboardingData.bank_account_holder = editData.bank_account_holder;
        if ('bank_branch' in editData) onboardingData.bank_branch = editData.bank_branch;

        // Fields to update in employee
        if ('bank_name' in editData) employeeData.bank_name = editData.bank_name;
        if ('bank_account' in editData) employeeData.bank_account = editData.bank_account;
        if ('bank_branch' in editData) employeeData.bank_branch = editData.bank_branch;

        // Update onboarding
        if (Object.keys(onboardingData).length > 0) {
          await onboardingService.superAdminPartialUpdate(parseInt(id), onboardingData);
        }

        // Update employee profile
        if (empId && Object.keys(employeeData).length > 0) {
          const updateData = { ...employeeData };
          if ('bank_account_holder' in editData) {
            updateData.extra_info = JSON.stringify({
              ...(() => {
                try {
                  return typeof employeeProfile?.extra_info === 'string'
                    ? JSON.parse(employeeProfile.extra_info || '{}')
                    : (employeeProfile?.extra_info || {});
                } catch {
                  return {};
                }
              })(),
              bank_account_holder: editData.bank_account_holder || undefined,
            });
          }
          await employeesAPI.partialUpdateByEmployeeId(empId, updateData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }

        await fetchOnboardingDetail();
      }
      // ── CCCD (emp_cccd) ──
      else if (editSection === 'emp_cccd') {
        const employeeData: Record<string, any> = {};

        if ('cccd_number' in editData) employeeData.cccd_number = editData.cccd_number;
        if ('cccd_issue_date' in editData) employeeData.cccd_issue_date = editData.cccd_issue_date || null;
        if ('cccd_issue_place' in editData) employeeData.cccd_issue_place = editData.cccd_issue_place;
        if ('birth_place' in editData) employeeData.birth_place = editData.birth_place;
        if ('permanent_residence' in editData) employeeData.permanent_residence = editData.permanent_residence;

        if (empId && Object.keys(employeeData).length > 0) {
          await employeesAPI.partialUpdateByEmployeeId(empId, employeeData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }

        await fetchOnboardingDetail();
      }
      // ── Lương & Hợp đồng (emp_salary) ──
      else if (editSection === 'emp_salary') {
        const employeeData: Record<string, any> = {};

        if ('basic_salary' in editData) employeeData.basic_salary = editData.basic_salary || null;
        if ('allowance' in editData) employeeData.allowance = editData.allowance || null;
        if ('contract_type' in editData) employeeData.contract_type = editData.contract_type;
        if ('probation_months' in editData) employeeData.probation_months = editData.probation_months || null;
        if ('probation_end_date' in editData) employeeData.probation_end_date = editData.probation_end_date || null;
        if ('probation_rate' in editData) employeeData.probation_rate = editData.probation_rate;

        if (empId && Object.keys(employeeData).length > 0) {
          await employeesAPI.partialUpdateByEmployeeId(empId, employeeData);
          const updated = await employeesAPI.getByEmployeeId(empId);
          setEmployeeProfile(updated);
        }
      }

      setEditSection(null);
      showSuccess('Đã cập nhật thành công');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingDetail();
  }, [id]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          departmentsAPI.list({ page_size: 1000 }),
          positionsAPI.list({ page_size: 1000 }),
        ]);
        setAllDepartments(deptRes.results || []);
        setAllPositions(posRes.results || []);
      } catch (e) {
        console.warn('Could not load departments/positions:', e);
      }
    };
    loadMasterData();
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderInfoTab = () => {
    if (!onboarding) return null;

    // Parse extra_info một lần để dùng nhiều chỗ
    const extraInfo = (() => {
      try {
        return typeof employeeProfile?.extra_info === 'string'
          ? JSON.parse(employeeProfile.extra_info || '{}')
          : (employeeProfile?.extra_info || {});
      } catch {
        return {};
      }
    })();
    const vneidScreenshotUrl =
      onboarding.vneid_screenshot_url ||
      (employeeProfile as any)?.vneid_screenshot_url ||
      normalizeFileUrl(employeeProfile?.vneid_screenshot);

    return (
      <div className="space-y-6">

        {/* ── Thông tin nhân viên ── */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <span className="mr-2">👤</span>
              Thông tin nhân viên
            </span>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => openEdit('employee_info', {
                  employee_id: employeeProfile?.employee_id ?? onboarding.employee?.employee_id ?? '',
                  full_name: employeeProfile?.full_name ?? onboarding.candidate_name ?? '',
                  personal_email: employeeProfile?.personal_email ?? onboarding.candidate_email ?? '',
                  phone_number: employeeProfile?.phone_number ?? onboarding.candidate_phone ?? '',
                  gender: employeeProfile?.gender ?? '',
                  date_of_birth: employeeProfile?.date_of_birth ?? '',
                  ethnicity: employeeProfile?.ethnicity || onboarding.ethnicity || 'Chưa có dữ liệu',
                  nationality: employeeProfile?.nationality || onboarding.nationality || 'Chưa có dữ liệu',
                  marital_status: (employeeProfile as any)?.marital_status ?? (onboarding as any)?.marital_status ?? '',
                })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Sửa thông tin nhân viên"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Mã nhân viên</label>
              <p className="font-medium text-indigo-700">
                {employeeProfile?.employee_id ?? onboarding.employee?.employee_id ?? 'Chưa có'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Họ và tên</label>
              <p className="font-medium">
                {employeeProfile?.full_name ?? onboarding.candidate_name ?? 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email cá nhân</label>
              <p className="font-medium">
                {employeeProfile?.personal_email ?? onboarding.candidate_email ?? 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <p className="font-medium">
                {employeeProfile?.phone_number ?? onboarding.candidate_phone ?? 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Giới tính</label>
              <p className="font-medium">
                {employeeProfile?.gender
                  ? (employeeProfile.gender === 'M' ? 'Nam' : employeeProfile.gender === 'F' ? 'Nữ' : 'Khác')
                  : onboarding.gender
                  ? (onboarding.gender === 'MALE' ? 'Nam' : onboarding.gender === 'FEMALE' ? 'Nữ' : 'Khác')
                  : 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày sinh</label>
              <p className="font-medium">
                {employeeProfile?.date_of_birth
                  ? formatDate(employeeProfile.date_of_birth)
                  : formatDate(onboarding.date_of_birth)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Dân tộc</label>
              <p className="font-medium">
                {(employeeProfile as any)?.ethnicity || onboarding.ethnicity || 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quốc tịch</label>
              <p className="font-medium">
                {(employeeProfile as any)?.nationality || onboarding.nationality || 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Tình trạng hôn nhân</label>
              <p className="font-medium">
                {(() => {
                  const ms = employeeProfile?.marital_status || (onboarding as any)?.marital_status;
                  return ms ? (MARITAL_STATUS_LABELS[ms] || ms) : 'Chưa có dữ liệu';
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Thông tin công việc ── */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <span className="mr-2">💼</span>
              Thông tin công việc
            </span>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => openEdit('job', {
                  department_id: onboarding.department?.id ? String(onboarding.department.id) : '',
                  department_name: (employeeProfile as any)?.department?.name ?? onboarding.department?.name ?? '',
                  position_id: onboarding.position?.id ? String(onboarding.position.id) : '',
                  position_title: (employeeProfile as any)?.position?.title ?? onboarding.position?.title ?? '',
                  rank: employeeProfile?.rank ?? onboarding.rank ?? '',
                  section: employeeProfile?.section ?? onboarding.section ?? '',
                  doctor_team: employeeProfile?.doctor_team ?? onboarding.doctor_team ?? '',
                  work_form: employeeProfile?.work_form ?? onboarding.work_form ?? '',
                  region: employeeProfile?.region ?? onboarding.region ?? '',
                  block: employeeProfile?.block ?? onboarding.block ?? '',
                  employment_status: employeeProfile?.employment_status ?? '',
                  employment_status_notes: (employeeProfile as any)?.employment_status_notes ?? onboarding.employment_status_notes ?? '',
                  start_date: employeeProfile?.start_date ?? onboarding.start_date ?? '',
                })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Sửa thông tin công việc"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Phòng ban</label>
              <p className="font-medium">{(employeeProfile as any)?.department?.name || onboarding.department?.name || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Cấp bậc</label>
              <p className="font-medium">{employeeProfile?.rank || onboarding.rank || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Vị trí</label>
              <p className="font-medium">{(employeeProfile as any)?.position?.title || onboarding.position?.title || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Bộ phận</label>
              <p className="font-medium">{employeeProfile?.section || onboarding.section || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quản lý trực tiếp</label>
              <p className="font-medium">{onboarding.direct_manager?.full_name || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Bác sĩ phụ trách</label>
              <p className="font-medium">{employeeProfile?.doctor_team || onboarding.doctor_team || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày bắt đầu làm việc</label>
              <p className="font-medium">
                {employeeProfile?.start_date
                  ? formatDate(employeeProfile.start_date)
                  : formatDate(onboarding.start_date)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Hình thức làm việc</label>
              <p className="font-medium">
                {(employeeProfile?.work_form || onboarding.work_form) ? (WORK_FORM_LABELS[employeeProfile?.work_form || onboarding.work_form!] || employeeProfile?.work_form || onboarding.work_form) : 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Vùng/Miền</label>
              <p className="font-medium">{employeeProfile?.region || onboarding.region || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Khối</label>
              <p className="font-medium">{employeeProfile?.block || onboarding.block || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Trạng thái làm việc</label>
              <p className="font-medium">
                {employeeProfile?.employment_status === 'ACTIVE'
                  ? 'Đang làm việc'
                  : employeeProfile?.employment_status === 'PAUSED'
                  ? 'Tạm dừng'
                  : employeeProfile?.employment_status === 'INACTIVE'
                  ? 'Đã nghỉ'
                  : employeeProfile?.employment_status || 'Chưa có dữ liệu'}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Ghi chú tình trạng công việc</label>
              <p className="font-medium whitespace-pre-wrap">
                {(employeeProfile as any)?.employment_status_notes || onboarding.employment_status_notes || 'Chưa có dữ liệu'}
              </p>
            </div>
          </div>
        </div>

        {/* Employee-filled sections — only visible to admin */}
        {userRole === 'ADMIN' && onboarding.employee_info_completed && (
          <>
            {/* ── Giấy tờ tùy thân & địa chỉ ── */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">🪪</span>
                  Giấy tờ tùy thân & địa chỉ
                </span>
                <button
                  onClick={() => openEdit('personal', {
                    citizen_id: employeeProfile?.cccd_number ?? onboarding.citizen_id ?? '',
                    date_of_birth: employeeProfile?.date_of_birth ?? onboarding.date_of_birth ?? '',
                    gender: employeeProfile?.gender ?? onboarding.gender ?? '',
                    permanent_address: employeeProfile?.permanent_residence ?? onboarding.permanent_address ?? '',
                    current_address: employeeProfile?.current_address ?? onboarding.current_address ?? '',
                    cccd_number: employeeProfile?.cccd_number ?? '',
                    cccd_issue_date: employeeProfile?.cccd_issue_date ?? '',
                    cccd_issue_place: employeeProfile?.cccd_issue_place ?? '',
                    birth_place: employeeProfile?.birth_place ?? onboarding.birth_place ?? '',
                    permanent_residence: employeeProfile?.permanent_residence ?? onboarding.permanent_address ?? '',
                    social_insurance_number: employeeProfile?.social_insurance_number ?? onboarding.social_insurance_number ?? '',
                    tax_code: employeeProfile?.tax_code ?? onboarding.tax_code ?? '',
                  })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Sửa giấy tờ tùy thân & địa chỉ"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="text-sm text-gray-600">Số CCCD</label>
                  <p className="font-medium font-mono">
                    {employeeProfile?.cccd_number || 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày cấp CCCD</label>
                  <p className="font-medium">
                    {employeeProfile?.cccd_issue_date
                      ? formatDate(employeeProfile.cccd_issue_date)
                      : 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nơi cấp CCCD</label>
                  <p className="font-medium">
                    {employeeProfile?.cccd_issue_place === 'POLICE_ADMIN'
                      ? 'Cục cảnh sát Quản lý hành chính về Trật tự xã hội'
                      : employeeProfile?.cccd_issue_place === 'MINISTRY_PUBLIC_SECURITY'
                      ? 'Bộ Công An'
                      : employeeProfile?.cccd_issue_place || 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nơi đăng ký khai sinh</label>
                  <p className="font-medium">
                    {employeeProfile?.birth_place || onboarding.birth_place || 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mã số BHXH</label>
                  <p className="font-medium">
                    {employeeProfile?.social_insurance_number || onboarding.social_insurance_number || 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mã số thuế</label>
                  <p className="font-medium">{onboarding.tax_code || 'Chưa có dữ liệu'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Địa chỉ thường trú</label>
                  <p className="font-medium">
                    {employeeProfile?.permanent_residence || onboarding.permanent_address || 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Địa chỉ hiện tại</label>
                  <p className="font-medium">
                    {(employeeProfile?.current_address && employeeProfile.current_address !== '')
                      ? employeeProfile.current_address
                      : (onboarding.current_address || 'Chưa có dữ liệu')}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Trình độ học vấn ── */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">🎓</span>
                  Trình độ học vấn
                </span>
                <button
                  onClick={() => openEdit('education', {
                    education_level: employeeProfile?.education_level ?? onboarding.education_level ?? '',
                    university: (extraInfo.university || onboarding.university) ?? '',
                    major: (extraInfo.major || onboarding.major) ?? '',
                    graduation_year: (extraInfo.graduation_year || onboarding.graduation_year) ?? '',
                  })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Sửa trình độ học vấn"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Trình độ</label>
                  <p className="font-medium">{employeeProfile?.education_level || onboarding.education_level || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Trường đại học / cao đẳng</label>
                  <p className="font-medium">{(extraInfo.university || onboarding.university) || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chuyên ngành</label>
                  <p className="font-medium">{(extraInfo.major || onboarding.major) || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Năm tốt nghiệp</label>
                  <p className="font-medium">{(extraInfo.graduation_year || onboarding.graduation_year) ?? 'Chưa có dữ liệu'}</p>
                </div>
              </div>
            </div>

            {/* ── Thông tin tài chính & ngân hàng ── */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">💳</span>
                  Thông tin tài chính & ngân hàng
                </span>
                <button
                  onClick={() => openEdit('financial', {
                    bank_name: employeeProfile?.bank_name ?? onboarding.bank_name ?? '',
                    bank_account: employeeProfile?.bank_account ?? onboarding.bank_account ?? '',
                    bank_account_holder: (extraInfo.bank_account_holder || onboarding.bank_account_holder) ?? '',
                    bank_branch: employeeProfile?.bank_branch ?? onboarding.bank_branch ?? '',
                  })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Sửa thông tin tài chính"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Ngân hàng</label>
                  <p className="font-medium">{employeeProfile?.bank_name || onboarding.bank_name || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số tài khoản</label>
                  <p className="font-medium">{employeeProfile?.bank_account || onboarding.bank_account || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chủ tài khoản</label>
                  <p className="font-medium">{extraInfo.bank_account_holder || onboarding.bank_account_holder || 'Chưa có dữ liệu'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chi nhánh</label>
                  <p className="font-medium">{employeeProfile?.bank_branch || onboarding.bank_branch || 'Chưa có dữ liệu'}</p>
                </div>
              </div>
            </div>

            {/* ── Hồ sơ đính kèm ── */}
            {(onboarding.cv_file || onboarding.id_card_front || onboarding.id_card_back || onboarding.diploma_file || onboarding.citizen_id_file || onboarding.citizen_id_file_url || vneidScreenshotUrl || extraInfo.facebook_link) && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📎</span>
                  Hồ sơ đính kèm
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Files */}
                  {([
                    { key: 'cv_file', label: 'CV', url: onboarding.cv_file_url || onboarding.cv_file },
                    { key: 'id_card_front', label: 'CCCD mặt trước', url: onboarding.id_card_front_url || onboarding.id_card_front },
                    { key: 'id_card_back', label: 'CCCD mặt sau', url: onboarding.id_card_back_url || onboarding.id_card_back },
                    { key: 'diploma_file', label: 'Bằng cấp', url: onboarding.diploma_file_url || onboarding.diploma_file },
                    { key: 'citizen_id_file', label: 'File CMND/CCCD', url: onboarding.citizen_id_file_url || onboarding.citizen_id_file },
                    { key: 'vneid_screenshot', label: 'Ảnh chụp màn hình VNeID', url: vneidScreenshotUrl },
                  ] as { key: string; label: string; url: string | null | undefined }[])
                    .filter(f => f.url)
                    .map(f => {
                      const fileUrl = f.url as string;
                      const fileType = getFileType(fileUrl);
                      const isImage = fileType === 'image' && !imgErrors[f.key];
                      return (
                        <div key={f.key} className="border rounded-lg overflow-hidden">
                          {isImage ? (
                            <div
                              className="h-32 bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                              onClick={() => setPreviewFile({ url: fileUrl, label: f.label, type: 'image' })}
                            >
                              <img
                                src={fileUrl}
                                alt={f.label}
                                className="object-cover w-full h-full"
                                onError={() => setImgErrors(prev => ({ ...prev, [f.key]: true }))}
                              />
                            </div>
                          ) : (
                            <div
                              className="h-32 bg-red-50 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                              onClick={() => setPreviewFile({ url: fileUrl, label: f.label, type: fileType === 'image' ? 'image' : 'pdf' })}
                            >
                              <DocumentTextIcon className="w-10 h-10 text-red-500 mb-1" />
                              <span className="text-xs text-red-600 font-medium">PDF</span>
                            </div>
                          )}
                          <div className="p-2 bg-white flex items-center justify-between">
                            <label className="text-xs text-gray-600 font-medium truncate">{f.label}</label>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => setPreviewFile({ url: fileUrl, label: f.label, type: fileType === 'image' ? 'image' : 'pdf' })}
                                className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Xem trước"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-gray-500 hover:bg-gray-100 transition-colors"
                                title="Mở tab mới"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }

                  {!vneidScreenshotUrl && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-32 bg-gray-50 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-1">🖼️</span>
                        <span className="text-xs text-gray-500 font-medium px-2 text-center">
                          Chưa tải ảnh VNeID
                        </span>
                      </div>
                      <div className="p-2 bg-white">
                        <label className="text-xs text-gray-600 font-medium truncate">
                          Ảnh chụp màn hình VNeID
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Facebook — cùng grid với các file */}
                  {extraInfo.facebook_link && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-32 bg-blue-50 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-1">👤</span>
                        <span className="text-xs text-blue-500 font-medium px-2 text-center truncate w-full">
                          Facebook
                        </span>
                      </div>
                      <div className="p-2 bg-white flex items-center justify-between">
                        <label className="text-xs text-gray-600 font-medium truncate">Facebook</label>
                        <a
                          href={extraInfo.facebook_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 transition-colors"
                          title="Mở Facebook"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin-only: remaining employee profile sections */}
        {userRole === 'ADMIN' && employeeProfile && (
          <>
            {/* Salary & Contract */}
            {(employeeProfile.basic_salary != null || employeeProfile.contract_type) && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="mr-2">💰</span>
                    Lương & Hợp đồng
                  </span>
                  <button
                    onClick={() => openEdit('emp_salary', {
                      basic_salary: employeeProfile.basic_salary ?? '',
                      allowance: employeeProfile.allowance ?? '',
                      contract_type: employeeProfile.contract_type ?? '',
                      probation_months: employeeProfile.probation_months ?? '',
                      probation_end_date: employeeProfile.probation_end_date ?? '',
                      probation_rate: (employeeProfile as any).probation_rate ?? '',
                    })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa lương & hợp đồng"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
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
                  {employeeProfile.allowance != null && (
                    <div>
                      <label className="text-sm text-gray-600">Phụ cấp</label>
                      <p className="font-medium text-green-700">
                        {Number(employeeProfile.allowance).toLocaleString('vi-VN')} đ
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
                      <p className="font-medium">{formatDate(employeeProfile.probation_end_date)}</p>
                    </div>
                  )}
                  {(employeeProfile as any).probation_rate && (
                    <div>
                      <label className="text-sm text-gray-600">Tỉ lệ thử việc</label>
                      <p className="font-medium">
                        {(employeeProfile as any).probation_rate === 'OPTION_1'
                          ? 'Tháng đầu 85%, tháng sau 100%'
                          : (employeeProfile as any).probation_rate === 'OPTION_2'
                          ? 'Tháng đầu 100%, tháng sau 100%'
                          : (employeeProfile as any).probation_rate}
                      </p>
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
                      <p className="font-medium">{formatDate(employeeProfile.file_submission_deadline)}</p>
                    </div>
                  )}
                  {employeeProfile.file_submission_date && (
                    <div>
                      <label className="text-sm text-gray-600">Ngày nộp hồ sơ</label>
                      <p className="font-medium">{formatDate(employeeProfile.file_submission_date)}</p>
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
            {/* Thông tin người liên hệ khẩn cấp */}
            {(employeeProfile as any).emergency_contact_name && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🆘</span>
                  Thông tin người liên hệ khẩn cấp
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Họ và tên</label>
                    <p className="font-medium">{(employeeProfile as any).emergency_contact_name || 'Chưa có dữ liệu'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Mối quan hệ</label>
                    <p className="font-medium">{(employeeProfile as any).emergency_contact_relationship || 'Chưa có dữ liệu'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Số điện thoại</label>
                    <p className="font-medium">{(employeeProfile as any).emergency_contact_phone || 'Chưa có dữ liệu'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ngày sinh</label>
                    <p className="font-medium">
                      {(employeeProfile as any).emergency_contact_dob
                        ? formatDate((employeeProfile as any).emergency_contact_dob)
                        : 'Chưa có dữ liệu'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nghề nghiệp</label>
                    <p className="font-medium">{(employeeProfile as any).emergency_contact_occupation || 'Chưa có dữ liệu'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ</label>
                    <p className="font-medium">{(employeeProfile as any).emergency_contact_address || 'Chưa có dữ liệu'}</p>
                  </div>
                </div>
              </div>
            )}
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
      </div>
    );
  };

  // ============================================
  // EDIT MODAL
  // ============================================

  const renderEditModal = () => {
    if (!editSection) return null;

    const sectionTitles: Record<EditSection, string> = {
      employee_info: 'Sửa thông tin nhân viên',
      job: 'Sửa thông tin công việc',
      personal: 'Sửa giấy tờ tùy thân & địa chỉ',
      education: 'Sửa trình độ học vấn',
      financial: 'Sửa thông tin tài chính & ngân hàng',
      emp_cccd: 'Sửa thông tin CCCD / Giấy tờ tùy thân',
      emp_salary: 'Sửa lương & hợp đồng',
    };

    // Helper để render EditField ngắn gọn hơn
    const ef = (
      label: string,
      name: string,
      type?: string,
      options?: { value: string; label: string }[],
      readOnly?: boolean,
    ) => (
      <EditField
        key={name}
        label={label}
        name={name}
        type={type}
        options={options}
        readOnly={readOnly}
        editData={editData}
        onChange={handleEditFieldChange}
      />
    );

    const renderFields = () => {
      switch (editSection) {

        // ── Thông tin nhân viên ──
        case 'employee_info':
          return (
            <div className="space-y-4">
              {ef('Mã nhân viên', 'employee_id', 'text', undefined, true)}
              {ef('Họ và tên', 'full_name')}
              {ef('Email cá nhân', 'personal_email', 'email')}
              {ef('Số điện thoại', 'phone_number')}
              {ef('Giới tính', 'gender', undefined, [
                { value: 'M', label: 'Nam' },
                { value: 'F', label: 'Nữ' },
                { value: 'O', label: 'Khác' },
              ])}
              {ef('Ngày sinh', 'date_of_birth', 'date')}
              {ef('Dân tộc', 'ethnicity')}
              {ef('Quốc tịch', 'nationality')}
              {ef('Tình trạng hôn nhân', 'marital_status', undefined, [
                { value: 'SINGLE', label: 'Độc thân' },
                { value: 'MARRIED', label: 'Đã kết hôn' },
                { value: 'DIVORCED', label: 'Ly hôn' },
                { value: 'WIDOWED', label: 'Góa' },
              ])}
            </div>
          );

        // ── Thông tin công việc ──
        case 'job':
          const departmentSelectOptions = withCurrentOption(
            allDepartments.map(dep => ({ value: String(dep.id), label: dep.name })),
            editData.department_id
          );
          const positionSelectOptions = withCurrentOption(
            allPositions.map(pos => ({ value: String(pos.id), label: pos.title })),
            editData.position_id
          );
          return (
            <div className="space-y-4">
              {ef('Phòng ban', 'department_id', undefined, departmentSelectOptions)}
              {ef('Vị trí', 'position_id', undefined, positionSelectOptions)}
              {ef('Cấp bậc', 'rank')}
              {ef('Bộ phận', 'section', undefined, withCurrentOption(allDepartments.map(dep => ({ value: dep.name, label: dep.name })), editData.section))}
              {ef('Team Bác sĩ', 'doctor_team')}
              {ef('Hình thức làm việc', 'work_form', undefined, [
                { value: 'FULL_TIME', label: 'Full-time' },
                { value: 'PART_TIME', label: 'Part-time' },
              ])}
              {ef('Vùng/Miền', 'region', undefined, [
                { value: 'Miền Bắc', label: 'Miền Bắc' },
                { value: 'Miền Nam', label: 'Miền Nam' },
              ])}
              {ef('Khối', 'block', undefined, [
                { value: 'Khối Back office', label: 'Khối Back office' },
                { value: 'Khối Marketing', label: 'Khối Marketing' },
                { value: 'Khối Kinh doanh', label: 'Khối Kinh doanh' },
              ])}
              {ef('Trạng thái làm việc', 'employment_status', undefined, [
                { value: 'ACTIVE', label: 'Đang làm việc' },
                { value: 'PAUSED', label: 'Tạm dừng' },
                { value: 'INACTIVE', label: 'Đã nghỉ' },
              ])}
              {ef('Ghi chú tình trạng công việc', 'employment_status_notes', 'textarea')}
              {ef('Ngày bắt đầu làm việc', 'start_date', 'date')}
            </div>
          );

        // ── Giấy tờ tùy thân & địa chỉ ──
        // Phải khớp với các field hiển thị trong section: cccd_number, cccd_issue_date,
        // cccd_issue_place, birth_place, social_insurance_number, tax_code,
        // permanent_residence, current_address
        case 'personal':
          return (
            <div className="space-y-4">
              {ef('Số CCCD', 'cccd_number')}
              {ef('Ngày cấp CCCD', 'cccd_issue_date', 'date')}
              {ef('Nơi cấp CCCD', 'cccd_issue_place', undefined, CCCD_ISSUE_PLACE_OPTIONS)}
              {ef('Nơi đăng ký khai sinh', 'birth_place')}
              {ef('Mã số BHXH', 'social_insurance_number')}
              {ef('Mã số thuế', 'tax_code')}
              {ef('Địa chỉ thường trú', 'permanent_residence', 'textarea')}
              {ef('Địa chỉ hiện tại', 'current_address', 'textarea')}
            </div>
          );

        // ── Trình độ học vấn ──
        case 'education':
          return (
            <div className="space-y-4">
              {ef('Trình độ học vấn', 'education_level')}
              {ef('Trường đại học / cao đẳng', 'university')}
              {ef('Chuyên ngành', 'major')}
              {ef('Năm tốt nghiệp', 'graduation_year', 'number')}
            </div>
          );

        // ── Thông tin tài chính & ngân hàng ──
        case 'financial':
          return (
            <div className="space-y-4">
              {ef('Ngân hàng', 'bank_name')}
              {ef('Số tài khoản', 'bank_account')}
              {ef('Chủ tài khoản', 'bank_account_holder')}
              {ef('Chi nhánh', 'bank_branch')}
            </div>
          );

        // ── CCCD (không dùng trực tiếp trong UI hiện tại nhưng giữ lại) ──
        case 'emp_cccd':
          return (
            <div className="space-y-4">
              {ef('Số CCCD', 'cccd_number')}
              {ef('Ngày cấp CCCD', 'cccd_issue_date', 'date')}
              {ef('Nơi cấp CCCD', 'cccd_issue_place', undefined, CCCD_ISSUE_PLACE_OPTIONS)}
              {ef('Nơi sinh', 'birth_place')}
              {ef('Địa chỉ thường trú', 'permanent_residence', 'textarea')}
            </div>
          );

        // ── Lương & Hợp đồng ──
        // Phải khớp với openEdit('emp_salary'): basic_salary, allowance, contract_type,
        // probation_months, probation_end_date, probation_rate, bank_name, bank_account
        case 'emp_salary':
          return (
            <div className="space-y-4">
              {ef('Lương cơ bản', 'basic_salary', 'number')}
              {ef('Phụ cấp', 'allowance', 'number')}
              {ef('Loại hợp đồng', 'contract_type', undefined, CONTRACT_OPTIONS)}
              {ef('Thời gian thử việc (tháng)', 'probation_months', 'number')}
              {ef('Ngày kết thúc thử việc', 'probation_end_date', 'date')}
              {ef('Tỉ lệ thử việc', 'probation_rate', undefined, PROBATION_RATE_OPTIONS)}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h4 className="font-semibold text-gray-900">{sectionTitles[editSection]}</h4>
            <button
              onClick={() => setEditSection(null)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {renderFields()}
          </div>
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t">
            <button
              onClick={() => setEditSection(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
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
              {onboarding.position?.title || 'Chưa có dữ liệu'} - {onboarding.department?.name || 'Chưa có dữ liệu'}
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

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                {previewFile.label}
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Mở tab mới
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 min-h-0">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.label}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={previewFile.url}
                  title={previewFile.label}
                  className="w-full h-full min-h-[70vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {renderEditModal()}
    </div>
  );
};

export default OnboardingDetail;