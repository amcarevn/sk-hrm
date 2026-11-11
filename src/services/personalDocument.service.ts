import { managementApi } from '../utils/api';

/**
 * Hồ sơ giấy tờ cá nhân của nhân viên — chỉ Admin/HCNS, trừ mine(): nhân viên xem mình thiếu gì.
 * Backend: hrm/personal_document_views.py (beautycare-backend, nhánh sk).
 * Tải lên hàng loạt hồ sơ scan gộp (mỗi nhân viên 1 file) đi qua AI: personalDocumentScan.service.ts.
 */

const BASE = '/api-hrm/personal-documents';

export type PersonalDocState = 'FILE' | 'SYSTEM_CONTRACT' | 'NOT_APPLICABLE' | 'MISSING';

export interface PersonalDocType {
  code: string;
  label: string;
  required: boolean;
}

export interface PersonalDocEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  department_name: string | null;
  position_title: string | null;
}

export interface PersonalDocument {
  id: number;
  employee: number;
  doc_type: string;
  doc_type_display: string;
  file_name: string;
  file_size: number | null;
  file_url: string | null;
  not_applicable: boolean;
  note: string;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

export interface EmployeeDocumentsPayload {
  employee: PersonalDocEmployee;
  types: PersonalDocType[];
  status: Record<string, { state: PersonalDocState; file_count: number }>;
  missing: string[];
  documents: PersonalDocument[];
}

export interface ReportRow extends PersonalDocEmployee {
  employment_status: string;
  status: Record<string, PersonalDocState>;
  missing: string[];
  missing_count: number;
}

export interface ReportPayload {
  types: PersonalDocType[];
  summary: { total: number; complete: number; incomplete: number; missing_by_type: Record<string, number> };
  results: ReportRow[];
}

/** /me/: chỉ trạng thái từng loại của chính mình, không có file. employee = null: không cảnh báo. */
export interface MyDocumentsPayload {
  employee: { id: number; employee_id: string; full_name: string } | null;
  types: PersonalDocType[];
  status: Record<string, PersonalDocState>;
  missing: string[];
}

/**
 * Giấy tờ ghi nhận từ file scan gộp trỏ về cả file gộp; ghi chú dạng "Trang 7, 9-14 trong SK00346.pdf (quét AI)"
 * (backend: hrm/personal_document_scan.py document_note). first: trang đầu để mở PDF đúng chỗ; ranges: "7, 9-14".
 */
export const notePages = (note: string | null | undefined): { first: number | null; ranges: string | null } => {
  const m = /^Trang ([\d,\s-]+?) trong /.exec(note || '');
  if (!m) return { first: null, ranges: null };
  return { first: parseInt(m[1], 10) || null, ranges: m[1].trim() };
};

export const STATE_LABELS: Record<PersonalDocState, string> = {
  FILE: 'Đã có',
  SYSTEM_CONTRACT: 'Đã ký trên HRM',
  NOT_APPLICABLE: 'Không áp dụng',
  MISSING: 'Thiếu',
};

export const personalDocumentService = {
  async getForEmployee(employeeId: number): Promise<EmployeeDocumentsPayload> {
    const res = await managementApi.get(`${BASE}/`, { params: { employee: employeeId } });
    return res.data;
  },

  async upload(employeeId: number, docType: string, files: File[], note = ''): Promise<EmployeeDocumentsPayload> {
    const form = new FormData();
    form.append('employee', String(employeeId));
    form.append('doc_type', docType);
    if (note) form.append('note', note);
    files.forEach((f) => form.append('files', f));
    const res = await managementApi.post(`${BASE}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async remove(documentId: number): Promise<EmployeeDocumentsPayload> {
    const res = await managementApi.delete(`${BASE}/${documentId}/`);
    return res.data;
  },

  async setNotApplicable(employeeId: number, docType: string, value: boolean, note = ''): Promise<EmployeeDocumentsPayload> {
    const res = await managementApi.post(`${BASE}/not-applicable/`, { employee: employeeId, doc_type: docType, value, note });
    return res.data;
  },

  async report(params: { department?: string | number; search?: string; missing_only?: boolean } = {}): Promise<ReportPayload> {
    const query: Record<string, string> = {};
    if (params.department) query.department = String(params.department);
    if (params.search) query.search = params.search;
    if (params.missing_only) query.missing_only = '1';
    const res = await managementApi.get(`${BASE}/report/`, { params: query });
    return res.data;
  },

  /** Nội dung file 1 giấy tờ (qua API, có kiểm tra quyền) để hiện trong khung xem, mở đúng trang. */
  async fileBlob(documentId: number): Promise<Blob> {
    const res = await managementApi.get(`${BASE}/${documentId}/file/`, { responseType: 'blob', timeout: 5 * 60 * 1000 });
    return res.data;
  },

  /** Mọi nhân viên: giấy tờ của chính mình còn thiếu loại nào (cảnh báo "Thiếu hồ sơ" trên thanh đầu trang). */
  async mine(): Promise<MyDocumentsPayload> {
    const res = await managementApi.get(`${BASE}/me/`);
    return res.data;
  },
};
