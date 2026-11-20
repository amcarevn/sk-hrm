import { managementApi } from '../utils/api';

/**
 * Sổ quản lý lao động — HCNS SK phần 4 (2026-11-19): xuất Excel theo mẫu sổ của HCNS (sheet "Meta tổng"),
 * mỗi pháp nhân một sổ. Chỉ Admin / HCNS. Backend: hrm/labor_book_views.py (beautycare-backend, nhánh sk).
 */
const BASE = '/api-hrm/labor-book';

export interface LaborBookUnit {
  id: number;
  code: string;
  name: string;
  tax_code: string;
  address: string;
  is_active: boolean;
  employee_count: number;
}

export interface LaborBookInfo {
  year: number;
  unassigned: number;
  units: LaborBookUnit[];
}

export const laborBookService = {
  async info(): Promise<LaborBookInfo> {
    const res = await managementApi.get(`${BASE}/`);
    return res.data;
  },

  async export(unit: LaborBookUnit, year: number): Promise<{ blob: Blob; filename: string }> {
    try {
      const res = await managementApi.get(`${BASE}/export/`, {
        params: { company_unit: unit.id, year },
        responseType: 'blob',
        timeout: 3 * 60 * 1000,
      });
      const disposition: string = res.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="?([^";]+)"?/);
      // Header có thể bị CORS che → tự đặt tên giống backend.
      const filename = match ? match[1]
        : `so-quan-ly-lao-dong-${unit.code.toLowerCase()}-${new Date().toLocaleDateString('sv-SE')}.xlsx`;
      return { blob: res.data, filename };
    } catch (err: any) {
      const data = err?.response?.data;
      let detail = '';
      if (data instanceof Blob) {
        try {
          detail = JSON.parse(await data.text())?.detail || '';
        } catch {
          // không phải JSON
        }
      } else {
        detail = data?.detail || '';
      }
      throw new Error(detail || 'Không tạo được sổ quản lý lao động, vui lòng thử lại.');
    }
  },
};
