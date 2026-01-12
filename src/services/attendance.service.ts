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
      const response = await managementApi.get('/api-hrm/attendance/calendar_view/', { params });
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
}

export const attendanceService = new AttendanceService();
export default attendanceService;
