import { managementApi } from '../utils/api';

/**
 * Mô tả công việc theo vị trí (HCNS SK, Task 2).
 * Backend: hrm/job_description_views.py (beautycare-backend, nhánh sk).
 *
 * - Admin/HCNS soạn bản nháp theo 6 khối, gắn vị trí HRM + tài liệu công ty, rồi "Công bố"
 *   thành phiên bản mới (v1, v2...).
 * - Nhân viên xem bản công bố mới nhất của vị trí mình ở "Công việc của tôi" và bấm
 *   "Đã đọc và hiểu". Có phiên bản mới thì phải xác nhận lại.
 * - Khung lương / thưởng theo vị trí chỉ Admin/HCNS thấy (API nhân viên không trả về). Nhân viên xem
 *   lương / thưởng CỦA CHÍNH MÌNH (số liệu hồ sơ) — HCNS SK 2026-11-17.
 * - Nội quy & mức phạt là quy định chung, ai cũng xem: khối "discipline" chọn các nhóm trong trang
 *   "Nội quy & mức phạt" (disciplineRule.service.ts).
 * - Mỗi cơ sở có thể có bản riêng (departments); nơi chưa có bản riêng dùng bản chung.
 */
import { DisciplineGroup } from './disciplineRule.service';

const BASE = '/api-hrm/job-descriptions';
const MY_BASE = '/api-hrm/my-job-description';

export interface Governance {
  direct_manager: string;
  reports_to: string;
  interacts_with: string;
  authority_limits: string;
}

export interface Workflow {
  name: string;
  scope: string;
  coordinate_with: string;
  outputs: string;
}

export type DutyFrequency = 'daily' | 'weekly' | 'monthly';

export interface Kpi {
  criterion: string;
  weight: number | string | null;
}

export interface JobContent {
  governance: Governance;
  workflows: Workflow[];
  duties: Record<DutyFrequency, string[]>;
  knowledge: { core_skills: string; trainer: string };
  /** Khung lương / thưởng theo vị trí — chỉ Admin/HCNS (API nhân viên bỏ khối này). */
  compensation?: { base_salary: string; bonus: string };
  /** Nội quy & mức phạt áp dụng — công khai: mã nhóm + ghi chú thêm. */
  discipline: { groups: string[]; notes: string };
  kpis: Kpi[];
}

export interface DepartmentRef {
  id: number;
  code: string;
  name: string;
}

export interface VersionSummary {
  id: number;
  version: number;
  published_at: string;
  change_note: string;
  published_by_name?: string | null;
}

export interface LinkedDocument {
  id: number;
  title: string;
  document_code: string;
  document_type: string;
  document_type_display: string;
  status: string;
  status_display: string;
  file_name: string;
  is_current: boolean;
  has_file: boolean;
}

export interface JobDescriptionItem {
  id: number;
  code: string;
  title: string;
  is_active: boolean;
  positions: { id: number; title: string; code: string }[];
  /** Phòng ban / cơ sở áp dụng — rỗng = dùng chung. */
  departments: DepartmentRef[];
  documents: LinkedDocument[];
  current_version: VersionSummary | null;
  has_unpublished_changes: boolean;
  employee_count: number;
  acknowledged_count: number;
  draft_updated_at: string | null;
}

export interface JobDescriptionDetail extends JobDescriptionItem {
  draft_content: JobContent;
  draft_updated_by_name: string | null;
  kpi_total: number;
  publish_errors: string[];
  versions: (VersionSummary & { content: JobContent })[];
}

export interface AckRow {
  employee: { id: number; employee_id: string; full_name: string; position_title: string | null; department_name: string | null };
  acknowledged_at: string | null;
  acknowledged_older_version: boolean;
}

export interface AckReport {
  version: VersionSummary | null;
  total: number;
  acknowledged: number;
  pending: number;
  results: AckRow[];
}

export interface PositionMapping {
  id: number;
  title: string;
  /** Các phòng ban của bản đó (rỗng = bản chung). */
  departments: string[];
}

export interface Options {
  positions: {
    id: number;
    title: string;
    code: string;
    job_description: { id: number; title: string } | null;
    job_descriptions: PositionMapping[];
  }[];
  documents: LinkedDocument[];
  departments: DepartmentRef[];
  discipline_groups: { code: string; title: string; rule_count: number }[];
}

export interface MyJobDescription {
  id: number;
  code: string;
  title: string;
  version: VersionSummary;
  content: JobContent;
  /** Nội quy & mức phạt của các nhóm đã chọn (bảng hiện hành). */
  discipline_groups: DisciplineGroup[];
  documents: LinkedDocument[];
  acknowledged_at: string | null;
  acknowledged_older_version: boolean;
}

/** Lương / thưởng của chính nhân viên (số liệu hồ sơ nhân sự) — chỉ chính chủ và HCNS thấy. */
export interface MyCompensation {
  basic_salary: number | null;
  allowance: number | null;
  revenue_percentage: string | null;
  profit_percentage: string | null;
  probation_rate: string | null;
}

export interface MyPayload {
  employee: { id: number; employee_id: string; full_name: string; position_title: string | null } | null;
  job_descriptions: MyJobDescription[];
  compensation: MyCompensation | null;
}

export interface JobDescriptionUpdate {
  title?: string;
  code?: string;
  is_active?: boolean;
  position_ids?: number[];
  department_ids?: number[];
  document_ids?: number[];
  draft_content?: JobContent;
}

