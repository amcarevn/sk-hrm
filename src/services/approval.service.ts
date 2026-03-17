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
  async getAttendanceExplanationsByStatus(status: string, params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/attendance-explanations/', {
        params: {
          status: status,
          ordering: '-created_at',
          day: params?.day && params.day !== 0 ? params.day : undefined,
          month: params?.month,
          year: params?.year
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching ${status} attendance explanations:`, error);
      throw error;
    }
  }

  // Lấy danh sách attendance explanations chờ duyệt
  async getPendingAttendanceExplanations(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('PENDING', params);
  }

  // Lấy danh sách attendance explanations đã duyệt
  async getApprovedAttendanceExplanations(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('APPROVED', params);
  }

  // Lấy danh sách attendance explanations đã từ chối
  async getRejectedAttendanceExplanations(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getAttendanceExplanationsByStatus('REJECTED', params);
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

  // Duyệt monthly leave request
  async approveMonthlyLeaveRequest(leaveId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/monthly-leave-requests/${leaveId}/approve/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error approving monthly leave request:', error);
      throw error;
    }
  }

  // Từ chối monthly leave request
  async rejectMonthlyLeaveRequest(leaveId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/monthly-leave-requests/${leaveId}/reject/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting monthly leave request:', error);
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

  // Lấy danh sách monthly leave requests theo trạng thái
  async getMonthlyLeaveRequestsByStatus(status: string, params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/monthly-leave-requests/', {
        params: {
          status: status,
          ordering: '-created_at',
          day: params?.day && params.day !== 0 ? params.day : undefined,
          month: params?.month,
          year: params?.year
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching ${status} monthly leave requests:`, error);
      throw error;
    }
  }

  // Lấy danh sách leave requests chờ duyệt
  async getPendingLeaveRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getMonthlyLeaveRequestsByStatus('PENDING', params);
  }

  // Lấy danh sách leave requests đã duyệt
  async getApprovedLeaveRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getMonthlyLeaveRequestsByStatus('APPROVED', params);
  }

  // Lấy danh sách leave requests đã từ chối
  async getRejectedLeaveRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getMonthlyLeaveRequestsByStatus('REJECTED', params);
  }

  // Lấy danh sách registration requests theo trạng thái
  async getRegistrationRequestsByStatus(status: string, params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/registration-requests/', {
        params: {
          status: status,
          ordering: '-created_at',
          day: params?.day && params.day !== 0 ? params.day : undefined,
          month: params?.month,
          year: params?.year
        }
      });
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error(`Error fetching ${status} registration requests:`, error);
      throw error;
    }
  }

  // Lấy danh sách registration requests chờ duyệt
  async getPendingRegistrationRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getRegistrationRequestsByStatus('PENDING', params);
  }

  // Lấy danh sách registration requests đã duyệt
  async getApprovedRegistrationRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getRegistrationRequestsByStatus('APPROVED', params);
  }

  // Lấy danh sách registration requests đã từ chối
  async getRejectedRegistrationRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getRegistrationRequestsByStatus('REJECTED', params);
  }

  // Duyệt registration request
  async approveRegistrationRequest(requestId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/registration-requests/${requestId}/approve/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error approving registration request:', error);
      throw error;
    }
  }

  // Từ chối registration request
  async rejectRegistrationRequest(requestId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(`/api-hrm/registration-requests/${requestId}/reject/`, {
        approval_note: note || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting registration request:', error);
      throw error;
    }
  }

  // Từ chối registration request
  async deleteRegistrationRequest(requestId: number): Promise<void> {
    try {
      await managementApi.delete(`/api-hrm/registration-requests/${requestId}/`);
    } catch (error) {
      console.error('Error deleting registration request:', error);
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

  // Lấy danh sách online work requests theo trạng thái
  async getOnlineWorkRequestsByStatus(status: string, params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    try {
      const response = await managementApi.get('/api-hrm/online-work-requests/', {
        params: {
          status: status,
          ordering: '-created_at',
          day: params?.day && params.day !== 0 ? params.day : undefined,
          month: params?.month,
          year: params?.year
        }
      });
      console.log(`🔵 [APPROVAL SERVICE] Online work ${status} response:`, response.data);
      // API có thể trả về array trực tiếp hoặc trong results field
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error(`Error fetching ${status} online work requests:`, error);
      throw error;
    }
  }

  // Lấy danh sách online work requests chờ duyệt
  async getPendingOnlineWorkRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getOnlineWorkRequestsByStatus('PENDING', params);
  }

  // Lấy danh sách online work requests đã duyệt
  async getApprovedOnlineWorkRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getOnlineWorkRequestsByStatus('APPROVED', params);
  }

  // Lấy danh sách online work requests đã từ chối
  async getRejectedOnlineWorkRequests(params?: { day?: number; month?: number; year?: number }): Promise<any[]> {
    return this.getOnlineWorkRequestsByStatus('REJECTED', params);
  }

  // Duyệt online work request
  async approveOnlineWorkRequest(requestId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(
        `/api-hrm/online-work-requests/${requestId}/approve/`,
        { approval_note: note || '' }
      );
      return response.data;
    } catch (error) {
      console.error('Error approving online work request:', error);
      throw error;
    }
  }

  // Từ chối online work request
  async rejectOnlineWorkRequest(requestId: number, note?: string): Promise<any> {
    try {
      const response = await managementApi.post(
        `/api-hrm/online-work-requests/${requestId}/reject/`,
        { approval_note: note || '' }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting online work request:', error);
      throw error;
    }
  }

  // Xóa online work request
  async deleteOnlineWorkRequest(requestId: number): Promise<void> {
    try {
      await managementApi.delete(`/api-hrm/online-work-requests/${requestId}/`);
    } catch (error) {
      console.error('Error deleting online work request:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn chờ duyệt
  async getAllPendingRequests(params?: { day?: number; month?: number; year?: number }): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    online_work_requests: any[];
    registration_requests: any[];
    total_pending: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, onlineWorkRequests, registrationRequests] = await Promise.all([
        this.getPendingAttendanceExplanations(params),
        this.getPendingLeaveRequests(params),
        this.getPendingOnlineWorkRequests(params),
        this.getPendingRegistrationRequests(params)
      ]);

      const total_pending = attendanceExplanations.length + leaveRequests.length + onlineWorkRequests.length + registrationRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: [], // TODO: Cần API cho overtime requests (chờ đăng ký types khác)
        online_work_requests: onlineWorkRequests,
        registration_requests: registrationRequests,
        total_pending
      };
    } catch (error) {
      console.error('Error fetching all pending requests:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn đã duyệt
  async getAllApprovedRequests(params?: { day?: number; month?: number; year?: number }): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    online_work_requests: any[];
    registration_requests: any[];
    total_approved: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, onlineWorkRequests, registrationRequests] = await Promise.all([
        this.getApprovedAttendanceExplanations(params),
        this.getApprovedLeaveRequests(params),
        this.getApprovedOnlineWorkRequests(params),
        this.getApprovedRegistrationRequests(params)
      ]);

      const total_approved = attendanceExplanations.length + leaveRequests.length + onlineWorkRequests.length + registrationRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: [],
        online_work_requests: onlineWorkRequests,
        registration_requests: registrationRequests,
        total_approved
      };
    } catch (error) {
      console.error('Error fetching all approved requests:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả các loại đơn đã từ chối
  async getAllRejectedRequests(params?: { day?: number; month?: number; year?: number }): Promise<{
    attendance_explanations: any[];
    leave_requests: any[];
    overtime_requests: any[];
    online_work_requests: any[];
    registration_requests: any[];
    total_rejected: number;
  }> {
    try {
      const [attendanceExplanations, leaveRequests, onlineWorkRequests, registrationRequests] = await Promise.all([
        this.getRejectedAttendanceExplanations(params),
        this.getRejectedLeaveRequests(params),
        this.getRejectedOnlineWorkRequests(params),
        this.getRejectedRegistrationRequests(params)
      ]);

      const total_rejected = attendanceExplanations.length + leaveRequests.length + onlineWorkRequests.length + registrationRequests.length;

      return {
        attendance_explanations: attendanceExplanations,
        leave_requests: leaveRequests,
        overtime_requests: [],
        online_work_requests: onlineWorkRequests,
        registration_requests: registrationRequests,
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

  private currentEmployeePromise: Promise<any> | null = null;

  // Lấy thông tin employee của người dùng hiện tại
  async getCurrentEmployee(): Promise<any> {
    if (this.currentEmployeePromise) {
      return this.currentEmployeePromise;
    }

    this.currentEmployeePromise = (async () => {
      try {
        const response = await managementApi.get('/api-hrm/employees/me/');
        return response.data;
      } catch (error) {
        console.error('Error fetching current employee:', error);
        // Reset promise on error so next call can retry
        this.currentEmployeePromise = null;
        throw error;
      }
    })();

    return this.currentEmployeePromise;
  }

  // Kiểm tra xem người dùng có phải là HR không
  async isHR(): Promise<boolean> {
    try {
      const employee = await this.getCurrentEmployee();

      // Kiểm tra qua position
      if (employee.position && (employee.position.title.includes('HR') || employee.position.title.includes('Nhân sự'))) {
        return true;
      }

      // Kiểm tra qua department
      if (employee.department && (employee.department.name.includes('HR') || employee.department.name.includes('Nhân sự'))) {
        return true;
      }

      // Kiểm tra qua permissions từ API
      if (employee.permissions && employee.permissions.can_approve_attendance) {
        return true;
      }

      // Kiểm tra trường is_hr nếu có
      if (employee.is_hr) {
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

  // Duyệt hàng loạt giải trình chấm công
  async bulkApproveAttendanceExplanations(ids: number[], note?: string): Promise<any> {
    try {
      const response = await managementApi.post('/api-hrm/attendance-explanations/bulk_approve/', {
        ids,
        approval_note: note || 'Duyệt nhanh hàng loạt'
      });
      return response.data;
    } catch (error) {
      console.error('Error in bulk approving attendance explanations:', error);
      throw error;
    }
  }

  // Duyệt hàng loạt đơn nghỉ phép tháng
  async bulkApproveMonthlyLeaveRequests(ids: number[], note?: string): Promise<any> {
    try {
      const response = await managementApi.post('/api-hrm/monthly-leave-requests/bulk_approve/', {
        ids,
        approval_note: note || 'Duyệt nhanh hàng loạt'
      });
      return response.data;
    } catch (error) {
      console.error('Error in bulk approving monthly leave requests:', error);
      throw error;
    }
  }

  // Duyệt hàng loạt đơn đăng ký
  async bulkApproveRegistrationRequests(ids: number[], note?: string): Promise<any> {
    try {
      const response = await managementApi.post('/api-hrm/registration-requests/bulk_approve/', {
        ids,
        approval_note: note || 'Duyệt nhanh hàng loạt'
      });
      return response.data;
    } catch (error) {
      console.error('Error in bulk approving registration requests:', error);
      throw error;
    }
  }

  // Duyệt hàng loạt đơn làm việc online
  async bulkApproveOnlineWorkRequests(ids: number[], note?: string): Promise<any> {
    try {
      const response = await managementApi.post('/api-hrm/online-work-requests/bulk_approve/', {
        ids,
        approval_note: note || 'Duyệt nhanh hàng loạt'
      });
      return response.data;
    } catch (error) {
      console.error('Error in bulk approving online work requests:', error);
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();
