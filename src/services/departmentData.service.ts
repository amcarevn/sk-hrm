import { managementApi } from '../utils/api';

/**
 * Kho dữ liệu phòng ban — HCNS SK phần 5 ("Mỗi phòng 1 file lưu dữ liệu chung, phân quyền cho TP, GĐ,
 * admin xem"; chốt 2026-11-18: làm trong HRM, GĐ = Ban Giám đốc, mọi phòng ban).
 * Backend: hrm/department_data_views.py (beautycare-backend, nhánh sk).
 *
 * - Trưởng phòng: xem + thêm / sửa / xoá dữ liệu phòng mình (theo "Trưởng phòng" trên HRM).
 * - Ban Giám đốc: xem mọi phòng ban.
 * - Admin / HCNS: quản lý mọi phòng ban, chọn ai thuộc Ban Giám đốc.
 * Mỗi lần mở được ghi nhật ký; người quản lý phòng thấy ai đã mở.
 */
const BASE = '/api-hrm/department-data';

export interface DataDepartment {
  id: number;
  code: string;
  name: string;
  parent_name: string | null;
  manager_name: string | null;
  item_count: number;
  last_updated_at: string | null;
  can_manage: boolean;
}

export interface DataItem {
  id: number;
  title: string;
  kind: 'FILE' | 'LINK';
  file_name: string;
  file_size: number;
  url: string;
  note: string;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
  view_count?: number;
  recent_views?: { name: string | null; viewed_at: string }[];
}

export interface DepartmentDetail {
  department: DataDepartment;
  can_manage: boolean;
  items: DataItem[];
}

export interface Director {
  id: number;
  employee_id: string;
  full_name: string;
  position_title: string | null;
  department_name: string | null;
}

export const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.detail || err?.message || fallback;

export const departmentDataService = {
  async departments(): Promise<{ can_manage_all: boolean; departments: DataDepartment[] }> {
    const res = await managementApi.get(`${BASE}/`);
    return res.data;
  },

  async detail(departmentId: number): Promise<DepartmentDetail> {
    const res = await managementApi.get(`${BASE}/${departmentId}/`);
    return res.data;
  },

  async addFile(departmentId: number, file: File, title: string, note: string): Promise<DataItem> {
    const form = new FormData();
    form.append('file', file);
    if (title.trim()) form.append('title', title.trim());
    if (note.trim()) form.append('note', note.trim());
    const res = await managementApi.post(`${BASE}/${departmentId}/items/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 5 * 60 * 1000,
    });
    return res.data;
  },

  async addLink(departmentId: number, url: string, title: string, note: string): Promise<DataItem> {
    const res = await managementApi.post(`${BASE}/${departmentId}/items/`, { url: url.trim(), title: title.trim(), note: note.trim() });
    return res.data;
  },

  async update(itemId: number, data: { title?: string; note?: string; url?: string; file?: File }): Promise<DataItem> {
    if (data.file) {
      const form = new FormData();
      form.append('file', data.file);
      if (data.title !== undefined) form.append('title', data.title);
      if (data.note !== undefined) form.append('note', data.note);
      const res = await managementApi.patch(`${BASE}/items/${itemId}/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 5 * 60 * 1000,
      });
      return res.data;
    }
    const { file: _file, ...rest } = data;
    const res = await managementApi.patch(`${BASE}/items/${itemId}/`, rest);
    return res.data;
  },

  async remove(itemId: number): Promise<void> {
    await managementApi.delete(`${BASE}/items/${itemId}/`);
  },

  /** Link mở (file: link tạm 10 phút) — backend ghi nhật ký xem. */
  async open(itemId: number): Promise<{ url: string; kind: 'FILE' | 'LINK'; file_name: string }> {
    const res = await managementApi.post(`${BASE}/items/${itemId}/open/`);
    return res.data;
  },

  async directors(): Promise<Director[]> {
    const res = await managementApi.get(`${BASE}/directors/`);
    return res.data.results;
  },

  async setDirector(employeeId: number, isBod: boolean): Promise<Director[]> {
    const res = await managementApi.post(`${BASE}/directors/`, { employee: employeeId, is_bod: isBod });
    return res.data.results;
  },
};
