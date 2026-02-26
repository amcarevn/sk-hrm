// ==========================================
// FILE: src/services/onboardingService.ts
// API service cho onboarding
// ==========================================
import axios, { AxiosResponse } from 'axios';

const API_BASE = '/api-hrm';

// Axios instance với auth
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TYPES ====================

export interface OnboardingProcess {
  id: number;
  onboarding_code: string;

  // Frontend fields (alias)
  full_name: string;
  position_title: string;

  // Backend fields
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;

  // Personal info
  citizen_id?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  permanent_address?: string;
  current_address?: string;

  // Education
  education_level?: string;
  university?: string;
  major?: string;
  graduation_year?: number;

  // Job info
  position?: number;
  position_name?: string;
  department?: number;
  department_name?: string;
  direct_manager?: number;
  start_date: string;
  expected_end_date?: string;

  // Contract
  contract_type: 'PROBATION' | 'DEFINITE' | 'INDEFINITE' | 'SEASONAL' | 'PART_TIME';
  probation_period_months: number;
  salary?: string;
  salary_note?: string;

  // Financial
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  tax_code?: string;
  tax_dependents?: number;

  // Status
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress: 'RECEIVE_DOC' | 'SIGN_CONTRACT' | 'TRAINING' | 'HANDOVER';
  stage: 1 | 2 | 3; // 1: Ứng viên mới, 2: Đang onboarding, 3: Hoàn thành
  stage_display?: string;
  progress_display?: string;
  progress_percentage: number;

  // Token / Employee form
  employee_info_completed?: boolean;
  employee_form_url?: string | null;
  token_status?: 'not_generated' | 'active' | 'expired' | 'completed';
  token_expires_at?: string | null;

  // Relationships
  hr_responsible?: number;
  hr_responsible_name?: string;
  employee?: number;

  // Files
  cv_file?: string;
  id_card_front?: string;
  id_card_back?: string;
  diploma_file?: string;

  // Notes
  notes?: string;

  // System
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_by?: number;
}

