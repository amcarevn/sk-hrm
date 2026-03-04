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
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [selectedOnlineWorkRequest, setSelectedOnlineWorkRequest] =
    useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    pending_leave: 0,
    pending_overtime: 0,
    pending_explanation: 0,
    pending_registration: 0,
    pending_online_work: 0,
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
  });

  const isAdmin = currentEmployee?.user?.is_staff || currentEmployee?.user?.is_superuser;
  const isHR = currentEmployee?.is_hr ||
    currentEmployee?.position?.title?.includes('HR') ||
    currentEmployee?.position?.title?.includes('Nhân sự') ||
    currentEmployee?.department?.name?.includes('HR') ||
    currentEmployee?.department?.name?.includes('Nhân sự');

  const isManagement = currentEmployee?.position?.is_management || false;

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

      // Chỉ set list data nếu đang ở tab pending
      if (activeTab === 'pending') {
        const allExplanations = result.attendance_explanations;
        console.log('✅ [APPROVALS] Attendance explanations:', allExplanations.length);
        console.log('✅ [APPROVALS] Registration requests:', (result.registration_requests || []).length);
        setAttendanceExplanations(allExplanations);
        setPendingRegistrations(result.registration_requests || []);
        setLeaveRequests(result.leave_requests);
        setOvertimeRequests(result.overtime_requests);
        setOnlineWorkRequests(result.online_work_requests);
      }

      setStats((prev) => ({
        ...prev,
        pending_leave: result.leave_requests.length,
        pending_overtime: result.overtime_requests.length,
        pending_explanation: result.attendance_explanations.length,
        pending_registration: (result.registration_requests || []).length,
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
        setApprovedExplanations(result.attendance_explanations);
        setApprovedRegistrations(result.registration_requests || []);
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
        setRejectedExplanations(result.attendance_explanations);
        setRejectedRegistrations(result.registration_requests || []);
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

  const EXPLANATION_TYPE_MAP: Record<string, string> = {
    LATE: 'Giải trình đi muộn',
    EARLY_LEAVE: 'Giải trình về sớm',
    INCOMPLETE_ATTENDANCE: 'Giải trình quên chấm công',
    BUSINESS_TRIP: 'Giải trình đi công tác',
    FIRST_DAY: 'Giải trình ngày đầu đi làm',
    OTHER: 'Khác',
    OVERTIME: 'Đăng ký tăng ca',
    EXTRA_HOURS: 'Đăng ký làm thêm giờ',
    NIGHT_SHIFT: 'Đăng ký trực tối',
    LIVE: 'Đăng ký Live',
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

  // Hàm xác định loại đơn chi tiết dựa vào _itemType và field phụ
  const getRequestTypeLabel = (req: any): string => {
    if (req._itemType === 'ONLINE_WORK') return 'Làm việc online';
    if (req._itemType === 'REGISTRATION') {
      return req.registration_type ? (EXPLANATION_TYPE_MAP[req.registration_type] || req.registration_type) : 'Đơn đăng ký';
    }
    // Mặc định là đơn giải trình
    return req.explanation_type ? (EXPLANATION_TYPE_MAP[req.explanation_type] || req.explanation_type) : 'Đơn giải trình';
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
    const hasApprovalPermission = currentEmployee.permissions?.can_approve_attendance || false;

    // ==================== TWO-STEP WORKFLOW (ONLINE WORK / REGISTRATION) ====================
    // Quy tắc bắt buộc: LUÔN phải đi qua QLTT trước, không bypass dù người làm đơn là quản lý
    if (request.hasOwnProperty('direct_manager_approved')) {
      // Nếu đã bị từ chối → không thể duyệt
      if (request.direct_manager_rejected || request.hr_rejected) {
        return false;
      }

      const employeeIsHR = request.employee_is_hr || false;

      // Nếu người làm đơn là HR: chỉ 1 bước (QLTT duyệt là xong)
      if (employeeIsHR) {
        if (isAdmin) return true;
        if (isDirectManager) return !request.direct_manager_approved;
        return false; // HR khác không được duyệt đơn của HR
      }

      // Người làm đơn KHÔNG phải HR: bắt buộc 2 bước
      // Bước 1: QLTT duyệt trước
      if (isDirectManager) {
        return !request.direct_manager_approved; // Chỉ được duyệt nếu chưa duyệt
      }

      // Bước 2: HR/Admin chỉ được duyệt SAU KHI QLTT đã duyệt
      // KHÔNG có ngoại lệ senior manager ở đây (khác với Explanation)
      if (isAdmin || isHR || hasApprovalPermission) {
        if (request.direct_manager_approved === true) {
          return !request.hr_approved; // HR chỉ duyệt 1 lần
        }
        return false; // QLTT chưa duyệt → HR không được phép
      }

      // Trưởng phòng cũng phải chờ QLTT
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

  const handleApproveRegistration = async (registrationId: number) => {
    try {
      await approvalService.approveRegistrationRequest(
        registrationId,
        'Đã duyệt'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error approving registration:', error);
    }
  };

  const handleRejectRegistration = async (registrationId: number) => {
    try {
      await approvalService.rejectRegistrationRequest(
        registrationId,
        'Đã từ chối'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error rejecting registration:', error);
    }
  };

  const handleDeleteRegistration = async (registrationId: number) => {
    try {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn xóa đơn đăng ký này không? Hành động này không thể hoàn tác.'
      );

      if (!confirmed) {
        return;
      }

      await approvalService.deleteRegistrationRequest(registrationId);
      alert('Đã xóa đơn đăng ký thành công!');
      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting registration request:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Xóa đơn đăng ký thất bại. Vui lòng thử lại.';
      alert(`Lỗi: ${errorMessage}`);
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
    // LƯU Ý: Nếu trưởng phòng duyệt hoặc ai đó duyệt vòng 1 rồi thì managerApproved = true.
    // Nếu status = REJECTED mà chưa ai duyệt thì vòng 1 bị từ chối.
    const managerStatus = managerApproved
      ? 'Đã duyệt'
      : explanation.status === 'REJECTED'
        ? 'Đã từ chối'
        : 'Chưa duyệt';

    // Ưu tiên hiển thị tên người đã duyệt thực tế. Nếu bị từ chối ở bước này thì dùng rejected_by_name.
    const actualManagerName =
      explanation.direct_manager_approved_by_name ||
      (managerStatus === 'Đã từ chối' ? explanation.rejected_by_name : null) ||
      explanation.employee_manager_name ||
      'Chưa xác định';

    workflow.push({
      step: currentStep++,
      role: 'Quản lý trực tiếp',
      approver: hasManager ? actualManagerName : 'Chưa xác định',
      status: managerStatus,
      date: explanation.direct_manager_approved_at || (managerStatus === 'Đã từ chối' ? explanation.rejected_at : null),
      note: explanation.approval_note || '',
    });

    // Bước 2: Trưởng phòng (nếu có)
    const hasDeptManager =
      explanation.employee_department_manager_name &&
      explanation.employee_department_manager_name !== 'None';
    let deptManagerStatus = 'Chưa duyệt';

    if (hasDeptManager) {
      if (explanation.status === 'APPROVED') {
        deptManagerStatus = 'Đã duyệt';
      } else if (explanation.status === 'REJECTED') {
        // Nếu Quản lý trực tiếp chưa duyệt mà đơn bị từ chối -> TP không liên quan
        if (!managerApproved) {
          deptManagerStatus = 'Chưa duyệt';
        } else {
          deptManagerStatus = 'Đã từ chối';
        }
      }

      workflow.push({
        step: currentStep++,
        role: 'Trưởng phòng',
        approver: (deptManagerStatus === 'Đã từ chối' ? explanation.rejected_by_name : explanation.employee_department_manager_name),
        status: deptManagerStatus,
        date: explanation.approved_at || (deptManagerStatus === 'Đã từ chối' ? explanation.rejected_at : null),
        note: explanation.approval_note || '',
      });
    }

    // Bước 3: Nhân sự HR
    // CHỈ HIỂN THỊ bước HR nếu người làm đơn KHÔNG PHẢI HR
    // Nếu người làm đơn là HR, chỉ cần quản lý trực tiếp duyệt là đủ
    if (!employeeIsHR) {
      const hrStatus = explanation.hr_approved
        ? 'Đã duyệt'
        : (explanation.status === 'REJECTED' && managerApproved)
          ? 'Đã từ chối'
          : 'Chưa duyệt';

      const hrApproverName = hrStatus === 'Đã từ chối'
        ? (explanation.hr_rejected_by_name || explanation.rejected_by_name || 'Phòng Nhân sự')
        : (explanation.hr_approved_by_name || 'Phòng Nhân sự');

      workflow.push({
        step: currentStep++,
        role: 'Nhân sự HR',
        approver: hrApproverName,
        status: hrStatus,
        date: explanation.hr_approved_at || (hrStatus === 'Đã từ chối' ? explanation.rejected_at : null),
        note: explanation.approval_note || '',
        approved_by: explanation.hr_approved_by_name || null,
      });
    }

    if (
      explanation.status === 'APPROVED' ||
      explanation.status === 'REJECTED'
    ) {
      const requestName = explanation._itemType === 'REGISTRATION' ? 'Đăng ký' : 'Giải trình';
      const finalStatus =
        explanation.status === 'APPROVED'
          ? `${requestName} đã duyệt`
          : `${requestName} đã từ chối`;
      const finalApprover =
        explanation.hr_rejected_by_name ||       // HR từ chối (SerializerMethodField mới)
        explanation.hr_approved_by_name ||       // HR đã duyệt
        explanation.approved_by_name ||          // Người xử lý cuối (DM từ chối vòng 1)
        explanation.direct_manager_approved_by_name || // fallback: DM đã duyệt
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
   * Helper function cho timeline duyệt đơn làm việc online và đăng ký (2 bước)
   */
  const getOnlineWorkApprovalWorkflow = (request: any) => {
    const workflow = [];
    const employeeIsHR = request.employee_is_hr || false;
    // Registration requests have registration_type, online work requests have work_date mostly
    const isRegistration = !!request.registration_type;
    const requestName = isRegistration ? 'Đăng ký' : 'Làm việc online';
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
        hrStatus === 'Đã duyệt'
          ? (request.hr_approved_by_name || 'Phòng Nhân sự')
          : hrStatus === 'Đã từ chối'
            ? (request.hr_rejected_by_name || 'Phòng Nhân sự')
            : 'Phòng Nhân sự'; // Chưa duyệt → chưa biết ai sẽ duyệt

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
          ? `${requestName} đã duyệt`
          : `${requestName} đã từ chối`;
      const finalApprover =
        request.hr_rejected_by_name ||
        request.direct_manager_rejected_by_name ||
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

  const getCurrentOnlineWorks = () => {
    if (activeTab === 'pending') return onlineWorkRequests.filter(req => req.status === 'PENDING');
    if (activeTab === 'approved') return onlineWorkRequests.filter(req => req.status === 'APPROVED');
    return onlineWorkRequests.filter(req => req.status === 'REJECTED');
  };

  const getCurrentTitle = () => {
    if (activeTab === 'pending') return 'Yêu cầu chờ duyệt';
    if (activeTab === 'approved') return 'Yêu cầu đã duyệt';
    return 'Yêu cầu đã từ chối';
  };

  const toggleFilter = (type: string) => {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const matchesTextFilters = (req: any) => {
    const name = (req.employee_name || '').toLowerCase();
    const dept = (req.employee_department || req.department_name || '').toLowerCase();
    if (filterName && !name.includes(filterName.toLowerCase())) return false;
    if (filterDepartment && !dept.includes(filterDepartment.toLowerCase())) return false;
    return true;
  };

  // Kết hợp và sắp xếp tất cả các loại đơn để hiển thị trong table
  const getAllCurrentRequests = () => {
    const explanations = getCurrentExplanations();
    const registrations = getCurrentRegistrations();
    const onlineWorks = getCurrentOnlineWorks();

    // Đánh dấu type để dễ phân biệt trong loop, lọc theo filterTypes và text search
    const markedExplanations = (filterTypes.length === 0 || filterTypes.includes('EXPLANATION'))
      ? explanations.filter(matchesTextFilters).map(e => ({ ...e, _itemType: 'EXPLANATION' }))
      : [];
    const markedRegistrations = (filterTypes.length === 0 || filterTypes.includes('REGISTRATION'))
      ? registrations.filter(matchesTextFilters).map(r => ({ ...r, _itemType: 'REGISTRATION' }))
      : [];
    const markedOnlineWorks = (filterTypes.length === 0 || filterTypes.includes('ONLINE_WORK'))
      ? onlineWorks.filter(matchesTextFilters).map(o => ({ ...o, _itemType: 'ONLINE_WORK' }))
      : [];

    return [...markedExplanations, ...markedRegistrations, ...markedOnlineWorks].sort((a, b) => {
      const dateA = new Date(a.attendance_date || a.work_date || a.created_at).getTime();
      const dateB = new Date(b.attendance_date || b.work_date || b.created_at).getTime();
      return dateB - dateA;
    });
  };

  const getFilteredLeaveRequests = () => {
    const typeOk = filterTypes.length === 0 || filterTypes.includes('LEAVE');
    return typeOk ? leaveRequests.filter(matchesTextFilters) : [];
  };

  const getFilteredOvertimeRequests = () => {
    const typeOk = filterTypes.length === 0 || filterTypes.includes('OVERTIME');
    return typeOk ? overtimeRequests.filter(matchesTextFilters) : [];
  };

  const hasActiveFilters = filterTypes.length > 0 || filterName !== '' || filterDepartment !== '';

  const clearAllFilters = () => {
    setFilterTypes([]);
    setFilterName('');
    setFilterDepartment('');
  };

  const getCurrentCount = () => {
    return getAllCurrentRequests().length +
      getFilteredLeaveRequests().length +
      getFilteredOvertimeRequests().length;
  };

  const totalPending =
    stats.pending_leave +
    stats.pending_overtime +
    stats.pending_explanation +
    stats.pending_registration +
    stats.pending_online_work;
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
              onClick={fetchAllData}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>}
              <span>Làm mới</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <button
            onClick={() => toggleFilter('LEAVE')}
            aria-pressed={filterTypes.includes('LEAVE')}
            aria-label="Lọc theo loại đơn Nghỉ phép"
            className={`bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 text-left transition-all hover:shadow-md ${filterTypes.includes('LEAVE') ? 'ring-2 ring-blue-400' : ''}`}
          >
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
          </button>
          <button
            onClick={() => toggleFilter('OVERTIME')}
            aria-pressed={filterTypes.includes('OVERTIME')}
            aria-label="Lọc theo loại đơn Làm thêm giờ"
            className={`bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 text-left transition-all hover:shadow-md ${filterTypes.includes('OVERTIME') ? 'ring-2 ring-purple-400' : ''}`}
          >
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
          </button>
          <button
            onClick={() => toggleFilter('EXPLANATION')}
            aria-pressed={filterTypes.includes('EXPLANATION')}
            aria-label="Lọc theo loại đơn Giải trình"
            className={`bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 text-left transition-all hover:shadow-md ${filterTypes.includes('EXPLANATION') ? 'ring-2 ring-yellow-400' : ''}`}
          >
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
          </button>
          <button
            onClick={() => toggleFilter('ONLINE_WORK')}
            aria-pressed={filterTypes.includes('ONLINE_WORK')}
            aria-label="Lọc theo loại đơn Làm việc online"
            className={`bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500 text-left transition-all hover:shadow-md ${filterTypes.includes('ONLINE_WORK') ? 'ring-2 ring-teal-400' : ''}`}
          >
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
          </button>
          <button
            onClick={() => toggleFilter('REGISTRATION')}
            aria-pressed={filterTypes.includes('REGISTRATION')}
            aria-label="Lọc theo loại đơn Đăng ký"
            className={`bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 text-left transition-all hover:shadow-md ${filterTypes.includes('REGISTRATION') ? 'ring-2 ring-indigo-400' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-indigo-900">Đăng ký</h3>
                <p className="text-3xl font-bold text-indigo-700 mt-2">
                  {stats.pending_registration}
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </button>
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

        {/* Bộ lọc */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          {/* Tìm kiếm theo tên và phòng ban - PHÂN QUYỀN HIỂN THỊ */}
          <div className="flex flex-wrap gap-3">
            {/* Tên nhân viên - Hiện cho HR, Admin, và QUẢN LÝ */}
            {(isAdmin || isHR || isManagement) && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tên nhân viên</label>
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    placeholder="Tìm theo tên..."
                    aria-label="Tìm kiếm theo tên nhân viên"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Phòng ban - CHỈ Hiện cho HR, Admin (Quản lý bị ẩn theo yêu cầu) */}
            {(isAdmin || isHR) && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Phòng ban</label>
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <input
                    type="text"
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    placeholder="Tìm theo phòng ban..."
                    aria-label="Tìm kiếm theo phòng ban"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lọc theo loại đơn */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Loại đơn:</span>
            {[
              { value: 'EXPLANATION', label: 'Giải trình' },
              { value: 'REGISTRATION', label: 'Đơn đăng ký' },
              { value: 'ONLINE_WORK', label: 'Làm việc online' },
              { value: 'LEAVE', label: 'Nghỉ phép' },
              { value: 'OVERTIME', label: 'Làm thêm giờ' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleFilter(opt.value)}
                aria-pressed={filterTypes.includes(opt.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterTypes.includes(opt.value)
                  ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {opt.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                aria-label="Xóa tất cả bộ lọc"
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                ✕ Xóa bộ lọc
              </button>
            )}
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
                ) : getAllCurrentRequests().length === 0 &&
                  getFilteredLeaveRequests().length === 0 &&
                  getFilteredOvertimeRequests().length === 0 ? (
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
                          {activeTab === 'pending' ? 'Không có yêu cầu nào chờ duyệt' : 'Không có yêu cầu nào'}
                        </p>
                        <p className="text-gray-500 mt-1">
                          Tất cả yêu cầu đã được xử lý
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Hiển thị danh sách đơn gộp (Giải trình & Đăng ký) */}
                    {getAllCurrentRequests().map((item) => {
                      const isRegistration = item._itemType === 'REGISTRATION';
                      const isOnlineWork = item._itemType === 'ONLINE_WORK';
                      const itemKey = isRegistration ? `reg-${item.id}` : isOnlineWork ? `online-work-${item.id}` : `exp-${item.id}`;

                      return (
                        <tr key={itemKey}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-10 w-10 ${isRegistration ? 'bg-blue-100' : isOnlineWork ? 'bg-teal-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                                {isRegistration ? (
                                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                ) : isOnlineWork ? (
                                  <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {getRequestTypeLabel(item)}
                                </div>
                                {(() => {
                                  let rawReason = item.reason || item.work_plan || '';
                                  const requestName = getRequestTypeLabel(item);

                                  const prefixes = [
                                    requestName,
                                    item.explanation_type ? EXPLANATION_TYPE_MAP[item.explanation_type] : '',
                                    item.registration_type ? EXPLANATION_TYPE_MAP[item.registration_type] : '',
                                    'Giải trình đi muộn', 'Giải trình về sớm', 'Giải trình quên chấm công',
                                    'Giải trình đi công tác', 'Giải trình ngày đầu đi làm',
                                    'Đi muộn', 'Về sớm', 'Quên chấm công', 'Đi công tác', 'Ngày đầu đi làm',
                                    'Đăng ký tăng ca', 'Đăng ký làm thêm giờ', 'Đăng ký trực tối', 'Đăng ký Live',
                                    'Tăng ca', 'Làm thêm giờ', 'Trực tối', 'Live',
                                    'Làm việc online', 'Làm online', 'Nghỉ phép'
                                  ].filter(Boolean);

                                  prefixes.sort((a, b) => b.length - a.length);

                                  for (const p of prefixes) {
                                    if (p && rawReason.toLowerCase().startsWith(p.toLowerCase())) {
                                      rawReason = rawReason.substring(p.length).replace(/^[\:\-\s]+/, '').trim();
                                      break;
                                    }
                                  }

                                  return rawReason ? (
                                    <div className="text-sm text-gray-600 truncate max-w-xs mt-0.5" title={rawReason}>
                                      <span className="font-semibold text-gray-500">Lý do: </span>
                                      {rawReason}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.employee_code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.attendance_date || item.work_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status, isRegistration ? 'REGISTRATION' : isOnlineWork ? 'ONLINE_WORK' : 'EXPLANATION')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {activeTab === 'pending' ? (
                                ((isOnlineWork || isRegistration) ? canApproveRequest(item) : canApproveExplanation(item)) ? (
                                  <>
                                    <button
                                      onClick={() => isRegistration ? handleApproveRegistration(item.id) : isOnlineWork ? handleApproveOnlineWork(item.id) : handleApprove(item.id)}
                                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => isRegistration ? handleRejectRegistration(item.id) : isOnlineWork ? handleRejectOnlineWork(item.id) : handleReject(item.id)}
                                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-500 text-sm italic">
                                    {item.employee_id === currentEmployee?.id
                                      ? 'Không thể duyệt đơn của mình'
                                      : (!item.direct_manager_approved && !item.direct_manager_rejected)
                                        ? 'Chờ QLTT xử lý'
                                        : item.direct_manager_approved === true
                                          ? 'Chờ HR xử lý'
                                          : 'Không có quyền'}
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-500 text-sm italic">
                                  {activeTab === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                </span>
                              )}
                              <button
                                onClick={() => isOnlineWork ? handleViewOnlineWorkDetails(item) : handleViewDetails(item)}
                                className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                              >
                                Chi tiết
                              </button>

                              {/* Xóa đơn (Áp dụng riêng điều kiện xóa) */}
                              {isOnlineWork ? (
                                activeTab === 'pending' && item.employee_id === currentEmployee?.id && (
                                  <button
                                    onClick={() => handleDeleteOnlineWork(item.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                    title="Xóa đơn làm việc online"
                                  >
                                    Xóa
                                  </button>
                                )
                              ) : (
                                canDeleteExplanation(item) && (
                                  <button
                                    onClick={() => isRegistration ? handleDeleteRegistration(item.id) : handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                    title={isRegistration ? "Xóa đơn đăng ký" : "Xóa đơn giải trình"}
                                  >
                                    Xóa
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Hiển thị leave requests */}
                    {getFilteredLeaveRequests().map((request) => (
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
                              <div className="text-sm font-bold text-gray-900">
                                Nghỉ phép
                              </div>
                              {(() => {
                                let rawReason = request.reason || '';
                                const prefixes = ['Nghỉ phép', 'Lý do:'];

                                for (const p of prefixes) {
                                  if (p && rawReason.toLowerCase().startsWith(p.toLowerCase())) {
                                    rawReason = rawReason.substring(p.length).replace(/^[\:\-\s]+/, '').trim();
                                    break;
                                  }
                                }

                                return rawReason ? (
                                  <div className="text-sm text-gray-600 truncate max-w-xs mt-0.5" title={rawReason}>
                                    <span className="font-semibold text-gray-500">Lý do: </span>
                                    {rawReason}
                                  </div>
                                ) : null;
                              })()}
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
                    {getFilteredOvertimeRequests().map((request) => (
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
                              <div className="text-sm font-bold text-gray-900">
                                Làm thêm giờ
                              </div>
                              {(() => {
                                let rawReason = request.reason || '';
                                const prefixes = ['Làm thêm giờ', 'Tăng ca', 'Đăng ký làm thêm giờ', 'Đăng ký tăng ca', 'Lý do:'];

                                for (const p of prefixes) {
                                  if (p && rawReason.toLowerCase().startsWith(p.toLowerCase())) {
                                    rawReason = rawReason.substring(p.length).replace(/^[\:\-\s]+/, '').trim();
                                    break;
                                  }
                                }

                                return rawReason ? (
                                  <div className="text-sm text-gray-600 truncate max-w-xs mt-0.5" title={rawReason}>
                                    <span className="font-semibold text-gray-500">Lý do: </span>
                                    {rawReason}
                                  </div>
                                ) : null;
                              })()}
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
                    {selectedOnlineWorkRequest
                      ? 'Chi tiết đơn làm việc online'
                      : selectedExplanation?._itemType === 'REGISTRATION'
                        ? 'Chi tiết đăng ký'
                        : 'Chi tiết giải trình'}
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
                {/* 1. Kế hoạch / Lý do (Note Box - Đưa lên đầu) */}
                <div className="mb-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                      {selectedExplanation
                        ? selectedExplanation._itemType === 'REGISTRATION'
                          ? 'Lý do đăng ký'
                          : 'Lý do giải trình'
                        : 'Kế hoạch công việc'}
                    </h4>
                    <p className="text-gray-800 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedExplanation
                        ? selectedExplanation.reason
                        : selectedOnlineWorkRequest.work_plan || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 2. Grid Thông tin Nhân viên & Chi tiết Đơn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Cột 1: Profile Card */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Người tạo đơn
                    </h4>
                    <div className="flex items-center mb-5">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mr-4 border border-blue-200 shadow-inner">
                        <span className="text-blue-700 font-bold text-lg">
                          {(selectedExplanation ? selectedExplanation.employee_name : selectedOnlineWorkRequest.employee_name)?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 leading-tight">
                          {selectedExplanation
                            ? selectedExplanation.employee_name
                            : selectedOnlineWorkRequest.employee_name}
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">
                          {selectedExplanation
                            ? selectedExplanation.employee_code
                            : selectedOnlineWorkRequest.employee_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-gray-100">
                      <div>
                        <span className="block text-xs font-medium text-gray-500 mb-0.5">Phòng ban</span>
                        <span className="block text-sm font-semibold text-gray-800 truncate">
                          {(selectedExplanation
                            ? (selectedExplanation.employee_department || selectedExplanation.department_name)
                            : selectedOnlineWorkRequest.department_name) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 mb-0.5">Quản lý</span>
                        <span className="block text-sm font-semibold text-gray-800 truncate">
                          {(selectedExplanation
                            ? selectedExplanation.employee_manager_name
                            : selectedOnlineWorkRequest.employee_manager_name) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Request Info (Meta Data) */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Cụ thể yêu cầu
                    </h4>

                    <div className="space-y-3.5">
                      {/* Trạng thái hiện tại nổi bật */}
                      <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg mb-1 border border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Trạng thái hiện tại:</span>
                        <span>
                          {getStatusBadge(
                            selectedExplanation
                              ? selectedExplanation.status
                              : selectedOnlineWorkRequest.status,
                            selectedExplanation
                              ? selectedExplanation._itemType
                              : 'ONLINE_WORK'
                          )}
                        </span>
                      </div>

                      {selectedExplanation ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">
                              {selectedExplanation._itemType === 'REGISTRATION' ? 'Ngày đăng ký:' : 'Ngày vi phạm:'}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatDate(selectedExplanation.attendance_date)}
                            </span>
                          </div>
                          {selectedExplanation._itemType !== 'REGISTRATION' && (
                            <>
                              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2.5 mt-2.5">
                                <span className="text-sm font-medium text-gray-500">Trạng thái gốc:</span>
                                <span className="text-sm font-medium text-gray-600 bg-gray-100/80 px-2.5 py-0.5 rounded text-right flex items-center">
                                  {getOriginalStatusText(selectedExplanation.original_status)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2.5">
                                <span className="text-sm font-medium text-gray-500">Mong muốn:</span>
                                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-right flex items-center">
                                  {getExpectedStatusText(selectedExplanation.expected_status)}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Ngày làm việc:</span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatDate(selectedOnlineWorkRequest.work_date)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2.5 mt-2.5">
                            <span className="text-sm font-medium text-gray-500">Mã đơn:</span>
                            <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {selectedOnlineWorkRequest.request_code}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 mt-2">
                        <span className="text-sm font-medium text-gray-500">Ngày tạo đơn:</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatDateTime(
                            selectedExplanation
                              ? selectedExplanation.created_at
                              : selectedOnlineWorkRequest.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields for Online Work (Mở rộng) */}
                {!selectedExplanation && selectedOnlineWorkRequest.actual_result && (
                  <div className="mb-6">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm">
                      <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">
                        Kết quả thực tế
                      </h4>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedOnlineWorkRequest.actual_result}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approval Note (Common) */}

                {/* Workflow Timeline */}
                <div className="mt-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Quy trình duyệt
                  </h4>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
                    <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                      {(() => {
                        const workflowSteps = selectedExplanation
                          ? getApprovalWorkflow(selectedExplanation)
                          : getOnlineWorkApprovalWorkflow(selectedOnlineWorkRequest);

                        return workflowSteps.map((step, index) => {
                          const isRejected = step.status.includes('từ chối');
                          const isApproved = step.status.includes('duyệt') && !step.status.includes('Chưa');
                          const isPending = !isRejected && !isApproved;

                          // Determine the node icon and color
                          const nodeColor = isRejected
                            ? 'bg-red-100 text-red-600 border-red-200 shadow-red-100'
                            : isApproved
                              ? 'bg-green-100 text-green-600 border-green-200 shadow-green-100'
                              : 'bg-white text-gray-400 border-gray-200 outline-dashed outline-2 outline-gray-300 outline-offset-2';

                          return (
                            <div key={step.step} className="relative pl-8">
                              {/* Timeline Node */}
                              <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border-2 bg-white flex items-center justify-center shadow-sm z-10 ${nodeColor}`}>
                                {isRejected ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : isApproved ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                                )}
                              </div>

                              {/* Step Content */}
                              <div className={`bg-gray-50/50 p-4 rounded-xl border ${isRejected ? 'border-red-100/60' : isApproved ? 'border-green-100/60' : 'border-gray-100 opacity-80'}`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 flex items-center">
                                      {step.role}
                                      {/* Mini Badge */}
                                      <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isRejected ? 'bg-red-100 text-red-700' :
                                        isApproved ? 'bg-green-100 text-green-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {step.status}
                                      </span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      <span className="text-gray-400 mr-1">{isRejected ? 'Người từ chối:' : 'Người duyệt:'}</span>
                                      <span className="font-medium text-gray-700">{step.approver}</span>
                                    </p>
                                  </div>

                                  {step.date && (
                                    <div className="text-left sm:text-right bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Thời gian</p>
                                      <p className="text-sm font-semibold text-gray-800">{formatDateTime(step.date)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
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
                              if (selectedExplanation._itemType === 'REGISTRATION') {
                                handleApproveRegistration(selectedExplanation.id);
                              } else {
                                handleApprove(selectedExplanation.id);
                              }
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              if (selectedExplanation._itemType === 'REGISTRATION') {
                                handleRejectRegistration(selectedExplanation.id);
                              } else {
                                handleReject(selectedExplanation.id);
                              }
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
