import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  LinkIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import onboardingService from '../services/onboarding.service';

// ============================================
// TYPES
// ============================================

type TokenStatus = 'not_generated' | 'active' | 'expired' | 'completed';

type OnboardingItem = {
  id: number;
  onboarding_code?: string | null;
  candidate_name: string;
  candidate_email?: string | null;
  position?: { id: number; title: string; code: string } | null;
  department?: { id: number; name: string; code: string } | null;
  department_name?: string | null;
  start_date: string;
  status?: string | null;
  progress_percentage?: number | string | null;
  full_name?: string | null;
  position_title?: string | null;
  token_status?: TokenStatus | null;
  token_expires_at?: string | null;
  employee_form_url?: string | null;
  employee_info_completed?: boolean;
};

// Form HR điền — chỉ 4 trường cơ bản
type CreateOnboardingForm = {
  candidate_name: string;
  gender: 'M' | 'F' | 'O';
  candidate_email: string;
  candidate_phone: string;
};

type ApiResponse<T> = { results?: T[]; count?: number } | T[];

const getProgressPercentage = (value?: number | string | null): number => {
  if (value == null) return 0;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const getStatusBadge = (status?: string | null) => {
  const map: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-700' },
    PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
    IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  };
  if (!status) return null;
  const cfg = map[status] ?? map.DRAFT;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const TokenBadge: React.FC<{ status?: TokenStatus | null; completed?: boolean }> = ({ status, completed }) => {
  if (completed || status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircleIcon className="w-3 h-3" /> Đã điền thông tin
      </span>
    );
  }
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <ClockIcon className="w-3 h-3" /> Link còn hạn
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <ExclamationCircleIcon className="w-3 h-3" /> Link hết hạn
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          Chưa tạo link
        </span>
      );
  }
};

// ============================================
// CREATE ONBOARDING MODAL — chỉ 4 trường
// ============================================

type CreateModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const CreateOnboardingModal: React.FC<CreateModalProps> = ({ onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateOnboardingForm>({
    candidate_name: '',
    gender: 'M',
    candidate_email: '',
    candidate_phone: '',
  });
  const [errors, setErrors] = useState<Partial<CreateOnboardingForm>>({});

  const validate = (): boolean => {
    const errs: Partial<CreateOnboardingForm> = {};
    if (!form.candidate_name.trim()) errs.candidate_name = 'Vui lòng nhập họ và tên';
    if (!form.candidate_email.trim()) errs.candidate_email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.candidate_email))
      errs.candidate_email = 'Email không hợp lệ';
    if (!form.candidate_phone.trim()) errs.candidate_phone = 'Vui lòng nhập số điện thoại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = await onboardingService.create({
        candidate_name: form.candidate_name,
        full_name: form.candidate_name,
        gender: form.gender,
        candidate_email: form.candidate_email,
        candidate_phone: form.candidate_phone,
        // start_date mặc định hôm nay, nhân viên sẽ xác nhận lại trong form của họ
        start_date: new Date().toISOString().slice(0, 10),
      });

      alert(`✅ Tạo quy trình thành công!\nMã: ${data.onboarding_code ?? data.id}`);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      const errData = e.response?.data || {};
      const msgs = Object.entries(errData)
        .map(([f, v]) => `${f}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n');
      alert(msgs || 'Tạo quy trình thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof CreateOnboardingForm,
    label: string,
    required: boolean,
    input: React.ReactNode
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {input}
      {errors[key] && (
        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlusIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Tạo quy trình onboarding</h2>
              <p className="text-xs text-gray-500">Nhân viên sẽ tự điền thông tin chi tiết qua link riêng</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-medium mb-1">📋 Quy trình 2 bước:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>HR điền thông tin cơ bản bên dưới → Tạo quy trình</li>
              <li>Tạo link → Gửi cho nhân viên tự điền thông tin chi tiết</li>
            </ol>
          </div>

          {field('candidate_name', 'Họ và tên', true,
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.candidate_name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Nguyễn Văn A"
              value={form.candidate_name}
              onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
            />
          )}

          {field('gender', 'Giới tính', true,
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as 'M' | 'F' | 'O' })}
            >
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
              <option value="O">Khác</option>
            </select>
          )}

          {field('candidate_email', 'Email', true,
            <input
              type="email"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.candidate_email ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="example@email.com"
              value={form.candidate_email}
              onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
            />
          )}

          {field('candidate_phone', 'Số điện thoại', true,
            <input
              type="tel"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.candidate_phone ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="0912345678"
              value={form.candidate_phone}
              onChange={(e) => setForm({ ...form, candidate_phone: e.target.value })}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {submitting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            {submitting ? 'Đang tạo...' : 'Tạo quy trình'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  const [onboardings, setOnboardings] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ============================================
  // FETCH
  // ============================================

  const fetchOnboardings = async () => {
    setLoading(true);
    try {
      const data = await onboardingService.list();
      const items = Array.isArray(data) ? data : data.results ?? [];
      setOnboardings(
        items.map((item) => ({
          ...item,
          full_name: item.candidate_name || item.full_name || 'N/A',
          position_title: item.position_name || item.position_title || 'N/A',
          department_name: item.department_name || 'N/A',
          progress_percentage: getProgressPercentage(item.progress_percentage),
        }))
      );
    } catch (e) {
      console.error(e);
      alert('Không thể tải danh sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
  }, []);

  // ============================================
  // HANDLERS — LUỒNG HR
  // ============================================

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xoá quy trình này?')) return;
    try {
      await onboardingService.delete(id);
      alert('Xoá thành công');
      await fetchOnboardings();
    } catch (e) {
      console.error(e);
      alert('Xoá thất bại. Vui lòng thử lại.');
    }
  };

  // ============================================
  // HANDLERS — LUỒNG NHÂN VIÊN (TOKEN / LINK)
  // ============================================

  const handleGenerateToken = async (item: OnboardingItem) => {
    setTokenLoading(item.id);
    try {
      await onboardingService.generateToken(item.id);
      alert('Đã tạo link thành công! Bạn có thể copy hoặc gửi email cho nhân viên.');
      await fetchOnboardings();
    } catch (e) {
      console.error(e);
      alert('Tạo link thất bại. Vui lòng thử lại.');
    } finally {
      setTokenLoading(null);
    }
  };

  const handleSendEmail = async (item: OnboardingItem) => {
    if (!item.candidate_email) {
      alert('Ứng viên chưa có email. Vui lòng cập nhật thông tin trước.');
      return;
    }
    setTokenLoading(item.id);
    try {
      await onboardingService.sendEmployeeEmail(item.id);
      alert(`Đã gửi email đến ${item.candidate_email}`);
    } catch (e) {
      console.error(e);
      alert('Gửi email thất bại. Kiểm tra cấu hình email hoặc thử lại.');
    } finally {
      setTokenLoading(null);
    }
  };

  const handleCopyLink = async (item: OnboardingItem) => {
    const url = item.employee_form_url;
    if (!url) { alert('Chưa có link. Hãy tạo link trước.'); return; }
    try {
      await navigator.clipboard.writeText(url);
      alert('Đã copy link vào clipboard!');
    } catch {
      prompt('Copy link này và gửi cho nhân viên:', url);
    }
  };

  // ============================================
  // RENDER — TOKEN ACTIONS
  // ============================================

  const renderTokenActions = (item: OnboardingItem) => {
    const isLoading = tokenLoading === item.id;

    if (item.employee_info_completed || item.token_status === 'completed') {
      return <TokenBadge status="completed" completed />;
    }

    return (
      <div className="flex flex-col gap-1.5">
        <TokenBadge status={item.token_status} />

        {(!item.token_status || item.token_status === 'not_generated' || item.token_status === 'expired') && (
          <button
            onClick={() => handleGenerateToken(item)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
          >
            {isLoading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
            {item.token_status === 'expired' ? 'Tạo lại link' : 'Tạo link'}
          </button>
        )}

        {item.token_status === 'active' && (
          <>
            <button
              onClick={() => handleCopyLink(item)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
            >
              <ClipboardDocumentIcon className="w-3 h-3" /> Copy link
            </button>
            <button
              onClick={() => handleSendEmail(item)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 disabled:opacity-50"
            >
              {isLoading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <EnvelopeIcon className="w-3 h-3" />}
              Gửi email
            </button>
          </>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER MAIN
  // ============================================

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboard nhân sự</h1>
        <p className="text-gray-600 mt-1">
          Quản lý quy trình tuyển dụng và onboarding nhân viên mới.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">HR</span>
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">Luồng HR</p>
            <p className="text-blue-700 text-xs mt-0.5">
              Điền thông tin cơ bản → Tạo quy trình → Tạo link → Gửi email cho nhân viên
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">NV</span>
          </div>
          <div>
            <p className="font-semibold text-green-900 text-sm">Luồng Nhân viên mới</p>
            <p className="text-green-700 text-xs mt-0.5">
              Nhận link → Không cần đăng nhập → Tự điền đầy đủ thông tin cá nhân
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Table header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quy trình onboarding</h2>
            <p className="text-gray-500 text-sm">
              Có {onboardings.length} ứng viên đang trong quá trình onboarding
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Tạo quy trình mới
          </button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Mã onboarding', 'Ứng viên', 'Vị trí', 'Phòng ban', 'Ngày bắt đầu', 'Trạng thái', 'Tiến độ', 'Link nhân viên', 'Thao tác'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : onboardings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlusIcon className="w-10 h-10 text-gray-300" />
                      <p className="text-base font-medium text-gray-900">Chưa có ứng viên nào</p>
                      <p className="text-sm text-gray-500">
                        Bấm <strong>"Tạo quy trình mới"</strong> để bắt đầu
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                onboardings.map((item) => {
                  const progress = getProgressPercentage(item.progress_percentage);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-blue-600 font-medium whitespace-nowrap">
                        {item.onboarding_code || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="font-medium">{item.full_name || item.candidate_name}</div>
                        {item.candidate_email && (
                          <div className="text-xs text-gray-400">{item.candidate_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {item.position_title || item.position?.title || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {item.department_name || item.department?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {item.start_date}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 shrink-0">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {renderTokenActions(item)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/onboarding/${item.id}`)}
                            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Onboarding steps info */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Các bước onboarding tiêu chuẩn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: 1, title: 'Đào tạo', desc: 'Đào tạo nội quy, hội nhập nhân sự' },
              { num: 2, title: 'Ký hợp đồng', desc: 'Chuẩn bị và ký kết hợp đồng lao động' },
              { num: 3, title: 'Tiếp nhận hồ sơ', desc: 'Kiểm tra và xác nhận hồ sơ ứng viên' },
              { num: 4, title: 'Bàn giao công việc', desc: 'Bàn giao thiết bị và công việc chính thức' },
            ].map((step) => (
              <div key={step.num} className="bg-white p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">{step.num}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">{step.title}</h4>
                </div>
                <p className="text-gray-600 text-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal tạo quy trình mới */}
      {showCreateModal && (
        <CreateOnboardingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOnboardings();
          }}
        />
      )}
    </div>
  );
};

export default Onboarding;