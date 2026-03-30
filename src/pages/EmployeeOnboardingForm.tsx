// ==========================================
// FILE: pages/EmployeeOnboardingForm.tsx
// Fixed: focus loss bug (Field components moved outside), better date inputs
// ==========================================

import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { API_BASE_URL } from '../utils/api';
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

// ← Restored: dropdown cho Phòng/Ban
const SUB_DEPARTMENT_OPTIONS = [
  'ADS', 'ADS2', 'KD 1', 'KD 2', 'KD 3', 'KD 4', 'KD MN',
  'CSKH MB', 'CSKH MN', 'Media MB', 'Media MN', 'Giám sát nội bộ',
  'HCNS', 'Kế toán', 'Truyền thông',
  'TTTH 01', 'TTTH 02', 'TTTH 03', 'TTTH 04', 'TTTH 06',
  'Xây group', 'TTTH 08', 'TTTH 05', 'TTTH 07', 'TTTH 09',
  'TTTH 10', 'TTTH 11', 'Tiktok 1', 'Tiktok 2', 'Tiktok 3',
  'Tiktok 5', 'TTTH 15', 'Pháp chế', 'Tiktok 4', 'KD 5',
  'Mua hàng', 'IT', 'Tiktok 6', 'Tiktok 7',
  'Tiktok 8', 'Tiktok 9', 'Tiktok 10', 'AI',
];

const SECTION_OPTIONS = [
  { value: 'ADS', label: 'ADS' },
  { value: 'BENH_VIEN_HA_THANH', label: 'Bệnh viện Hà Thành' },
  { value: 'BENH_VIEN_30_4', label: 'Bệnh viện 30/4' },
  { value: 'BENH_VIEN_AN_VIET', label: 'Bệnh viện An Việt' },
  { value: 'BENH_VIEN_HONG_HA', label: 'Bệnh viện Hồng Hà' },
  { value: 'BENH_VIEN_TAN_HUNG', label: 'Bệnh Viện Tân Hưng' },
  { value: 'BENH_VIEN_SAO_HAN', label: 'Bệnh viện Sao Hàn' },
  { value: 'BENH_VIEN_VAN_HANH', label: 'Bệnh viện Vạn Hạnh' },
  { value: 'CHECK_PAGE', label: 'Check page' },
  { value: 'XAY_GROUP', label: 'Xây Group' },
  { value: 'TIKTOK', label: 'Tiktok' },
  { value: 'GIAM_SAT_CHAT_LUONG', label: 'Giám sát chất lượng' },
  { value: 'GIAM_SAT_NOI_BO', label: 'Giám sát nội bộ' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'NOI_DUNG_01', label: 'Nội dung 01' },
  { value: 'PHONG_HCNS', label: 'Phòng HCNS' },
  { value: 'PHONG_KE_TOAN', label: 'Phòng kế toán' },
  { value: 'PHONG_TTTH', label: 'Phòng TTTH' },
  { value: 'KINH_DOANH_VP_MIEN_BAC', label: 'Kinh doanh - VP miền Bắc' },
  { value: 'KINH_DOANH_VP_MIEN_NAM', label: 'Kinh doanh - VP miền Nam' },
  { value: 'PHAP_CHE', label: 'Pháp chế' },
  { value: 'MUA_HANG', label: 'Mua hàng' },
  { value: 'BO_PHAN_IT', label: 'Bộ phận IT' },
  { value: 'BO_PHAN_AI', label: 'Bộ phận AI' },
];

