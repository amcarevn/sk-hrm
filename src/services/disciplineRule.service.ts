import { managementApi } from '../utils/api';

/**
 * Nội quy & mức phạt (HCNS SK 2026-11-17). Backend: hrm/discipline_rule_views.py (nhánh sk).
 * Quy định chung, ai đăng nhập cũng xem. HCNS cập nhật bằng cách tải Google Sheet "QUY ĐỊNH NHA KHOA SK"
 * về dạng .xlsx rồi "Nhập từ Excel": mỗi tab thay toàn bộ lỗi của nhóm cùng tên.
 */

const BASE = '/api-hrm/discipline-rules';

export interface DisciplineRule {
  id: number;
  stt: string;
  category: string;
  detail: string;
  target: string;
  penalty_1: string;
  penalty_2: string;
  penalty_3: string;
  applies_to: string;
  note: string;
}

export interface DisciplineGroup {
  code: string;
  title: string;
  heading: string;
  notes: string;
  updated_at?: string;
  rules: DisciplineRule[];
}

export interface DisciplineImportResult {
  dry_run: boolean;
  file_name: string;
  groups: {
    code: string;
    title: string;
    heading: string;
    rule_count: number;
    previous_rule_count: number | null;
    notes: string;
    sample: Omit<DisciplineRule, 'id'>[];
  }[];
  skipped_sheets: string[];
  untouched_groups: string[];
}

export const disciplineRuleService = {
  async list(): Promise<DisciplineGroup[]> {
    const res = await managementApi.get(`${BASE}/`);
    return res.data.groups;
  },

  /** dryRun = true: chỉ đọc file và trả về kết quả xem trước, không ghi gì. */
  async importXlsx(file: File, dryRun: boolean): Promise<DisciplineImportResult> {
    const form = new FormData();
    form.append('file', file);
    if (dryRun) form.append('dry_run', '1');
    const res = await managementApi.post(`${BASE}/import/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 2 * 60 * 1000,
    });
    return res.data;
  },
};
