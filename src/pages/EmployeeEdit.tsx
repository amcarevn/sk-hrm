import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  employeesAPI,
  departmentsAPI,
  positionsAPI,
  EmployeeUpdateData,
} from '../utils/api';
import { SelectBox } from '@/components/LandingLayout/SelectBox';
import { WORK_LOCATION_OPTIONS } from '../constants/onboarding';
import onboardingService from '../services/onboarding.service';

// ============================================
// CONSTANTS
// ============================================

const GENDER_OPTIONS = [
  { label: 'Nam', value: 'M' },
  { label: 'Nữ', value: 'F' },
  { label: 'Khác', value: 'O' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Đang làm việc', value: 'ACTIVE' },
  { label: 'Tạm dừng', value: 'SUSPENDED' },
  { label: 'Đã nghỉ', value: 'INACTIVE' },
];

const MARITAL_STATUS_OPTIONS = [
  { label: 'Độc thân', value: 'SINGLE' },
  { label: 'Đã kết hôn', value: 'MARRIED' },
  { label: 'Ly hôn', value: 'DIVORCED' },
  { label: 'Góa', value: 'WIDOWED' },
];

const WORK_FORM_OPTIONS = [
  { label: 'Toàn thời gian', value: 'FULL_TIME' },
  { label: 'Bán thời gian', value: 'PART_TIME' },
  { label: 'Hợp đồng', value: 'CONTRACT' },
  { label: 'Thực tập', value: 'INTERN' },
  { label: 'Cộng tác viên', value: 'COLLABORATOR' },
];

const REGION_OPTIONS = [
  { label: 'Miền Bắc', value: 'Miền Bắc' },
  { label: 'Miền Nam', value: 'Miền Nam' },
];

const BLOCK_OPTIONS = [
  { label: 'Khối Back office', value: 'Khối Back office' },
  { label: 'Khối Marketing', value: 'Khối Marketing' },
  { label: 'Khối Kinh doanh', value: 'Khối Kinh doanh' },
];

const CONTRACT_TYPE_OPTIONS = [
  { label: 'Hợp đồng thử việc', value: 'PROBATION' },
  { label: 'Hợp đồng thực tập sinh', value: 'INTERN' },
  { label: 'Hợp đồng cộng tác viên', value: 'COLLABORATOR' },
  { label: 'Hợp đồng lao động 12 tháng', value: 'ONE_YEAR' },
  { label: 'Hợp đồng lao động 24 tháng', value: 'TWO_YEAR' },
  { label: 'Hợp đồng vô thời hạn', value: 'INDEFINITE' },
  { label: 'Hợp đồng dịch vụ', value: 'SERVICE' },
];

const PROBATION_RATE_OPTIONS = [
  { label: 'Tháng đầu 85%, tháng sau 100%', value: 'OPTION_1' },
  { label: 'Tháng đầu 100%, tháng sau 100%', value: 'OPTION_2' },
];

const PROBATION_SALARY_PERCENTAGE_OPTIONS = [
  { label: 'Không thử việc', value: '0' },
  { label: '85%', value: '85' },
  { label: '90%', value: '90' },
  { label: '95%', value: '95' },
  { label: '100%', value: '100' },
];

const CCCD_ISSUE_PLACE_OPTIONS = [
  { label: 'Cục cảnh sát Quản lý hành chính về Trật tự xã hội', value: 'POLICE_ADMIN' },
  { label: 'Bộ Công An', value: 'MINISTRY_PUBLIC_SECURITY' },
];

const FILE_STATUS_OPTIONS = [
  { label: 'Nộp đủ', value: 'COMPLETE' },
  { label: 'Cần bổ sung hồ sơ', value: 'NEED_SUPPLEMENT' },
  { label: 'Chưa nộp', value: 'NOT_SUBMITTED' },
  { label: 'Chờ rà soát', value: 'PENDING_REVIEW' },
];

const EDUCATION_LEVEL_OPTIONS = [
  { label: 'Trung học phổ thông', value: 'HIGH_SCHOOL' },
  { label: 'Cao đẳng', value: 'ASSOCIATE' },
  { label: 'Đại học', value: 'BACHELOR' },
  { label: 'Thạc sĩ', value: 'MASTER' },
  { label: 'Tiến sĩ', value: 'DOCTORATE' },
  { label: 'Khác', value: 'OTHER' },
];

// ============================================
// HELPER COMPONENTS
// ============================================

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
    <span>{icon}</span>
    {title}
  </h2>
);

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";

