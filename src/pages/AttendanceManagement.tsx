import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import {
  attendanceService,
  AttendanceRecord,
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
  console.log('attendanceStats', attendanceStats);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<
    AttendanceRecord[]
  >([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [approvedExplanations, setApprovedExplanations] = useState<any[]>([]);
  console.log('approvedExplanations', approvedExplanations);
  const [approvedRegistrations, setApprovedRegistrations] = useState<any[]>([]);
  const [approvedLeaveRequests, setApprovedLeaveRequests] = useState<any[]>([]);
  const [onlineWorkRequests, setOnlineWorkRequests] = useState<any[]>([]);
  const [monthlyWorkCredits, setMonthlyWorkCredits] = useState<any>(null);
  const [workCreditsLoading, setWorkCreditsLoading] = useState(false);

  // Kiểm tra ngày được chọn có dữ liệu chấm công không (dùng để disable Đơn giải trình)
  const hasAttendanceData = attendanceDetails && attendanceDetails.length > 0;

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

  // Mapping loại đơn giải trình/đăng ký sang tiếng Việt
  const EXPLANATION_TYPE_MAP: Record<string, string> = {
    LATE: 'Giải trình đi muộn',
    EARLY_LEAVE: 'Giải trình về sớm',
    INCOMPLETE_ATTENDANCE: 'Giải trình quên chấm công',
    BUSINESS_TRIP: 'Giải trình đi công tác',
    FIRST_DAY: 'Giải trình ngày đầu đi làm',
    OVERTIME: 'Đăng ký tăng ca',
    EXTRA_HOURS: 'Đăng ký làm thêm giờ',
    NIGHT_SHIFT: 'Đăng ký trực tối',
    LIVE: 'Đăng ký Live',
  };

  const getExplanationTypeLabel = (type: string): string =>
    EXPLANATION_TYPE_MAP[type] || type;

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
  type ReasonType = ExplanationReason | RegistrationReason | null;

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
  // - Minimum 2 hours
  const isRegistrationTimeValid = (): boolean => {
    if (selectedContext !== 'registration') return true;

    const MIN_HOURS = 2;

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

    const MIN_HOURS = 2;
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
    if (duration < MIN_HOURS) return `Tối thiểu ${MIN_HOURS} tiếng`;
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

  // Handle context selection
  const handleContextSelect = (context: ContextType) => {
    setSelectedContext(context);
    setSelectedReason(null); // Reset reason when context changes
    // Only move to step 2 for contexts that have sub-reasons
    if (context && (context === 'explanation' || context === 'registration')) {
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
      default:
        return null;
    }
  };
  // ===================== END STEP-BASED FORM STATE =====================
  const [calendarData, setCalendarData] = useState<any[]>([]);

  // Check if user has permission to upload attendance files
  // For now, only ADMIN role can upload
  const canUploadAttendance = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      // First, fetch current employee
      const employee = await fetchCurrentEmployee();

      // Then fetch attendance stats and records using the employee data
      if (employee) {
        await fetchAttendanceStats(employee);
        await fetchAttendanceRecords(employee);
        // Also fetch monthly work credits and calendar data
        await fetchMonthlyWorkCredits(undefined, undefined, employee.id);
        await fetchCalendarData(undefined, undefined, employee.id);
      }
    };

    fetchData();
  }, []);

  // Add effect to refetch stats when calendar month changes
  useEffect(() => {
    if (currentEmployee) {
      fetchAttendanceStats(currentEmployee);
      fetchAttendanceRecords(currentEmployee);
      // Also refetch monthly work credits and calendar data when month changes
      fetchMonthlyWorkCredits(
        currentDate.getMonth() + 1,
        currentDate.getFullYear(),
        currentEmployee.id
      );
      fetchCalendarData(
        currentDate.getMonth() + 1,
        currentDate.getFullYear(),
        currentEmployee.id
      );
    }
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

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

  const fetchAttendanceStats = async (employee?: Employee | null) => {
    try {
      setLoading(true);
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

      console.log('🔵 [STATS] Base stats:', stats.statistics);
      console.log(
        '🔵 [STATS] Explanation stats:',
        explanationStats?.statistics
      );

      // Combine stats - merge all fields from both APIs
      const mergedStats = {
        ...stats.statistics,
        ...(explanationStats?.statistics || {}),
      };

      console.log('✅ [STATS] Merged stats:', mergedStats);
      console.log(
        '✅ [STATS] Final remaining_online_work:',
        mergedStats.remaining_online_work
      );

      setAttendanceStats(mergedStats);
    } catch (error) {
      console.error('❌ [STATS] Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async (employee?: Employee | null) => {
    try {
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

      // Reuse the formatDateLocal function from fetchAttendanceStats
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Use employee parameter or currentEmployee from state
      const targetEmployee = employee || currentEmployee;

      const response = await attendanceService.getAttendanceRecords({
        start_date: formatDateLocal(firstDayOfMonth),
        end_date: formatDateLocal(lastDayOfMonth),
        employee_id: targetEmployee?.id,
        department_id: targetEmployee?.department?.id,
        page_size: 50,
      });
      setAttendanceRecords(response.results);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const fetchMonthlyWorkCredits = async (
    month?: number,
    year?: number,
    employeeId?: number
  ) => {
    try {
      setWorkCreditsLoading(true);
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
    } finally {
      setWorkCreditsLoading(false);
    }
  };

  const fetchCalendarData = async (
    month?: number,
    year?: number,
    employeeId?: number
  ) => {
    try {
      const today = currentDate || new Date();
      const params = {
        year: year || today.getFullYear(),
        month: month || today.getMonth() + 1,
        employee_id: employeeId || currentEmployee?.id,
      };

      const response = await attendanceService.getCalendarView(params);
      setCalendarData(response.calendar_data || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setCalendarData([]);
    }
  };

  const handleDateClick = async (date: Date, dayData?: any) => {
    console.log('Date clicked in AttendanceManagement:', date);
    console.log('Day data:', dayData);

    setSelectedDate(date);
    setShowAttendanceModal(true);
    setFetchingDetails(true);

    // Set approved requests từ dayData ngay lập tức (không reset về mảng rỗng)
    setApprovedExplanations(dayData?.approvedExplanations || []);
    setApprovedRegistrations(dayData?.approvedRegistrations || []);
    setApprovedLeaveRequests(dayData?.approvedLeaveRequests || []);
    setOnlineWorkRequests(dayData?.approvedOnlineWorks || []);

    try {
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

      // Log dayData for debugging (approved requests đã được set ở trên)
      if (dayData) {
        console.log('Using dayData for approved requests:', dayData);
      }

      // Calculate summary
      if (response.results.length > 0) {
        const summary = {
          totalHours: response.results.reduce(
            (sum: number, record: AttendanceRecord) =>
              sum + (record.working_hours || 0),
            0
          ),
          presentCount: response.results.filter(
            (record: AttendanceRecord) => record.status === 'PRESENT'
          ).length,
          lateCount: response.results.filter(
            (record: AttendanceRecord) => record.status === 'LATE'
          ).length,
          earlyLeaveCount: response.results.filter(
            (record: AttendanceRecord) => record.status === 'EARLY_LEAVE'
          ).length,
          absentCount: response.results.filter(
            (record: AttendanceRecord) => record.status === 'ABSENT'
          ).length,
          halfDayCount: response.results.filter(
            (record: AttendanceRecord) => record.status === 'HALF_DAY'
          ).length,
          totalShifts: response.results.length,
        };
        setAttendanceSummary(summary);
      } else {
        // Default summary if no records
        setAttendanceSummary({
          totalHours: 0,
          presentCount: 0,
          lateCount: 0,
          earlyLeaveCount: 0,
          absentCount: 0,
          halfDayCount: 0,
          totalShifts: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      setAttendanceDetails([]);
      setAttendanceSummary(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setShowAttendanceModal(false);
    setSelectedDate(null);
    setApprovedExplanations([]);
    setApprovedLeaveRequests([]);
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
      alert('Vui lòng hoàn thành thông tin trước khi gửi.');
      return;
    }

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
      } else if (selectedContext === 'monthly_leave') {
        reasonLabel = 'Nghỉ phép tháng';
      } else if (selectedContext === 'online_work') {
        reasonLabel = 'Làm việc online';
      }

      const finalReason = formNote
        ? `${reasonLabel}: ${formNote}`
        : reasonLabel;

      // Map expected status
      let expectedStatus = 'PRESENT';
      if (selectedContext === 'monthly_leave') {
        expectedStatus = 'ABSENT'; // Or specific leave status if available
      }

      let result;
      if (selectedContext === 'online_work') {
        console.log('🔵 [ONLINE WORK] Bắt đầu tạo đơn làm việc online');
        console.log('🔵 [ONLINE WORK] Selected Date:', selectedDate);
        console.log('🔵 [ONLINE WORK] Date String:', dateStr);
        console.log('🔵 [ONLINE WORK] Current Employee:', currentEmployee);
        console.log('🔵 [ONLINE WORK] Form Note:', formNote);
        console.log('🔵 [ONLINE WORK] Final Reason:', finalReason);

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

          // Refresh stats to update remaining quota
          console.log('🔄 [ONLINE WORK] Refreshing stats...');
          await fetchAttendanceStats();

          alert('Đơn làm việc online đã được gửi thành công!');
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

          alert(errorMessage);
          return;
        }
      } else {
        // Prepare data for API for other request types
        const isRegistration =
          selectedContext === 'registration' ||
          selectedReason === 'business_trip' ||
          selectedReason === 'first_day';

        // MAP REASON TO EXPLANATION_TYPE
        let explanationType = 'LATE'; // default

        if (selectedContext === 'explanation') {
          const typeMap: Record<string, string> = {
            late_minutes: 'LATE',
            early_leave_minutes: 'EARLY_LEAVE',
            incomplete_attendance: 'INCOMPLETE_ATTENDANCE',
            business_trip: 'BUSINESS_TRIP',
            first_day: 'FIRST_DAY',
          };
          explanationType = typeMap[selectedReason as string] || 'LATE';
        } else if (selectedContext === 'registration') {
          const typeMap: Record<string, string> = {
            overtime: 'OVERTIME',
            extra_hours: 'EXTRA_HOURS',
            night_shift: 'NIGHT_SHIFT',
            live: 'LIVE',
          };
          explanationType = typeMap[selectedReason as string] || 'OVERTIME';
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
          explanation_type: explanationType, // THÊM FIELD MỚI
          status: 'PENDING',
          is_registration: isRegistration,
        };

        // Add time fields if applicable
        if (selectedContext === 'registration') {
          if (selectedReason === 'overtime') {
            explanationData.expected_check_in = overtimeStartTime;
            explanationData.expected_check_out = overtimeEndTime;
          } else if (selectedReason === 'extra_hours') {
            explanationData.expected_check_in = extraHoursStartTime;
            explanationData.expected_check_out = extraHoursEndTime;
          } else if (selectedReason === 'night_shift') {
            explanationData.expected_check_in = nightShiftStartTime;
            explanationData.expected_check_out = nightShiftEndTime;
          } else if (selectedReason === 'live') {
            explanationData.expected_check_in = liveStartTime;
            explanationData.expected_check_out = liveEndTime;
          }
        }

        result =
          await attendanceService.createAttendanceExplanation(explanationData);
        console.log('Attendance explanation created:', result);
        alert('Đơn bổ sung công đã được gửi thành công!');
      }

      await fetchAttendanceStats(currentEmployee);
      handleCloseSupplementaryRequest();
    } catch (error: any) {
      console.error('Error submitting supplementary request:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (selectedContext === 'online_work'
          ? 'Gửi đơn làm việc online thất bại. Vui lòng thử lại.'
          : 'Gửi đơn bổ sung công thất bại. Vui lòng thử lại.');
      alert(`Lỗi: ${errorMessage}`);
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
      fetchAttendanceStats(currentEmployee);
      fetchAttendanceRecords(currentEmployee);
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý chấm công</h1>
        <p className="text-gray-600 mt-2">
          Theo dõi và quản lý chấm công, đi muộn, về sớm, nghỉ phép của nhân
          viên.
        </p>
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
                    className={`px-4 py-2 rounded-md transition-colors ${
                      uploading
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
                  className={`mt-4 p-3 rounded-md w-full max-w-md ${
                    uploadMessage.type === 'success'
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

      {/* Summary Statistics - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col justify-between">
          <h3 className="font-medium text-blue-900 text-xs md:text-sm">
            Tổng ngày công
          </h3>
          <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1 md:mt-2">
            {monthlyWorkCredits?.results?.[0]?.attendance_summary?.total_days ||
              0}
          </p>
          <p className="text-[10px] md:text-xs text-blue-600 mt-1">
            Tháng hiện tại
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col justify-between">
          <h3 className="font-medium text-green-900 text-xs md:text-sm">
            Ngày đủ công
          </h3>
          <p className="text-xl md:text-2xl font-bold text-green-700 mt-1 md:mt-2">
            {(() => {
              const dateSet = new Set<string>();
              calendarData.forEach((record: any) => {
                if (
                  record.work_coefficient !== undefined &&
                  record.work_coefficient >= 1.0 &&
                  (!record.late_minutes || record.late_minutes === 0) &&
                  (!record.early_leave_minutes ||
                    record.early_leave_minutes === 0)
                ) {
                  dateSet.add(record.date);
                }
              });
              return dateSet.size;
            })()}
          </p>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col justify-between">
          <h3 className="font-medium text-orange-900 text-xs md:text-sm">
            Nửa ngày công
          </h3>
          <p className="text-xl md:text-2xl font-bold text-orange-700 mt-1 md:mt-2">
            {(() => {
              const dateSet = new Set<string>();
              calendarData.forEach((record: any) => {
                if (
                  record.work_coefficient !== undefined &&
                  record.work_coefficient >= 0.5 &&
                  record.work_coefficient < 1.0 &&
                  record.status === 'HALF_DAY'
                ) {
                  dateSet.add(record.date);
                }
              });
              return dateSet.size;
            })()}
          </p>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex flex-col justify-between">
          <h3 className="font-medium text-yellow-900 text-xs md:text-sm">
            Đi muộn/sớm
          </h3>
          <p className="text-xl md:text-2xl font-bold text-yellow-700 mt-1 md:mt-2">
            {
              calendarData
                .filter((record: any) => {
                  return (
                    (record.late_minutes && record.late_minutes > 0) ||
                    (record.early_leave_minutes &&
                      record.early_leave_minutes > 0)
                  );
                })
                .reduce((acc: Set<string>, record: any) => {
                  acc.add(record.date);
                  return acc;
                }, new Set<string>()).size
            }
          </p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex flex-col justify-between">
          <h3 className="font-medium text-purple-900 text-xs md:text-sm">
            Quên chấm công
          </h3>
          <p className="text-xl md:text-2xl font-bold text-purple-700 mt-1 md:mt-2">
            {
              calendarData
                .filter(
                  (record: any) => record.status === 'INCOMPLETE_ATTENDANCE'
                )
                .reduce((acc: Set<string>, record: any) => {
                  acc.add(record.date);
                  return acc;
                }, new Set<string>()).size
            }
          </p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col justify-between">
          <h3 className="font-medium text-red-900 text-xs md:text-sm">
            Vắng mặt
          </h3>
          <p className="text-xl md:text-2xl font-bold text-red-700 mt-1 md:mt-2">
            {
              calendarData
                .filter((record: any) => {
                  return (
                    record.work_coefficient === 0 && record.status === 'ABSENT'
                  );
                })
                .reduce((acc: Set<string>, record: any) => {
                  acc.add(record.date);
                  return acc;
                }, new Set<string>()).size
            }
          </p>
        </div>

        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col justify-between">
          <h3 className="font-medium text-indigo-900 text-xs md:text-sm">
            Nghỉ phép tháng
          </h3>
          <div>
            <p className="text-xl md:text-2xl font-bold text-indigo-700 mt-1 md:mt-2">
              0
            </p>
            <p className="text-[10px] md:text-xs text-indigo-600 mt-1">
              Tháng hiện tại
            </p>
          </div>
        </div>

        {/* Hiển thị cho Trưởng bộ phận (is_management = true) */}
        {currentEmployee?.position?.is_management &&
          attendanceStats?.max_online_work_per_month > 0 && (
            <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 flex flex-col justify-between">
              <h3 className="font-medium text-teal-900 text-xs md:text-sm">
                Làm việc online
              </h3>
              <div>
                <p className="text-xl md:text-2xl font-bold text-teal-700 mt-1 md:mt-2">
                  {attendanceStats?.remaining_online_work || 0}
                </p>
                <p className="text-[10px] md:text-xs text-teal-600 mt-1">
                  Số buổi còn lại
                </p>
              </div>
            </div>
          )}

        {attendanceStats?.max_explanations_per_month > 0 && (
          <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-100 flex flex-col justify-between">
            <h3 className="font-medium text-cyan-900 text-xs md:text-sm">
              Giải trình còn lại
            </h3>
            <div>
              <p className="text-xl md:text-2xl font-bold text-cyan-700 mt-1 md:mt-2">
                {attendanceStats?.remaining_explanations || 0}
              </p>
              <p className="text-[10px] md:text-xs text-cyan-600 mt-1">
                Số lần còn lại
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="mb-6">
        <AttendanceCalendar
          onDateClick={handleDateClick}
          onMonthChange={(date: Date) => setCurrentDate(date)}
          employeeId={currentEmployee?.id}
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
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Thông tin nhân viên
                        </h4>
                        <p className="text-sm text-gray-600">
                          {currentEmployee
                            ? `${currentEmployee.full_name} - ${currentEmployee.employee_id}`
                            : 'Đang tải thông tin...'}
                        </p>
                        {currentEmployee?.department && (
                          <p className="text-xs text-gray-500 mt-1">
                            Phòng ban: {currentEmployee.department.name}
                          </p>
                        )}
                        {currentEmployee?.position && (
                          <p className="text-xs text-gray-500">
                            Vị trí: {currentEmployee.position.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requests Section */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentPlusIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Đơn bổ sung công & Làm việc online
                    </h4>

                    {/* All Requests Combined */}
                    {[
                      ...approvedExplanations.map((e) => ({
                        ...e,
                        type: 'explanation',
                      })),
                      ...approvedRegistrations.map((r) => ({
                        ...r,
                        type: 'registration',
                      })),
                      ...onlineWorkRequests.map((ow) => ({
                        ...ow,
                        type: 'online_work',
                      })),
                      ...approvedLeaveRequests.map((l) => ({
                        ...l,
                        type: 'leave',
                      })),
                    ].length > 0 ? (
                      <div className="space-y-4">
                        {[
                          ...approvedExplanations.map((e) => ({
                            ...e,
                            type: 'explanation',
                          })),
                          ...approvedRegistrations.map((r) => ({
                            ...r,
                            type: 'registration',
                          })),
                          ...onlineWorkRequests.map((ow) => ({
                            ...ow,
                            type: 'online_work',
                          })),
                          ...approvedLeaveRequests.map((l) => ({
                            ...l,
                            type: 'leave',
                          })),
                        ].map((request, reqIdx) => (
                          <div
                            key={reqIdx}
                            className={`rounded-lg p-3 border-l-4 ${
                              request.status === 'APPROVED'
                                ? 'bg-green-50 border-green-500'
                                : request.status === 'REJECTED'
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-yellow-50 border-yellow-500'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <p className="font-bold text-gray-900 text-sm">
                                    {request.request_code}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                      request.type === 'explanation'
                                        ? 'bg-purple-100 text-purple-800'
                                        : request.type === 'registration'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : request.type === 'online_work'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-orange-100 text-orange-800'
                                    }`}
                                  >
                                    {(request.type === 'explanation' || request.type === 'registration')
                                      ? getExplanationTypeLabel(request.explanation_type)
                                      : request.type === 'online_work'
                                        ? 'Làm việc online'
                                        : 'Nghỉ phép'}
                                  </span>
                                  {request.status === 'PENDING' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                                      Chờ duyệt
                                    </span>
                                  )}
                                </div>

                                {request.type === 'explanation' &&
                                  ![
                                    'OVERTIME',
                                    'EXTRA_HOURS',
                                    'NIGHT_SHIFT',
                                    'LIVE',
                                  ].includes(request.explanation_type) && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Thay đổi:{' '}
                                      {getOriginalStatusText(
                                        request.original_status
                                      )}{' '}
                                      →{' '}
                                      {getExpectedStatusText(
                                        request.expected_status
                                      )}
                                    </p>
                                  )}
                                {request.type === 'online_work' && request.reason && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Lý do: {request.reason}
                                  </p>
                                )}
                                {request.type === 'leave' && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Loại nghỉ: {request.leave_type}
                                  </p>
                                )}

                                {/* Sequential Approval Steps */}
                                {(request.type === 'explanation' ||
                                  request.type === 'registration' ||
                                  request.type === 'online_work') && (
                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* Step 1: Manager */}
                                    <div className="flex items-center space-x-2 p-1.5 bg-white bg-opacity-50 rounded border border-gray-100">
                                      {request.direct_manager_approved || request.status === 'APPROVED' ? (
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                      ) : request.status === 'REJECTED' &&
                                        !request.direct_manager_approved ? (
                                        <NoSymbolIcon className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                      )}
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                                          Quản lý trực tiếp
                                        </span>
                                        <span className="text-xs text-gray-900">
                                          {request.direct_manager_approved_by_name ||
                                            (request.status === 'APPROVED'
                                              ? 'Tự động duyệt'
                                              : request.status === 'REJECTED' &&
                                                !request.direct_manager_approved
                                                ? 'Từ chối'
                                                : 'Chờ duyệt')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Step 2: HR */}
                                    <div className="flex items-center space-x-2 p-1.5 bg-white bg-opacity-50 rounded border border-gray-100">
                                      {request.hr_approved || request.status === 'APPROVED' ? (
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                      ) : request.status === 'REJECTED' &&
                                        request.direct_manager_approved ? (
                                        <NoSymbolIcon className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                      )}
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                                          Nhân sự (HR)
                                        </span>
                                        <span className="text-xs text-gray-900">
                                          {request.hr_approved_by_name ||
                                            (request.status === 'APPROVED' && !request.hr_approved
                                              ? 'Không cần duyệt'
                                              : request.status === 'APPROVED'
                                                ? 'Đã duyệt'
                                                : request.status === 'REJECTED' &&
                                                  request.direct_manager_approved
                                                  ? 'Từ chối'
                                                  : 'Chờ duyệt')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {request.type === 'leave' && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">
                                      Duyệt bởi:{' '}
                                      {request.approved_by_name || '...'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    request.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-800'
                                      : request.status === 'REJECTED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {request.status === 'APPROVED'
                                    ? 'Đã duyệt'
                                    : request.status === 'REJECTED'
                                      ? 'Từ chối'
                                      : 'Chờ duyệt'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">
                          Không có đơn bổ sung công hoặc làm online
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
                      <p className="text-xs text-primary-700">
                        <span className="font-bold">Tổng cộng:</span>{' '}
                        {approvedExplanations.length} giải trình,{' '}
                        {approvedRegistrations.length} đăng ký,{' '}
                        {onlineWorkRequests.length} làm online,{' '}
                        {approvedLeaveRequests.length} nghỉ phép.
                      </p>
                    </div>
                  </div>

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
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ca làm
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Giờ vào
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Giờ ra
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tổng giờ
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ghi chú
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
                                  // Handle INCOMPLETE_ATTENDANCE: swap check_in/check_out based on time
                                  if (
                                    record.status === 'INCOMPLETE_ATTENDANCE' &&
                                    record.check_in &&
                                    !record.check_out
                                  ) {
                                    const checkInTime =
                                      record.check_in.substring(0, 5); // HH:MM
                                    if (checkInTime >= '12:00') {
                                      // check_in >= 12:00 → value thực ra là check_out, hiển thị '--:--' cho check_in
                                      return '--:--';
                                    }
                                  }
                                  // Normal case
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
                                  // Handle INCOMPLETE_ATTENDANCE: swap check_in/check_out based on time
                                  if (
                                    record.status === 'INCOMPLETE_ATTENDANCE' &&
                                    record.check_in &&
                                    !record.check_out
                                  ) {
                                    const checkInTime =
                                      record.check_in.substring(0, 5); // HH:MM
                                    if (checkInTime >= '12:00') {
                                      // check_in >= 12:00 → value thực ra là check_out, hiển thị value của check_in cho check_out
                                      return new Date(
                                        `2000-01-01T${record.check_in}`
                                      ).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      });
                                    }
                                  }
                                  // Normal case
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
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    record.status === 'PRESENT'
                                      ? 'bg-green-100 text-green-800'
                                      : record.status === 'LATE'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : record.status === 'EARLY_LEAVE'
                                          ? 'bg-orange-100 text-orange-800'
                                          : record.status === 'ABSENT'
                                            ? 'bg-red-100 text-red-800'
                                            : record.status === 'HALF_DAY'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {record.status_display || record.status}
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

                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 text-sm">
                        Tổng giờ làm
                      </h4>
                      <p className="text-xl font-bold text-blue-700 mt-1">
                        {attendanceSummary
                          ? `${Number(attendanceSummary.totalHours).toFixed(1)} giờ`
                          : '0 giờ'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900 text-sm">
                        Ca đủ công
                      </h4>
                      <p className="text-xl font-bold text-green-700 mt-1">
                        {attendanceSummary?.presentCount || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-900 text-sm">
                        Ca đi muộn
                      </h4>
                      <p className="text-xl font-bold text-yellow-700 mt-1">
                        {attendanceSummary?.lateCount || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Tổng ca
                      </h4>
                      <p className="text-xl font-bold text-gray-700 mt-1">
                        {attendanceSummary?.totalShifts || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    {/* Ẩn nút làm đơn bổ sung công nếu:
                        1. Đã có đơn được duyệt
                        2. Ngày được chọn thuộc tháng trước (chỉ cho phép làm đơn cho tháng hiện tại hoặc tháng sau)
                    */}
                    {(() => {
                      // Kiểm tra ngày được chọn có thuộc tháng trước không
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      const selectedMonth = selectedDate?.getMonth() || 0;
                      const selectedYear = selectedDate?.getFullYear() || 0;

                      // Tính tổng tháng để so sánh (năm * 12 + tháng)
                      const currentTotalMonths =
                        currentYear * 12 + currentMonth;
                      const selectedTotalMonths =
                        selectedYear * 12 + selectedMonth;

                      // Chỉ hiển thị nút nếu ngày được chọn thuộc tháng hiện tại hoặc tháng sau
                      const isCurrentOrFutureMonth =
                        selectedTotalMonths >= currentTotalMonths;

                      // Điều kiện hiển thị: không có đơn được duyệt VÀ thuộc tháng hiện tại hoặc tháng sau
                      const shouldShowButton =
                        approvedExplanations.length === 0 &&
                        approvedLeaveRequests.length === 0 &&
                        isCurrentOrFutureMonth;

                      return shouldShowButton ? (
                        <button
                          onClick={handleOpenSupplementaryRequest}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <DocumentPlusIcon className="h-5 w-5 mr-2" />
                          Làm đơn bổ sung
                        </button>
                      ) : null;
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
      )}

      {/* Supplementary Request Modal */}
      {showSupplementaryRequestModal && selectedDate && (
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
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                            currentStep >= 1
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
                          className={`ml-3 text-sm font-medium hidden sm:block transition-colors ${
                            currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          Chọn loại yêu cầu
                        </span>
                      </div>

                      {/* Connector Line */}
                      <div
                        className={`w-12 sm:w-24 h-1 mx-4 rounded-full transition-all duration-500 ${
                          currentStep >= 2
                            ? 'bg-gradient-to-r from-purple-600 to-purple-600'
                            : 'bg-gradient-to-r from-purple-600 to-gray-300'
                        }`}
                      />

                      {/* Step 2 */}
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                            currentStep >= 2
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
                          className={`ml-3 text-sm font-medium hidden sm:block transition-colors ${
                            currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
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
                        disabled={!hasAttendanceData}
                        onClick={() =>
                          hasAttendanceData &&
                          handleContextSelect('explanation')
                        }
                        className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 text-left ${
                          !hasAttendanceData
                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                            : selectedContext === 'explanation'
                              ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600 hover:shadow-lg'
                              : 'border-gray-200 hover:border-purple-400 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                              selectedContext === 'explanation'
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
                              Đi muộn, về sớm, ngày đầu đi làm, quên chấm công
                            </p>
                            {!hasAttendanceData ? (
                              <p className="mt-1 text-xs text-red-500">
                                Cần có dữ liệu chấm công để giải trình
                              </p>
                            ) : (
                              attendanceStats?.remaining_explanations <= 0 && (
                                <p className="mt-1 text-xs text-amber-600 font-medium">
                                  Cảnh báo: Đã hết lượt giải trình miễn phí (quá
                                  3 lần/tháng)
                                </p>
                              )
                            )}
                          </div>
                        </div>
                        {/* Selected indicator */}
                        {selectedContext === 'explanation' &&
                          hasAttendanceData && (
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
                        className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 text-left ${
                          selectedContext === 'registration'
                            ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600'
                            : 'border-gray-200 hover:border-purple-400'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                              selectedContext === 'registration'
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
                      <button
                        type="button"
                        onClick={() => handleContextSelect('monthly_leave')}
                        className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 text-left
    ${
      selectedContext === 'monthly_leave'
        ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600'
        : 'border-gray-200 hover:border-purple-400'
    }
    ${!(currentEmployee?.position?.is_management && attendanceStats?.max_online_work_per_month > 0) ? 'sm:col-span-2' : ''}
  `}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                              selectedContext === 'monthly_leave'
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
                              Đăng ký nghỉ phép trong tháng
                            </p>
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

                      {/* Card 4: Làm việc online */}
                      {currentEmployee?.position?.is_management &&
                        attendanceStats?.max_online_work_per_month > 0 && (
                          <button
                            type="button"
                            disabled={
                              attendanceStats?.remaining_online_work <= 0
                            }
                            onClick={() =>
                              attendanceStats?.remaining_online_work > 0 &&
                              handleContextSelect('online_work')
                            }
                            className={`group relative p-5 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 text-left ${
                              attendanceStats?.remaining_online_work <= 0
                                ? 'opacity-50 cursor-not-allowed border-gray-200'
                                : selectedContext === 'online_work'
                                  ? 'border-purple-500 ring-2 ring-purple-100 hover:border-purple-600 hover:shadow-lg'
                                  : 'border-gray-200 hover:border-purple-400 hover:shadow-lg'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div
                                className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                                  selectedContext === 'online_work'
                                    ? 'bg-purple-100 group-hover:bg-purple-200'
                                    : 'bg-teal-50 group-hover:bg-teal-100'
                                }`}
                              >
                                <svg
                                  className={`w-6 h-6 ${
                                    selectedContext === 'online_work'
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
                                  Đăng ký làm việc từ xa
                                </p>
                                {attendanceStats?.remaining_online_work <=
                                  0 && (
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
                        )}
                    </div>
                  </div>

                  {/* === ReasonSelector (Step 2) === */}
                  {selectedContext &&
                    (selectedContext === 'explanation' ||
                      selectedContext === 'registration') && (
                      <div className="space-y-4 mb-6 animate-fadeIn">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Chọn lý do cụ thể
                        </h3>

                        {/* Chip buttons - Render based on selected context */}
                        <div className="flex flex-wrap gap-3">
                          {(selectedContext === 'explanation'
                            ? explanationReasons
                            : registrationReasons
                          ).map((reason) => {
                            const isSelected = selectedReason === reason.id;
                            return (
                              <button
                                key={reason.id}
                                type="button"
                                onClick={() => handleReasonSelect(reason.id)}
                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-150 ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                }`}
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
                                    </div>

                                    {/* Penalty Amount for Late */}
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <svg
                                            className="w-5 h-5 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          <span className="text-sm font-medium text-red-800">
                                            Số tiền phạt
                                          </span>
                                        </div>
                                        <span className="text-lg font-bold text-red-700">
                                          {(
                                            attendanceDetails[0].late_minutes *
                                            5000
                                          ).toLocaleString('vi-VN')}{' '}
                                          đ
                                        </span>
                                      </div>
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
                                    </div>

                                    {/* Penalty Amount for Early Leave */}
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <svg
                                            className="w-5 h-5 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          <span className="text-sm font-medium text-red-800">
                                            Số tiền phạt
                                          </span>
                                        </div>
                                        <span className="text-lg font-bold text-red-700">
                                          {(
                                            attendanceDetails[0]
                                              .early_leave_minutes * 5000
                                          ).toLocaleString('vi-VN')}{' '}
                                          đ
                                        </span>
                                      </div>
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
                                className={`flex items-center justify-between bg-white rounded-lg p-3 border ${
                                  overtimeDuration <= 0 || overtimeDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                }`}
                              >
                                <span className="text-sm text-gray-600">
                                  Tổng thời gian:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    overtimeDuration <= 0 ||
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
                                className={`flex items-center justify-between bg-white rounded-lg p-3 border ${
                                  extraHoursDuration <= 0 ||
                                  extraHoursDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                }`}
                              >
                                <span className="text-sm text-gray-600">
                                  Tổng thời gian làm thêm:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    extraHoursDuration <= 0 ||
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

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Giờ bắt đầu */}
                            <div>
                              <label
                                htmlFor="night-shift-start"
                                className="block text-xs font-medium text-gray-500 uppercase mb-2"
                              >
                                Giờ bắt đầu
                              </label>
                              <input
                                type="time"
                                id="night-shift-start"
                                value={nightShiftStartTime}
                                onChange={(e) =>
                                  setNightShiftStartTime(e.target.value)
                                }
                                className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                              />
                            </div>

                            {/* Giờ kết thúc */}
                            <div>
                              <label
                                htmlFor="night-shift-end"
                                className="block text-xs font-medium text-gray-500 uppercase mb-2"
                              >
                                Giờ kết thúc
                              </label>
                              <input
                                type="time"
                                id="night-shift-end"
                                value={nightShiftEndTime}
                                onChange={(e) =>
                                  setNightShiftEndTime(e.target.value)
                                }
                                className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200"
                              />
                            </div>
                          </div>

                          {/* Duration display */}
                          {nightShiftStartTime && nightShiftEndTime && (
                            <div className="mt-4">
                              <div
                                className={`flex items-center justify-between bg-white rounded-lg p-3 border ${
                                  nightShiftDuration <= 0 ||
                                  nightShiftDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                }`}
                              >
                                <span className="text-sm text-gray-600">
                                  Tổng thời gian trực tại nhà:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    nightShiftDuration <= 0 ||
                                    nightShiftDuration < 2
                                      ? 'text-red-600'
                                      : 'text-purple-700'
                                  }`}
                                >
                                  {nightShiftDuration.toFixed(1)} giờ
                                </span>
                              </div>

                              {/* Validation error */}
                              {selectedReason === 'night_shift' &&
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
                        </div>
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
                                className={`flex items-center justify-between bg-white rounded-lg p-3 border ${
                                  liveDuration <= 0 || liveDuration < 2
                                    ? 'border-red-300'
                                    : 'border-gray-100'
                                }`}
                              >
                                <span className="text-sm text-gray-600">
                                  Tổng thời gian live:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    liveDuration <= 0 || liveDuration < 2
                                      ? 'text-red-600'
                                      : 'text-purple-700'
                                  }`}
                                >
                                  {liveDuration.toFixed(1)} giờ
                                </span>
                              </div>

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
                            </div>
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
                          Ghi chú
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
                          Ghi chú
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

                  {/* === Note Input for Incomplete Attendance === */}
                  {selectedContext === 'explanation' &&
                    selectedReason === 'incomplete_attendance' && (
                      <div className="space-y-3 mb-6 animate-fadeIn">
                        <label
                          htmlFor="incomplete-attendance-note"
                          className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                        >
                          Ghi chú
                        </label>
                        <textarea
                          id="incomplete-attendance-note"
                          rows={4}
                          value={formNote}
                          onChange={(e) => setFormNote(e.target.value)}
                          placeholder="Nhập lý do quên chấm công, giờ vào/ra thực tế..."
                          className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors duration-200 resize-none"
                        />
                        <p className="text-xs text-gray-500">
                          Vui lòng mô tả chi tiết lý do quên chấm công và thời
                          gian làm việc thực tế
                        </p>
                      </div>
                    )}

                  {/* === Note Input for Online Work === */}
                  {selectedContext === 'online_work' && (
                    <div className="space-y-3 mb-6 animate-fadeIn">
                      <label
                        htmlFor="online-work-note"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Ghi chú
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
                    !selectedContext ||
                    ((selectedContext === 'explanation' ||
                      selectedContext === 'registration') &&
                      !selectedReason) ||
                    !isRegistrationTimeValid()
                  }
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-transparent shadow-lg text-base font-semibold transition-all duration-200 ${
                    ((selectedContext &&
                      (selectedContext === 'monthly_leave' ||
                        selectedContext === 'online_work')) ||
                      (selectedContext && selectedReason)) &&
                    isRegistrationTimeValid()
                      ? 'text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02]'
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                  }`}
                >
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
                          selectedContext === 'registration') &&
                          selectedReason && (
                            <>
                              {' - '}
                              {
                                (selectedContext === 'explanation'
                                  ? explanationReasons
                                  : registrationReasons
                                ).find((r) => r.id === selectedReason)?.label
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
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
                            ? 'Nghỉ phép'
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
                            : registrationReasons
                          ).find((r) => r.id === selectedReason)?.label
                        }
                      </span>
                    </div>
                  )}

                  {/* Row: Note */}
                  {formNote &&
                    (selectedReason === 'incomplete_attendance' ||
                      selectedReason === 'business_trip' ||
                      selectedReason === 'first_day' ||
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

                  {/* Penalty/Fine Section */}
                  {(selectedReason === 'late_minutes' ||
                    selectedReason === 'early_leave_minutes') &&
                    attendanceDetails[0] && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-red-500 tracking-tighter">
                              {selectedReason === 'late_minutes'
                                ? 'Số phút muộn'
                                : 'Số phút về sớm'}
                            </span>
                            <span className="text-xl font-black text-red-700">
                              {selectedReason === 'late_minutes'
                                ? attendanceDetails[0].late_minutes
                                : attendanceDetails[0].early_leave_minutes}{' '}
                              phút
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-black text-red-500 tracking-tighter">
                              Tiền phạt dự kiến
                            </span>
                            <span className="text-xl font-black text-red-700">
                              {(
                                (selectedReason === 'late_minutes'
                                  ? attendanceDetails[0].late_minutes
                                  : attendanceDetails[0].early_leave_minutes) *
                                5000
                              ).toLocaleString('vi-VN')}{' '}
                              đ
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-red-400 mt-2 text-center italic">
                          * Lưu ý: Số tiền phạt có thể thay đổi tùy theo phê
                          duyệt cuối cùng.
                        </p>
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
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmitSupplementaryRequest();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
