import { managementApi } from '../utils/api';

export interface DeptAttendanceViolationItem {
  tong_cong: number;
  tong_phat: number;
  so_lan_vi_pham: number;
  ve_som: number;
  phat_ve_som: number;
  di_muon: number;
  phat_di_muon: number;
  thieu_van_tay: string;
  giai_trinh_cong: string;
  giai_trinh_ve_som: string;
  giai_trinh_di_muon: string;
  chuc_danh: string;
  ma_nhan_vien: string;
  ten_nhan_vien: string;
  phong_ban: string;
  vi_tri: string;
  bac_si: string;
  ngay: string;
  thu: string;
  gio_vao: string;
  gio_ra: string;
}

export interface DeptAttendanceViolationResponse {
  department_id: number;
  department_name: string;
  year: number;
  month: number;
  total_employees: number;
  total_violations: number;
  data: DeptAttendanceViolationItem[];
}

export interface DeptAttendanceViolationParams {
  department_id: number;
  year: number;
  month: number;
}

const deptAttendanceViolationReportService = {
  async get(params: DeptAttendanceViolationParams): Promise<DeptAttendanceViolationResponse> {
    const response = await managementApi.get('/api-hrm/dept-attendance-violation-report/', { params });
    return response.data;
  },
};

export default deptAttendanceViolationReportService;
