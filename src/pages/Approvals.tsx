import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approval.service';
import { attendanceService } from '../services/attendance.service';
import { workFinalizationApprovalService } from '../services/workFinalizationApproval.service';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import { useAuth } from '../contexts/AuthContext';


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
  const [filterOnlyMine, setFilterOnlyMine] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [selectedOnlineWorkRequest, setSelectedOnlineWorkRequest] =
    useState<any>(null);
  const [selectedWfApproval, setSelectedWfApproval] = useState<any>(null);
  const [wfEmployees, setWfEmployees] = useState<any[]>([]);
  const [showWfDetailModal, setShowWfDetailModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [employeeFreqStats, setEmployeeFreqStats] = useState<any>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(false);

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

  const isHR = (user as any)?.hrm_user?.department_code === 'HCNS' ||
               (user as any)?.employee_profile?.department_code === 'HCNS' ||
               user?.role?.toUpperCase() === 'HR' ||
               currentEmployee?.is_hr ||
               currentEmployee?.position?.title?.toUpperCase().includes('HR') ||
               currentEmployee?.department?.code === 'HCNS';

  const isManagement = currentEmployee?.position?.is_management || 
                       currentEmployee?.is_manager || 
                       Number(currentEmployee?.management_level) >= 1 ||
                       false;

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

  const deptOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...uniqueDepts.map(dept => ({ value: dept as string, label: dept as string }))
  ];




  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Đảm bảo lấy thông tin nhân viên trước để có department_code phục vụ việc lọc
      const emp = await fetchCurrentEmployee();
      
      // Khai báo lại các biến quyền dựa trên dữ liệu mới nhất
      const currentIsAdmin = emp?.user?.is_staff || emp?.user?.is_superuser || (user as any)?.is_superuser || (user as any)?.is_staff || user?.role?.toUpperCase() === 'ADMIN';
      const currentIsHR = emp?.is_hr || emp?.department?.code === 'HCNS' || (user as any)?.hrm_user?.department_code === 'HCNS' || user?.role?.toUpperCase() === 'HR';

      // Gọi fetch cho các trang để lấy dữ liệu
      await Promise.all([
        fetchPendingRequests(),
        fetchApprovedRequests(),
        fetchRejectedRequests(),
        fetchWorkFinalizationData(emp, currentIsAdmin, currentIsHR),
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    if (activeTab === 'pending') {
      const emp = await fetchCurrentEmployee();
      const currentIsAdmin = emp?.user?.is_staff || emp?.user?.is_superuser || (user as any)?.is_superuser || (user as any)?.is_staff || user?.role?.toUpperCase() === 'ADMIN';
      const currentIsHR = emp?.is_hr || emp?.department?.code === 'HCNS' || (user as any)?.hrm_user?.department_code === 'HCNS' || user?.role?.toUpperCase() === 'HR';
      
      await Promise.all([
        fetchPendingRequests(),
        fetchWorkFinalizationData(emp, currentIsAdmin, currentIsHR)
      ]);
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
      return employee;
    } catch (error) {
      console.error('Error fetching current employee:', error);
      return null;
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

  const fetchWorkFinalizationData = async (empContext?: any, isAdminArg?: boolean, isHRArg?: boolean) => {
    try {
      const activeAdmin = isAdminArg !== undefined ? isAdminArg : isAdmin;
      const activeHR = isHRArg !== undefined ? isHRArg : isHR;
      const activeEmp = empContext || currentEmployee;

      console.log('🚀 [APPROVALS] Bắt đầu lấy dữ liệu chốt công (mở rộng 3 tháng, không lọc status API)...');
      const now = new Date();
      
      const fetchMonth = async (m: number, y: number) => {
        try {
          console.log(`📡 [FETCH] Checking month ${m}/${y}...`);
          const res = await workFinalizationApprovalService.list({ year: y, month: m });
          console.log(`📥 [FETCH SUCCESS] month ${m}/${y}:`, res);
          return res.results || [];
        } catch (err: any) {
          console.error(`❌ [FETCH ERROR] month ${m}/${y}:`, err.response?.data || err.message, "Status:", err.response?.status);
          return [];
        }
      };

      // Lấy tháng hiện tại
      const m0 = now.getMonth() + 1;
      const y0 = now.getFullYear();
      
      // Lấy tháng trước
      const d1 = new Date();
      d1.setMonth(d1.getMonth() - 1);
      const m1 = d1.getMonth() + 1;
      const y1 = d1.getFullYear();

      // Lấy tháng trước nữa
      const d2 = new Date();
      d2.setMonth(d2.getMonth() - 2);
      const m2 = d2.getMonth() + 1;
      const y2 = d2.getFullYear();

      const [res0, res1, res2] = await Promise.all([
        fetchMonth(m0, y0),
        fetchMonth(m1, y1),
        fetchMonth(m2, y2)
      ]);

      const combined = [...res0, ...res1, ...res2];
      
      console.log('📦 [APPROVALS] Toàn bộ dữ liệu chốt công thô (3 tháng):', combined.length, combined);

      const uniqueMap = new Map();
      combined.forEach(item => uniqueMap.set(item.id, item));
      
      // Lấy các đơn PENDING hoặc APPROVED (để Admin theo dõi)
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

      console.log('🔍 [APPROVALS] Filtering Context:', {
        user: user?.username,
        activeAdmin,
        activeHR,
        userDeptCode,
        totalPendingBeforeDeptFilter: pendingWfItems.length
      });

      // Lọc dữ liệu theo phòng ban nếu không phải Admin/HR
      let filteredWfItems = pendingWfItems;
      if (!activeAdmin) {
        if (!userDeptCode) {
          console.warn('⚠️ [APPROVALS] NO DEPT CODE found. Manager cannot see items.');
          filteredWfItems = [];
        } else {
          filteredWfItems = pendingWfItems.filter(item => {
            const itemDept = item.department_code?.toString().trim().toUpperCase();
            const userDept = userDeptCode.toString().trim().toUpperCase();
            const match = itemDept === userDept;
            console.log(`⚖️ [FILTER CHECK] Item Dept: "${itemDept}" vs User Dept: "${userDept}" => Match: ${match}`);
            return match;
          });
        }
      }
      
      console.log('✅ [APPROVALS] Final Display Data:', filteredWfItems.length, filteredWfItems);
      setWorkFinalizationApprovals(filteredWfItems);
    } catch (wfError) {
      console.error('❌ [APPROVALS] Lỗi khi lấy dữ liệu chốt công:', wfError);
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
    OVERTIME: 'Tăng ca',
    EXTRA_HOURS: 'Làm thêm giờ',
    NIGHT_SHIFT: 'Trực tối',
    LIVE: 'Live',
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
    if (req._itemType === 'ONLINE_WORK') return 'Làm việc online';
    if (req.explanation_type === 'LEAVE' || req._itemType === 'LEAVE') return 'Nghỉ phép tháng';
    
    // Đơn đăng ký (Tăng ca, Làm thêm giờ, Live, Trực tối)
    if (req._itemType === 'REGISTRATION' || req._itemType === 'OVERTIME') {
      const type = req.registration_type || (req._itemType === 'OVERTIME' ? 'OVERTIME' : '');
      return EXPLANATION_TYPE_MAP[type] || 'Đơn đăng ký';
    }
    
    if (req._itemType === 'WORK_FINALIZATION') return 'Chốt công tháng';
    
    // Mặc định là đơn giải trình
    const typeLabel = req.explanation_type ? (EXPLANATION_TYPE_MAP[req.explanation_type] || req.explanation_type) : 'Đơn giải trình';
    return typeLabel;
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

    if (isOnline) { used = owUsed; max = mOnl; label = 'Online'; }
    else if (isLeave) { used = lUsed; max = mLea; label = 'Phép'; }
    else { used = qUsed; max = mExp; label = 'Giải trình'; }

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
      
      const isHRUser = 
        currentEmployee.is_hr || 
        currentEmployee.position?.title?.toUpperCase().includes('HR') ||
        currentEmployee.department?.code === 'HCNS';

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
    const isHRUser =
      currentEmployee.is_hr ||
      currentEmployee.position?.title?.includes('HR') ||
      currentEmployee.position?.title?.includes('Nhân sự') ||
      currentEmployee.department?.name?.includes('HR') ||
      currentEmployee.department?.name?.includes('Nhân sự');
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
      if (request.direct_manager_approved === true) {
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
        } else {
          await approvalService.rejectAttendanceExplanation(targetItem.id, note);
        }
      }

      setActionModalOpen(false);
      setTargetItem(null);
      setApprovalNote('');
      fetchRequests(); // Refresh data
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
      } else {
        await attendanceService.deleteAttendanceExplanation(targetItem.id);
      }

      setDeleteModalOpen(false);
      setTargetItem(null);
      fetchRequests();
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

      const explanations = approvableItems.filter(i => i._itemType === 'EXPLANATION' || i._itemType === 'LEAVE');
      const registrations = approvableItems.filter(i => i._itemType === 'REGISTRATION' || i._itemType === 'OVERTIME');
      const onlineWorks = approvableItems.filter(i => i._itemType === 'ONLINE_WORK');

      const promises = [];
      if (explanations.length > 0) promises.push(approvalService.bulkApproveAttendanceExplanations(explanations.map(i => i.id), note));
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
      fetchAllData();
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
        explanation.hr_approved_by_name ||          // HR đã duyệt
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
    const onlineWorks = onlineWorkRequests; // Online work seems to be shared or handled differently in fetch

    // 2. Map and filter
    const mappedExplanations = explanations
      .filter(matchesTextFilters)
      .map(e => ({ ...e, _itemType: 'EXPLANATION' }));

    const mappedRegistrations = registrations
      .filter(matchesTextFilters)
      .map(r => ({
        ...r,
        _itemType: 'REGISTRATION'
      }));

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
            // Kiểm tra registration_type hoặc _itemType
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

    // 5. Group by Department -> Position for Accordion view
    const groups: Record<string, Record<string, any[]>> = {};
    sorted.forEach(item => {
      const itemEmpId = item.employee_id || (typeof item.employee === 'object' ? item.employee?.id : item.employee);
      const isMine = itemEmpId === currentEmployee?.id;

      const dept = isMine ? 'Đơn của Tôi' : (item.employee_department || item.department_name || 'Khác');
      const pos = item.employee_position || item.position_name || 'Nhân viên';

      if (!groups[dept]) groups[dept] = {};
      if (!groups[dept][pos]) groups[dept][pos] = [];
      groups[dept][pos].push(item);
    });

    // Ensure "Đơn của Tôi" is first if it exists
    const finalGroups: Record<string, Record<string, any[]>> = {};
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
      Object.values(posGroup).forEach(items => {
        count += items.length;
      });
    });
    return count;
  };


  const hasActiveFilters = filterTypes.length > 0 || filterName !== '' || filterDepartment !== '' || filterOnlyMine;

  const clearAllFilters = () => {
    setFilterTypes([]);
    setFilterName('');
    setFilterDepartment('');
    setFilterOnlyMine(false);
  };

  const getTotalFilteredCount = () => getTotalCount();

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
            <p className="text-gray-500 text-base">
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

        {/* Tabs - Scrollable on mobile */}
        <div className="border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-base ${activeTab === 'pending'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Chờ duyệt
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm font-medium px-2 py-0.5 rounded-full">
                {stats.total_pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-base ${activeTab === 'approved'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Đã duyệt
              <span className="ml-2 bg-green-100 text-green-600 text-sm font-medium px-2 py-0.5 rounded-full">
                {stats.total_approved}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-base ${activeTab === 'rejected'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Đã từ chối
              <span className="ml-2 bg-red-100 text-red-600 text-sm font-medium px-2 py-0.5 rounded-full">
                {stats.total_rejected}
              </span>
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {[
            { type: 'EXPLANATION', label: 'Đơn giải trình', count: stats.pending_explanation, color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { type: 'REGISTRATION', label: 'Đơn đăng ký', count: (stats.pending_registration || 0) + (stats.pending_overtime || 0), color: 'indigo', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            { type: 'LEAVE', label: 'Nghỉ phép tháng', count: stats.pending_leave, color: 'blue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { type: 'ONLINE_WORK', label: 'Làm việc online', count: stats.pending_online_work, color: 'teal', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => toggleFilter(item.type)}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 group ${filterTypes.includes(item.type)
                  ? `bg-${item.color}-50 border-${item.color}-300 shadow-md scale-[1.02] ring-2 ring-${item.color}-200`
                  : `bg-white border-gray-100 hover:border-${item.color}-200 hover:shadow-sm`
                }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className={`font-semibold text-xs uppercase tracking-wider ${filterTypes.includes(item.type) ? `text-${item.color}-700` : 'text-gray-400'}`}>
                    {item.label}
                  </h3>
                  <p className={`text-xl font-bold mt-1 ${filterTypes.includes(item.type) ? `text-${item.color}-800` : 'text-gray-900'}`}>
                    {item.count}
                  </p>
                </div>
                <div className={`p-1.5 rounded-lg ${filterTypes.includes(item.type) ? `bg-${item.color}-500 text-white` : `bg-${item.color}-50 text-${item.color}-600`}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
              </div>
              <div className={`mt-2 text-xs font-medium ${filterTypes.includes(item.type) ? `text-${item.color}-600` : 'text-gray-400'}`}>
                Chờ duyệt
              </div>
              <div className={`absolute -right-2 -bottom-2 w-16 h-16 bg-${item.color}-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            </button>
          ))}

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-white/90">Tháng này</h3>
              <p className="text-xl font-bold text-white mt-1">
                {stats.total_approved}
              </p>
              <div className="mt-2 text-xs font-medium text-white bg-white/20 px-2 py-0.5 rounded-full w-fit">
                Đã duyệt
              </div>
            </div>
            <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </div>


        {/* Bộ lọc */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Tên nhân viên */}
              {(isAdmin || isHR || isManagement) && (
                <div className="space-y-1.5 transition-transform duration-200">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Tìm nhân viên</label>
                  <div className="relative group">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                      type="text"
                      value={filterName}
                      onChange={e => setFilterName(e.target.value)}
                      placeholder="Tên hoặc mã số..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 bg-gray-50/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Phòng ban */}
              {(isAdmin || isHR) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Phòng ban</label>
                  <SelectBox
                    label=""
                    value={filterDepartment}
                    options={deptOptions}
                    onChange={setFilterDepartment}
                    placeholder="Tất cả phòng ban"
                  />
                </div>
              )}

              {/* Reset & Tùy chọn */}
              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-3 w-full">
                  {(isAdmin || isHR || isManagement) && (
                    <label className="flex items-center gap-2 cursor-pointer group bg-rose-50/50 border border-rose-100/50 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filterOnlyMine}
                        onChange={e => setFilterOnlyMine(e.target.checked)}
                        className="w-4 h-4 rounded-md border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-rose-700 uppercase tracking-tight">Đơn của tôi</span>
                    </label>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-all group whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Làm mới
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Loại đơn Chips */}
            <div className="border-t border-gray-50 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Phân loại đơn:</span>
                {[
                  { value: 'EXPLANATION', label: 'Đơn giải trình', count: stats.pending_explanation, color: 'amber' },
                  { value: 'REGISTRATION', label: 'Đơn đăng ký', count: (stats.pending_registration || 0) + (stats.pending_overtime || 0), color: 'indigo' },
                  { value: 'LEAVE', label: 'Nghỉ phép tháng', count: stats.pending_leave, color: 'blue' },
                  { value: 'ONLINE_WORK', label: 'Làm việc online', count: stats.pending_online_work, color: 'teal' },
                ].map(opt => {
                  const isActive = filterTypes.includes(opt.value);
                  const colorMap: Record<string, string> = {
                    amber: isActive ? 'bg-amber-500 text-white border-amber-500' : 'hover:border-amber-300 hover:text-amber-600',
                    indigo: isActive ? 'bg-indigo-500 text-white border-indigo-500' : 'hover:border-indigo-300 hover:text-indigo-600',
                    blue: isActive ? 'bg-blue-500 text-white border-blue-500' : 'hover:border-blue-300 hover:text-blue-600',
                    teal: isActive ? 'bg-teal-500 text-white border-teal-500' : 'hover:border-teal-300 hover:text-teal-600'
                  };

                  const badgeColorMap: Record<string, string> = {
                    amber: isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600',
                    indigo: isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600',
                    blue: isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600',
                    teal: isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-600'
                  };

                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleFilter(opt.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border uppercase tracking-wider flex items-center gap-2 ${isActive ? colorMap[opt.color] + ' shadow-sm' : 'bg-white text-gray-400 border-gray-100 ' + colorMap[opt.color]
                        }`}
                    >
                      {opt.label}
                      {opt.count > 0 && (
                        <span className={`px-1.5 rounded-full text-[10px] ${badgeColorMap[opt.color]}`}>
                          {opt.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-filters for Explanations */}
            {filterTypes.includes('EXPLANATION') && (
              <div className="border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    Chi tiết giải trình:
                  </span>
                  {[
                    { value: 'LATE', label: 'Đi muộn' },
                    { value: 'EARLY_LEAVE', label: 'Về sớm' },
                    { value: 'INCOMPLETE_ATTENDANCE', label: 'Quên chấm công' },
                    { value: 'BUSINESS_TRIP', label: 'Đi công tác' },
                    { value: 'FIRST_DAY', label: 'Ngày đầu đi làm' },
                  ].map(sub => {
                    const isSubActive = filterExplanationSubTypes.includes(sub.value);
                    return (
                      <button
                        key={sub.value}
                        onClick={() => toggleSubTypeFilter(sub.value)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all border ${isSubActive
                            ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm'
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-amber-200 hover:text-amber-500'
                          }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-filters for Registrations */}
            {filterTypes.includes('REGISTRATION') && (
              <div className="border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    Chi tiết đăng ký:
                  </span>
                  {[
                    { value: 'OVERTIME', label: 'Tăng ca' },
                    { value: 'EXTRA_HOURS', label: 'Làm thêm giờ' },
                    { value: 'NIGHT_SHIFT', label: 'Trực tối' },
                    { value: 'LIVE', label: 'Live' },
                  ].map(sub => {
                    const isSubActive = filterRegistrationSubTypes.includes(sub.value);
                    return (
                      <button
                        key={sub.value}
                        onClick={() => toggleRegSubTypeFilter(sub.value)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all border ${isSubActive
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-500'
                          }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border rounded-xl overflow-hidden p-12 text-center shadow-sm">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
              <p className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu...</p>
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
                <p className="text-lg font-medium text-gray-900">
                  {activeTab === 'pending' ? 'Không có yêu cầu nào chờ duyệt' : 'Không có yêu cầu nào'}
                </p>
                <p className="text-gray-500 mt-1">
                  Tất cả yêu cầu đã được xử lý hoặc không tìm thấy kết quả phù hợp.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="mt-4 text-primary-600 font-bold hover:underline">
                    Xóa bộ lọc để xem tất cả
                  </button>
                )}
              </div>
            </div>
          ) : (
            Object.entries(getGroupedRequests()).map(([deptName, posGroups]) => {
              const isDeptExpanded = expandedDepartments.includes(deptName) || (Object.keys(getGroupedRequests()).length === 1);
              const allItemsInDept = Object.values(posGroups).flat();
              const pendingInDept = allItemsInDept.filter(r => r.status === 'PENDING' && canApproveRequest(r)).length;

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
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm sm:text-base truncate">{deptName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allItemsInDept.length} đơn</span>
                          {pendingInDept > 0 && (activeTab === 'pending') && (
                            <span className="text-[10px] sm:text-xs font-black text-rose-600 flex items-center gap-1">
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
                    <div className="p-2 space-y-4 bg-gray-50/30">
                      {Object.entries(posGroups).map(([posName, items]) => {
                        const pendingInPos = items.filter(r => r.status === 'PENDING' && canApproveRequest(r)).length;

                        return (
                          <div key={posName} className="bg-white border border-gray-100 rounded-lg shadow-sm">
                            {/* Position Sub-Header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                  Vị trí: {posName}
                                </h4>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2">
                                  {items.length} đơn
                                </span>
                              </div>

                              {pendingInPos > 0 && activeTab === 'pending' && (
                                <button
                                  onClick={() => handleBulkApproveItems(items, `vị trí ${posName}`)}
                                  disabled={isBulkProcessing}
                                  className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded transition-colors flex items-center gap-1"
                                >
                                  {isBulkProcessing ? <div className="w-2.5 h-2.5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                  Duyệt tất cả {posName}
                                </button>
                              )}
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-400 uppercase">Loại đơn & Lý do</th>
                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-400 uppercase">Nhân viên</th>
                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-400 uppercase">Thời gian</th>
                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-400 uppercase">Vi phạm & Phạt</th>
                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-400 uppercase">Trạng thái</th>
                                    <th className="px-6 py-2 text-right text-xs font-bold text-gray-400 uppercase">Hành động</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {items.map((item) => {
                                    const isRegistration = item._itemType === 'REGISTRATION';
                                    const isOnlineWork = item._itemType === 'ONLINE_WORK';
                                    const isLeave = item._itemType === 'LEAVE';
                                    const isOvertime = item._itemType === 'OVERTIME';
                                    const itemKey = `${item._itemType}-${item.id}`;

                                    // Icon mapping
                                    return (
                                      <tr key={itemKey} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                          <div className="flex items-center space-x-3.5 group">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${item._itemType === 'LEAVE' ? 'bg-blue-50 text-blue-500' :
                                                item._itemType === 'OVERTIME' ? 'bg-purple-50 text-purple-500' :
                                                  item._itemType === 'ONLINE_WORK' ? 'bg-teal-50 text-teal-500' :
                                                    item._itemType === 'REGISTRATION' ? 'bg-indigo-50 text-indigo-500' :
                                                      'bg-amber-50 text-amber-500'
                                              }`}>
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                                  item._itemType === 'LEAVE' ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' :
                                                    item._itemType === 'OVERTIME' ? 'M13 10V3L4 14h7v7l9-11h-7z' :
                                                      item._itemType === 'ONLINE_WORK' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' :
                                                        item._itemType === 'REGISTRATION' ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' :
                                                          'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                                } />
                                              </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <div className="text-sm font-extrabold text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                                                  {getRequestTypeLabel(item)}
                                                </div>
                                                {renderRequestStatsBadge(item)}
                                              </div>
                                              {(() => {
                                                const requestName = getRequestTypeLabel(item);
                                                const cleanedReason = cleanReasonText(item.reason || item.work_plan || '', requestName);
                                                return cleanedReason ? (
                                                  <div className="text-[11px] text-slate-400 truncate max-w-[320px] transition-all group-hover:text-slate-500" title={cleanedReason}>
                                                    <span className="font-semibold text-slate-300 group-hover:text-slate-400 mr-1.5 uppercase tracking-tighter text-[9px]">Lý do:</span>
                                                    {cleanedReason}
                                                  </div>
                                                ) : null;
                                              })()}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900 font-bold">{item.employee_name}</div>
                                          <div className="text-xs text-gray-400 tracking-tighter">{item.employee_code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm font-semibold text-gray-700">
                                            {formatDate(item.attendance_date || item.registration_date || item.work_date || item.start_date || item.event_date || item.overtime_date)}
                                          </div>
                                          <div className="text-[11px] text-gray-400">Ngày gửi: {formatDate(item.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex flex-col gap-1.5">
                                            {(item.late_minutes > 0 || item.early_leave_minutes > 0) ? (
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.late_minutes > 0 && (
                                                  <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 border border-orange-100 rounded-md shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs font-semibold">Muộn:</span>
                                                    <span className="text-xs font-bold">{item.late_minutes} phút</span>
                                                  </div>
                                                )}
                                                {item.early_leave_minutes > 0 && (
                                                  <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 border border-orange-100 rounded-md shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                                    <span className="text-xs font-semibold">Sớm:</span>
                                                    <span className="text-xs font-bold">{item.early_leave_minutes} phút</span>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-xs text-gray-400 font-medium italic opacity-60">Không có vi phạm</span>
                                            )}
                                            {item.penalty_amount > 0 && (
                                              <div className="inline-flex items-center gap-1 bg-rose-50/70 px-2 py-0.5 rounded-lg border border-rose-100/50 w-fit mt-1 shadow-sm">
                                                <svg className="w-3.5 h-3.5 text-rose-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-bold text-rose-600 font-mono tracking-tight">
                                                  {(item.penalty_amount || 0).toLocaleString('vi-VN')}
                                                  <span className="text-xs ml-0.5 font-semibold uppercase">VNĐ</span>
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          {getStatusBadge(item)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <div className="flex justify-end items-center space-x-2">
                                            {activeTab === 'pending' ? (
                                              canApproveRequest(item) ? (
                                                <div className="flex bg-gray-50/50 border border-gray-100 rounded-lg p-1 shadow-sm">
                                                  <button
                                                    onClick={() => openApproveModal(item)}
                                                    className="p-1 px-2 text-green-600 hover:bg-green-50 rounded-md transition-colors flex items-center gap-1"
                                                    title="Duyệt nhanh"
                                                  >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    <span className="text-xs font-bold">Duyệt</span>
                                                  </button>
                                                  <div className="w-[1px] bg-gray-100 my-1 mx-1"></div>
                                                  <button
                                                    onClick={() => openRejectModal(item)}
                                                    className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Từ chối nhanh"
                                                  >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                  </button>
                                                </div>
                                              ) : null
                                            ) : null}

                                            <button
                                              onClick={() => (isOnlineWork || isRegistration || isOvertime) ? handleViewOnlineWorkDetails(item) : handleViewDetails(item)}
                                              className="p-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-xs font-bold transition-all flex items-center gap-1"
                                            >
                                              Chi tiết
                                            </button>

                                            {canDeleteRequest(item) && (
                                              <button
                                                onClick={() => openDeleteModal(item)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* BẢNG YÊU CẦU CHỜ DUYỆT RIÊNG BIỆT CHO QUẢN LÝ (Viết ở dưới theo yêu cầu) */}
        {activeTab === 'pending' && !loading && (isAdmin || isManagement) && (
          <div className="mt-12 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Phê duyệt chốt công nhân viên</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ưu tiên xử lý các đơn trong danh sách này</p>
                  </div>
                </div>
              </div>
              
              {(() => {
                const count = workFinalizationApprovals.length;
                return (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase leading-none">Số lượng phòng</div>
                      <div className="text-2xl font-black text-indigo-600 leading-none mt-1">{count}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/40">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">STT</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã NV/Phòng</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên / Đơn vị</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Số công / Chi tiết</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian gửi</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-indigo-50/30">Hành động</th>
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
                                <p className="text-slate-400 text-sm mt-2 font-medium">Bạn đã xử lý hết tất cả các đơn thuộc quyền hạn của mình.</p>
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
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-slate-300 border-r border-slate-50">
                            {(index + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black border border-slate-200 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                              {item.department_code}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-100">
                                {item.department_name?.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.department_name || item.department_code}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Chốt công tháng {item.month}/{item.year}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black text-slate-800`}>
                                  Xem chi tiết ↗
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 italic">Người gửi: {item.sent_by_name} ({item.sent_by_role || 'Admin'})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-black text-slate-700">
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
                                    className="h-9 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-xl shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95 whitespace-nowrap uppercase tracking-wider"
                                  >
                                    PHÊ DUYỆT
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(item)}
                                    className="h-9 px-6 bg-white hover:bg-rose-50 text-rose-500 text-[11px] font-black rounded-xl border border-slate-200 hover:border-rose-200 transition-all uppercase tracking-wider"
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
                                      <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">QLTT ĐÃ PHÊ DUYỆT</span>
                                    </div>
                                  ) : item.status === 'REJECTED' ? (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
                                      <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm shadow-rose-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </div>
                                      <span className="text-rose-700 font-black text-[10px] uppercase tracking-widest">QLTT ĐÃ TỪ CHỐI</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
                                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse shadow-sm shadow-amber-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <span className="text-amber-700 font-black text-[10px] uppercase tracking-widest">ĐANG CHỜ QLTT DUYỆT</span>
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
            </div>
          </div>
        )}
        
        <div className="mt-8 tracking-tight">
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
                <p className="text-gray-500 text-base mt-1">
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

      {/* Modal Chi tiết Chốt công (Danh sách nhân viên) */}
      {showWfDetailModal && selectedWfApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chi tiết bảng công {selectedWfApproval.department_name || selectedWfApproval.department_code}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tháng {selectedWfApproval.month}/{selectedWfApproval.year} • {wfEmployees.length} nhân sự</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowWfDetailModal(false);
                  setSelectedWfApproval(null);
                  setWfEmployees([]);
                }} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all font-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Công thực tế</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tăng ca</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Thêm giờ</th>
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
                          <tr key={`wf-emp-${emp.employee_id}`} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{emp.ho_va_ten}</span>
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
                              <span className="text-sm font-mono font-black text-rose-600">{(emp.tong_phat || 0) > 0 ? `${(emp.tong_phat || 0).toLocaleString('vi-VN')} VNĐ` : '-'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Toàn bộ dữ liệu đã được đối soát tự động</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedWfApproval.status === 'APPROVED' && (
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                    Bảng công đã được phê duyệt
                  </span>
                )}
                {selectedWfApproval.status === 'REJECTED' && (
                  <span className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest">
                    Bảng công đã bị từ chối
                  </span>
                )}
                {selectedWfApproval.can_approve && selectedWfApproval.status === 'PENDING' && !isAdmin && (
                  <button 
                    onClick={() => { 
                      setShowWfDetailModal(false); 
                      openApproveModal(selectedWfApproval); 
                    }} 
                    className="h-11 px-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
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
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mã định danh đơn</span>
                          <span className="text-xs font-mono font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {selectedExplanation?.request_code || selectedOnlineWorkRequest?.request_code || '---'}
                          </span>
                        </div>

                        {selectedExplanation ? (
                          <>
                            {/* Date Detail */}
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  {selectedExplanation._itemType === 'REGISTRATION' ? 'Ngày đăng ký' :
                                    selectedExplanation._itemType === 'LEAVE' ? 'Thời gian nghỉ' :
                                      'Ngày hiệu lực'}
                                </span>
                                <span className="text-sm font-black text-slate-700">
                                  {selectedExplanation._itemType === 'LEAVE'
                                    ? (selectedExplanation.start_date === selectedExplanation.end_date
                                      ? formatDate(selectedExplanation.start_date)
                                      : `${formatDate(selectedExplanation.start_date)} - ${formatDate(selectedExplanation.end_date)}`)
                                    : formatDate(selectedExplanation.attendance_date || selectedExplanation.registration_date || selectedExplanation.event_date || selectedExplanation.start_date)}
                                </span>
                            </div>

                            {/* Time Range (if applicable) */}
                            {selectedExplanation._itemType === 'REGISTRATION' && (selectedExplanation.start_time || selectedExplanation.end_time) && (
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Khung thời gian</span>
                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
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
                                      { (selectedExplanation.late_minutes > 0 || selectedExplanation.early_leave_minutes > 0) && (
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
                        <div className={`p-3 rounded-xl border transition-all ${((employeeFreqStats?.statistics?.approved_online_work ?? 0) >= (employeeFreqStats?.statistics?.max_online_work_per_month ?? 2)) ? 'bg-amber-50/60 border-amber-100' : 'bg-white border-teal-100/30'}`}>
                          <p className="text-[11px] text-gray-400 font-black uppercase mb-1.5">Online</p>
                          <div className="flex justify-between items-end">
                            <p className="text-base font-black text-gray-900 leading-none">
                              {employeeFreqStats?.statistics?.approved_online_work ?? 0}
                              <span className="text-xs text-gray-400 font-bold ml-0.5">/2</span>
                            </p>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${((employeeFreqStats?.statistics?.approved_online_work ?? 0) >= (employeeFreqStats?.statistics?.max_online_work_per_month ?? 2)) ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
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
                    setEmployeeFreqStats(null);
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
            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setActionModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-base disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isProcessing || (actionType === 'REJECT' && !approvalNote.trim())}
                onClick={confirmAction}
                className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-lg shadow-opacity-20 ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} disabled:bg-gray-400 disabled:shadow-none`}
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
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-base"
              >
                Hủy
              </button>
              <button
                disabled={isProcessing}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-base flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:bg-gray-400 disabled:shadow-none"
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
              <div className="flex gap-3">
                <button
                  onClick={() => setBulkConfirmModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={executeBulkApprove}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"
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
    </div>
  );
};

export default Approvals;
