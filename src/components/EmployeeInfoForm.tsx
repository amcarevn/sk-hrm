import React, { useEffect, useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// ============================================
// TYPE DEFINITIONS
// ============================================

type EmployeeInfoFormData = {
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  date_of_birth: string;
  gender: string;
  education_level: string;
  facebook_link: string;

  position_id: string;
  department_id: string;
  start_date: string;
  region: string;
  block: string;
  sub_department: string;
  section: string;
  team: string;
  job_rank: string;
  doctor_team: string;
  work_form: string;
  work_type: string;
  work_location: string;

  citizen_id: string;
  citizen_id_file: File | null;
  citizen_id_issue_date: string;
  citizen_id_issue_place: string;
  old_id_number: string;

  permanent_address: string;
  current_address: string;
  social_insurance_number: string;
  tax_code: string;
  marital_status: string;

  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  emergency_contact_dob: string;
  emergency_contact_occupation: string;
  emergency_contact_address: string;

  salary: string;
  allowance: string;
  probation_period_months: string;
};

type EmployeeInfoFormProps = {
  onboardingId: number | null;
  isCreatingNew: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};
const WORK_LOCATION_OPTIONS = [
  { value: '789_LE_HONG_PHONG', label: '789/C9 Lê Hồng Phong, Phường 12, Quận 10, Thành phố Hồ Chí Minh' },
  { value: '16_NGUYEN_NHU_DO', label: '16 Nguyễn Như Đổ, Văn Miếu, Đống Đa, Hà Nội' },
  { value: '61_VU_THANH', label: '61 Vũ Thạnh, Ô Chợ Dừa, Đống Đa, Hà Nội' },
  { value: '9_SU_VAN_HANH', label: '9 Sư Vạn Hạnh, Phường 9, Quận 5, Thành phố Hồ Chí Minh' },
  { value: '355_AN_DUONG_VUONG', label: '355 An Dương Vương' },
  { value: '1E_TRUONG_TRINH', label: 'Số 1E Trường Trinh, Hà Nội' },
  { value: '50_TRUNG_PHUNG', label: 'Số 50 Trung Phụng, Hà Nội' },
  { value: '219_TRUNG_KINH', label: 'Số 219 Trung Kính, Cầu Giấy, Hà Nội' },
] as const;
const REGION_OPTIONS = ['Miền Bắc', 'Miền Nam'] as const;
const BLOCK_OPTIONS = ['Khối Back office', 'Khối Marketing', 'Khối Kinh doanh'] as const;
const SUB_DEPARTMENT_OPTIONS = [
  'ADS',
  'ADS2',
  'KD 1',
  'KD 2',
  'KD 3',
  'KD 4',
  'KD MN',
  'CSKH MB',
  'CSKH MN',
  'Media MB',
  'Media MN',
  'Giám sát nội bộ',
  'HCNS',
  'Kế toán',
  'Truyền thông',
  'TTTH 01',
  'TTTH 02',
  'TTTH 03',
  'TTTH 04',
  'TTTH 06',
  'Xây group',
  'TTTH 08',
  'TTTH 05',
  'TTTH 07',
  'TTTH 09',
  'TTTH 10',
  'TTTH 11',
  'Tiktok 1',
  'Tiktok 2',
  'Tiktok 3',
  'Tiktok 5',
  'TTTH 15',
  'Pháp chế',
  'Tiktok 4',
  'KD 5',
  'Mua hàng',
  'Công nghệ thông tin',
  'Tiktok 6',
  'Tiktok 7',
  'Tiktok 8',
  'Tiktok 9',
  'Tiktok 10',
] as const;
const SECTION_OPTIONS = ['Phẫu thuật thẩm mỹ', 'Da liễu'] as const;
const RANK_OPTIONS = ['Nhân viên', 'Trưởng phòng', 'Leader', 'Phó giám đốc', 'Giám đốc', 'Phó phòng'] as const;
const WORK_FORM_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
] as const;
const EDUCATION_LEVEL_OPTIONS = [
  'Thạc sĩ',
  'Cử nhân đại học',
  'Cử nhân cao đẳng',
  'Trung cấp',
  'Khác',
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

const EmployeeInfoForm: React.FC<EmployeeInfoFormProps> = ({
  onboardingId,
  isCreatingNew,
  onSuccess,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: number; title: string }>>([]);

  useEffect(() => {
    if (isCreatingNew) {
      const fetchData = async () => {
        try {
          const [deptRes, posRes] = await Promise.all([
            fetch('http://localhost:8000/api-hrm/departments/', {
              headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            }),
            fetch('http://localhost:8000/api-hrm/positions/', {
              headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            }),
          ]);
          const deptData = await deptRes.json();
          const posData = await posRes.json();
          setDepartments(Array.isArray(deptData) ? deptData : deptData.results || []);
          setPositions(Array.isArray(posData) ? posData : posData.results || []);
        } catch (error) {
          console.error('Error loading departments/positions:', error);
        }
      };
      fetchData();
    }
  }, [isCreatingNew]);

  const [formData, setFormData] = useState<EmployeeInfoFormData>({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    date_of_birth: '',
    gender: 'M',
    education_level: '',
    facebook_link: '',
    position_id: '',
    department_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    region: '',
    block: '',
    sub_department: '',
    section: '',
    team: '',
    job_rank: '',
    doctor_team: '',
    work_form: '',
    work_type: '',
    work_location: '',
    citizen_id: '',
    citizen_id_file: null,
    citizen_id_issue_date: '',
    citizen_id_issue_place: '',
    old_id_number: '',
    permanent_address: '',
    current_address: '',
    social_insurance_number: '',
    tax_code: '',
    marital_status: 'SINGLE',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_dob: '',
    emergency_contact_occupation: '',
    emergency_contact_address: '',
    salary: '',
    allowance: '',
    probation_period_months: '2',
  });

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.candidate_name.trim()) {
          alert('Vui lòng nhập họ và tên');
          return false;
        }
        if (!formData.date_of_birth) {
          alert('Vui lòng chọn ngày sinh');
          return false;
        }
        if (!formData.candidate_phone.trim()) {
          alert('Vui lòng nhập số điện thoại');
          return false;
        }
        // ✅ FIX: Email bắt buộc khi tạo mới (backend cần email để tạo Employee)
        if (isCreatingNew && !formData.candidate_email.trim()) {
          alert('Vui lòng nhập email (bắt buộc để tạo tài khoản nhân viên)');
          return false;
        }
        if (isCreatingNew && !formData.start_date) {
          alert('Vui lòng chọn ngày bắt đầu');
          return false;
        }
        break;
      case 3:
        if (!formData.citizen_id.trim()) {
          alert('Vui lòng nhập số CCCD');
          return false;
        }
        if (!formData.citizen_id_file) {
          alert('Vui lòng upload file CCCD (PDF)');
          return false;
        }
        break;
    }
    return true;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('File CCCD phải là định dạng PDF');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File CCCD không được vượt quá 5MB');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, citizen_id_file: file });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(3)) return;

    setSubmitting(true);

    try {
      const payload = new FormData();

      // ✅ FIX 1: Dùng prop isCreatingNew, KHÔNG khai báo lại biến local
      // (code cũ có bug: const isCreatingNew = onboardingId === null → shadow prop)

      // Thông tin cơ bản
      if (formData.candidate_name) payload.append('candidate_name', formData.candidate_name);
      if (formData.candidate_email) payload.append('candidate_email', formData.candidate_email);
      if (formData.candidate_phone) payload.append('candidate_phone', formData.candidate_phone);
      if (formData.date_of_birth) payload.append('date_of_birth', formData.date_of_birth);
      if (formData.gender) payload.append('gender', formData.gender);
      if (formData.education_level) payload.append('education_level', formData.education_level);
      if (formData.facebook_link) payload.append('facebook_link', formData.facebook_link);

      // ✅ FIX 2: position_id → 'position', department_id → 'department'
      // (backend serializer nhận field tên 'position' và 'department')
      if (formData.position_id) payload.append('position', formData.position_id);
      if (formData.department_id) payload.append('department', formData.department_id);
      if (formData.start_date) payload.append('start_date', formData.start_date);

      if (formData.region) payload.append('region', formData.region);
      if (formData.block) payload.append('block', formData.block);
      if (formData.sub_department) payload.append('sub_department', formData.sub_department);
      if (formData.section) payload.append('section', formData.section);
      if (formData.team) payload.append('team', formData.team);
      if (formData.job_rank) payload.append('rank', formData.job_rank);
      if (formData.doctor_team) payload.append('doctor_team', formData.doctor_team);
      if (formData.work_form) payload.append('work_form', formData.work_form);
      if (formData.work_type) payload.append('work_type', formData.work_type);
      if (formData.work_location) payload.append('work_location', formData.work_location);

      // ✅ FIX 3: citizen_id → 'citizen_id' (backend serializer field là citizen_id,
      // sau đó create() mới lấy để lưu vào Employee.cccd_number)
      if (formData.citizen_id) payload.append('citizen_id', formData.citizen_id);
      if (formData.citizen_id_file) payload.append('citizen_id_file', formData.citizen_id_file);
      if (formData.citizen_id_issue_date) payload.append('citizen_id_issue_date', formData.citizen_id_issue_date);
      if (formData.citizen_id_issue_place) payload.append('citizen_id_issue_place', formData.citizen_id_issue_place);
      if (formData.old_id_number) payload.append('old_id_number', formData.old_id_number);

      if (formData.permanent_address) payload.append('permanent_address', formData.permanent_address);
      if (formData.current_address) payload.append('current_address', formData.current_address);
      if (formData.social_insurance_number) payload.append('social_insurance_number', formData.social_insurance_number);
      if (formData.tax_code) payload.append('tax_code', formData.tax_code);
      if (formData.marital_status) payload.append('marital_status', formData.marital_status);

      if (formData.emergency_contact_name) payload.append('emergency_contact_name', formData.emergency_contact_name);
      if (formData.emergency_contact_relationship) payload.append('emergency_contact_relationship', formData.emergency_contact_relationship);
      if (formData.emergency_contact_phone) payload.append('emergency_contact_phone', formData.emergency_contact_phone);
      if (formData.emergency_contact_dob) payload.append('emergency_contact_dob', formData.emergency_contact_dob);
      if (formData.emergency_contact_occupation) payload.append('emergency_contact_occupation', formData.emergency_contact_occupation);
      if (formData.emergency_contact_address) payload.append('emergency_contact_address', formData.emergency_contact_address);

      if (formData.salary) payload.append('salary', formData.salary);
      if (formData.allowance) payload.append('allowance', formData.allowance);
      if (formData.probation_period_months) payload.append('probation_period_months', formData.probation_period_months);

      // Debug log
      console.log('📤 Payload fields:');
      for (const [k, v] of payload.entries()) {
        console.log(`  ${k}:`, v instanceof File ? `[File: ${v.name}]` : v);
      }

      // ✅ FIX 4: Dùng đúng prop isCreatingNew (KHÔNG tạo biến local mới)
      const url = isCreatingNew
        ? 'http://localhost:8000/api-hrm/onboardings/'
        : `http://localhost:8000/api-hrm/onboardings/${onboardingId}/submit-employee-info/`;

      console.log(`🚀 ${isCreatingNew ? 'CREATE' : 'UPDATE'} → POST ${url}`);

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: payload,
      });

      console.log('📥 Response:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Error:', JSON.stringify(errorData, null, 2));

        // Hiển thị lỗi chi tiết từ backend
        const messages: string[] = [];
        Object.entries(errorData).forEach(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : String(val);
          messages.push(`${field}: ${msg}`);
        });
        alert(messages.length ? `Lỗi:\n${messages.join('\n')}` : 'Lưu thất bại. Kiểm tra console để xem chi tiết.');
        return;
      }

      const data = await res.json();
      console.log('✅ Success:', data);

      if (isCreatingNew) {
        alert(`✅ Tạo quy trình thành công!\nMã: ${data.onboarding_code ?? data.id}`);
      } else {
        const taskList = (data.completed_tasks ?? []).map((t: any) => `- ${t.name}`).join('\n');
        alert(`✅ ${data.message ?? 'Cập nhật thành công!'}\nHoàn thành ${data.completed_count ?? 0} công việc:\n${taskList}`);
      }

      onSuccess();
    } catch (error) {
      console.error('💥 Exception:', error);
      alert('Có lỗi xảy ra khi kết nối server. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RENDER STEPS
  // ============================================

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Thông tin cơ bản</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
                <option value="O">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.candidate_phone}
                onChange={(e) => setFormData({ ...formData, candidate_phone: e.target.value })}
                placeholder="0123456789"
              />
            </div>

            {/* ✅ FIX: Email bắt buộc khi tạo mới */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email {isCreatingNew && <span className="text-red-500">*</span>}
                {isCreatingNew && (
                  <span className="text-xs text-gray-500 ml-1">(dùng để tạo tài khoản đăng nhập)</span>
                )}
              </label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.candidate_email}
                onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>

            {/* Hiển thị thêm khi tạo mới */}
            {isCreatingNew && (
              <>
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium text-gray-700 mb-3">Thông tin công việc</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Trình độ học vấn</label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
              >
                <option value="">-- Chọn trình độ --</option>
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link Facebook</label>
              <input
                type="url"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.facebook_link}
                onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Thông tin công việc chi tiết</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vùng/Miền</label>
                <div className="mt-2 flex flex-wrap gap-4">
                  {REGION_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="region"
                        className="h-4 w-4"
                        checked={formData.region === opt}
                        onChange={() => setFormData({ ...formData, region: opt })}
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Khối</label>
                <div className="mt-2 flex flex-col gap-2">
                  {BLOCK_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="block"
                        className="h-4 w-4"
                        checked={formData.block === opt}
                        onChange={() => setFormData({ ...formData, block: opt })}
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phòng/Ban</label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.sub_department}
                onChange={(e) => setFormData({ ...formData, sub_department: e.target.value })}
              >
                <option value="">-- Chọn phòng/ban --</option>
                {SUB_DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bộ phận (Section)</label>
                <div className="mt-2 flex flex-col gap-2">
                  {SECTION_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="section"
                        className="h-4 w-4"
                        checked={formData.section === opt}
                        onChange={() => setFormData({ ...formData, section: opt })}
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cấp bậc</label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.job_rank}
                  onChange={(e) => setFormData({ ...formData, job_rank: e.target.value })}
                >
                  <option value="">-- Chọn cấp bậc --</option>
                  {RANK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Team Bác sĩ</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.doctor_team}
                onChange={(e) => setFormData({ ...formData, doctor_team: e.target.value })}
                placeholder="Team Dr. Nguyễn Văn A..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hình thức làm việc</label>
                <div className="mt-2 flex flex-col gap-2">
                  {WORK_FORM_OPTIONS.map((opt) => (
                    <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="work_form"
                        className="h-4 w-4"
                        checked={formData.work_form === opt.value}
                        onChange={() => setFormData({ ...formData, work_form: opt.value, work_type: opt.label })}
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa điểm làm việc</label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.work_location}
                  onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                >
                  <option value="">-- Chọn địa điểm làm việc --</option>
                  {WORK_LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Thông tin CCCD</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Số CCCD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.citizen_id}
                onChange={(e) => setFormData({ ...formData, citizen_id: e.target.value })}
                placeholder="001234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                File CCCD (2 mặt - PDF) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500 mt-1">Chỉ chấp nhận file PDF, tối đa 5MB</p>
              {formData.citizen_id_file && (
                <p className="text-xs text-green-600 mt-1">✓ Đã chọn: {formData.citizen_id_file.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ngày cấp</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.citizen_id_issue_date}
                  onChange={(e) => setFormData({ ...formData, citizen_id_issue_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nơi cấp</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.citizen_id_issue_place}
                  onChange={(e) => setFormData({ ...formData, citizen_id_issue_place: e.target.value })}
                  placeholder="Cục Cảnh sát..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số CMND cũ (nếu có)</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.old_id_number}
                onChange={(e) => setFormData({ ...formData, old_id_number: e.target.value })}
                placeholder="123456789"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Địa chỉ & BHXH</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.permanent_address}
                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ hiện tại</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.current_address}
                onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã BHXH</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.social_insurance_number}
                  onChange={(e) => setFormData({ ...formData, social_insurance_number: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mã số thuế</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tax_code}
                  onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                  placeholder="0123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tình trạng hôn nhân</label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
              >
                <option value="SINGLE">Độc thân</option>
                <option value="MARRIED">Đã kết hôn</option>
                <option value="DIVORCED">Ly hôn</option>
                <option value="WIDOWED">Góa</option>
              </select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Người liên hệ khẩn cấp</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Nguyễn Văn B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mối quan hệ</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  placeholder="Bố, mẹ, vợ, chồng..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="0987654321"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.emergency_contact_dob}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_dob: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nghề nghiệp</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.emergency_contact_occupation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_occupation: e.target.value })}
                placeholder="Giáo viên, Bác sĩ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.emergency_contact_address}
                onChange={(e) => setFormData({ ...formData, emergency_contact_address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Thông tin lương</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Mức lương cơ bản (VNĐ)</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="10000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phụ cấp (VNĐ)</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.allowance}
                onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                placeholder="2000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số tháng thử việc</label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.probation_period_months}
                onChange={(e) => setFormData({ ...formData, probation_period_months: e.target.value })}
              >
                <option value="1">1 tháng</option>
                <option value="2">2 tháng</option>
                <option value="3">3 tháng</option>
                <option value="6">6 tháng</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-blue-900 mb-2">📋 Tóm tắt thông tin</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Họ tên: {formData.candidate_name || '(Chưa điền)'}</li>
                <li>• Email: {formData.candidate_email || '(Chưa điền)'}</li>
                <li>• CCCD: {formData.citizen_id || '(Chưa điền)'}</li>
                <li>• File CCCD: {formData.citizen_id_file ? `✓ ${formData.citizen_id_file.name}` : '(Chưa tải lên)'}</li>
                <li>• Lương: {formData.salary ? `${parseInt(formData.salary).toLocaleString()} VNĐ` : '(Chưa điền)'}</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isCreatingNew ? 'Tạo quy trình onboarding mới' : 'Điền thông tin nhân sự'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Bước {currentStep} / {totalSteps}</p>
          </div>
          <button onClick={onCancel} disabled={submitting} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{renderStep()}</div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || submitting}
            className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Quay lại
          </button>

          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Tiếp theo →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                {submitting ? 'Đang gửi...' : '✓ Hoàn thành'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfoForm;