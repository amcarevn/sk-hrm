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
    approved_leave_requests?: Array<{
      id: number;
      request_code: string;
      leave_type: string;
      status: string;
      approved_at: string;
      approved_by_name: string;
    }>;
    day_status_summary?: {
      has_approved_explanation: boolean;
      has_approved_leave: boolean;
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
}

export const attendanceService = new AttendanceService();
export default attendanceService;
