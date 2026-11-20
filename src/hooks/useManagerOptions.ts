import { useEffect, useState } from 'react';
import { employeesAPI } from '../utils/api';

export interface ManagerOption {
  value: string;
  label: string;
}

/** Vị trí thường là trưởng phòng / trưởng nhóm: tên vị trí bắt đầu bằng "Trưởng phòng" / "Trưởng nhóm". */
export const isLeaderTitle = (title?: string | null): boolean =>
  /^\s*trưởng\s+(phòng|nhóm)/i.test((title || '').normalize('NFC'));

/**
 * Lựa chọn cho ô "Trưởng phòng" (Department.manager) ở trang tạo / sửa phòng ban.
 *
 * Trước 2026-11-20 ô này chỉ có "Chưa chỉ định" (chưa từng nạp danh sách nhân viên), nên không gán được
 * trưởng phòng — mà trưởng phòng là người được xem / quản lý "Dữ liệu phòng ban" của phòng mình.
 * Thứ tự: người của phòng này (và bộ phận con) có vị trí "Trưởng phòng / Trưởng nhóm…" (gợi ý) → người khác
 * của phòng này → mọi nhân viên khác. Chỉ nhân viên đang làm; người đang được chọn vẫn được giữ.
 */
export function useManagerOptions(
  currentId?: string,
  departmentIds: number[] = [],
): { options: ManagerOption[]; loading: boolean; suggested: number } {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    employeesAPI
      .list({ page_size: 1000 })
      .then((res: any) => { if (alive) setEmployees(res?.results || []); })
      .catch(() => { if (alive) setEmployees([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const today = new Date().toLocaleDateString('sv-SE');
  const working = (e: any) =>
    e.employment_status !== 'INACTIVE' && !(e.end_date && String(e.end_date) < today);
  const inDept = (e: any) => departmentIds.includes(Number(e.department));
  const rank = (e: any) => (inDept(e) ? (isLeaderTitle(e.position_title) ? 0 : 1) : 2);
  const list = employees
    .filter((e) => working(e) || String(e.id) === currentId)
    .sort((a, b) => rank(a) - rank(b)
      || String(a.full_name || '').localeCompare(String(b.full_name || ''), 'vi'));
  const options = list.map((e) => ({
    value: String(e.id),
    label: `${rank(e) === 0 ? '★ Gợi ý · ' : ''}${e.full_name} (${e.employee_id})`
      + `${e.position_title ? ` – ${e.position_title}` : ''}`
      + `${!inDept(e) && e.department_name ? ` · ${e.department_name}` : ''}`,
  }));
  return {
    options: [{ value: '', label: 'Chưa chỉ định' }, ...options],
    loading,
    suggested: list.filter((e) => rank(e) === 0).length,
  };
}
