import { managementApi } from '../utils/api';

// ─────────────────────────────────────────────────────────────
// Loại trừ tăng ca (OvertimeExclusionConfig — bản ghi đơn/singleton)
// ─────────────────────────────────────────────────────────────

export interface OvertimeExclusionEntityDetail {
  id: number;
  employee_id?: string;
  full_name?: string;
  title?: string;
  name?: string;
}

export interface OvertimeExclusionConfig {
  id: number;
  excluded_employees: number[];
  excluded_positions: number[];
  excluded_departments: number[];
  excluded_employees_detail: OvertimeExclusionEntityDetail[];
  excluded_positions_detail: OvertimeExclusionEntityDetail[];
  excluded_departments_detail: OvertimeExclusionEntityDetail[];
  updated_at: string;
}

export async function getOvertimeExclusionConfig(): Promise<OvertimeExclusionConfig> {
  const response = await managementApi.get('/api-hrm/overtime-exclusion-config/');
  return response.data;
}

export async function updateOvertimeExclusionConfig(data: {
  excluded_employees: number[];
  excluded_positions: number[];
  excluded_departments: number[];
}): Promise<OvertimeExclusionConfig> {
  const response = await managementApi.put('/api-hrm/overtime-exclusion-config/', data);
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Hạn mức ngày làm online (OnlineWorkQuotaOverride — danh sách nhiều dòng)
// ─────────────────────────────────────────────────────────────

export type OnlineWorkQuotaScope = 'employee' | 'position' | 'department';

export interface OnlineWorkQuotaOverride {
  id: number;
  employee: number | null;
  position: number | null;
  department: number | null;
  max_online_days: 0 | 1 | 2;
  max_online_days_display: string;
  employee_detail: OvertimeExclusionEntityDetail | null;
  position_detail: OvertimeExclusionEntityDetail | null;
  department_detail: OvertimeExclusionEntityDetail | null;
  updated_at: string;
}

export async function listOnlineWorkQuotaOverrides(): Promise<OnlineWorkQuotaOverride[]> {
  const response = await managementApi.get('/api-hrm/online-work-quota-overrides/', {
    params: { page_size: 500 },
  });
  return response.data.results ?? response.data;
}

export async function createOnlineWorkQuotaOverride(data: {
  employee?: number | null;
  position?: number | null;
  department?: number | null;
  max_online_days: 0 | 1 | 2;
}): Promise<OnlineWorkQuotaOverride> {
  const response = await managementApi.post('/api-hrm/online-work-quota-overrides/', data);
  return response.data;
}

export async function updateOnlineWorkQuotaOverride(
  id: number,
  data: { max_online_days: 0 | 1 | 2 }
): Promise<OnlineWorkQuotaOverride> {
  const response = await managementApi.patch(`/api-hrm/online-work-quota-overrides/${id}/`, data);
  return response.data;
}

export async function deleteOnlineWorkQuotaOverride(id: number): Promise<void> {
  await managementApi.delete(`/api-hrm/online-work-quota-overrides/${id}/`);
}

// ─────────────────────────────────────────────────────────────
// Hạn mức giải trình gộp cấp Trưởng phòng (ManagerExplanationQuotaConfig —
// bản ghi đơn/singleton, HR tự chọn từng người)
// ─────────────────────────────────────────────────────────────

export interface ManagerExplanationQuotaEmployeeDetail {
  id: number;
  employee_id: string;
  full_name: string;
  department_name: string | null;
  position_title: string | null;
}

export interface ManagerExplanationQuotaConfig {
  id: number;
  eligible_employees: number[];
  eligible_employees_detail: ManagerExplanationQuotaEmployeeDetail[];
  max_explanations: number;
  updated_at: string;
}

export async function getManagerExplanationQuotaConfig(): Promise<ManagerExplanationQuotaConfig> {
  const response = await managementApi.get('/api-hrm/manager-explanation-quota-config/');
  return response.data;
}

export async function updateManagerExplanationQuotaConfig(data: {
  eligible_employees: number[];
}): Promise<ManagerExplanationQuotaConfig> {
  const response = await managementApi.put('/api-hrm/manager-explanation-quota-config/', data);
  return response.data;
}
