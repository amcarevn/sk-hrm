import { managementApi } from '../utils/api';
import { AxiosResponse } from 'axios';

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

// Create/Update DTOs
export interface CreateOnboardingRequest {
  full_name: string;
  position_title: string;
  start_date: string;
  stage: 1 | 2 | 3;
  progress: 'RECEIVE_DOC' | 'SIGN_CONTRACT' | 'TRAINING' | 'HANDOVER';
  
  // Optional fields
  candidate_email?: string;
  candidate_phone?: string;
  position?: number;
  department?: number;
  contract_type?: string;
  probation_period_months?: number;
  notes?: string;
}

export interface UpdateOnboardingRequest extends Partial<CreateOnboardingRequest> {
  id: number;
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
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: OnboardingProcess[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: OnboardingProcess[];
    }> = await managementApi.get('/api-hrm/onboardings/', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết onboarding
   */
  getById: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await managementApi.get(
      `/api-hrm/onboardings/${id}/`
    );
    return response.data;
  },

  /**
   * Tạo onboarding mới
   */
  create: async (data: CreateOnboardingRequest): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await managementApi.post(
      '/api-hrm/onboardings/',
      data
    );
    return response.data;
  },

  /**
   * Cập nhật onboarding
   */
  update: async (id: number, data: Partial<CreateOnboardingRequest>): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await managementApi.put(
      `/api-hrm/onboardings/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Cập nhật một phần onboarding
   */
  partialUpdate: async (id: number, data: Partial<CreateOnboardingRequest>): Promise<OnboardingProcess> => {
    const response: AxiosResponse<OnboardingProcess> = await managementApi.patch(
      `/api-hrm/onboardings/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Xóa onboarding
   */
  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/onboardings/${id}/`);
  },

  /**
   * Bắt đầu quy trình onboarding
   */
  start: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingProcess;
    }> = await managementApi.post(`/api-hrm/onboardings/${id}/start/`);
    return response.data.data;
  },

  /**
   * Hoàn thành quy trình onboarding
   */
  complete: async (id: number): Promise<OnboardingProcess> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingProcess;
    }> = await managementApi.post(`/api-hrm/onboardings/${id}/complete/`);
    return response.data.data;
  },

  /**
   * Tạo tài khoản nhân viên từ onboarding
   */
  createEmployee: async (id: number): Promise<{ employee: any; message: string }> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      employee: any;
    }> = await managementApi.post(`/api-hrm/onboardings/${id}/create_employee/`);
    return {
      employee: response.data.employee,
      message: response.data.message,
    };
  },

  /**
   * Lấy thống kê onboarding
   */
  getStatistics: async (): Promise<OnboardingStatistics> => {
    const response: AxiosResponse<OnboardingStatistics> = await managementApi.get(
      '/api-hrm/onboardings/statistics/'
    );
    return response.data;
  },

  // ========== Onboarding Tasks ==========

  /**
   * Lấy danh sách tasks của onboarding
   */
  getTasks: async (onboardingId: number): Promise<OnboardingTask[]> => {
    const response: AxiosResponse<OnboardingTask[]> = await managementApi.get(
      `/api-hrm/onboardings/${onboardingId}/tasks/`
    );
    return response.data;
  },

  /**
   * Bắt đầu task
   */
  startTask: async (taskId: number): Promise<OnboardingTask> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingTask;
    }> = await managementApi.post(`/api-hrm/onboarding-tasks/${taskId}/start/`);
    return response.data.data;
  },

  /**
   * Hoàn thành task
   */
  completeTask: async (taskId: number, completionNote?: string): Promise<OnboardingTask> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingTask;
    }> = await managementApi.post(`/api-hrm/onboarding-tasks/${taskId}/complete/`, {
      completion_note: completionNote,
    });
    return response.data.data;
  },

  /**
   * Bỏ qua task
   */
  skipTask: async (taskId: number, reason?: string): Promise<OnboardingTask> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingTask;
    }> = await managementApi.post(`/api-hrm/onboarding-tasks/${taskId}/skip/`, {
      reason,
    });
    return response.data.data;
  },

  // ========== Onboarding Documents ==========

  /**
   * Lấy danh sách documents của onboarding
   */
  getDocuments: async (onboardingId: number): Promise<OnboardingDocument[]> => {
    const response: AxiosResponse<OnboardingDocument[]> = await managementApi.get(
      `/api-hrm/onboardings/${onboardingId}/documents/`
    );
    return response.data;
  },

  /**
   * Upload document
   */
  uploadDocument: async (onboardingId: number, formData: FormData): Promise<OnboardingDocument> => {
    const response: AxiosResponse<OnboardingDocument> = await managementApi.post(
      '/api-hrm/onboarding-documents/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Đánh dấu tài liệu đã đọc
   */
  markDocumentAsRead: async (documentId: number): Promise<OnboardingDocument> => {
    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingDocument;
    }> = await managementApi.post(`/api-hrm/onboarding-documents/${documentId}/mark_read/`);
    return response.data.data;
  },

  /**
   * Ký tài liệu
   */
  signDocument: async (documentId: number, signatureFile?: File): Promise<OnboardingDocument> => {
    const formData = new FormData();
    if (signatureFile) {
      formData.append('signature_file', signatureFile);
    }

    const response: AxiosResponse<{
      success: boolean;
      message: string;
      data: OnboardingDocument;
    }> = await managementApi.post(
      `/api-hrm/onboarding-documents/${documentId}/sign/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};

export default onboardingService;