const POSITION_OPTIONS = [
  'Nhân viên Sale', 'Nhân viên Kinh doanh', 'Nhân viên Telesale', 'Trưởng phòng Telesale',
  'Nhân viên CSKH', 'Trưởng phòng CSKH', 'Nhân viên Tư vấn',
  'Chăm sóc, tiếp nhận khách', 'Chăm sóc hậu phẫu',
  'Nhân viên Marketing', 'Nhân viên ADS', 'Trưởng phòng ADS', 'Nhân viên Content', 'Trưởng phòng Content',
  'Nhân viên Seeding', 'Trưởng phòng Seeding', 'Nhân viên Truyền thông thương hiệu', 'Trưởng phòng Truyền thông thương hiệu',
  'Truyền thông nội bộ',
  'Nhân viên Media', 'Trưởng phòng Media', 'Nhân viên TikTok', 'Xây group',
  'Nhân viên Thiết kế', 'Nhân viên Editor/Dựng phim', 'Biên tập viên', 'Biên kịch', 'Checkpage', 'Trợ lý hình ảnh', 'Quay - Chụp', 'Tổ chức sản xuất',
  'Bác sĩ', 'Trợ lý bác sĩ', 'Điều dưỡng', 'Y tá', 'Kỹ thuật viên', 'Phụ tá',
  'Nhân viên Hành chính - Nhân sự', 'Trưởng phòng Hành chính - Nhân sự', 'Giám đốc Hành chính - Nhân sự',
  'Nhân viên C&B', 'Nhân viên Tuyển dụng', 'Trưởng phòng Tuyển dụng',
  'Nhân viên Pháp chế', 'Trưởng phòng Pháp chế', 'Giám đốc Pháp chế',
  'Phiên dịch viên', 'Nhân viên IT', 'Nhân viên AI', 'Trưởng phòng IT', 'Trưởng phòng AI',
  'Nhân viên Kế toán', 'Kế toán trưởng', 'Thủ quỹ', 'Thực tập sinh', 'Lễ tân', 'Giám sát nội bộ', 'Giám sát chất lượng', 'Trưởng phòng Giám sát',
  'Lái xe', 'Tạp vụ', 'Bảo vệ',
  'Phó phòng', 
  'Giám đốc', 'Phó Giám đốc',
];
const RANK_OPTIONS = [
  'Nhân viên',
  'Leader',
  'Trưởng phòng tập sự',
  'Phó phòng',
  'Trưởng phòng',
  'Phó Giám đốc',
  'Giám đốc',
  'Chủ tịch',
];
const WORK_FORM_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
];
const EDUCATION_LEVEL_OPTIONS = ['Thạc sĩ', 'Cử nhân đại học', 'Cử nhân cao đẳng', 'Trung cấp', 'Khác'];
const CITIZEN_ID_ISSUE_PLACE_OPTIONS = [
  { value: 'POLICE_ADMIN', label: 'Cục cảnh sát Quản lý hành chính về Trật tự xã hội' },
  { value: 'MINISTRY_PUBLIC_SECURITY', label: 'Bộ Công An' },
];
const STEP_ICONS = [Person, Apartment, Description, Home, Contacts, AttachMoney];
const STEP_LABELS = ['Cơ bản', 'Công việc', 'CCCD', 'Địa chỉ', 'Liên hệ', 'Lương'];