/** "Thêm từ Word": mỗi vị trí đọc được trong file + đề xuất tạo / cập nhật bản nháp. */
export interface DocxPosition {
  title: string;
  code: string;
  source_title: string;
  content: JobContent;
  notes: string[];
  kpi_total: number;
  publish_errors: string[];
  base: { id: number; title: string } | null;
  positions: { id: number; title: string }[];
  existing: { id: number; title: string; published: boolean } | null;
}

export interface DocxResult {
  file_name: string;
  department: DepartmentRef | null;
  positions: DocxPosition[];
}

/** "Thêm từ PDF": bản mô tả đã có cùng mã / tên, và vị trí HRM trùng tên sẽ tự gắn khi tạo. */
interface PdfTitleMatch {
  code: string;
  existing: { id: number; title: string } | null;
  matched_positions: string[];
}

export interface PdfPosition extends PdfTitleMatch {
  title: string;
  pages: string;
  summary: string;
}

export interface PdfOutline {
  page_count: number;
  ai_model: string;
  positions: PdfPosition[];
}

export interface PdfExtract extends PdfTitleMatch {
  title: string;
  content: JobContent;
  notes: string;
  kpi_total: number;
  ai_model: string;
}

export const DUTY_LABELS: Record<DutyFrequency, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  monthly: 'Hằng tháng',
};

export const emptyContent = (): JobContent => ({
  governance: { direct_manager: '', reports_to: '', interacts_with: '', authority_limits: '' },
  workflows: [],
  duties: { daily: [], weekly: [], monthly: [] },
  knowledge: { core_skills: '', trainer: '' },
  compensation: { base_salary: '', bonus: '' },
  discipline: { groups: [], notes: '' },
  kpis: [],
});

export const formatMoney = (n: number | null | undefined): string =>
  n == null ? '' : `${n.toLocaleString('vi-VN')} đ`;

/** Tổng trọng số KPI (bỏ qua ô không phải số) — để báo ngay khi HCNS đang gõ. */
export const kpiTotal = (kpis: Kpi[]): number =>
  Math.round(kpis.reduce((sum, k) => {
    const n = typeof k.weight === 'number' ? k.weight : parseFloat(String(k.weight ?? '').replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? sum + n : sum;
  }, 0) * 100) / 100;

export const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.detail || err?.message || fallback;

export const jobDescriptionService = {
  async list(): Promise<JobDescriptionItem[]> {
    const res = await managementApi.get(`${BASE}/`);
    return res.data.results;
  },

  async get(id: number): Promise<JobDescriptionDetail> {
    const res = await managementApi.get(`${BASE}/${id}/`);
    return res.data;
  },

  async create(data: JobDescriptionUpdate): Promise<JobDescriptionDetail> {
    const res = await managementApi.post(`${BASE}/`, data);
    return res.data;
  },

  async update(id: number, data: JobDescriptionUpdate): Promise<JobDescriptionDetail> {
    const res = await managementApi.patch(`${BASE}/${id}/`, data);
    return res.data;
  },

  /** Xoá (cả bản đã công bố). Đã có nhân viên xác nhận đọc thì backend trả 400 code
   * "has_acknowledgements" — hỏi lại HCNS rồi gọi với force = true. */
  async remove(id: number, force = false): Promise<void> {
    await managementApi.delete(`${BASE}/${id}/`, { params: force ? { force: 1 } : undefined });
  },

  async publish(id: number, changeNote: string): Promise<JobDescriptionDetail> {
    const res = await managementApi.post(`${BASE}/${id}/publish/`, { change_note: changeNote });
    return res.data;
  },

  async acknowledgements(id: number): Promise<AckReport> {
    const res = await managementApi.get(`${BASE}/${id}/acknowledgements/`);
    return res.data;
  },

  async options(): Promise<Options> {
    const res = await managementApi.get(`${BASE}/options/`);
    return res.data;
  },

  async mine(): Promise<MyPayload> {
    const res = await managementApi.get(`${MY_BASE}/`);
    return res.data;
  },

  async acknowledge(versionId: number): Promise<MyPayload> {
    const res = await managementApi.post(`${MY_BASE}/acknowledge/`, { version: versionId });
    return res.data;
  },

  /** "Thêm từ PDF" bước 1: AI liệt kê các vị trí có mô tả trong file (không lưu gì). */
  async pdfOutline(file: File): Promise<PdfOutline> {
    const form = new FormData();
    form.append('file', file);
    const res = await managementApi.post(`${BASE}/from-pdf/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 3 * 60 * 1000,
    });
    return res.data;
  },

  /** "Thêm từ PDF" bước 2: AI lấy nội dung 6 khối của 1 vị trí (không lưu gì — gọi create để tạo nháp). */
  async pdfExtract(file: File, title: string, pages: string): Promise<PdfExtract> {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('pages', pages);
    const res = await managementApi.post(`${BASE}/from-pdf/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 3 * 60 * 1000,
    });
    return res.data;
  },

  /** "Thêm từ Word": đọc thẳng các bảng trong file .docx (không AI, không lưu gì). Có departmentId thì
   * đề xuất bản RIÊNG của cơ sở đó, lấy vị trí áp dụng từ bản chung cùng tên. */
  async fromDocx(file: File, departmentId?: number | null): Promise<DocxResult> {
    const form = new FormData();
    form.append('file', file);
    if (departmentId) form.append('department_id', String(departmentId));
    const res = await managementApi.post(`${BASE}/from-docx/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 2 * 60 * 1000,
    });
    return res.data;
  },

  /** Link file tài liệu gắn với mô tả công việc của mình; backend ghi luôn lượt xem. */
  async openDocument(documentId: number): Promise<string> {
    const res = await managementApi.post(`${MY_BASE}/open-document/`, { document: documentId });
    return res.data.file_url;
  },
};
