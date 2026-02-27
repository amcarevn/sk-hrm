// ==========================================
// FILE: pages/EmployeeOnboardingForm.tsx
// Fixed: focus loss bug (Field components moved outside), better date inputs
// ==========================================

import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  LinearProgress,
  Box,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Apartment,
  Description,
  Home,
  Contacts,
  AttachMoney,
  CheckCircle,
  ErrorOutline,
  CalendarToday,
} from '@mui/icons-material';

// ============================================
// CONSTANTS
// ============================================

const WORK_LOCATION_OPTIONS = [
  { value: '789_LE_HONG_PHONG', label: '789/C9 Lê Hồng Phong, Phường 12, Quận 10, TP.HCM' },
  { value: '16_NGUYEN_NHU_DO', label: '16 Nguyễn Như Đổ, Văn Miếu, Đống Đa, Hà Nội' },
  { value: '61_VU_THANH', label: '61 Vũ Thạnh, Ô Chợ Dừa, Đống Đa, Hà Nội' },
  { value: '9_SU_VAN_HANH', label: '9 Sư Vạn Hạnh, Phường 9, Quận 5, TP.HCM' },
  { value: '355_AN_DUONG_VUONG', label: '355 An Dương Vương' },
  { value: '1E_TRUONG_TRINH', label: 'Số 1E Trường Trinh, Hà Nội' },
  { value: '50_TRUNG_PHUNG', label: 'Số 50 Trung Phụng, Hà Nội' },
  { value: '219_TRUNG_KINH', label: 'Số 219 Trung Kính, Cầu Giấy, Hà Nội' },
];

const REGION_OPTIONS = ['Miền Bắc', 'Miền Nam'];
const BLOCK_OPTIONS = ['Khối Back office', 'Khối Marketing', 'Khối Kinh doanh'];
const SUB_DEPARTMENT_OPTIONS = [
  'ADS', 'ADS2', 'KD 1', 'KD 2', 'KD 3', 'KD 4', 'KD MN',
  'CSKH MB', 'CSKH MN', 'Media MB', 'Media MN', 'Giám sát nội bộ',
  'HCNS', 'Kế toán', 'Truyền thông',
  'TTTH 01', 'TTTH 02', 'TTTH 03', 'TTTH 04', 'TTTH 06',
  'Xây group', 'TTTH 08', 'TTTH 05', 'TTTH 07', 'TTTH 09',
  'TTTH 10', 'TTTH 11', 'Tiktok 1', 'Tiktok 2', 'Tiktok 3',
  'Tiktok 5', 'TTTH 15', 'Pháp chế', 'Tiktok 4', 'KD 5',
  'Mua hàng', 'Công nghệ thông tin', 'Tiktok 6', 'Tiktok 7',
  'Tiktok 8', 'Tiktok 9', 'Tiktok 10',
];
const SECTION_OPTIONS = ['Phẫu thuật thẩm mỹ', 'Da liễu'];
const RANK_OPTIONS = ['Nhân viên', 'Trưởng phòng', 'Leader', 'Phó giám đốc', 'Giám đốc', 'Phó phòng'];
const WORK_FORM_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
];
const EDUCATION_LEVEL_OPTIONS = ['Thạc sĩ', 'Cử nhân đại học', 'Cử nhân cao đẳng', 'Trung cấp', 'Khác'];
const STEP_ICONS = [Person, Apartment, Description, Home, Contacts, AttachMoney];
const STEP_LABELS = ['Cơ bản', 'Công việc', 'CCCD', 'Địa chỉ', 'Liên hệ', 'Lương'];

// ============================================
// TYPES
// ============================================

interface OnboardingData {
  id: number;
  onboarding_code: string;
  candidate_name: string;
  candidate_email: string;
  start_date: string;
  position_name: string;
  department_name: string;
  token_expires_at: string;
}