// ============================================
// MAIN COMPONENT
// ============================================

const EmployeeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [originalExtraInfo, setOriginalExtraInfo] = useState<Record<string, any>>({});
  const [vneidFile, setVneidFile] = useState<File | null>(null);
  const [vneidCurrentUrl, setVneidCurrentUrl] = useState<string | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [diplomaCurrentUrl, setDiplomaCurrentUrl] = useState<string | null>(null);
  const [citizenIdFile, setCitizenIdFile] = useState<File | null>(null);
  const [citizenIdCurrentUrl, setCitizenIdCurrentUrl] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    // Thông tin cơ bản
    employee_id: '',
    full_name: '',
    gender: 'M',
    date_of_birth: '',
    phone_number: '',
    personal_email: '',
    ethnicity: '',
    nationality: '',
    marital_status: '',
    facebook_link: '',

    // Thông tin công việc
    employment_status: 'ACTIVE',
    start_date: '',
    end_date: '',
    position_id: undefined,
    department_id: undefined,
    manager_id: undefined,
    rank: '',
    section: '',
    doctor_team: '',
    work_form: '',
    work_type: '',
    work_location: '',
    region: '',
    block: '',
    is_hr: false,
    education_level: '',

    // Giấy tờ tùy thân
    cccd_number: '',
    cccd_issue_date: '',
    cccd_issue_place: '',
    old_id_number: '',
    birth_place: '',
    social_insurance_number: '',
    tax_code: '',
    permanent_residence: '',
    current_address: '',

    // Ngân hàng
    bank_name: '',
    bank_account: '',
    bank_branch: '',

    // Lương & Hợp đồng
    basic_salary: '',
    allowance: '',
    contract_type: '',
    probation_months: '',
    probation_end_date: '',
    probation_rate: '',
    probation_salary_percentage: '',

    // Hồ sơ
    file_status: '',
    file_submission_deadline: '',
    file_review_notes: '',

    // Người liên hệ khẩn cấp
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_dob: '',
    emergency_contact_occupation: '',
    emergency_contact_address: '',
  });

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
      const emp = await employeesAPI.getById(employeeId);
      const e = emp as any;
      // Parse extra_info 1 lần — fallback cho các field có thể được lưu ở extra_info
      const ei: Record<string, any> = (() => {
        try {
          return typeof e.extra_info === 'string'
            ? JSON.parse(e.extra_info || '{}')
            : (e.extra_info || {});
        } catch { return {}; }
      })();
      setOriginalExtraInfo(ei);
      setFormData({
        employee_id: e.employee_id || '',
        full_name: e.full_name || '',
        gender: e.gender || 'M',
        date_of_birth: e.date_of_birth || '',
        phone_number: e.phone_number || '',
        personal_email: e.personal_email || '',
        ethnicity: e.ethnicity || '',
        nationality: e.nationality || '',
        marital_status: e.marital_status || '',
        facebook_link: e.facebook_link || ei.facebook_link || '',

        employment_status: e.employment_status || 'ACTIVE',
        start_date: e.start_date || '',
        end_date: e.end_date || '',
        position_id: e.position?.id,
        department_id: e.department?.id,
        manager_id: typeof e.manager === 'number' ? e.manager : e.manager?.id,
        rank: e.rank || '',
        section: e.section || '',
        doctor_team: e.doctor_team || '',
        work_form: e.work_form || '',
        work_type: ei.work_type || '',
        work_location: e.work_location || '',
        region: e.region || '',
        block: e.block || '',
        is_hr: e.is_hr || false,
        education_level: e.education_level || '',

        cccd_number: e.cccd_number || '',
        cccd_issue_date: e.cccd_issue_date || '',
        cccd_issue_place: e.cccd_issue_place || '',
        old_id_number: e.old_id_number || ei.old_id_number || '',
        birth_place: e.birth_place || '',
        social_insurance_number: e.social_insurance_number || '',
        tax_code: e.tax_code || '',
        permanent_residence: e.permanent_residence || '',
        current_address: e.current_address || '',

        bank_name: e.bank_name || '',
        bank_account: e.bank_account || '',
        bank_branch: e.bank_branch || '',

        basic_salary: e.basic_salary ?? '',
        allowance: e.allowance ?? '',
        contract_type: e.contract_type || '',
        probation_months: e.probation_months ?? '',
        probation_end_date: e.probation_end_date || '',
        probation_rate: e.probation_rate || '',
        probation_salary_percentage: e.probation_salary_percentage != null ? String(e.probation_salary_percentage) : '',

        file_status: e.file_status || '',
        file_submission_deadline: e.file_submission_deadline || '',
        file_review_notes: e.file_review_notes || '',

        emergency_contact_name: e.emergency_contact_name || '',
        emergency_contact_relationship: e.emergency_contact_relationship || '',
        emergency_contact_phone: e.emergency_contact_phone || '',
        emergency_contact_dob: e.emergency_contact_dob || '',
        emergency_contact_occupation: e.emergency_contact_occupation || '',
        emergency_contact_address: e.emergency_contact_address || '',
      });
      setVneidCurrentUrl(e.vneid_screenshot_url || (e.vneid_screenshot ? String(e.vneid_screenshot) : null));
      setVneidFile(null);
      setDiplomaCurrentUrl(e.diploma_file_url || null);
      setDiplomaFile(null);
      setCitizenIdCurrentUrl(e.citizen_id_file_url || null);
      setCitizenIdFile(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhân viên');
    } finally {
      setLoadingEmployee(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.list();
      setDepartments(response.results);
    } catch (err) { console.error('Failed to load departments:', err); }
  };

  const loadPositions = async () => {
    try {
      const response = await positionsAPI.list();
      setPositions(response.results);
    } catch (err) { console.error('Failed to load positions:', err); }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.list({ page_size: 1000 });
      setEmployees(response.results);
    } catch (err) { console.error('Failed to load employees:', err); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
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

      const payload: any = {
        employee_id: formData.employee_id.trim(),
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        employment_status: formData.employment_status,
        is_hr: formData.is_hr,
      };

      // Helper: only add if not empty
      const add = (key: string, val: any) => {
        if (val !== '' && val !== null && val !== undefined) payload[key] = val;
      };

      add('date_of_birth', formData.date_of_birth);
      add('phone_number', formData.phone_number?.trim());
      add('personal_email', formData.personal_email?.trim());
      add('ethnicity', formData.ethnicity?.trim());
      add('nationality', formData.nationality?.trim());
      add('marital_status', formData.marital_status);
      add('facebook_link', formData.facebook_link?.trim());

      add('start_date', formData.start_date);
      add('end_date', formData.end_date);
      add('position_id', formData.position_id);
      add('department_id', formData.department_id);
      if (formData.manager_id !== undefined) payload['manager_id'] = formData.manager_id;
      add('rank', formData.rank?.trim());
      add('section', formData.section?.trim());
      add('doctor_team', formData.doctor_team?.trim());
      add('work_form', formData.work_form);
      add('work_location', formData.work_location);
      add('region', formData.region);
      add('block', formData.block);

      // Merge extra_info — lưu work_type, đồng thời xóa facebook_link (đã PATCH trực tiếp)
      // để tránh lệch giữa direct field và extra_info
      {
        const nextExtra = {
          ...originalExtraInfo,
          work_type: formData.work_type?.trim() || undefined,
          facebook_link: undefined,
        };
        payload['extra_info'] = JSON.stringify(nextExtra);
      }
      add('education_level', formData.education_level);

      add('cccd_number', formData.cccd_number?.trim());
      add('cccd_issue_date', formData.cccd_issue_date);
      add('cccd_issue_place', formData.cccd_issue_place);
      add('old_id_number', formData.old_id_number?.trim());
      add('birth_place', formData.birth_place?.trim());
      add('social_insurance_number', formData.social_insurance_number?.trim());
      add('tax_code', formData.tax_code?.trim());
      add('permanent_residence', formData.permanent_residence?.trim());
      add('current_address', formData.current_address?.trim());

      add('bank_name', formData.bank_name?.trim());
      add('bank_account', formData.bank_account?.trim());
      add('bank_branch', formData.bank_branch?.trim());

      if (formData.basic_salary !== '') payload['basic_salary'] = Number(formData.basic_salary);
      if (formData.allowance !== '') payload['allowance'] = Number(formData.allowance);
      add('contract_type', formData.contract_type);
      if (formData.probation_months !== '') payload['probation_months'] = Number(formData.probation_months);
      add('probation_end_date', formData.probation_end_date);
      add('probation_rate', formData.probation_rate);
      if (formData.probation_salary_percentage !== '') payload['probation_salary_percentage'] = Number(formData.probation_salary_percentage);

      add('file_status', formData.file_status);
      add('file_submission_deadline', formData.file_submission_deadline);
      add('file_review_notes', formData.file_review_notes?.trim());

      add('emergency_contact_name', formData.emergency_contact_name?.trim());
      add('emergency_contact_relationship', formData.emergency_contact_relationship?.trim());
      add('emergency_contact_phone', formData.emergency_contact_phone?.trim());
      add('emergency_contact_dob', formData.emergency_contact_dob);
      add('emergency_contact_occupation', formData.emergency_contact_occupation?.trim());
      add('emergency_contact_address', formData.emergency_contact_address?.trim());

      await employeesAPI.update(parseInt(id!), payload);

      // Upload VNeID screenshot nếu admin chọn file mới (field thuộc Employee)
      if (vneidFile && formData.employee_id) {
        const fd = new FormData();
        fd.append('vneid_screenshot', vneidFile);
        await employeesAPI.uploadFilesByEmployeeId(formData.employee_id, fd);
      }

      // Upload các file thuộc OnboardingProcess qua employee_id
      const onboardingFd = new FormData();
      if (diplomaFile) onboardingFd.append('diploma_file', diplomaFile);
      if (citizenIdFile) onboardingFd.append('citizen_id_file', citizenIdFile);
      if ([...onboardingFd.keys()].length > 0 && formData.employee_id) {
        await onboardingService.superAdminUploadFilesByEmployeeId(formData.employee_id, onboardingFd);
      }

      setSuccess('Cập nhật nhân viên thành công!');
      setTimeout(() => navigate(`/dashboard/employees/${id}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật nhân viên');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin nhân viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/dashboard/employees/${id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
        >
          ← Quay lại chi tiết
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa nhân viên</h1>
        <p className="text-gray-600 mt-1">Cập nhật thông tin nhân viên</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Thông tin cá nhân ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="👤" title="Thông tin cá nhân" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Mã nhân viên" required>
              <input type="text" name="employee_id" value={formData.employee_id}
                onChange={handleInput} placeholder="NV001" className={inputClass} required />
            </Field>

            <Field label="Họ và tên" required>
              <input type="text" name="full_name" value={formData.full_name}
                onChange={handleInput} placeholder="Nguyễn Văn A" className={inputClass} required />
            </Field>

            <SelectBox
              label="Giới tính *"
              value={formData.gender}
              placeholder="Chọn giới tính"
              options={GENDER_OPTIONS}
              onChange={(v) => handleSelect('gender', v)}
            />

            <Field label="Ngày sinh">
              <input type="date" name="date_of_birth" value={formData.date_of_birth}
                onChange={handleInput} className={inputClass} />
            </Field>

            <Field label="Số điện thoại">
              <input type="tel" name="phone_number" value={formData.phone_number}
                onChange={handleInput} placeholder="0987654321" className={inputClass} />
            </Field>

            <Field label="Email cá nhân">
              <input type="email" name="personal_email" value={formData.personal_email}
                onChange={handleInput} placeholder="example@gmail.com" className={inputClass} />
            </Field>

            <Field label="Dân tộc">
              <input type="text" name="ethnicity" value={formData.ethnicity}
                onChange={handleInput} placeholder="Kinh, Tày, Mường..." className={inputClass} />
            </Field>

            <Field label="Quốc tịch">
              <input type="text" name="nationality" value={formData.nationality}
                onChange={handleInput} placeholder="Việt Nam..." className={inputClass} />
            </Field>

            <SelectBox
              label="Tình trạng hôn nhân"
              value={formData.marital_status}
              placeholder="Chọn tình trạng"
              options={MARITAL_STATUS_OPTIONS}
              onChange={(v) => handleSelect('marital_status', v)}
            />

            <Field label="Link Facebook">
              <input type="url" name="facebook_link" value={formData.facebook_link}
                onChange={handleInput} placeholder="https://facebook.com/..." className={inputClass} />
            </Field>

            <SelectBox
              label="Trình độ học vấn"
              value={formData.education_level}
              placeholder="Chọn trình độ"
              options={EDUCATION_LEVEL_OPTIONS}
              onChange={(v) => handleSelect('education_level', v)}
            />
          </div>
        </div>

        {/* ── Thông tin công việc ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="💼" title="Thông tin công việc" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectBox
              label="Trạng thái làm việc"
              value={formData.employment_status}
              placeholder="Chọn trạng thái"
              options={EMPLOYMENT_STATUS_OPTIONS}
              onChange={(v) => handleSelect('employment_status', v)}
            />

            <Field label="Ngày bắt đầu">
              <input type="date" name="start_date" value={formData.start_date}
                onChange={handleInput} className={inputClass} />
            </Field>

            <Field label="Ngày nghỉ việc">
              <input type="date" name="end_date" value={formData.end_date}
                onChange={handleInput} className={inputClass} />
            </Field>

            <SelectBox
              label="Phòng ban"
              value={formData.department_id}
              placeholder="Chọn phòng ban"
              options={departments.map((d) => ({ label: d.name, value: d.id }))}
              onChange={(v) => handleSelect('department_id', v)}
            />

            <SelectBox
              label="Chức vụ"
              value={formData.position_id}
              placeholder="Chọn chức vụ"
              options={positions.map((p) => ({ label: p.title, value: p.id }))}
              onChange={(v) => handleSelect('position_id', v)}
            />

            <SelectBox
              label="Quản lý trực tiếp"
              value={formData.manager_id}
              placeholder="Chọn quản lý"
              options={[
                { label: 'Không có quản lý', value: null },
                ...employees
                  .filter((emp) => emp.id !== parseInt(id!))
                  .map((emp) => ({
                    label: `${emp.full_name} (${emp.employee_id})`,
                    value: emp.id,
                  })),
              ]}
              onChange={(v) => handleSelect('manager_id', v ?? undefined)}
            />

            <Field label="Cấp bậc">
              <input type="text" name="rank" value={formData.rank}
                onChange={handleInput} placeholder="Nhân viên, Trưởng phòng..." className={inputClass} />
            </Field>

            <Field label="Bộ phận (Section)">
              <input type="text" name="section" value={formData.section}
                onChange={handleInput} placeholder="Da liễu, Phẫu thuật..." className={inputClass} />
            </Field>

            <Field label="Team Bác sĩ">
              <input type="text" name="doctor_team" value={formData.doctor_team}
                onChange={handleInput} placeholder="Team Dr. Nguyễn..." className={inputClass} />
            </Field>

            <SelectBox
              label="Hình thức làm việc"
              value={formData.work_form}
              placeholder="Chọn hình thức"
              options={WORK_FORM_OPTIONS}
              onChange={(v) => handleSelect('work_form', v)}
            />

            <Field label="Loại hình làm việc">
              <input type="text" name="work_type" value={formData.work_type}
                onChange={handleInput} placeholder="Full-time, Part-time, ..." className={inputClass} />
            </Field>

            <SelectBox
              label="Địa điểm làm việc"
              value={formData.work_location}
              placeholder="Chọn địa điểm"
              options={WORK_LOCATION_OPTIONS}
              onChange={(v) => handleSelect('work_location', v)}
            />

            <SelectBox
              label="Vùng/Miền"
              value={formData.region}
              placeholder="Chọn vùng/miền"
              options={REGION_OPTIONS}
              onChange={(v) => handleSelect('region', v)}
            />

            <SelectBox
              label="Khối"
              value={formData.block}
              placeholder="Chọn khối"
              options={BLOCK_OPTIONS}
              onChange={(v) => handleSelect('block', v)}
            />

            <div className="md:col-span-2">
              <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={formData.is_hr}
                  onChange={(e) => handleSelect('is_hr', e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Nhân viên HR</p>
                  <p className="text-xs text-gray-500 mt-0.5">Có quyền duyệt đơn và truy cập các chức năng quản lý nhân sự</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Giấy tờ tùy thân & địa chỉ ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="🪪" title="Giấy tờ tùy thân & địa chỉ" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Số CCCD">
              <input type="text" name="cccd_number" value={formData.cccd_number}
                onChange={handleInput} placeholder="012345678901" className={inputClass} />
            </Field>

            <Field label="Ngày cấp CCCD">
              <input type="date" name="cccd_issue_date" value={formData.cccd_issue_date}
                onChange={handleInput} className={inputClass} />
            </Field>

            <SelectBox
              label="Nơi cấp CCCD"
              value={formData.cccd_issue_place}
              placeholder="Chọn nơi cấp"
              options={CCCD_ISSUE_PLACE_OPTIONS}
              onChange={(v) => handleSelect('cccd_issue_place', v)}
            />

            <Field label="Số CMND cũ">
              <input type="text" name="old_id_number" value={formData.old_id_number}
                onChange={handleInput} placeholder="123456789" className={inputClass} />
            </Field>

            <Field label="Nơi đăng ký khai sinh">
              <input type="text" name="birth_place" value={formData.birth_place}
                onChange={handleInput} placeholder="Tỉnh/thành phố..." className={inputClass} />
            </Field>

            <Field label="Mã số BHXH">
              <input type="text" name="social_insurance_number" value={formData.social_insurance_number}
                onChange={handleInput} placeholder="1234567890" className={inputClass} />
            </Field>

            <Field label="Mã số thuế">
              <input type="text" name="tax_code" value={formData.tax_code}
                onChange={handleInput} placeholder="0123456789" className={inputClass} />
            </Field>

            <div className="md:col-span-2">
              <Field label="Địa chỉ thường trú">
                <textarea name="permanent_residence" value={formData.permanent_residence}
                  onChange={handleInput} rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className={textareaClass} />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Địa chỉ hiện tại">
                <textarea name="current_address" value={formData.current_address}
                  onChange={handleInput} rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className={textareaClass} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Thông tin ngân hàng ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="💳" title="Thông tin ngân hàng" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Tên ngân hàng">
              <input type="text" name="bank_name" value={formData.bank_name}
                onChange={handleInput} placeholder="ACB, Vietcombank..." className={inputClass} />
            </Field>

            <Field label="Số tài khoản">
              <input type="text" name="bank_account" value={formData.bank_account}
                onChange={handleInput} placeholder="1234567890" className={inputClass} />
            </Field>

            <Field label="Chi nhánh">
              <input type="text" name="bank_branch" value={formData.bank_branch}
                onChange={handleInput} placeholder="Chi nhánh Hà Nội..." className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">* Trong trường hợp không phải Ngân hàng ACB</p>
            </Field>
          </div>
        </div>

        {/* ── Lương & Hợp đồng ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="💰" title="Lương & Hợp đồng" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Lương cơ bản (VNĐ)">
              <input type="number" name="basic_salary" value={formData.basic_salary}
                onChange={handleInput} placeholder="10000000" className={inputClass} />
            </Field>

            <Field label="Phụ cấp (VNĐ)">
              <input type="number" name="allowance" value={formData.allowance}
                onChange={handleInput} placeholder="2000000" className={inputClass} />
            </Field>

            <SelectBox
              label="Loại hợp đồng"
              value={formData.contract_type}
              placeholder="Chọn loại hợp đồng"
              options={CONTRACT_TYPE_OPTIONS}
              onChange={(v) => handleSelect('contract_type', v)}
            />

            <Field label="Số tháng thử việc">
              <input type="number" name="probation_months" value={formData.probation_months}
                onChange={handleInput} placeholder="2" className={inputClass} />
            </Field>

            <Field label="Ngày kết thúc thử việc">
              <input type="date" name="probation_end_date" value={formData.probation_end_date}
                onChange={handleInput} className={inputClass} />
            </Field>

            <SelectBox
              label="Tỉ lệ thử việc"
              value={formData.probation_rate}
              placeholder="Chọn tỉ lệ"
              options={PROBATION_RATE_OPTIONS}
              onChange={(v) => handleSelect('probation_rate', v)}
            />

            <SelectBox
              label="% lương thử việc"
              value={formData.probation_salary_percentage}
              placeholder="Chọn %"
              options={PROBATION_SALARY_PERCENTAGE_OPTIONS}
              onChange={(v) => handleSelect('probation_salary_percentage', v)}
            />
          </div>
        </div>

        {/* ── Trạng thái hồ sơ ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="📋" title="Trạng thái hồ sơ" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectBox
              label="Trạng thái hồ sơ"
              value={formData.file_status}
              placeholder="Chọn trạng thái"
              options={FILE_STATUS_OPTIONS}
              onChange={(v) => handleSelect('file_status', v)}
            />

            <Field label="Hạn nộp hồ sơ">
              <input type="date" name="file_submission_deadline" value={formData.file_submission_deadline}
                onChange={handleInput} className={inputClass} />
            </Field>

            <div className="md:col-span-2">
              <Field label="Ghi chú hồ sơ">
                <textarea name="file_review_notes" value={formData.file_review_notes}
                  onChange={handleInput} rows={2}
                  placeholder="Ghi chú về tình trạng hồ sơ..."
                  className={textareaClass} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Người liên hệ khẩn cấp ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="🆘" title="Người liên hệ khẩn cấp" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Họ và tên">
              <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name}
                onChange={handleInput} placeholder="Nguyễn Văn B" className={inputClass} />
            </Field>

            <Field label="Mối quan hệ">
              <input type="text" name="emergency_contact_relationship" value={formData.emergency_contact_relationship}
                onChange={handleInput} placeholder="Bố, mẹ, vợ, chồng..." className={inputClass} />
            </Field>

            <Field label="Số điện thoại">
              <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone}
                onChange={handleInput} placeholder="0987654321" className={inputClass} />
            </Field>

            <Field label="Ngày sinh">
              <input type="date" name="emergency_contact_dob" value={formData.emergency_contact_dob}
                onChange={handleInput} className={inputClass} />
            </Field>

            <Field label="Nghề nghiệp">
              <input type="text" name="emergency_contact_occupation" value={formData.emergency_contact_occupation}
                onChange={handleInput} placeholder="Giáo viên, Bác sĩ..." className={inputClass} />
            </Field>

            <div className="md:col-span-2">
              <Field label="Địa chỉ">
                <textarea name="emergency_contact_address" value={formData.emergency_contact_address}
                  onChange={handleInput} rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className={textareaClass} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Hồ sơ đính kèm ── */}
        <div className="bg-white rounded-lg border p-6">
          <SectionTitle icon="📎" title="Hồ sơ đính kèm" />
          <p className="text-xs text-gray-500 mb-3">
            Chọn file mới để thay thế. Bỏ trống ô nào thì giữ nguyên.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(() => {
              const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);
              const rows: {
                label: string;
                file: File | null;
                setFile: (f: File | null) => void;
                currentUrl: string | null;
                accept: string;
              }[] = [
                { label: 'Bằng cấp', file: diplomaFile, setFile: setDiplomaFile, currentUrl: diplomaCurrentUrl, accept: 'image/*,application/pdf' },
                { label: 'File CMND/CCCD', file: citizenIdFile, setFile: setCitizenIdFile, currentUrl: citizenIdCurrentUrl, accept: 'image/*,application/pdf' },
                { label: 'Ảnh chụp VNeID', file: vneidFile, setFile: setVneidFile, currentUrl: vneidCurrentUrl, accept: 'image/*' },
              ];
              return rows.map(r => (
                <div key={r.label} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{r.label}</label>
                    {r.currentUrl && !r.file && (
                      <a
                        href={r.currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Xem file hiện tại
                      </a>
                    )}
                  </div>
                  {r.currentUrl && !r.file && !isPdf(r.currentUrl) && (
                    <img src={r.currentUrl} alt={r.label} className="max-h-32 object-contain border rounded" />
                  )}
                  {r.currentUrl && !r.file && isPdf(r.currentUrl) && (
                    <div className="h-20 bg-red-50 border border-red-200 rounded flex items-center justify-center gap-2">
                      <span className="text-2xl">📄</span>
                      <span className="text-xs text-red-600 font-medium">PDF hiện tại</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept={r.accept}
                    onChange={(e) => r.setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {r.file && (
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="truncate">📎 {r.file.name} ({(r.file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => r.setFile(null)}
                        className="text-red-600 hover:underline ml-2"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/employees/${id}`)}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEdit;