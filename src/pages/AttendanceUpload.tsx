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
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

  // If user doesn't have permission, show message
  if (!canUploadAttendance) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload chấm công</h1>
          <p className="text-gray-600 mt-2">
            Upload file chấm công để import dữ liệu vào hệ thống.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có quyền truy cập</h3>
            <p className="text-gray-600">
              Chức năng này chỉ dành cho quản trị viên và nhân viên hành chính nhân sự.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Vui lòng liên hệ quản trị viên nếu bạn cần sử dụng chức năng này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload chấm công</h1>
        <p className="text-gray-600 mt-2">
          Upload file chấm công để import dữ liệu vào hệ thống.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-6">

          {/* Upload File Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload file chấm công</h2>
              <p className="text-gray-500 text-sm">
                Upload file Excel hoặc CSV
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-gray-600 text-sm mb-1">
                  Kéo thả file hoặc click để chọn file
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Excel (.xlsx, .xls) hoặc CSV
                </p>
                
                  <div className="flex flex-col items-center justify-center space-y-3">
                  <label className="cursor-pointer bg-primary-600 text-white px-6 py-2.5 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={handleValidateFile}
                        disabled={uploading}
                        className={`px-5 py-2.5 rounded-md transition-colors text-sm font-medium ${
                          uploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                      >
                        {uploading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Đang xử lý...
                          </span>
                        ) : 'Validate'}
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`px-5 py-2.5 rounded-md transition-colors text-sm font-medium ${
                          uploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Upload
                      </button>
                    </div>
                  )}
                </div>
                
                {selectedFile && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <span className="text-gray-700 font-medium truncate block text-xs">{selectedFile.name}</span>
                          <span className="text-gray-500 text-xs">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {uploadMessage && (
                  <div className={`mt-3 p-2 rounded-md ${
                    uploadMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      {uploadMessage.type === 'success' ? (
                        <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="text-sm">{uploadMessage.text}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">Hướng dẫn:</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                  <li>File có cấu trúc cột đúng</li>
                  <li>Định dạng: Excel hoặc CSV</li>
                  <li>Dung lượng tối đa: 10MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Mẫu file chấm công</h3>
            <p className="text-gray-600 text-sm mb-4">
              Tải về mẫu file Excel để nhập dữ liệu chấm công.
            </p>
            <button 
              onClick={handleDownloadTemplate}
              className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-3 rounded-md transition-colors flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Tải mẫu file Excel
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Cấu trúc file:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>STT:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Số thứ tự</code>
                </div>
                <div className="flex justify-between">
                  <span>Mã nhân viên:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Mã nhân viên (bắt buộc)</code>
                </div>
                <div className="flex justify-between">
                  <span>Tên nhân viên:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Tên nhân viên</code>
                </div>
                <div className="flex justify-between">
                  <span>Phòng Ban:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Phòng ban</code>
                </div>
                <div className="flex justify-between">
                  <span>Ngày:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ngày chấm công (bắt buộc)</code>
                </div>
                <div className="flex justify-between">
                  <span>Thứ:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Thứ trong tuần</code>
                </div>
                <div className="flex justify-between">
                  <span>Giờ vào:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Giờ vào làm</code>
                </div>
                <div className="flex justify-between">
                  <span>Giờ ra:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Giờ ra về</code>
                </div>
                <div className="flex justify-between">
                  <span>Trễ:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Số phút đi trễ</code>
                </div>
                <div className="flex justify-between">
                  <span>Sớm:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Số phút về sớm</code>
                </div>
                <div className="flex justify-between">
                  <span>Công:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Số công</code>
                </div>
                <div className="flex justify-between">
                  <span>Tổng giờ:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Tổng giờ làm</code>
                </div>
                <div className="flex justify-between">
                  <span>Tăng ca:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Số giờ tăng ca</code>
                </div>
                <div className="flex justify-between">
                  <span>Tổng toàn bộ:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Tổng giờ toàn bộ</code>
                </div>
                <div className="flex justify-between">
                  <span>Ca:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ca làm việc</code>
                </div>
              </div>
            </div>
          </div>

          {/* Upload History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Lịch sử upload</h3>
            {uploadHistory.length === 0 ? (
              <div className="text-center py-4">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Chưa có lịch sử upload</p>
                <p className="text-gray-400 text-sm mt-1">Các file upload sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {uploadHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg className={`w-5 h-5 mr-3 ${item.status === 'success' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.filename}</p>
                        <p className="text-xs text-gray-500">{item.uploadedAt} • {item.records} bản ghi</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-800' : item.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.status === 'success' ? 'Thành công' : item.status === 'error' ? 'Lỗi' : 'Đang xử lý'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail View Modal with Calendar and Hierarchy */}
      {showDetailView && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <EyeIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {viewMode === 'department' && 'Chọn phòng ban'}
                        {viewMode === 'employee' && !selectedEmployee && `Nhân viên ${departments.find(d => d.id === selectedDepartment)?.name}`}
                        {selectedEmployee && `Chấm công ${employees.find(e => e.id === selectedEmployee)?.name}`}
                      </h3>
                      <button
                        onClick={handleBack}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {viewMode === 'department' && 'Chọn phòng ban để xem danh sách nhân viên'}
                        {viewMode === 'employee' && !selectedEmployee && 'Chọn nhân viên để xem chi tiết chấm công'}
                        {selectedEmployee && 'Xem chi tiết chấm công của nhân viên'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Breadcrumb Navigation */}
                  <div className="flex items-center mb-6 text-sm">
                    <button
                      onClick={handleBack}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      Trang chính
                    </button>
                    {viewMode === 'employee' && (
                      <>
                        <span className="mx-2 text-gray-400">/</span>
                        <button
                          onClick={handleBackToDepartments}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Phòng ban
                        </button>
                      </>
                    )}
                    {selectedEmployee && (
                      <>
                        <span className="mx-2 text-gray-400">/</span>
                        <button
                          onClick={handleBackToEmployees}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Nhân viên
                        </button>
                      </>
                    )}
                  </div>

                  {/* Search Bar (for employee list) */}
                  {(viewMode === 'employee' || selectedEmployee) && (
                    <div className="mb-6">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Department List View */}
                  {viewMode === 'department' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {departments.map((dept) => (
                        <div
                          key={dept.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleSelectDepartment(dept.id)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">{dept.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{dept.employeeCount} nhân viên</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className="text-xs text-primary-600 font-medium">Xem nhân viên →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Employee List View */}
                  {viewMode === 'employee' && !selectedEmployee && (
                    <div className="mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <h4 className="font-medium text-gray-900">Phòng ban: {departments.find(d => d.id === selectedDepartment)?.name}</h4>
                            <p className="text-sm text-gray-600">Chọn nhân viên để xem chi tiết chấm công</p>
                          </div>
                        </div>
                      </div>

                      {loadingEmployees ? (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75V21m-10.5-7.75V21m-4.5 0h.01" />
                          </svg>
                          <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
                        </div>
                      ) : departmentEmployees.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75V21m-10.5-7.75V21m-4.5 0h.01" />
                          </svg>
                          <p className="text-gray-500">Không tìm thấy nhân viên</p>
                          <p className="text-gray-400 text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {departmentEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => handleSelectEmployee(emp.id)}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <UserIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-4 flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">{emp.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">Mã: {emp.code}</p>
                                  <p className="text-xs text-gray-500">Phòng ban: {emp.department}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <span className="text-xs text-primary-600 font-medium">Xem chấm công →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Employee Detail View with Calendar */}
                  {selectedEmployee && (
                    <div>
                      {/* Employee Info */}
                      <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center">
                          <UserIcon className="h-6 w-6 text-blue-500 mr-3" />
                          <div>
                            <h4 className="font-medium text-blue-900">
                              {employees.find(e => e.id === selectedEmployee)?.name} ({employees.find(e => e.id === selectedEmployee)?.code})
                            </h4>
                          <p className="text-sm text-blue-700">
                            Phòng ban: {employees.find(e => e.id === selectedEmployee)?.department}
                          </p>
                          </div>
                        </div>
                      </div>

                      {/* Calendar Section */}
                      <div className="mb-6">
                        <AttendanceCalendar 
                          onDateClick={handleDateClick}
                          employeeId={selectedEmployee ? parseInt(selectedEmployee) : undefined}
                        />
                      </div>

                      {/* Selected Date Info */}
                      {selectedDate && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <h4 className="font-medium text-green-900">Ngày đã chọn</h4>
                              <p className="text-sm text-green-700">
                                {selectedDate.toLocaleDateString('vi-VN', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h4 className="font-medium text-green-900 text-sm">Ngày đủ công</h4>
                          <p className="text-xl font-bold text-green-700 mt-1">18</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <h4 className="font-medium text-yellow-900 text-sm">Ngày đi muộn</h4>
                          <p className="text-xl font-bold text-yellow-700 mt-1">3</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <h4 className="font-medium text-red-900 text-sm">Ngày vắng mặt</h4>
                          <p className="text-xl font-bold text-red-700 mt-1">1</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 text-sm">Tổng ngày</h4>
                          <p className="text-xl font-bold text-blue-700 mt-1">22</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={handleBack}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <ArrowLeftIcon className="h-5 w-5 mr-2" />
                          Trở về
                        </button>
                        <div className="flex space-x-3">
                          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Xuất báo cáo
                          </button>
                          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            In lịch
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceUpload;
