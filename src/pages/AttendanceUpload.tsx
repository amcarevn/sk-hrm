import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/attendance.service';
import { departmentsAPI, employeesAPI } from '../utils/api';
import AttendanceCalendar from '../components/AttendanceCalendar';
import {
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

/* ─── tiny helper ─── */
const cx = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

/* ─── Toast / Alert banner ─── */
const Alert = ({
  type,
  text,
  onClose,
}: {
  type: 'success' | 'error' | 'info';
  text: string;
  onClose: () => void;
}) => {
  const cfg = {
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200/50 backdrop-blur-md',
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />,
      text: 'text-emerald-800',
    },
    error: {
      bg: 'bg-rose-50/80 border-rose-200/50 backdrop-blur-md',
      icon: (
        <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
      ),
      text: 'text-rose-800',
    },
    info: {
      bg: 'bg-sky-50/80 border-sky-200/50 backdrop-blur-md',
      icon: <InformationCircleIcon className="w-5 h-5 text-sky-500 shrink-0" />,
      text: 'text-sky-800',
    },
  }[type as 'success' | 'error' | 'info'] || {
    bg: 'bg-slate-50',
    icon: <InformationCircleIcon />,
    text: 'text-slate-800'
  };

  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-sm ring-1 ring-black/5 animate-fade-in',
        cfg.bg,
        cfg.text
      )}
    >
      {cfg.icon}
      <span className="flex-1 leading-snug">{text}</span>
      <button
        onClick={onClose}
        className="opacity-40 hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-lg"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─── Status badge ─── */
// ─── Status badge ─── */
const StatusBadge = ({
  status,
}: {
  status: 'success' | 'error' | 'processing';
}) => {
  const configs = {
    success: { bg: 'bg-emerald-50/80', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Thành công' },
    error: { bg: 'bg-rose-50/80', text: 'text-rose-600', dot: 'bg-rose-500', label: 'Thất bại' },
    processing: { bg: 'bg-amber-50/80', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Đang xử lý' },
  };
  const config = configs[status];
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white shadow-sm', config.bg, config.text)}>
      <span className={cx('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)} />
      {config.label}
    </span>
  );
};

/* ─── Stat card ─── */
// ─── Stat card ─── */
const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'green' | 'yellow' | 'red' | 'blue';
}) => {
  const themes = {
    green: 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50 glow-emerald',
    yellow: 'bg-amber-50/50 text-amber-600 border-amber-100/50 glow-amber',
    red: 'bg-rose-50/50 text-rose-600 border-rose-100/50 glow-rose',
    blue: 'bg-indigo-50/50 text-indigo-600 border-indigo-100/50 glow-indigo',
  };
  return (
    <div className={cx('p-6 rounded-[2rem] border backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl animate-scale-up-sm', themes[color])}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">{label}</p>
      <p className="text-3xl font-black tracking-tight animate-count-up transform-gpu">{value}</p>
    </div>
  );
};

const AttendanceUpload: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadHistory, setUploadHistory] = useState<Array<{
    id: number;
    filename: string;
    uploadedAt: string;
    status: 'success' | 'error' | 'processing';
    records: number;
    user: string;
  }>>([]);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'department' | 'employee'>('department');
  const [mainViewDepartment, setMainViewDepartment] = useState<string>('');
  const [mainViewEmployee, setMainViewEmployee] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State for departments and employees from API
  const [departments, setDepartments] = useState<Array<{
    id: string;
    name: string;
    code: string;
    employeeCount: number;
  }>>([]);
  const [employees, setEmployees] = useState<Array<{
    id: string;
    code: string;
    name: string;
    department: string;
    department_id?: string;
  }>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      setError(null);
      const response = await departmentsAPI.list({ page_size: 100 });
      const departmentsData = response.results.map((dept: any) => ({
        id: dept.id.toString(),
        name: dept.name,
        code: dept.code,
        employeeCount: 0 // We'll update this after fetching employees
      }));
      setDepartments(departmentsData);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError('Không thể tải danh sách phòng ban. Vui lòng thử lại sau.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError(null);
      const response = await employeesAPI.list({ page_size: 100 });
      const employeesData = response.results.map((emp: any) => ({
        id: emp.id.toString(),
        code: emp.employee_id,
        name: emp.full_name,
        department: emp.department?.name || 'Không xác định',
        department_id: emp.department?.id?.toString()
      }));
      setEmployees(employeesData);

      // Update employee count for each department
      const departmentCounts: { [key: string]: number } = {};
      employeesData.forEach((emp: any) => {
        if (emp.department_id) {
          departmentCounts[emp.department_id] = (departmentCounts[emp.department_id] || 0) + 1;
        }
      });

      setDepartments(prev => prev.map(dept => ({
        ...dept,
        employeeCount: departmentCounts[dept.id] || 0
      })));
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Không thể tải danh sách nhân viên. Vui lòng thử lại sau.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch employees by department
  const fetchEmployeesByDepartment = async (departmentId: string) => {
    try {
      setLoadingEmployees(true);
      const response = await departmentsAPI.employees(parseInt(departmentId), { page_size: 100 });
      const employeesData = response.results.map((emp: any) => ({
        id: emp.id.toString(),
        code: emp.employee_id,
        name: emp.full_name,
        department: emp.department?.name || 'Không xác định',
        department_id: emp.department?.id?.toString()
      }));
      setEmployees(employeesData);
    } catch (err: any) {
      console.error('Error fetching employees by department:', err);
      setError('Không thể tải danh sách nhân viên theo phòng ban.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // In a real implementation, you would fetch attendance details for this date
    console.log('Selected date in detail view:', date);
  };

  const handleViewDetail = () => {
    setShowDetailView(true);

    if (mainViewEmployee) {
      // If an employee is selected in main view, show that employee's detail
      setSelectedEmployee(mainViewEmployee);
      setViewMode('employee');
      // Find the department for this employee
      const emp = employees.find(e => e.id === mainViewEmployee);
      if (emp) {
        const dept = departments.find(d => d.name === emp.department);
        if (dept) {
          setSelectedDepartment(dept.id);
        }
      }
    } else if (mainViewDepartment) {
      // If a department is selected in main view, show employee list for that department
      setSelectedDepartment(mainViewDepartment);
      setViewMode('employee');
      setSelectedEmployee('');
    } else {
      // If nothing is selected, start with department list
      setViewMode('department');
      setSelectedDepartment('');
      setSelectedEmployee('');
    }
  };

  const handleBack = () => {
    setShowDetailView(false);
    setSelectedDate(null);
    setSelectedDepartment('');
    setSelectedEmployee('');
    setViewMode('department');
  };

  const handleSelectDepartment = (deptId: string) => {
    setSelectedDepartment(deptId);
    setViewMode('employee'); // Switch to employee list view
    setSelectedEmployee('');
    // Fetch employees for the selected department
    fetchEmployeesByDepartment(deptId);
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployee(empId);
    // In a real implementation, you would fetch employee attendance data
    console.log('Selected employee:', empId);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment('');
    setSelectedEmployee('');
    setViewMode('department');
  };

  const handleBackToEmployees = () => {
    setSelectedEmployee('');
    setViewMode('employee');
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter employees by selected department
  const departmentEmployees = selectedDepartment
    ? filteredEmployees.filter(emp =>
      emp.department_id === selectedDepartment
    )
    : filteredEmployees;

  // Check if user has permission to upload attendance files
  // Only ADMIN, HR staff, super admins, and HCNS department staff can upload
  const userRole = user?.role ? user.role.toUpperCase() : '';

  // Get user's department code from various possible locations in user object
  const userDepartmentCode = (
    user?.employee_profile?.department_code ||
    user?.hrm_user?.department_code ||
    (user as any)?.department_code ||
    null
  );

  const canUploadAttendance =
    userRole === 'ADMIN' ||
    userRole === 'HR' ||
    user?.is_super_admin ||
    userDepartmentCode === 'HCNS'; // Allow HCNS department staff

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
      'text/x-comma-separated-values'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadMessage({ type: 'error', text: 'Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)' });
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File quá lớn. Dung lượng tối đa là 10MB.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      // Call real API
      const result = await attendanceService.uploadAttendanceFile(selectedFile);

      // Create upload history entry
      const newUpload = {
        id: uploadHistory.length + 1,
        filename: selectedFile.name,
        uploadedAt: new Date().toLocaleString('vi-VN'),
        status: 'success' as const,
        records: result.imported_records || result.total_records || 0,
        user: user?.username || 'Unknown'
      };

      setUploadHistory([newUpload, ...uploadHistory]);
      setUploadMessage({
        type: 'success',
        text: `Upload file "${selectedFile.name}" thành công! Đã import ${newUpload.records} bản ghi chấm công.`
      });
      setSelectedFile(null);

      // Clear file input
      const fileInput = document.getElementById('attendance-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Upload thất bại. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        } else if (Array.isArray(errors)) {
          errorMessage = errors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setUploadMessage(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await attendanceService.downloadAttendanceTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setUploadMessage({
        type: 'success',
        text: 'Đã tải mẫu file thành công!'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      setUploadMessage({
        type: 'error',
        text: 'Tải mẫu file thất bại. Vui lòng thử lại.'
      });
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) {
      setUploadMessage({ type: 'error', text: 'Vui lòng chọn file để validate' });
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
      'text/x-comma-separated-values'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadMessage({ type: 'error', text: 'Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)' });
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File quá lớn. Dung lượng tối đa là 10MB.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const result = await attendanceService.validateAttendanceFile(selectedFile);

      setUploadMessage({
        type: 'success',
        text: `Validate thành công! File có ${result.validation_results?.total_rows || 0} dòng, trong đó ${result.validation_results?.valid_rows || 0} dòng hợp lệ.`
      });

    } catch (error: any) {
      console.error('Validate error:', error);
      let errorMessage = 'Validate thất bại. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        } else if (Array.isArray(errors)) {
          errorMessage = errors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  const fileSchema = [
    ['STT', 'Số thứ tự'],
    ['Mã nhân viên', 'Bắt buộc'],
    ['Tên nhân viên', 'Tên nhân viên'],
    ['Phòng Ban', 'Phòng ban'],
    ['Ngày', 'Ngày chấm công (bắt buộc)'],
    ['Thứ', 'Thứ trong tuần'],
    ['Giờ vào', 'Giờ vào làm'],
    ['Giờ ra', 'Giờ ra về'],
    ['Trễ', 'Số phút đi trễ'],
    ['Sớm', 'Số phút về sớm'],
    ['Công', 'Số công'],
    ['Tổng giờ', 'Tổng giờ làm'],
    ['Tăng ca', 'Số giờ tăng ca'],
    ['Tổng toàn bộ', 'Tổng giờ toàn bộ'],
    ['Ca', 'Ca làm việc'],
  ];

  /* ═══ Main Render ═══ */
  if (!canUploadAttendance) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-50/50 blur-[120px] rounded-full" />
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-12 max-w-lg w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-8">
            <ShieldCheckIcon className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">Quyền truy cập hạn chế</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            Tính năng này chỉ dành cho quản trị viên và nhân sự cấp cao. Vui lòng liên hệ quản trị viên hệ thống để biết thêm chi tiết.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all"
          >
            QUAY LẠI TRANG CHỦ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 overflow-x-hidden p-6 md:p-10 lg:p-12 relative">
      {/* Background blobs for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-50/50 blur-[120px] rounded-full" />
      </div>

      {/* Page Header - Tối ưu Responsive & Premium UI */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Premium Icon Container with Glow Effect */}
          <div className="relative group/icon shrink-0">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/icon:opacity-40 transition-opacity duration-500 rounded-full" />
            <div className="relative w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 border border-indigo-400/50 group-hover/icon:scale-110 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 rounded-[1.5rem]" />
              <CloudArrowUpIcon className="w-8 h-8 text-white drop-shadow-md" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase transition-all duration-300">
                Upload <span className="text-indigo-600">Chấm công</span>
              </h1>
            </div>
            <p className="text-base md:text-lg text-slate-500 font-bold uppercase tracking-[0.2em] opacity-60">
              Kênh nhập liệu hiệu suất cao cho hành chính nhân sự
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 sm:flex-none group flex items-center justify-center gap-3 bg-white/60 backdrop-blur-xl hover:bg-white text-slate-700 border border-slate-200/60 px-6 py-4 rounded-2xl font-black transition-all duration-300 shadow-xl shadow-slate-200/20 hover:shadow-indigo-100 hover:-translate-y-1"
            title="Tải mẫu file Excel"
          >
            <DocumentArrowDownIcon className="w-5 h-5 text-indigo-500" />
            <span className="hidden sm:inline">Tải mẫu file</span>
            <span className="sm:hidden text-xs">MẪU FILE</span>
          </button>

          <button
            onClick={handleViewDetail}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-200 transition-all duration-300 hover:bg-indigo-700 hover:scale-105 active:scale-95"
            title="Xem chi tiết lịch sử và cấu trúc"
          >
            <EyeIcon className="w-5 h-5 drop-shadow-md" />
            <span className="hidden sm:inline">Xem Chi tiết</span>
            <span className="sm:hidden text-xs">CHI TIẾT</span>
          </button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Upload Main ── */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-white p-6 sm:p-10 relative overflow-hidden group">
            {/* Background Glows for Upload Card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-100/60 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-50/50 rounded-full blur-3xl -ml-24 -mb-24 group-hover:bg-violet-100/60 transition-colors duration-700" />

            <div className="relative space-y-8">
              {/* Drop zone - Nâng cấp hiện đại */}
              <div
                className={cx(
                  'relative min-h-[360px] rounded-[2rem] border-2 border-dashed transition-all duration-700 cursor-pointer flex flex-col items-center justify-center p-8 group/drop',
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[0.98] shadow-inner'
                    : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-200 bg-slate-50/30 hover:border-indigo-400 hover:bg-white hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)]'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { handleDrop(e); setDragOver(false); }}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  id="attendance-file"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center text-center w-full max-w-sm animate-fade-in">
                    <div className="relative mb-8 group/file">
                      <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 group-hover/file:opacity-40 transition-opacity rounded-full" />
                      <div className="relative w-24 h-24 rounded-[1.75rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-200 border border-emerald-400/50 transition-transform group-hover/file:-rotate-3">
                        <DocumentTextIcon className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 break-all mb-3 tracking-tight">
                      {selectedFile.name}
                    </h3>
                    <div className="flex flex-col items-center gap-3 mb-10">
                      <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl uppercase tracking-widest border border-emerald-100">
                        <CheckCircleIcon className="w-4 h-4" />
                        Sẵn sàng upload
                      </span>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        DUNG LƯỢNG: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 p-3 hover:bg-rose-50 rounded-xl"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Hủy và chọn lại
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center animate-fade-in max-w-sm">
                    <div className="relative mb-8 group/upload">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover/drop:opacity-30 transition-opacity rounded-full" />
                      <div className="relative w-24 h-24 rounded-[1.75rem] bg-white flex items-center justify-center border border-slate-100 shadow-xl group-hover/drop:bg-indigo-600 group-hover/drop:border-indigo-500 transition-all duration-500">
                        <CloudArrowUpIcon className="w-12 h-12 text-indigo-400 group-hover/drop:text-white transition-colors" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                      Kéo thả file vào đây
                    </p>
                    <p className="text-base text-slate-400 font-bold uppercase tracking-widest mb-10 opacity-70">
                      Excel hoặc CSV • Tối đa 10MB
                    </p>
                    <span className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-1 transition-all uppercase tracking-widest text-sm translate-z-0">
                      Chọn file
                    </span>
                  </div>
                )}
              </div>

              {/* Action grid - Nâng cấp hiện đại */}
              {selectedFile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in pt-4">
                  <button
                    onClick={handleValidateFile}
                    disabled={uploading}
                    className={cx(
                      'flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-5 text-sm font-black transition-all border-2 uppercase tracking-widest leading-none',
                      uploading
                        ? 'bg-slate-50 text-slate-300 border-slate-100'
                        : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50 hover:border-amber-200'
                    )}
                  >
                    <CheckBadgeIcon className="w-5 h-5" />
                    KIỂM TRA CẤU TRÚC
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className={cx(
                      'flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-5 text-sm font-black transition-all shadow-2xl uppercase tracking-widest leading-none',
                      uploading
                        ? 'bg-slate-50 text-slate-300'
                        : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-200'
                    )}
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CloudArrowUpIcon className="w-5 h-5" />
                    )}
                    {uploading ? 'ĐANG UPLOAD...' : 'BẮT ĐẦU UPLOAD'}
                  </button>
                </div>
              )}

              {/* Status Alert */}
              {uploadMessage && (
                <div className="animate-fade-in">
                  <Alert
                    type={uploadMessage.type as 'success' | 'error'}
                    text={uploadMessage.text}
                    onClose={() => setUploadMessage(null)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-white p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <InformationCircleIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cấu trúc dữ liệu yêu cầu</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {fileSchema.map(([col, desc], i) => (
                <div key={i} className="group p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all duration-300 hover:shadow-lg">
                  <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded inline-block">[{col}]</p>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight leading-relaxed mt-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Sidebar ── */}
        <div className="lg:col-span-4 transition-all">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-white flex flex-col h-full min-h-[500px] sticky top-8">
            <div className="p-8 border-b border-slate-100/50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lịch sử upload</h2>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Activity Tracking</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-[400px]">
              {uploadHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 opacity-40">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
                    <DocumentTextIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có dữ liệu</p>
                </div>
              ) : (
                uploadHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className={cx(
                      "group p-5 rounded-[1.75rem] bg-white border border-slate-100/60 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-100/20 hover:-translate-y-0.5",
                      "animate-fade-in-up",
                      index < 5 ? `stagger-${index + 1}` : 'stagger-5'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cx(
                        'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors',
                        item.status === 'success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100/50' :
                          item.status === 'error' ? 'bg-rose-50 text-rose-500 border-rose-100/50' : 'bg-amber-50 text-amber-500 border-amber-100/50'
                      )}>
                        <DocumentTextIcon className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-sm font-black text-slate-800 truncate leading-none">
                            {item.filename}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {item.records} Dòng
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-2">
                          {item.uploadedAt}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-slate-100/50 bg-slate-50/30 rounded-b-[2.5rem]">
              <div className="flex items-start gap-4 text-slate-400">
                <InformationCircleIcon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold leading-relaxed uppercase tracking-tight opacity-70">
                  Hệ thống chỉ lưu trữ 10 phiên upload gần nhất để đảm bảo hiệu suất tối ưu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Detail View Modal ═══ */}
      {showDetailView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleBack}
          />

          {/* Panel */}
          <div className="relative bg-white/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-full lg:max-w-7xl max-h-[94vh] overflow-hidden flex flex-col border border-white/60 animate-scale-up">
            {/* Modal Header - Premium Breadcrumbs */}
            <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100/60 bg-white/50">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <button
                  onClick={handleBack}
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <HomeIcon className="w-3.5 h-3.5" />
                  HOME
                </button>
                {viewMode === 'employee' && (
                  <>
                    <ChevronRightIcon className="w-3 h-3 opacity-30" />
                    <button
                      onClick={handleBackToDepartments}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      PHÒNG BAN
                    </button>
                  </>
                )}
                {selectedEmployee && (
                  <>
                    <ChevronRightIcon className="w-3 h-3 opacity-30" />
                    <button
                      onClick={handleBackToEmployees}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      NHÂN VIÊN
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={handleBack}
                className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center text-slate-400 transition-all group/close"
              >
                <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Modal body (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 space-y-10 custom-scrollbar">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {viewMode === 'department' && 'Danh mục Phòng ban'}
                    {viewMode === 'employee' &&
                      !selectedEmployee &&
                      `${departments.find((d) => d.id === selectedDepartment)?.name}`}
                    {selectedEmployee &&
                      `${employees.find((e) => e.id === selectedEmployee)?.name}`}
                  </h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">
                    {viewMode === 'department' && 'Quản lý nhân sự theo đơn vị'}
                    {viewMode === 'employee' && !selectedEmployee && 'Danh sách nhân sự trực thuộc'}
                    {selectedEmployee && 'Dữ liệu chấm công lịch sử chi tiết'}
                  </p>
                </div>

                {(viewMode === 'employee' || selectedEmployee) && (
                  <div className="relative min-w-[320px] group/search">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="w-5 h-5 text-slate-300 group-focus-within/search:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhanh..."
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Views */}
              {viewMode === 'department' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {departments.map((dept, index) => (
                    <button
                      key={dept.id}
                      onClick={() => handleSelectDepartment(dept.id)}
                      className={cx(
                        "text-left p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/40 hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden",
                        "animate-fade-in-up",
                        index < 8 ? `stagger-${index + 1}` : 'stagger-8'
                      )}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors" />
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-transparent group-hover:shadow-indigo-200">
                          <BuildingOfficeIcon className="w-7 h-7 text-indigo-500 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-xl font-black text-slate-800 mb-2 leading-tight pr-4">{dept.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {dept.employeeCount} Nhân sự
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {viewMode === 'employee' && !selectedEmployee && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {departmentEmployees.length === 0 ? (
                    <div className="col-span-full py-24 text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto mb-6 opacity-40">
                        <UserIcon className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Không tìm thấy dữ liệu</p>
                    </div>
                  ) : (
                    departmentEmployees.map((emp, index) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.id)}
                        className={cx(
                          "text-left p-5 rounded-[2.25rem] bg-white border border-slate-100/80 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 group flex items-center gap-5 relative overflow-hidden",
                          "animate-fade-in-up",
                          index < 12 ? `stagger-${(index % 8) + 1}` : 'stagger-8'
                        )}
                      >
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500 group-hover:rotate-6 shadow-sm">
                            <UserIcon className="w-8 h-8 text-slate-300 group-hover:text-white transition-colors" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-80">
                            {emp.code}
                          </p>
                          <p className="text-lg font-black text-slate-800 truncate pr-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                            {emp.name}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all">
                          <ChevronRightIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedEmployee && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Ngày công" value={18} color="green" />
                    <StatCard label="Đi muộn" value={3} color="yellow" />
                    <StatCard label="Vắng mặt" value={1} color="red" />
                    <StatCard label="Số ngày tính" value={22} color="blue" />
                  </div>

                  <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                    <AttendanceCalendar
                      onDateClick={handleDateClick}
                      employeeId={selectedEmployee ? parseInt(selectedEmployee) : undefined}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Premium Actions */}
            {selectedEmployee && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-8 border-t border-slate-100/60 bg-white/50 backdrop-blur-xl">
                <button
                  onClick={handleBackToEmployees}
                  className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] group/back"
                >
                  <ArrowLeftIcon className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                  QUAY LẠI DANH SÁCH
                </button>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all uppercase tracking-widest">
                    In báo cáo
                  </button>
                  <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-2xl shadow-slate-200 hover:bg-black hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                    Xuất file Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper styles and keyframes */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up-sm {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: scale(0.9); filter: blur(4px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-scale-up-sm { animation: scale-up-sm 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-count-up { animation: count-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .stagger-1 { animation-delay: 40ms; }
        .stagger-2 { animation-delay: 80ms; }
        .stagger-3 { animation-delay: 120ms; }
        .stagger-4 { animation-delay: 160ms; }
        .stagger-5 { animation-delay: 200ms; }

        .glow-indigo { box-shadow: 0 0 40px -10px rgba(79, 70, 229, 0.1); }
        .glow-emerald { box-shadow: 0 0 40px -10px rgba(16, 185, 129, 0.1); }
        .glow-rose { box-shadow: 0 0 40px -10px rgba(244, 63, 94, 0.1); }
        .glow-amber { box-shadow: 0 0 40px -10px rgba(245, 158, 11, 0.1); }
      `}</style>
    </div>
  );
};

export default AttendanceUpload;
