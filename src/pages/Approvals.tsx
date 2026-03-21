import React, { useState, useEffect, useRef } from 'react';
import { approvalService } from '../services/approval.service';
import { attendanceService } from '../services/attendance.service';
import { workFinalizationApprovalService } from '../services/workFinalizationApproval.service';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';


const Approvals: React.FC = () => {
  const { user } = useAuth();
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
  const [workFinalizationApprovals, setWorkFinalizationApprovals] = useState<any[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterExplanationSubTypes, setFilterExplanationSubTypes] = useState<string[]>([]);
  const [filterRegistrationSubTypes, setFilterRegistrationSubTypes] = useState<string[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterOnlyMine, setFilterOnlyMine] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [selectedOnlineWorkRequest, setSelectedOnlineWorkRequest] =
    useState<any>(null);
  const [selectedWfApproval, setSelectedWfApproval] = useState<any>(null);
  const [wfEmployees, setWfEmployees] = useState<any[]>([]);
  const [showWfDetailModal, setShowWfDetailModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [employeeFreqStats, setEmployeeFreqStats] = useState<any>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [calendarModalEmployee, setCalendarModalEmployee] = useState<{ id: number; name: string; month: number; year: number } | null>(null);

  // Debug log cho Quota và dữ liệu được chọn
  useEffect(() => {
    if (selectedExplanation) {
      console.log('🔵 [DEBUG] Đơn giải trình được chọn:', {
        id: selectedExplanation.id,
        type: selectedExplanation.explanation_type,
        attendance_date: selectedExplanation.attendance_date,
        quota_used: selectedExplanation.quota_used,
        quota_remaining: selectedExplanation.quota_remaining,
        full_data: selectedExplanation
      });
    }
  }, [selectedExplanation]);

  useEffect(() => {
    if (workFinalizationApprovals.length > 0) {
      console.log('💎 [DATA UPDATE] Work Finalization list updated:', workFinalizationApprovals);
    }
  }, [workFinalizationApprovals]);

  useEffect(() => {
    if (selectedOnlineWorkRequest) {
      console.log('🟢 [DEBUG] Đơn làm việc online được chọn:', selectedOnlineWorkRequest);
    }
  }, [selectedOnlineWorkRequest]);
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
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // States cho Duyệt hàng loạt (Bulk Action)
  const [bulkActionResult, setBulkActionResult] = useState<{ success: number; error: number; groupName: string } | null>(null);
  const [bulkConfirmModal, setBulkConfirmModal] = useState<{ items: any[]; name: string } | null>(null);

  const isAdmin = (user as any)?.is_superuser ||
    (user as any)?.is_staff ||
    user?.role?.toUpperCase() === 'ADMIN' ||
    currentEmployee?.user?.is_staff ||
    currentEmployee?.user?.is_superuser;

  // Chỉ dùng cờ is_hr, KHÔNG check department_code hay position title
  const isHR = currentEmployee?.is_hr === true || user?.role?.toUpperCase() === 'HR';

  // is_manager: BE now returns computed field (position.is_management or is dept manager)
  const isManagement = currentEmployee?.is_manager === true ||
    currentEmployee?.position?.is_management === true ||
    false;

  // Là manager của phòng ban (department.manager_id === currentEmployee.id)
  const isDepartmentManager = currentEmployee?.department?.manager_id === currentEmployee?.id;

  const currentItem = selectedExplanation || selectedOnlineWorkRequest;
  const isViewingExp = currentItem?._itemType === 'EXPLANATION' || (!currentItem?._itemType && currentItem?.explanation_type && currentItem?.explanation_type !== 'LEAVE');
  const isViewingOnl = currentItem?._itemType === 'ONLINE_WORK';
  const isViewingReg = currentItem?._itemType === 'REGISTRATION' || currentItem?._itemType === 'OVERTIME';
  const isViewingLea = currentItem?._itemType === 'LEAVE' || currentItem?.explanation_type === 'LEAVE';

  const statsCount = (isViewingExp ? 1 : 0) + (isViewingOnl ? 1 : 0) + (isViewingReg ? 1 : 0) + (isViewingLea ? 1 : 0);

  const allRequestsForDepList = [
    ...attendanceExplanations || [], ...approvedExplanations || [], ...rejectedExplanations || [],
    ...pendingRegistrations || [], ...approvedRegistrations || [], ...rejectedRegistrations || [],
    ...pendingLeaveRequests || [], ...approvedLeaveRequests || [], ...rejectedLeaveRequests || [],
    ...pendingOvertimeRequests || [], ...approvedOvertimeRequests || [], ...rejectedOvertimeRequests || [],
    ...onlineWorkRequests || []
  ];

  const uniqueDepts = Array.from(new Set(
    allRequestsForDepList.map(r => r.employee_department || r.department_name).filter(Boolean)
  )).sort();

  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [showRefreshToast, setShowRefreshToast] = useState(false);

  // Skeleton component for better UX
  const SkeletonItem = () => (
    <div className="animate-pulse bg-white border border-slate-100 rounded-[32px] p-6 mb-4 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-100 rounded w-1/6"></div>
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-50 rounded-2xl border border-slate-100/50"></div>
        ))}
      </div>
    </div>
  );

  const deptOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...uniqueDepts.map(dept => ({ value: dept as string, label: dept as string }))
  ];




  // Move fetch helpers here (above useEffect)
  const fetchCurrentEmployee = async () => {
    try {
      const employee = await approvalService.getCurrentEmployee();
      setCurrentEmployee(employee);
      return employee;
    } catch (error) {
      console.error('Error fetching current employee:', error);
      return null;
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const result = await (approvalService as any).getAllPendingRequests({ day: 0, month: filterMonth, year: filterYear });

      // Chỉ set list data nếu đang ở tab pending
      if (activeTab === 'pending') {
        const allExplanations = result.attendance_explanations;
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
      console.error('× [APPROVALS] Error fetching pending requests:', error);
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      const result = await (approvalService as any).getAllApprovedRequests({ day: 0, month: filterMonth, year: filterYear });

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
      const result = await (approvalService as any).getAllRejectedRequests({ day: 0, month: filterMonth, year: filterYear });

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

  const fetchWorkFinalizationData = async (empContext?: any, isAdminArg?: boolean, isHRArg?: boolean) => {
    try {
      const activeAdmin = isAdminArg !== undefined ? isAdminArg : isAdmin;
      const activeHR = isHRArg !== undefined ? isHRArg : isHR;
      const activeEmp = empContext || currentEmployee;

      const fetchMonth = async (m: number, y: number) => {
        try {
          const res = await workFinalizationApprovalService.list({ year: y, month: m });
          return res.results || [];
        } catch (err: any) {
          return [];
        }
      };

      const m0 = filterMonth;
      const y0 = filterYear;
      const res0 = await fetchMonth(m0, y0);
      const combined = res0;

      const uniqueMap = new Map();
      combined.forEach(item => uniqueMap.set(item.id, item));

      const pendingWfItems = Array.from(uniqueMap.values())
        .filter(item => item.status === 'PENDING' || item.status === 'APPROVED')
        .map(item => ({
          ...item,
          _itemType: 'WORK_FINALIZATION',
          employee_name: `Phòng ${item.department_name || item.department_code}`,
          employee_code: item.department_code,
          reason: item.note || `Chốt công tháng ${item.month}/${item.year}`
        }));

      const userDeptCode = activeEmp?.department?.code ||
        activeEmp?.hrm_user?.department_code ||
        activeEmp?.employee_profile?.department_code ||
        (user as any)?.department_code ||
        (user as any)?.employee_profile?.department_code;

      let filteredWfItems = pendingWfItems;
      if (!activeAdmin) {
        if (!userDeptCode) {
          filteredWfItems = [];
        } else {
          filteredWfItems = pendingWfItems.filter(item => {
            const itemDept = item.department_code?.toString().trim().toUpperCase();
            const userDept = userDeptCode.toString().trim().toUpperCase();
            return itemDept === userDept;
          });
        }
      }

      setWorkFinalizationApprovals(filteredWfItems);
    } catch (wfError) {
      console.error('× [APPROVALS] Error fetching work finalization data:', wfError);
    }
  };

  const fetchAllData = async (force = false) => {
    const nowValue = Date.now();

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      const prevFetchTime = lastFetchTimeRef.current;
      lastFetchTimeRef.current = nowValue;
      setLoading(true);

      const emp = await fetchCurrentEmployee();
      const currentIsAdmin = emp?.user?.is_staff || emp?.user?.is_superuser || (user as any)?.is_superuser || (user as any)?.is_staff || user?.role?.toUpperCase() === 'ADMIN';
      const currentIsHR = emp?.is_hr === true || user?.role?.toUpperCase() === 'HR';

      if (force) {
        // Forced refresh: fetch all tabs to update all stats counts
        await Promise.all([
          fetchPendingRequests(),
          fetchApprovedRequests(),
          fetchRejectedRequests(),
          fetchWorkFinalizationData(emp, currentIsAdmin, currentIsHR),
        ]);
      } else {
        // Normal fetch: only fetch active tab to minimize unnecessary API calls
        const tabFetch = activeTab === 'pending'
          ? fetchPendingRequests()
          : activeTab === 'approved'
          ? fetchApprovedRequests()
          : fetchRejectedRequests();
        await Promise.all([
          tabFetch,
          fetchWorkFinalizationData(emp, currentIsAdmin, currentIsHR),
        ]);
      }
      
      setLastRefreshedAt(new Date());
      // Chỉ hiện toast nếu là refresh thủ công/focus sau khi đã có dữ liệu (không hiện lần đầu)
      if (prevFetchTime > 0 && nowValue - prevFetchTime > 1000) { 
          setShowRefreshToast(true);
          setTimeout(() => setShowRefreshToast(false), 3000);
      }
    } catch (error) {
      console.error('❌ [APPROVALS] Error fetching all data:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchRequests = async () => {
    await fetchAllData(true);
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab, filterMonth, filterYear]);

  const EXPLANATION_TYPE_MAP: Record<string, string> = {
    explanation: 'Đơn giải trình',
    registration: 'Đơn đăng ký',
    LATE: 'Đơn giải trình đi muộn',
    EARLY_LEAVE: 'Đơn giải trình về sớm',
    INCOMPLETE_ATTENDANCE: 'Đơn giải trình quên chấm công',
    BUSINESS_TRIP: 'Đơn giải trình đi công tác',
    FIRST_DAY: 'Đơn giải trình ngày đầu đi làm',
    OTHER: 'Đơn giải trình khác',
    OVERTIME: 'Đơn đăng ký tăng ca',
    EXTRA_HOURS: 'Đơn đăng ký làm thêm giờ',
    NIGHT_SHIFT: 'Đơn đăng ký trực tối',
    LIVE: 'Đơn đăng ký Live',
    LEAVE: 'Đơn đăng ký nghỉ phép',
    OFF_DUTY: 'Đơn đăng ký ra trực',
  };

  const getExplanationTypeLabel = (type: string): string => {
    if (!type) return '';
    const upperType = type.toUpperCase();
    return EXPLANATION_TYPE_MAP[upperType] || EXPLANATION_TYPE_MAP[type] || type;
  };

  // Mapping trạng thái chấm công sang tiếng Việt
  const ATTENDANCE_STATUS_MAP: Record<string, string> = {
    PRESENT: 'Có mặt',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm',
    ABSENT: 'Vắng mặt',
    HALF_DAY: 'Nửa ngày',
    INCOMPLETE_ATTENDANCE: 'Quên chấm công',
    OFF: 'Nghỉ',
  };

  const EXPECTED_STATUS_MAP: Record<string, string> = {
    ...ATTENDANCE_STATUS_MAP,
    PRESENT: 'Tính đủ công',
    ABSENT: 'Vắng mặt',
    INCOMPLETE_ATTENDANCE: 'Xác nhận đủ công',
    HALF_DAY: 'Tính nửa ngày công',
  };

  const getOriginalStatusText = (status: string): string =>
    ATTENDANCE_STATUS_MAP[status] || status;

  const getExpectedStatusText = (status: string): string =>
    EXPECTED_STATUS_MAP[status] || status;

  const getRequestTypeLabel = (req: any): string => {
    let label = '';
    if (req._itemType === 'ONLINE_WORK') label = 'làm việc online';
    else if (req.explanation_type === 'LEAVE' || req._itemType === 'LEAVE') label = 'nghỉ phép tháng';
    else if (req._itemType === 'REGISTRATION' || req._itemType === 'OVERTIME') {
      const type = req.registration_type || (req._itemType === 'OVERTIME' ? 'OVERTIME' : '');
      label = getExplanationTypeLabel(type) || 'đơn đăng ký';
    }
    else if (req._itemType === 'WORK_FINALIZATION') label = 'chốt công tháng';
    else {
      label = req.explanation_type ? (getExplanationTypeLabel(req.explanation_level || req.explanation_type)) : 'đơn giải trình';
    }

    if (!label) return 'Đơn';
    // Đảm bảo viết hoa chữ cái đầu cho tiêu đề
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  /**
   * Render badge hiển thị thống kê quota/số lần duyệt của nhân viên trong tháng
   */
  const renderRequestStatsBadge = (item: any) => {
    const isOnline = item._itemType === 'ONLINE_WORK';
    const isLeave = item._itemType === 'LEAVE';
    const isReg = item._itemType === 'REGISTRATION' || item._itemType === 'OVERTIME';

    if (isReg) return null; // Không hiện hạn mức cho đơn đăng ký/tăng ca

    // Thống kê từ backend (đã bọc trong item khi list)
    const qUsed = item.quota_used ?? 0;
    const mExp = item.max_explanation_quota ?? 3;
    const owUsed = item.online_work_used ?? 0;
    const mOnl = item.max_online_quota ?? 2;
    const lUsed = item.leave_used ?? 0;
    const mLea = item.max_leave_quota ?? 1;

    let used = 0;
    let max = 0;
    let label = '';

    if (isOnline) {
      used = owUsed;
      max = mOnl;
      label = 'Online';
    }
    else if (isLeave) {
      used = lUsed;
      max = mLea;
      label = 'Phép';
    }
    else {
      used = qUsed;
      max = mExp;
      label = 'Giải trình';
    }

    const ratio = max > 0 ? used / max : 0;

    // Premium color palette based on ratio
    const colors = ratio >= 1
      ? 'bg-rose-50 text-rose-600 border-rose-100'
      : ratio >= 0.7
        ? 'bg-amber-50 text-amber-600 border-amber-100'
        : 'bg-slate-50 text-slate-500 border-slate-100';

    return (
      <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-bold tracking-tighter uppercase transition-colors ${colors}`}>
        {label} {used}/{max}
      </div>
    );
  };

  /**
   * Làm sạch nội dung lý do: loại bỏ các prefixes lặp lại
   */
  const cleanReasonText = (rawReason: string, itemTypeLabel: string): string => {
    if (!rawReason) return '';
    let clean = rawReason.trim();

    // 0. Bóc các tiền tố trong ngoặc vuông [] (ví dụ: [Đi muộn: 5 phút])
    if (clean.startsWith('[')) {
      const closingBracketIndex = clean.indexOf(']');
      if (closingBracketIndex !== -1) {
        clean = clean.substring(closingBracketIndex + 1).replace(/^[\:\-\s]+/, '').trim();
      }
    }

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
    // Chỉ dùng cờ is_hr
    const isHRUser = currentEmployee.is_hr === true;

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

      if (directManagerAlreadyApproved || (isCreatorSeniorManager && !explanation.employee_manager_id)) {
        return true;
      }

      // Nếu chưa thỏa mãn các điều kiện trên, HR chưa được duyệt
      return false;
    }
    return false;
  };

  /**
   * Kiểm tra xem có thể xóa đơn không (Giải trình, Đăng ký, Online)
   * - Người tạo đơn mới có quyền xóa khi đơn ở trạng thái PENDING/DRAFT
   * - Admin/HR có quyền xóa đơn bất kỳ khi chưa được xử lý xong
   */
  const canDeleteRequest = (req: any): boolean => {
    if (!currentEmployee || !req) return false;

    const requesterId = req.employee_id ||
      (typeof req.employee === 'object' ? req.employee.id : req.employee);
    const isOwner = requesterId === currentEmployee.id;

    // QUY TẮC MỚI: Admin, HR và Quản lý chỉ được phép xóa ở tab "Đã duyệt" để xử lý các trường hợp duyệt nhầm
    if (activeTab === 'approved' && (isAdmin || isHR || isManagement)) {
      return true;
    }

    // Đối với người tạo đơn (Owner): Chỉ được xóa ở tab "Chờ duyệt" (hoặc đơn chưa được duyệt)
    if (isOwner) {
      // Nếu đã có cấp nào duyệt hoặc trạng thái là APPROVED thì không được xóa (hủy) nữa 
      if (req.direct_manager_approved || req.hr_approved || req.status === 'APPROVED') {
        return false;
      }
      // Chỉ xóa được khi đơn còn ở trạng thái sơ thảo hoặc đang chờ xử lý
      return ['DRAFT', 'PENDING'].includes(req.status);
    }

    return false;
  };

  // Generic function to check if current user can approve any request type
  const canApproveRequest = (request: any): boolean => {
    if (!currentEmployee || !request) return false;

    const isOnlineWork = request._itemType === 'ONLINE_WORK';
    const isRegistration = request._itemType === 'REGISTRATION' || request._itemType === 'OVERTIME';
    const isWorkFinalization = request._itemType === 'WORK_FINALIZATION';
    const isExplanation = !isOnlineWork && !isRegistration && !isWorkFinalization;

    if (isWorkFinalization) {
      // Admin/HR hoặc Quản lý trực tiếp của phòng ban đó
      const isAdminUser =
        currentEmployee.user?.is_staff ||
        currentEmployee.user?.is_superuser ||
        (user as any)?.is_superuser ||
        (user as any)?.is_staff;

      // Chỉ dùng cờ is_hr
      const isHRUser = currentEmployee.is_hr === true;

      const myDeptCode = currentEmployee.department?.code ||
        currentEmployee.hrm_user?.department_code ||
        currentEmployee.employee_profile?.department_code;

      const isMyDept = request.department_code === myDeptCode;

      return isAdminUser || isMyDept;
    }

    // For explanations and leaves, use the dedicated logic
    if (isExplanation) {
      return canApproveExplanation(request);
    }

    // ==================== TWO-STEP WORKFLOW (ONLINE WORK / REGISTRATION) ====================
    // Creator cannot approve their own request
    if (request.employee_id === currentEmployee.id) {
      return false;
    }

    // Check user roles
    const isAdminUser = currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    // Chỉ dùng cờ is_hr
    const isHRUser = currentEmployee.is_hr === true;
    const isDirectManager = request.employee_manager_id === currentEmployee.id;
    const hasApprovalPermission = currentEmployee.permissions?.can_approve_attendance || false;

    // Nếu đã bị từ chối -> không thể duyệt
    if (request.direct_manager_rejected || request.hr_rejected || request.status === 'REJECTED') {
      return false;
    }

    const employeeIsHR = request.employee_is_hr || false;

    // Nếu người làm đơn là HR: chỉ 1 bước (QLTT duyệt là xong)
    if (employeeIsHR) {
      if (isAdminUser) return true;
      if (isDirectManager) return !request.direct_manager_approved;
      return false;
    }

    // Người làm đơn KHÔNG phải HR: bắt buộc 2 bước
    // Bước 1: QLTT duyệt trước
    if (isDirectManager) {
      return !request.direct_manager_approved;
    }

    // Bước 2: HR/Admin chỉ được duyệt SAU KHI QLTT đã duyệt
    if (isAdminUser || isHRUser || hasApprovalPermission) {
      if (request.direct_manager_approved === true || (request.employee_is_senior_manager && !request.employee_manager_id)) {
        return !request.hr_approved;
      }
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
        if (targetItem._itemType === 'WORK_FINALIZATION') {
          await workFinalizationApprovalService.approve(targetItem.id, { note });
        } else if (isRegistration || targetItem._itemType === 'OVERTIME') {
          await approvalService.approveRegistrationRequest(targetItem.id, note);
        } else if (isOnlineWork) {
          await approvalService.approveOnlineWorkRequest(targetItem.id, note);
        } else if (targetItem._itemType === 'LEAVE') {
          await approvalService.approveMonthlyLeaveRequest(targetItem.id, note);
        } else {
          await approvalService.approveAttendanceExplanation(targetItem.id, note);
        }
      } else {
        if (targetItem._itemType === 'WORK_FINALIZATION') {
          await workFinalizationApprovalService.reject(targetItem.id, { note });
        } else if (isRegistration || targetItem._itemType === 'OVERTIME') {
          await approvalService.rejectRegistrationRequest(targetItem.id, note);
        } else if (isOnlineWork) {
          await approvalService.rejectOnlineWorkRequest(targetItem.id, note);
        } else if (targetItem._itemType === 'LEAVE') {
          await approvalService.rejectMonthlyLeaveRequest(targetItem.id, note);
        } else {
          await approvalService.rejectAttendanceExplanation(targetItem.id, note);
        }
      }

      setActionModalOpen(false);
      setTargetItem(null);
      setApprovalNote('');
      fetchAllData(true); // Forced refresh to update all stats counts after action
    } catch (error: any) {
      console.error(`Error ${actionType}:`, error);
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Thao tác thất bại';
      setErrorMessage(msg);
      setErrorModalOpen(true);
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
      } else if (isRegistration || targetItem._itemType === 'OVERTIME') {
        await approvalService.deleteRegistrationRequest(targetItem.id);
      } else if (targetItem._itemType === 'LEAVE') {
        await attendanceService.deleteMonthlyLeaveRequest(targetItem.id);
      } else {
        await attendanceService.deleteAttendanceExplanation(targetItem.id);
      }

      setDeleteModalOpen(false);
      setTargetItem(null);
      fetchAllData(true);
    } catch (error: any) {
      console.error('Error deleting:', error);
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Xóa thất bại';
      setErrorMessage(msg);
      setErrorModalOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOnlineWorkDetails = async (request: any) => {
    console.log('📂 [VIEW] Mở chi tiết đơn làm việc online');
    setSelectedOnlineWorkRequest(request);
    setSelectedExplanation(null);
    setShowDetailModal(true);
    if (request.employee_id || request.employee) {
      const empId = request.employee_id || (typeof request.employee === 'object' ? request.employee.id : request.employee);
      fetchEmployeeStats(empId, request.work_date || request.created_at);
    }
  };

  const handleViewDetails = async (explanation: any) => {
    console.log('📂 [VIEW] Mở chi tiết đơn giải trình');
    setSelectedExplanation(explanation);
    setShowDetailModal(true);
    if (explanation.employee_id) {
      fetchEmployeeStats(explanation.employee_id, explanation.attendance_date || explanation.event_date || explanation.created_at);
    }
  };

  const handleViewWfDetails = async (approval: any) => {
    try {
      console.log('📂 [VIEW] Mở chi tiết chốt công:', approval.department_code);
      setLoading(true);
      const data = await workFinalizationApprovalService.get(approval.id);
      setSelectedWfApproval(data);
      setWfEmployees(data.employees || []);
      setShowWfDetailModal(true);
    } catch (error: any) {
      console.error("Lỗi khi lấy chi tiết chốt công:", error);
      setErrorMessage("Không thể tải danh sách nhân viên phòng ban này. Vui lòng thử lại.");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // --- Bulk Approval Handlers ---
  const handleBulkApproveItems = async (items: any[], groupName: string) => {
    // Chỉ lấy những đơn mà người dùng CÓ QUYỀN DUYỆT
    const approvableItems = items.filter(item => canApproveRequest(item));

    if (approvableItems.length === 0) {
      setErrorMessage(`Không có đơn nào trong ${groupName} đủ điều kiện để bạn duyệt nhanh.`);
      setErrorModalOpen(true);
      return;
    }

    // Mở Modal xác nhận thay vì window.confirm
    setBulkConfirmModal({ items: approvableItems, name: groupName });
  };

  const executeBulkApprove = async () => {
    if (!bulkConfirmModal) return;
    const { items: approvableItems, name: groupName } = bulkConfirmModal;
    setBulkConfirmModal(null);

    try {
      setIsBulkProcessing(true);
      const note = 'Duyệt nhanh hàng loạt';

      const explanations = approvableItems.filter(i => i._itemType === 'EXPLANATION');
      const leaveRequests = approvableItems.filter(i => i._itemType === 'LEAVE');
      const registrations = approvableItems.filter(i => i._itemType === 'REGISTRATION' || i._itemType === 'OVERTIME');
      const onlineWorks = approvableItems.filter(i => i._itemType === 'ONLINE_WORK');

      const promises = [];
      if (explanations.length > 0) promises.push(approvalService.bulkApproveAttendanceExplanations(explanations.map(i => i.id), note));
      if (leaveRequests.length > 0) promises.push(approvalService.bulkApproveMonthlyLeaveRequests(leaveRequests.map(i => i.id), note));
      if (registrations.length > 0) promises.push(approvalService.bulkApproveRegistrationRequests(registrations.map(i => i.id), note));
      if (onlineWorks.length > 0) promises.push(approvalService.bulkApproveOnlineWorkRequests(onlineWorks.map(i => i.id), note));

      const results = await Promise.all(promises);
      let totalSuccess = 0;
      let totalError = 0;

      results.forEach(res => {
        totalSuccess += (res.success_count || 0);
        totalError += (res.error_count || 0);
      });

      // Hiển thị kết quả qua Modal thay vì alert
      setBulkActionResult({ success: totalSuccess, error: totalError, groupName: groupName });
      fetchAllData(true);
    } catch (error: any) {
      console.error(`Error bulk approving ${groupName}:`, error);
      setErrorMessage(`Lỗi khi duyệt hàng loạt ${groupName}: ` + (error.response?.data?.error || error.message));
      setErrorModalOpen(true);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const fetchEmployeeStats = async (employeeId: number, dateStr: string) => {
    try {
      setIsFetchingStats(true);
      const date = new Date(dateStr);
      const stats = await attendanceService.getAttendanceExplanationStats({
        employee_id: employeeId,
        month: date.getUTCMonth() + 1,
        year: date.getUTCFullYear()
      });
      setEmployeeFreqStats(stats);
    } catch (error) {
      console.error('Error fetching employee frequency stats:', error);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const toggleDepartmentGroup = (deptName: string) => {
    setExpandedDepartments(prev =>
      prev.includes(deptName) ? prev.filter(d => d !== deptName) : [...prev, deptName]
    );
  };

  const getStatusBadge = (item: any) => {
    const status = item.status;
    const isApproved = status === 'APPROVED';
    const isRejected = status === 'REJECTED';
    const mgrApproved = item.direct_manager_approved || false;
    const hrApproved = item.hr_approved || (isApproved && !item.employee_is_hr);
    const isRequesterHR = item.employee_is_hr || false;

    // Xác định trạng thái từng bước
    const step1 = { label: 'QLTT', active: mgrApproved || isApproved, rejected: isRejected && !mgrApproved };
    const step2 = { label: 'Nhân sự', active: hrApproved || isApproved, rejected: isRejected && mgrApproved };

    return (
      <div className="flex flex-col gap-2.5 min-w-[140px] group">
        {/* Main Status Badge */}
        <div className="flex items-center">
          {isApproved ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Hoàn tất</span>
            </div>
          ) : isRejected ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Từ chối</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Đang duyệt</span>
            </div>
          )}
        </div>

        {/* Stepper Timeline UI */}
        <div className="flex items-center gap-0">
          {/* Step 1: Manager */}
          <div className="flex flex-col items-center relative">
            <div className={`z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step1.rejected ? 'bg-rose-500 border-rose-100 text-white' :
              step1.active ? 'bg-emerald-500 border-emerald-100 text-white' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
              {step1.rejected ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : step1.active ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <span className="text-[9px] font-bold">1</span>
              )}
            </div>
            <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter ${step1.active ? 'text-emerald-600' : step1.rejected ? 'text-rose-600' : 'text-slate-400'}`}>QLTT</span>
          </div>

          {!isRequesterHR && (
            <>
              {/* Connecting Line */}
              <div className="flex-1 h-[2px] w-8 mx-0 mb-3.5 relative overflow-hidden bg-slate-100 -translate-y-0.5">
                <div className={`absolute inset-0 transition-transform duration-700 ${step1.active ? 'translate-x-0 bg-emerald-400' : '-translate-x-full'}`} />
              </div>

              {/* Step 2: HR */}
              <div className="flex flex-col items-center relative">
                <div className={`z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step2.rejected ? 'bg-rose-500 border-rose-100 text-white' :
                  step2.active ? 'bg-emerald-500 border-emerald-100 text-white' :
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                  {step2.rejected ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : step2.active ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <span className="text-[9px] font-bold">2</span>
                  )}
                </div>
                <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter ${step2.active ? 'text-emerald-600' : step2.rejected ? 'text-rose-600' : 'text-slate-400'}`}>Nhân sự</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
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
      : (explanation.status === 'REJECTED' && (explanation.rejection_level === 'DIRECT_MANAGER' || (!explanation.rejection_level && !explanation.hr_rejected_by_name)))
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



    // Bước 3: Nhân sự HR
    // CHỈ HIỂN THỊ bước HR nếu người làm đơn KHÔNG PHẢI HR
    // Nếu người làm đơn là HR, chỉ cần quản lý trực tiếp duyệt là đủ
    if (!employeeIsHR) {
      const hrStatus = explanation.hr_approved
        ? 'Đã duyệt'
        : (explanation.status === 'REJECTED' && (explanation.hr_rejected_by_name || explanation.rejection_level === 'HR' || managerApproved))
          ? 'Đã từ chối'
          : 'Chưa duyệt';

      const hrApproverName = hrStatus === 'Đã duyệt'
        ? (explanation.hr_approved_by_name || 'Nhân sự HR')
        : hrStatus === 'Đã từ chối'
          ? (explanation.hr_rejected_by_name ||
             explanation.rejected_by_name ||
             explanation.approved_by_name ||
             'Nhân sự HR')
          : 'Nhân sự HR'; // Chưa duyệt

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
        explanation.hr_rejected_by_name ||
        explanation.hr_approved_by_name ||
        explanation.rejected_by_name ||
        explanation.approved_by_name ||
        explanation.direct_manager_approved_by_name ||
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
      : (request.status === 'REJECTED' && (request.rejection_level === 'DIRECT_MANAGER' || request.direct_manager_rejected || (!request.rejection_level && !request.hr_rejected_by_name)))
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


    // Bước 3: Nhân sự HR
    if (!employeeIsHR) {
      const hrStatus = request.hr_approved
        ? 'Đã duyệt'
        : (request.status === 'REJECTED' && (request.hr_rejected_by_name || request.hr_rejected || request.rejection_level === 'HR' || request.direct_manager_approved))
          ? 'Đã từ chối'
          : 'Chưa duyệt';

      const hrApproverName =
        hrStatus === 'Đã duyệt'
          ? (request.hr_approved_by_name || 'Nhân sự HR')
          : hrStatus === 'Đã từ chối'
            ? (request.hr_rejected_by_name ||
               request.rejected_by_name ||
               request.approved_by_name ||
               'Nhân sự HR')
            : 'Nhân sự HR'; // Chưa duyệt

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
        request.rejected_by_name ||
        request.direct_manager_rejected_by_name ||
        request.hr_approved_by_name ||
        request.direct_manager_approved_by_name ||
        request.approved_by_name ||
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
    setFilterTypes(prev => {
      const isRemoving = prev.includes(type);
      const next = isRemoving ? prev.filter(t => t !== type) : [...prev, type];

      // Nếu bỏ chọn EXPLANATION, xóa luôn các sub-types
      if (isRemoving && type === 'EXPLANATION') {
        setFilterExplanationSubTypes([]);
      }
      // Nếu bỏ chọn REGISTRATION, xóa luôn các sub-types
      if (isRemoving && type === 'REGISTRATION') {
        setFilterRegistrationSubTypes([]);
      }
      return next;
    });
  };

  const toggleSubTypeFilter = (subType: string) => {
    setFilterExplanationSubTypes(prev =>
      prev.includes(subType) ? prev.filter(t => t !== subType) : [...prev, subType]
    );
  };

  const toggleRegSubTypeFilter = (subType: string) => {
    setFilterRegistrationSubTypes(prev =>
      prev.includes(subType) ? prev.filter(t => t !== subType) : [...prev, subType]
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
    const onlineWorks = onlineWorkRequests;

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
      .map(ov => ({
        ...ov,
        _itemType: 'REGISTRATION',
        registration_type: 'OVERTIME'
      }));

    // 3. Combine and filter by type (search bar filters)
    let all = [
      ...mappedExplanations,
      ...mappedRegistrations,
      ...mappedOnlineWorks,
      ...mappedLeaves,
      ...mappedOvertimes
    ];

    if (filterOnlyMine) {
      all = all.filter(item => {
        const itemEmpId = item.employee_id || (typeof item.employee === 'object' ? item.employee?.id : item.employee);
        return itemEmpId === currentEmployee?.id;
      });
    }

    // Nếu không phải superadmin hoặc HR thật sự: chỉ hiển thị đơn của nhân viên mà mình là QLTT trực tiếp
    const isTrueSuperAdmin = (user as any)?.is_superuser || currentEmployee?.user?.is_superuser;
    const isTrueHR = currentEmployee?.is_hr === true || user?.role?.toUpperCase() === 'HR';

    console.log('🔍 [APPROVAL FILTER] === User Identity ===', {
      currentEmployeeId: currentEmployee?.id,
      currentEmployeeName: currentEmployee?.full_name || currentEmployee?.user?.username,
      // Quyền hệ thống
      isTrueSuperAdmin,
      isTrueHR,
      isAdmin_computed: isAdmin,
      isHR_computed: isHR,
      // Trường phòng ban / quản lý
      is_manager: currentEmployee?.is_manager,
      management_level: currentEmployee?.management_level,
      position_is_management: currentEmployee?.position?.is_management,
      position_title: currentEmployee?.position?.title,
      department_code: currentEmployee?.department?.code,
      department_name: currentEmployee?.department?.name,
      // Trưởng phòng ban?
      is_department_head: currentEmployee?.is_department_head,
      department_head_id: currentEmployee?.department?.head?.id,
      department_head_name: currentEmployee?.department?.head?.full_name || currentEmployee?.department?.head?.name,
      // Raw currentEmployee để debug đầy đủ
      raw_department: currentEmployee?.department,
    });

    console.log('🔍 [APPROVAL FILTER] === Sample Items ===',
      all.slice(0, 5).map(i => ({
        name: i.employee_name,
        employee_manager_id: i.employee_manager_id,
        employee_manager_name: i.employee_manager_name,
        employee_department: i.employee_department || i.department_name,
      }))
    );

    if (!isTrueSuperAdmin && !isTrueHR && currentEmployee) {
      all = all.filter(item => {
        const itemEmpId = item.employee_id || (typeof item.employee === 'object' ? item.employee?.id : item.employee);
        const isMine = itemEmpId === currentEmployee.id;
        const isMyDirectReport = item.employee_manager_id === currentEmployee.id;
        return isMine || isMyDirectReport;
      });
    }

    if (filterTypes.length > 0) {
      all = all.filter(item => {
        if (filterTypes.includes('EXPLANATION') && item._itemType === 'EXPLANATION') {
          if (filterExplanationSubTypes.length > 0) {
            return filterExplanationSubTypes.includes(item.explanation_type);
          }
          return true;
        }
        if (filterTypes.includes('REGISTRATION') && (item._itemType === 'REGISTRATION' || item._itemType === 'OVERTIME')) {
          if (filterRegistrationSubTypes.length > 0) {
            const type = item.registration_type || item._itemType;
            return filterRegistrationSubTypes.includes(type);
          }
          return true;
        }
        if (filterTypes.includes('ONLINE_WORK') && item._itemType === 'ONLINE_WORK') return true;
        if (filterTypes.includes('LEAVE') && item._itemType === 'LEAVE') return true;
        return false;
      });
    }

    // 4. Sort by date descending
    const sorted = all.sort((a, b) => {
      const dateA = new Date(a.created_at || a.attendance_date || a.event_date || a.work_date || a.start_date).getTime();
      const dateB = new Date(b.created_at || b.attendance_date || b.event_date || b.work_date || b.start_date).getTime();
      return dateB - dateA;
    });

    // 5. Group by Department -> Position -> Employee for Accordion view
    const groups: Record<string, Record<string, Record<string, any[]>>> = {};
    sorted.forEach(item => {
      const itemEmpId = item.employee_id || (typeof item.employee === 'object' ? item.employee?.id : item.employee);
      const isMine = itemEmpId === currentEmployee?.id;

      const dept = isMine ? 'Đơn của Tôi' : (item.employee_department || item.department_name || 'Khác');
      const pos = item.employee_position || item.position_name || 'Nhân viên';
      const empName = item.employee_name || 'Không rõ';

      if (!groups[dept]) groups[dept] = {};
      if (!groups[dept][pos]) groups[dept][pos] = {};
      if (!groups[dept][pos][empName]) groups[dept][pos][empName] = [];
      groups[dept][pos][empName].push(item);
    });

    // Ensure "Đơn của Tôi" is first if it exists
    const finalGroups: Record<string, Record<string, Record<string, any[]>>> = {};
    if (groups['Đơn của Tôi']) {
      finalGroups['Đơn của Tôi'] = groups['Đơn của Tôi'];
    }

    Object.keys(groups).sort().forEach(dept => {
      if (dept !== 'Đơn của Tôi') {
        finalGroups[dept] = groups[dept];
      }
    });

    return finalGroups;
  };

  const getGroupedRequests = () => getAllCurrentRequests();

  const getTotalCount = () => {
    const groups = getGroupedRequests();
    let count = 0;
    Object.values(groups).forEach(posGroup => {
      Object.values(posGroup).forEach(empGroup => {
        Object.values(empGroup).forEach(items => {
          count += items.length;
        });
      });
    });
    return count;
  };

  const getTabCount = (type: string) => {
    let requests: any[] = [];
    if (type === 'EXPLANATION') {
      requests = activeTab === 'pending' ? attendanceExplanations : activeTab === 'approved' ? approvedExplanations : rejectedExplanations;
    } else if (type === 'REGISTRATION') {
      const regs = activeTab === 'pending' ? pendingRegistrations : activeTab === 'approved' ? approvedRegistrations : rejectedRegistrations;
      const ots = activeTab === 'pending' ? pendingOvertimeRequests : activeTab === 'approved' ? approvedOvertimeRequests : rejectedOvertimeRequests;
      requests = [...regs, ...ots];
    } else if (type === 'LEAVE') {
      requests = activeTab === 'pending' ? pendingLeaveRequests : activeTab === 'approved' ? approvedLeaveRequests : rejectedLeaveRequests;
    } else if (type === 'ONLINE_WORK') {
      requests = onlineWorkRequests || [];
    }

    let filtered = requests.filter(matchesTextFilters);
    if (filterOnlyMine) {
      filtered = filtered.filter(item => {
        const itemEmpId = item.employee_id || (typeof item.employee === 'object' ? item.employee?.id : item.employee);
        return itemEmpId === currentEmployee?.id;
      });
    }
    return filtered.length;
  };


  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const hasActiveFilters = filterTypes.length > 0 || filterName !== '' || filterDepartment !== '' || filterOnlyMine || filterMonth !== currentMonth || filterYear !== currentYear;

  const clearAllFilters = () => {
    setFilterTypes([]);
    setFilterExplanationSubTypes([]);
    setFilterRegistrationSubTypes([]);
    setFilterName('');
    setFilterDepartment('');
    setFilterOnlyMine(false);
    setFilterMonth(currentMonth);
    setFilterYear(currentYear);
  };

  const clearTypeFilters = () => {
    setFilterTypes([]);
    setFilterExplanationSubTypes([]);
    setFilterRegistrationSubTypes([]);
  };

  const getTotalFilteredCount = () => getTotalCount();

  return (
    <div className="w-full relative pb-20">
      {/* Cập nhật nhanh - Floating indicator */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 transform ${showRefreshToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-md">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest">Đã cập nhật dữ liệu mới</span>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Phê duyệt</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Cập nhật lần cuối: {lastRefreshedAt.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        
        {/* Floating Refresh FAB for Mobile */}
        <button 
          onClick={() => fetchAllData(true)}
          className={`fixed bottom-6 right-6 sm:hidden z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all active:scale-90 ${loading ? 'animate-pulse' : ''}`}
        >
          <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="mb-4 sm:mb-6">
        <p className="text-base sm:text-lg text-gray-600 mt-1 sm:mt-2">
          Duyệt các đơn xin nghỉ phép, làm thêm giờ, giải trình chấm công và các
          yêu cầu khác.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {getCurrentTitle()}
            </h2>
            <p className="text-gray-500 text-lg">
              Có {getTotalFilteredCount()} yêu cầu
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => fetchAllData(true)}
              className="flex-1 sm:flex-none justify-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center space-x-2 text-base"
            >
              {loading && <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>}
              <span>Làm mới</span>
            </button>
            <button className="flex-1 sm:flex-none justify-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-base">
              Lịch sử duyệt
            </button>
          </div>
        </div>

        {/* Tabs Điều hướng - Responsive Premium */}
        <div className="mb-6 sm:mb-10 px-0.5">
          <div className="bg-slate-100/50 p-1.5 rounded-[24px] grid grid-cols-3 gap-1.5 sm:gap-3 border border-slate-200/60 backdrop-blur-sm shadow-sm">
            <button
              onClick={() => setActiveTab('pending')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-6 py-2.5 sm:py-3.5 rounded-[20px] group ${activeTab === 'pending'
                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-400 group-hover:bg-slate-200'
                }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-[10px] xs:text-[11px] sm:text-sm font-black uppercase tracking-widest leading-none">Chờ duyệt</span>
                <span className={`mt-0.5 text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/50 text-slate-400'
                  }`}>
                  {stats.total_pending} <span className="hidden xs:inline">yêu cầu</span>
                </span>
              </div>
              {activeTab === 'pending' && stats.total_pending > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-6 py-2.5 sm:py-3.5 rounded-[20px] group ${activeTab === 'approved'
                ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-100 ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${activeTab === 'approved' ? 'bg-emerald-500 text-white' : 'bg-slate-200/70 text-slate-400 group-hover:bg-slate-200'
                }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-[10px] xs:text-[11px] sm:text-sm font-black uppercase tracking-widest leading-none">Đã duyệt</span>
                <span className={`mt-0.5 text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200/50 text-slate-400'
                  }`}>
                  {stats.total_approved} <span className="hidden xs:inline">đơn</span>
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-6 py-2.5 sm:py-3.5 rounded-[20px] group ${activeTab === 'rejected'
                ? 'bg-white text-rose-600 shadow-xl shadow-rose-100 ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${activeTab === 'rejected' ? 'bg-rose-500 text-white' : 'bg-slate-200/70 text-slate-400 group-hover:bg-slate-200'
                }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-[10px] xs:text-[11px] sm:text-sm font-black uppercase tracking-widest leading-none">Từ chối</span>
                <span className={`mt-0.5 text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200/50 text-slate-400'
                  }`}>
                  {stats.total_rejected} <span className="hidden xs:inline">đơn</span>
                </span>
              </div>
            </button>
          </div>
        </div>


        {/* Thẻ Thống kê - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mb-8">
          {[
            { type: 'EXPLANATION', label: 'Giải trình', fullLabel: 'Đơn giải trình', count: getTabCount('EXPLANATION'), color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { type: 'REGISTRATION', label: 'Đăng ký', fullLabel: 'Đơn đăng ký', count: getTabCount('REGISTRATION'), color: 'indigo', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            { type: 'LEAVE', label: 'Nghỉ phép tháng', fullLabel: 'Nghỉ phép tháng', count: getTabCount('LEAVE'), color: 'blue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { type: 'ONLINE_WORK', label: 'Làm việc online', fullLabel: 'Làm việc online', count: getTabCount('ONLINE_WORK'), color: 'teal', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => toggleFilter(item.type)}
              className={`relative overflow-hidden p-3.5 sm:p-5 rounded-3xl border group text-left ${filterTypes.includes(item.type)
                ? `bg-white border-${item.color}-300 shadow-xl shadow-${item.color}-100 ring-2 ring-${item.color}-500/20`
                : `bg-white border-slate-100 hover:border-${item.color}-200 hover:shadow-lg`
                }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-2 rounded-2xl ${filterTypes.includes(item.type) ? `bg-${item.color}-500 text-white` : `bg-slate-50 text-slate-400 group-hover:bg-${item.color}-50 group-hover:text-${item.color}-500`
                  }`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                  </svg>
                </div>
                <div className={`flex items-center gap-1 sm:hidden ${filterTypes.includes(item.type) ? `text-${item.color}-600` : 'text-slate-300'}`}>
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {activeTab === 'pending' ? 'Chờ' : activeTab === 'approved' ? 'Duyệt' : 'Từ chối'}
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 relative z-10">
                <h3 className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] ${filterTypes.includes(item.type) ? `text-${item.color}-600` : 'text-slate-400'
                  }`}>
                  <span className="sm:hidden">{item.label}</span>
                  <span className="hidden sm:inline">{item.fullLabel}</span>
                </h3>
                <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
                  <span className={`text-2xl sm:text-3xl font-black ${filterTypes.includes(item.type) ? `text-${item.color}-900` : 'text-slate-800'
                    }`}>
                    {item.count}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${filterTypes.includes(item.type) ? `text-${item.color}-400` : 'text-slate-300'}`}>đơn</span>
                </div>
              </div>

              {/* Background Glow */}
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-3xl ${filterTypes.includes(item.type) ? `bg-${item.color}-400 opacity-20` : 'bg-slate-200 opacity-0 group-hover:opacity-10'
                }`} />
            </button>
          ))}

          {/* Month Summary Card */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-4 sm:p-5 rounded-3xl shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-between col-span-2 lg:col-span-1 xl:col-span-1">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] text-indigo-100/80">Tháng này</h3>
                <div className="flex items-baseline gap-1 mt-1 sm:mt-2 text-white">
                  <span className="text-2xl sm:text-3xl font-black">{stats.total_approved}</span>
                  <span className="text-[10px] font-bold uppercase">đã duyệt</span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 mt-4 sm:mt-6">
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-[9px] font-bold text-indigo-100/50 uppercase tracking-widest mt-2 flex justify-between">
                <span>Hoàn thành xử lý</span>
                <span>100%</span>
              </p>
            </div>

            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          </div>
        </div>


        {/* Bộ lọc */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-4 sm:p-7 mb-8 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Cụm Tìm kiếm & Phòng ban */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Tên nhân viên */}
                {(isAdmin || isHR || isManagement) && (
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 h-4">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                      Tìm nhân viên
                    </label>
                    <input
                      type="text"
                      value={filterName}
                      onChange={e => setFilterName(e.target.value)}
                      placeholder="Nhập tên hoặc mã nhân viên..."
                      className="w-full px-4 py-2.5 text-sm font-bold border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/50 transition-all placeholder:text-slate-300 placeholder:font-medium h-[46px]"
                    />
                  </div>
                )}

                {/* Phòng ban */}
                {(isAdmin || isHR) && (
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 h-4">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      Phòng ban
                    </label>
                    <div className="h-[46px] flex items-center">
                      <div className="w-full [&>div]:m-0">
                        <SelectBox
                          label=""
                          value={filterDepartment}
                          options={deptOptions}
                          onChange={setFilterDepartment}
                          placeholder="Tất cả phòng ban"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cụm Ngày, Tháng & Năm */}
              <div className="w-full lg:w-[320px]">
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 h-4">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Tháng
                    </label>
                    <div className="h-[46px] flex items-center">
                      <div className="w-full">
                        <SelectBox
                          label=""
                          value={filterMonth.toString()}
                          options={Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))}
                          onChange={(val) => setFilterMonth(parseInt(val))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 h-4">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Năm
                    </label>
                    <div className="h-[46px] flex items-center">
                      <div className="w-full">
                        <SelectBox
                          label=""
                          value={filterYear.toString()}
                          options={Array.from({ length: 5 }, (_, i) => {
                            const y = 2026 + i;
                            return { value: y.toString(), label: y.toString() };
                          })}
                          onChange={(val) => setFilterYear(parseInt(val))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loại đơn Chips - Premium Design - Even Display */}
            <div className="border-t border-slate-50 mt-6 pt-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    Phân loại đơn:
                    {(filterTypes.length > 0 || filterExplanationSubTypes.length > 0 || filterRegistrationSubTypes.length > 0) && (
                      <button
                        onClick={clearTypeFilters}
                        className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-transparent hover:border-rose-200 text-[9px] font-black uppercase tracking-widest transition-all duration-200 group"
                      >
                        <svg className="w-2.5 h-2.5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Xoá bộ lọc
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Đơn của tôi Toggle */}
                    <button
                      onClick={() => setFilterOnlyMine(!filterOnlyMine)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${filterOnlyMine
                        ? 'bg-rose-500 text-white border-transparent shadow-lg shadow-rose-200'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200 hover:text-rose-500'
                        }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Đơn của tôi
                    </button>

                    {/* Refresh Button */}
                    <button
                      onClick={() => {
                        fetchAllData(true);
                      }}
                      className="p-2 sm:p-2.5 bg-white text-slate-400 border-2 border-slate-100 rounded-xl hover:border-indigo-200 hover:text-indigo-500 hover:rotate-180 transition-all duration-500 shadow-sm group"
                    >
                      <svg className="w-4 h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 sm:gap-3">

                  {/* Use a fixed height and whitespace-nowrap to ensure equality */}
                  {[
                    { value: 'EXPLANATION', label: 'Giải trình', count: getTabCount('EXPLANATION'), color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                    { value: 'REGISTRATION', label: 'Đăng ký', count: getTabCount('REGISTRATION'), color: 'indigo', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                    { value: 'LEAVE', label: 'Nghỉ phép tháng', count: getTabCount('LEAVE'), color: 'blue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { value: 'ONLINE_WORK', label: 'Làm việc online', count: getTabCount('ONLINE_WORK'), color: 'teal', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  ].map(opt => {
                    const isActive = filterTypes.includes(opt.value);
                    const colorConfigs: Record<string, any> = {
                      amber: { active: 'bg-amber-500 text-white shadow-amber-200', inactive: 'bg-white text-slate-500 hover:text-amber-600 border-slate-100 hover:border-amber-200' },
                      indigo: { active: 'bg-indigo-600 text-white shadow-indigo-200', inactive: 'bg-white text-slate-500 hover:text-indigo-600 border-slate-100 hover:border-indigo-200' },
                      blue: { active: 'bg-blue-500 text-white shadow-blue-200', inactive: 'bg-white text-slate-500 hover:text-blue-600 border-slate-100 hover:border-blue-200' },
                      teal: { active: 'bg-teal-600 text-white shadow-teal-200', inactive: 'bg-white text-slate-500 hover:text-teal-600 border-slate-100 hover:border-teal-200' }
                    };

                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleFilter(opt.value)}
                        className={`group flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 border-2 w-full md:w-auto h-[52px] whitespace-nowrap md:min-w-[140px] ${isActive ? `${colorConfigs[opt.color].active} border-transparent shadow-xl scale-[1.02]` : `${colorConfigs[opt.color].inactive} shadow-sm`
                          }`}
                      >
                        <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white/90' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 3 : 2} d={opt.icon} />
                        </svg>
                        {opt.label}
                        {opt.count > 0 && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black min-w-[18px] text-center ${isActive ? 'bg-white/20 text-white' : `bg-${opt.color}-50 text-${opt.color}-600`
                            }`}>
                            {opt.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>



            {/* Sub-filters for Explanations - Modern Style & Even Display */}
            {filterTypes.includes('EXPLANATION') && (
              <div className="border-t border-slate-50 mt-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                    Chi tiết giải trình:
                  </span>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">

                    {[
                      { value: 'LATE', label: 'Đi muộn', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { value: 'EARLY_LEAVE', label: 'Về sớm', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
                      { value: 'INCOMPLETE_ATTENDANCE', label: 'Quên chấm công', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                      { value: 'BUSINESS_TRIP', label: 'Đi công tác', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { value: 'FIRST_DAY', label: 'Ngày đầu', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z' },
                    ].map(sub => {
                      const isSubActive = filterExplanationSubTypes.includes(sub.value);
                      return (
                        <button
                          key={sub.value}
                          onClick={() => toggleSubTypeFilter(sub.value)}
                          className={`flex items-center justify-center md:justify-start gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 w-full md:w-auto md:min-w-[120px] ${isSubActive
                            ? 'bg-amber-50 text-amber-700 border-amber-500/50 shadow-sm scale-[1.03]'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-amber-200 hover:text-amber-500'
                            }`}
                        >
                          <svg className={`w-3 h-3 ${isSubActive ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isSubActive ? 3 : 2} d={sub.icon} />
                          </svg>
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}



            {/* Sub-filters for Registrations - Modern Style & Even Display */}
            {filterTypes.includes('REGISTRATION') && (
              <div className="border-t border-slate-50 mt-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    Chi tiết đăng ký:
                  </div>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">

                    {[
                      { value: 'OVERTIME', label: 'Tăng ca', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                      { value: 'EXTRA_HOURS', label: 'Làm thêm', icon: 'M12 4v16m8-8H4' },
                      { value: 'NIGHT_SHIFT', label: 'Trực tối', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                      { value: 'LIVE', label: 'Live stream', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                      { value: 'OFF_DUTY', label: 'Vào/Ra trực', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
                    ].map(sub => {
                      const isSubActive = filterRegistrationSubTypes.includes(sub.value);
                      return (
                        <button
                          key={sub.value}
                          onClick={() => toggleRegSubTypeFilter(sub.value)}
                          className={`flex items-center justify-center sm:justify-start gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 w-full sm:w-auto ${isSubActive
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-500/50 shadow-sm scale-[1.03]'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-500'
                            }`}
                        >
                          <svg className={`w-3 h-3 ${isSubActive ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isSubActive ? 3 : 2} d={sub.icon} />
                          </svg>
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>


        <div className="space-y-4">
          {loading && Object.keys(getGroupedRequests()).length === 0 ? (
            <div className="space-y-6">
              <SkeletonItem />
              <SkeletonItem />
            </div>
          ) : Object.keys(getGroupedRequests()).length === 0 ? (
            <div className="bg-white border rounded-xl overflow-hidden p-12 text-center shadow-sm">
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
                <p className="text-xl font-medium text-gray-900">
                  {activeTab === 'pending' ? 'Không có yêu cầu nào chờ duyệt' : 'Không có yêu cầu nào'}
                </p>
                <p className="text-gray-500 mt-1 text-base">
                  Tất cả yêu cầu đã được xử lý hoặc không tìm thấy kết quả phù hợp.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="mt-4 text-primary-600 font-bold hover:underline text-base">
                    Xóa bộ lọc để xem tất cả
                  </button>
                )}
              </div>
            </div>
          ) : (() => {
            const groupedRequests = getGroupedRequests();
            const deptEntries = Object.entries(groupedRequests);
            const totalDepts = deptEntries.length;

            return deptEntries.map(([deptName, posGroups]: [string, any]) => {
              const isDeptExpanded = expandedDepartments.includes(deptName) || (totalDepts === 1);

              // Correctly flatten 3-level groups: posGroups -> empGroups -> items
              const allItemsInDept = Object.values(posGroups as Record<string, any>).reduce((acc: any[], empGroup: any) =>
                acc.concat(...Object.values(empGroup as Record<string, any>)), []
              );

              const pendingInDept = allItemsInDept.filter((r: any) => r.status === 'PENDING' && canApproveRequest(r)).length;

              return (
                <div key={deptName} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  {/* Department Header */}
                  <div className={`w-full flex items-center justify-between p-3 sm:p-4 ${deptName === 'Đơn của Tôi' ? 'bg-rose-50/80 border-rose-100' : 'bg-gray-50 border-gray-200'} border-b`}>
                    <button
                      onClick={() => toggleDepartmentGroup(deptName)}
                      className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none flex-1 min-w-0"
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg ${isDeptExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600'}`}>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 overflow-hidden">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-base sm:text-lg truncate">{deptName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allItemsInDept.length} đơn</span>
                          {pendingInDept > 0 && (activeTab === 'pending') && (
                            <span className="text-xs sm:text-sm font-black text-rose-600 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              {pendingInDept} mới
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-4">
                      {pendingInDept > 0 && activeTab === 'pending' && (
                        <button
                          onClick={() => handleBulkApproveItems(allItemsInDept, `phòng ${deptName}`)}
                          disabled={isBulkProcessing}
                          className="hidden sm:flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-1.5 px-4 rounded-full shadow-sm transition-all whitespace-nowrap"
                        >
                          {isBulkProcessing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                          <span>Duyệt cả phòng</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleDepartmentGroup(deptName)}
                        className={`p-2 hover:bg-gray-200 rounded-full transition-transform duration-300 ${isDeptExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Accordion Content - Positions */}
                  {isDeptExpanded && (
                    <div className="p-2 sm:p-4 space-y-6 bg-gray-50/30">
                      {Object.entries(posGroups as Record<string, any>).map(([posName, empGroups]: [string, any]) => {
                        const allItemsInPos = ([] as any[]).concat(...Object.values(empGroups as Record<string, any>));
                        const pendingInPos = allItemsInPos.filter((r: any) => r.status === 'PENDING' && canApproveRequest(r)).length;

                        return (
                          <div key={posName} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden border-l-4 border-l-primary-500">
                            {/* Position Sub-Header */}
                            <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest leading-none mb-1">
                                    Vị trí: {posName}
                                  </h4>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Tổng: {allItemsInPos.length} đơn đang xử lý
                                  </span>
                                </div>
                              </div>

                              {pendingInPos > 0 && activeTab === 'pending' && (
                                <button
                                  onClick={() => handleBulkApproveItems(allItemsInPos, `vị trí ${posName}`)}
                                  disabled={isBulkProcessing}
                                  className="text-[11px] font-black text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-600 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-primary-100 shadow-sm uppercase tracking-wider"
                                >
                                  {isBulkProcessing ? <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                  Duyệt nhanh {allItemsInPos.length} đơn
                                </button>
                              )}
                            </div>

                            {/* New Level: Employee Accordion */}
                            <div className="p-4 space-y-4">
                              {Object.entries(empGroups as Record<string, any>).map(([empName, items]: [string, any[]]) => {
                                const accordionKey = `${deptName}-${posName}-${empName}`;
                                const isEmpExpanded = expandedEmployees.includes(accordionKey);
                                const pendingInEmp = (items || []).filter((r: any) => r.status === 'PENDING' && canApproveRequest(r)).length;
                                const firstItem = items[0];

                                return (
                                  <div key={empName} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isEmpExpanded ? 'border-primary-100 ring-2 ring-primary-50 shadow-md' : 'border-gray-100 hover:border-primary-200'}`}>
                                    {/* Employee Accordion Header */}
                                    <div
                                      className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isEmpExpanded ? 'bg-primary-50/40' : 'bg-white hover:bg-slate-50'}`}
                                      onClick={() => {
                                        setExpandedEmployees(prev =>
                                          prev.includes(accordionKey)
                                            ? prev.filter(k => k !== accordionKey)
                                            : [...prev, accordionKey]
                                        );
                                      }}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="relative">
                                          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-black shadow-lg transform rotate-2">
                                            {empName.charAt(0)}
                                          </div>
                                          {pendingInEmp > 0 && activeTab === 'pending' && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                              {pendingInEmp}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-col">
                                          <div className="text-base font-black text-slate-800 leading-tight">
                                            {empName}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MÃ NV: {firstItem.employee_code}</span>
                                            <div className="flex items-center gap-1.5">
                                              {items.filter(i => i._itemType === 'EXPLANATION').length > 0 && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black border border-amber-100 uppercase tracking-tighter">
                                                  Giải trình: {(() => {
                                                    const exp = items.find(i => i._itemType === 'EXPLANATION');
                                                    if (exp?.quota_used !== undefined) return exp.quota_used;
                                                    return items.filter(i => i._itemType === 'EXPLANATION' && i.status === 'APPROVED').length;
                                                  })()}/3
                                                </span>
                                              )}
                                              {items.filter(i => i._itemType === 'LEAVE').length > 0 && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black border border-blue-100 uppercase tracking-tighter">
                                                  Nghỉ phép tháng: {(() => {
                                                    const leave = items.find(i => i._itemType === 'LEAVE');
                                                    if (leave?.quota_used !== undefined) return leave.quota_used;
                                                    return items
                                                      .filter(i => i._itemType === 'LEAVE' && i.status === 'APPROVED')
                                                      .reduce((acc, curr) => acc + (Number(curr.leave_amount) || (curr.explanation_type === 'HALF_DAY' ? 0.5 : 1)), 0);
                                                  })()}/1
                                                </span>
                                              )}
                                              {items.filter(i => i._itemType === 'ONLINE_WORK').length > 0 && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[9px] font-black border border-teal-100 uppercase tracking-tighter">
                                                  Làm việc online: {(() => {
                                                    const ow = items.find(i => i._itemType === 'ONLINE_WORK');
                                                    if (ow?.quota_used !== undefined) return ow.quota_used;
                                                    return items
                                                      .filter(i => i._itemType === 'ONLINE_WORK' && i.status === 'APPROVED')
                                                      .reduce((acc, curr) => acc + (Number(curr.work_amount) || (curr.explanation_type === 'HALF_DAY' || curr.registration_type === 'HALF_DAY' ? 0.5 : 1)), 0);
                                                  })()}/3
                                                </span>
                                              )}
                                              {items.filter(i => i._itemType === 'REGISTRATION').length > 0 && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black border border-indigo-100 uppercase tracking-tighter">
                                                  Đăng ký: {(() => {
                                                    const reg = items.find(i => i._itemType === 'REGISTRATION');
                                                    if (reg && reg.quota_used !== undefined) {
                                                      return reg.quota_used;
                                                    }
                                                    return 0;
                                                  })()}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        {pendingInEmp > 0 && activeTab === 'pending' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const empId = firstItem.employee_id || (typeof firstItem.employee === 'object' ? firstItem.employee?.id : firstItem.employee);
                                              if (empId) {
                                                setCalendarModalEmployee({ id: Number(empId), name: empName, month: filterMonth, year: filterYear });
                                              }
                                            }}
                                            className="flex items-center justify-center w-9 h-9 rounded-xl border border-indigo-100 bg-white hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition-all shadow-sm"
                                            title={`Xem lịch công của ${empName}`}
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                          </button>
                                        )}
                                        <div className={`p-2 rounded-full transition-transform duration-500 ${isEmpExpanded ? 'rotate-180 bg-primary-100 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Employee Accordion Content */}
                                    {isEmpExpanded && (
                                      <div className="bg-white">
                                        {/* Desktop Table */}
                                        <div className="hidden lg:block overflow-x-auto">
                                          <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50">
                                              <tr>
                                                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Loại đơn & Lý do</th>
                                                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                                                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Vi phạm & Phạt</th>
                                                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                                <th className="px-6 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                              {items.map((item) => {
                                                const itemKey = `${item._itemType}-${item.id}`;
                                                return (
                                                  <tr key={itemKey} className="group hover:bg-primary-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                      <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${item._itemType === 'LEAVE' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                          item._itemType === 'OVERTIME' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            item._itemType === 'ONLINE_WORK' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                                              item._itemType === 'REGISTRATION' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                                            item._itemType === 'LEAVE' ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' :
                                                              item._itemType === 'OVERTIME' ? 'M13 10V3L4 14h7v7l9-11h-7z' :
                                                                item._itemType === 'ONLINE_WORK' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' :
                                                                  item._itemType === 'REGISTRATION' ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' :
                                                                    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                                          } /></svg>
                                                        </div>
                                                        <div>
                                                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{getRequestTypeLabel(item)}</div>
                                                          <div className="text-[11px] text-slate-400 italic line-clamp-1 max-w-[200px]">{cleanReasonText(item.reason || item.work_plan || '', getRequestTypeLabel(item))}</div>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                      <div className="text-sm font-black text-slate-700">{formatDate(item.attendance_date || item.registration_date || item.work_date || item.start_date)}</div>
                                                      <div className="text-[10px] font-bold text-slate-400 uppercase">Lúc: {formatDateTime(item.created_at).split(' ')[1]}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                      <div className="flex flex-col gap-1">
                                                        {item.penalty_amount > 0 ? (
                                                          <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 w-fit">-{(item.penalty_amount).toLocaleString()}đ</span>
                                                        ) : <span className="text-[10px] text-slate-300 font-bold italic">N/A</span>}
                                                        {item.late_minutes > 0 && (
                                                          <span className="text-[9px] font-bold text-amber-600 uppercase">Đi muộn: {item.late_minutes} phút</span>
                                                        )}
                                                        {item.early_leave_minutes > 0 && (
                                                          <span className="text-[9px] font-bold text-amber-600 uppercase">Về sớm: {item.early_leave_minutes} phút</span>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                      <div className="flex justify-center gap-2">
                                                        {activeTab === 'pending' && canApproveRequest(item) && (
                                                          <>
                                                            <button onClick={() => openApproveModal(item)} className="p-2 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>
                                                            <button onClick={() => openRejectModal(item)} className="p-2 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-100 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                          </>
                                                        )}
                                                        <button
                                                          onClick={() => (item._itemType === 'ONLINE_WORK' || item._itemType === 'REGISTRATION') ? handleViewOnlineWorkDetails(item) : handleViewDetails(item)}
                                                          className="w-24 py-2 bg-slate-900 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                          Chi tiết
                                                        </button>
                                                        {canDeleteRequest(item) && (
                                                          <button
                                                            onClick={() => openDeleteModal(item)}
                                                            className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100 shadow-sm"
                                                            title="Xóa đơn của bạn"
                                                          >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                          </button>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="lg:hidden p-4 space-y-4 bg-slate-50/50">
                                          {items.map((item) => {
                                            const itemKey = `${item._itemType}-${item.id}`;
                                            return (
                                              <div key={itemKey} className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm active:scale-[0.98] transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                  <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-2xl shadow-md ${item._itemType === 'LEAVE' ? 'bg-blue-500' :
                                                      item._itemType === 'OVERTIME' ? 'bg-purple-500' :
                                                        item._itemType === 'ONLINE_WORK' ? 'bg-teal-500' :
                                                          item._itemType === 'REGISTRATION' ? 'bg-indigo-500' :
                                                            'bg-amber-500'} text-white`}>
                                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={
                                                        item._itemType === 'LEAVE' ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' :
                                                          item._itemType === 'OVERTIME' ? 'M13 10V3L4 14h7v7l9-11h-7z' :
                                                            item._itemType === 'ONLINE_WORK' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' :
                                                              item._itemType === 'REGISTRATION' ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' :
                                                                'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                                      } /></svg>
                                                    </div>
                                                    <div>
                                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{getRequestTypeLabel(item)}</h4>
                                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(item.attendance_date || item.registration_date || item.work_date || item.start_date)}</p>
                                                    </div>
                                                  </div>
                                                  {getStatusBadge(item)}
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                                                  <div className="flex flex-col gap-1 max-w-[70%]">
                                                    <div className="text-[11px] font-bold text-slate-500 italic line-clamp-1">"{cleanReasonText(item.reason || item.work_plan || '', getRequestTypeLabel(item))}"</div>
                                                    {item.late_minutes > 0 && (
                                                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Đi muộn: {item.late_minutes}m</span>
                                                    )}
                                                    {item.early_leave_minutes > 0 && (
                                                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Về sớm: {item.early_leave_minutes}m</span>
                                                    )}
                                                  </div>
                                                  {item.penalty_amount > 0 && <span className="text-[11px] font-black text-rose-600">-{item.penalty_amount.toLocaleString()}đ</span>}
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                  <button onClick={() => (item._itemType === 'ONLINE_WORK' || item._itemType === 'REGISTRATION') ? handleViewOnlineWorkDetails(item) : handleViewDetails(item)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Chi tiết</button>
                                                  {activeTab === 'pending' && canApproveRequest(item) && (
                                                    <button onClick={() => openApproveModal(item)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                                                  )}
                                                  {canDeleteRequest(item) && (
                                                    <button
                                                      onClick={() => openDeleteModal(item)}
                                                      className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100"
                                                      title="Xóa đơn của bạn"
                                                    >
                                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                      </svg>
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()
          }
        </div>

        {/* BẢNG YÊU CẦU CHỜ DUYỆT RIÊNG BIỆT CHO QUẢN LÝ (Viết ở dưới theo yêu cầu) */}
        {activeTab === 'pending' && !loading && (isAdmin || isManagement) && (
          <div className="mt-8 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">Phê duyệt chốt công NV</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-0.5">
                    <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500 animate-ping"></span>
                    <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider leading-tight">Ưu tiên xử lý các đơn này</p>
                  </div>
                </div>
              </div>

              {(() => {
                const count = workFinalizationApprovals.length;
                return (
                  <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 mt-1 sm:mt-0 justify-end">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-400 uppercase leading-none">Số lượng phòng</div>
                      <div className="text-3xl font-black text-indigo-600 leading-none mt-1">{count}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/40">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">STT</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Mã NV/Phòng</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Nhân viên / Đơn vị</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Số công / Chi tiết</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian gửi</th>
                      <th className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest bg-indigo-50/30">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {(() => {
                      if (workFinalizationApprovals.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center bg-slate-50/20">
                              <div className="flex flex-col items-center max-w-sm mx-auto">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h4 className="text-lg font-black text-slate-800">Hoàn thành tuyệt vời!</h4>
                                <p className="text-slate-400 text-base mt-2 font-medium">Bạn đã xử lý hết tất cả các đơn thuộc quyền hạn của mình.</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return workFinalizationApprovals.map((item, index) => (
                        <tr key={`manager-row-${item.id}`} className="hover:bg-indigo-50/20 transition-all duration-300 group cursor-pointer" onClick={() => {
                          if (item._itemType === 'WORK_FINALIZATION') {
                            handleViewWfDetails(item);
                            return;
                          }
                          (item._itemType === 'ONLINE_WORK') ? handleViewOnlineWorkDetails(item) : handleViewDetails(item);
                        }}>
                          <td className="px-6 py-5 whitespace-nowrap text-base font-black text-slate-300 border-r border-slate-50">
                            {(index + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                              {item.department_code}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-100">
                                {item.department_name?.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.department_name || item.department_code}</span>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Chốt công tháng {item.month}/{item.year}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-base font-black text-slate-800`}>
                                  Xem chi tiết ↗
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 italic">Người gửi: {item.sent_by_name} ({item.sent_by_role || 'Admin'})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-base font-black text-slate-700">
                              {formatDateTime(item.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center bg-indigo-50/5 group-hover:bg-indigo-50/10 transition-all border-l border-slate-50" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center min-h-[50px]">
                              {/* PHẦN HIỂN THỊ DÀNH CHO QUẢN LÝ (KHI CÓ QUYỀN DUYỆT) */}
                              {item.status === 'PENDING' && isManagement && !isAdmin ? (
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => openApproveModal(item)}
                                    className="h-9 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95 whitespace-nowrap uppercase tracking-wider"
                                  >
                                    PHÊ DUYỆT
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(item)}
                                    className="h-9 px-6 bg-white hover:bg-rose-50 text-rose-500 text-sm font-black rounded-xl border border-slate-200 hover:border-rose-200 transition-all uppercase tracking-wider"
                                  >
                                    TỪ CHỐI
                                  </button>
                                </div>
                              ) : (
                                /* PHẦN HIỂN THỊ DÀNH CHO ADMIN (HOẶC KHI ĐÃ DUYỆT XONG) */
                                <div className="flex flex-col items-center">
                                  {item.status === 'APPROVED' ? (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
                                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                      </div>
                                      <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">QLTT ĐÃ PHÊ DUYỆT</span>
                                    </div>
                                  ) : item.status === 'REJECTED' ? (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
                                      <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm shadow-rose-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </div>
                                      <span className="text-rose-700 font-black text-xs uppercase tracking-widest">QLTT ĐÃ TỪ CHỐI</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
                                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse shadow-sm shadow-amber-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <span className="text-amber-700 font-black text-xs uppercase tracking-widest">ĐANG CHỜ QLTT DUYỆT</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View for Manager Table */}
              <div className="lg:hidden divide-y divide-slate-100">
                {workFinalizationApprovals.length === 0 ? (
                  <div className="px-6 py-16 text-center bg-slate-50/20">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Tất cả đã xử lý!</h4>
                    </div>
                  </div>
                ) : (
                  workFinalizationApprovals.map((item) => (
                    <div
                      key={`manager-card-${item.id}`}
                      onClick={() => {
                        if (item._itemType === 'WORK_FINALIZATION') {
                          handleViewWfDetails(item);
                          return;
                        }
                        (item._itemType === 'ONLINE_WORK') ? handleViewOnlineWorkDetails(item) : handleViewDetails(item);
                      }}
                      className="p-5 bg-white active:bg-slate-50 transition-all border-b border-slate-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                            {item.department_name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.department_name || item.department_code}</h4>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.1em]">Chốt công : {item.month}/{item.year}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Thời gian gửi</div>
                          <div className="text-[11px] font-black text-slate-500">{formatDateTime(item.created_at).split(' ')[0]}</div>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái hiện tại:</span>
                          {item.status === 'APPROVED' ? (
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Đã phê duyệt</span>
                          ) : item.status === 'REJECTED' ? (
                            <span className="text-[10px] font-black text-rose-600 uppercase">Đã từ chối</span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 uppercase animate-pulse">Đang chờ xử lý</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 italic font-medium">Người gửi: {item.sent_by_name}</p>
                      </div>

                      {item.status === 'PENDING' && isManagement && !isAdmin && (
                        <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openApproveModal(item)}
                            className="py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-emerald-100"
                          >
                            PHÊ DUYỆT
                          </button>
                          <button
                            onClick={() => openRejectModal(item)}
                            className="py-3.5 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em]"
                          >
                            TỪ CHỐI
                          </button>
                        </div>
                      )}

                      <button className="w-full mt-3 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                        XEM CHI TIẾT BẢNG CÔNG
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        <div className="mt-12 tracking-tight">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Quy trình & Quyền hạn của bạn
            </h3>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 sm:p-8 rounded-[32px] border border-slate-100 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest">Quyền hạn cao nhất</span>
                </div>
                <p className="text-slate-700 text-lg font-bold leading-snug">
                  Bạn có quyền phê duyệt quản lý các loại đơn:{' '}
                  <span className="text-indigo-600 border-b-2 border-indigo-100">
                    Nghỉ phép, Tăng ca, Giải trình chấm công & Chốt công tháng.
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest leading-none">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Cấp duyệt: QLTT
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    Thời gian: 24h
                  </div>
                </div>
              </div>
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 border-2 border-slate-900 hover:bg-indigo-600 hover:border-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md hover:shadow-xl shadow-slate-200">
                CẤU HÌNH QUY TRÌNH
              </button>

            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          </div>
        </div>

      </div>

      {/* Modal Chi tiết Chốt công (Danh sách nhân viên) */}
      {showWfDetailModal && selectedWfApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-2">Chi tiết bảng công {selectedWfApproval.department_name || selectedWfApproval.department_code}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tháng {selectedWfApproval.month}/{selectedWfApproval.year} • {wfEmployees.length} nhân sự</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWfDetailModal(false);
                  setSelectedWfApproval(null);
                  setWfEmployees([]);
                }}
                className="absolute sm:relative top-4 right-4 sm:top-auto sm:right-auto text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 font-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Responsive Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/30">
              <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-3xl overflow-hidden shadow-sm">

                {/* Desktop View (Table) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Công thực tế</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tăng ca</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Làm thêm giờ</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trực tối</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nghỉ phép tháng</th>
                        <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng phạt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wfEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-10 text-center text-slate-400 italic">Không tìm thấy dữ liệu nhân viên</td>
                        </tr>
                      ) : (
                        wfEmployees.map((emp) => (
                          <tr key={`wf-emp-${emp.employee_id}`} className="hover:bg-slate-50/50 group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600">{emp.ho_va_ten}</span>
                                  {emp.is_locked && (
                                    <div className="bg-amber-100 text-amber-600 p-0.5 rounded shadow-sm" title="Dữ liệu đã khóa">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{emp.ma_nv} • {emp.vi_tri || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{emp.cong_thuc_te}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-1">Tổng: {emp.tong_cong}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              {emp.tang_ca > 0 ? (
                                <span className="text-sm font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{emp.tang_ca}h</span>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {emp.lam_them_gio > 0 ? (
                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{emp.lam_them_gio}h</span>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {emp.truc_toi > 0 ? (
                                <span className="text-sm font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">{emp.truc_toi}</span>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {emp.live > 0 ? (
                                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{emp.live}</span>
                              ) : (
                                <span className="text-xs text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center text-sm font-bold text-slate-500">{emp.nghi_phep_thang > 0 ? emp.nghi_phep_thang : '-'}</td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-black text-rose-600">{(emp.tong_phat || 0) > 0 ? `${(emp.tong_phat || 0).toLocaleString('vi-VN')} VNĐ` : '-'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet View (Cards) */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {wfEmployees.length === 0 ? (
                    <div className="px-6 py-10 text-center text-slate-400 italic">Không tìm thấy dữ liệu nhân viên</div>
                  ) : (
                    wfEmployees.map((emp) => (
                      <div key={`wf-emp-mobile-${emp.employee_id}`} className="p-4 sm:p-6 space-y-5 bg-white">
                        {/* Header: Name & Info */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-800 tracking-tight truncate">{emp.ho_va_ten}</span>
                              {emp.is_locked && (
                                <div className="bg-amber-100 text-amber-600 p-0.5 rounded shadow-sm shrink-0">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{emp.ma_nv} • {emp.vi_tri || 'N/A'}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-rose-600 uppercase block mb-1">Tổng phạt</span>
                            <span className="text-sm font-black text-rose-600">{(emp.tong_phat || 0) > 0 ? `${(emp.tong_phat || 0).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                          <div className="bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100/50">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Công thực tế</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-indigo-600">{emp.cong_thuc_te}</span>
                              <span className="text-[10px] font-bold text-slate-400">/ {emp.tong_cong}</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tăng ca/Làm thêm giờ</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-orange-600">{emp.tang_ca}h</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs font-black text-blue-600">{emp.lam_them_gio}h</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Trực tối/Live</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-purple-600">{emp.truc_toi}</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs font-black text-emerald-600">{emp.live}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-tight">Toàn bộ dữ liệu đã được đối soát tự động</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {selectedWfApproval.status === 'APPROVED' && (
                  <span className="w-full sm:w-auto text-center px-4 py-3 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                    Bảng công đã được phê duyệt
                  </span>
                )}
                {selectedWfApproval.status === 'REJECTED' && (
                  <span className="w-full sm:w-auto text-center px-4 py-3 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest">
                    Bảng công đã bị từ chối
                  </span>
                )}
                {selectedWfApproval.can_approve && selectedWfApproval.status === 'PENDING' && !isAdmin && (
                  <button
                    onClick={() => {
                      setShowWfDetailModal(false);
                      openApproveModal(selectedWfApproval);
                    }}
                    className="w-full sm:w-auto h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest"
                  >
                    Duyệt bảng công này
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal &&
        (selectedExplanation || selectedOnlineWorkRequest) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 transition-all duration-300">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header - Sticky */}
              <div className="sticky top-0 z-20 px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 leading-none">
                        Thông tin đơn
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại đơn:</span>
                        <span className="text-[11px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                          {getRequestTypeLabel(selectedExplanation || selectedOnlineWorkRequest)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedExplanation(null);
                      setSelectedOnlineWorkRequest(null);
                      setEmployeeFreqStats(null);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* 1. Kế hoạch / Lý do (Ẩn nếu là Nghỉ phép tháng theo yêu cầu) */}
                {!(selectedExplanation?._itemType === 'LEAVE') && (
                  <div className="mb-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                        {selectedExplanation
                          ? `Lý do / Nội dung ${getRequestTypeLabel(selectedExplanation)}`
                          : 'Kế hoạch công việc'}
                      </h4>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap text-base leading-relaxed">
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
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Người tạo đơn
                    </h4>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative group">
                        <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-100 ring-4 ring-white transition-transform group-hover:scale-105 duration-300">
                          {(selectedExplanation ? selectedExplanation.employee_name : selectedOnlineWorkRequest.employee_name)?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
                          {selectedExplanation ? selectedExplanation.employee_name : selectedOnlineWorkRequest.employee_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                            {selectedExplanation ? selectedExplanation.employee_code : selectedOnlineWorkRequest.employee_code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-50">
                      {/* Department */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Phòng ban</span>
                        </div>
                        <span className="text-sm font-black text-slate-700">
                          {(selectedExplanation ? (selectedExplanation.employee_department || selectedExplanation.department_name) : selectedOnlineWorkRequest.department_name) || 'N/A'}
                        </span>
                      </div>

                      {/* Position */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Vị trí</span>
                        </div>
                        <span className="text-sm font-black text-slate-700">
                          {(selectedExplanation ? (selectedExplanation.employee_position || selectedExplanation.position_name) : (selectedOnlineWorkRequest.employee_position || selectedOnlineWorkRequest.position_name)) || 'N/A'}
                        </span>
                      </div>

                      {/* Manager */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:bg-emerald-50 group-hover/item:text-emerald-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Quản lý duyệt</span>
                        </div>
                        <span className="text-sm font-black text-slate-700">
                          {(selectedExplanation ? (selectedExplanation.employee_manager_name || selectedExplanation.employee_department_manager_name) : (selectedOnlineWorkRequest.employee_manager_name || selectedOnlineWorkRequest.employee_department_manager_name)) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Request Info (Meta Data) */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Cụ thể yêu cầu
                    </h4>

                    <div className="space-y-4">
                      {/* Priority Status Section */}
                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between group/status">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover/status:text-indigo-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">Trạng thái duyệt</span>
                        </div>
                        {getStatusBadge(selectedExplanation || selectedOnlineWorkRequest)}
                      </div>

                      {/* Info List */}
                      <div className="space-y-3 px-1">
                        {/* Request ID */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-50 gap-4">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-tight shrink-0 whitespace-nowrap">Mã định danh đơn</span>
                          <span className="text-[11px] font-mono font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                            {selectedExplanation?.request_code || selectedOnlineWorkRequest?.request_code || '---'}
                          </span>
                        </div>

                        {selectedExplanation ? (
                          <>
                            {/* Date Detail */}
                            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 gap-4">
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-tight shrink-0 whitespace-nowrap">
                                {selectedExplanation._itemType === 'REGISTRATION' ? 'Ngày đăng ký' :
                                  selectedExplanation._itemType === 'LEAVE' ? 'Thời gian nghỉ' :
                                    'Ngày hiệu lực'}
                              </span>
                              <span className="text-[15px] font-black text-slate-700 whitespace-nowrap">
                                {selectedExplanation._itemType === 'LEAVE'
                                  ? (selectedExplanation.start_date === selectedExplanation.end_date
                                    ? formatDate(selectedExplanation.start_date)
                                    : `${formatDate(selectedExplanation.start_date)} - ${formatDate(selectedExplanation.end_date)}`)
                                  : formatDate(selectedExplanation.attendance_date || selectedExplanation.registration_date || selectedExplanation.event_date || selectedExplanation.start_date)}
                              </span>
                            </div>

                            {/* Time Range (if applicable) */}
                            {selectedExplanation._itemType === 'REGISTRATION' && (selectedExplanation.start_time || selectedExplanation.end_time) && (
                              <div className="flex justify-between items-center py-2.5 border-b border-slate-50 gap-4">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight shrink-0 whitespace-nowrap">Khung thời gian</span>
                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap">
                                  {selectedExplanation.start_time?.substring(0, 5) || '??:??'} - {selectedExplanation.end_time?.substring(0, 5) || '??:??'}
                                </span>
                              </div>
                            )}

                            {/* Status Transitions (Attendance only) */}
                            {selectedExplanation._itemType !== 'REGISTRATION' && (
                              <>
                                <div className="flex flex-col gap-3 py-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dữ liệu gốc</span>
                                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      {selectedExplanation.original_status_display || getOriginalStatusText(selectedExplanation.original_status)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kỳ vọng thay đổi</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
                                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                      <span className="text-sm font-black text-emerald-700">
                                        {selectedExplanation.expected_status_display?.includes('đủ công đúng công') ? 'Tính đủ công' : (selectedExplanation.expected_status_display || getExpectedStatusText(selectedExplanation.expected_status))}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Hiển thị chi tiết vi phạm và phạt nếu có */}
                                {(selectedExplanation.late_minutes > 0 || selectedExplanation.early_leave_minutes > 0 || selectedExplanation.penalty_amount > 0) && (
                                  <div className="mt-6 p-5 rounded-3xl bg-rose-50/50 border border-rose-100 shadow-sm relative overflow-hidden group/violation">
                                    {/* Decorative background element */}
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-100/30 rounded-full blur-2xl group-hover/violation:bg-rose-100/50 transition-colors duration-500" />

                                    <div className="flex items-center gap-3 mb-5 scale-in-center">
                                      <div className="flex-shrink-0 w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                      </div>
                                      <div>
                                        <span className="text-sm font-extrabold text-rose-800 uppercase tracking-widest block leading-none">Thông tin vi phạm & Phạt</span>
                                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter mt-1 block">Chi tiết các khoản khấu trừ trực tiếp</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Thời gian vi phạm card */}
                                      {(selectedExplanation.late_minutes > 0 || selectedExplanation.early_leave_minutes > 0) && (
                                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-3">Thời gian vi phạm</span>
                                          <div className="space-y-2">
                                            {selectedExplanation.late_minutes > 0 && (
                                              <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/80 border border-amber-100/50 group/item">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                  <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-tighter">Đi muộn:</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                  <span className="text-base font-black text-amber-600 tracking-tighter">{selectedExplanation.late_minutes}</span>
                                                  <span className="text-[10px] font-bold text-amber-400 uppercase ml-0.5">phút</span>
                                                </div>
                                              </div>
                                            )}
                                            {selectedExplanation.early_leave_minutes > 0 && (
                                              <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50/80 border border-rose-100/50 group/item">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                                  <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-tighter">Về sớm:</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                  <span className="text-base font-black text-rose-600 tracking-tighter">{selectedExplanation.early_leave_minutes}</span>
                                                  <span className="text-[10px] font-bold text-rose-400 uppercase ml-0.5">phút</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Tiền phạt card */}
                                      {selectedExplanation.penalty_amount > 0 && (
                                        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-2xl shadow-lg shadow-rose-200 flex flex-col justify-between group/total">
                                          <span className="text-[10px] text-rose-100 font-extrabold uppercase tracking-widest block mb-1">Tiền phạt</span>
                                          <div className="flex items-baseline gap-1.5 justify-end">
                                            <span className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-sm">
                                              {(selectedExplanation.penalty_amount || 0).toLocaleString('vi-VN')}
                                            </span>
                                            <span className="text-xs font-black text-rose-100 uppercase tracking-tighter">VNĐ</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          /* Online Work specifics */
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ngày làm việc</span>
                            <span className="text-sm font-black text-slate-700">
                              {formatDate(selectedOnlineWorkRequest.work_date || selectedOnlineWorkRequest.attendance_date || selectedOnlineWorkRequest.registration_date)}
                            </span>
                          </div>
                        )}

                        {/* Common metadata footer */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 mt-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ngày tạo đơn</span>
                          <span className="text-sm font-bold text-slate-600">
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
                </div>

                {/* Khối Thống kê Nhân viên (Tần suất & Hạn mức) - Hiển thị cho tất cả loại đơn */}
                {(employeeFreqStats || isFetchingStats) && (
                  <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-blue-100/50 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Thống kê hoạt động trong tháng</span>
                      </div>
                      {isFetchingStats && (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>

                    <div className={`grid gap-3 ${statsCount <= 1 ? 'grid-cols-1' : statsCount === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {/* Item 1: Giải trình */}
                      {(isViewingExp || statsCount === 0) && (
                        <div className={`p-3 rounded-xl border transition-all ${((employeeFreqStats?.statistics?.remaining_explanations ?? 1) <= 0) ? 'bg-red-50/60 border-red-100' : 'bg-white border-indigo-100/30'}`}>
                          <p className="text-[11px] text-gray-400 font-black uppercase mb-1.5">Giải trình</p>
                          <div className="flex justify-between items-end">
                            <p className="text-base font-black text-gray-900 leading-none">
                              {employeeFreqStats?.statistics?.approved_explanations ?? 0}
                              <span className="text-xs text-gray-400 font-bold ml-0.5">/{employeeFreqStats?.statistics?.max_explanations_per_month ?? 3}</span>
                            </p>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${(employeeFreqStats?.statistics?.remaining_explanations ?? 1) <= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {((employeeFreqStats?.statistics?.remaining_explanations ?? 1) <= 0) ? 'Hết' : `Còn ${employeeFreqStats?.statistics?.remaining_explanations}`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Item 2: Online */}
                      {(isViewingOnl || statsCount === 0) && (
                        <div className={`p-3 rounded-xl border transition-all ${((employeeFreqStats?.statistics?.approved_online_work ?? 0) >= (employeeFreqStats?.statistics?.max_online_work_per_month ?? 3)) ? 'bg-amber-50/60 border-amber-100' : 'bg-white border-teal-100/30'}`}>
                          <p className="text-[11px] text-gray-400 font-black uppercase mb-1.5">Làm việc online</p>
                          <div className="flex justify-between items-end">
                            <p className="text-base font-black text-gray-900 leading-none">
                              {employeeFreqStats?.statistics?.approved_online_work ?? 0}
                              <span className="text-xs text-gray-400 font-bold ml-0.5">/3</span>
                            </p>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${((employeeFreqStats?.statistics?.approved_online_work ?? 0) >= (employeeFreqStats?.statistics?.max_online_work_per_month ?? 3)) ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
                              Lần
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Item 3: Đăng ký */}
                      {(isViewingReg || statsCount === 0) && (
                        <div className="bg-white p-3 rounded-xl border border-indigo-100/30">
                          <p className="text-[11px] text-gray-400 font-black uppercase mb-1.5">Đơn đăng ký</p>
                          <div className="flex justify-between items-end">
                            <p className="text-base font-black text-gray-900 leading-none">
                              {employeeFreqStats?.statistics?.approved_registrations ?? 0}
                            </p>
                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                              Duyệt
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Item 4: Nghỉ phép */}
                      {(isViewingLea || statsCount === 0) && (
                        <div className={`p-3 rounded-xl border transition-all ${((employeeFreqStats?.statistics?.approved_leave ?? 0) >= (employeeFreqStats?.statistics?.max_leave_per_month ?? 1)) ? 'bg-blue-50/60 border-blue-100' : 'bg-white border-blue-100/30'}`}>
                          <p className="text-[11px] text-gray-400 font-black uppercase mb-1.5">Nghỉ phép tháng</p>
                          <div className="flex justify-between items-end">
                            <p className="text-base font-black text-gray-900 leading-none">
                              {employeeFreqStats?.statistics?.approved_leave ?? 0}
                              <span className="text-xs text-gray-400 font-bold ml-0.5">/1</span>
                            </p>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${((employeeFreqStats?.statistics?.approved_leave ?? 0) >= (employeeFreqStats?.statistics?.max_leave_per_month ?? 1)) ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                              {((employeeFreqStats?.statistics?.approved_leave ?? 0) >= (employeeFreqStats?.statistics?.max_leave_per_month ?? 1)) ? 'Hết' : 'Còn'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {isViewingExp && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sử dụng định mức giải trình</span>
                          <span className="text-xs font-black text-indigo-600">
                            {Math.round(((employeeFreqStats?.statistics?.approved_explanations || 0) / (employeeFreqStats?.statistics?.max_explanations_per_month || 3)) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-1000 ease-out ${(employeeFreqStats?.statistics?.approved_explanations || 0) >= (employeeFreqStats?.statistics?.max_explanations_per_month || 3) ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'}`}
                            style={{ width: `${Math.min(100, ((employeeFreqStats?.statistics?.approved_explanations || 0) / (employeeFreqStats?.statistics?.max_explanations_per_month || 3)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* Additional Fields for Online Work (Mở rộng) */}
                {!selectedExplanation && selectedOnlineWorkRequest.actual_result && (
                  <div className="mb-6">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm">
                      <h4 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">
                        Kết quả thực tế
                      </h4>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap text-base leading-relaxed">
                        {selectedOnlineWorkRequest.actual_result}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approval Note (Common) */}

                {/* Workflow Timeline */}
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
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
                                    <p className="text-base font-bold text-gray-900 flex items-center">
                                      {step.role}
                                      {/* Mini Badge */}
                                      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isRejected ? 'bg-red-100 text-red-700' :
                                        isApproved ? 'bg-green-100 text-green-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {step.status}
                                      </span>
                                    </p>
                                    <p className="text-base text-gray-600 mt-1">
                                      <span className="text-gray-400 mr-1">{isRejected ? 'Người từ chối:' : 'Người duyệt:'}</span>
                                      <span className="font-medium text-gray-700">{step.approver}</span>
                                    </p>
                                  </div>

                                  {step.date && (
                                    <div className="text-left sm:text-right bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Thời gian</p>
                                      <p className="text-base font-semibold text-gray-800">{formatDateTime(step.date)}</p>
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
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap sm:flex-nowrap justify-end gap-3 rounded-b-lg">
                <div className="mr-auto w-full sm:w-auto mb-2 sm:mb-0 order-last sm:order-first">
                  {((selectedExplanation && canDeleteRequest(selectedExplanation)) || (selectedOnlineWorkRequest && canDeleteRequest(selectedOnlineWorkRequest))) && (
                    <button
                      onClick={() => {
                        openDeleteModal(selectedExplanation || selectedOnlineWorkRequest);
                        setShowDetailModal(false);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl sm:rounded-md hover:bg-red-100 transition-colors font-semibold"
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
                    setEmployeeFreqStats(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 font-semibold rounded-xl sm:rounded-md hover:bg-gray-50 transition-colors order-1"
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
                            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-green-600 text-white font-semibold rounded-xl sm:rounded-md hover:bg-green-700 transition-colors order-3"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              openRejectModal(selectedExplanation);
                              setShowDetailModal(false);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-red-600 text-white font-semibold rounded-xl sm:rounded-md hover:bg-red-700 transition-colors order-2"
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
                            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-green-600 text-white font-semibold rounded-xl sm:rounded-md hover:bg-green-700 transition-colors order-3"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              openRejectModal(selectedOnlineWorkRequest);
                              setShowDetailModal(false);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-red-600 text-white font-semibold rounded-xl sm:rounded-md hover:bg-red-700 transition-colors order-2"
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
                <p className="text-base text-gray-500 mb-1">Đối tượng xử lý:</p>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 border border-gray-200 shadow-sm">
                    {targetItem.employee_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{targetItem.employee_name}</p>
                    <p className="text-sm text-gray-500 font-medium">{getRequestTypeLabel(targetItem)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-gray-700">Ghi chú xử lý:</label>
                <textarea
                  autoFocus
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={actionType === 'APPROVE' ? 'Nội dung phản hồi (Tùy chọn)...' : 'Lý do từ chối (Bắt buộc)...'}
                  className={`w-full min-h-[100px] p-3 border rounded-xl text-base focus:ring-2 outline-none transition-all ${actionType === 'APPROVE' ? 'border-gray-200 focus:ring-green-200 focus:border-green-500' : 'border-red-200 focus:ring-red-100 focus:border-red-400'}`}
                />
                {actionType === 'REJECT' && !approvalNote.trim() && (
                  <p className="text-[11px] text-red-500 font-medium">Vui lòng nhập lý do từ chối đơn này.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setActionModalOpen(false)}
                className="flex-1 w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-base disabled:opacity-50 order-last sm:order-first"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isProcessing || (actionType === 'REJECT' && !approvalNote.trim())}
                onClick={confirmAction}
                className={`flex-1 w-full sm:w-auto px-4 py-2.5 text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-lg ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 shadow-green-200/50' : 'bg-red-600 hover:bg-red-700 shadow-red-200/50'} disabled:bg-gray-400 disabled:shadow-none`}
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
              <p className="text-base text-gray-500 leading-relaxed">
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
            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-base order-last sm:order-first"
              >
                Hủy
              </button>
              <button
                disabled={isProcessing}
                onClick={confirmDelete}
                className="flex-1 w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-base flex items-center justify-center gap-2 shadow-lg shadow-red-200/50 disabled:bg-gray-400 disabled:shadow-none"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Thông báo Lỗi */}
      {errorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thông báo</h3>
              <p className="text-base text-gray-500 leading-relaxed whitespace-pre-line">
                {errorMessage}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setErrorModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-base shadow-lg shadow-red-200"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 4. Modal Xác nhận Duyệt hàng loạt */}
      {bulkConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary-600 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white">Xác nhận duyệt nhanh</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Bạn đang thực hiện duyệt nhanh <span className="font-bold text-gray-900">{bulkConfirmModal.items.length}</span> đơn tại <span className="font-bold text-primary-600">{bulkConfirmModal.name}</span>.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-medium">
                      Hành động này sẽ duyệt tất cả các đơn hợp lệ được chọn. Bạn không thể hoàn tác sau khi thực hiện.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setBulkConfirmModal(null)}
                  className="flex-1 w-full sm:w-auto py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors order-last sm:order-first"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={executeBulkApprove}
                  className="flex-1 w-full sm:w-auto py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200/50 transition-all"
                >
                  Đồng ý duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Kết quả Duyệt hàng loạt */}
      {bulkActionResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xử lý hoàn tất!</h3>
              <p className="text-base text-gray-500 mb-6">Kết quả duyệt nhanh tại {bulkActionResult.groupName}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-2xl font-black text-green-600">{bulkActionResult.success}</p>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest mt-1">Thành công</p>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-2xl font-black text-red-600">{bulkActionResult.error}</p>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest mt-1">Thất bại</p>
                </div>
              </div>

              <button
                onClick={() => setBulkActionResult(null)}
                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
              >
                Tuyệt vời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Attendance Calendar Modal */}
      {calendarModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">Lịch công của {calendarModalEmployee.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold">Tháng {calendarModalEmployee.month}/{calendarModalEmployee.year}</p>
                </div>
              </div>
              <button
                onClick={() => setCalendarModalEmployee(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <AttendanceCalendar
                year={calendarModalEmployee.year}
                month={calendarModalEmployee.month - 1}
                employeeId={calendarModalEmployee.id}
                showInternalDialog={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
