// ==========================================
// FILE: pages/EmployeeOnboardingForm.tsx
// Form công khai cho nhân viên điền thông tin (KHÔNG cần login)
// Khớp chính xác với EmployeeInfoForm.tsx — cùng bước, cùng fields, cùng logic
// ==========================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Steps,
  Card,
  message,
  Result,
  Spin,
  Typography,
  Space,
  Alert,
  Radio,
} from 'antd';
import {
  UserOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  ContactsOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============================================
// CONSTANTS — đồng bộ hoàn toàn với EmployeeInfoForm.tsx
// ============================================

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
  'ADS', 'ADS2', 'KD 1', 'KD 2', 'KD 3', 'KD 4', 'KD MN',
  'CSKH MB', 'CSKH MN', 'Media MB', 'Media MN', 'Giám sát nội bộ',
  'HCNS', 'Kế toán', 'Truyền thông',
  'TTTH 01', 'TTTH 02', 'TTTH 03', 'TTTH 04', 'TTTH 06',
  'Xây group', 'TTTH 08', 'TTTH 05', 'TTTH 07', 'TTTH 09',
  'TTTH 10', 'TTTH 11', 'Tiktok 1', 'Tiktok 2', 'Tiktok 3',
  'Tiktok 5', 'TTTH 15', 'Pháp chế', 'Tiktok 4', 'KD 5',
  'Mua hàng', 'Công nghệ thông tin', 'Tiktok 6', 'Tiktok 7',
  'Tiktok 8', 'Tiktok 9', 'Tiktok 10',
] as const;

const SECTION_OPTIONS = ['Phẫu thuật thẩm mỹ', 'Da liễu'] as const;

const RANK_OPTIONS = ['Nhân viên', 'Trưởng phòng', 'Leader', 'Phó giám đốc', 'Giám đốc', 'Phó phòng'] as const;

const WORK_FORM_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
] as const;

const EDUCATION_LEVEL_OPTIONS = [
  'Thạc sĩ', 'Cử nhân đại học', 'Cử nhân cao đẳng', 'Trung cấp', 'Khác',
] as const;

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

// Dùng state riêng để track work_type (giống EmployeeInfoForm)
interface FormExtras {
  work_type: string;
  citizen_id_file: File | null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EmployeeOnboardingForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed, hiển thị là 1-6
  const totalSteps = 6;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // State riêng cho các trường không dùng antd Form (khớp với EmployeeInfoForm)
  const [extras, setExtras] = useState<FormExtras>({
    work_type: '',
    citizen_id_file: null,
  });

  // ===== FETCH ONBOARDING DATA =====
  useEffect(() => {
    fetchOnboardingData();
  }, [token]);

  const fetchOnboardingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api-hrm/employee-onboarding-form/by-token/${token}/`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      setOnboardingData(data.data);
      form.setFieldsValue({
        candidate_name: data.data.candidate_name,
        candidate_email: data.data.candidate_email,
      });
    } catch (err) {
      setError('Không thể tải thông tin. Vui lòng kiểm tra lại link.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VALIDATION — khớp với validateStep() của EmployeeInfoForm
  // ============================================

  const validateStep = async (step: number): Promise<boolean> => {
    // step là 1-indexed để khớp với EmployeeInfoForm
    switch (step) {
      case 1: {
        try {
          await form.validateFields([
            'candidate_name', 'date_of_birth', 'candidate_phone',
          ]);
          return true;
        } catch (err) {
          return false;
        }
        // const vals = form.getFieldsValue();
        // if (!vals.candidate_name?.trim()) {
        //   message.error('Vui lòng nhập họ và tên'); return false;
        // }
        // if (!vals.date_of_birth) {
        //   message.error('Vui lòng chọn ngày sinh'); return false;
        // }
        // if (!vals.candidate_phone?.trim()) {
        //   message.error('Vui lòng nhập số điện thoại'); return false;
        // }
        // return true;
      }
      case 3: {
        const vals = form.getFieldsValue();
        if (!vals.citizen_id?.trim()) {
          message.error('Vui lòng nhập số CCCD'); return false;
        }
        if (!extras.citizen_id_file) {
          message.error('Vui lòng upload file CCCD (PDF)'); return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const stepNumber = currentStep + 1; // chuyển sang 1-indexed
    const valid = await validateStep(stepNumber);
    if (valid) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  // ============================================
  // FILE HANDLER — khớp với handleFileChange() của EmployeeInfoForm
  // ============================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        message.error('File CCCD phải là định dạng PDF');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error('File CCCD không được vượt quá 5MB');
        e.target.value = '';
        return;
      }
      setExtras((prev) => ({ ...prev, citizen_id_file: file }));
    }
  };


  const handleSubmit = async () => {
    if (!(await validateStep(1))) return;
    // Check file manual
    if (!extras.citizen_id_file) {
      message.error('Vui lòng upload file CCCD (PDF)');
      return;
    }
    setSubmitting(true);
    try {
      const values = form.getFieldsValue(true);
      const payload = new FormData();

      const append = (key: string, val: any) => {
        if (val !== undefined && val !== null && val !== '') {
          payload.append(key, val);
        }
      };

      // ── Step 1: Thông tin cơ bản ──
      append('candidate_name',  values.candidate_name);
      append('candidate_email', values.candidate_email);
      append('candidate_phone', values.candidate_phone);
      append('date_of_birth',   values.date_of_birth?.format?.('YYYY-MM-DD') ?? values.date_of_birth);
      append('gender',          values.gender);
      append('education_level', values.education_level);
      append('facebook_link',   values.facebook_link);
      append('start_date',      values.start_date?.format?.('YYYY-MM-DD') ?? values.start_date);

      // ── Step 2: Thông tin công việc ──
      append('region',          values.region);
      append('block',           values.block);
      append('sub_department',  values.sub_department);
      append('section',         values.section);
      append('rank',            values.job_rank);   // backend nhận 'rank' (khớp InfoForm)
      append('doctor_team',     values.doctor_team);
      append('work_form',       values.work_form);
      append('work_type',       extras.work_type);  // set bởi work_form onChange
      append('work_location',   values.work_location);

      // ── Step 3: CCCD ──
      append('citizen_id',             values.citizen_id);
      if (extras.citizen_id_file) {
        payload.append('citizen_id_file', extras.citizen_id_file);
      }
      append('citizen_id_issue_date',  values.citizen_id_issue_date?.format?.('YYYY-MM-DD') ?? values.citizen_id_issue_date);
      append('citizen_id_issue_place', values.citizen_id_issue_place);
      append('old_id_number',          values.old_id_number);

      // ── Step 4: Địa chỉ & BHXH ──
      append('permanent_address',       values.permanent_address);
      append('current_address',         values.current_address);
      append('social_insurance_number', values.social_insurance_number);
      append('tax_code',                values.tax_code);
      append('marital_status',          values.marital_status);

      // ── Step 5: Người liên hệ khẩn cấp ──
      append('emergency_contact_name',         values.emergency_contact_name);
      append('emergency_contact_relationship', values.emergency_contact_relationship);
      append('emergency_contact_phone',        values.emergency_contact_phone);
      append('emergency_contact_dob',          values.emergency_contact_dob?.format?.('YYYY-MM-DD') ?? values.emergency_contact_dob);
      append('emergency_contact_occupation',   values.emergency_contact_occupation);
      append('emergency_contact_address',      values.emergency_contact_address);

      // ── Step 6: Lương ──
      append('salary',                  values.salary);
      append('allowance',               values.allowance);
      append('probation_period_months', values.probation_period_months);

      // Debug log (giống EmployeeInfoForm)
      console.log('📤 Payload fields:');
      for (const [k, v] of payload.entries()) {
        console.log(`  ${k}:`, v instanceof File ? `[File: ${v.name}]` : v);
      }

      const res = await fetch(
        `http://localhost:8000/api-hrm/employee-onboarding-form/submit/${token}/`,
        {
          method: 'POST',
          body: payload,
          // KHÔNG set Content-Type — browser tự set multipart boundary
        }
      );

      console.log('📥 Response:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Error:', JSON.stringify(errorData, null, 2));
        const messages: string[] = [];
        Object.entries(errorData).forEach(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : String(val);
          messages.push(`${field}: ${msg}`);
        });
        message.error(messages.length ? messages.join('\n') : 'Lưu thất bại. Kiểm tra console để xem chi tiết.');
        return;
      }

      const data = await res.json();
      console.log('✅ Success:', data);

      const taskList = (data.completed_tasks ?? []).map((t: any) => `- ${t.name}`).join('\n');
      message.success(`✅ ${data.message ?? 'Cập nhật thành công!'}`);
      setSuccess(true);
    } catch (error) {
      console.error('💥 Exception:', error);
      message.error('Có lỗi xảy ra khi kết nối server. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // LOADING / ERROR / SUCCESS
  // ============================================

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 20 }}>
        <Result
          status="error"
          title="Không thể truy cập form"
          subTitle={error}
          extra={[<Button type="primary" key="contact">Liên hệ HR</Button>]}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 20 }}>
        <Result
          status="success"
          title="Hoàn thành!"
          subTitle="Cảm ơn bạn đã điền thông tin. HR sẽ liên hệ với bạn sớm."
          extra={[<Button type="primary" key="close" onClick={() => window.close()}>Đóng trang</Button>]}
        />
      </div>
    );
  }

  // ============================================
  // RENDER STEPS — khớp hoàn toàn với EmployeeInfoForm
  // ============================================

  const renderStep = () => {
    switch (currentStep) {
      // ── BƯỚC 1 (index 0): Thông tin cơ bản ────────────────────────────
      case 0:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Thông tin cơ bản</Title>

            <Form.Item label="Họ và tên" name="candidate_name"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item label="Ngày sinh" name="date_of_birth"
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày sinh" format="DD/MM/YYYY" />
            </Form.Item>

            {/* gender dùng Select, giống EmployeeInfoForm */}
            <Form.Item label={<>Giới tính <span style={{ color: 'red' }}>*</span></>} name="gender" initialValue="M">
              <Select>
                <Select.Option value="M">Nam</Select.Option>
                <Select.Option value="F">Nữ</Select.Option>
                <Select.Option value="O">Khác</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Số điện thoại" name="candidate_phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
              <Input placeholder="0123456789" />
            </Form.Item>

            <Form.Item label="Email" name="candidate_email">
              <Input disabled />
            </Form.Item>

            {/* start_date — nhân viên tự xác nhận ngày bắt đầu */}
            <Form.Item label="Ngày bắt đầu" name="start_date">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label="Trình độ học vấn" name="education_level">
              <Select placeholder="-- Chọn trình độ --" allowClear>
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Link Facebook" name="facebook_link">
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
          </div>
        );

      // ── BƯỚC 2 (index 1): Thông tin công việc chi tiết ────────────────
      case 1:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Thông tin công việc chi tiết</Title>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Form.Item label="Vùng/Miền" name="region" style={{ marginBottom: 0 }}>
                <Radio.Group style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                  {REGION_OPTIONS.map((opt) => (
                    <Radio key={opt} value={opt}>{opt}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Khối" name="block" style={{ marginBottom: 0 }}>
                <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {BLOCK_OPTIONS.map((opt) => (
                    <Radio key={opt} value={opt}>{opt}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item label="Phòng/Ban" name="sub_department">
              <Select placeholder="-- Chọn phòng/ban --" showSearch allowClear>
                {SUB_DEPARTMENT_OPTIONS.map((opt) => (
                  <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Bộ phận (Section)" name="section">
                <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {SECTION_OPTIONS.map((opt) => (
                    <Radio key={opt} value={opt}>{opt}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Cấp bậc" name="job_rank">
                <Select placeholder="-- Chọn cấp bậc --" allowClear>
                  {RANK_OPTIONS.map((opt) => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item label="Team Bác sĩ" name="doctor_team">
              <Input placeholder="Team Dr. Nguyễn Văn A..." />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Hình thức làm việc" name="work_form">
                {/* onChange set cả work_type, giống EmployeeInfoForm */}
                <Radio.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                  onChange={(e) => {
                    const selected = WORK_FORM_OPTIONS.find((o) => o.value === e.target.value);
                    setExtras((prev) => ({ ...prev, work_type: selected?.label ?? '' }));
                  }}
                >
                  {WORK_FORM_OPTIONS.map((opt) => (
                    <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Địa điểm làm việc" name="work_location">
                <Select placeholder="-- Chọn địa điểm làm việc --" allowClear>
                  {WORK_LOCATION_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </div>
        );

      // ── BƯỚC 3 (index 2): Thông tin CCCD ──────────────────────────────
      case 2:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Thông tin CCCD</Title>

            <Form.Item label={<>Số CCCD <span style={{ color: 'red' }}>*</span></>} name="citizen_id"
              rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
              <Input placeholder="001234567890" />
            </Form.Item>

            {/* input file thuần — giống EmployeeInfoForm, KHÔNG dùng antd Upload */}
            <Form.Item label={<>File CCCD (2 mặt - PDF) <span style={{ color: 'red' }}>*</span></>}>
              <input
                type="file"
                accept=".pdf"
                style={{
                  width: '100%',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '6px 12px',
                }}
                onChange={handleFileChange}
              />
              <p style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Chỉ chấp nhận file PDF, tối đa 5MB
              </p>
              {extras.citizen_id_file && (
                <p style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                  ✓ Đã chọn: {extras.citizen_id_file.name}
                </p>
              )}
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Ngày cấp" name="citizen_id_issue_date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày cấp" />
              </Form.Item>
              <Form.Item label="Nơi cấp" name="citizen_id_issue_place">
                <Input placeholder="Cục Cảnh sát..." />
              </Form.Item>
            </div>

            <Form.Item label="Số CMND cũ (nếu có)" name="old_id_number">
              <Input placeholder="123456789" />
            </Form.Item>
          </div>
        );

      // ── BƯỚC 4 (index 3): Địa chỉ & BHXH ─────────────────────────────
      case 3:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Địa chỉ & BHXH</Title>

            <Form.Item label="Địa chỉ thường trú" name="permanent_address">
              <TextArea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
            </Form.Item>

            <Form.Item label="Địa chỉ hiện tại" name="current_address">
              <TextArea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Mã BHXH" name="social_insurance_number">
                <Input placeholder="1234567890" />
              </Form.Item>
              <Form.Item label="Mã số thuế" name="tax_code">
                <Input placeholder="0123456789" />
              </Form.Item>
            </div>

            <Form.Item label="Tình trạng hôn nhân" name="marital_status" initialValue="SINGLE">
              <Select>
                <Select.Option value="SINGLE">Độc thân</Select.Option>
                <Select.Option value="MARRIED">Đã kết hôn</Select.Option>
                <Select.Option value="DIVORCED">Ly hôn</Select.Option>
                <Select.Option value="WIDOWED">Góa</Select.Option>
              </Select>
            </Form.Item>
          </div>
        );

      // ── BƯỚC 5 (index 4): Người liên hệ khẩn cấp ─────────────────────
      case 4:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Người liên hệ khẩn cấp</Title>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Họ và tên" name="emergency_contact_name">
                <Input placeholder="Nguyễn Văn B" />
              </Form.Item>
              <Form.Item label="Mối quan hệ" name="emergency_contact_relationship">
                <Input placeholder="Bố, mẹ, vợ, chồng..." />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item label="Số điện thoại" name="emergency_contact_phone">
                <Input placeholder="0987654321" />
              </Form.Item>
              <Form.Item label="Ngày sinh" name="emergency_contact_dob">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
              </Form.Item>
            </div>

            <Form.Item label="Nghề nghiệp" name="emergency_contact_occupation">
              <Input placeholder="Giáo viên, Bác sĩ..." />
            </Form.Item>

            <Form.Item label="Địa chỉ" name="emergency_contact_address">
              <TextArea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
            </Form.Item>
          </div>
        );

      // ── BƯỚC 6 (index 5): Thông tin lương ─────────────────────────────
      case 5:
        return (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>Thông tin lương</Title>

            <Form.Item label="Mức lương cơ bản (VNĐ)" name="salary">
              <Input type="number" placeholder="10000000" />
            </Form.Item>

            <Form.Item label="Phụ cấp (VNĐ)" name="allowance">
              <Input type="number" placeholder="2000000" />
            </Form.Item>

            <Form.Item label="Số tháng thử việc" name="probation_period_months" initialValue="2">
              <Select>
                <Select.Option value="1">1 tháng</Select.Option>
                <Select.Option value="2">2 tháng</Select.Option>
                <Select.Option value="3">3 tháng</Select.Option>
                <Select.Option value="6">6 tháng</Select.Option>
              </Select>
            </Form.Item>

            {/* Tóm tắt thông tin — giống EmployeeInfoForm step 6 */}
            <div style={{
              background: '#e6f4ff',
              border: '1px solid #91caff',
              borderRadius: 8,
              padding: 16,
              marginTop: 24,
            }}>
              <Title level={5} style={{ color: '#003eb3', marginBottom: 8 }}>📋 Tóm tắt thông tin</Title>
              {(() => {
                const vals = form.getFieldsValue();
                return (
                  <ul style={{ fontSize: 14, color: '#003eb3', margin: 0, paddingLeft: 16 }}>
                    <li>Họ tên: {vals.candidate_name || '(Chưa điền)'}</li>
                    <li>Email: {vals.candidate_email || '(Chưa điền)'}</li>
                    <li>CCCD: {vals.citizen_id || '(Chưa điền)'}</li>
                    <li>File CCCD: {extras.citizen_id_file ? `✓ ${extras.citizen_id_file.name}` : '(Chưa tải lên)'}</li>
                    <li>Lương: {vals.salary ? `${parseInt(vals.salary).toLocaleString()} VNĐ` : '(Chưa điền)'}</li>
                  </ul>
                );
              })()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepNumber = currentStep + 1; // hiển thị 1-indexed

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '40px 20px' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Thông tin Onboarding</Title>
          <Space direction="vertical">
            <Text>Xin chào, <strong>{onboardingData?.candidate_name}</strong>!</Text>
            <Text type="secondary">
              Vị trí: {onboardingData?.position_name} — {onboardingData?.department_name}
            </Text>
            <Text type="secondary">
              Ngày bắt đầu: {new Date(onboardingData?.start_date || '').toLocaleDateString('vi-VN')}
            </Text>
          </Space>
        </div>

        {/* Warning */}
        <Alert
          message="Lưu ý"
          description={`Link này có hiệu lực đến ${new Date(onboardingData?.token_expires_at || '').toLocaleString('vi-VN')}. Vui lòng hoàn thành trong thời hạn.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* Steps indicator */}
        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 32 }}
          items={[
            { title: 'Cơ bản',    icon: <UserOutlined /> },
            { title: 'Công việc', icon: <ApartmentOutlined /> },
            { title: 'CCCD',      icon: <FileTextOutlined /> },
            { title: 'Địa chỉ',  icon: <HomeOutlined /> },
            { title: 'Liên hệ',  icon: <ContactsOutlined /> },
            { title: 'Lương',     icon: <DollarOutlined /> },
          ]}
        />

        {/* Progress bar — giống EmployeeInfoForm */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8 }}>
            <div
              style={{
                background: '#1677ff',
                borderRadius: 4,
                height: 8,
                width: `${(stepNumber / totalSteps) * 100}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            Bước {stepNumber} / {totalSteps}
          </Text>
        </div>

        {/* Form body */}
        <Form form={form} layout="vertical">
          {renderStep()}

          {/* Footer navigation — khớp với EmployeeInfoForm */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 32,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0',
          }}>
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0 || submitting}
            >
              ← Quay lại
            </Button>

            {currentStep < totalSteps - 1 ? (
              <Button type="primary" onClick={handleNext} disabled={submitting}>
                Tiếp theo →
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                {submitting ? 'Đang gửi...' : '✓ Hoàn thành'}
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

// ==========================================
// THÊM VÀO ROUTER (App.tsx hoặc routes.tsx)
// ==========================================
/*
<Route
  path="/onboarding/employee-form/:token"
  element={<EmployeeOnboardingForm />}
/>
*/