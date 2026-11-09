import { managementApi } from '../utils/api';
import { PersonalDocEmployee, PersonalDocState } from './personalDocument.service';

/**
 * Quét hồ sơ giấy tờ scan gộp bằng AI — chỉ Admin/HCNS.
 * Backend: hrm/personal_document_scan_views.py (beautycare-backend, nhánh sk).
 * Tải PDF gộp `<mã NV>.pdf` → AI phân loại từng trang → HCNS duyệt → tách & lưu vào hồ sơ.
 */

const BASE = '/api-hrm/personal-document-scans';

export type ScanStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'APPLIED';
export type Confidence = 'high' | 'medium' | 'low';

export interface ScanPage {
  page: number;
  doc_type: string;
  ai_doc_type: string;
  person_name: string;
  confidence: Confidence;
  note: string;
  needs_review: boolean;
}

export interface ScanSummary {
  id: number;
  employee: PersonalDocEmployee;
  file_name: string;
  file_size: number | null;
  page_count: number | null;
  status: ScanStatus;
  status_display: string;
  is_stuck: boolean;
  error: string;
  owner_name: string;
  ai_model: string;
  input_tokens: number;
  output_tokens: number;
  review_count: number;
  drop_count: number;
  type_counts: Record<string, number>;
  created_by_name: string | null;
  created_at: string;
  processed_at: string | null;
  applied_by_name: string | null;
  applied_at: string | null;
}

export interface ScanType {
  code: string;
  label: string;
  required: boolean;
}

export interface ScanDetail extends ScanSummary {
  file_url: string | null;
  types: ScanType[];
  pages: ScanPage[];
  current_status: Record<string, PersonalDocState>;
  current_file_counts: Record<string, number>;
  planned: { doc_type: string; label: string; pages: number[] }[];
  missing_after: string[];
  applied_documents: { doc_type: string; document_id: number; pages: number[] }[];
}

export interface ScanListPayload {
  ai_configured: boolean;
  ai_model: string;
  results: ScanSummary[];
}

export const DROP_TYPE = 'BO';

export const CONFIDENCE_LABELS: Record<Confidence, string> = { high: 'Cao', medium: 'Vừa', low: 'Thấp' };

export const isBusy = (s: { status: ScanStatus; is_stuck: boolean }) =>
  (s.status === 'PENDING' || s.status === 'PROCESSING') && !s.is_stuck;

export function scanError(err: any, fallback = 'Có lỗi xảy ra'): string {
  return err?.response?.data?.detail || err?.message || fallback;
}

/** "1-3, 7" từ [1, 2, 3, 7]. */
export function pageRanges(numbers: number[]): string {
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);
  const parts: string[] = [];
  let start: number | null = null;
  sorted.forEach((n, i) => {
    if (start === null) start = n;
    if (i + 1 === sorted.length || sorted[i + 1] !== n + 1) {
      parts.push(start === n ? String(n) : `${start}-${n}`);
      start = null;
    }
  });
  return parts.join(', ');
}

export const personalDocumentScanService = {
  async list(params: { status?: string; search?: string } = {}): Promise<ScanListPayload> {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.search) query.search = params.search;
    const res = await managementApi.get(`${BASE}/`, { params: query });
    return res.data;
  },

  async upload(file: File, employeeId?: number): Promise<ScanDetail> {
    const form = new FormData();
    form.append('file', file);
    if (employeeId) form.append('employee', String(employeeId));
    const res = await managementApi.post(`${BASE}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
    });
    return res.data;
  },

  async get(id: number | string): Promise<ScanDetail> {
    const res = await managementApi.get(`${BASE}/${id}/`);
    return res.data;
  },

  /** PDF gốc qua API (có kiểm tra quyền) để hiện trong khung xem trước bằng blob URL. */
  async fileBlob(id: number): Promise<Blob> {
    const res = await managementApi.get(`${BASE}/${id}/file/`, { responseType: 'blob', timeout: 2 * 60 * 1000 });
    return res.data;
  },

  async savePages(id: number, pages: { page: number; doc_type: string }[]): Promise<ScanDetail> {
    const res = await managementApi.patch(`${BASE}/${id}/`, { pages });
    return res.data;
  },

  async apply(id: number, pages: { page: number; doc_type: string }[]): Promise<ScanDetail> {
    const res = await managementApi.post(`${BASE}/${id}/apply/`, { pages }, { timeout: 5 * 60 * 1000 });
    return res.data;
  },

  async retry(id: number): Promise<ScanDetail> {
    const res = await managementApi.post(`${BASE}/${id}/retry/`, {});
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await managementApi.delete(`${BASE}/${id}/`);
  },
};
