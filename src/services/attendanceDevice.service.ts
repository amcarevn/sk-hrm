import { managementApi } from '../utils/api';

/**
 * Gán mã chấm công trên máy ZKTeco ↔ nhân viên.
 * Backend: hrm/device_mapping_views.py — cùng quyền với đẩy chấm công từ máy.
 * Lượt quẹt của mã chưa gán được giữ lại; gán xong thì tự ghi vào công.
 */

const BASE = '/api/v1/hrm/attendance-device';

export interface DeviceEmployee {
  id: number;
  employee_id: string;
  full_name: string;
}

export interface PendingDeviceCode {
  device_code: string;
  punches: number;
  first_punch: string;
  last_punch: string;
  device_user_names: string[];
  devices: string[];
  /** NV đang làm, chưa có mã, cùng tên gọi với tên trên máy */
  suggestions: DeviceEmployee[];
  /** Mã vẫn gán cho người đã nghỉ trước ngày quẹt (máy cấp lại mã cho người mới) */
  mapped_employee: (DeviceEmployee & { end_date: string | null }) | null;
}

export interface DeviceMapping {
  id: number;
  device_code: string;
  employee: DeviceEmployee;
  device_user_name: string;
  note: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignResult {
  mapping: DeviceMapping;
  punches_applied: number;
  days_updated: number;
  /** Gán mã đang thuộc người đã nghỉ: backend lấy lại mã từ người đó */
  reassigned_from?: DeviceEmployee;
}

class AttendanceDeviceService {
  async getPendingCodes(params?: { q?: string; status?: 'PENDING' | 'IGNORED' }) {
    const r = await managementApi.get<{ count: number; items: PendingDeviceCode[] }>(`${BASE}/pending/`, { params });
    return r.data;
  }

  async getPendingCount(): Promise<number> {
    const r = await managementApi.get<{ count: number }>(`${BASE}/pending/count/`);
    return r.data.count;
  }

  async assign(deviceCode: string, employeeId: number): Promise<AssignResult> {
    const r = await managementApi.post<AssignResult>(`${BASE}/pending/assign/`, {
      device_code: deviceCode,
      employee: employeeId,
    });
    return r.data;
  }

  async ignore(deviceCode: string): Promise<number> {
    const r = await managementApi.post<{ ignored: number }>(`${BASE}/pending/ignore/`, { device_code: deviceCode });
    return r.data.ignored;
  }

  async getMappings(params?: { q?: string; employee?: number }) {
    const r = await managementApi.get<{ count: number; items: DeviceMapping[] }>(`${BASE}/mappings/`, { params });
    return r.data;
  }

  async createMapping(data: { device_code: string; employee: number; note?: string }): Promise<AssignResult> {
    const r = await managementApi.post<AssignResult>(`${BASE}/mappings/`, data);
    return r.data;
  }

  async updateMapping(id: number, data: { employee?: number; note?: string }): Promise<DeviceMapping> {
    const r = await managementApi.patch<{ mapping: DeviceMapping }>(`${BASE}/mappings/${id}/`, data);
    return r.data.mapping;
  }

  async deleteMapping(id: number): Promise<void> {
    await managementApi.delete(`${BASE}/mappings/${id}/`);
  }
}

export const attendanceDeviceService = new AttendanceDeviceService();
export default attendanceDeviceService;
