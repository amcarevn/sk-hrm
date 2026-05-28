import { managementApi } from './client';
import type { ShiftRegistration } from './types';

export interface ShiftRegistrationDayInput {
  date: string; // YYYY-MM-DD
  shift: number | null; // ShiftConfig id, null = Nghỉ
}

export interface ShiftRegistrationCreateData {
  week_start_date: string; // Thứ 2 (YYYY-MM-DD)
  days: ShiftRegistrationDayInput[];
  employee_id?: number; // chỉ HR/Admin dùng để đăng ký hộ
}

// API trả về có thể là mảng hoặc dạng phân trang { results }
function unwrapList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export const shiftRegistrationsAPI = {
  list: async (params?: {
    week_start_date?: string;
    status?: string;
    employee?: number;
  }): Promise<ShiftRegistration[]> => {
    const res = await managementApi.get('/api-hrm/shift-registrations/', { params });
    return unwrapList<ShiftRegistration>(res.data);
  },

  getById: async (id: number): Promise<ShiftRegistration> => {
    const res = await managementApi.get(`/api-hrm/shift-registrations/${id}/`);
    return res.data;
  },

  create: async (data: ShiftRegistrationCreateData): Promise<ShiftRegistration> => {
    const res = await managementApi.post('/api-hrm/shift-registrations/', data);
    return res.data;
  },

  update: async (
    id: number,
    data: Partial<ShiftRegistrationCreateData>
  ): Promise<ShiftRegistration> => {
    const res = await managementApi.patch(`/api-hrm/shift-registrations/${id}/`, data);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/shift-registrations/${id}/`);
  },

  submit: async (id: number): Promise<ShiftRegistration> => {
    const res = await managementApi.post(`/api-hrm/shift-registrations/${id}/submit/`);
    return res.data;
  },

  approve: async (id: number): Promise<ShiftRegistration> => {
    const res = await managementApi.post(`/api-hrm/shift-registrations/${id}/approve/`);
    return res.data;
  },

  reject: async (id: number, reject_reason: string): Promise<ShiftRegistration> => {
    const res = await managementApi.post(`/api-hrm/shift-registrations/${id}/reject/`, {
      reject_reason,
    });
    return res.data;
  },

  pendingApprovals: async (params?: {
    week_start_date?: string;
  }): Promise<ShiftRegistration[]> => {
    const res = await managementApi.get('/api-hrm/shift-registrations/pending-approvals/', {
      params,
    });
    return unwrapList<ShiftRegistration>(res.data);
  },
};
