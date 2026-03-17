import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import {
  attendanceService,
  AttendanceRecord,
  AttendanceEvent,
} from '../services/attendance.service';
import { employeesAPI, Employee } from '../utils/api';
import {
  XMarkIcon,
  DocumentPlusIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  BoltIcon,
  BriefcaseIcon,
  MoonIcon,
  VideoCameraIcon,
  HeartIcon,
  ComputerDesktopIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSupplementaryRequestModal, setShowSupplementaryRequestModal] =
    useState(false);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const isManagementUser = !!(currentEmployee?.position?.is_management || user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'HR');
  const [attendanceDetails, setAttendanceDetails] = useState<
    AttendanceRecord[]
  >([]);

  console.log('attendanceDetails', attendanceDetails);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [allExplanations, setAllExplanations] = useState<any[]>([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState<any[]>([]);
  const [monthlyWorkCredits, setMonthlyWorkCredits] = useState<any>(null);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [refreshDataTrigger, setRefreshDataTrigger] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // === Lịch sử đơn tháng ===
  const [showRequestHistoryDrawer, setShowRequestHistoryDrawer] = useState(false);
  const [monthlyRequestHistory, setMonthlyRequestHistory] = useState<{
    explanations: any[];
    registrations: any[];
    onlineWorks: any[];
    leaveRequests: any[];
  }>({
    explanations: [],
    registrations: [],
    onlineWorks: [],
    leaveRequests: [],
  });
  const [historyActiveTab, setHistoryActiveTab] = useState<'all' | 'explanation' | 'registration' | 'online_work' | 'leave'>('all');
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showNotify = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string
  ) => {
    setNotification({ show: true, type, title, message });
  };

  // Kiểm tra ngày được chọn có dữ liệu chấm công không (dùng để disable Đơn giải trình)
  const hasAttendanceData = attendanceDetails && attendanceDetails.length > 0;

  // Mapping trạng thái chấm công sang tiếng Việt
  const ATTENDANCE_STATUS_MAP: Record<string, string> = {
    PRESENT: 'Có mặt',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm',
    LATE_EARLY: 'Đi muộn/Về sớm',
    ABSENT: 'Vắng mặt',
    HALF_DAY: 'Nửa ngày',
    INCOMPLETE_ATTENDANCE: 'Quên chấm công',
  };

  // Mapping loại đơn giải trình/đăng ký sang tiếng Việt
  const EXPLANATION_TYPE_MAP: Record<string, string> = {
    LATE: 'Giải trình đi muộn',
    EARLY_LEAVE: 'Giải trình về sớm',
    INCOMPLETE_ATTENDANCE: 'Giải trình quên chấm công',
    BUSINESS_TRIP: 'Giải trình đi công tác',
    FIRST_DAY: 'Giải trình ngày đầu đi làm',
    OVERTIME: 'Đơn đăng ký tăng ca',
    EXTRA_HOURS: 'Đơn đăng ký làm thêm giờ',
    NIGHT_SHIFT: 'Đơn đăng ký trực tối',
    LIVE: 'Đơn đăng ký Live',
    LEAVE: 'Nghỉ phép tháng',
  };

  const getExplanationTypeLabel = (type: string): string =>
    EXPLANATION_TYPE_MAP[type] || type;

  // Mapping nguồn dữ liệu chấm công sang tiếng Việt
  const IMPORT_SOURCE_MAP: Record<string, string> = {
    attendance_upload: 'Tải tệp lên',
    manual_checkin: 'Chấm công thủ công',
    face_id: 'Face ID',
    fingerprint: 'Vân tay',
    system: 'Hệ thống',
  };

  // ===================== STEP-BASED FORM STATE =====================
  type ContextType =
    | 'explanation'
    | 'registration'
    | 'monthly_leave'
    | 'online_work'
    | null;
  type ExplanationReason =
    | 'late_minutes'
    | 'early_leave_minutes'
    | 'first_day'
    | 'business_trip'
    | 'incomplete_attendance';
  type RegistrationReason = 'overtime' | 'extra_hours' | 'night_shift' | 'live';
  type OnlineWorkReason = 'online_work';
  type LeaveReason = 'morning' | 'afternoon' | 'full_day';
  type ReasonType = ExplanationReason | RegistrationReason | OnlineWorkReason | LeaveReason | null;

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedContext, setSelectedContext] = useState<ContextType>(null);
  const [selectedReason, setSelectedReason] = useState<ReasonType>(null);
  const [formNote, setFormNote] = useState('');

  // Overtime (Tăng ca) state
  const [overtimeStartTime, setOvertimeStartTime] = useState('');
  const [overtimeEndTime, setOvertimeEndTime] = useState('');

  // Extra Hours (Làm thêm giờ) state - for part-time employees
  const [extraHoursStartTime, setExtraHoursStartTime] = useState('');
  const [extraHoursEndTime, setExtraHoursEndTime] = useState('');

  // Night Shift (Trực tối) state - for sales department
  const [nightShiftStartTime, setNightShiftStartTime] = useState('');
  const [nightShiftEndTime, setNightShiftEndTime] = useState('');

  // Live state - for TikTok department
  const [liveStartTime, setLiveStartTime] = useState('');
  const [liveEndTime, setLiveEndTime] = useState('');

  // Incomplete Attendance (Quên chấm công) state
  const [forgotPunchType, setForgotPunchType] = useState<'checkin' | 'checkout' | 'both'>('checkin');
  const [forgotCheckinTime, setForgotCheckinTime] = useState<string | null>(null);
  const [forgotCheckoutTime, setForgotCheckoutTime] = useState<string | null>(null);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculate overtime duration in hours
  const calculateOvertimeDuration = () => {
    if (!overtimeStartTime || !overtimeEndTime) return 0;
    const [startHour, startMin] = overtimeStartTime.split(':').map(Number);
    const [endHour, endMin] = overtimeEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  };

  // Calculate extra hours duration
  const calculateExtraHoursDuration = () => {
    if (!extraHoursStartTime || !extraHoursEndTime) return 0;
    const [startHour, startMin] = extraHoursStartTime.split(':').map(Number);
    const [endHour, endMin] = extraHoursEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  };

  // Calculate night shift duration
  const calculateNightShiftDuration = () => {
    if (!nightShiftStartTime || !nightShiftEndTime) return 0;
    const [startHour, startMin] = nightShiftStartTime.split(':').map(Number);
    const [endHour, endMin] = nightShiftEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  };

  // Calculate live duration
  const calculateLiveDuration = () => {
    if (!liveStartTime || !liveEndTime) return 0;
    const [startHour, startMin] = liveStartTime.split(':').map(Number);
    const [endHour, endMin] = liveEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  };

  const overtimeDuration = calculateOvertimeDuration();
  const extraHoursDuration = calculateExtraHoursDuration();
  const nightShiftDuration = calculateNightShiftDuration();
  const liveDuration = calculateLiveDuration();

  // Validate registration time fields
  // - Must have start and end time
  // - Duration must be positive (end > start)
  // - Minimum hours based on type
  const isRegistrationTimeValid = () => {
    // Explanation requests don't need time validation here
    if (selectedContext === 'explanation') return true;
    // Monthly leave doesn't need time validation
    if (selectedContext === 'monthly_leave') return true;
    // Online work form note is validated later or is optional
    if (selectedContext === 'online_work') return true;

    if (!selectedReason) return false;

    const MIN_HOURS = 0.5; // Default minimum for most registrations (30 minutes)

    switch (selectedReason) {
      case 'overtime':
        return (
          !!(overtimeStartTime && overtimeEndTime) &&
          overtimeDuration >= MIN_HOURS
        );
      case 'extra_hours':
        return (
          !!(extraHoursStartTime && extraHoursEndTime) &&
          extraHoursDuration >= MIN_HOURS
        );
      case 'night_shift':
        return (
          !!(nightShiftStartTime && nightShiftEndTime) &&
          nightShiftDuration >= MIN_HOURS
        );
      case 'live':
        return !!(liveStartTime && liveEndTime) && liveDuration >= MIN_HOURS;
      default:
        return true;
    }
  };

  // Get validation error message for registration
  const getRegistrationTimeError = (): string | null => {
    if (selectedContext !== 'registration') return null;

    const MIN_HOURS = 0.5;
    let hasTime = false;
    let duration = 0;

    switch (selectedReason) {
      case 'overtime':
        hasTime = !!(overtimeStartTime && overtimeEndTime);
        duration = overtimeDuration;
        break;
      case 'extra_hours':
        hasTime = !!(extraHoursStartTime && extraHoursEndTime);
        duration = extraHoursDuration;
        break;
      case 'night_shift':
        hasTime = !!(nightShiftStartTime && nightShiftEndTime);
        duration = nightShiftDuration;
        break;
      case 'live':
        hasTime = !!(liveStartTime && liveEndTime);
        duration = liveDuration;
        break;
      default:
        return null;
    }

    if (!hasTime) return null; // Don't show error until user selects times
    if (duration <= 0) return 'Giờ kết thúc phải sau giờ bắt đầu';
    if (duration < MIN_HOURS) return 'Tối thiểu 30 phút';
    return null;
  };

  const registrationTimeError = getRegistrationTimeError();

  // Reason options based on context
  const explanationReasons: {
    id: ExplanationReason;
    label: string;
    icon: string;
  }[] = [
      { id: 'late_minutes', label: 'Đi muộn', icon: 'clock' },
      { id: 'early_leave_minutes', label: 'Về sớm', icon: 'clock' },
      { id: 'incomplete_attendance', label: 'Quên chấm công', icon: 'warning' },
      { id: 'business_trip', label: 'Đi công tác', icon: 'briefcase' },
      { id: 'first_day', label: 'Ngày đầu đi làm', icon: 'calendar' },
    ];

  const registrationReasons: {
    id: RegistrationReason;
    label: string;
    icon: string;
  }[] = [
      { id: 'overtime', label: 'Tăng ca', icon: 'bolt' },
      { id: 'extra_hours', label: 'Làm thêm giờ', icon: 'clock' },
      { id: 'night_shift', label: 'Trực tối', icon: 'moon' },
      { id: 'live', label: 'Live', icon: 'video' },
    ];

  const onlineWorkReasons: {
    id: OnlineWorkReason;
    label: string;
    icon: string;
  }[] = [
      { id: 'online_work', label: 'Làm việc online', icon: 'desktop' },
    ];

  const monthlyLeaveReasons: {
    id: LeaveReason;
    label: string;
    icon: string;
  }[] = [
      { id: 'morning', label: 'Nghỉ ca sáng', icon: 'calendar' },
      { id: 'afternoon', label: 'Nghỉ ca chiều', icon: 'calendar' },
      { id: 'full_day', label: 'Nghỉ cả ngày', icon: 'calendar' },
    ];

  // Handle context selection
  const handleContextSelect = (context: ContextType) => {
    setSelectedContext(context);
    setSelectedReason(null); // Reset reason when context changes
    // Move to step 2 for contexts that have sub-reasons (including monthly_leave now)
    if (context && (context === 'explanation' || context === 'registration' || context === 'online_work' || context === 'monthly_leave')) {
      setCurrentStep(2);
    }
  };

  // Handle reason selection
  const handleReasonSelect = (reason: ReasonType) => {
    setSelectedReason(reason);
    // Set overtime end time to checkout time when selecting overtime only
    if (
      reason === 'overtime' &&
      attendanceDetails.length > 0 &&
      attendanceDetails[0]?.check_out
    ) {
      setOvertimeEndTime(attendanceDetails[0].check_out.substring(0, 5)); // Format HH:MM
    }
    // Set default start time of 21:00 for live
    if (reason === 'live') {
      setLiveStartTime('21:00');
    }
  };

  // Reset form when modal closes
  const resetSupplementaryForm = () => {
    setCurrentStep(1);
    setSelectedContext(null);
    setSelectedReason(null);
    setFormNote('');
    setOvertimeStartTime('');
    setOvertimeEndTime('');
    setExtraHoursStartTime('');
    setExtraHoursEndTime('');
    setNightShiftStartTime('');
    setNightShiftEndTime('');
    setLiveStartTime('');
    setLiveEndTime('');
    setForgotPunchType('checkin');
    setForgotCheckinTime(null);
    setForgotCheckoutTime(null);
  };

  // Icon render helper
  const renderIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-4 h-4 mr-2 ${isSelected ? 'text-purple-500' : 'text-gray-400'}`;
    switch (iconName) {
      case 'clock':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'calendar':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'bolt':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'moon':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        );
      case 'video':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case 'home':
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        );
      case 'desktop':
        return (
          <svg
            className={iconClass}
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
        );
      case 'briefcase':
        return <BriefcaseIcon className={iconClass} />;
      default:
        return null;
    }
  };
  // ===================== END STEP-BASED FORM STATE =====================
  /* Removed calendarData state */
  const [calendarSummary, setCalendarSummary] = useState<{
    total_work_days: number;
    full_days: number;
    violation_count: number;
    late_or_early_days: number;
    absent_days: number;
    forgot_checkin_days: number;
    overtime_hours: number;
    extra_hours: number;
    night_shift_sessions: number;
    live_sessions: number;
    leave_days: number;
    remaining_annual_leave?: number;
    total_late_minutes?: number;
    total_early_leave_minutes?: number;
  } | null>(null);

  // Check if user has permission to upload attendance files
  // For now, only ADMIN role can upload
  const canUploadAttendance = user?.role === 'ADMIN';

  // Effect 1: Fetch employee only on mount
  useEffect(() => {
    fetchCurrentEmployee();
  }, []);

  // Effect 2: Fetch all data when employee or date changes
  useEffect(() => {
    if (!currentEmployee) return;

    const fetchAllData = async () => {
      if (!currentEmployee || !isMounted.current) return;
      if (initialLoading) setLoading(true);

      try {
        // Tối ưu hóa: Gọi tuần tự (Sequential Await) theo ý USER
        await fetchAttendanceStats(currentEmployee, true);
        if (!isMounted.current) return;

        await fetchMonthlyWorkCredits(
          currentDate.getMonth() + 1,
          currentDate.getFullYear(),
          currentEmployee.id,
          true
        );
        if (!isMounted.current) return;

        // fetchCalendarData sẽ KHÔNG được gọi ở đây nữa để tránh Duplicate 
        // Thay vào đó dùng dữ liệu từ AttendanceCalendar truyền lên
      } catch (err) {
        console.error('Error fetching all data:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    };

    fetchAllData();
  }, [currentEmployee?.id, currentDate.getMonth(), currentDate.getFullYear()]);

  // Effect 3: Đồng bộ allExplanations và approvedRegistrations khi monthlyRequestHistory hoặc selectedDate thay đổi
  // Điều này đảm bảo khi nhấn Làm đơn bổ sung lần nữa (hoặc đang mở), dữ liệu lọc sẽ luôn mới nhất
  useEffect(() => {
    if (selectedDate && currentEmployee) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Lọc giải trình của ngày đang chọn
      const dayExplanations = monthlyRequestHistory.explanations.filter(e => 
        e.attendance_date === dateStr || (e.event_date && e.event_date === dateStr)
      );
      setAllExplanations(dayExplanations);

      // Lọc đăng ký của ngày đang chọn
      const dayRegistrations = monthlyRequestHistory.registrations.filter(r => 
        r.attendance_date === dateStr || (r.event_date && r.event_date === dateStr)
      );
      setApprovedRegistrations(dayRegistrations.filter(r => r.status === 'APPROVED'));
    }
  }, [monthlyRequestHistory, selectedDate, currentEmployee?.id]);

  const fetchCurrentEmployee = async (): Promise<Employee | null> => {
    try {
      const employee = await employeesAPI.me();
      console.log('Current employee:', employee);
      setCurrentEmployee(employee);
      return employee;
    } catch (error) {
      console.error('Error fetching current employee:', error);
      return null;
    }
  };

  const fetchAttendanceStats = async (employee?: Employee | null, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const today = currentDate || new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      // Format dates in local timezone
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Use employee parameter or currentEmployee from state
      const targetEmployee = employee || currentEmployee;

      // Fetch attendance statistics with employee_id and department_id
      const stats = await attendanceService.getAttendanceStats({
        start_date: formatDateLocal(firstDayOfMonth),
        end_date: formatDateLocal(lastDayOfMonth),
        employee_id: targetEmployee?.id,
        department_id: targetEmployee?.department?.id,
      });

      // Fetch attendance explanation statistics for current month
      let explanationStats = null;
      if (targetEmployee && targetEmployee.id) {
        try {
          console.log(
            '🔵 [STATS] Fetching explanation stats for employee:',
            targetEmployee.id
          );
          explanationStats =
            await attendanceService.getAttendanceExplanationStats({
              employee_id: targetEmployee.id,
              month: today.getMonth() + 1,
              year: today.getFullYear(),
            });
          console.log(
            '🔵 [STATS] Explanation stats response:',
            explanationStats
          );
          console.log(
            '🔵 [STATS] remaining_online_work:',
            explanationStats?.statistics?.remaining_online_work
          );
        } catch (error) {
          console.error('❌ [STATS] Error fetching explanation stats:', error);
        }
      }

      // Combine stats - merge all fields from both APIs
      const mergedStats = {
        ...stats.statistics,
        ...(explanationStats?.statistics || {}),
      };

      setAttendanceStats(mergedStats);
    } catch (error) {
      console.error('❌ [STATS] Error fetching attendance stats:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* Removed fetchAttendanceRecords function */

  const fetchMonthlyWorkCredits = async (
    month?: number,
    year?: number,
    employeeId?: number,
    silent = false
  ) => {
    try {
      const today = new Date();
      const params = {
        month: month || today.getMonth() + 1,
        year: year || today.getFullYear(),
        employee_id: employeeId || currentEmployee?.id,
      };

      const response = await attendanceService.getMonthlyWorkCredits(params);
      setMonthlyWorkCredits(response);
    } catch (error) {
      console.error('Error fetching monthly work credits:', error);
    }
  };

  // Xử lý dữ liệu trả về từ AttendanceCalendar (Tránh gọi API 2 lần)
  const handleCalendarDataLoaded = (data: { calendar: any[]; summary: any }) => {
    const { calendar: calendarArray, summary } = data;
    if (summary) {
      const totalLate = calendarArray.reduce((acc: number, d: any) => acc + (d.engine_context?.late_minutes || 0), 0);
      const totalEarly = calendarArray.reduce((acc: number, d: any) => acc + (d.engine_context?.early_leave_minutes || 0), 0);
      setCalendarSummary({
        ...summary,
        total_late_minutes: totalLate,
        total_early_leave_minutes: totalEarly,
      });
    }

    // Trích xuất lịch sử đơn từ calendarArray thay vì gọi 3 API rời rạc
    const explanations: any[] = [];
    const registrations: any[] = [];
    const onlineWorks: any[] = [];
    const leaveRequests: any[] = [];

    calendarArray.forEach((day: any) => {
      const dayRegs = day.registrations || [];
      dayRegs.forEach((r: any) => {
        const type = (r.event_type || '').toUpperCase();
        // Fallback or use event_date from data, or day.date as fallback
        const details = r.data || r;
        
        const item = { ...details };
        if (!item.created_at && day.date) {
            item.created_at = new Date(day.date).toISOString(); // fake created_at for sorting if missing
        }

        if (type === 'EXPLANATION') {
          if (details.explanation_type === 'LEAVE') {
            leaveRequests.push(item);
          } else {
            explanations.push(item);
          }
        } else if (type === 'ONLINE_WORK') {
          onlineWorks.push(item);
        } else {
          registrations.push(item);
        }
      });
    });

    // Sắp xếp các mảng theo thời gian giảm dần
    const sortByParam = (a: any, b: any) => new Date(b.created_at || b.event_date || 0).getTime() - new Date(a.created_at || a.event_date || 0).getTime();
    
    explanations.sort(sortByParam);
    registrations.sort(sortByParam);
    onlineWorks.sort(sortByParam);
    leaveRequests.sort(sortByParam);

    setMonthlyRequestHistory({
      explanations,
      registrations,
      onlineWorks,
      leaveRequests,
    });
  };

  // Cập nhật dữ liệu
  const refreshAllData = async () => {
    if (currentEmployee) {
      console.log('🔄 [REFRESH] Synchronous data refresh triggered...');
      setLoading(true);
      try {
        await Promise.all([
          fetchAttendanceStats(currentEmployee, true),
          fetchMonthlyWorkCredits(
            currentDate.getMonth() + 1,
            currentDate.getFullYear(),
            currentEmployee.id,
            true
          ),
          // Nếu đang mở Modal chi tiết ngày, fetch lại chi tiết ngày đó
          selectedDate ? fetchAttendanceDetailsForDate(selectedDate) : Promise.resolve(),
        ]);

        // RefreshTrigger sẽ điều khiển AttendanceCalendar tự fetch
        setRefreshDataTrigger((prev) => prev + 1);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchAttendanceDetailsForDate = async (date: Date) => {
    try {
      setFetchingDetails(true);
      // Format date to YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Fetch attendance records for the selected date
      const response = await attendanceService.getAttendanceRecords({
        start_date: dateStr,
        end_date: dateStr,
        employee_id: currentEmployee?.id,
        department_id: currentEmployee?.department?.id,
        page_size: 10,
      });

      setAttendanceDetails(response.results);

      // Cập nhật lại penaltyAmount từ record mới nhất nếu có
      if (response.results && response.results.length > 0) {
        const record = response.results[0];
        // Ưu tiên dùng dữ liệu từ engine nếu có (engine_summary hoặc engine_context thường được map vào record ở BE)
        // Nếu không có trường penalty tổng, ta cộng late + early
        const newPenalty = (record.late_penalty || 0) + (record.early_leave_penalty || 0);
        setPenaltyAmount(newPenalty);
      }
      
      return response.results;
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      setAttendanceDetails([]);
      return [];
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleDateClick = async (date: Date, dayData?: any) => {
    setSelectedDate(date);
    setShowAttendanceModal(true);

    // Set approved requests từ dayData ngay lập tức (không reset về mảng rỗng)
    setAllExplanations(dayData?.allExplanations || []);
    setApprovedRegistrations(dayData?.approvedRegistrations || []);
    setPenaltyAmount(dayData?.engine_context?.penalty_amount || 0);

    // Fetch chi tiết bản ghi (bao gồm Lịch sử sự kiện)
    await fetchAttendanceDetailsForDate(date);
  };

  const handleCloseModal = () => {
    setShowAttendanceModal(false);
    setSelectedDate(null);
    setAllExplanations([]);
  };

  const handleOpenSupplementaryRequest = () => {
    setShowSupplementaryRequestModal(true);
  };

  const handleCloseSupplementaryRequest = () => {
    setShowSupplementaryRequestModal(false);
    resetSupplementaryForm();
  };

  const handleSupplementaryRequestChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === 'note') setFormNote(value);
  };

  const handleSubmitSupplementaryRequest = async () => {
    if (!selectedDate || !currentEmployee || !selectedContext) {
      showNotify(
        'error',
        'Thông tin chưa đầy đủ',
        'Vui lòng hoàn thành thông tin trước khi gửi.'
      );
      return;
    }

    if (!formNote?.trim() && selectedReason !== 'incomplete_attendance' && selectedContext !== 'monthly_leave') {
      showNotify(
        'error',
        'Thiếu ghi chú',
        'Vui lòng nhập ghi chú/lý do trước khi gửi đơn.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Get original status from attendance details
      let originalStatus = 'ABSENT';
      if (attendanceDetails.length > 0) {
        originalStatus = attendanceDetails[0].status;
      }

      // Format date to YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Construct reason string
      let reasonLabel = '';
      if (selectedContext === 'explanation') {
        reasonLabel =
          explanationReasons.find((r) => r.id === selectedReason)?.label || '';
      } else if (selectedContext === 'registration') {
        reasonLabel =
          registrationReasons.find((r) => r.id === selectedReason)?.label || '';
      } else if (selectedContext === 'online_work') {
        reasonLabel = 'Làm việc online';
      } else if (selectedContext === 'monthly_leave') {
        const leaveMap: Record<string, string> = {
          morning: 'Nghỉ ca sáng',
          afternoon: 'Nghỉ ca chiều',
          full_day: 'Nghỉ cả ngày',
        };
        reasonLabel = leaveMap[selectedReason as string] || 'Nghỉ phép tháng';
      }

      let finalReason = formNote
        ? (reasonLabel ? `${reasonLabel}: ${formNote}` : formNote)
        : reasonLabel;

      // Đặc biệt cho nghỉ phép: Ưu tiên note, nếu không có note thì dùng label (ca sáng/chiều)
      if (selectedContext === 'monthly_leave') {
        finalReason = formNote || reasonLabel;
      }

      // Map expected status
      let expectedStatus = 'PRESENT';
      if (selectedContext === 'monthly_leave') {
        // Nếu nghỉ cả ngày thì expected là ABSENT (để BE tính 1 công)
        // Nếu nghỉ ca sáng/chiều thì expected là HALF_DAY (để BE tính 0.5 công)
        expectedStatus = selectedReason === 'full_day' ? 'ABSENT' : 'HALF_DAY';
      }

      let result;
      if (selectedContext === 'online_work') {
        const onlineWorkData = {
          employee_id: currentEmployee.id,
          work_date: dateStr, // Sử dụng work_date thay vì attendance_date
          work_plan: formNote || 'Làm việc online', // Thêm work_plan
          reason: finalReason,
          status: 'PENDING',
        };

        console.log(
          '🔵 [ONLINE WORK] Data gửi lên API:',
          JSON.stringify(onlineWorkData, null, 2)
        );

        try {
          result =
            await attendanceService.createOnlineWorkRequest(onlineWorkData);
          console.log('✅ [ONLINE WORK] API Response:', result);

          await refreshAllData();

          showNotify(
            'success',
            'Thành công',
            'Đơn làm việc online đã được gửi thành công!'
          );
        } catch (error: any) {
          console.error('❌ [ONLINE WORK] Lỗi khi tạo đơn:', error);
          console.error(
            '❌ [ONLINE WORK] Error response:',
            error.response?.data
          );

          // Hiển thị error message từ Backend
          let errorMessage = 'Lỗi khi tạo đơn làm việc online';

          if (error.response?.data?.detail) {
            // Backend trả về error message cụ thể (ví dụ: duplicate date)
            errorMessage = error.response.data.detail;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = `Lỗi: ${error.message}`;
          }

          showNotify('error', 'Lỗi gửi đơn', errorMessage);
          return;
        }
      } else if (selectedContext === 'registration') {
        // Tách riêng logic xử lý cho từng loại đơn đăng ký để đảm bảo tính chính xác và thông báo rõ ràng
        if (selectedReason === 'overtime') {
          // 1. Phân đoạn gửi Đơn Tăng ca (Overtime)
          const overtimeData = {
            employee_id: currentEmployee.id,
            attendance_date: dateStr,
            registration_type: 'OVERTIME' as const,
            start_time: overtimeStartTime,
            end_time: overtimeEndTime,
            reason: finalReason,
            status: 'PENDING' as const,
          };
          result = await attendanceService.createRegistrationRequest(overtimeData);
          await refreshAllData();
          showNotify('success', 'Thành công', 'Đơn đăng ký tăng ca đã được gửi thành công!');
        } else if (selectedReason === 'extra_hours') {
          // 2. Phân đoạn gửi Đơn Làm thêm giờ (Extra Hours - Thường dành cho Part-time)
          const extraHoursData = {
            employee_id: currentEmployee.id,
            attendance_date: dateStr,
            registration_type: 'EXTRA_HOURS' as const,
            start_time: extraHoursStartTime,
            end_time: extraHoursEndTime,
            reason: finalReason,
            status: 'PENDING' as const,
          };
          result = await attendanceService.createRegistrationRequest(extraHoursData);
          await refreshAllData();
          showNotify('success', 'Thành công', 'Đơn làm thêm giờ đã được gửi thành công!');
        } else {
          // 3. Các loại đăng ký khác (Trực tối, Live)
          const otherRegMap: Record<string, 'NIGHT_SHIFT' | 'LIVE'> = {
            night_shift: 'NIGHT_SHIFT',
            live: 'LIVE',
          };
          const regType = otherRegMap[selectedReason as string] || 'NIGHT_SHIFT';
          const startTime = selectedReason === 'night_shift' ? nightShiftStartTime : liveStartTime;
          const endTime = selectedReason === 'night_shift' ? nightShiftEndTime : liveEndTime;

          const otherRegData = {
            employee_id: currentEmployee.id,
            attendance_date: dateStr,
            registration_type: regType,
            start_time: startTime,
            end_time: endTime,
            reason: finalReason,
            status: 'PENDING' as const,
          };
          result = await attendanceService.createRegistrationRequest(otherRegData);
          await refreshAllData();
          showNotify('success', 'Thành công', `Đơn đăng ký ${selectedReason === 'live' ? 'Live' : 'trực tối'} đã gửi thành công!`);
        }
      } else {
        // Giải trình (LATE, EARLY_LEAVE, INCOMPLETE_ATTENDANCE, BUSINESS_TRIP, FIRST_DAY)
        const explanationTypeMap: Record<string, string> = {
          late_minutes: 'LATE',
          early_leave_minutes: 'EARLY_LEAVE',
          incomplete_attendance: 'INCOMPLETE_ATTENDANCE',
          business_trip: 'BUSINESS_TRIP',
          first_day: 'FIRST_DAY',
        };
        let explanationType = explanationTypeMap[selectedReason as string] || 'LATE';

        // Đảm bảo đơn nghỉ phép tháng có type là LEAVE
        if (selectedContext === 'monthly_leave') {
          explanationType = 'LEAVE';
        }

        console.log('🔍 DEBUG explanation_type mapping:', {
          selectedContext,
          selectedReason,
          explanationType,
          finalReason,
        });

        const explanationData: any = {
          employee_id: currentEmployee.id,
          attendance_date: dateStr,
          original_status: originalStatus,
          expected_status: expectedStatus,
          reason: finalReason,
          explanation_type: explanationType,
          status: 'PENDING',
        };

        if (explanationType === 'INCOMPLETE_ATTENDANCE') {
          explanationData.actual_check_in = forgotCheckinTime;
          explanationData.actual_check_out = forgotCheckoutTime;
        }

        // Gửi kèm tiền phạt và số phút của vi phạm tương ứng (Snapshot data)
        const record = attendanceDetails[0];
        if (record) {
          if (explanationType === 'LATE') {
            explanationData.late_penalty = record.late_penalty;
            explanationData.late_minutes = record.late_minutes;
          } else if (explanationType === 'EARLY_LEAVE') {
            explanationData.early_leave_penalty = record.early_leave_penalty;
            explanationData.early_leave_minutes = record.early_leave_minutes;
          } else if (explanationType === 'BUSINESS_TRIP') {
            // Đối với đi công tác, gửi kèm tất cả vi phạm hiện có để BE xử lý miễn giảm snapshot
            if (record.late_minutes > 0) {
              explanationData.late_penalty = record.late_penalty;
              explanationData.late_minutes = record.late_minutes;
            }
            if (record.early_leave_minutes > 0) {
              explanationData.early_leave_penalty = record.early_leave_penalty;
              explanationData.early_leave_minutes = record.early_leave_minutes;
            }
          }
        }

        result = await attendanceService.createAttendanceExplanation(explanationData);

        await refreshAllData();
        const successMsg = selectedContext === 'monthly_leave'
          ? `Đơn ${reasonLabel} đã được gửi thành công!`
          : 'Đơn bổ sung công đã được gửi thành công!';
        showNotify('success', 'Thành công', successMsg);

        // Nếu là đơn giải trình, không đóng modal mà reset về bước 2 (Chọn lý do)
        // để người dùng có thể làm tiếp các đơn khác (ví dụ xong đi muộn còn về sớm)
        if (selectedContext === 'explanation') {
          const prevContext = selectedContext;
          resetSupplementaryForm();
          setSelectedContext(prevContext);
          setCurrentStep(2);
          return; // Dừng lại ở đây, không gọi handleClose...
        }
      }

      handleCloseSupplementaryRequest();
    } catch (error: any) {
      console.error('Error submitting supplementary request:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (selectedContext === 'online_work'
          ? 'Gửi đơn làm việc online thất bại. Vui lòng thử lại.'
          : 'Gửi đơn bổ sung công thất bại. Vui lòng thử lại.');
      showNotify('error', 'Lỗi hệ thống', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage({ type: 'error', text: 'Vui lòng chọn file để upload' });
      return;
    }

    // Check file type (allow Excel, CSV, etc.)
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values',
    ];

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)
    ) {
      setUploadMessage({
        type: 'error',
        text: 'Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)',
      });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      // Upload file using attendance service
      const result = await attendanceService.uploadAttendanceFile(selectedFile);

      setUploadMessage({
        type: 'success',
        text: `Upload file "${selectedFile.name}" thành công! ${result.message || 'Dữ liệu đang được xử lý.'}`,
      });
      setSelectedFile(null);

      // Clear file input
      const fileInput = document.getElementById(
        'attendance-file'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh attendance data
      await refreshAllData();
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Upload thất bại. Vui lòng thử lại.';
      setUploadMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-2.5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chấm công</h1>
          <p className="text-gray-600 mt-2">
            Theo dõi và quản lý chấm công, đi muộn, về sớm, nghỉ phép của nhân
            viên.
          </p>
        </div>
        <button
          onClick={() => {
            setShowRequestHistoryDrawer(true);
            setHistoryActiveTab('all');
          }}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-xl shadow-sm hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Lịch sử đơn tháng</span>
          <span className="sm:hidden">Lịch sử</span>
          {/* Badge tổng số đơn */}
          {(monthlyRequestHistory.explanations.length + monthlyRequestHistory.registrations.length + monthlyRequestHistory.onlineWorks.length) > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-purple-600 text-white rounded-full">
              {monthlyRequestHistory.explanations.length + monthlyRequestHistory.registrations.length + monthlyRequestHistory.onlineWorks.length}
            </span>
          )}
        </button>
      </div>

      {/* Upload Section - Only visible for users with permission */}
      {canUploadAttendance && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Upload file chấm công
              </h2>
              <p className="text-gray-500 text-sm">
                Upload file Excel hoặc CSV để import dữ liệu chấm công
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p className="text-gray-600 mb-2">
                Kéo thả file vào đây hoặc click để chọn file
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)
              </p>

              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  <span>Chọn file</span>
                  <input
                    id="attendance-file"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>

                {selectedFile && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className={`px-4 py-2 rounded-md transition-colors ${uploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                  >
                    {uploading ? 'Đang upload...' : 'Upload'}
                  </button>
                )}
              </div>

              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md w-full max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-gray-700 font-medium truncate">
                        {selectedFile.name}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              )}

              {uploadMessage && (
                <div
                  className={`mt-4 p-3 rounded-md w-full max-w-md ${uploadMessage.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                    }`}
                >
                  <div className="flex items-center">
                    {uploadMessage.type === 'success' ? (
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
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
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <span>{uploadMessage.text}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium mb-1">Hướng dẫn:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                File cần có cấu trúc cột: Mã NV, Tên NV, Ngày, Giờ vào, Giờ ra,
                Ghi chú
              </li>
              <li>Định dạng ngày: DD/MM/YYYY hoặc YYYY-MM-DD</li>
              <li>Định dạng giờ: HH:MM (24h)</li>
              <li>Dung lượng file tối đa: 10MB</li>
            </ul>
          </div>
        </div>
      )}

      {/* Skeleton Loading for Stats */}
      {loading && initialLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-50 h-32 rounded-2xl animate-pulse border border-gray-100"></div>
          ))}
        </div>
      )}

      {/* Summary Statistics - Responsive Grid */}
      {!initialLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {/* === KPIs chính === */}
          <div className="group bg-white p-4 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tháng này</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Tổng ngày công</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {calendarSummary?.total_work_days ?? monthlyWorkCredits?.results?.[0]?.attendance_summary?.total_days ?? 0}
              </span>
              <span className="text-sm text-gray-500">ngày</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Ổn định</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Ngày đủ công</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {calendarSummary?.full_days ?? 0}
              </span>
              <span className="text-sm text-gray-500">ngày</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-2xl shadow-sm border border-yellow-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cần chú ý</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Số phút Muộn/Sớm</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {(calendarSummary?.total_late_minutes || 0) + (calendarSummary?.total_early_leave_minutes || 0)}
              </span>
              <span className="text-sm text-gray-500">phút</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-2xl shadow-sm border border-red-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <NoSymbolIcon className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cảnh báo</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Số ngày Vắng mặt</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {calendarSummary?.absent_days ?? 0}
              </span>
              <span className="text-sm text-gray-500">ngày</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Chưa hoàn thành</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Quên chấm công</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {calendarSummary?.forgot_checkin_days ?? 0}
              </span>
              <span className="text-sm text-gray-500">ngày</span>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton Loading for Secondary Stats */}
      {loading && initialLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-10">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-gray-50 h-24 rounded-xl animate-pulse border border-gray-100"></div>
          ))}
        </div>
      )}

      {/* Công việc bổ sung & Hạn mức */}
      {!initialLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-10">
          {/* === Công việc bổ sung / Loại hình làm việc === */}
          <div className="group bg-white p-4 rounded-xl border border-amber-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <BoltIcon className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Tăng ca</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600">
                {calendarSummary?.overtime_hours ?? 0}
              </span>
              <span className="text-[10px] text-amber-500 font-medium">giờ</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-xl border border-violet-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-50 rounded-lg">
                <BriefcaseIcon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Làm thêm</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-violet-600">
                {calendarSummary?.extra_hours ?? 0}
              </span>
              <span className="text-[10px] text-violet-500 font-medium">giờ</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <MoonIcon className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Trực tối</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-600">
                {calendarSummary?.night_shift_sessions ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">ca</span>
            </div>
          </div>

          <div className="group bg-white p-4 rounded-xl border border-rose-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 rounded-lg">
                <VideoCameraIcon className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Live</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-600">
                {calendarSummary?.live_sessions ?? 0}
              </span>
              <span className="text-[10px] text-rose-500 font-medium">ca</span>
            </div>
          </div>

          {/* === Hạn mức còn lại === */}
          {(() => {
            const maxMonthlyLeave = 1;
            const usedMonthlyLeave = monthlyRequestHistory?.leaveRequests?.length || 0;
            const remainingMonthlyLeave = Math.max(0, maxMonthlyLeave - usedMonthlyLeave);

            return (
              <div className="group bg-white p-4 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <HeartIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Nghỉ phép tháng</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-indigo-600">
                    {remainingMonthlyLeave}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-medium">/{maxMonthlyLeave} lần</span>
                </div>
              </div>
            );
          })()}

          {isManagementUser &&
            (() => {
              const maxOnline = attendanceStats?.max_online_work_per_month || 2;
              const usedOnline = (attendanceStats?.max_online_work_per_month || 0) - (attendanceStats?.remaining_online_work || 0);
              const remainingOnline = Math.max(0, maxOnline - usedOnline);

              return (
                <div className="group bg-white p-4 rounded-xl border border-teal-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-teal-50 rounded-lg">
                      <ComputerDesktopIcon className="h-5 w-5 text-teal-600" />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Online</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-teal-600">
                      {remainingOnline}
                    </span>
                    <span className="text-[10px] text-teal-500 font-medium">/{maxOnline} lần</span>
                  </div>
                </div>
              );
            })()}

          {attendanceStats?.max_explanations_per_month > 0 && (
            <div className="group bg-white p-4 rounded-xl border border-cyan-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Giải trình công</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-cyan-600">
                  {attendanceStats?.remaining_explanations || 0}
                </span>
                <span className="text-[10px] text-cyan-500 font-medium">/{attendanceStats?.max_explanations_per_month || 0} lần</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Section */}
      <div className="mb-6">
        <AttendanceCalendar
          onDateClick={handleDateClick}
          onMonthChange={(date: Date) => setCurrentDate(date)}
          employeeId={currentEmployee?.id}
          refreshTrigger={refreshDataTrigger}
          onDataLoaded={handleCalendarDataLoaded}
        />
      </div>

      {/* Attendance Details Modal */}
      {showAttendanceModal && selectedDate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-t-lg sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-100 sm:mx-0">
                    <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base md:text-lg leading-6 font-bold text-gray-900">
                        Chi tiết ngày {selectedDate.toLocaleDateString('vi-VN')}
                      </h3>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-500 p-1"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Thông tin chi tiết về chấm công cho ngày đã chọn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Employee Info */}
                  <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3 shrink-0">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">
                          {currentEmployee?.full_name || 'Nhân viên'}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          Mã NV: {currentEmployee?.employee_id || '---'} • {currentEmployee?.position?.title || 'Chức vụ'}
                        </p>
                      </div>
                    </div>
                    {penaltyAmount > 0 && (
                      <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-2 rounded-xl shadow-md border border-red-700 animate-pulse">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest opacity-80 leading-none mb-1">Cần thanh toán Phạt</p>
                          <p className="text-lg font-black leading-none">{penaltyAmount.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {penaltyAmount > 0 && (
                    <div className="mb-6 p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-700 italic">
                      <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                      Lưu ý: Số tiền phạt được hệ thống tự động tính dựa trên quy định đi muộn/về sớm của công ty.
                    </div>
                  )}



                  {/* Attendance Details Table */}
                  <div className="border rounded-lg overflow-hidden">
                    {fetchingDetails ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-600">
                          Đang tải chi tiết chấm công...
                        </p>
                      </div>
                    ) : attendanceDetails.length > 0 ? (
                      <>
                        {/* Desktop: Table */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ca làm
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Giờ vào
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Giờ ra
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tổng giờ
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ghi chú / Vi phạm
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceDetails.map((record, index) => (
                              <tr key={record.id || index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {record.shift_type_display || 'Cả ngày'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {(() => {
                                    if (
                                      (record.status === 'INCOMPLETE_ATTENDANCE' ||
                                        record.status === 'ABSENT' ||
                                        record.status === 'HALF_DAY') &&
                                      record.check_in &&
                                      !record.check_out
                                    ) {
                                      const checkInTime =
                                        record.check_in.substring(0, 5);
                                      if (checkInTime >= '12:00')
                                        return '--:--';
                                    }
                                    return record.check_in
                                      ? new Date(
                                        `2000-01-01T${record.check_in}`
                                      ).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                      : '--:--';
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {(() => {
                                    if (
                                      (record.status === 'INCOMPLETE_ATTENDANCE' ||
                                        record.status === 'ABSENT' ||
                                        record.status === 'HALF_DAY') &&
                                      record.check_in &&
                                      !record.check_out
                                    ) {
                                      const checkInTime =
                                        record.check_in.substring(0, 5);
                                      if (checkInTime >= '12:00') {
                                        return new Date(
                                          `2000-01-01T${record.check_in}`
                                        ).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        });
                                      }
                                    }
                                    return record.check_out
                                      ? new Date(
                                        `2000-01-01T${record.check_out}`
                                      ).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                      : '--:--';
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {record.working_hours
                                    ? `${Number(record.working_hours).toFixed(1)} giờ`
                                    : '0 giờ'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'LEAVE'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : record.status === 'INCOMPLETE_ATTENDANCE' ||
                                        ((record.check_in || record.check_out) &&
                                          (!record.check_in || !record.check_out))
                                        ? 'bg-purple-100 text-purple-800'
                                        : record.status === 'PRESENT'
                                          ? 'bg-green-100 text-green-800'
                                          : record.status === 'LATE' ||
                                            record.status === 'EARLY_LEAVE' ||
                                            record.status === 'LATE_EARLY'
                                            ? 'bg-amber-100 text-amber-800'
                                            : record.status === 'ABSENT'
                                              ? 'bg-red-100 text-red-800'
                                              : record.status === 'HALF_DAY'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {record.status === 'INCOMPLETE_ATTENDANCE' ||
                                      ((record.check_in || record.check_out) &&
                                        (!record.check_in || !record.check_out))
                                      ? 'Quên chấm công'
                                      : record.status_display ||
                                      ATTENDANCE_STATUS_MAP[record.status] ||
                                      (record.status === 'PRESENT' ? 'Đủ công' : record.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="space-y-1">
                                    {record.notes && <div>{record.notes}</div>}
                                    {(record.late_minutes > 0 ||
                                      record.early_leave_minutes > 0) && (
                                        <div className="text-xs text-gray-600">
                                          {record.late_minutes > 0 && (
                                            <div>
                                              Đi muộn: {record.late_minutes} phút
                                            </div>
                                          )}
                                          {record.early_leave_minutes > 0 && (
                                            <div>
                                              Về sớm: {record.early_leave_minutes}{' '}
                                              phút
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    {!record.notes &&
                                      record.late_minutes === 0 &&
                                      record.early_leave_minutes === 0 && (
                                        <div>-</div>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Mobile: Card layout */}
                        <div className="md:hidden divide-y divide-gray-100">
                          {attendanceDetails.map((record, index) => {
                            const checkIn = (() => {
                              if (
                                (record.status === 'INCOMPLETE_ATTENDANCE' ||
                                  record.status === 'ABSENT' ||
                                  record.status === 'HALF_DAY') &&
                                record.check_in &&
                                !record.check_out
                              ) {
                                if (record.check_in.substring(0, 5) >= '12:00')
                                  return '--:--';
                              }
                              return record.check_in
                                ? new Date(
                                  `2000-01-01T${record.check_in}`
                                ).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : '--:--';
                            })();
                            const checkOut = (() => {
                              if (
                                (record.status === 'INCOMPLETE_ATTENDANCE' ||
                                  record.status === 'ABSENT' ||
                                  record.status === 'HALF_DAY') &&
                                record.check_in &&
                                !record.check_out
                              ) {
                                if (
                                  record.check_in.substring(0, 5) >= '12:00'
                                ) {
                                  return new Date(
                                    `2000-01-01T${record.check_in}`
                                  ).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                }
                              }
                              return record.check_out
                                ? new Date(
                                  `2000-01-01T${record.check_out}`
                                ).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : '--:--';
                            })();

                            return (
                              <div
                                key={record.id || index}
                                className="p-3 space-y-2"
                              >
                                {/* Row 1: Shift name + Status badge */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {record.shift_type_display || 'Cả ngày'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${record.status === 'LEAVE'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : record.status === 'INCOMPLETE_ATTENDANCE' ||
                                        ((record.check_in || record.check_out) &&
                                          (!record.check_in || !record.check_out))
                                        ? 'bg-purple-100 text-purple-800'
                                        : record.status === 'PRESENT'
                                          ? 'bg-green-100 text-green-800'
                                          : record.status === 'LATE' ||
                                            record.status === 'EARLY_LEAVE' ||
                                            record.status === 'LATE_EARLY'
                                            ? 'bg-amber-100 text-amber-800'
                                            : record.status === 'ABSENT'
                                              ? 'bg-red-100 text-red-800'
                                              : record.status === 'HALF_DAY'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {record.status === 'INCOMPLETE_ATTENDANCE' ||
                                      ((record.check_in || record.check_out) &&
                                        (!record.check_in || !record.check_out))
                                      ? 'Quên chấm công'
                                      : record.status_display ||
                                      ATTENDANCE_STATUS_MAP[record.status] ||
                                      (record.status === 'PRESENT' ? 'Đủ công' : record.status)}
                                  </span>
                                </div>
                                {/* Row 2: Times + Hours */}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span className="font-mono">
                                    {checkIn} &rarr; {checkOut}
                                  </span>
                                  <span className="text-gray-400">|</span>
                                  <span>
                                    {record.working_hours
                                      ? `${Number(record.working_hours).toFixed(1)}h`
                                      : '0h'}
                                  </span>
                                </div>
                                {/* Row 3: Notes/penalties (if any) */}
                                {(record.notes ||
                                  record.late_minutes > 0 ||
                                  record.early_leave_minutes > 0) && (
                                    <div className="text-xs text-gray-500">
                                      {record.notes && (
                                        <span>{record.notes}</span>
                                      )}
                                      {record.late_minutes > 0 && (
                                        <span className="text-orange-600">
                                          {record.notes ? ' · ' : ''}Muộn{' '}
                                          {record.late_minutes} phút
                                        </span>
                                      )}
                                      {record.early_leave_minutes > 0 && (
                                        <span className="text-orange-600">
                                          {record.notes || record.late_minutes > 0
                                            ? ' · '
                                            : ''}
                                          Sớm {record.early_leave_minutes} phút
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="mt-2 text-gray-600">
                          Không có dữ liệu chấm công cho ngày này
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Events Timeline */}
                  {(() => {
                    // Extract all events and expand registration approvals into virtual events for the timeline
                    const allEvents: any[] = [];
                    attendanceDetails.forEach((r) => {
                      (r.events || []).forEach((ev) => {
                        // Chỉ skip các approval event đã được "synthetic expansion" (vượt qua filter phía dưới)
                        // Giữ lại các event REJECT để hiển thị chi tiết lý do từ chối
                        if (
                          ['request_approval', 'explanation_approval'].includes(
                            ev.event_type
                          ) && (ev.data?.action === 'APPROVE' || ev.data?.status === 'APPROVED')
                        )
                          return;

                        allEvents.push({
                          ...ev,
                          recordStatus: r.status,
                          recordStatusDisplay: r.status_display,
                        });

                        // Expand registrations and explanations into separate approval steps if they exist
                        if (
                          [
                            'overtime',
                            'extra_hours',
                            'night_shift',
                            'live',
                            'livestream',
                            'explanation',
                          ].includes(ev.event_type)
                        ) {
                          if (ev.data?.direct_manager_approved_by_name) {
                            allEvents.push({
                              id: `v-dm-${ev.id}`,
                              event_type: 'registration_approval',
                              created_at: new Date(
                                new Date(ev.created_at).getTime() + 1000
                              ).toISOString(),
                              data: {
                                approval_level: 'DIRECT_MANAGER',
                                approved_by_name:
                                  ev.data.direct_manager_approved_by_name,
                                status: 'APPROVED',
                                registration_type:
                                  ev.data.registration_type || ev.event_type,
                              },
                            });
                          }
                          // Only show HR approval if NOT created by HR and NOT for an HR employee
                          const isStaffHR =
                            ev.is_hr_created ||
                            ev.employee_is_hr ||
                            ev.data?.employee_is_hr;
                          if (ev.data?.hr_approved_by_name && !isStaffHR) {
                            allEvents.push({
                              id: `v-hr-${ev.id}`,
                              event_type: 'registration_approval',
                              created_at: new Date(
                                new Date(ev.created_at).getTime() + 2000
                              ).toISOString(),
                              data: {
                                approval_level: 'HR',
                                approved_by_name: ev.data.hr_approved_by_name,
                                status: 'APPROVED',
                                registration_type:
                                  ev.data.registration_type || ev.event_type,
                              },
                            });
                          }
                        }
                      });
                    });

                    const sortedEvents = [...allEvents].sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    );

                    const hasAnyPunch = attendanceDetails.some(
                      (r) => r.check_in || r.check_out
                    );
                    const filteredEvents = sortedEvents.filter((ev) => {
                      if (ev.event_type === 'attendance' && !hasAnyPunch)
                        return false;
                      return true;
                    });

                    if (filteredEvents.length === 0) return null;
                    const eventTypeLabel: Record<string, string> = {
                      attendance: 'Chấm công',
                      explanation: 'Giải trình',
                      explanation_approval: 'Phê duyệt giải trình',
                      request_approval: 'Phê duyệt đơn',
                      registration_approval: 'Phê duyệt đăng ký',
                      overtime: 'Tăng ca',
                      livestream: 'Livestream',
                    };
                    const statusLabel: Record<string, string> = {
                      ...ATTENDANCE_STATUS_MAP,
                      APPROVED: 'Đã duyệt',
                      REJECTED: 'Từ chối',
                      PENDING: 'Chờ duyệt',
                    };
                    const approvalLevelLabel: Record<string, string> = {
                      DIRECT_MANAGER: 'Quản lý trực tiếp',
                      HR: 'HR',
                    };
                    const isApproved = (ev: AttendanceEvent) => {
                      if (
                        (ev.event_type === 'explanation' ||
                          ['overtime', 'extra_hours', 'night_shift', 'live', 'livestream'].includes(ev.event_type) ||
                          ev.event_type === 'registration_approval') &&
                        ev.data?.status === 'APPROVED'
                      )
                        return true;
                      if (
                        (ev.event_type === 'explanation_approval' || ev.event_type === 'request_approval') &&
                        (ev.data?.action === 'APPROVE' || ev.data?.status === 'APPROVED')
                      )
                        return true;
                      return false;
                    };

                    const isRejected = (ev: AttendanceEvent) => {
                      if (
                        (ev.event_type === 'explanation' ||
                          ['overtime', 'extra_hours', 'night_shift', 'live', 'livestream', 'request_approval', 'registration_approval'].includes(ev.event_type)) &&
                        ev.data?.status === 'REJECTED'
                      )
                        return true;
                      if (
                        (ev.event_type === 'explanation_approval' || ev.event_type === 'request_approval') &&
                        ev.data?.action === 'REJECT'
                      )
                        return true;
                      return false;
                    };
                    return (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                          Lịch sử sự kiện
                        </h4>
                        <ol className="relative border-l border-gray-200 ml-3 space-y-4">
                          {filteredEvents.map((ev) => {
                            const approved = isApproved(ev);
                            const rejected = isRejected(ev);

                            // Clean redundant prefixes from reason (e.g., "Tăng ca: abc" -> "abc")
                            const rawReason = ev.explanation || ev.data?.reason || ev.notes || '';
                            let cleanedReason = rawReason.trim();
                            
                            // Bóc các tiền tố trong ngoặc vuông [] (ví dụ: [Đi muộn: 5 phút] Lý do -> Lý do)
                            if (cleanedReason.startsWith('[')) {
                              const closingBracketIndex = cleanedReason.indexOf(']');
                              if (closingBracketIndex !== -1) {
                                cleanedReason = cleanedReason.substring(closingBracketIndex + 1).replace(/^[\:\-\s]+/, '').trim();
                              }
                            }

                            const prefixes = [
                              ...Object.values(EXPLANATION_TYPE_MAP),
                              'Tăng ca', 'Làm thêm giờ', 'Trực tối', 'Live', 'Livestream',
                              'Giải trình đi muộn', 'Giải trình về sớm', 'Giải trình quên chấm công', 'Giải trình đi công tác', 'Giải trình ngày đầu đi làm',
                              'Đi muộn', 'Về sớm', 'Quên chấm công', 'Làm online', 'Nghỉ phép'
                            ].filter(Boolean);
                            prefixes.sort((a, b) => b.length - a.length);

                            for (const p of prefixes) {
                              if (cleanedReason.toLowerCase().startsWith(p.toLowerCase())) {
                                cleanedReason = cleanedReason.substring(p.length).replace(/^[\:\-\s]+/, '').trim();
                                break;
                              }
                            }

                            return (
                              <li key={ev.id} className="ml-4">
                                <div
                                  className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border ${approved
                                    ? 'bg-green-500 border-green-300'
                                    : rejected
                                      ? 'bg-red-500 border-red-300'
                                      : 'bg-gray-300 border-gray-200'
                                    }`}
                                />
                                <div
                                  className={`p-3 rounded-lg border ${approved
                                    ? 'bg-green-50 border-green-200'
                                    : rejected
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ev.event_type === 'attendance'
                                        ? 'bg-blue-100 text-blue-800'
                                        : ev.event_type === 'explanation' || (ev.event_type === 'explanation_approval' && (ev.recordStatus === 'LEAVE' || ev.data?.explanation_type === 'LEAVE'))
                                          ? (ev.recordStatus === 'LEAVE' || ev.data?.explanation_type === 'LEAVE') ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                                          : (ev.event_type === 'explanation_approval' || ev.event_type === 'registration_approval')
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : (['overtime', 'extra_hours', 'night_shift', 'live', 'livestream'].includes(ev.event_type))
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-indigo-100 text-indigo-800'
                                        }`}
                                    >
                                      {ev.event_type === 'explanation'
                                        ? (getExplanationTypeLabel(ev.data?.explanation_type) || 'Giải trình')
                                        : (ev.event_type === 'livestream' || ['overtime', 'extra_hours', 'night_shift', 'live'].includes(ev.event_type))
                                          ? (getExplanationTypeLabel(ev.data?.registration_type) || (ev.event_type === 'livestream' ? 'Đơn đăng ký Livestream' : 'Đơn đăng ký'))
                                          : (ev.event_type === 'explanation_approval' || ev.event_type === 'request_approval') && (ev.data?.explanation_type || ev.data?.registration_type)
                                            ? `${rejected ? 'Từ chối' : 'Phê duyệt'} ${getExplanationTypeLabel(ev.data?.explanation_type || ev.data?.registration_type)}`
                                            : ev.event_type === 'registration_approval' && ev.data?.registration_type
                                              ? `${rejected ? 'Từ chối' : 'Phê duyệt'} ${getExplanationTypeLabel(ev.data.registration_type)}`
                                              : (eventTypeLabel[ev.event_type] || ev.event_type)}
                                    </span>
                                    {approved && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 whitespace-nowrap">
                                        ✓ Đã duyệt
                                      </span>
                                    )}
                                    {rejected && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 whitespace-nowrap">
                                        ✕ Từ chối
                                      </span>
                                    )}
                                    <time className="text-xs text-gray-500 ml-auto">
                                      {new Date(ev.created_at).toLocaleString(
                                        'vi-VN'
                                      )}
                                    </time>
                                  </div>
                                  {ev.event_type === 'attendance' && (
                                    <p className="text-xs text-gray-600">
                                      Trạng thái:{' '}
                                      {ev.event_type === 'attendance' && ev.data?.status
                                        ? 'Có mặt'
                                        : (statusLabel[ev.data?.status] ?? ev.data?.status)}
                                      {ev.data?.import_source && (
                                        <span className="ml-2 text-gray-400">
                                          ({IMPORT_SOURCE_MAP[ev.data.import_source] || ev.data.import_source})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {ev.event_type === 'explanation' && (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      {cleanedReason && (
                                        <p className="text-gray-900 font-medium">Lý do: {cleanedReason}</p>
                                      )}
                                      
                                      {/* Hiển thị chi tiết vi phạm nếu có trong dữ liệu đơn */}
                                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 font-semibold">
                                        {(ev.data?.late_minutes > 0 || ev.data?.late_penalty > 0) && (
                                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" />
                                            {ev.data.late_minutes > 0 && `Đi muộn ${ev.data.late_minutes} phút`}
                                            {ev.data.late_penalty > 0 && ` • Phạt ${ev.data.late_penalty.toLocaleString('vi-VN')}đ`}
                                          </span>
                                        )}
                                        {(ev.data?.early_leave_minutes > 0 || ev.data?.early_leave_penalty > 0) && (
                                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" />
                                            {ev.data.early_leave_minutes > 0 && `Về sớm ${ev.data.early_leave_minutes} phút`}
                                            {ev.data.early_leave_penalty > 0 && ` • Phạt ${ev.data.early_leave_penalty.toLocaleString('vi-VN')}đ`}
                                          </span>
                                        )}
                                      </div>
                                      {ev.data?.status && ev.data.status !== 'APPROVED' && (
                                        <p>
                                          Trạng thái:{' '}
                                          {statusLabel[ev.data.status] ??
                                            ev.data.status}
                                        </p>
                                      )}
                                      {ev.data?.request_code && (
                                        <p className="font-mono text-gray-500">
                                          {ev.data.request_code}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {(ev.event_type === 'explanation_approval' || ev.event_type === 'request_approval') && (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      <p>
                                        {approvalLevelLabel[
                                          ev.data?.level || ev.data?.approval_level
                                        ] ??
                                          (ev.data?.level || ev.data?.approval_level) ??
                                          'Hệ thống'}
                                        :{' '}
                                        {ev.data?.approver_name || ev.data?.approved_by_name}
                                      </p>
                                      {ev.data?.note && ev.data.note !== 'Đã duyệt' && (
                                        <p className="italic text-gray-500">
                                          "{ev.data.note}"
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {ev.event_type === 'registration_approval' && (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      <p>
                                        {approvalLevelLabel[
                                          ev.data?.approval_level
                                        ] ??
                                          ev.data?.approval_level ??
                                          'Unknown'}
                                        :{' '}
                                        {ev.data?.approved_by_name}
                                      </p>
                                      {ev.data?.status && ev.data.status !== 'APPROVED' && (
                                        <p>
                                          Trạng thái:{' '}
                                          {statusLabel[ev.data.status] ??
                                            ev.data.status}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {['overtime', 'extra_hours', 'night_shift', 'live', 'livestream'].includes(ev.event_type) && (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      {(ev.check_in || ev.check_out) && (
                                        <p>
                                          Thời gian: {ev.check_in ?? '--'} —{' '}
                                          {ev.check_out ?? '--'}
                                        </p>
                                      )}
                                      {cleanedReason && (
                                        <p>
                                          Lý do: {cleanedReason}
                                        </p>
                                      )}
                                      {ev.data?.status && ev.data.status !== 'APPROVED' && (
                                        <p>
                                          Trạng thái:{' '}
                                          {statusLabel[ev.data.status] ??
                                            ev.data.status}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {ev.created_by && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Bởi: {ev.created_by}
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    );
                  })()}


                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    {/* Ẩn nút làm đơn bổ sung công nếu đã có đơn được duyệt */}
                    {/* Hiện nút nếu còn vi phạm chưa giải trình hoặc còn lượt nghỉ phép */}
                    {(() => {
                      const detail = attendanceDetails[0];
                      const pendingOrApprovedTypes = (allExplanations || []).map(e => e.explanation_type);

                      const hasUnresolvedLate = (detail?.late_minutes || 0) > 0 && !pendingOrApprovedTypes.includes('LATE');
                      const hasUnresolvedEarly = (detail?.early_leave_minutes || 0) > 0 && !pendingOrApprovedTypes.includes('EARLY_LEAVE');
                      const hasUnresolvedIncomplete = detail?.status === 'INCOMPLETE_ATTENDANCE' && !pendingOrApprovedTypes.includes('INCOMPLETE_ATTENDANCE');

                      // Còn vi phạm chưa đơn từ?
                      const hasWorkViolationToDo = hasUnresolvedLate || hasUnresolvedEarly || hasUnresolvedIncomplete;

                      // Còn lượt nghỉ tháng?
                      const usedMonthlyLeave = monthlyRequestHistory?.leaveRequests?.length || 0;
                      const hasMonthlyLeaveRemaining = usedMonthlyLeave < 1;

                      // Vẫn hiện nút nếu còn việc để làm (giải trình hoặc đăng ký khác)
                      if (hasWorkViolationToDo || hasMonthlyLeaveRemaining || approvedRegistrations.length === 0) {
                        return (
                          <button
                            onClick={handleOpenSupplementaryRequest}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <DocumentPlusIcon className="h-5 w-5 mr-2" />
                            Làm đơn bổ sung
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button
                      onClick={handleCloseModal}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Supplementary Request Modal */}
      {
        showSupplementaryRequestModal && selectedDate && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white rounded-t-lg sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-purple-100 sm:mx-0">
                      <DocumentPlusIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base md:text-lg leading-6 font-bold text-gray-900">
                          Đơn bổ sung
                        </h3>
                        <button
                          onClick={handleCloseSupplementaryRequest}
                          className="text-gray-400 hover:text-gray-500 p-1"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Gửi đơn bổ sung cho ngày{' '}
                          {selectedDate.toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {/* ===================== STEP-BASED FORM UI ===================== */}

                    {/* === StepIndicator === */}
                    <div className="flex items-center justify-center mb-8">
                      <div className="flex items-center">
                        {/* Step 1 */}
                        <div className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${currentStep >= 1
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
                              }`}
                          >
                            {selectedContext ? (
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              '1'
                            )}
                          </div>
                          <span
                            className={`ml-3 text-sm font-medium hidden sm:block transition-colors ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
                              }`}
                          >
                            Chọn loại yêu cầu
                          </span>
                        </div>

                        {/* Connector Line */}
                        <div
                          className={`w-12 sm:w-24 h-1 mx-4 rounded-full transition-all duration-500 ${currentStep >= 2
                            ? 'bg-gradient-to-r from-purple-600 to-purple-600'
                            : 'bg-gradient-to-r from-purple-600 to-gray-300'
                            }`}
                        />

                        {/* Step 2 */}
                        <div className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${currentStep >= 2
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
                              }`}
                          >
                            {selectedReason ? (
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              '2'
                            )}
                          </div>
                          <span
                            className={`ml-3 text-sm font-medium hidden sm:block transition-colors ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
                              }`}
                          >
                            Chọn lý do
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* === ContextSelector (Step 1) === */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Chọn loại yêu cầu
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Card 1: Giải trình đơn */}
                        <button
                          type="button"
                          onClick={() =>
                            handleContextSelect('explanation')
                          }
                          className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 text-left ${selectedContext === 'explanation'
                              ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600 hover:shadow-lg'
                              : 'border-gray-200 hover:border-purple-400 hover:shadow-lg'
                            }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div
                              className={`flex-shrink-0 p-3 rounded-lg transition-colors ${selectedContext === 'explanation'
                                ? 'bg-purple-100 group-hover:bg-purple-200'
                                : 'bg-gray-100 group-hover:bg-purple-50'
                                }`}
                            >
                              <svg
                                className={`w-6 h-6 ${selectedContext === 'explanation' ? 'text-purple-600' : 'text-gray-500 group-hover:text-purple-500'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                Đơn giải trình
                              </h4>
                              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                Giải trình các vi phạm hoặc lý do công việc (Còn {attendanceStats?.remaining_explanations || 0}/{attendanceStats?.max_explanations_per_month || 3} lần)
                              </p>
                              {!hasAttendanceData && (
                                <p className="mt-1 text-xs text-amber-500 font-medium">
                                  Vắng mặt: Có thể làm đơn Công tác, Quên chấm, Ngày đầu
                                </p>
                              )}
                              {hasAttendanceData && (attendanceStats?.remaining_explanations || 0) <= 0 && (
                                <p className="mt-1 text-xs text-amber-600 font-medium italic">
                                  Hết lượt giải trình vi phạm. (Công tác/Ngày đầu vẫn được duyệt)
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Selected indicator */}
                          {selectedContext === 'explanation' && (
                              <div className="absolute top-3 right-3">
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                        </button>

                        {/* Card 2: Đơn đăng ký */}
                        <button
                          type="button"
                          onClick={() => handleContextSelect('registration')}
                          className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 text-left ${selectedContext === 'registration'
                            ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600'
                            : 'border-gray-200 hover:border-purple-400'
                            }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div
                              className={`flex-shrink-0 p-3 rounded-lg transition-colors ${selectedContext === 'registration'
                                ? 'bg-purple-100 group-hover:bg-purple-200'
                                : 'bg-blue-50 group-hover:bg-blue-100'
                                }`}
                            >
                              <svg
                                className={`w-6 h-6 ${selectedContext === 'registration' ? 'text-purple-600' : 'text-blue-600'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                Đơn đăng ký
                              </h4>
                              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                Tăng ca, làm thêm giờ, trực tối, làm tối, live
                              </p>
                            </div>
                          </div>
                          {/* Selected indicator */}
                          {selectedContext === 'registration' && (
                            <div className="absolute top-3 right-3">
                              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>

                        {/* Card 3: Nghỉ phép tháng */}
                        {(() => {
                          const maxMonthlyLeave = 1;
                          // Tính tổng số ngày đã dùng: HALF_DAY = 0.5, ABSENT (hoặc khác) = 1.0
                          const usedMonthlyLeave = (monthlyRequestHistory?.leaveRequests || []).reduce((total, req) => {
                            return total + (req.expected_status === 'HALF_DAY' ? 0.5 : 1.0);
                          }, 0);
                          const remainingMonthlyLeave = Math.max(0, maxMonthlyLeave - usedMonthlyLeave);

                          return (
                            <button
                              type="button"
                              disabled={remainingMonthlyLeave <= 0}
                              onClick={() => remainingMonthlyLeave > 0 && handleContextSelect('monthly_leave')}
                              className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 text-left
      ${remainingMonthlyLeave <= 0
                                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                                  : selectedContext === 'monthly_leave'
                                    ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600'
                                    : 'border-gray-200 hover:border-purple-400'
                                }
      ${!isManagementUser ? 'sm:col-span-2' : ''}
    `}
                            >
                              <div className="flex items-start space-x-4">
                                <div
                                  className={`flex-shrink-0 p-3 rounded-lg transition-colors ${selectedContext === 'monthly_leave'
                                    ? 'bg-purple-100 group-hover:bg-purple-200'
                                    : 'bg-indigo-50 group-hover:bg-indigo-100'
                                    }`}
                                >
                                  <svg
                                    className={`w-6 h-6 ${selectedContext === 'monthly_leave' ? 'text-purple-600' : 'text-indigo-600'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                    Nghỉ phép tháng
                                  </h4>
                                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                    Đăng ký nghỉ phép trong tháng (Còn {remainingMonthlyLeave}/{maxMonthlyLeave} ngày)
                                  </p>
                                  {remainingMonthlyLeave <= 0 && (
                                    <p className="mt-1 text-xs text-red-500">
                                      Hết lượt đăng ký trong tháng
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Selected indicator */}
                              {selectedContext === 'monthly_leave' && (
                                <div className="absolute top-3 right-3">
                                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })()}

                        {/* Card 4: Làm việc online */}
                        {isManagementUser && (() => {
                          const maxOnline = attendanceStats?.max_online_work_per_month || 2;
                          const usedOnline = (attendanceStats?.max_online_work_per_month || 0) - (attendanceStats?.remaining_online_work || 0);
                          const remainingOnline = Math.max(0, maxOnline - usedOnline);

                          return (
                            <button
                              type="button"
                              disabled={remainingOnline <= 0}
                              onClick={() =>
                                remainingOnline > 0 &&
                                handleContextSelect('online_work')
                              }
                              className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 text-left ${remainingOnline <= 0
                                ? 'opacity-50 cursor-not-allowed border-gray-200'
                                : selectedContext === 'online_work'
                                  ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600 hover:shadow-lg'
                                  : 'border-gray-200 hover:border-purple-400 hover:shadow-lg'
                                }`}
                            >
                              <div className="flex items-start space-x-4">
                                <div
                                  className={`flex-shrink-0 p-3 rounded-lg transition-colors ${selectedContext === 'online_work'
                                    ? 'bg-purple-100 group-hover:bg-purple-200'
                                    : 'bg-teal-50 group-hover:bg-teal-100'
                                    }`}
                                >
                                  <svg
                                    className={`w-6 h-6 ${selectedContext === 'online_work'
                                      ? 'text-purple-600'
                                      : 'text-teal-600'
                                      }`}
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
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                    Làm việc online
                                  </h4>
                                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                    Đăng ký làm việc từ xa (Còn {remainingOnline}/{maxOnline} lần)
                                  </p>
                                  {remainingOnline <= 0 && (
                                    <p className="mt-1 text-xs text-red-500">
                                      Hết lượt đăng ký trong tháng
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Selected indicator */}
                              {selectedContext === 'online_work' && (
                                <div className="absolute top-3 right-3">
                                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* === ReasonSelector (Step 2) === */}
                    {selectedContext &&
                      (selectedContext === 'explanation' ||
                        selectedContext === 'registration' ||
                        selectedContext === 'monthly_leave' ||
                        selectedContext === 'online_work') && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Chọn lý do cụ thể
                          </h3>

                          {/* Chip buttons - Render based on selected context */}
                          <div className="flex flex-wrap gap-3">
                            {(() => {
                              const reasons = selectedContext === 'explanation'
                                ? explanationReasons
                                : selectedContext === 'registration'
                                  ? registrationReasons
                                  : selectedContext === 'monthly_leave'
                                    ? monthlyLeaveReasons
                                    : onlineWorkReasons;

                              // Lọc lý do cho Đơn giải trình dựa trên thực tế chấm công
                              if (selectedContext === 'explanation') {
                                const detail = attendanceDetails[0];
                                const isNoViolation = detail &&
                                  detail.late_minutes <= 0 &&
                                  detail.early_leave_minutes <= 0 &&
                                  detail.status !== 'INCOMPLETE_ATTENDANCE' &&
                                  detail.status !== 'ABSENT';

                                return reasons.filter(reason => {
                                  const alreadyExplained = (allExplanations || []).some(e => {
                                    if (reason.id === 'late_minutes' && e.explanation_type === 'LATE') return true;
                                    if (reason.id === 'early_leave_minutes' && e.explanation_type === 'EARLY_LEAVE') return true;
                                    if (reason.id === 'incomplete_attendance' && e.explanation_type === 'INCOMPLETE_ATTENDANCE') return true;
                                    if (reason.id === 'business_trip' && e.explanation_type === 'BUSINESS_TRIP') return true;
                                    if (reason.id === 'first_day' && e.explanation_type === 'FIRST_DAY') return true;
                                    return false;
                                  });
                                  if (alreadyExplained) return false;
                                  const isIncomplete = detail?.status === 'INCOMPLETE_ATTENDANCE';

                                  if (reason.id === 'late_minutes') return !isIncomplete && (detail?.late_minutes || 0) > 0;
                                  if (reason.id === 'early_leave_minutes') return !isIncomplete && (detail?.early_leave_minutes || 0) > 0;
                                  if (reason.id === 'incomplete_attendance') return isIncomplete || !detail || detail.status === 'ABSENT';
                                  // Công tác và Ngày đầu chỉ hiện khi Vắng mặt hoặc chưa có dữ liệu
                                  if (reason.id === 'first_day') {
                                    return !detail || detail.status === 'ABSENT';
                                  }
                                  if (reason.id === 'business_trip') {
                                    // Hiển thị đi công tác khi vắng mặt HOẶC khi có vi phạm (muộn/sớm/quên chấm)
                                    return !detail ||
                                      detail.status === 'ABSENT' ||
                                      (detail?.late_minutes || 0) > 0 ||
                                      (detail?.early_leave_minutes || 0) > 0 ||
                                      detail?.status === 'INCOMPLETE_ATTENDANCE';
                                  }
                                  return true;
                                });
                              }
                              return reasons;
                            })().map((reason) => {
                              const isSelected = selectedReason === reason.id;

                              // Xác định xem lý do này có bị tính vào quota giải trình không (đối với context explanation)
                              const isQuotaConsuming = selectedContext === 'explanation' &&
                                ['late_minutes', 'early_leave_minutes', 'incomplete_attendance'].includes(reason.id);
                              const isNonQuota = selectedContext === 'explanation' &&
                                ['business_trip', 'first_day'].includes(reason.id);

                              return (
                                <div key={reason.id} className="relative group/chip">
                                  <button
                                    type="button"
                                    onClick={() => handleReasonSelect(reason.id)}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-150 ${isSelected
                                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                      } ${isNonQuota && !isSelected ? 'border-dashed border-indigo-200' : ''}`}
                                  >
                                    {renderIcon(reason.icon, isSelected)}
                                    {reason.label}
                                    {isSelected && (
                                      <svg
                                        className="w-4 h-4 ml-2 text-purple-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                  {isNonQuota && (
                                    <div className="absolute -top-2 -right-1 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter opacity-0 group-hover/chip:opacity-100 transition-opacity whitespace-nowrap">
                                      Không mất lượt giải trình
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* === Time Info for Late/Early Leave === */}
                    {selectedContext === 'explanation' &&
                      (selectedReason === 'late_minutes' ||
                        selectedReason === 'early_leave_minutes') && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Thông tin chấm công
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            {attendanceDetails.length > 0 ? (
                              <div className="space-y-3">
                                {/* Time Info Grid - Responsive */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Giờ đi */}
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <svg
                                        className="w-4 h-4 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-gray-500 uppercase">
                                        Giờ đi
                                      </span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                      {attendanceDetails[0]?.check_in
                                        ? new Date(
                                          `2000-01-01T${attendanceDetails[0].check_in}`
                                        ).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                        : '--:--'}
                                    </p>
                                  </div>

                                  {/* Giờ về */}
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <svg
                                        className="w-4 h-4 text-red-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-gray-500 uppercase">
                                        Giờ về
                                      </span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                      {attendanceDetails[0]?.check_out
                                        ? new Date(
                                          `2000-01-01T${attendanceDetails[0].check_out}`
                                        ).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                        : '--:--'}
                                    </p>
                                  </div>
                                </div>

                                {/* Late/Early Minutes Info */}
                                {selectedReason === 'late_minutes' &&
                                  attendanceDetails[0]?.late_minutes > 0 && (
                                    <>
                                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <svg
                                              className="w-5 h-5 text-yellow-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            <span className="text-sm font-medium text-yellow-800">
                                              Số phút đi muộn
                                            </span>
                                          </div>
                                          <span className="text-lg font-bold text-yellow-700">
                                            {attendanceDetails[0].late_minutes}{' '}
                                            phút
                                          </span>
                                        </div>
                                        {(attendanceDetails[0].late_penalty || 0) > 0 && (
                                          <div className="mt-2 pt-2 border-t border-yellow-200 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-red-600 uppercase tracking-tighter">Số tiền phạt:</span>
                                              <span className="text-sm font-black text-red-700">
                                                {(attendanceDetails[0].late_penalty || 0).toLocaleString('vi-VN')} VNĐ
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                    </>
                                  )}

                                {selectedReason === 'early_leave_minutes' &&
                                  attendanceDetails[0]?.early_leave_minutes >
                                  0 && (
                                    <>
                                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <svg
                                              className="w-5 h-5 text-yellow-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            <span className="text-sm font-medium text-yellow-800">
                                              Số phút về sớm
                                            </span>
                                          </div>
                                          <span className="text-lg font-bold text-yellow-700">
                                            {
                                              attendanceDetails[0]
                                                .early_leave_minutes
                                            }{' '}
                                            phút
                                          </span>
                                        </div>
                                        {(attendanceDetails[0].early_leave_penalty || 0) > 0 && (
                                          <div className="mt-2 pt-2 border-t border-yellow-200 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-red-600 uppercase tracking-tighter">Số tiền phạt:</span>
                                              <span className="text-sm font-black text-red-700">
                                                {(attendanceDetails[0].early_leave_penalty || 0).toLocaleString('vi-VN')} VNĐ
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                    </>
                                  )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <svg
                                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <p className="text-sm">
                                  Không có dữ liệu chấm công cho ngày này
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* === Note Input for Late/Early Leave === */}
                    {selectedContext === 'explanation' &&
                      (selectedReason === 'late_minutes' ||
                        selectedReason === 'early_leave_minutes') && (
                        <div className="space-y-3 mb-6 animate-fadeIn">
                          <label
                            htmlFor="explanation-note"
                            className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                          >
                            Ghi chú giải trình (bắt buộc)
                          </label>
                          <textarea
                            id="explanation-note"
                            rows={3}
                            value={formNote}
                            onChange={(e) => setFormNote(e.target.value)}
                            placeholder="Nhập lý do đi muộn/về sớm cụ thể..."
                            className="block w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none placeholder:text-gray-300"
                          />
                        </div>
                      )}

                    {/* === Time Picker for Overtime (Tăng ca) === */}
                    {selectedContext === 'registration' &&
                      selectedReason === 'overtime' && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Thời gian tăng ca
                          </h3>

                          {/* Brand Communications reminder */}
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-start space-x-2">
                              <svg
                                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div>
                                <span className="text-sm font-medium text-blue-800">
                                  Dành cho phòng ban tất cả nhân sự trừ Telesale
                                  và CSKH
                                </span>
                                <p className="text-xs text-blue-700 mt-1">
                                  Vui lòng nhập chính xác thời gian tăng ca để
                                  được tính công đầy đủ
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Giờ bắt đầu */}
                              <div>
                                <label
                                  htmlFor="overtime-start"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ bắt đầu
                                </label>
                                <input
                                  type="time"
                                  id="overtime-start"
                                  value={overtimeStartTime}
                                  onChange={(e) =>
                                    setOvertimeStartTime(e.target.value)
                                  }
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>

                              {/* Giờ kết thúc */}
                              <div>
                                <label
                                  htmlFor="overtime-end"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ kết thúc
                                </label>
                                <input
                                  type="time"
                                  id="overtime-end"
                                  value={overtimeEndTime}
                                  onChange={(e) =>
                                    setOvertimeEndTime(e.target.value)
                                  }
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>
                            </div>

                            {/* Duration display */}
                            {overtimeStartTime && overtimeEndTime && (
                              <div className="mt-4">
                                <div
                                  className={`flex items-center justify-between bg-white rounded-lg p-3 border ${overtimeDuration <= 0 || overtimeDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                    }`}
                                >
                                  <span className="text-sm text-gray-600">
                                    Tổng thời gian:
                                  </span>
                                  <span
                                    className={`text-lg font-bold ${overtimeDuration <= 0 ||
                                      overtimeDuration < 2
                                      ? 'text-red-600'
                                      : 'text-purple-700'
                                      }`}
                                  >
                                    {overtimeDuration.toFixed(1)} giờ
                                  </span>
                                </div>

                                {/* Validation error */}
                                {selectedReason === 'overtime' &&
                                  registrationTimeError && (
                                    <div className="mt-2 bg-red-50 rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-5 h-5 text-red-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium text-red-700">
                                          {registrationTimeError}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                {/* Night work bonus indicator */}
                                {overtimeDuration >= 3 && (
                                  <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                                    <div className="flex items-center space-x-2">
                                      <svg
                                        className="w-5 h-5 text-indigo-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                        />
                                      </svg>
                                      <span className="text-sm font-semibold text-indigo-700">
                                        Tính 1 suất làm tối
                                      </span>
                                    </div>
                                    <p className="text-xs text-indigo-600 mt-1 ml-7">
                                      Thời gian tăng ca từ 3 giờ trở lên được tính
                                      1 suất làm tối
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Note input for Overtime */}
                            <div className="mt-4 space-y-2">
                              <label
                                htmlFor="overtime-note"
                                className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                              >
                                Ghi chú tăng ca (bắt buộc)
                              </label>
                              <textarea
                                id="overtime-note"
                                rows={3}
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                                placeholder="Nhập ghi chú, lý do tăng ca chi tiết..."
                                className="block w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none placeholder:text-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {/* === Time Picker for Extra Hours (Làm thêm giờ) - Part-time === */}
                    {selectedContext === 'registration' &&
                      selectedReason === 'extra_hours' && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Thời gian làm thêm giờ
                          </h3>

                          {/* Part-time reminder */}
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <div className="flex items-start space-x-2">
                              <svg
                                className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div>
                                <span className="text-sm font-medium text-amber-800">
                                  Dành cho nhân viên vị trí giám sát nội bộ
                                  Part-time
                                </span>
                                <p className="text-xs text-amber-700 mt-1">
                                  Vui lòng nhập chính xác thời gian làm thêm để
                                  được tính công đầy đủ
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Giờ bắt đầu */}
                              <div>
                                <label
                                  htmlFor="extra-hours-start"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ bắt đầu
                                </label>
                                <input
                                  type="time"
                                  id="extra-hours-start"
                                  value={extraHoursStartTime}
                                  onChange={(e) =>
                                    setExtraHoursStartTime(e.target.value)
                                  }
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>

                              {/* Giờ kết thúc */}
                              <div>
                                <label
                                  htmlFor="extra-hours-end"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ kết thúc
                                </label>
                                <input
                                  type="time"
                                  id="extra-hours-end"
                                  value={extraHoursEndTime}
                                  onChange={(e) =>
                                    setExtraHoursEndTime(e.target.value)
                                  }
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>
                            </div>

                            {/* Duration display */}
                            {extraHoursStartTime && extraHoursEndTime && (
                              <div className="mt-4">
                                <div
                                  className={`flex items-center justify-between bg-white rounded-lg p-3 border ${extraHoursDuration <= 0 ||
                                    extraHoursDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                    }`}
                                >
                                  <span className="text-sm text-gray-600">
                                    Tổng thời gian làm thêm:
                                  </span>
                                  <span
                                    className={`text-lg font-bold ${extraHoursDuration <= 0 ||
                                      extraHoursDuration < 2
                                      ? 'text-red-600'
                                      : 'text-purple-700'
                                      }`}
                                  >
                                    {extraHoursDuration.toFixed(1)} giờ
                                  </span>
                                </div>

                                {/* Validation error */}
                                {selectedReason === 'extra_hours' &&
                                  registrationTimeError && (
                                    <div className="mt-2 bg-red-50 rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-5 h-5 text-red-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium text-red-700">
                                          {registrationTimeError}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            {/* Note input for Extra Hours */}
                            <div className="mt-4 space-y-2">
                              <label
                                htmlFor="extra-hours-note"
                                className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                              >
                                Ghi chú làm thêm giờ (bắt buộc)
                              </label>
                              <textarea
                                id="extra-hours-note"
                                rows={3}
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                                placeholder="Nhập ghi chú, lý do làm thêm giờ..."
                                className="block w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none placeholder:text-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {/* === Time Picker for Home Duty (Trực tại nhà) - Sales Department === */}
                    {selectedContext === 'registration' &&
                      selectedReason === 'night_shift' && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Thời gian trực tại nhà
                          </h3>

                          {/* Sales Department reminder */}
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <div className="flex items-start space-x-2">
                              <svg
                                className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              <div>
                                <span className="text-sm font-medium text-emerald-800">
                                  Dành cho vị trí Telesale và CSKH
                                </span>
                                <p className="text-xs text-emerald-700 mt-1">
                                  Ca sáng: 8h30 - 12h | Ca chiều tối: 17h30 - 23h
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Preset Ca */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                              Chọn nhanh ca trực
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                {
                                  label: 'Ca chiều tối',
                                  time: '13h → 21h',
                                  start: '13:00',
                                  end: '21:00',
                                  color: 'indigo',
                                  icon: '🏢',
                                },
                                {
                                  label: 'Ca gãy',
                                  time: '8h30→12h + 17h30→23h',
                                  start: '08:30',
                                  end: '23:00',
                                  color: 'purple',
                                  icon: '🔀',
                                },
                              ].map((preset) => {
                                const isSelected =
                                  nightShiftStartTime === preset.start &&
                                  nightShiftEndTime === preset.end;
                                const colorMap: Record<string, { card: string; badge: string; dot: string }> = {
                                  blue: {
                                    card: isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                      : 'bg-white border-blue-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50',
                                    badge: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700',
                                    dot: 'bg-blue-400',
                                  },
                                  indigo: {
                                    card: isSelected
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                      : 'bg-white border-indigo-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50',
                                    badge: isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700',
                                    dot: 'bg-indigo-400',
                                  },
                                  purple: {
                                    card: isSelected
                                      ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                                      : 'bg-white border-purple-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50',
                                    badge: isSelected ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700',
                                    dot: 'bg-purple-400',
                                  },
                                };
                                const c = colorMap[preset.color];
                                return (
                                  <button
                                    key={preset.start}
                                    type="button"
                                    onClick={() => {
                                      setNightShiftStartTime(preset.start);
                                      setNightShiftEndTime(preset.end);
                                    }}
                                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all font-medium ${c.card} ${isSelected ? 'scale-[1.01]' : ''}`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-lg">{preset.icon}</span>
                                      <div className="text-left">
                                        <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{preset.label}</div>
                                      </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${c.badge}`}>
                                      {preset.time}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>


                          {/* Duration display */}
                          {nightShiftStartTime && nightShiftEndTime && (
                            <div className={`flex items-center justify-between bg-white rounded-xl border px-4 py-3 ${nightShiftDuration <= 0 || nightShiftDuration < 2 ? 'border-red-300' : 'border-gray-200'}`}>
                              <span className="text-sm text-gray-600">Tổng thời gian trực:</span>
                              <span className={`text-lg font-bold ${nightShiftDuration <= 0 || nightShiftDuration < 2 ? 'text-red-600' : 'text-purple-700'}`}>
                                {nightShiftDuration.toFixed(1)} giờ
                              </span>
                            </div>
                          )}

                          {/* Note input for Night Shift */}
                          <div className="mt-2 space-y-2">
                            <label
                              htmlFor="night-shift-note"
                              className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                            >
                              Ghi chú trực tối (bắt buộc)
                            </label>
                            <textarea
                              id="night-shift-note"
                              rows={3}
                              value={formNote}
                              onChange={(e) => setFormNote(e.target.value)}
                              placeholder="Nhập ghi chú, ca trực cụ thể..."
                              className="block w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none placeholder:text-gray-300"
                            />
                          </div>

                          {/* Validation error */}
                          {selectedReason === 'night_shift' && registrationTimeError && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                              <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-red-700">{registrationTimeError}</span>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    {/* === Time Picker for Live - TikTok Department === */}
                    {selectedContext === 'registration' &&
                      selectedReason === 'live' && (
                        <div className="space-y-4 mb-6 animate-fadeIn">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Thời gian Live
                          </h3>

                          {/* TikTok Department reminder */}
                          <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                            <div className="flex items-start space-x-2">
                              <svg
                                className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <div>
                                <span className="text-sm font-medium text-pink-800">
                                  Dành cho phòng ban TikTok, Truyền thông thương
                                  hiệu, Kinh doanh
                                </span>
                                <p className="text-xs text-pink-700 mt-1">
                                  Live sau 21h không được vượt quá 20% tổng số
                                  live của Team. Tối đa ≤10 phiên live Team trong
                                  tháng.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Giờ bắt đầu */}
                              <div>
                                <label
                                  htmlFor="live-start"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ bắt đầu
                                </label>
                                <input
                                  type="time"
                                  id="live-start"
                                  value={liveStartTime}
                                  onChange={(e) =>
                                    setLiveStartTime(e.target.value)
                                  }
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>

                              {/* Giờ kết thúc */}
                              <div>
                                <label
                                  htmlFor="live-end"
                                  className="block text-xs font-medium text-gray-500 uppercase mb-2"
                                >
                                  Giờ kết thúc
                                </label>
                                <input
                                  type="time"
                                  id="live-end"
                                  value={liveEndTime}
                                  onChange={(e) => setLiveEndTime(e.target.value)}
                                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                                />
                              </div>
                            </div>

                            {/* Duration display */}
                            {liveStartTime && liveEndTime && (
                              <div className="mt-4">
                                <div
                                  className={`flex items-center justify-between bg-white rounded-lg p-3 border ${liveDuration <= 0 || liveDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                    }`}
                                >
                                  <span className="text-sm text-gray-600">
                                    Tổng thời gian live:
                                  </span>
                                  <span
                                    className={`text-lg font-bold ${liveDuration <= 0 || liveDuration < 2
                                      ? 'text-red-600'
                                      : 'text-purple-700'
                                      }`}
                                  >
                                    {liveDuration.toFixed(1)} giờ
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Note input for Live */}
                            <div className="mt-4 space-y-2">
                              <label
                                htmlFor="live-note"
                                className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                              >
                                Ghi chú live (bắt buộc)
                              </label>
                              <textarea
                                id="live-note"
                                rows={3}
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                                placeholder="Nhập ghi chú, phiên live cụ thể..."
                                className="block w-full rounded-xl border-2 border-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none placeholder:text-gray-300"
                              />
                            </div>

                            {liveStartTime && liveEndTime && (
                              <>
                                {/* Validation error */}
                                {selectedReason === 'live' &&
                                  registrationTimeError && (
                                    <div className="mt-2 bg-red-50 rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-5 h-5 text-red-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium text-red-700">
                                          {registrationTimeError}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                {/* Night live session indicator */}
                                <div className="mt-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
                                  <div className="flex items-center space-x-2">
                                    <svg
                                      className="w-5 h-5 text-pink-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                      />
                                    </svg>
                                    <span className="text-sm font-semibold text-pink-700">
                                      Tính 1 ca live tối
                                    </span>
                                  </div>
                                  <p className="text-xs text-pink-600 mt-1 ml-7">
                                    Phiên live sau 21h được tính là 1 ca live tối
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                    {/* === Note Input for First Day === */}
                    {selectedContext === 'explanation' &&
                      selectedReason === 'first_day' && (
                        <div className="space-y-3 mb-6 animate-fadeIn">
                          <label
                            htmlFor="first-day-note"
                            className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                          >
                            Ghi chú (bắt buộc)
                          </label>
                          <textarea
                            id="first-day-note"
                            rows={4}
                            value={formNote}
                            onChange={(e) => setFormNote(e.target.value)}
                            placeholder="Nhập ghi chú về ngày đầu đi làm..."
                            className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none"
                          />
                          <p className="text-xs text-gray-500">
                            Vui lòng mô tả chi tiết về ngày đầu đi làm (ví dụ:
                            chưa được cấp thẻ, chưa đăng ký vân tay...)
                          </p>
                        </div>
                      )}

                    {/* === Note Input for Business Trip === */}
                    {selectedContext === 'explanation' &&
                      selectedReason === 'business_trip' && (
                        <div className="space-y-3 mb-6 animate-fadeIn">
                          <label
                            htmlFor="business-trip-note"
                            className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                          >
                            Ghi chú (bắt buộc)
                          </label>
                          <textarea
                            id="business-trip-note"
                            rows={4}
                            value={formNote}
                            onChange={(e) => setFormNote(e.target.value)}
                            placeholder="Nhập ghi chú về chuyến công tác..."
                            className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none"
                          />
                          <p className="text-xs text-gray-500">
                            Vui lòng mô tả chi tiết về chuyến công tác (ví dụ: địa
                            điểm, mục đích, thời gian...)
                          </p>
                        </div>
                      )}

                    {/* === Note Input for Online Work === */}
                    {selectedContext === 'online_work' &&
                      selectedReason === 'online_work' && (
                        <div className="space-y-3 mb-6 animate-fadeIn">
                          <label
                            htmlFor="online-work-note"
                            className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                          >
                            Ghi chú làm việc online (bắt buộc)
                          </label>
                          <textarea
                            id="online-work-note"
                            rows={4}
                            value={formNote}
                            onChange={(e) => setFormNote(e.target.value)}
                            placeholder="Nhập ghi chú về ca làm việc online (VD: nội dung công việc, kết quả dự kiến...)"
                            className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none"
                          />
                          <p className="text-xs text-gray-500">
                            Mô tả chi tiết để quản lý xem xét phê duyệt đơn làm
                            việc online của bạn.
                          </p>
                        </div>
                      )}

                    {/* === Detailed Options for Incomplete Attendance === */}
                    {selectedContext === 'explanation' &&
                      selectedReason === 'incomplete_attendance' && (
                        <div className="space-y-4 mb-6 animate-fadeIn">

                          {/* Tiêu đề */}
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                              Bạn quên chấm công lúc nào?
                            </h3>
                          </div>

                          {/* Bước 1: 3 card lựa chọn */}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              {
                                id: 'checkin',
                                label: 'Quên\nCheck-in',
                                icon: (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5-4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                ),
                                activeColor: 'bg-purple-600 border-purple-600 text-white shadow-lg',
                                inactiveColor: 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50',
                                dotColor: 'bg-purple-500',
                              },
                              {
                                id: 'checkout',
                                label: 'Quên\nCheck-out',
                                icon: (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                ),
                                activeColor: 'bg-orange-500 border-orange-500 text-white shadow-lg',
                                inactiveColor: 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50',
                                dotColor: 'bg-orange-500',
                              },
                              {
                                id: 'both',
                                label: 'Cả\nhai',
                                icon: (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                ),
                                activeColor: 'bg-gradient-to-br from-purple-600 to-orange-500 border-transparent text-white shadow-lg',
                                inactiveColor: 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50',
                                dotColor: 'bg-purple-500',
                              },
                            ].map((type) => {
                              const isActive = forgotPunchType === type.id;
                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => {
                                    setForgotPunchType(type.id as any);
                                    setForgotCheckinTime(null);
                                    setForgotCheckoutTime(null);
                                  }}
                                  className={`relative flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-200 font-semibold ${isActive ? type.activeColor : type.inactiveColor} ${isActive ? 'scale-[1.03]' : ''}`}
                                >
                                  {isActive && (
                                    <span className="absolute top-2 right-2 w-4 h-4 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                  <span className={`${isActive ? 'text-white opacity-90' : 'text-gray-400'}`}>{type.icon}</span>
                                  <span className={`text-xs font-bold text-center leading-tight whitespace-pre-line ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                    {type.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Bước 2a: Chọn giờ check-in */}
                          {(forgotPunchType === 'checkin' || forgotPunchType === 'both') && (
                            <div className="rounded-2xl border border-purple-100 overflow-hidden">
                              <div className="bg-purple-600 px-4 py-2.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5-4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-xs font-bold text-white tracking-wide uppercase">Giờ check-in bị quên</span>
                              </div>
                              <div className="bg-purple-50 p-3 flex gap-2">
                                {[
                                  { value: '08:30', label: '8h30', desc: 'Sáng' },
                                  { value: '13:00', label: '13h00', desc: 'Chiều' },
                                  { value: '17:30', label: '17h30', desc: 'Tối' },
                                ].map((opt) => {
                                  const sel = forgotCheckinTime === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setForgotCheckinTime(sel ? null : opt.value)}
                                      className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all duration-150 ${sel ? 'bg-purple-600 border-purple-600 shadow-md scale-[1.04]' : 'bg-white border-purple-200 hover:border-purple-400 hover:bg-purple-50'}`}
                                    >
                                      <span className={`text-sm font-extrabold ${sel ? 'text-white' : 'text-purple-700'}`}>{opt.label}</span>
                                      <span className={`text-[10px] mt-0.5 font-medium ${sel ? 'text-purple-200' : 'text-gray-400'}`}>{opt.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Bước 2b: Chọn giờ check-out */}
                          {(forgotPunchType === 'checkout' || forgotPunchType === 'both') && (
                            <div className="rounded-2xl border border-orange-100 overflow-hidden">
                              <div className="bg-orange-500 px-4 py-2.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-xs font-bold text-white tracking-wide uppercase">Giờ check-out bị quên</span>
                              </div>
                              <div className="bg-orange-50 p-3 flex gap-2">
                                {[
                                  { value: '12:00', label: '12h00', desc: 'Trưa' },
                                  { value: '17:30', label: '17h30', desc: 'Chiều' },
                                ].map((opt) => {
                                  const sel = forgotCheckoutTime === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setForgotCheckoutTime(sel ? null : opt.value)}
                                      className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all duration-150 ${sel ? 'bg-orange-500 border-orange-500 shadow-md scale-[1.04]' : 'bg-white border-orange-200 hover:border-orange-400 hover:bg-orange-50'}`}
                                    >
                                      <span className={`text-sm font-extrabold ${sel ? 'text-white' : 'text-orange-600'}`}>{opt.label}</span>
                                      <span className={`text-[10px] mt-0.5 font-medium ${sel ? 'text-orange-200' : 'text-gray-400'}`}>{opt.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    {/* === Note Input for Online Work === */}
                    {selectedContext === 'online_work' && (
                      <div className="space-y-3 mb-6 animate-fadeIn">
                        <label
                          htmlFor="online-work-note"
                          className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                        >
                          Ghi chú (tùy chọn)
                        </label>
                        <textarea
                          id="online-work-note"
                          rows={4}
                          value={formNote}
                          onChange={(e) => setFormNote(e.target.value)}
                          placeholder="Nhập lý do làm việc online, công việc dự kiến hoàn thành..."
                          className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none"
                        />
                        <p className="text-xs text-gray-500">
                          Vui lòng mô tả chi tiết lý do và công việc sẽ thực hiện
                          khi làm việc online
                        </p>
                      </div>
                    )}

                    {/* Placeholder when no context selected */}
                    {!selectedContext && (
                      <div className="text-center py-8 text-gray-400">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                          />
                        </svg>
                        <p className="text-sm">
                          Vui lòng chọn loại yêu cầu trước
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* === FooterButtons === */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={
                      isSubmitting ||
                      !selectedContext ||
                      ((selectedContext === 'explanation' ||
                        selectedContext === 'registration' ||
                        selectedContext === 'monthly_leave') &&
                        !selectedReason) ||
                      !isRegistrationTimeValid() ||
                      (!formNote?.trim() && selectedReason !== 'incomplete_attendance' && selectedContext !== 'monthly_leave')
                    }
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-transparent shadow-lg text-base font-semibold transition-all duration-200 ${isSubmitting
                      ? 'bg-purple-400 text-white cursor-wait'
                      : ((selectedContext &&
                        (selectedContext === 'monthly_leave' ||
                          selectedContext === 'online_work')) ||
                        (selectedContext && selectedReason)) &&
                        isRegistrationTimeValid() &&
                        (formNote?.trim() || selectedReason === 'incomplete_attendance' || selectedContext === 'monthly_leave')
                        ? 'text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02]'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Gửi đơn
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetSupplementaryForm();
                      handleCloseSupplementaryRequest();
                    }}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-gray-300 shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                  >
                    Hủy
                  </button>
                </div>

                {/* Form Completion Summary */}
                {selectedContext &&
                  (selectedContext === 'monthly_leave' ||
                    selectedContext === 'online_work' ||
                    selectedReason) && (
                    <div className="px-6 py-3 bg-green-50 border-t border-green-100">
                      <div className="flex items-center text-sm text-green-700">
                        <svg
                          className="w-5 h-5 mr-2 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          <strong>
                            {selectedContext === 'explanation'
                              ? 'Đơn giải trình'
                              : selectedContext === 'registration'
                                ? 'Đơn đăng ký'
                                : selectedContext === 'monthly_leave'
                                  ? 'Nghỉ phép tháng'
                                  : selectedContext === 'online_work'
                                    ? 'Làm việc online'
                                    : ''}
                          </strong>
                          {(selectedContext === 'explanation' ||
                            selectedContext === 'registration' ||
                            selectedContext === 'monthly_leave' ||
                            selectedContext === 'online_work') &&
                            selectedReason && (
                              <>
                                {' - '}
                                {
                                  (selectedContext === 'explanation'
                                    ? explanationReasons
                                    : selectedContext === 'registration'
                                      ? registrationReasons
                                      : selectedContext === 'monthly_leave'
                                        ? monthlyLeaveReasons
                                        : onlineWorkReasons
                                  ).find((r: any) => r.id === selectedReason)?.label
                                }
                              </>
                            )}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Modal */}
      {
        showConfirmModal && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => setShowConfirmModal(false)}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Xác nhận gửi đơn
                </h3>

                {/* Modern Request Summary Card */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                  <div className="space-y-4">
                    {/* Row: Type */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Loại đơn
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                        {selectedContext === 'explanation'
                          ? 'Giải trình'
                          : selectedContext === 'registration'
                            ? 'Đăng ký'
                            : selectedContext === 'monthly_leave'
                              ? 'Nghỉ phép tháng'
                              : 'Làm online'}
                      </span>
                    </div>

                    {/* Row: Reason */}
                    {selectedReason && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-500">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            Lý do
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-purple-700">
                          {
                            (selectedContext === 'explanation'
                              ? explanationReasons
                              : selectedContext === 'registration'
                                ? registrationReasons
                                : selectedContext === 'monthly_leave'
                                  ? monthlyLeaveReasons
                                  : onlineWorkReasons
                            ).find((r: any) => r.id === selectedReason)?.label
                          }
                        </span>
                      </div>
                    )}

                    {/* Row: Note */}
                    {formNote &&
                      (selectedReason === 'incomplete_attendance' ||
                        selectedReason === 'business_trip' ||
                        selectedReason === 'first_day' ||
                        selectedContext === 'registration' ||
                        selectedContext === 'online_work') && (
                        <div className="flex flex-col space-y-1.5 pt-1">
                          <div className="flex items-center text-gray-500">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              Ghi chú chi tiết
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 bg-white/60 p-3 rounded-xl border border-gray-100 italic leading-relaxed">
                            {formNote}
                          </div>
                        </div>
                      )}

                    {/* Row: Date */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Ngày áp dụng
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedDate?.toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Row: Time Range (for Overtime) */}
                    {selectedContext === 'registration' &&
                      selectedReason === 'overtime' && (
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded-xl">
                          <div className="flex items-center text-purple-700">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              Thời gian
                            </span>
                          </div>
                          <span className="text-sm font-black text-purple-800">
                            {overtimeStartTime} — {overtimeEndTime}
                          </span>
                        </div>
                      )}

                    {/* Quota Warning for Explanation */}
                    {selectedContext === 'explanation' &&
                      attendanceStats?.remaining_explanations <= 0 && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3">
                          <svg
                            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-bold">Lưu ý:</span> Bạn đã hết
                            lượt giải trình miễn phí trong tháng này (tối đa 3
                            lần). Đơn này vẫn có thể gửi đi nhưng có thể sẽ bị
                            tính phí bổ sung tùy theo quy định của công ty.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
                <p className="text-gray-600 text-center mb-6">
                  Bạn đã chắc chắn gửi đơn?
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowConfirmModal(false);
                      handleSubmitSupplementaryRequest();
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center ${isSubmitting
                      ? 'bg-purple-400 text-white cursor-wait'
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                      }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang gửi...
                      </div>
                    ) : (
                      'OK'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* ===== DRAWER: Lịch sử đơn tháng ===== */}
      {
        showRequestHistoryDrawer && (
          <div className="fixed inset-0 z-[80] overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
              onClick={() => setShowRequestHistoryDrawer(false)}
            />
            {/* Drawer panel */}
            <div className="absolute inset-y-0 right-0 flex max-w-full">
              <div className="relative w-screen max-w-md transform transition-transform duration-300 ease-in-out">
                <div className="flex h-full flex-col bg-white shadow-2xl">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">Lịch sử đơn tháng</h2>
                          <p className="text-purple-200 text-xs mt-0.5">
                            Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRequestHistoryDrawer(false)}
                        className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {/* Summary badges */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {[
                        { label: 'Giải trình', count: monthlyRequestHistory.explanations.length, color: 'bg-blue-400' },
                        { label: 'Nghỉ phép', count: monthlyRequestHistory.leaveRequests.length, color: 'bg-indigo-400' },
                        { label: 'Đăng ký', count: monthlyRequestHistory.registrations.length, color: 'bg-amber-400' },
                        ...(isManagementUser
                          ? [{ label: 'Làm việc online', count: monthlyRequestHistory.onlineWorks.length, color: 'bg-teal-400' }]
                          : []),
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 bg-white bg-opacity-15 rounded-lg px-2.5 py-1">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-white text-xs font-medium">{item.label}</span>
                          <span className="text-white text-xs font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab filter */}
                  <div className="border-b border-gray-100 bg-gray-50 px-4 pt-3 pb-0">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                      {[
                        {
                          key: 'all',
                          label: 'Tất cả',
                          count: monthlyRequestHistory.explanations.length + monthlyRequestHistory.leaveRequests.length + monthlyRequestHistory.registrations.length
                            + (isManagementUser ? monthlyRequestHistory.onlineWorks.length : 0),
                        },
                        { key: 'explanation', label: 'Giải trình', count: monthlyRequestHistory.explanations.length },
                        { key: 'leave', label: 'Nghỉ phép', count: monthlyRequestHistory.leaveRequests.length },
                        { key: 'registration', label: 'Đăng ký', count: monthlyRequestHistory.registrations.length },
                        ...(isManagementUser
                          ? [{ key: 'online_work', label: 'Làm việc online', count: monthlyRequestHistory.onlineWorks.length }]
                          : []),
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setHistoryActiveTab(tab.key as any)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${historyActiveTab === tab.key
                            ? 'border-purple-600 text-purple-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${historyActiveTab === tab.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {(() => {
                      // Tổng hợp danh sách theo tab
                      const allItems = [
                        ...(historyActiveTab === 'all' || historyActiveTab === 'explanation'
                          ? monthlyRequestHistory.explanations.map((e) => ({ ...e, _type: 'explanation' }))
                          : []),
                        ...(historyActiveTab === 'all' || historyActiveTab === 'leave'
                          ? monthlyRequestHistory.leaveRequests.map((l) => ({ ...l, _type: 'explanation' }))
                          : []),
                        ...(historyActiveTab === 'all' || historyActiveTab === 'registration'
                          ? monthlyRequestHistory.registrations.map((r) => ({ ...r, _type: 'registration' }))
                          : []),
                        ...(historyActiveTab === 'all' || historyActiveTab === 'online_work'
                          ? monthlyRequestHistory.onlineWorks.map((ow) => ({ ...ow, _type: 'online_work' }))
                          : []),
                      ].sort((a, b) => {
                        const dateA = new Date(a.created_at || a.attendance_date || a.work_date || a.event_date || 0).getTime();
                        const dateB = new Date(b.created_at || b.attendance_date || b.event_date || b.work_date || 0).getTime();
                        return dateB - dateA;
                      });

                      if (allItems.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                              <ClipboardDocumentListIcon className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Chưa có đơn nào trong tháng này</p>
                            <p className="text-gray-400 text-xs">Các đơn bạn tạo sẽ hiển thị tại đây</p>
                          </div>
                        );
                      }

                      return (
                        <div className="p-4 space-y-3 bg-gray-50/50 min-h-full">
                          {allItems.map((item, idx) => {
                            const statusConfig = ({
                              APPROVED: { label: 'Đã duyệt', cls: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
                              REJECTED: { label: 'Từ chối', cls: 'bg-red-50 text-red-700 ring-1 ring-red-600/20' },
                              PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' },
                              DRAFT: { label: 'Nháp', cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20' },
                              CANCELLED: { label: 'Đã huỷ', cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-500/20' },
                            } as Record<string, { label: string; cls: string }>)[item.status] || { label: item.status, cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20' };

                            const typeConfig = (() => {
                              if (item._type === 'explanation' && item.explanation_type === 'LEAVE') {
                                return { label: 'Nghỉ phép tháng', bg: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' };
                              }
                              return ({
                                explanation: { label: 'Giải trình', bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' },
                                registration: { label: 'Đăng ký', bg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' },
                                online_work: { label: 'Làm việc online', bg: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20' },
                              } as Record<string, { label: string; bg: string }>)[item._type] || { label: item._type, bg: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20' };
                            })();

                            const dateStr = item.attendance_date || item.work_date || item.created_at;
                            const displayDate = dateStr
                              ? new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              : '—';

                            let requestName = '';
                            if (item._type === 'explanation') {
                              requestName = item.explanation_type ? (EXPLANATION_TYPE_MAP[item.explanation_type] || item.explanation_type) : 'Đơn giải trình';
                            } else if (item._type === 'registration') {
                              requestName = item.registration_type ? (EXPLANATION_TYPE_MAP[item.registration_type] || item.registration_type) : 'Đơn đăng ký';
                            } else if (item._type === 'online_work') {
                              requestName = 'Đơn làm việc online';
                            } else if (item._type === 'explanation' && item.explanation_type === 'LEAVE') {
                              requestName = 'Đơn nghỉ phép tháng';
                            }

                            return (
                              <div key={`${item._type}-${item.id}-${idx}`} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300">
                                <div className="flex flex-col gap-3">
                                  {/* Header: Badges & Code */}
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${typeConfig.bg}`}>
                                        {typeConfig.label}
                                      </span>
                                      {item.request_code && (
                                        <span className="text-[11px] font-mono text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100/50">
                                          {item.request_code}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${statusConfig.cls}`}>
                                      {statusConfig.label}
                                    </span>
                                  </div>

                                  {/* Body: Title & Reason */}
                                  <div className="flex flex-col gap-2 relative z-10">
                                    {requestName && (
                                      <h4 className="text-[15px] font-bold text-gray-900 leading-snug">
                                        {requestName}
                                      </h4>
                                    )}

                                    {(() => {
                                      let rawReason = item.reason || item.work_plan || '';

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
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/60 shadow-inner overflow-hidden relative">
                                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-200 to-gray-100"></div>
                                          <div className="flex items-start gap-2 pl-1">
                                            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                                            </svg>
                                            <span className="text-[13px] text-gray-600 font-medium leading-relaxed line-clamp-2">
                                              {rawReason}
                                            </span>
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>

                                  {/* Footer: Date */}
                                  <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span className="text-xs font-semibold">{displayDate}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <button
                      onClick={() => {
                        refreshAllData();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Làm mới
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Notification Dialog */}

      {
        notification.show && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                <div>
                  <div
                    className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${notification.type === 'success'
                      ? 'bg-green-100'
                      : notification.type === 'error'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                      }`}
                  >
                    {notification.type === 'success' ? (
                      <CheckCircleIcon
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    ) : notification.type === 'error' ? (
                      <XMarkIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <ClockIcon
                        className="h-6 w-6 text-yellow-600"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-bold text-gray-900">
                      {notification.title}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{notification.message}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className={`inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors ${notification.type === 'success'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : notification.type === 'error'
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      }`}
                    onClick={() =>
                      setNotification((prev) => ({ ...prev, show: false }))
                    }
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AttendanceManagement;
