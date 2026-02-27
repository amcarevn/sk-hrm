import { managementApi } from '../utils/api';

export interface AttendanceRecord {
  id: number;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  status_display: string;
  shift_type: string;
  shift_type_display: string;
  working_hours: number;
  overtime_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  notes: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
}

export interface AttendanceStats {
  statistics: {
    total_days: number;
    status_summary: {
      PRESENT?: number;
      LATE?: number;
      ABSENT?: number;
      EARLY_LEAVE?: number;
      HALF_DAY?: number;
    };
    total_working_hours: number;
    total_overtime_hours: number;
    total_late_minutes: number;
    total_early_leave_minutes: number;
  };
  filters: {
    employee_id?: number;
    department_id?: number;
    start_date: string;
    end_date: string;
  };
  attendance_by_date: Array<{
    attendance_date: string;
    count: number;
    present: number;
    late: number;
    absent: number;
    early_leave: number;
    half_day: number;
  }>;
  employees: Array<{
    id: number;
    full_name: string;
    employee_id: string;
  }>;
}

export interface CalendarViewData {
  calendar_data: Array<{
    id: number;
    date: string;
    employee_id: number;
    employee_name: string;
    employee_code: string;
    check_in: string;
    check_out: string;
    status: string;
    status_display: string;
    shift_type: string;
    shift_type_display: string;
    working_hours: number;
    notes: string;
    department_name: string;
    // Thêm các field mới từ AttendanceSerializer
    work_coefficient?: number;
    late_minutes?: number;
    early_leave_minutes?: number;
    applied_rules?: Array<{
      rule_id: number;
      rule_code: string;
      rule_name: string;
      rule_type: string;
      applied_at: string;
      calculation_result: any;
    }>;
    rule_history?: Array<{
      id: number;
      attendance_id: number;
      rule_id: number;
      applied_configuration: any;
      calculation_result: any;
      applied_at: string;
      applied_by: number | null;
    }>;
    // Thông tin đơn đã duyệt
    approved_explanations?: Array<{
      id: number;
      request_code: string;
      original_status: string;
      expected_status: string;
      status: string;
      approved_at: string;
      approved_by_name: string;
    }>;
    approved_registrations?: Array<{
      id: number;
      request_code: string;
      explanation_type: string;
      status: string;
      approved_at: string;
      approved_by_name: string;
    }>;
    approved_leave_requests?: Array<{
      id: number;
      request_code: string;
      leave_type: string;
      status: string;
      approved_at: string;
      approved_by_name: string;
    }>;
    approved_online_works?: Array<{
      id: number;
      request_code: string;
      status: string;
      work_date: string;
      direct_manager_approved: boolean;
      hr_approved: boolean;
      approved_at: string;
    }>;
    day_status_summary?: {
      has_approved_explanation: boolean;
      has_approved_registration: boolean;
      has_approved_leave: boolean;
      has_approved_online_work: boolean;
      has_pending_request: boolean;
      summary_text: string;
      display_color: string;
    };
  }>;
  employees: Array<{
    id: number;
    full_name: string;
    employee_id: string;
    department_name: string;
  }>;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
}

export interface AttendanceParams {
  page?: number;
  page_size?: number;
  employee_id?: number;
  department_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  shift_type?: string;
  imported_from_file?: boolean;
  import_batch?: string;
  search?: string;
  ordering?: string;
}

export interface CalendarViewParams {
  employee_id?: number;
  department_id?: number;
  year?: number;
  month?: number;
}

export interface MonthlyWorkCreditsParams {
  month?: number;
  year?: number;
  employee_id?: number;
  department_id?: number;
}

export interface MonthlyWorkCreditsResult {
  employee: {
    id: number;
    employee_id: string;
    full_name: string;
    department: string | null;
    position: string | null;
  };
  month: number;
  year: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  attendance_summary: {
    total_days: number;
    total_work_hours: number;
    total_overtime_hours: number;
    total_late_minutes: number;
    total_early_leave_minutes: number;
    status_summary: Record<string, number>;
    attendance_rate: number;
    working_days_in_month: number;
  };
  approved_requests: {
    explanations: number;
    leaves: number;
  };
  credit_calculation: {
    work_credits: number;
    overtime_credits: number;
    penalty_credits: number;
    total_credits: number;
    overtime_multiplier: number;
  };
  notes: string[];
}

export interface MonthlyWorkCreditsResponse {
  filters: {
    month: number;
    year: number;
    employee_id?: number;
    department_id?: number;
  };
  company_config: {
    default_working_hours_per_day: number;
    overtime_multiplier_weekday: number;
    overtime_multiplier_weekend: number;
    overtime_multiplier_holiday: number;
  };
  results: MonthlyWorkCreditsResult[];
  summary: {
    total_employees: number;
    total_work_days: number;
    total_work_hours: number;
    total_work_credits: number;
    total_overtime_hours: number;
    total_overtime_credits: number;
    total_late_minutes: number;
    total_early_leave_minutes: number;
    total_penalty_credits: number;
    avg_work_credits: number;
    avg_overtime_credits: number;
    avg_penalty_credits: number;
    avg_total_credits: number;
  };
  calculation_rules: {
    work_credits: string;
    overtime_credits: string;
    penalty_credits: string;
    total_credits: string;
  };
}