interface FormValues {
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  date_of_birth: string;
  gender: string;
  education_level: string;
  facebook_link: string;
  start_date: string;
  region: string;
  block: string;
  sub_department: string;
  section: string;
  job_rank: string;
  doctor_team: string;
  work_form: string;
  work_location: string;
  citizen_id: string;
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
}

// ============================================
// STANDALONE FIELD COMPONENTS (outside main component → no re-mount on parent re-render)
// ============================================

interface TFProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

const TF: React.FC<TFProps> = ({ label, value, onChange, placeholder, type = 'text', disabled, required, multiline, rows }) => (
  <TextField
    fullWidth size="small" variant="outlined"
    label={label} value={value} onChange={onChange}
    placeholder={placeholder} type={type}
    disabled={disabled} required={required}
    multiline={multiline} rows={rows}
    InputLabelProps={type === 'date' ? { shrink: true } : undefined}
    InputProps={type === 'date' ? {
      endAdornment: (
        <InputAdornment position="end">
          <CalendarToday sx={{ fontSize: 16, color: '#9ca3af' }} />
        </InputAdornment>
      ),
    } : undefined}
    sx={{
      '& .MuiOutlinedInput-root': {
        '&:hover fieldset': { borderColor: '#3b82f6' },
        '&.Mui-focused fieldset': { borderColor: '#2563eb' },
      },
      '& input[type="date"]::-webkit-calendar-picker-indicator': {
        opacity: 0,
        position: 'absolute',
        right: 0,
        width: '100%',
        cursor: 'pointer',
      },
    }}
  />
);

interface SFProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: ({ value: string; label: string } | string)[];
  required?: boolean;
}

const SF: React.FC<SFProps> = ({ label, value, onChange, options, required }) => {
  const normalized = options.map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <FormControl fullWidth size="small" required={required}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(e) => onChange(e.target.value as string)}>
        <MenuItem value=""><em>-- Chọn --</em></MenuItem>
        {normalized.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

interface RFProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: ({ value: string; label: string } | string)[];
  row?: boolean;
}

