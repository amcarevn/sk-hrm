import { managementApi } from '../utils/api';

export interface ApprovalRequest {
  id: number;
  request_code: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  request_type: 'LEAVE' | 'OVERTIME' | 'ATTENDANCE_EXPLANATION';
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  total_hours?: number;
  created_at: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  current_approval_level?: string;
  department_name?: string;
}

export interface ApprovalStats {
  total_pending: number;
  pending_leave: number;
  pending_overtime: number;
  pending_explanation: number;
  total_approved: number;
  approved_this_month: number;
}

export interface ApprovalActionRequest {
  action: 'APPROVE' | 'REJECT' | 'RETURN' | 'FORWARD';
  note?: string;
  next_approver_id?: number;
}

class ApprovalService {
  // Lấy danh sách các đơn chờ duyệt
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    try {
      // Tạm thời trả về mảng rỗng vì chưa có API tổng hợp
      // TODO: Tạo API endpoint tổng hợp trong backend
      return [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  // Lấy thống kê approvals
  async getApprovalStats(): Promise<ApprovalStats> {
    try {
      // Tạm thời trả về dữ liệu mẫu
      // TODO: Tạo API endpoint thống kê trong backend
      return {
        total_pending: 0,
        pending_leave: 0,
        pending_overtime: 0,
        pending_explanation: 0,
        total_approved: 0,
        approved_this_month: 0
      };
    } catch (error) {
      console.error('Error fetching approval stats:', error);
      throw error;
    }
  }

  // Lấy danh sách attendance explanations theo trạng thái
  async getAttendanceExplanationsByStatus(status: string): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/', {
        params: {
          status: status,
          ordering: '-created_at'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching ${status} attendance explanations:`, error);
      throw error;
    }
  }

  // Lấy danh sách attendance explanations chờ duyệt
  async getPendingAttendanceExplanations(): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('PENDING');
  }

  // Lấy danh sách attendance explanations đã duyệt
  async getApprovedAttendanceExplanations(): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('APPROVED');
  }

  // Lấy danh sách attendance explanations đã từ chối
  async getRejectedAttendanceExplanations(): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('REJECTED');
  }

  // Duyệt attendance explanation
  async approveAttendanceExplanation(explanationId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/attendance-explanations/${explanationId}/approve/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error approving attendance explanation:', error);
      throw error;
    }
  }

  // Từ chối attendance explanation
  async rejectAttendanceExplanation(explanationId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/attendance-explanations/${explanationId}/reject/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting attendance explanation:', error);
      throw error;
    }
  }

  // Lấy thống kê attendance explanations
  async getAttendanceExplanationStats(): Promise<any> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance explanation stats:', error);
      throw error;
    }
  }

  // Lấy danh sách leave requests chờ duyệt (tạm thời chưa có API)
  async getPendingLeaveRequests(): Promise<any[]> {
    try {
      // TODO: Tạo API endpoint cho leave requests
      return [];
    } catch (error) {
      console.error('Error fetching pending leave requests:', error);
      throw error;
    }
  }

  // Lấy danh sách overtime requests chờ duyệt (tạm thời chưa có API)
  async getPendingOvertimeRequests(): Promise<any[]> {
    try {
      // TODO: Tạo API endpoint cho overtime requests
      return [];
    } catch (error) {
      console.error('Error fetching pending overtime requests:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn chờ duyệt
  async getAllPendingRequests(): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    total_pending: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, overtimeRequests] = await Promise.all([
        this.getPendingAttendanceExplanations(),
        this.getPendingLeaveRequests(),
        this.getPendingOvertimeRequests()
      ]);

      const total_pending = attendanceExplanations.length + leaveRequests.length + overtimeRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: overtimeRequests,
        total_pending
      };
    } catch (error) {
      console.error('Error fetching all pending requests:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn đã duyệt
  async getAllApprovedRequests(): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    total_approved: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, overtimeRequests] = await Promise.all([
        this.getApprovedAttendanceExplanations(),
        this.getPendingLeaveRequests(), // TODO: Cần API cho leave requests đã duyệt
        this.getPendingOvertimeRequests() // TODO: Cần API cho overtime requests đã duyệt
      ]);

      const total_approved = attendanceExplanations.length + leaveRequests.length + overtimeRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: overtimeRequests,
        total_approved
      };
    } catch (error) {
      console.error('Error fetching all approved requests:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn đã từ chối
  async getAllRejectedRequests(): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    total_rejected: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, overtimeRequests] = await Promise.all([
        this.getRejectedAttendanceExplanations(),
        this.getPendingLeaveRequests(), // TODO: Cần API cho leave requests đã từ chối
        this.getPendingOvertimeRequests() // TODO: Cần API cho overtime requests đã từ chối
      ]);

      const total_rejected = attendanceExplanations.length + leaveRequests.length + overtimeRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: overtimeRequests,
        total_rejected
      };
    } catch (error) {
      console.error('Error fetching all rejected requests:', error);
      throw error;
    }
  }

  // Kiểm tra xem người dùng hiện tại có quyền duyệt giải trình không
  async canApproveAttendanceExplanation(explanationId: number): Promise<{ can_approve: boolean; message?: string }> {
    try {
      // Tạm thời trả về true cho tất cả để đảm bảo tính tương thích
      // TODO: Tạo API endpoint để kiểm tra quyền trong backend
      return { can_approve: true };
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return { can_approve: false, message: 'Lỗi kiểm tra quyền' };
    }
  }

  // Lấy thông tin employee của người dùng hiện tại
  async getCurrentEmployee(): Promise<any> {
    try {
      const response = await managementApi.get('/api-hrm/employees/me/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current employee:', error);
      throw error;
    }
  }

  // Kiểm tra xem người dùng có phải là HR không
  async isHR(): Promise<boolean> {
    try {
      const employee = await this.getCurrentEmployee();
      if (employee.position && (employee.position.title.includes('HR') || employee.position.title.includes('Nhân sự'))) {
        return true;
      }
      if (employee.department && (employee.department.name.includes('HR') || employee.department.name.includes('Nhân sự'))) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking HR status:', error);
      return false;
    }
  }

  // Kiểm tra xem người dùng có phải là quản lý trực tiếp của employee không
  async isDirectManagerOf(employeeId: number): Promise<boolean> {
    try {
      const currentEmployee = await this.getCurrentEmployee();
      const response = await managementApi.get(`/api-hrm/employees/${employeeId}/`);
      const employee = response.data;
      
      return employee.manager && employee.manager.id === currentEmployee.id;
    } catch (error) {
      console.error('Error checking direct manager status:', error);
      return false;
    }
  }

  // Kiểm tra xem người dùng có phải là trưởng phòng của employee không
  async isDepartmentHeadOf(employeeId: number): Promise<boolean> {
    try {
      const currentEmployee = await this.getCurrentEmployee();
      const response = await managementApi.get(`/api-hrm/employees/${employeeId}/`);
      const employee = response.data;
      
      return employee.department && employee.department.manager && employee.department.manager.id === currentEmployee.id;
    } catch (error) {
      console.error('Error checking department head status:', error);
      return false;
    }
  }
}

export const approvalService = new ApprovalService();
