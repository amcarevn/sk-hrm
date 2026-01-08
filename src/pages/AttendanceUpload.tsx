import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { 
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ArrowLeftIcon
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

  // Mock data for departments
  const departments = [
    { id: '1', name: 'IT - Công nghệ thông tin', employeeCount: 15 },
    { id: '2', name: 'HR - Nhân sự', employeeCount: 8 },
    { id: '3', name: 'SALE - Kinh doanh', employeeCount: 25 },
    { id: '4', name: 'MARKETING - Tiếp thị', employeeCount: 12 },
    { id: '5', name: 'ACCOUNTING - Kế toán', employeeCount: 10 },
  ];

  // Mock data for employees
  const employees = [
    { id: '1', code: 'NV001', name: 'Nguyễn Văn A', department: 'IT - Công nghệ thông tin' },
    { id: '2', code: 'NV002', name: 'Trần Thị B', department: 'IT - Công nghệ thông tin' },
    { id: '3', code: 'NV003', name: 'Lê Văn C', department: 'HR - Nhân sự' },
    { id: '4', code: 'NV004', name: 'Phạm Thị D', department: 'HR - Nhân sự' },
    { id: '5', code: 'NV005', name: 'Hoàng Văn E', department: 'SALE - Kinh doanh' },
    { id: '6', code: 'NV006', name: 'Vũ Thị F', department: 'SALE - Kinh doanh' },
    { id: '7', code: 'NV007', name: 'Đặng Văn G', department: 'MARKETING - Tiếp thị' },
    { id: '8', code: 'NV008', name: 'Bùi Thị H', department: 'ACCOUNTING - Kế toán' },
  ];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // In a real implementation, you would fetch attendance details for this date
    console.log('Selected date in detail view:', date);
  };

  const handleViewDetail = () => {
    setShowDetailView(true);
    setViewMode('department'); // Start with department view
    setSelectedDepartment('');
    setSelectedEmployee('');
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
        departments.find(dept => dept.id === selectedDepartment)?.name === emp.department
      )
    : filteredEmployees;

  // Check if user has permission to upload attendance files
  // Only ADMIN, HR staff, and super admins can upload (case-insensitive role check)
  const userRole = user?.role ? user.role.toUpperCase() : '';
  const canUploadAttendance = userRole === 'ADMIN' || userRole === 'HR' || user?.is_super_admin;

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
      // In a real implementation, you would upload to an API endpoint
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful upload
      const newUpload = {
        id: uploadHistory.length + 1,
        filename: selectedFile.name,
        uploadedAt: new Date().toLocaleString('vi-VN'),
        status: 'success' as const,
        records: Math.floor(Math.random() * 100) + 1,
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
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage({ 
        type: 'error', 
        text: 'Upload thất bại. Vui lòng thử lại.' 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* View Attendance Section - Main content on the left */}
        <div className="lg:col-span-2 space-y-6">
          {/* View Attendance Section - Moved to top/left as main content */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Xem chấm công</h2>
                <p className="text-gray-500 text-sm">
                  Xem và lọc chấm công theo nhân viên hoặc phòng ban
                </p>
              </div>
              <EyeIcon className="h-6 w-6 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Employee Filter */}
              <div>
                <label htmlFor="view-employee" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                    Xem theo nhân viên
                  </div>
                </label>
                <select
                  id="view-employee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  <option value="1">NV001 - Nguyễn Văn A</option>
                  <option value="2">NV002 - Trần Thị B</option>
                  <option value="3">NV003 - Lê Văn C</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label htmlFor="view-department" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-1" />
                    Xem theo phòng ban
                  </div>
                </label>
                <select
                  id="view-department"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  <option value="1">IT - Công nghệ thông tin</option>
                  <option value="2">HR - Nhân sự</option>
                  <option value="3">SALE - Kinh doanh</option>
                </select>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn sử dụng:</h3>
              <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                <li>Chọn nhân viên để xem chấm công của nhân viên đó</li>
                <li>Chọn phòng ban để xem chấm công của toàn bộ phòng ban</li>
                <li>Chỉ có thể chọn một trong hai: nhân viên HOẶC phòng ban</li>
                <li>Dữ liệu sẽ tự động cập nhật khi thay đổi bộ lọc</li>
              </ul>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-medium text-gray-900">Kết quả chấm công</h3>
                <p className="text-sm text-gray-600">Hiển thị dữ liệu chấm công theo bộ lọc đã chọn</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        09/01/2026
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Nguyễn Văn A (NV001)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        08:00
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        17:30
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        8.5 giờ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đủ công
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        08/01/2026
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Nguyễn Văn A (NV001)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        08:15
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        17:45
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        8.5 giờ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Đi muộn
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        07/01/2026
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Nguyễn Văn A (NV001)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        08:00
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        17:00
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        8 giờ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đủ công
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">3</span> bản ghi
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Trước
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={handleViewDetail}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Xem chi tiết
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Upload file (small) + Template & History */}
        <div className="space-y-6">
          {/* Upload File Section - Small version on the right */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-gray-900">Upload file chấm công</h2>
              <p className="text-gray-500 text-xs">
                Upload file Excel hoặc CSV
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-gray-600 text-xs mb-1">
                  Kéo thả file hoặc click
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  Excel (.xlsx, .xls) hoặc CSV
                </p>
                
                <div className="flex flex-col items-center justify-center space-y-2">
                  <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-xs font-medium">
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
                      className={`px-4 py-2 rounded-md transition-colors text-xs font-medium ${
                        uploading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang upload...
                        </span>
                      ) : 'Upload'}
                    </button>
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
                      <span className="text-xs">{uploadMessage.text}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3">
              <h3 className="font-medium text-gray-900 mb-1 text-xs">Hướng dẫn:</h3>
              <div className="bg-gray-50 p-2 rounded-lg">
                <ul className="list-disc pl-3 space-y-0.5 text-xs text-gray-600">
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
            <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-3 rounded-md transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Tải mẫu file Excel
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Cấu trúc file:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Mã nhân viên:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">employee_id</code>
                </div>
                <div className="flex justify-between">
                  <span>Tên nhân viên:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">full_name</code>
                </div>
                <div className="flex justify-between">
                  <span>Ngày:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">date</code>
                </div>
                <div className="flex justify-between">
                  <span>Giờ vào:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">check_in</code>
                </div>
                <div className="flex justify-between">
                  <span>Giờ ra:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">check_out</code>
                </div>
                <div className="flex justify-between">
                  <span>Ghi chú:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">note</code>
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

      {/* Detail View Modal with Calendar */}
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
                        Xem chi tiết chấm công
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
                        Calendar hiển thị chấm công theo lịch. Click vào ngày để xem chi tiết.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Calendar Section */}
                  <div className="mb-6">
                    <AttendanceCalendar onDateClick={handleDateClick} />
                  </div>

                  {/* Selected Date Info */}
                  {selectedDate && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-blue-900">Ngày đã chọn</h4>
                          <p className="text-sm text-blue-700">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceUpload;
