import { managementApi } from '../utils/api';

/**
 * Mô tả công việc theo vị trí (HCNS SK, Task 2).
 * Backend: hrm/job_description_views.py (beautycare-backend, nhánh sk).
 *
 * - Admin/HCNS soạn bản nháp theo 6 khối, gắn vị trí HRM + tài liệu công ty, rồi "Công bố"
 *   thành phiên bản mới (v1, v2...).
 * - Nhân viên xem bản công bố mới nhất của vị trí mình ở "Công việc của tôi" và bấm
 *   "Đã đọc và hiểu". Có phiên bản mới thì phải xác nhận lại.
 * - Khối lương / thưởng / phạt chỉ Admin/HCNS thấy (API nhân viên không trả về).
 */

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
  compensation?: { base_salary: string; bonus: string; penalties: string };
  kpis: Kpi[];
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

export interface Options {
  positions: { id: number; title: string; code: string; job_description: { id: number; title: string } | null }[];
  documents: LinkedDocument[];
}

export interface MyJobDescription {
  id: number;
  code: string;
  title: string;
  version: VersionSummary;
  content: JobContent;
  documents: LinkedDocument[];
  acknowledged_at: string | null;
  acknowledged_older_version: boolean;
}

export interface MyPayload {
  employee: { id: number; employee_id: string; full_name: string; position_title: string | null } | null;
  job_descriptions: MyJobDescription[];
}

export interface JobDescriptionUpdate {
  title?: string;
  code?: string;
  is_active?: boolean;
  position_ids?: number[];
  document_ids?: number[];
  draft_content?: JobContent;
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
  compensation: { base_salary: '', bonus: '', penalties: '' },
  kpis: [],
});

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

  async remove(id: number): Promise<void> {
    await managementApi.delete(`${BASE}/${id}/`);
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

  /** Link file tài liệu gắn với mô tả công việc của mình; backend ghi luôn lượt xem. */
  async openDocument(documentId: number): Promise<string> {
    const res = await managementApi.post(`${MY_BASE}/open-document/`, { document: documentId });
    return res.data.file_url;
  },
};