/** Khớp ALLOWED_IMAGE_TYPES trên backend (beautycare/settings.py) */
const VNEID_ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
]);
const VNEID_MAX_BYTES = 10 * 1024 * 1024;

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
  sub_department: string;  // SF dropdown
  section: string;         // TF free-text ← changed
  position: string;
  job_rank: string;
  ethnicity: string;
  birth_place: string;
  nationality: string;
  probation_rate: string;
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
  bank_account: string;
  bank_name: string;
  bank_branch: string;
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
  const [vneidScreenshotFile, setVneidScreenshotFile] = useState<File | null>(null);
  const [workType, setWorkType] = useState('');

  const [values, setValues] = useState<FormValues>({
    candidate_name: '', candidate_email: '', candidate_phone: '',
    date_of_birth: '', gender: 'M', education_level: '', facebook_link: '',
    start_date: '', region: '', block: '', sub_department: '',
    section: '',  // ← bỏ giá trị mặc định 'Phẫu thuật thẩm mỹ'
    position: '', job_rank: '', ethnicity: '', birth_place: '', nationality: '', doctor_team: '', work_form: '',
    work_location: '', probation_rate: '',
    citizen_id: '', citizen_id_issue_date: '', citizen_id_issue_place: '',
    old_id_number: '', permanent_address: '', current_address: '',
    social_insurance_number: '', tax_code: '', marital_status: 'SINGLE',
    emergency_contact_name: '', emergency_contact_relationship: '',
    emergency_contact_phone: '', emergency_contact_dob: '',
    emergency_contact_occupation: '', emergency_contact_address: '',
    salary: '', allowance: '', probation_period_months: '2',
    bank_account: '',
    bank_name: '',
    bank_branch: '',
  });

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

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
          `${API_BASE_URL}/api-hrm/employee-onboarding-form/by-token/${token}/`,
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
      if (!values.gender) { showToast('error', 'Vui lòng chọn giới tính'); return false; }
      if (!values.candidate_phone.trim()) { showToast('error', 'Vui lòng nhập số điện thoại'); return false; }
      if (!/^\d{10}$/.test(values.candidate_phone.trim())) { showToast('error', 'Số điện thoại phải có đúng 10 chữ số'); return false; }
      if (!values.start_date) { showToast('error', 'Vui lòng chọn ngày bắt đầu'); return false; }
      if (!values.education_level) { showToast('error', 'Vui lòng chọn trình độ học vấn'); return false; }
      if (!values.facebook_link.trim()) { showToast('error', 'Vui lòng nhập link Facebook'); return false; }
    }
    if (step === 2) {
      if (!values.region) { showToast('error', 'Vui lòng chọn vùng/miền'); return false; }
      if (!values.block) { showToast('error', 'Vui lòng chọn khối'); return false; }
      if (!values.sub_department) { showToast('error', 'Vui lòng chọn phòng/ban'); return false; }
      if (!values.position) { showToast('error', 'Vui lòng chọn vị trí'); return false; }
      if (!values.job_rank) { showToast('error', 'Vui lòng chọn cấp bậc'); return false; }
      if (!values.work_form) { showToast('error', 'Vui lòng chọn hình thức làm việc'); return false; }
      if (!values.work_location) { showToast('error', 'Vui lòng chọn địa điểm làm việc'); return false; }
    }
    if (step === 3) {
      if (!values.citizen_id.trim()) { showToast('error', 'Vui lòng nhập số CCCD'); return false; }
      if (!citizenIdFile) { showToast('error', 'Vui lòng upload file CCCD (PDF)'); return false; }
      if (!vneidScreenshotFile) { showToast('error', 'Vui lòng upload ảnh chụp màn hình thông tin VNeID'); return false; }
      if (!values.citizen_id_issue_date) { showToast('error', 'Vui lòng chọn ngày cấp CCCD'); return false; }
      if (!values.citizen_id_issue_place.trim()) { showToast('error', 'Vui lòng nhập nơi cấp CCCD'); return false; }
    }
    if (step === 4) {
      if (!values.permanent_address.trim()) { showToast('error', 'Vui lòng nhập địa chỉ thường trú'); return false; }
      if (!values.current_address.trim()) { showToast('error', 'Vui lòng nhập địa chỉ hiện tại'); return false; }
      if (!values.marital_status) { showToast('error', 'Vui lòng chọn tình trạng hôn nhân'); return false; }
    }
    if (step === 5) {
      if (!values.emergency_contact_name.trim()) { showToast('error', 'Vui lòng nhập tên người liên hệ khẩn cấp'); return false; }
      if (!values.emergency_contact_relationship.trim()) { showToast('error', 'Vui lòng nhập mối quan hệ'); return false; }
      if (!values.emergency_contact_phone.trim()) { showToast('error', 'Vui lòng nhập số điện thoại người liên hệ'); return false; }
      if (!/^\d{10}$/.test(values.emergency_contact_phone.trim())) { showToast('error', 'Số điện thoại người liên hệ phải có đúng 10 chữ số'); return false; }
      if (!values.emergency_contact_dob) { showToast('error', 'Vui lòng chọn ngày sinh người liên hệ'); return false; }
      if (!values.emergency_contact_occupation.trim()) { showToast('error', 'Vui lòng nhập nghề nghiệp người liên hệ'); return false; }
      if (!values.emergency_contact_address.trim()) { showToast('error', 'Vui lòng nhập địa chỉ người liên hệ'); return false; }
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

  const handleVneidScreenshotChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = (file.type || '').toLowerCase();
    const okMime = !mime || VNEID_ALLOWED_MIME.has(mime);
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const okExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext);
    if (!okMime && !okExt) {
      showToast('error', 'Ảnh VNeID: chỉ chấp nhận JPG, PNG, GIF, WEBP, HEIC/HEIF');
      e.target.value = '';
      return;
    }
    if (file.size > VNEID_MAX_BYTES) {
      showToast('error', 'Ảnh VNeID không được vượt quá 10MB');
      e.target.value = '';
      return;
    }
    setVneidScreenshotFile(file);
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) return;
    }
    if (!citizenIdFile) { showToast('error', 'Vui lòng upload file CCCD (PDF)'); return; }
    if (!vneidScreenshotFile) { showToast('error', 'Vui lòng upload ảnh chụp màn hình thông tin VNeID'); return; }
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
      ap('ethnicity', values.ethnicity);
      ap('birth_place', values.birth_place);
      ap('nationality', values.nationality);
      ap('probation_rate', values.probation_rate);
      ap('facebook_link', values.facebook_link);
      ap('start_date', values.start_date);
      ap('region', values.region);
      ap('block', values.block);
      ap('sub_department', values.sub_department);
      ap('section', values.section);
      ap('position', values.position);
      ap('job_rank', values.job_rank);
      ap('doctor_team', values.doctor_team);
      ap('work_form', values.work_form);
      ap('work_type', workType);
      ap('work_location', values.work_location);
      ap('citizen_id', values.citizen_id);
      if (citizenIdFile) payload.append('citizen_id_file', citizenIdFile);
      if (vneidScreenshotFile) payload.append('vneid_screenshot', vneidScreenshotFile);
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
      ap('bank_account', values.bank_account);
      ap('bank_name', values.bank_name);
      ap('bank_branch', values.bank_branch);

      const res = await fetch(
        `${API_BASE_URL}/api-hrm/employee-onboarding-form/submit/${token}/`,
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
        <CheckCircle sx={{ fontSize: 80, color: '#f59e0b', mb: 2 }} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã gửi thông tin!</h2>
        <p className="text-gray-500 mb-2">Cảm ơn bạn đã điền thông tin.</p>
        <p className="text-gray-500 mb-6">
          Thông tin của bạn đang chờ <strong>quản lý trực tiếp xác nhận</strong>.
          Bạn sẽ được thông báo sau khi được duyệt.
        </p>
        <Button variant="contained" onClick={() => window.close()}>Đóng trang</Button>
      </div>
    </div>
  );

  const stepNumber = currentStep + 1;

  // ============================================
  // RENDER STEPS
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
            onChange={handleChange('start_date')} type="date" required />

          <SF label="Trình độ học vấn" value={values.education_level}
            onChange={handleSelect('education_level')} options={EDUCATION_LEVEL_OPTIONS} required />

          <TF label="Dân tộc" value={values.ethnicity}
            onChange={handleChange('ethnicity')} placeholder="Kinh, Tày, Mường..." />

          <p className="text-xs text-gray-500 px-1 -mt-2">
            Vui lòng nhập Xã/Phường và Tỉnh/TP khai sinh theo đơn vị hành chính mới
          </p>
          <TF label="Nơi khai sinh" value={values.birth_place}
            onChange={handleChange('birth_place')} placeholder="Tỉnh/thành phố, Quốc gia..." />
          
          <TF label="Quốc tịch" value={values.nationality}
            onChange={handleChange('nationality')} placeholder="Việt Nam..." />

          <TF label="Link Facebook" value={values.facebook_link}
            onChange={handleChange('facebook_link')} placeholder="https://facebook.com/..." required />
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

          {/* Phòng/Ban: SF dropdown ← restored */}
          <SF label="Phòng/Ban" value={values.sub_department}
            onChange={handleSelect('sub_department')} options={SUB_DEPARTMENT_OPTIONS} required />

          <div className="grid grid-cols-2 gap-4">
            {/* Bộ phận (Section): SF dropdown */}
            <SF
              label="Bộ phận (Section)"
              value={values.section}
              onChange={handleSelect('section')}
              options={SECTION_OPTIONS}
            />
            <SF label="Vị trí" value={values.position}
              onChange={handleSelect('position')} options={POSITION_OPTIONS} required />
          </div>

          {/* Cấp bậc */}
          <SF
            label="Cấp bậc"
            value={values.job_rank}
            onChange={handleSelect('job_rank')}
            options={RANK_OPTIONS}
            required
          />

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
              onChange={handleSelect('work_location')} options={WORK_LOCATION_OPTIONS} required />
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

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Ảnh chụp màn hình thông tin VNeID <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Đăng nhập VNEID mức 2 - Ví giấy tờ - Căn cước điện tử - Chụp màn hình chứa các thông tin nơi đăng ký khai sinh, nơi thường trú, tạm trú, ....
            </p>
            <label
              className={`flex items-center gap-3 w-full border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors
              ${vneidScreenshotFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              <span className="text-2xl">{vneidScreenshotFile ? '✅' : '🖼️'}</span>
              <div className="flex-1 min-w-0">
                {vneidScreenshotFile ? (
                  <p className="text-sm text-green-700 font-medium truncate">{vneidScreenshotFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Nhấn để chọn ảnh (JPG, PNG, WEBP, HEIC...)</p>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif"
                onChange={handleVneidScreenshotChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TF label="Ngày cấp" value={values.citizen_id_issue_date}
              onChange={handleChange('citizen_id_issue_date')} type="date" required />
            <SF label="Nơi cấp" value={values.citizen_id_issue_place}
              onChange={handleSelect('citizen_id_issue_place')} options={CITIZEN_ID_ISSUE_PLACE_OPTIONS} required />
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
            required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />

          <p className="text-xs text-gray-500 px-1">
            (Vui lòng tra cứu địa chỉ mới bằng cách đăng nhập ứng dụng VNeID để kiểm tra)
          </p>

          <TF label="Địa chỉ hiện tại" value={values.current_address}
            onChange={handleChange('current_address')} multiline rows={2}
            required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <TF label="Mã BHXH" value={values.social_insurance_number}
                onChange={handleChange('social_insurance_number')} placeholder="1234567890" />
              <p className="text-xs text-gray-500 mt-1">
                (Vui lòng tra cứu mã số BHXH, Mã hộ tại link đính kèm{' '}
                <a href="https://baohiemxahoi.gov.vn/tracuu/Pages/tra-cuu-ho-gia-dinh.aspx"
                  target="_blank" rel="noreferrer"
                  className="text-blue-500 underline break-all">
                  https://baohiemxahoi.gov.vn/tracuu/Pages/tra-cuu-ho-gia-dinh.aspx
                </a>)
              </p>
            </div>
            <div>
              <TF label="Mã số thuế" value={values.tax_code}
                onChange={handleChange('tax_code')} placeholder="0123456789" />
              <p className="text-xs text-gray-500 mt-1">
                (Vui lòng tra cứu Mã số thuế tại trang web:{' '}
                <a href="https://masothue.com/tra-cuu-ma-so-thue-ca-nhan"
                  target="_blank" rel="noreferrer"
                  className="text-blue-500 underline break-all">
                  https://masothue.com/tra-cuu-ma-so-thue-ca-nhan
                </a>)
              </p>
            </div>
          </div>

          <SF label="Tình trạng hôn nhân" value={values.marital_status}
            onChange={handleSelect('marital_status')} required options={[
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
              onChange={handleChange('emergency_contact_name')} required placeholder="Nguyễn Văn B" />
            <TF label="Mối quan hệ" value={values.emergency_contact_relationship}
              onChange={handleChange('emergency_contact_relationship')} required placeholder="Bố, mẹ, vợ, chồng..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TF label="Số điện thoại" value={values.emergency_contact_phone}
              onChange={handleChange('emergency_contact_phone')} required placeholder="0987654321" />
            <TF label="Ngày sinh" value={values.emergency_contact_dob}
              onChange={handleChange('emergency_contact_dob')} type="date" required />
          </div>

          <TF label="Nghề nghiệp" value={values.emergency_contact_occupation}
            onChange={handleChange('emergency_contact_occupation')} required placeholder="Giáo viên, Bác sĩ..." />

          <TF label="Địa chỉ" value={values.emergency_contact_address}
            onChange={handleChange('emergency_contact_address')} required multiline rows={2}
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
              { value: '0', label: 'Không thử việc' },
              { value: '1', label: '1 tháng' },
              { value: '2', label: '2 tháng' },
              { value: '3', label: '3 tháng' },
              { value: '6', label: '6 tháng' },
            ]} />

          <SF
            label="Tỉ lệ thử việc"
            value={values.probation_rate}
            onChange={handleSelect('probation_rate')}
            options={[
              { value: 'OPTION_1', label: 'Tháng đầu 85%, tháng sau 100%' },
              { value: 'OPTION_2', label: 'Tháng đầu 100%, tháng sau 100%' },
            ]}
          />
          {/* Thông tin ngân hàng */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">🏦 Thông tin ngân hàng</p>

            <TF
              label="Số tài khoản"
              value={values.bank_account}
              onChange={handleChange('bank_account')}
              placeholder="123456789012"
            />

            <TF
              label="Tên ngân hàng"
              value={values.bank_name}
              onChange={handleChange('bank_name')}
              placeholder="ACB, Vietcombank, Techcombank..."
            />

            <div>
              <TF
                label="Chi nhánh"
                value={values.bank_branch}
                onChange={handleChange('bank_branch')}
                placeholder="Chi nhánh Hà Nội, TP.HCM..."
              />
              <p className="text-xs text-gray-400 mt-1 px-1">
                * Trong trường hợp không phải Ngân hàng ACB
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-2">
            <p className="text-sm font-semibold text-blue-800 mb-3">📋 Tóm tắt thông tin</p>
            <div className="space-y-1.5">
              {[
                ['Họ tên', values.candidate_name],
                ['Email', values.candidate_email],
                ['Phòng/Ban', values.sub_department],
                ['Bộ phận', values.section],
                ['Cấp bậc', values.job_rank],
                ['CCCD', values.citizen_id],
                ['File CCCD', citizenIdFile ? `✓ ${citizenIdFile.name}` : null],
                ['Ảnh VNeID', vneidScreenshotFile ? `✓ ${vneidScreenshotFile.name}` : null],
                ['Lương', values.salary ? `${parseInt(values.salary).toLocaleString()} VNĐ` : null],
                ['Phụ cấp', values.allowance ? `${parseInt(values.allowance).toLocaleString()} VNĐ` : null],
              ].map(([label, val]) => (
                <div key={label as string} className="flex gap-2 text-sm">
                  <span className="text-blue-500 w-24 shrink-0">{label}:</span>
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