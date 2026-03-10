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
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<any[]>([]);
  const [approvedLeaveRequests, setApprovedLeaveRequests] = useState<any[]>([]);
  const [rejectedLeaveRequests, setRejectedLeaveRequests] = useState<any[]>([]);
  const [pendingOvertimeRequests, setPendingOvertimeRequests] = useState<any[]>([]);
  const [approvedOvertimeRequests, setApprovedOvertimeRequests] = useState<any[]>([]);
  const [rejectedOvertimeRequests, setRejectedOvertimeRequests] = useState<any[]>([]);
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

  // States cho các modal Dialog mới
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'DELETE'>(
    'APPROVE'
  );
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
        setPendingLeaveRequests(result.leave_requests || []);
        setPendingOvertimeRequests(result.overtime_requests || []);
        setOnlineWorkRequests(result.online_work_requests || []);
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
        setApprovedLeaveRequests(result.leave_requests || []);
        setApprovedOvertimeRequests(result.overtime_requests || []);
        setOnlineWorkRequests(result.online_work_requests || []);
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
        setRejectedLeaveRequests(result.leave_requests || []);
        setRejectedOvertimeRequests(result.overtime_requests || []);
        setOnlineWorkRequests(result.online_work_requests || []);
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
    LEAVE: 'Nghỉ phép tháng',
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
    ABSENT: 'Vắng mặt',
  };

  const getOriginalStatusText = (status: string): string =>
    ATTENDANCE_STATUS_MAP[status] || status;

  const getExpectedStatusText = (status: string): string =>
    EXPECTED_STATUS_MAP[status] || status;

  // Hàm xác định loại đơn chi tiết dựa vào _itemType và field phụ
  const getRequestTypeLabel = (req: any): string => {
    if (req._itemType === 'ONLINE_WORK') return 'Làm việc online';
    if (req._itemType === 'LEAVE') return 'Nghỉ phép tháng';
    if (req._itemType === 'OVERTIME') return 'Đăng ký làm thêm giờ';
    if (req._itemType === 'REGISTRATION') {
      return req.registration_type ? (EXPLANATION_TYPE_MAP[req.registration_type] || req.registration_type) : 'Đơn đăng ký';
    }
    // Mặc định là đơn giải trình
    return req.explanation_type ? (EXPLANATION_TYPE_MAP[req.explanation_type] || req.explanation_type) : 'Đơn giải trình';
  };

  /**
   * Làm sạch nội dung lý do: loại bỏ các prefixes lặp lại
   */
  const cleanReasonText = (rawReason: string, itemTypeLabel: string): string => {
    if (!rawReason) return '';
    let clean = rawReason.trim();

    // Danh sách các tiền tố cần bóc tách
    const prefixes = [
      itemTypeLabel,
      itemTypeLabel.replace(/^Giải trình\s+/i, ''),
      itemTypeLabel.replace(/^Đăng ký\s+/i, ''),
      'Lý do:', 'Kế hoạch:', 'Nội dung:',
    ].filter(Boolean);

    // Sắp xếp theo chiều dài giảm dần để ưu tiên bóc chuỗi dài nhất trước
    prefixes.sort((a, b) => b.length - a.length);

    for (const p of prefixes) {
      if (p && clean.toLowerCase().startsWith(p.toLowerCase())) {
        // Tách bỏ prefix
        const temp = clean.substring(p.length).trim();
        // Xóa thêm các ký tự ngăn cách nếu có (: - )
        const afterStrip = temp.replace(/^[\:\-\s\.]+/i, '').trim();

        // Chỉ cập nhật nếu sau khi bóc vẫn còn nội dung (tránh bóc sạch trơn)
        if (afterStrip) {
          clean = afterStrip;
        }
        break;
      }
    }

    return clean;
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
    const isAdminUser =
      currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    const isHRUser =
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
      if (isAdminUser) {
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
    if (isAdminUser || isHRUser || hasApprovalPermission) {
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
   * Kiểm tra xem có thể xóa đơn không (Giải trình, Đăng ký, Online)
   * - Người tạo đơn mới có quyền xóa khi đơn ở trạng thái PENDING/DRAFT
   * - Admin/HR có quyền xóa đơn bất kỳ khi chưa được xử lý xong
   */
  const canDeleteRequest = (req: any): boolean => {
    if (!currentEmployee) return false;

    const requesterId = req.employee_id ||
      (typeof req.employee === 'object' ? req.employee.id : req.employee);

    const isOwner = requesterId === currentEmployee.id;
    const isAdminOrHR = isAdmin || isHR;

    // Chỉ người tạo đơn hoặc Admin/HR mới thấy nút xóa
    if (!isOwner && !isAdminOrHR) return false;

    // Chỉ xóa được khi DRAFT hoặc PENDING
    if (!['DRAFT', 'PENDING'].includes(req.status)) return false;

    // Không xóa được khi quản lý trực tiếp đã duyệt (trừ khi là Admin)
    if (req.direct_manager_approved && !isAdmin) return false;

    // Không xóa được khi có situation đã xử lý (chỉ áp dụng cho đơn giải trình)
    const situationDetails = req.situation_details;
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
    const isAdminUser =
      currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    const isHRUser =
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
        if (isAdminUser) return true;
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
      if (isAdminUser || isHRUser || hasApprovalPermission) {
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
    if (isHRUser && request.direct_manager_approved) {
      return !request.hr_approved;
    }

    return false;
  };

  // --- Triggers for Modals ---
  const openApproveModal = (item: any) => {
    setTargetItem(item);
    setActionType('APPROVE');
    setApprovalNote('Đã duyệt');
    setActionModalOpen(true);
  };

  const openRejectModal = (item: any) => {
    setTargetItem(item);
    setActionType('REJECT');
    setApprovalNote('Không hợp lệ');
    setActionModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setTargetItem(item);
    setActionType('DELETE');
    setDeleteModalOpen(true);
  };

  // --- Confirm Actions (API Calls) ---
  const confirmAction = async () => {
    if (!targetItem) return;

    try {
      setIsProcessing(true);
      const isRegistration = targetItem._itemType === 'REGISTRATION';
      const isOnlineWork = targetItem._itemType === 'ONLINE_WORK';
      const isExplanation = targetItem._itemType === 'EXPLANATION' || (!isRegistration && !isOnlineWork);
      const isApprove = actionType === 'APPROVE';

      const note = approvalNote || (isApprove ? 'Đã duyệt' : 'Đã từ chối');

      if (isApprove) {
        if (isRegistration) await approvalService.approveRegistrationRequest(targetItem.id, note);
        else if (isOnlineWork) await approvalService.approveOnlineWorkRequest(targetItem.id, note);
        else await approvalService.approveAttendanceExplanation(targetItem.id, note);
      } else {
        if (isRegistration) await approvalService.rejectRegistrationRequest(targetItem.id, note);
        else if (isOnlineWork) await approvalService.rejectOnlineWorkRequest(targetItem.id, note);
        else await approvalService.rejectAttendanceExplanation(targetItem.id, note);
      }

      setActionModalOpen(false);
      setTargetItem(null);
      setApprovalNote('');
      fetchRequests(); // Refresh data
    } catch (error: any) {
      console.error(`Error ${actionType}:`, error);
      alert(`Lỗi: ${error.response?.data?.detail || 'Thao tác thất bại'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!targetItem) return;

    try {
      setIsProcessing(true);
      const isRegistration = targetItem._itemType === 'REGISTRATION';
      const isOnlineWork = targetItem._itemType === 'ONLINE_WORK';

      if (isOnlineWork) {
        await approvalService.deleteOnlineWorkRequest(targetItem.id);
      } else if (isRegistration) {
        await approvalService.deleteRegistrationRequest(targetItem.id);
      } else {
        await attendanceService.deleteAttendanceExplanation(targetItem.id);
      }

      setDeleteModalOpen(false);
      setTargetItem(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(`Lỗi: ${error.response?.data?.detail || 'Xóa thất bại'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOnlineWorkDetails = (request: any) => {
    setSelectedOnlineWorkRequest(request);
    setSelectedExplanation(null);
    setShowDetailModal(true);
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
    const nameFilter = filterName.toLowerCase();
    const deptFilter = filterDepartment.toLowerCase();

    if (filterName && !name.includes(nameFilter) && !(req.employee_code || '').toLowerCase().includes(nameFilter)) return false;
    if (filterDepartment && !dept.includes(deptFilter)) return false;
    return true;
  };


  const getAllCurrentRequests = () => {
    // 1. Get base data based on active tab
    const explanations = activeTab === 'pending' ? attendanceExplanations : activeTab === 'approved' ? approvedExplanations : rejectedExplanations;
    const registrations = activeTab === 'pending' ? pendingRegistrations : activeTab === 'approved' ? approvedRegistrations : rejectedRegistrations;
    const leaveRequests = activeTab === 'pending' ? pendingLeaveRequests : activeTab === 'approved' ? approvedLeaveRequests : rejectedLeaveRequests;
    const overtimeRequests = activeTab === 'pending' ? pendingOvertimeRequests : activeTab === 'approved' ? approvedOvertimeRequests : rejectedOvertimeRequests;
    const onlineWorks = onlineWorkRequests; // Online work seems to be shared or handled differently in fetch

    // 2. Map and filter
    const mappedExplanations = explanations
      .filter(matchesTextFilters)
      .map(e => ({ ...e, _itemType: 'EXPLANATION' }));

    const mappedRegistrations = registrations
      .filter(matchesTextFilters)
      .map(r => ({ ...r, _itemType: 'REGISTRATION' }));

    const mappedOnlineWorks = onlineWorks
      .filter(matchesTextFilters)
      .map(o => ({ ...o, _itemType: 'ONLINE_WORK' }));

    const mappedLeaves = leaveRequests
      .filter(matchesTextFilters)
      .map(l => ({ ...l, _itemType: 'LEAVE' }));

    const mappedOvertimes = overtimeRequests
      .filter(matchesTextFilters)
      .map(ov => ({ ...ov, _itemType: 'OVERTIME' }));

    // 3. Combine and filter by type (search bar filters)
    let all = [
      ...mappedExplanations,
      ...mappedRegistrations,
      ...mappedOnlineWorks,
      ...mappedLeaves,
      ...mappedOvertimes
    ];

    if (filterTypes.length > 0) {
      all = all.filter(item => {
        if (filterTypes.includes('EXPLANATION') && item._itemType === 'EXPLANATION') return true;
        if (filterTypes.includes('REGISTRATION') && item._itemType === 'REGISTRATION') return true;
        if (filterTypes.includes('ONLINE_WORK') && item._itemType === 'ONLINE_WORK') return true;
        if (filterTypes.includes('LEAVE') && item._itemType === 'LEAVE') return true;
        if (filterTypes.includes('OVERTIME') && item._itemType === 'OVERTIME') return true;
        return false;
      });
    }

    // 4. Sort by date descending
    return all.sort((a, b) => {
      const dateA = new Date(a.created_at || a.attendance_date || a.event_date || a.work_date || a.start_date).getTime();
      const dateB = new Date(b.created_at || b.attendance_date || b.event_date || b.work_date || b.start_date).getTime();
      return dateB - dateA;
    });
  };


  const hasActiveFilters = filterTypes.length > 0 || filterName !== '' || filterDepartment !== '';

  const clearAllFilters = () => {
    setFilterTypes([]);
    setFilterName('');
    setFilterDepartment('');
  };

  const getTotalFilteredCount = () => {
    return getAllCurrentRequests().length;
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
              Có {getTotalFilteredCount()} yêu cầu
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
              { value: 'LEAVE', label: 'Nghỉ phép tháng' },
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
                ) : getAllCurrentRequests().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400 mb-4"
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
                      const isLeave = item._itemType === 'LEAVE';
                      const isOvertime = item._itemType === 'OVERTIME';

                      const itemKey = `${item._itemType}-${item.id}`;

                      // Xác định icon và màu sắc dựa trên loại đơn
                      const getIcon = () => {
                        if (isLeave) return {
                          color: 'text-blue-600',
                          bg: 'bg-blue-100',
                          path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' // Clock icon
                        };
                        if (isOvertime) return {
                          color: 'text-purple-600',
                          bg: 'bg-purple-100',
                          path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        };
                        if (isOnlineWork) return {
                          color: 'text-teal-600',
                          bg: 'bg-teal-100',
                          path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        };
                        if (isRegistration) return {
                          color: 'text-indigo-600',
                          bg: 'bg-indigo-100',
                          path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        };
                        return {
                          color: 'text-yellow-600',
                          bg: 'bg-yellow-100',
                          path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                        };
                      };

                      const iconInfo = getIcon();

                      return (
                        <tr key={itemKey} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-10 w-10 ${iconInfo.bg} rounded-full flex items-center justify-center`}>
                                <svg className={`h-5 w-5 ${iconInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconInfo.path} />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {getRequestTypeLabel(item)}
                                </div>
                                {(() => {
                                  const requestName = getRequestTypeLabel(item);
                                  const cleanedReason = cleanReasonText(item.reason || item.work_plan || '', requestName);

                                  return cleanedReason ? (
                                    <div className="text-sm text-gray-600 truncate max-w-xs mt-0.5" title={cleanedReason}>
                                      <span className="font-semibold text-gray-400">Lý do: </span>
                                      {cleanedReason}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {item.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.employee_code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {isLeave && item.start_date && item.end_date && item.start_date !== item.end_date
                              ? `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
                              : formatDate(item.attendance_date || item.registration_date || item.work_date || item.start_date || item.event_date || item.overtime_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status, item._itemType as any)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {activeTab === 'pending' ? (
                                ((isOnlineWork || isRegistration) ? canApproveRequest(item) : canApproveExplanation(item)) ? (
                                  <>
                                    <button
                                      onClick={() => openApproveModal(item)}
                                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => openRejectModal(item)}
                                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs italic bg-gray-50 px-2 py-1 rounded">
                                    {item.employee_id === currentEmployee?.id
                                      ? 'Tự tạo đơn'
                                      : (!item.direct_manager_approved && !item.direct_manager_rejected)
                                        ? (item.employee_is_hr ? 'Chờ QLTT duyệt (Final)' : 'Chờ QLTT xử lý')
                                        : item.direct_manager_approved === true
                                          ? 'Chờ HR xử lý'
                                          : 'Không có quyền'}
                                  </span>
                                )
                              ) : (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeTab === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {activeTab === 'approved' ? 'Xong' : 'Bị từ chối'}
                                </span>
                              )}

                              <button
                                onClick={() => isOnlineWork ? handleViewOnlineWorkDetails(item) : handleViewDetails(item)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                              >
                                Chi tiết
                              </button>

                              {/* Xóa đơn (PENDING/DRAFT) */}
                              {canDeleteRequest(item) && (
                                <button
                                  onClick={() => openDeleteModal(item)}
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                  title="Xóa đơn"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}


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
                    Chi tiết {getRequestTypeLabel(selectedExplanation || selectedOnlineWorkRequest)}
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
                {/* 1. Kế hoạch / Lý do (Ẩn nếu là Nghỉ phép tháng theo yêu cầu) */}
                {!(selectedExplanation?._itemType === 'LEAVE') && (
                  <div className="mb-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                        {selectedExplanation
                          ? `Lý do / Nội dung ${getRequestTypeLabel(selectedExplanation)}`
                          : 'Kế hoạch công việc'}
                      </h4>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedExplanation
                          ? cleanReasonText(selectedExplanation.reason, getRequestTypeLabel(selectedExplanation))
                          : (selectedOnlineWorkRequest.work_plan || 'N/A')}
                      </p>
                    </div>
                  </div>
                )}

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
                        <span className="block text-sm font-semibold text-gray-800 truncate" title={(selectedExplanation
                          ? (selectedExplanation.employee_manager_name || selectedExplanation.employee_department_manager_name)
                          : (selectedOnlineWorkRequest.employee_manager_name || selectedOnlineWorkRequest.employee_department_manager_name)) || 'N/A'}>
                          {(selectedExplanation
                            ? (selectedExplanation.employee_manager_name || selectedExplanation.employee_department_manager_name)
                            : (selectedOnlineWorkRequest.employee_manager_name || selectedOnlineWorkRequest.employee_department_manager_name)) || 'N/A'}
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
                              {selectedExplanation._itemType === 'REGISTRATION' ? 'Ngày đăng ký:' :
                                selectedExplanation._itemType === 'LEAVE' ? 'Thời gian nghỉ:' :
                                  'Ngày vi phạm:'}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {selectedExplanation._itemType === 'LEAVE'
                                ? (selectedExplanation.start_date === selectedExplanation.end_date
                                  ? formatDate(selectedExplanation.start_date)
                                  : `${formatDate(selectedExplanation.start_date)} - ${formatDate(selectedExplanation.end_date)}`)
                                : formatDate(selectedExplanation.attendance_date || selectedExplanation.event_date || selectedExplanation.start_date)}
                            </span>
                          </div>
                          {selectedExplanation._itemType === 'REGISTRATION' && (selectedExplanation.start_time || selectedExplanation.end_time) && (
                            <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2.5 mt-2.5">
                              <span className="text-sm font-medium text-gray-500">Khung giờ:</span>
                              <div className="text-right flex flex-col items-end">
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {selectedExplanation.start_time?.substring(0, 5) || '??:??'} - {selectedExplanation.end_time?.substring(0, 5) || '??:??'}
                                </span>
                                {(() => {
                                  if (selectedExplanation.start_time && selectedExplanation.end_time) {
                                    const [h1, m1] = selectedExplanation.start_time.split(':').map(Number);
                                    const [h2, m2] = selectedExplanation.end_time.split(':').map(Number);
                                    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                    if (diff < 0) diff += 24 * 60; // Handle cross-midnight
                                    const hours = (diff / 60).toFixed(1);
                                    return <span className="text-[11px] text-gray-400 mt-1 font-medium italic">Tổng thời lượng: {hours}h</span>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                          {selectedExplanation._itemType !== 'REGISTRATION' && (
                            <>
                              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2.5 mt-2.5">
                                <span className="text-sm font-medium text-gray-500">Trạng thái gốc:</span>
                                <span className="text-sm font-medium text-gray-600 bg-gray-100/80 px-2.5 py-0.5 rounded text-right flex items-center">
                                  {selectedExplanation.original_status_display || getOriginalStatusText(selectedExplanation.original_status)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2.5">
                                <span className="text-sm font-medium text-gray-500">Trạng thái mong muốn:</span>
                                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-right flex items-center">
                                  {selectedExplanation.expected_status_display || getExpectedStatusText(selectedExplanation.expected_status)}
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
                <div className="mr-auto">
                  {((selectedExplanation && canDeleteRequest(selectedExplanation)) || (selectedOnlineWorkRequest && canDeleteRequest(selectedOnlineWorkRequest))) && (
                    <button
                      onClick={() => {
                        openDeleteModal(selectedExplanation || selectedOnlineWorkRequest);
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Xoá đơn
                    </button>
                  )}
                </div>
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
                              openApproveModal(selectedExplanation);
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              openRejectModal(selectedExplanation);
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
                              openApproveModal(selectedOnlineWorkRequest);
                              setShowDetailModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              openRejectModal(selectedOnlineWorkRequest);
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

      {/* 1. Modal Duyệt/Từ chối với Ghi chú */}
      {actionModalOpen && targetItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-all">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center gap-3 border-b ${actionType === 'APPROVE' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`p-2 rounded-full ${actionType === 'APPROVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {actionType === 'APPROVE' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <h3 className={`text-lg font-bold ${actionType === 'APPROVE' ? 'text-green-800' : 'text-red-800'}`}>
                {actionType === 'APPROVE' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Đối tượng xử lý:</p>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 border border-gray-200 shadow-sm">
                    {targetItem.employee_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{targetItem.employee_name}</p>
                    <p className="text-xs text-gray-500 font-medium">{getRequestTypeLabel(targetItem)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Ghi chú xử lý:</label>
                <textarea
                  autoFocus
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={actionType === 'APPROVE' ? 'Nội dung phản hồi (Tùy chọn)...' : 'Lý do từ chối (Bắt buộc)...'}
                  className={`w-full min-h-[100px] p-3 border rounded-xl text-sm focus:ring-2 outline-none transition-all ${actionType === 'APPROVE' ? 'border-gray-200 focus:ring-green-200 focus:border-green-500' : 'border-red-200 focus:ring-red-100 focus:border-red-400'}`}
                />
                {actionType === 'REJECT' && !approvalNote.trim() && (
                  <p className="text-[11px] text-red-500 font-medium">Vui lòng nhập lý do từ chối đơn này.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setActionModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isProcessing || (actionType === 'REJECT' && !approvalNote.trim())}
                onClick={confirmAction}
                className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-opacity-20 ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} disabled:bg-gray-400 disabled:shadow-none`}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : actionType === 'APPROVE' ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Xác nhận Xóa */}
      {deleteModalOpen && targetItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa đơn?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {targetItem.employee_id === currentEmployee?.id ? (
                  <>
                    Bạn có chắc chắn muốn xóa đơn <span className="font-bold text-gray-800">{getRequestTypeLabel(targetItem)}</span> của mình?
                  </>
                ) : (
                  <>
                    Bạn đang chuẩn bị xóa đơn <span className="font-bold text-gray-800">{getRequestTypeLabel(targetItem)}</span> của <br />
                    <span className="font-bold text-gray-800">{targetItem.employee_name}</span>.
                  </>
                )}
                <br />
                Hành động này <span className="text-red-600 font-bold underline">không thể hoàn tác</span>.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
              >
                Hủy
              </button>
              <button
                disabled={isProcessing}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:bg-gray-400 disabled:shadow-none"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