const RF: React.FC<RFProps> = ({ label, value, onChange, options, row }) => {
  const normalized = options.map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend" sx={{ fontSize: 13, color: '#374151', mb: 0.5, '&.Mui-focused': { color: '#374151' } }}>
        {label}
      </FormLabel>
      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)} row={row}>
        {normalized.map((o) => (
          <FormControlLabel
            key={o.value} value={o.value}
            control={<Radio size="small" sx={{ py: 0.5 }} />}
            label={<span style={{ fontSize: 14 }}>{o.label}</span>}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const EmployeeOnboardingForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);
  const [citizenIdFile, setCitizenIdFile] = useState<File | null>(null);
  const [workType, setWorkType] = useState('');

  const [values, setValues] = useState<FormValues>({
    candidate_name: '', candidate_email: '', candidate_phone: '',
    date_of_birth: '', gender: 'M', education_level: '', facebook_link: '',
    start_date: '', region: '', block: '', sub_department: '', section: '',
    job_rank: '', doctor_team: '', work_form: '', work_location: '',
    citizen_id: '', citizen_id_issue_date: '', citizen_id_issue_place: '',
    old_id_number: '', permanent_address: '', current_address: '',
    social_insurance_number: '', tax_code: '', marital_status: 'SINGLE',
    emergency_contact_name: '', emergency_contact_relationship: '',
    emergency_contact_phone: '', emergency_contact_dob: '',
    emergency_contact_occupation: '', emergency_contact_address: '',
    salary: '', allowance: '', probation_period_months: '2',
  });

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // useCallback để tránh tạo function mới mỗi render → không gây re-mount TF
  const handleChange = useCallback((field: keyof FormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }))
  , []);

  const handleSelect = useCallback((field: keyof FormValues) =>
    (value: string) => setValues((v) => ({ ...v, [field]: value }))
  , []);

  // ===== FETCH =====
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api-hrm/employee-onboarding-form/by-token/${token}/`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const data = await res.json();
        if (!data.success) { setPageError(data.error); return; }
        setOnboardingData(data.data);
        setValues((v) => ({
          ...v,
          candidate_name: data.data.candidate_name,
          candidate_email: data.data.candidate_email,
        }));
      } catch {
        setPageError('Không thể tải thông tin. Vui lòng kiểm tra lại link.');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token]);

  // ===== VALIDATION =====
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!values.candidate_name.trim()) { showToast('error', 'Vui lòng nhập họ và tên'); return false; }
      if (!values.date_of_birth) { showToast('error', 'Vui lòng chọn ngày sinh'); return false; }
      if (!values.candidate_phone.trim()) { showToast('error', 'Vui lòng nhập số điện thoại'); return false; }
    }
    if (step === 3) {
      if (!values.citizen_id.trim()) { showToast('error', 'Vui lòng nhập số CCCD'); return false; }
      if (!citizenIdFile) { showToast('error', 'Vui lòng upload file CCCD (PDF)'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep + 1)) setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const handlePrevious = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // ===== FILE =====
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'File CCCD phải là định dạng PDF'); e.target.value = ''; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File CCCD không được vượt quá 5MB'); e.target.value = ''; return;
    }
    setCitizenIdFile(file);
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    if (!citizenIdFile) { showToast('error', 'Vui lòng upload file CCCD (PDF)'); return; }
    setSubmitting(true);
    try {
      const payload = new FormData();
      const ap = (key: string, val: string | File | null | undefined) => {
        if (val !== undefined && val !== null && val !== '') payload.append(key, val);
      };
      ap('candidate_name', values.candidate_name);
      ap('candidate_email', values.candidate_email);
      ap('candidate_phone', values.candidate_phone);
      ap('date_of_birth', values.date_of_birth);
      ap('gender', values.gender);
      ap('education_level', values.education_level);
      ap('facebook_link', values.facebook_link);
      ap('start_date', values.start_date);
      ap('region', values.region);
      ap('block', values.block);
      ap('sub_department', values.sub_department);
      ap('section', values.section);
      ap('rank', values.job_rank);
      ap('doctor_team', values.doctor_team);
      ap('work_form', values.work_form);
      ap('work_type', workType);
      ap('work_location', values.work_location);
      ap('citizen_id', values.citizen_id);
      if (citizenIdFile) payload.append('citizen_id_file', citizenIdFile);
      ap('citizen_id_issue_date', values.citizen_id_issue_date);
      ap('citizen_id_issue_place', values.citizen_id_issue_place);
      ap('old_id_number', values.old_id_number);
      ap('permanent_address', values.permanent_address);
      ap('current_address', values.current_address);
      ap('social_insurance_number', values.social_insurance_number);
      ap('tax_code', values.tax_code);
      ap('marital_status', values.marital_status);
      ap('emergency_contact_name', values.emergency_contact_name);
      ap('emergency_contact_relationship', values.emergency_contact_relationship);
      ap('emergency_contact_phone', values.emergency_contact_phone);
      ap('emergency_contact_dob', values.emergency_contact_dob);
      ap('emergency_contact_occupation', values.emergency_contact_occupation);
      ap('emergency_contact_address', values.emergency_contact_address);
      ap('salary', values.salary);
      ap('allowance', values.allowance);
      ap('probation_period_months', values.probation_period_months);

      const res = await fetch(
        `http://localhost:8000/api-hrm/employee-onboarding-form/submit/${token}/`,
        { method: 'POST', body: payload }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msgs: string[] = [];
        Object.entries(err.errors ?? err).forEach(([f, v]) => {
          msgs.push(`${f}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
        });
        showToast('error', msgs.length ? msgs.join(' | ') : 'Lưu thất bại');
        return;
      }
      setSuccess(true);
    } catch {
      showToast('error', 'Có lỗi xảy ra khi kết nối server.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // LOADING / ERROR / SUCCESS
  // ============================================

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center"><CircularProgress size={48} /><p className="mt-4 text-gray-500">Đang tải...</p></div>
    </div>
  );

  if (pageError) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <ErrorOutline sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể truy cập form</h2>
        <p className="text-gray-500 mb-6">{pageError}</p>
        <Button variant="outlined">Liên hệ HR</Button>
      </div>
    </div>
  );

  if (success) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <CheckCircle sx={{ fontSize: 80, color: '#22c55e', mb: 2 }} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
        <p className="text-gray-500 mb-6">Cảm ơn bạn đã điền thông tin. HR sẽ liên hệ với bạn sớm.</p>
        <Button variant="contained" onClick={() => window.close()}>Đóng trang</Button>
      </div>
    </div>
  );

  const stepNumber = currentStep + 1;

  // ============================================
  // RENDER STEPS — dùng TF/SF/RF đã định nghĩa ngoài component
  // ============================================

  const renderStep = () => {
    switch (currentStep) {

      // ── BƯỚC 1: Thông tin cơ bản ──────────────────────────────────────
      case 0: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cơ bản</h3>

          <TF label="Họ và tên" value={values.candidate_name}
            onChange={handleChange('candidate_name')} required placeholder="Nguyễn Văn A" />

          <TF label="Ngày sinh" value={values.date_of_birth}
            onChange={handleChange('date_of_birth')} required type="date" />

          <SF label="Giới tính" value={values.gender} onChange={handleSelect('gender')}
            options={[{ value: 'M', label: 'Nam' }, { value: 'F', label: 'Nữ' }, { value: 'O', label: 'Khác' }]} />

          <TF label="Số điện thoại" value={values.candidate_phone}
            onChange={handleChange('candidate_phone')} required placeholder="0123456789" />

          <TF label="Email" value={values.candidate_email}
            onChange={handleChange('candidate_email')} disabled />

          <TF label="Ngày bắt đầu" value={values.start_date}
            onChange={handleChange('start_date')} type="date" />

          <SF label="Trình độ học vấn" value={values.education_level}
            onChange={handleSelect('education_level')} options={EDUCATION_LEVEL_OPTIONS} />

          <TF label="Link Facebook" value={values.facebook_link}
            onChange={handleChange('facebook_link')} placeholder="https://facebook.com/..." />
        </div>
      );

      // ── BƯỚC 2: Thông tin công việc ───────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin công việc chi tiết</h3>

          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <RF label="Vùng/Miền" value={values.region}
              onChange={handleSelect('region')} options={REGION_OPTIONS} />
            <RF label="Khối" value={values.block}
              onChange={handleSelect('block')} options={BLOCK_OPTIONS} />
          </div>

          <SF label="Phòng/Ban" value={values.sub_department}
            onChange={handleSelect('sub_department')} options={SUB_DEPARTMENT_OPTIONS} />

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <RF label="Bộ phận (Section)" value={values.section}
              onChange={handleSelect('section')} options={SECTION_OPTIONS} />
            <SF label="Cấp bậc" value={values.job_rank}
              onChange={handleSelect('job_rank')} options={RANK_OPTIONS} />
          </div>

          <TF label="Team Bác sĩ" value={values.doctor_team}
            onChange={handleChange('doctor_team')} placeholder="Team Dr. Nguyễn Văn A..." />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <RF label="Hình thức làm việc" value={values.work_form}
                onChange={(val) => {
                  handleSelect('work_form')(val);
                  setWorkType(WORK_FORM_OPTIONS.find((o) => o.value === val)?.label ?? '');
                }}
                options={WORK_FORM_OPTIONS} />
            </div>
            <SF label="Địa điểm làm việc" value={values.work_location}
              onChange={handleSelect('work_location')} options={WORK_LOCATION_OPTIONS} />
          </div>
        </div>
      );

      // ── BƯỚC 3: CCCD ──────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin CCCD</h3>

          <TF label="Số CCCD" value={values.citizen_id}
            onChange={handleChange('citizen_id')} required placeholder="001234567890" />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              File CCCD (2 mặt - PDF) <span className="text-red-500">*</span>
            </p>
            <label className={`flex items-center gap-3 w-full border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors
              ${citizenIdFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
              <span className="text-2xl">{citizenIdFile ? '✅' : '📄'}</span>
              <div className="flex-1 min-w-0">
                {citizenIdFile
                  ? <p className="text-sm text-green-700 font-medium truncate">{citizenIdFile.name}</p>
                  : <p className="text-sm text-gray-500">Nhấn để chọn file PDF (tối đa 5MB)</p>
                }
              </div>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TF label="Ngày cấp" value={values.citizen_id_issue_date}
              onChange={handleChange('citizen_id_issue_date')} type="date" />
            <TF label="Nơi cấp" value={values.citizen_id_issue_place}
              onChange={handleChange('citizen_id_issue_place')} placeholder="Cục Cảnh sát..." />
          </div>

          <TF label="Số CMND cũ (nếu có)" value={values.old_id_number}
            onChange={handleChange('old_id_number')} placeholder="123456789" />
        </div>
      );

      // ── BƯỚC 4: Địa chỉ & BHXH ────────────────────────────────────────
      case 3: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Địa chỉ & BHXH</h3>

          <TF label="Địa chỉ thường trú" value={values.permanent_address}
            onChange={handleChange('permanent_address')} multiline rows={2}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />

          <TF label="Địa chỉ hiện tại" value={values.current_address}
            onChange={handleChange('current_address')} multiline rows={2}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />

          <div className="grid grid-cols-2 gap-4">
            <TF label="Mã BHXH" value={values.social_insurance_number}
              onChange={handleChange('social_insurance_number')} placeholder="1234567890" />
            <TF label="Mã số thuế" value={values.tax_code}
              onChange={handleChange('tax_code')} placeholder="0123456789" />
          </div>

          <SF label="Tình trạng hôn nhân" value={values.marital_status}
            onChange={handleSelect('marital_status')} options={[
              { value: 'SINGLE', label: 'Độc thân' },
              { value: 'MARRIED', label: 'Đã kết hôn' },
              { value: 'DIVORCED', label: 'Ly hôn' },
              { value: 'WIDOWED', label: 'Góa' },
            ]} />
        </div>
      );

      // ── BƯỚC 5: Người liên hệ khẩn cấp ───────────────────────────────
      case 4: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Người liên hệ khẩn cấp</h3>

          <div className="grid grid-cols-2 gap-4">
            <TF label="Họ và tên" value={values.emergency_contact_name}
              onChange={handleChange('emergency_contact_name')} placeholder="Nguyễn Văn B" />
            <TF label="Mối quan hệ" value={values.emergency_contact_relationship}
              onChange={handleChange('emergency_contact_relationship')} placeholder="Bố, mẹ, vợ, chồng..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TF label="Số điện thoại" value={values.emergency_contact_phone}
              onChange={handleChange('emergency_contact_phone')} placeholder="0987654321" />
            <TF label="Ngày sinh" value={values.emergency_contact_dob}
              onChange={handleChange('emergency_contact_dob')} type="date" />
          </div>

          <TF label="Nghề nghiệp" value={values.emergency_contact_occupation}
            onChange={handleChange('emergency_contact_occupation')} placeholder="Giáo viên, Bác sĩ..." />

          <TF label="Địa chỉ" value={values.emergency_contact_address}
            onChange={handleChange('emergency_contact_address')} multiline rows={2}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
        </div>
      );

      // ── BƯỚC 6: Thông tin lương ────────────────────────────────────────
      case 5: return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin lương</h3>

          <TF label="Mức lương cơ bản (VNĐ)" value={values.salary}
            onChange={handleChange('salary')} type="number" placeholder="10000000" />

          <TF label="Phụ cấp (VNĐ)" value={values.allowance}
            onChange={handleChange('allowance')} type="number" placeholder="2000000" />

          <SF label="Số tháng thử việc" value={values.probation_period_months}
            onChange={handleSelect('probation_period_months')} options={[
              { value: '1', label: '1 tháng' },
              { value: '2', label: '2 tháng' },
              { value: '3', label: '3 tháng' },
              { value: '6', label: '6 tháng' },
            ]} />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-2">
            <p className="text-sm font-semibold text-blue-800 mb-3">📋 Tóm tắt thông tin</p>
            <div className="space-y-1.5">
              {[
                ['Họ tên', values.candidate_name],
                ['Email', values.candidate_email],
                ['CCCD', values.citizen_id],
                ['File CCCD', citizenIdFile ? `✓ ${citizenIdFile.name}` : null],
                ['Lương', values.salary ? `${parseInt(values.salary).toLocaleString()} VNĐ` : null],
              ].map(([label, val]) => (
                <div key={label as string} className="flex gap-2 text-sm">
                  <span className="text-blue-500 w-20 shrink-0">{label}:</span>
                  <span className={val ? 'text-blue-800 font-medium' : 'text-blue-300 italic'}>
                    {val || '(Chưa điền)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm max-w-sm
          ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
          {toast.msg}
        </div>
      )}

      <Paper elevation={3} sx={{ maxWidth: 760, mx: 'auto', borderRadius: 4, overflow: 'hidden' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 pt-8 pb-6 text-center text-white">
          <h2 className="text-2xl font-bold">Thông tin Onboarding</h2>
          <p className="mt-1 opacity-90">
            Xin chào, <strong>{onboardingData?.candidate_name}</strong>!
          </p>
          <p className="text-sm opacity-75 mt-1">
            {onboardingData?.position_name || '—'} — {onboardingData?.department_name || '—'}
          </p>
          <p className="text-sm opacity-75">
            Ngày bắt đầu:{' '}
            {onboardingData?.start_date
              ? new Date(onboardingData.start_date).toLocaleDateString('vi-VN') : '—'}
          </p>
        </div>

        {/* Warning */}
        <div className="px-8 pt-4">
          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: 13 }}>
            Link có hiệu lực đến{' '}
            <strong>
              {onboardingData?.token_expires_at
                ? new Date(onboardingData.token_expires_at).toLocaleString('vi-VN') : '—'}
            </strong>
          </Alert>
        </div>

        {/* Step indicators */}
        <div className="px-8 pt-5 pb-2">
          <div className="flex items-start justify-between mb-3">
            {STEP_LABELS.map((label, i) => {
              const Icon = STEP_ICONS[i];
              const active = i === currentStep;
              const done = i < currentStep;
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 shadow-sm transition-all
                    ${done ? 'bg-green-500' : active ? 'bg-blue-600' : 'bg-gray-100'}`}>
                    {done
                      ? <CheckCircle sx={{ fontSize: 20, color: 'white' }} />
                      : <Icon sx={{ fontSize: 20, color: active ? 'white' : '#9ca3af' }} />
                    }
                  </div>
                  <span className={`text-xs font-medium hidden sm:block text-center leading-tight
                    ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <Box sx={{ mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={(stepNumber / totalSteps) * 100}
              sx={{
                height: 6, borderRadius: 3, bgcolor: '#e5e7eb',
                '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#2563eb' }
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Bước {stepNumber} / {totalSteps}
          </Typography>
        </div>

        {/* Form body */}
        <div className="px-8 py-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex justify-between items-center border-t border-gray-100 pt-4">
          <Button variant="outlined" onClick={handlePrevious}
            disabled={currentStep === 0 || submitting}>
            ← Quay lại
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={submitting}>
              Tiếp theo →
            </Button>
          ) : (
            <Button
              variant="contained" onClick={handleSubmit} disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, px: 3 }}
            >
              {submitting ? 'Đang gửi...' : '✓ Hoàn thành'}
            </Button>
          )}
        </div>
      </Paper>
    </div>
  );
};