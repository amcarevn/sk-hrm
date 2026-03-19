import { managementApi } from '../utils/api';

export interface WorkFinalizationRecord {
  stt: number;
  id: number;
  employee_id: number;
  ma_nv: string;
  ho_va_ten: string;
  phong_ban: string | null;
  vi_tri: string | null;
  bac_si: string | null;
  ngay_bat_dau_lam_viec: string | null;
  ngay_ket_thuc_thu_viec: string | null;
  on_off: string | null;
  ngay_nghi_viec: string | null;
  hinh_thuc_lam_viec: string | null;
  cong_thu_viec: number;
  cong_chinh_thuc: number;
  co_le: number | null;
  cong_thuc_te: number;
  tong_cong: number;
  tong_phat: number;
  tang_ca: number;
  lam_toi: number | null;
  truc_toi: number;
  lam_them_gio: number;
  live: number;
  phu_cap_gui_xe: number;
  nghi_phep: number;
  lam_viec_online?: number;
  year: number;
  month: number;
  finalized_at: string;
}

export interface WorkFinalizationListResponse {
  year: number;
  month: number;
  total: number;
  results: WorkFinalizationRecord[];
}

export interface WorkFinalizationParams {
  year: number;
  month: number;
  employee_code?: string;
  department_id?: number;
}

export interface FinalizeRequest {
  employee_code: string;
  year: number;
  month: number;
}

export interface FinalizeResponse {
  message: string;
  created: boolean;
  data: WorkFinalizationRecord;
}

export interface FinalizeAllRequest {
  year: number;
  month: number;
}

export interface FinalizeDepartmentRequest {
  year: number;
  month: number;
  department_id?: number;
  department_code?: string;
}

export interface FinalizeDepartmentResponse {
  year: number;
  month: number;
  department_id: number | null;
  department_code: string | null;
  total_processed: number;
  total_errors: number;
  results: FinalizeAllResultItem[];
  errors: FinalizeAllErrorItem[];
}

export interface FinalizeAllResultItem {
  employee_code: string;
  ho_va_ten: string;
  created: boolean;
}

export interface FinalizeAllErrorItem {
  employee_code: string;
  ho_va_ten: string;
  error: string;
}

export interface FinalizeAllResponse {
  year: number;
  month: number;
  total_processed: number;
  total_errors: number;
  results: FinalizeAllResultItem[];
  errors: FinalizeAllErrorItem[];
}

class WorkFinalizationService {
  async list(params: WorkFinalizationParams): Promise<WorkFinalizationListResponse> {
    const response = await managementApi.get('/api-hrm/work-finalization/', { params });
    return response.data;
  }

  async finalize(data: FinalizeRequest): Promise<FinalizeResponse> {
    const response = await managementApi.post('/api-hrm/work-finalization/finalize/', data);
    return response.data;
  }

  async finalizeAll(data: FinalizeAllRequest): Promise<FinalizeAllResponse> {
    const response = await managementApi.post('/api-hrm/work-finalization/finalize-all/', data);
    return response.data;
  }

  async finalizeDepartment(data: FinalizeDepartmentRequest): Promise<FinalizeDepartmentResponse> {
    const response = await managementApi.post('/api-hrm/work-finalization/finalize-department/', data);
    return response.data;
  }

  async getDetail(
    employeeCode: string,
    year: number,
    month: number
  ): Promise<WorkFinalizationRecord> {
    const response = await managementApi.get(
      `/api-hrm/work-finalization/${employeeCode}/${year}/${month}/`
    );
    return response.data;
  }
}

export const workFinalizationService = new WorkFinalizationService();
export default workFinalizationService;
