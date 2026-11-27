import { managementApi } from '../utils/api';

/**
 * YEP – Year End Party (HCNS SK 2026-11-27): trang yep.amcare.vn (repo trunganh-group/yep, nhánh sk) chuyển vào HRM.
 * Backend: hrm/yep*.py (nhánh sk). Nhân viên đăng nhập = người đăng ký (mã / họ tên / phòng ban lấy từ hồ sơ).
 * Lựa chọn (vùng miền, loại tiết mục...) và giới hạn độ dài đều lấy từ API.
 */

const BASE = '/api-hrm/yep';

export interface YepChoice { value: string; label: string }

export interface YepEvent {
  id: number;
  name: string;
  short_name: string;
  year: number;
  company_name: string;
  company_address: string;
  event_date: string | null; // YYYY-MM-DD
  event_time: string | null; // HH:MM
  venue_name: string;
  venue_address: string;
  venue_city: string;
  dresscode: string;
  registration_open: boolean;
  prizes: { type: string; label: string; amount: string | null }[];
}

export interface YepRegistration {
  id: number;
  region: string;
  region_label: string;
  participation: 'yes' | 'no';
  participation_label: string;
  lucky_number: string;
  created_at: string;
  updated_at: string;
}

export interface YepPerformance {
  id: number;
  program_name: string;
  performance_type: string;
  type_label: string;
  created_at: string;
  employee_code?: string;
  full_name?: string;
  department?: string;
}

export interface YepMe {
  employee_code: string;
  full_name: string;
  department: string;
  can_register: boolean;
  registration: YepRegistration | null;
  performances: YepPerformance[];
}

export interface YepComment { id: number; nickname: string; comment: string; created_at: string }

export interface YepStats { registered: number; participating: number; performances: number; comments: number }

export interface YepOverview {
  choices: {
    regions: YepChoice[];
    participation: YepChoice[];
    performance_types: YepChoice[];
    comment_max_length: number;
    nickname_max_length: number;
    program_max_length: number;
  };
  is_manager: boolean;
  event: YepEvent | null;
  me: YepMe | null;
  comments: YepComment[];
  stats: YepStats | null;
}

export interface YepManageData {
  registrations: (YepRegistration & { employee_code: string; full_name: string; department: string })[];
  performances: YepPerformance[];
}

export type YepEventInput = Partial<Omit<YepEvent, 'id' | 'prizes'> & { cultural_prizes: Record<string, string> }>;

export const yepErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return err?.message || fallback;
};

export const yepService = {
  async overview(): Promise<YepOverview> {
    return (await managementApi.get(`${BASE}/`)).data;
  },
  async register(region: string, participation: string): Promise<{ created: boolean; me: YepMe; stats: YepStats }> {
    return (await managementApi.post(`${BASE}/register/`, { region, participation })).data;
  },
  async addPerformance(program_name: string, performance_type: string): Promise<{ me: YepMe; stats: YepStats }> {
    return (await managementApi.post(`${BASE}/performances/`, { program_name, performance_type })).data;
  },
  async deletePerformance(id: number): Promise<{ me: YepMe | null; stats: YepStats }> {
    return (await managementApi.delete(`${BASE}/performances/${id}/`)).data;
  },
  async addComment(nickname: string, comment: string): Promise<{ comments: YepComment[]; stats: YepStats }> {
    return (await managementApi.post(`${BASE}/comments/`, { nickname, comment })).data;
  },
  async deleteComment(id: number): Promise<{ comments: YepComment[]; stats: YepStats }> {
    return (await managementApi.delete(`${BASE}/comments/${id}/`)).data;
  },
  async manage(): Promise<YepManageData> {
    return (await managementApi.get(`${BASE}/manage/`)).data;
  },
  async updateEvent(input: YepEventInput): Promise<YepEvent> {
    return (await managementApi.patch(`${BASE}/event/`, input)).data;
  },
  async exportExcel(): Promise<{ blob: Blob; filename: string }> {
    try {
      const res = await managementApi.get(`${BASE}/export/`, { responseType: 'blob', timeout: 2 * 60 * 1000 });
      const match = (res.headers?.['content-disposition'] || '').match(/filename="?([^";]+)"?/);
      return { blob: res.data, filename: match ? match[1] : `yep_dang_ky_${new Date().toLocaleDateString('sv-SE')}.xlsx` };
    } catch (err: any) {
      // responseType blob → lỗi JSON của backend cũng nằm trong Blob
      const data = err?.response?.data;
      if (data instanceof Blob) {
        let detail = '';
        try {
          detail = JSON.parse(await data.text())?.detail || '';
        } catch {
          /* không phải JSON */
        }
        if (detail) throw new Error(detail);
      }
      throw err;
    }
  },
};

/** Tài sản tĩnh của YEP (copy từ repo yep: templates/sk/*) — nằm ở public/yep/. */
export const YEP_ASSETS = {
  logoWhite: '/yep/logo-sk-white.png',
  heroLeft: '/yep/hero-side-left.jpg',
  heroRight: '/yep/hero-side-right.jpg',
  sparkles: '/yep/hero-sparkles.webp',
  ticketPoster: '/yep/yep_2026_ticket.jpg',
};

/** Toạ độ in chữ lên poster vé (pixel trên ảnh gốc 1024×1536) — giữ nguyên như event_config.py của repo yep. */
export const TICKET_TEXT = {
  name_y: 1010,
  department_y: 1070,
  lucky_number_y: 1110,
  color: '#FFFFFF',
  datetime_y: 1192,
  venue_y: 1256,
  city_y: 1304,
  info_color: '#EEF8EE',
};

export const TBA = 'Sẽ thông báo sau';

/** "2027-01-16" → "16/01/2027" */
export const formatEventDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/** Dòng thời gian như trang cũ: "17:30 · 16/01/2027" (sep tuỳ chỗ), chưa có ngày → "Sẽ thông báo sau". */
export const eventWhen = (event: YepEvent, sep = ' · '): string => {
  const date = formatEventDate(event.event_date);
  if (!date) return TBA;
  return event.event_time ? `${event.event_time}${sep}${date}` : date;
};

/** Mốc đếm ngược — chỉ khi có cả ngày lẫn giờ (thiếu giờ thì đếm tới 00:00, sai nhiều tiếng). */
export const eventStart = (event: YepEvent): Date | null => {
  if (!event.event_date || !event.event_time) return null;
  const [y, m, d] = event.event_date.split('-').map(Number);
  const [hh, mm] = event.event_time.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};
