import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approval.service';
import { attendanceService } from '../services/attendance.service';

const Approvals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'rejected'
  >('pending');
  const [attendanceExplanations, setAttendanceExplanations] = useState<any[]>(
    []
  );
  const [approvedExplanations, setApprovedExplanations] = useState<any[]>([]);
  const [rejectedExplanations, setRejectedExplanations] = useState<any[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState<any[]>([]);
  const [rejectedRegistrations, setRejectedRegistrations] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [onlineWorkRequests, setOnlineWorkRequests] = useState<any[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [selectedOnlineWorkRequest, setSelectedOnlineWorkRequest] =
    useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    pending_leave: 0,
    pending_overtime: 0,
    pending_explanation: 0,
    pending_online_work: 0,
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
  });

  useEffect(() => {
    fetchCurrentEmployee();
    fetchAllData();
  }, [activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Gọi fetch cho cả 3 trang để lấy stats
      await Promise.all([
        fetchPendingRequests(),
        fetchApprovedRequests(),
        fetchRejectedRequests(),
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    if (activeTab === 'pending') {
      await fetchPendingRequests();
    } else if (activeTab === 'approved') {
      await fetchApprovedRequests();
    } else if (activeTab === 'rejected') {
      await fetchRejectedRequests();
    }
  };

  const fetchCurrentEmployee = async () => {
    try {
      const employee = await approvalService.getCurrentEmployee();
      setCurrentEmployee(employee);
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const result = await approvalService.getAllPendingRequests();

      // Chỉ set list data nếu đang ở tab pending (để tránh overwrite khi chạy fetch song song)
      if (activeTab === 'pending') {
        const allExplanations = result.attendance_explanations;
        setAttendanceExplanations(allExplanations.filter((e: any) => !isRegistrationType(e.explanation_type)));
        setPendingRegistrations(allExplanations.filter((e: any) => isRegistrationType(e.explanation_type)));
        setLeaveRequests(result.leave_requests);
        setOvertimeRequests(result.overtime_requests);
        setOnlineWorkRequests(result.online_work_requests);
      }

      setStats((prev) => ({
        ...prev,
        pending_leave: result.leave_requests.length,
        pending_overtime: result.overtime_requests.length,
        pending_explanation: result.attendance_explanations.length,
        pending_online_work: result.online_work_requests.length,
        total_pending: result.total_pending || 0,
      }));
    } catch (error) {
      console.error('❌ [APPROVALS] Error fetching pending requests:', error);
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      const result = await approvalService.getAllApprovedRequests();

      if (activeTab === 'approved') {
        const allExplanations = result.attendance_explanations;
        setApprovedExplanations(allExplanations.filter((e: any) => !isRegistrationType(e.explanation_type)));
        setApprovedRegistrations(allExplanations.filter((e: any) => isRegistrationType(e.explanation_type)));
        setLeaveRequests(result.leave_requests);
        setOvertimeRequests(result.overtime_requests);
        setOnlineWorkRequests(result.online_work_requests);
      }

      setStats((prev) => ({
        ...prev,
        total_approved: result.total_approved || 0,
      }));
    } catch (error) {
      console.error('Error fetching approved requests:', error);
    }
  };

  const fetchRejectedRequests = async () => {
    try {
      const result = await approvalService.getAllRejectedRequests();

      if (activeTab === 'rejected') {
        const allExplanations = result.attendance_explanations;
        setRejectedExplanations(allExplanations.filter((e: any) => !isRegistrationType(e.explanation_type)));
        setRejectedRegistrations(allExplanations.filter((e: any) => isRegistrationType(e.explanation_type)));
        setLeaveRequests(result.leave_requests);
        setOvertimeRequests(result.overtime_requests);
        setOnlineWorkRequests(result.online_work_requests);
      }

      setStats((prev) => ({
        ...prev,
        total_rejected: result.total_rejected || 0,
      }));
    } catch (error) {
      console.error('Error fetching rejected requests:', error);
    }
  };

  // Mapping trạng thái chấm công sang tiếng Việt
  const ATTENDANCE_STATUS_MAP: Record<string, string> = {
    PRESENT: 'Có mặt',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm',
    ABSENT: 'Vắng mặt',
    HALF_DAY: 'Nửa ngày',
    INCOMPLETE_ATTENDANCE: 'Quên chấm công',
  };

  const EXPECTED_STATUS_MAP: Record<string, string> = {
    ...ATTENDANCE_STATUS_MAP,
    PRESENT: 'Đủ công',
  };

  const getOriginalStatusText = (status: string): string =>
    ATTENDANCE_STATUS_MAP[status] || status;

  const getExpectedStatusText = (status: string): string =>
    EXPECTED_STATUS_MAP[status] || status;

  // Constants cho các loại đăng ký
  const REGISTRATION_TYPES = ['OVERTIME', 'EXTRA_HOURS', 'NIGHT_SHIFT', 'LIVE'];

  const isRegistrationType = (explanationType: string): boolean =>
    REGISTRATION_TYPES.includes(explanationType);

  // Hàm xác định loại đơn dựa vào explanation_type
  const getRequestTypeLabel = (explanation: any): string => {
    if (
      explanation.explanation_type &&
      isRegistrationType(explanation.explanation_type)
    ) {
      return 'Đơn đăng ký';
    }

    return 'Đơn giải trình';
  };

  // Kiểm tra xem người dùng hiện tại có quyền duyệt giải trình không
  const canApproveExplanation = (explanation: any): boolean => {
    if (!currentEmployee) return false;

    // Người tạo đơn không thể duyệt đơn của chính mình
    if (explanation.employee_id === currentEmployee.id) {
      return false;
    }

    // QUAN TRỌNG: Nếu người làm đơn là HR, chỉ quản lý trực tiếp mới được duyệt
    const employeeIsHR = explanation.employee_is_hr || false;

    // Kiểm tra quyền dựa trên vai trò và cấp bậc
    const isAdmin =
      currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    const isHR =
      currentEmployee.is_hr ||
      currentEmployee.position?.title?.includes('HR') ||
      currentEmployee.position?.title?.includes('Nhân sự') ||
      currentEmployee.department?.name?.includes('HR') ||
      currentEmployee.department?.name?.includes('Nhân sự');

    // Kiểm tra quyền can_approve_attendance từ permissions
    const hasApprovalPermission =
      currentEmployee.permissions?.can_approve_attendance || false;

    // Nếu người làm đơn là HR
    if (employeeIsHR) {
      // Admin vẫn có thể duyệt
      if (isAdmin) {
        return true;
      }

      // Chỉ quản lý trực tiếp mới được duyệt (và chưa duyệt)
      if (explanation.employee_manager_id === currentEmployee.id) {
        return !explanation.direct_manager_approved;
      }

      // HR không được duyệt đơn của HR khác
      return false;
    }

    // Nếu người làm đơn KHÔNG phải HR
    // Kiểm tra nếu là quản lý trực tiếp (ƯU TIÊN TRƯỚC)
    if (explanation.employee_manager_id === currentEmployee.id) {
      // Nếu quản lý trực tiếp đã duyệt rồi thì không thể duyệt nữa
      if (explanation.direct_manager_approved) {
        return false;
      }
      return true;
    }

    // Admin, HR, và người có quyền can_approve_attendance có quyền duyệt
    if (isAdmin || isHR || hasApprovalPermission) {
      // NẾU LÀ HR (hoặc có quyền tương đương) nhưng KHÔNG PHẢI QLTT
      // THÌ CHỈ ĐƯỢC DUYỆT KHI:
      // 1. Quản lý trực tiếp đã duyệt rồi (direct_manager_approved === true)
      // 2. HOẶC người tạo đơn là Senior Manager (employee_is_senior_manager === true)
      const directManagerAlreadyApproved =
        explanation.direct_manager_approved === true;
      const isCreatorSeniorManager =
        explanation.employee_is_senior_manager === true;

      if (directManagerAlreadyApproved || isCreatorSeniorManager) {
        return true;
      }

      // Nếu chưa thỏa mãn các điều kiện trên, HR chưa được duyệt
      return false;
    }

    // Kiểm tra nếu là trưởng phòng của nhân viên
    if (explanation.employee_department_manager_id === currentEmployee.id) {
      return true;
    }

    // Kiểm tra nếu là quản lý cấp cao hơn
    if (currentEmployee.is_manager && currentEmployee.management_level >= 2) {
      return true;
    }

    return false;
  };

  /**
   * Kiểm tra xem có thể xóa đơn giải trình không
   * - CHỈ người tạo đơn mới thấy nút xóa (Admin/HR/QL chỉ có duyệt/từ chối)
   * - Chỉ được xóa khi status là DRAFT hoặc PENDING
   * - Không được xóa khi quản lý trực tiếp đã duyệt
   * - Không được xóa khi có situation đã được xử lý
   */
  const canDeleteExplanation = (explanation: any): boolean => {
    if (!currentEmployee) return false;

    // Chỉ người tạo đơn mới thấy nút xóa
    if (explanation.employee_id !== currentEmployee.id) return false;

    // Chỉ xóa được khi DRAFT hoặc PENDING
    if (!['DRAFT', 'PENDING'].includes(explanation.status)) return false;

    // Không xóa được khi quản lý trực tiếp đã duyệt
    if (explanation.direct_manager_approved) return false;

    // Không xóa được khi có situation đã xử lý
    const situationDetails = explanation.situation_details;
    if (situationDetails && typeof situationDetails === 'object') {
      for (const key of Object.keys(situationDetails)) {
        const situation = situationDetails[key];
        if (situation && typeof situation === 'object' &&
          ['APPROVED', 'REJECTED'].includes(situation.status)) {
          return false;
        }
      }
    }

    return true;
  };

  // Generic function to check if current user can approve any request type
  const canApproveRequest = (request: any): boolean => {
    if (!currentEmployee) return false;

    // Creator cannot approve their own request
    if (request.employee_id === currentEmployee.id) {
      return false;
    }

    // Check user roles
    const isAdmin =
      currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    const isHR =
      currentEmployee.is_hr ||
      currentEmployee.position?.title?.includes('HR') ||
      currentEmployee.position?.title?.includes('Nhân sự') ||
      currentEmployee.department?.name?.includes('HR') ||
      currentEmployee.department?.name?.includes('Nhân sự');
    const isDirectManager = request.employee_manager_id === currentEmployee.id;

    // Admin can approve anything
    if (isAdmin) return true;

    // ==================== ONLINE WORK REQUEST TWO-STEP WORKFLOW ====================
    // Check if this is an online work request (has direct_manager_approved field)
    if (request.hasOwnProperty('direct_manager_approved')) {
      // If already rejected by anyone, cannot approve
      if (request.direct_manager_rejected || request.hr_rejected) {
        return false;
      }

      // 1. Quản lý trực tiếp có thể duyệt bước 1
      if (isDirectManager && !request.direct_manager_approved) {
        return true;
      }

      // 2. Trưởng phòng có thể duyệt (nếu chưa được quản lý duyệt thì duyệt thay bước 1, hoặc duyệt bước 2)
      const isDeptManager =
        request.employee_department_manager_id === currentEmployee.id;
      if (isDeptManager && !request.hr_approved) {
        return true;
      }

      // 3. HR có thể duyệt bước 2 (sau khi quản lý đã duyệt)
      if (isHR && request.direct_manager_approved && !request.hr_approved) {
        return true;
      }

      // 4. HR có thể duyệt ngay nếu người tạo là quản lý cấp cao hoặc NV HR
      if (
        isHR &&
        (request.employee_is_hr || request.employee_is_senior_manager) &&
        !request.hr_approved
      ) {
        return true;
      }

      return false;
    }

    // ==================== ATTENDANCE EXPLANATION WORKFLOW ====================
    const employeeIsHR = request.employee_is_hr || false;

    if (employeeIsHR) {
      // If employee is HR, only direct manager can approve
      if (isDirectManager) {
        return !request.direct_manager_approved;
      }
      return false;
    }

    // For non-HR employees:
    // Direct manager approves first
    if (isDirectManager) {
      return !request.direct_manager_approved;
    }

    // HR approves second (only if manager already approved)
    if (isHR && request.direct_manager_approved) {
      return !request.hr_approved;
    }

    return false;
  };

  const handleApprove = async (explanationId: number) => {
    try {
      await approvalService.approveAttendanceExplanation(
        explanationId,
        'Đã duyệt'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (explanationId: number) => {
    try {
      await approvalService.rejectAttendanceExplanation(
        explanationId,
        'Đã từ chối'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleDelete = async (explanationId: number) => {
    try {
      // Confirm before deleting
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn xóa đơn giải trình này không? Hành động này không thể hoàn tác.'
      );

      if (!confirmed) {
        return;
      }

      await attendanceService.deleteAttendanceExplanation(explanationId);
      alert('Đã xóa đơn giải trình thành công!');
      fetchRequests(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Xóa đơn giải trình thất bại. Vui lòng thử lại.';
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const handleApproveOnlineWork = async (requestId: number) => {
    try {
      await approvalService.approveOnlineWorkRequest(requestId, 'Đã duyệt');
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error approving online work request:', error);
    }
  };

  const handleDeleteOnlineWork = async (requestId: number) => {
    try {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn xóa đơn làm việc online này không? Hành động này không thể hoàn tác.'
      );

      if (!confirmed) {
        return;
      }

      await approvalService.deleteOnlineWorkRequest(requestId);
      alert('Đã xóa đơn làm việc online thành công!');
      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting online work request:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Xóa đơn làm việc online thất bại. Vui lòng thử lại.';
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const handleViewOnlineWorkDetails = (request: any) => {
    setSelectedOnlineWorkRequest(request);
    setSelectedExplanation(null);
    setShowDetailModal(true);
  };

  const handleRejectOnlineWork = async (requestId: number) => {
    try {
      await approvalService.rejectOnlineWorkRequest(requestId, 'Đã từ chối');
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error rejecting online work request:', error);
    }
  };

  const handleViewDetails = (explanation: any) => {
    setSelectedExplanation(explanation);

    setShowDetailModal(true);
  };

  const getStatusBadge = (
    status: string,
    requestType?: 'EXPLANATION' | 'REGISTRATION' | 'ONLINE_WORK' | 'LEAVE' | 'OVERTIME'
  ) => {
    let statusText = '';
    switch (status) {
      case 'PENDING':
        statusText = 'Chờ duyệt';
        break;
      case 'APPROVED':
        if (requestType === 'REGISTRATION') {
          statusText = 'Đăng ký đã duyệt';
        } else if (requestType === 'ONLINE_WORK') {
          statusText = 'Làm việc online đã duyệt';
        } else if (requestType === 'EXPLANATION') {
          statusText = 'Giải trình đã duyệt';
        } else if (requestType === 'LEAVE') {
          statusText = 'Nghỉ phép đã duyệt';
        } else if (requestType === 'OVERTIME') {
          statusText = 'Làm thêm giờ đã duyệt';
        } else {
          statusText = 'Đã duyệt';
        }
        break;
      case 'REJECTED':
        if (requestType === 'REGISTRATION') {
          statusText = 'Đăng ký đã từ chối';
        } else if (requestType === 'ONLINE_WORK') {
          statusText = 'Làm việc online đã từ chối';
        } else if (requestType === 'EXPLANATION') {
          statusText = 'Giải trình đã từ chối';
        } else if (requestType === 'LEAVE') {
          statusText = 'Nghỉ phép đã từ chối';
        } else if (requestType === 'OVERTIME') {
          statusText = 'Làm thêm giờ đã từ chối';
        } else {
          statusText = 'Đã từ chối';
        }
        break;
      default:
        statusText = status;
    }

    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {statusText}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {statusText}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {statusText}
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {statusText}
          </span>
        );
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'LEAVE':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Nghỉ phép
          </span>
        );
      case 'OVERTIME':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Làm thêm giờ
          </span>
        );
      case 'ATTENDANCE_EXPLANATION':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Giải trình
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {type}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getApprovalWorkflow = (explanation: any) => {
    const workflow = [];

    // Kiểm tra xem người làm đơn có phải HR không
    const employeeIsHR = explanation.employee_is_hr || false;
    let currentStep = 1;

    // Bước 1: Quản lý trực tiếp
    const hasManager =
      explanation.employee_manager_name &&
      explanation.employee_manager_name !== 'None';
    const managerApproved = explanation.direct_manager_approved || false;
    const managerStatus = managerApproved
      ? 'Đã duyệt'
      : explanation.status === 'REJECTED'
        ? 'Đã từ chối'
        : 'Chưa duyệt';

    // Ưu tiên hiển thị tên người đã duyệt thực tế
    const actualManagerName =
      explanation.direct_manager_approved_by_name ||
      explanation.employee_manager_name ||
      'Chưa xác định';

    workflow.push({
      step: currentStep++,
      role: 'Quản lý trực tiếp',
      approver: hasManager ? actualManagerName : 'Chưa xác định',
      status: managerStatus,
      date: explanation.direct_manager_approved_at || null,
      note: explanation.approval_note || '',
    });

    // Bước 2: Trưởng phòng (nếu có)
    const hasDeptManager =
      explanation.employee_department_manager_name &&
      explanation.employee_department_manager_name !== 'None';
    if (hasDeptManager) {
      const deptManagerStatus =
        explanation.status === 'PENDING'
          ? 'Chưa duyệt'
          : explanation.status === 'APPROVED'
            ? 'Đã duyệt'
            : explanation.status === 'REJECTED'
              ? 'Đã từ chối'
              : 'Chưa duyệt';

      workflow.push({
        step: currentStep++,
        role: 'Trưởng phòng',
        approver: explanation.employee_department_manager_name,
        status: deptManagerStatus,
        date: explanation.approved_at || null,
        note: explanation.approval_note || '',
      });
    }

    // Bước 3: Nhân sự HR
    // CHỈ HIỂN THỊ bước HR nếu người làm đơn KHÔNG PHẢI HR
    // Nếu người làm đơn là HR, chỉ cần quản lý trực tiếp duyệt là đủ
    if (!employeeIsHR) {
      workflow.push({
        step: currentStep++,
        role: 'Nhân sự HR',
        approver: explanation.hr_approved_by_name || 'Phòng Nhân sự',
        status: explanation.hr_approved
          ? 'Đã duyệt'
          : explanation.status === 'REJECTED'
            ? 'Đã từ chối'
            : 'Chưa duyệt',
        date: explanation.hr_approved_at || null,
        note: explanation.approval_note || '',
        approved_by: explanation.hr_approved_by_name || null,
      });
    }

    // Bước 4: Tổng hợp trạng thái cuối cùng
    if (
      explanation.status === 'APPROVED' ||
      explanation.status === 'REJECTED'
    ) {
      const finalStatus =
        explanation.status === 'APPROVED'
          ? 'Giải trình đã duyệt'
          : 'Giải trình đã từ chối';
      const finalApprover =
        explanation.approved_by_name ||
        explanation.direct_manager_approved_by_name ||
        explanation.hr_approved_by_name ||
        'Hệ thống';

      workflow.push({
        step: currentStep++,
        role: 'Kết quả cuối cùng',
        approver: finalApprover,
        status: finalStatus,
        date: explanation.approved_at || explanation.updated_at,
        note: explanation.approval_note || '',
      });
    }

    return workflow;
  };

  /**
   * Helper function cho timeline duyệt đơn làm việc online (2 bước)
   */
  const getOnlineWorkApprovalWorkflow = (request: any) => {
    const workflow = [];
    const employeeIsHR = request.employee_is_hr || false;
    let currentStep = 1;

    // Bước 1: Quản lý trực tiếp
    const managerStatus = request.direct_manager_approved
      ? 'Đã duyệt'
      : request.direct_manager_rejected
        ? 'Đã từ chối'
        : 'Chưa duyệt';

    const managerApproverName =
      request.direct_manager_approved_by_name ||
      request.direct_manager_rejected_by_name ||
      request.employee_manager_name ||
      'Chưa xác định';

    workflow.push({
      step: currentStep++,
      role: 'Quản lý trực tiếp',
      approver: managerApproverName,
      status: managerStatus,
      date:
        request.direct_manager_approved_at ||
        request.direct_manager_rejected_at ||
        null,
      note: request.direct_manager_note || '',
    });

    // Bước 2: Trưởng phòng (nếu có)
    const hasDeptManager =
      request.employee_department_manager_name &&
      request.employee_department_manager_name !== 'None';
    if (hasDeptManager) {
      const deptManagerStatus =
        request.status === 'PENDING'
          ? 'Chưa duyệt'
          : request.status === 'APPROVED'
            ? 'Đã duyệt'
            : request.status === 'REJECTED'
              ? 'Đã từ chối'
              : 'Chưa duyệt';

      workflow.push({
        step: currentStep++,
        role: 'Trưởng phòng',
        approver: request.employee_department_manager_name,
        status: deptManagerStatus,
        date: request.approved_at || null,
        note: request.hr_note || request.direct_manager_note || '',
      });
    }

    // Bước 3: Nhân sự HR
    if (!employeeIsHR) {
      const hrStatus = request.hr_approved
        ? 'Đã duyệt'
        : request.hr_rejected
          ? 'Đã từ chối'
          : request.direct_manager_approved
            ? 'Chưa duyệt'
            : 'Chưa duyệt';

      const hrApproverName =
        request.hr_approved_by_name ||
        request.hr_rejected_by_name ||
        'Phòng Nhân sự';

      workflow.push({
        step: currentStep++,
        role: 'Nhân sự HR',
        approver: hrApproverName,
        status: hrStatus,
        date: request.hr_approved_at || request.hr_rejected_at || null,
        note: request.hr_note || '',
      });
    }

    // Bước 4: Tổng hợp trạng thái cuối cùng
    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      const finalStatus =
        request.status === 'APPROVED'
          ? 'Làm việc online đã duyệt'
          : 'Làm việc online đã từ chối';
      const finalApprover =
        request.hr_approved_by_name ||
        request.direct_manager_approved_by_name ||
        'Hệ thống';

      workflow.push({
        step: currentStep++,
        role: 'Kết quả cuối cùng',
        approver: finalApprover,
        status: finalStatus,
        date: request.approved_at || request.updated_at,
        note: request.hr_note || request.direct_manager_note || '',
      });
    }

    return workflow;
  };

  const getCurrentExplanations = () => {
    if (activeTab === 'pending') return attendanceExplanations;
    if (activeTab === 'approved') return approvedExplanations;
    return rejectedExplanations;
  };

  const getCurrentRegistrations = () => {
    if (activeTab === 'pending') return pendingRegistrations;
    if (activeTab === 'approved') return approvedRegistrations;
    return rejectedRegistrations;
  };

  const getCurrentTitle = () => {
    if (activeTab === 'pending') return 'Yêu cầu chờ duyệt';
    if (activeTab === 'approved') return 'Yêu cầu đã duyệt';
    return 'Yêu cầu đã từ chối';
  };

  const getCurrentCount = () => {
    const explanations = getCurrentExplanations();
    return (
      explanations.length +
      leaveRequests.length +
      overtimeRequests.length +
      onlineWorkRequests.length
    );
  };

  const totalPending =
    stats.pending_leave + stats.pending_overtime + stats.pending_explanation;
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phê duyệt</h1>
        <p className="text-gray-600 mt-2">
          Duyệt các đơn xin nghỉ phép, làm thêm giờ, giải trình chấm công và các
          yêu cầu khác.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getCurrentTitle()}
            </h2>
            <p className="text-gray-500 text-sm">
              Có {getCurrentCount()} yêu cầu
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchRequests}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Làm mới
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Lịch sử duyệt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Chờ duyệt
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.total_pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Đã duyệt
              <span className="ml-2 bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.total_approved}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Đã từ chối
              <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.total_rejected}
              </span>
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-900">Nghỉ phép</h3>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                  {stats.pending_leave}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-purple-900">Làm thêm giờ</h3>
                <p className="text-3xl font-bold text-purple-700 mt-2">
                  {stats.pending_overtime}
                </p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-yellow-900">Giải trình</h3>
                <p className="text-3xl font-bold text-yellow-700 mt-2">
                  {stats.pending_explanation}
                </p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-teal-900">Online</h3>
                <p className="text-3xl font-bold text-teal-700 mt-2">
                  {stats.pending_online_work}
                </p>
              </div>
              <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-green-900">Đã duyệt</h3>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {stats.total_approved}
                </p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Tháng này
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người gửi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentExplanations().length === 0 &&
                  getCurrentRegistrations().length === 0 &&
                  leaveRequests.length === 0 &&
                  overtimeRequests.length === 0 &&
                  onlineWorkRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium text-gray-900">
                          Không có yêu cầu nào chờ duyệt
                        </p>
                        <p className="text-gray-500 mt-1">
                          Tất cả yêu cầu đã được xử lý
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Hiển thị attendance explanations theo tab hiện tại */}
                    {getCurrentExplanations().map((explanation) => (
                      <tr key={`explanation-${explanation.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getRequestTypeLabel(explanation)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {explanation.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {explanation.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {explanation.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(explanation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(explanation.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(explanation.status, 'EXPLANATION')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' ? (
                              canApproveExplanation(explanation) ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprove(explanation.id)
                                    }
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleReject(explanation.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-500 text-sm italic">
                                  {explanation.employee_id ===
                                    currentEmployee?.id
                                    ? 'Không thể duyệt đơn của chính mình'
                                    : 'Không có quyền duyệt'}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-500 text-sm italic">
                                {activeTab === 'approved'
                                  ? 'Đã được duyệt'
                                  : 'Đã bị từ chối'}
                              </span>
                            )}
                            <button
                              onClick={() => handleViewDetails(explanation)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                            {/* CHỈ NGƯỜI TẠO ĐƠN mới thấy nút Xóa */}
                            {canDeleteExplanation(explanation) && (
                              <button
                                onClick={() => handleDelete(explanation.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                title="Xóa đơn giải trình"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị đơn đăng ký (tách riêng từ attendance explanations) */}
                    {getCurrentRegistrations().map((reg) => (
                      <tr key={`registration-${reg.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                              {getRequestTypeLabel(reg)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {reg.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reg.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reg.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reg.status, 'REGISTRATION')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' ? (
                              canApproveExplanation(reg) ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprove(reg.id)
                                    }
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleReject(reg.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-500 text-sm italic">
                                  {reg.employee_id ===
                                    currentEmployee?.id
                                    ? 'Không thể duyệt đơn của chính mình'
                                    : 'Không có quyền duyệt'}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-500 text-sm italic">
                                {activeTab === 'approved'
                                  ? 'Đã được duyệt'
                                  : 'Đã bị từ chối'}
                              </span>
                            )}
                            <button
                              onClick={() => handleViewDetails(reg)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                            {canDeleteExplanation(reg) && (
                              <button
                                onClick={() => handleDelete(reg.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                title="Xóa đơn đăng ký"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị leave requests */}
                    {leaveRequests.map((request) => (
                      <tr key={`leave-${request.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Nghỉ phép
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.start_date)} -{' '}
                          {formatDate(request.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status, 'LEAVE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' &&
                              canApproveRequest(request) && (
                                <>
                                  <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm">
                                    Duyệt
                                  </button>
                                  <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm">
                                    Từ chối
                                  </button>
                                </>
                              )}
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị overtime requests */}
                    {overtimeRequests.map((request) => (
                      <tr key={`overtime-${request.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Làm thêm giờ
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.overtime_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status, 'OVERTIME')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' &&
                              canApproveRequest(request) && (
                                <>
                                  <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm">
                                    Duyệt
                                  </button>
                                  <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm">
                                    Từ chối
                                  </button>
                                </>
                              )}
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị online work requests */}
                    {onlineWorkRequests.map((request) => (
                      <tr key={`online-work-${request.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-teal-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Làm việc online
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.reason || request.work_plan}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.work_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status, 'ONLINE_WORK')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' &&
                              canApproveRequest(request) && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveOnlineWork(request.id)
                                    }
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectOnlineWork(request.id)
                                    }
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                            <button
                              onClick={() =>
                                handleViewOnlineWorkDetails(request)
                              }
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                            {activeTab === 'pending' &&
                              request.employee_id === currentEmployee?.id && (
                                <button
                                  onClick={() =>
                                    handleDeleteOnlineWork(request.id)
                                  }
                                  className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                >
                                  Xóa
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quy trình duyệt của bạn
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-700">
                  Bạn có quyền duyệt các đơn:{' '}
                  <span className="font-medium">
                    Nghỉ phép, Làm thêm giờ, Giải trình chấm công
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Cấp duyệt: Quản lý trực tiếp • Thời gian xử lý: 24 giờ
                </p>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                Cấu hình quy trình
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      {showDetailModal &&
        (selectedExplanation || selectedOnlineWorkRequest) && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedExplanation
                      ? (isRegistrationType(selectedExplanation.explanation_type) ? 'Chi tiết đăng ký' : 'Chi tiết giải trình')
                      : 'Chi tiết đơn làm việc online'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedExplanation(null);
                      setSelectedOnlineWorkRequest(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Thông tin nhân viên */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Thông tin nhân viên
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg
                            className="h-5 w-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedExplanation
                              ? selectedExplanation.employee_name
                              : selectedOnlineWorkRequest.employee_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedExplanation
                              ? selectedExplanation.employee_code
                              : selectedOnlineWorkRequest.employee_code}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Phòng ban:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {(selectedExplanation
                              ? selectedExplanation.employee_department
                              : selectedOnlineWorkRequest.department_name) ||
                              'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Quản lý trực tiếp:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {(selectedExplanation
                              ? selectedExplanation.employee_manager_name
                              : selectedOnlineWorkRequest.employee_manager_name) ||
                              'N/A'}
                          </span>
                        </div>
                        {selectedExplanation && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Trưởng phòng:
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedExplanation.employee_department_manager_name ||
                                'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thông tin đơn */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      {selectedExplanation
                        ? (isRegistrationType(selectedExplanation.explanation_type) ? 'Thông tin đăng ký' : 'Thông tin giải trình')
                        : 'Thông tin đơn làm việc online'}
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        {selectedExplanation ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                {isRegistrationType(selectedExplanation.explanation_type) ? 'Ngày đăng ký:' : 'Ngày giải trình:'}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(
                                  selectedExplanation.attendance_date
                                )}
                              </span>
                            </div>

                            {/* Chỉ hiển thị trạng thái gốc/mong muốn cho các loại Giải trình thực sự */}
                            {!isRegistrationType(selectedExplanation.explanation_type) && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                      Trạng thái gốc:
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {getOriginalStatusText(selectedExplanation.original_status)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                      Trạng thái mong muốn:
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {getExpectedStatusText(selectedExplanation.expected_status)}
                                    </span>
                                  </div>
                                </>
                              )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Ngày làm việc:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(
                                  selectedOnlineWorkRequest.work_date
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Mã đơn:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {selectedOnlineWorkRequest.request_code}
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Trạng thái hiện tại:
                          </span>
                          <span>
                            {getStatusBadge(
                              selectedExplanation
                                ? selectedExplanation.status
                                : selectedOnlineWorkRequest.status,
                              selectedExplanation
                                ? (isRegistrationType(selectedExplanation.explanation_type) ? 'REGISTRATION' : 'EXPLANATION')
                                : 'ONLINE_WORK'
                            )}
                          </span>
                        </div>

                        {selectedExplanation ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Quản lý trực tiếp đã duyệt:
                              </span>
                              <span
                                className={`text-sm font-medium ${selectedExplanation.direct_manager_approved
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                                  }`}
                              >
                                {selectedExplanation.direct_manager_approved
                                  ? '✓ Đã duyệt'
                                  : '✗ Chưa duyệt'}
                              </span>
                            </div>
                            {!selectedExplanation.employee_is_hr && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                  Nhân sự HR đã duyệt:
                                </span>
                                <span
                                  className={`text-sm font-medium ${selectedExplanation.hr_approved
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                    }`}
                                >
                                  {selectedExplanation.hr_approved
                                    ? '✓ Đã duyệt'
                                    : '✗ Chưa duyệt'}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Quản lý trực tiếp đã duyệt:
                              </span>
                              <span
                                className={`text-sm font-medium ${selectedOnlineWorkRequest.direct_manager_approved
                                  ? 'text-green-600'
                                  : selectedOnlineWorkRequest.direct_manager_rejected
                                    ? 'text-red-600'
                                    : 'text-gray-400'
                                  }`}
                              >
                                {selectedOnlineWorkRequest.direct_manager_approved
                                  ? '✓ Đã duyệt'
                                  : selectedOnlineWorkRequest.direct_manager_rejected
                                    ? '✗ Từ chối'
                                    : '✗ Chưa duyệt'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Nhân sự HR đã duyệt:
                              </span>
                              <span
                                className={`text-sm font-medium ${selectedOnlineWorkRequest.hr_approved
                                  ? 'text-green-600'
                                  : selectedOnlineWorkRequest.hr_rejected
                                    ? 'text-red-600'
                                    : 'text-gray-400'
                                  }`}
                              >
                                {selectedOnlineWorkRequest.hr_approved
                                  ? '✓ Đã duyệt'
                                  : selectedOnlineWorkRequest.hr_rejected
                                    ? '✗ Từ chối'
                                    : '✗ Chưa duyệt'}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Timestamps */}
                        {(selectedExplanation
                          ? selectedExplanation.direct_manager_approved_at
                          : selectedOnlineWorkRequest.direct_manager_approved_at) && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                QL trực tiếp duyệt lúc:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDateTime(
                                  selectedExplanation
                                    ? selectedExplanation.direct_manager_approved_at
                                    : selectedOnlineWorkRequest.direct_manager_approved_at
                                )}
                              </span>
                            </div>
                          )}

                        {selectedOnlineWorkRequest?.direct_manager_rejected_at && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              QL trực tiếp từ chối lúc:
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDateTime(
                                selectedOnlineWorkRequest.direct_manager_rejected_at
                              )}
                            </span>
                          </div>
                        )}

                        {(selectedExplanation
                          ? !selectedExplanation.employee_is_hr &&
                          selectedExplanation.hr_approved_at
                          : selectedOnlineWorkRequest.hr_approved_at) && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                HR duyệt lúc:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDateTime(
                                  selectedExplanation
                                    ? selectedExplanation.hr_approved_at
                                    : selectedOnlineWorkRequest.hr_approved_at
                                )}
                              </span>
                            </div>
                          )}

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Ngày tạo:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(
                              selectedExplanation
                                ? selectedExplanation.created_at
                                : selectedOnlineWorkRequest.created_at
                            )}
                          </span>
                        </div>

                        {(selectedExplanation
                          ? selectedExplanation.approved_at
                          : selectedOnlineWorkRequest.approved_at) && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Ngày duyệt cuối cùng:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDateTime(
                                  selectedExplanation
                                    ? selectedExplanation.approved_at
                                    : selectedOnlineWorkRequest.approved_at
                                )}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reasons / Work Plans */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {selectedExplanation
                      ? 'Lý do giải trình'
                      : 'Kế hoạch công việc'}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-blue-700 font-medium whitespace-pre-wrap">
                      {selectedExplanation
                        ? selectedExplanation.reason
                        : selectedOnlineWorkRequest.work_plan || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Additional Fields for Online Work */}
                {!selectedExplanation && (
                  <>
                    {selectedOnlineWorkRequest.actual_result && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Kết quả thực tế
                        </h4>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <p className="text-green-800 whitespace-pre-wrap">
                            {selectedOnlineWorkRequest.actual_result}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Approval Note (Common) */}

                {/* Workflow Timeline */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Quy trình duyệt
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      {(selectedExplanation
                        ? getApprovalWorkflow(selectedExplanation)
                        : getOnlineWorkApprovalWorkflow(
                          selectedOnlineWorkRequest
                        )
                      ).map((step) => (
                        <div key={step.step} className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${step.status === 'Đã duyệt'
                              ? 'bg-green-100 text-green-600'
                              : step.status === 'Đã từ chối'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                              }`}
                          >
                            <span className="text-sm font-medium">
                              {step.step}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {step.role}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Người duyệt: {step.approver}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${step.status === 'Đã duyệt'
                                  ? 'bg-green-100 text-green-800'
                                  : step.status === 'Đã từ chối'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                  }`}
                              >
                                {step.status}
                              </span>
                            </div>
                            {step.date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Ngày duyệt: {formatDateTime(step.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedExplanation(null);
                    setSelectedOnlineWorkRequest(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                {activeTab === 'pending' && (
                  <>
                    {selectedExplanation &&
                      canApproveExplanation(selectedExplanation) && (
                        <>
                          <button
                            onClick={() => {
                              handleApprove(selectedExplanation.id);
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              handleReject(selectedExplanation.id);
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    {selectedOnlineWorkRequest &&
                      canApproveRequest(selectedOnlineWorkRequest) && (
                        <>
                          <button
                            onClick={() => {
                              handleApproveOnlineWork(
                                selectedOnlineWorkRequest.id
                              );
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              handleRejectOnlineWork(
                                selectedOnlineWorkRequest.id
                              );
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Approvals;