class AttendanceService {
  /**
   * Lấy danh sách bản ghi chấm công
   */
  async getAttendanceRecords(params?: AttendanceParams): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AttendanceRecord[];
  }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê chấm công
   */
  async getAttendanceStats(params?: {
    employee_id?: number;
    department_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<AttendanceStats> {
    try {
      const response = await managementApi.get('/api-hrm/attendance/stats/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu lịch chấm công
   */
  async getCalendarView(params?: CalendarViewParams): Promise<CalendarViewData> {
    try {
      const response = await managementApi.get('/api-hrm/attendance/calendar-view/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar view:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một bản ghi chấm công
   */
  async getAttendanceRecordById(id: number): Promise<AttendanceRecord> {
    try {
      const response = await managementApi.get(`/api-hrm/attendance/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching attendance record ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tạo bản ghi chấm công mới
   */
  async createAttendanceRecord(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const response = await managementApi.post('/api-hrm/attendance/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  }

  /**
   * Cập nhật bản ghi chấm công
   */
  async updateAttendanceRecord(id: number, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const response = await managementApi.put(`/api-hrm/attendance/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating attendance record ${id}:`, error);
      throw error;
    }
  }

  /**
   * Xóa bản ghi chấm công
   */
  async deleteAttendanceRecord(id: number): Promise<void> {
    try {
      await managementApi.delete(`/api-hrm/attendance/${id}/`);
    } catch (error) {
      console.error(`Error deleting attendance record ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tải lên file chấm công
   */
  async uploadAttendanceFile(file: File, importBatch?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (importBatch) {
        formData.append('import_batch', importBatch);
      }

      const response = await managementApi.post('/api-hrm/attendance/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading attendance file:', error);
      throw error;
    }
  }

  /**
   * Tải mẫu file chấm công
   */
  async downloadAttendanceTemplate(): Promise<Blob> {
    try {
      const response = await managementApi.get('/api-hrm/attendance/upload/template/', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading attendance template:', error);
      throw error;
    }
  }

  /**
   * Validate file chấm công trước khi import
   */
  async validateAttendanceFile(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await managementApi.post('/api-hrm/attendance/upload/validate/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error validating attendance file:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử upload file
   */
  async getUploadHistory(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance/upload_history/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching upload history:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử import attendance (mới)
   */
  async getAttendanceImportLogs(params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    imported_by?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-import-logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance import logs:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết import log
   */
  async getAttendanceImportLogDetails(id: number): Promise<any> {
    try {
      const response = await managementApi.get(`/api-hrm/attendance-import-logs/${id}/details/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching attendance import log details ${id}:`, error);
      throw error;
    }
  }

  /**
   * Lấy thống kê import
   */
  async getAttendanceImportStats(): Promise<any> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-import-logs/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance import stats:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử import gần đây
   */
  async getRecentAttendanceImports(): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-import-logs/recent/');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent attendance imports:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê giải trình chấm công
   */
  async getAttendanceExplanationStats(params?: {
    employee_id?: number;
    department_id?: number;
    month?: number;
    year?: number;
  }): Promise<{
    filters: {
      employee_id?: number;
      department_id?: number;
      month: number;
      year: number;
    };
    statistics: {
      total_explanations: number;
      pending_explanations: number;
      approved_explanations: number;
      rejected_explanations: number;
      remaining_explanations: number;
      max_explanations_per_month: number;
      // THÊM MỚI (optional để tương thích ngược)
      non_quota_explanations?: number;
      quota_consuming_explanations?: number;
      // ONLINE WORK STATS
      max_online_work_per_month?: number;
      remaining_online_work?: number;
    };
  }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/stats/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance explanation stats:', error);
      throw error;
    }
  }

  /**
   * Lấy số lần giải trình còn lại của tháng hiện tại cho nhân viên
   */
  async getEmployeeRemainingExplanationCount(employeeId: number): Promise<{
    employee: {
      id: number;
      full_name: string;
      employee_id: string;
    };
    month: number;
    year: number;
    explanation_count: number;
    max_explanations_per_month: number;
    remaining_count: number;
  }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/employee_remaining_count/', {
        params: { employee_id: employeeId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee remaining explanation count:', error);
      throw error;
    }
  }

  /**
   * Tạo giải trình chấm công (Đơn bổ sung công)
   */
  async createAttendanceExplanation(data: {
    employee_id: number;
    attendance_date: string;
    original_status: string;
    expected_status: string;
    reason: string;
    evidence?: File;
    actual_check_in?: string;
    actual_check_out?: string;
    expected_check_in?: string;
    expected_check_out?: string;
    status?: string;
  }): Promise<any> {
    try {
      const formData = new FormData();

      // Add all fields to formData
      formData.append('employee_id', data.employee_id.toString());
      formData.append('attendance_date', data.attendance_date);
      formData.append('original_status', data.original_status);
      formData.append('expected_status', data.expected_status);
      formData.append('reason', data.reason);

      // CRITICAL: Add explanation_type to FormData
      if ((data as any).explanation_type) {
        formData.append('explanation_type', (data as any).explanation_type);
      }

      if (data.actual_check_in) {
        formData.append('actual_check_in', data.actual_check_in);
      }
      if (data.actual_check_out) {
        formData.append('actual_check_out', data.actual_check_out);
      }
      if (data.expected_check_in) {
        formData.append('expected_check_in', data.expected_check_in);
      }
      if (data.expected_check_out) {
        formData.append('expected_check_out', data.expected_check_out);
      }

      if (data.status) {
        formData.append('status', data.status);
      }

      if (data.evidence) {
        formData.append('evidence', data.evidence);
      }

      const response = await managementApi.post('/api-hrm/attendance-explanations/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating attendance explanation:', error);
      throw error;
    }
  }

  /**
   * Gửi giải trình để duyệt
   */
  async submitAttendanceExplanationForApproval(explanationId: number): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/attendance-explanations/${explanationId}/submit_for_approval/`);
      return response.data;
    } catch (error) {
      console.error('Error submitting attendance explanation for approval:', error);
      throw error;
    }
  }

  /**
   * Xóa giải trình chấm công
   */
  async deleteAttendanceExplanation(explanationId: number): Promise<any> {
    try {
      const response = await managementApi.delete(`/api-hrm/attendance-explanations/${explanationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting attendance explanation:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách giải trình chấm công
   */
  async getAttendanceExplanations(params?: {
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    month?: number;
    year?: number;
    status?: string;
    page_size?: number;
    ordering?: string;
  }): Promise<{ count: number; results: any[] }> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance explanations:', error);
      throw error;
    }
  }


  /**
   * Lấy điểm công hàng tháng cho nhân viên
   */
  async getMonthlyWorkCredits(params?: MonthlyWorkCreditsParams): Promise<MonthlyWorkCreditsResponse> {
    try {
      const response = await managementApi.get('/api-hrm/monthly-work-credits/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly work credits:', error);
      throw error;
    }
  }

  /**
   * ==================== ONLINE WORK REQUESTS ====================
   */

  /**
   * Tạo đơn làm việc online mới
   */
  async createOnlineWorkRequest(data: {
    employee_id: number;
    work_date: string;
    reason: string;
    work_plan?: string;
  }): Promise<any> {
    try {
      const response = await managementApi.post('/api-hrm/online-work-requests/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating online work request:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn làm việc online
   */
  async getOnlineWorkRequests(params?: {
    status?: string;
    work_date?: string;
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    page_size?: number;
    ordering?: string;
  }): Promise<any> {
    try {
      const response = await managementApi.get('/api-hrm/online-work-requests/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching online work requests:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn đăng ký công (tăng ca, làm thêm giờ, trực tối, live)
   */
  async getRegistrationRequests(params?: {
    employee_id?: number;
    month?: number;
    year?: number;
    registration_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page_size?: number;
    ordering?: string;
  }): Promise<{ count: number; results: RegistrationRequest[] }> {
    try {
      const response = await managementApi.get('/api-hrm/registration-requests/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching registration requests:', error);
      throw error;
    }
  }

  /**
   * Tạo đơn đăng ký công mới
   */
  async createRegistrationRequest(data: {
    employee_id: number;
    attendance_date: string;
    registration_type: 'OVERTIME' | 'EXTRA_HOURS' | 'NIGHT_SHIFT' | 'LIVE';
    start_time?: string;
    end_time?: string;
    reason: string;
    status?: string;
  }): Promise<RegistrationRequest> {
    try {
      const response = await managementApi.post('/api-hrm/registration-requests/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating registration request:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;

// RegistrationRequest interface
export interface RegistrationRequest {
  id: number;
  request_code: string;
  employee: number;
  employee_name: string;
  employee_id_code?: string;
  department_name?: string;
  registration_type: 'OVERTIME' | 'EXTRA_HOURS' | 'NIGHT_SHIFT' | 'LIVE';
  registration_type_display: string;
  attendance_date: string;
  start_time: string | null;
  end_time: string | null;
  total_hours: number;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  status_display: string;
  direct_manager_approved: boolean;
  hr_approved: boolean;
  direct_manager_approved_at: string | null;
  hr_approved_at: string | null;
  created_at: string;
  updated_at: string;
}
