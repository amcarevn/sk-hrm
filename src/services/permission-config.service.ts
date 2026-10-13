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

// ─────────────────────────────────────────────────────────────
// Phạt thiếu công Trưởng phòng không lương cứng (MissingWorkdayPenaltyConfig —
// singleton, HCNS tự chọn người + mốc lương)
// ─────────────────────────────────────────────────────────────

export interface MissingWorkdayPenaltyEmployeeDetail extends ManagerExplanationQuotaEmployeeDetail {
  has_basic_salary: boolean;
}

export interface MissingWorkdayPenaltyConfig {
  id: number;
  eligible_employees: number[];
  eligible_employees_detail: MissingWorkdayPenaltyEmployeeDetail[];
  base_amount: string;
  updated_at: string;
}

export async function getMissingWorkdayPenaltyConfig(): Promise<MissingWorkdayPenaltyConfig> {
  const response = await managementApi.get('/api-hrm/missing-workday-penalty-config/');
  return response.data;
}

export async function updateMissingWorkdayPenaltyConfig(data: {
  eligible_employees: number[];
  base_amount: number;
}): Promise<MissingWorkdayPenaltyConfig> {
  const response = await managementApi.put('/api-hrm/missing-workday-penalty-config/', data);
  return response.data;
}

// Chế độ con nhỏ (ChildCareRegime — HCNS SK 2026-10-13): người hưởng kèm khoảng ngày,
// mỗi ngày được đi muộn tối đa 60' và về sớm tối đa 60'.
export interface ChildCareRegime {
  id: number;
  employee: number;
  employee_code: string;
  employee_name: string;
  department_name: string | null;
  position_title: string | null;
  start_date: string;
  end_date: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export async function listChildCareRegimes(): Promise<ChildCareRegime[]> {
  const response = await managementApi.get('/api-hrm/child-care-regimes/');
  return Array.isArray(response.data) ? response.data : response.data.results ?? [];
}

export async function createChildCareRegime(data: {
  employee: number;
  start_date: string;
  end_date: string | null;
  note?: string;
}): Promise<ChildCareRegime> {
  const response = await managementApi.post('/api-hrm/child-care-regimes/', data);
  return response.data;
}

export async function updateChildCareRegime(
  id: number,
  data: Partial<Pick<ChildCareRegime, 'start_date' | 'end_date' | 'note'>>,
): Promise<ChildCareRegime> {
  const response = await managementApi.patch(`/api-hrm/child-care-regimes/${id}/`, data);
  return response.data;
}

export async function deleteChildCareRegime(id: number): Promise<void> {
  await managementApi.delete(`/api-hrm/child-care-regimes/${id}/`);
}
