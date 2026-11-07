import { managementApi } from '../utils/api';

/**
 * Hồ sơ giấy tờ cá nhân của nhân viên — chỉ Admin/HCNS.
 * Backend: hrm/personal_document_views.py (beautycare-backend, nhánh sk).
 * Tải lên hàng loạt theo tên file `<mã NV>_<loại>.pdf`, vd SK00346_HO_KHAU.pdf.
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

export interface BulkResult {
  file_name: string;
  employee: PersonalDocEmployee | null;
  doc_type: string | null;
  doc_type_display: string | null;
  error: string | null;
  status?: 'uploaded' | 'skipped' | 'error';
}

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

  async bulkPreview(fileNames: string[]): Promise<BulkResult[]> {
    const res = await managementApi.post(`${BASE}/bulk-preview/`, { file_names: fileNames });
    return res.data.results;
  },

  async bulkUpload(files: File[]): Promise<BulkResult[]> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await managementApi.post(`${BASE}/bulk-upload/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
    });
    return res.data.results;
  },
};