export interface OnboardingTask {
  id: number;
  onboarding_process: number;
  name: string;
  description: string;
  task_type: 'DOCUMENT' | 'CONTRACT' | 'TRAINING' | 'IT_SETUP' | 'ORIENTATION' | 'EVALUATION' | 'OTHER';
  order: number;
  deadline?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  assigned_to?: number;
  assigned_to_name?: string;
  completion_note?: string;
  attachment?: string;
  started_at?: string;
  completed_at?: string;
  is_overdue: boolean;
  days_until_deadline?: number;
  checklist_items?: OnboardingChecklist[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingChecklist {
  id: number;
  task: number;
  title: string;
  description: string;
  order: number;
  is_completed: boolean;
  is_required: boolean;
  completed_at?: string;
  completed_by?: number;
  completed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDocument {
  id: number;
  onboarding_process: number;
  document_name: string;
  document_type: 'CONTRACT' | 'REGULATION' | 'HANDBOOK' | 'FORM' | 'TRAINING' | 'OTHER';
  description?: string;
  file: string;
  is_required: boolean;
  requires_signature: boolean;
  is_read: boolean;
  is_signed: boolean;
  signed_at?: string;
  signature_file?: string;
  uploaded_at: string;
  uploaded_by?: number;
  uploaded_by_name?: string;
}

export interface OnboardingStatistics {
  total: number;
  by_status: { status: string; count: number }[];
  in_progress: number;
  completed: number;
  pending: number;
  this_month: number;
}

export interface CreateOnboardingRequest {
  candidate_name: string;
  candidate_email: string;
  start_date: string;
  position: number;
  department: number;
  direct_manager?: number;

  // Extended fields
  full_name?: string;
  position_title?: string;
  stage?: 1 | 2 | 3;
  progress?: 'RECEIVE_DOC' | 'SIGN_CONTRACT' | 'TRAINING' | 'HANDOVER';
  candidate_phone?: string;
  contract_type?: string;
  probation_period_months?: number;
  notes?: string;
}

export interface UpdateOnboardingRequest extends Partial<CreateOnboardingRequest> {
  id: number;
}

export interface EmployeeFormData {
  candidate_name: string;
  candidate_phone: string;
  citizen_id: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  permanent_address: string;
  current_address?: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  tax_code?: string;
  education_level?: string;
  university?: string;
  major?: string;
  graduation_year?: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Standard action response wrapper (dùng nội bộ)
interface ActionResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== API SERVICE ====================

export const onboardingService = {
  // ========== Onboarding Processes ==========

  /**
   * Lấy danh sách onboarding
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    stage?: number;
    progress?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<OnboardingProcess>> => {
    const response: AxiosResponse<PaginatedResponse<OnboardingProcess>> =
      await api.get('/onboardings/', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết onboarding
   */
  get: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await api.get(
      `/onboardings/${id}/`
    );
    return response.data;
  },

  /** Alias của get() — dùng khi cần tên rõ nghĩa hơn */
  getById: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await api.get(
      `/onboardings/${id}/`
    );
    return response.data;
  },

  /**
   * Tạo onboarding mới
   */
  create: async (data: CreateOnboardingRequest): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await api.post(
      '/onboardings/',
      data
    );
    return response.data;
  },

  /**
   * Cập nhật toàn bộ onboarding (PUT)
   */
  update: async (
    id: number,
    data: Partial<CreateOnboardingRequest>
  ): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await api.put(
      `/onboardings/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Cập nhật một phần onboarding (PATCH)
   */
  partialUpdate: async (
    id: number,
    data: Partial<CreateOnboardingRequest>
  ): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await api.patch(
      `/onboardings/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Xóa onboarding
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/onboardings/${id}/`);
  },

  /**
   * Bắt đầu quy trình onboarding
   */
  start: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<ActionResponse<OnboardingProcess>> =
      await api.post(`/onboardings/${id}/start/`);
    return response.data.data;
  },

  /**
   * Hoàn thành quy trình onboarding
   */
  complete: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<ActionResponse<OnboardingProcess>> =
      await api.post(`/onboardings/${id}/complete/`);
    return response.data.data;
  },

  /**
   * Tạo tài khoản nhân viên từ onboarding
   */
  createEmployee: async (
    id: number
  ): Promise<{ employee: any; message: string }> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      employee: any;
    }> = await api.post(`/onboardings/${id}/create_employee/`);
    return {
      employee: response.data.employee,
      message: response.data.message,
    };
  },

  /**
   * Lấy thống kê onboarding
   */
  getStatistics: async (): Promise<OnboardingStatistics> => {
    const response: AxiosResponse<OnboardingStatistics> = await api.get(
      '/onboardings/statistics/'
    );
    return response.data;
  },

  // ========== Token & Email Actions ==========

  /**
   * Tạo token cho nhân viên
   */
  generateToken: async (
    id: number
  ): Promise<{ token: string; expires_at: string }> => {
    const response: AxiosResponse<{ token: string; expires_at: string }> =
      await api.post(`/onboardings/${id}/generate_employee_token/`);
    return response.data;
  },

  /**
   * Gửi email cho nhân viên với link
   */
  sendEmployeeEmail: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> =
      await api.post(`/onboardings/${id}/send-employee-email/`);
    return response.data;
  },

  /**
   * Kiểm tra trạng thái điền form của nhân viên
   */
  getEmployeeInfoStatus: async (id: number): Promise<{
    employee_info_completed: boolean;
    token_status: 'not_generated' | 'active' | 'expired' | 'completed';
    token_expires_at: string | null;
  }> => {
    const response: AxiosResponse<{
      employee_info_completed: boolean;
      token_status: 'not_generated' | 'active' | 'expired' | 'completed';
      token_expires_at: string | null;
    }> = await api.get(`/onboardings/${id}/employee-info-status/`);
    return response.data;
  },

  // ========== Onboarding Tasks ==========

  /**
   * Lấy danh sách tasks của onboarding
   */
  getTasks: async (onboardingId: number): Promise<OnboardingTask[]> => {
    const response: AxiosResponse<OnboardingTask[]> = await api.get(
      `/onboardings/${onboardingId}/tasks/`
    );
    return response.data;
  },

  /**
   * Bắt đầu task
   */
  startTask: async (taskId: number): Promise<OnboardingTask> => {
    const response: AxiosResponse<ActionResponse<OnboardingTask>> =
      await api.post(`/onboarding-tasks/${taskId}/start/`);
    return response.data.data;
  },

  /**
   * Hoàn thành task
   */
  completeTask: async (
    taskId: number,
    completionNote?: string
  ): Promise<OnboardingTask> => {
    const response: AxiosResponse<ActionResponse<OnboardingTask>> =
      await api.post(`/onboarding-tasks/${taskId}/complete/`, {
        completion_note: completionNote,
      });
    return response.data.data;
  },

  /**
   * Bỏ qua task
   */
  skipTask: async (
    taskId: number,
    reason?: string
  ): Promise<OnboardingTask> => {
    const response: AxiosResponse<ActionResponse<OnboardingTask>> =
      await api.post(`/onboarding-tasks/${taskId}/skip/`, { reason });
    return response.data.data;
  },

  // ========== Onboarding Documents ==========

  /**
   * Lấy danh sách documents của onboarding
   */
  getDocuments: async (onboardingId: number): Promise<OnboardingDocument[]> => {
    const response: AxiosResponse<OnboardingDocument[]> = await api.get(
      `/onboardings/${onboardingId}/documents/`
    );
    return response.data;
  },

  /**
   * Upload document
   */
  uploadDocument: async (
    onboardingId: number,
    formData: FormData
  ): Promise<OnboardingDocument> => {
    const response: AxiosResponse<OnboardingDocument> = await api.post(
      '/onboarding-documents/',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  /**
   * Đánh dấu tài liệu đã đọc
   */
  markDocumentAsRead: async (
    documentId: number
  ): Promise<OnboardingDocument> => {
    const response: AxiosResponse<ActionResponse<OnboardingDocument>> =
      await api.post(`/onboarding-documents/${documentId}/mark_read/`);
    return response.data.data;
  },

  /**
   * Ký tài liệu
   */
  signDocument: async (
    documentId: number,
    signatureFile?: File
  ): Promise<OnboardingDocument> => {
    const formData = new FormData();
    if (signatureFile) {
      formData.append('signature_file', signatureFile);
    }
    const response: AxiosResponse<ActionResponse<OnboardingDocument>> =
      await api.post(`/onboarding-documents/${documentId}/sign/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return response.data.data;
  },

  // ========== Public Endpoints (không cần auth) ==========

  /**
   * Lấy thông tin onboarding bằng token (PUBLIC)
   */
  getByToken: async (token: string): Promise<OnboardingProcess> => {
    const response = await fetch(
      `${API_BASE}/employee-onboarding-form/by-token/${token}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.json();
  },

  /**
   * Submit form nhân viên (PUBLIC)
   */
  submitEmployeeInfo: async (
    token: string,
    data: EmployeeFormData
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(
      `${API_BASE}/employee-onboarding-form/submit/${token}/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },
};

export default onboardingService;