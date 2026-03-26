import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { employeesAPI, Employee } from '../utils/api';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// ============================================
// CONSTANTS
// ============================================

const PROBATION_RATE_LABELS: Record<string, string> = {
  OPTION_1: 'Tháng đầu 85%, tháng sau 100%',
  OPTION_2: 'Tháng đầu 100%, tháng sau 100%',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PROBATION: 'Hợp đồng thử việc',
  INTERN: 'Hợp đồng thực tập sinh',
  COLLABORATOR: 'Hợp đồng cộng tác viên',
  ONE_YEAR: 'Hợp đồng lao động 1 năm',
  THREE_YEAR: 'Hợp đồng lao động 3 năm',
  INDEFINITE: 'Hợp đồng vô thời hạn',
  SERVICE: 'Hợp đồng dịch vụ',
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'Độc thân',
  MARRIED: 'Đã kết hôn',
  DIVORCED: 'Ly hôn',
  WIDOWED: 'Góa',
};

const WORK_FORM_LABELS: Record<string, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERN: 'Thực tập',
  COLLABORATOR: 'Cộng tác viên',
};

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  HIGH_SCHOOL: 'Trung học phổ thông',
  ASSOCIATE: 'Cao đẳng',
  BACHELOR: 'Đại học',
  MASTER: 'Thạc sĩ',
  DOCTORATE: 'Tiến sĩ',
  OTHER: 'Khác',
};

const FILE_STATUS_LABELS: Record<string, string> = {
  COMPLETE: 'Nộp đủ',
  NEED_SUPPLEMENT: 'Cần bổ sung hồ sơ',
  NOT_SUBMITTED: 'Chưa nộp',
  PENDING_REVIEW: 'Chờ rà soát',
};

const CCCD_ISSUE_PLACE_LABELS: Record<string, string> = {
  POLICE_ADMIN: 'Cục cảnh sát Quản lý hành chính về Trật tự xã hội',
  MINISTRY_PUBLIC_SECURITY: 'Bộ Công An',
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Đang làm việc', color: 'bg-green-100 text-green-800' },
    INACTIVE: { label: 'Đã nghỉ', color: 'bg-red-100 text-red-800' },
    PROBATION: { label: 'Thử việc', color: 'bg-yellow-100 text-yellow-800' },
  };
  const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Chưa có dữ liệu';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

const EmployeeShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadEmployee(Number(id));
  }, [id, location.key]);

  const loadEmployee = async (employeeId: number) => {
    try {
      setLoading(true);
      const data = await employeesAPI.getById(employeeId);
      setEmployee(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOADING / ERROR
  // ============================================

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <span className="text-lg text-gray-600">Đang tải thông tin nhân viên...</span>
      </div>
    </div>
  );

  if (error || !employee) return (
    <div className="p-6">
      <button onClick={() => navigate('/dashboard/employees')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeftIcon className="w-5 h-5 mr-2" /> Quay lại danh sách
      </button>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Lỗi tải dữ liệu</h3>
            <p className="text-red-700 mt-1">{error || 'Không tìm thấy nhân viên'}</p>
            <button onClick={() => id && loadEmployee(Number(id))}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const emp = employee as any;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/employees')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Quay lại danh sách
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.full_name}</h1>
            <p className="text-gray-600 mt-1 text-lg">
              {employee.position?.title || 'N/A'} — {employee.department?.name || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(employee.employment_status)}
            <button
              onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Sửa thông tin
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">

        {/* ── Thông tin nhân viên ── */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Thông tin nhân viên
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Mã nhân viên</label>
              <p className="font-medium text-indigo-700">{employee.employee_id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Họ và tên</label>
              <p className="font-medium">{employee.full_name || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email cá nhân</label>
              <p className="font-medium">{employee.personal_email || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <p className="font-medium">{employee.phone_number || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Giới tính</label>
              <p className="font-medium">
                {employee.gender === 'M' ? 'Nam' : employee.gender === 'F' ? 'Nữ' : employee.gender === 'O' ? 'Khác' : 'Chưa có dữ liệu'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày sinh</label>
              <p className="font-medium">
                {formatDate(employee.date_of_birth)}
              </p>
            </div>
            {emp.ethnicity && (
              <div>
                <label className="text-sm text-gray-600">Dân tộc</label>
                <p className="font-medium">{emp.ethnicity}</p>
              </div>
            )}
            {emp.nationality && (
              <div>
                <label className="text-sm text-gray-600">Quốc tịch</label>
                <p className="font-medium">{emp.nationality}</p>
              </div>
            )}
            {emp.marital_status && (
              <div>
                <label className="text-sm text-gray-600">Tình trạng hôn nhân</label>
                <p className="font-medium">{MARITAL_STATUS_LABELS[emp.marital_status] || emp.marital_status}</p>
              </div>
            )}
            {emp.facebook_link && (
              <div>
                <label className="text-sm text-gray-600">Facebook</label>
                <a href={emp.facebook_link} target="_blank" rel="noopener noreferrer"
                  className="block font-medium text-blue-600 hover:text-blue-800 underline truncate">
                  {emp.facebook_link}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Thông tin công việc ── */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">💼</span>
            Thông tin công việc
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Phòng ban</label>
              <p className="font-medium">{employee.department?.name || 'Chưa có dữ liệu'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Vị trí</label>
              <p className="font-medium">{employee.position?.title || 'Chưa có dữ liệu'}</p>
            </div>
            {emp.rank && (
              <div>
                <label className="text-sm text-gray-600">Cấp bậc</label>
                <p className="font-medium">{emp.rank}</p>
              </div>
            )}
            {emp.section && (
              <div>
                <label className="text-sm text-gray-600">Bộ phận</label>
                <p className="font-medium">{emp.section}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Quản lý trực tiếp</label>
              <p className="font-medium">{employee.manager_name || 'Chưa có dữ liệu'}</p>
            </div>
            {emp.doctor_team && (
              <div>
                <label className="text-sm text-gray-600">Team Bác sĩ</label>
                <p className="font-medium">{emp.doctor_team}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Ngày bắt đầu làm việc</label>
              <p className="font-medium">
                {formatDate(employee.start_date)}
              </p>
            </div>
            {emp.work_form && (
              <div>
                <label className="text-sm text-gray-600">Hình thức làm việc</label>
                <p className="font-medium">{WORK_FORM_LABELS[emp.work_form] || emp.work_form}</p>
              </div>
            )}
            {emp.region && (
              <div>
                <label className="text-sm text-gray-600">Vùng/Miền</label>
                <p className="font-medium">{emp.region}</p>
              </div>
            )}
            {emp.block && (
              <div>
                <label className="text-sm text-gray-600">Khối</label>
                <p className="font-medium">{emp.block}</p>
              </div>
            )}
            {emp.work_location_display && (
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Địa điểm làm việc</label>
                <p className="font-medium">{emp.work_location_display}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Giấy tờ tùy thân & địa chỉ ── */}
        {(emp.cccd_number || emp.permanent_residence || emp.current_address || emp.social_insurance_number || emp.tax_code) && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🪪</span>
              Giấy tờ tùy thân & địa chỉ
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {emp.cccd_number && (
                <div>
                  <label className="text-sm text-gray-600">Số CCCD</label>
                  <p className="font-medium font-mono">{emp.cccd_number}</p>
                </div>
              )}
              {emp.cccd_issue_date && (
                <div>
                  <label className="text-sm text-gray-600">Ngày cấp CCCD</label>
                  <p className="font-medium">
                    {formatDate(emp.cccd_issue_date)}
                  </p>
                </div>
              )}
              {emp.cccd_issue_place && (
                <div>
                  <label className="text-sm text-gray-600">Nơi cấp CCCD</label>
                  <p className="font-medium">
                    {CCCD_ISSUE_PLACE_LABELS[emp.cccd_issue_place] || emp.cccd_issue_place}
                  </p>
                </div>
              )}
              {emp.old_id_number && (
                <div>
                  <label className="text-sm text-gray-600">Số CMND cũ</label>
                  <p className="font-medium font-mono">{emp.old_id_number}</p>
                </div>
              )}
              {emp.birth_place && (
                <div>
                  <label className="text-sm text-gray-600">Nơi đăng ký khai sinh</label>
                  <p className="font-medium">{emp.birth_place}</p>
                </div>
              )}
              {emp.social_insurance_number && (
                <div>
                  <label className="text-sm text-gray-600">Mã số BHXH</label>
                  <p className="font-medium">{emp.social_insurance_number}</p>
                </div>
              )}
              {emp.tax_code && (
                <div>
                  <label className="text-sm text-gray-600">Mã số thuế</label>
                  <p className="font-medium">{emp.tax_code}</p>
                </div>
              )}
            </div>
            {(emp.permanent_residence || emp.current_address) && (
              <div className="mt-4 space-y-3">
                {emp.permanent_residence && (
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ thường trú</label>
                    <p className="font-medium">{emp.permanent_residence}</p>
                  </div>
                )}
                {emp.current_address && (
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ hiện tại</label>
                    <p className="font-medium">{emp.current_address}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Trình độ học vấn ── */}
        {emp.education_level && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🎓</span>
              Trình độ học vấn
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Trình độ</label>
                <p className="font-medium">{EDUCATION_LEVEL_LABELS[emp.education_level] || emp.education_level}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Thông tin tài chính & ngân hàng ── */}
        {(employee.bank_name || employee.bank_account || emp.bank_branch) && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">💳</span>
              Thông tin tài chính & ngân hàng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Ngân hàng</label>
                <p className="font-medium">{employee.bank_name || 'Chưa có dữ liệu'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Số tài khoản</label>
                <p className="font-medium">{employee.bank_account || 'Chưa có dữ liệu'}</p>
              </div>
              {emp.bank_branch && (
                <div>
                  <label className="text-sm text-gray-600">Chi nhánh</label>
                  <p className="font-medium">{emp.bank_branch}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Lương & Hợp đồng ── */}
        {(emp.basic_salary != null || emp.contract_type) && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">💰</span>
              Lương & Hợp đồng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {emp.basic_salary != null && (
                <div>
                  <label className="text-sm text-gray-600">Lương cơ bản</label>
                  <p className="font-medium text-green-700 text-lg">
                    {Number(emp.basic_salary).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )}
              {emp.allowance != null && (
                <div>
                  <label className="text-sm text-gray-600">Phụ cấp</label>
                  <p className="font-medium text-green-700">
                    {Number(emp.allowance).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )}
              {emp.contract_type && (
                <div>
                  <label className="text-sm text-gray-600">Loại hợp đồng</label>
                  <p className="font-medium">{emp.contract_type_display || CONTRACT_TYPE_LABELS[emp.contract_type] || emp.contract_type}</p>
                </div>
              )}
              {emp.probation_months != null && (
                <div>
                  <label className="text-sm text-gray-600">Thời gian thử việc</label>
                  <p className="font-medium">{emp.probation_months} tháng</p>
                </div>
              )}
              {emp.probation_end_date && (
                <div>
                  <label className="text-sm text-gray-600">Ngày kết thúc thử việc</label>
                  <p className="font-medium">{formatDate(emp.probation_end_date)}</p>
                </div>
              )}
              {emp.probation_rate && (
                <div>
                  <label className="text-sm text-gray-600">Tỉ lệ thử việc</label>
                  <p className="font-medium">{PROBATION_RATE_LABELS[emp.probation_rate] || emp.probation_rate}</p>
                </div>
              )}
              {emp.probation_salary_percentage != null && (
                <div>
                  <label className="text-sm text-gray-600">% lương thử việc</label>
                  <p className="font-medium">{emp.probation_salary_percentage_display || `${emp.probation_salary_percentage}%`}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Trạng thái hồ sơ ── */}
        {emp.file_status && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Trạng thái hồ sơ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Trạng thái hồ sơ</label>
                <p className="font-medium">{emp.file_status_display || FILE_STATUS_LABELS[emp.file_status] || emp.file_status}</p>
              </div>
              {emp.file_submission_deadline && (
                <div>
                  <label className="text-sm text-gray-600">Hạn nộp hồ sơ</label>
                  <p className="font-medium">{formatDate(emp.file_submission_deadline)}</p>
                </div>
              )}
              {emp.file_submission_date && (
                <div>
                  <label className="text-sm text-gray-600">Ngày nộp hồ sơ</label>
                  <p className="font-medium">{formatDate(emp.file_submission_date)}</p>
                </div>
              )}
              {emp.file_review_notes && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">Ghi chú hồ sơ</label>
                  <p className="font-medium">{emp.file_review_notes}</p>
                </div>
              )}
              {emp.training_presentation_viewed != null && (
                <div>
                  <label className="text-sm text-gray-600">Đã xem bài thuyết trình đào tạo</label>
                  <p className="font-medium">
                    {emp.training_presentation_viewed
                      ? <span className="text-green-600">✓ Đã xem</span>
                      : <span className="text-gray-500">Chưa xem</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Thông tin tài khoản hệ thống ── */}
        {employee.user && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🔐</span>
              Thông tin tài khoản hệ thống
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Tên đăng nhập</label>
                <p className="font-medium">{employee.user.username || 'Chưa có tài khoản'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium">{employee.user.email || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Nhân viên HR</label>
                <p className="font-medium">{employee.is_hr ? 'Có' : 'Không'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Thông tin người liên hệ khẩn cấp ── */}
        {emp.emergency_contact_name && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🆘</span>
              Thông tin người liên hệ khẩn cấp
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Họ và tên</label>
                <p className="font-medium">{emp.emergency_contact_name}</p>
              </div>
              {emp.emergency_contact_relationship && (
                <div>
                  <label className="text-sm text-gray-600">Mối quan hệ</label>
                  <p className="font-medium">{emp.emergency_contact_relationship}</p>
                </div>
              )}
              {emp.emergency_contact_phone && (
                <div>
                  <label className="text-sm text-gray-600">Số điện thoại</label>
                  <p className="font-medium">{emp.emergency_contact_phone}</p>
                </div>
              )}
              {emp.emergency_contact_dob && (
                <div>
                  <label className="text-sm text-gray-600">Ngày sinh</label>
                  <p className="font-medium">
                    {formatDate(emp.emergency_contact_dob)}
                  </p>
                </div>
              )}
              {emp.emergency_contact_occupation && (
                <div>
                  <label className="text-sm text-gray-600">Nghề nghiệp</label>
                  <p className="font-medium">{emp.emergency_contact_occupation}</p>
                </div>
              )}
              {emp.emergency_contact_address && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">Địa chỉ</label>
                  <p className="font-medium">{emp.emergency_contact_address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-lg border p-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            Ngày tạo: {formatDate(employee.created_at)}
            {employee.updated_at !== employee.created_at && (
              <span className="ml-4">
                Cập nhật lần cuối: {formatDate(employee.updated_at)}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Sửa thông tin
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmployeeShow;