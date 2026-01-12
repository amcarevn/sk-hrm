import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { attendanceService, AttendanceRecord } from '../services/attendance.service';
import { employeesAPI, Employee } from '../utils/api';
import { 
  XMarkIcon, 
  DocumentPlusIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon,
  BuildingOfficeIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSupplementaryRequestModal, setShowSupplementaryRequestModal] = useState(false);
  const [supplementaryRequest, setSupplementaryRequest] = useState({
    reason: '',
    expectedStatus: 'PRESENT' as 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HALF_DAY',
    evidence: null as File | null,
  });
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Check if user has permission to upload attendance files
  // For now, only ADMIN role can upload
  const canUploadAttendance = user?.role === 'ADMIN';

  useEffect(() => {
    fetchCurrentEmployee();
    fetchAttendanceStats();
    fetchAttendanceRecords();
  }, []);

  const fetchCurrentEmployee = async () => {
    try {
      const employee = await employeesAPI.me();
      setCurrentEmployee(employee);
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Fetch attendance statistics
      const stats = await attendanceService.getAttendanceStats({
        start_date: firstDayOfMonth.toISOString().split('T')[0],
        end_date: lastDayOfMonth.toISOString().split('T')[0]
      });
      
      // Fetch attendance explanation statistics for current month
      let explanationStats = null;
      if (currentEmployee) {
        try {
          explanationStats = await attendanceService.getAttendanceExplanationStats({
            employee_id: currentEmployee.id,
            month: today.getMonth() + 1,
            year: today.getFullYear()
          });
        } catch (error) {
          console.error('Error fetching explanation stats:', error);
        }
      }
      
      // Combine stats
      setAttendanceStats({
        ...stats,
        remaining_explanations: explanationStats?.statistics?.remaining_explanations || 0
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const response = await attendanceService.getAttendanceRecords({
        start_date: firstDayOfMonth.toISOString().split('T')[0],
        end_date: lastDayOfMonth.toISOString().split('T')[0],
        page_size: 50
      });
      setAttendanceRecords(response.results);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setShowAttendanceModal(true);
    setFetchingDetails(true);
    
    try {
      // Format date to YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      
      // Fetch attendance records for the selected date
      const response = await attendanceService.getAttendanceRecords({
        start_date: dateStr,
        end_date: dateStr,
        page_size: 10
      });
      
      // If we have current employee, filter for their records
      let filteredRecords = response.results;
      if (currentEmployee) {
        filteredRecords = response.results.filter(
          (record: AttendanceRecord) => record.employee_code === currentEmployee.employee_id
        );
      }
      
      setAttendanceDetails(filteredRecords);
      
      // Calculate summary
      if (filteredRecords.length > 0) {
        const summary = {
          totalHours: filteredRecords.reduce((sum, record) => sum + (record.working_hours || 0), 0),
          presentCount: filteredRecords.filter(record => record.status === 'PRESENT').length,
          lateCount: filteredRecords.filter(record => record.status === 'LATE').length,
          earlyLeaveCount: filteredRecords.filter(record => record.status === 'EARLY_LEAVE').length,
          absentCount: filteredRecords.filter(record => record.status === 'ABSENT').length,
          halfDayCount: filteredRecords.filter(record => record.status === 'HALF_DAY').length,
          totalShifts: filteredRecords.length
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
          totalShifts: 0
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
  };

  const handleOpenSupplementaryRequest = () => {
    setShowSupplementaryRequestModal(true);
  };

  const handleCloseSupplementaryRequest = () => {
    setShowSupplementaryRequestModal(false);
    setSupplementaryRequest({
      reason: '',
      expectedStatus: 'PRESENT',
      evidence: null,
    });
  };

  const handleSupplementaryRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupplementaryRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSupplementaryRequest(prev => ({
      ...prev,
      evidence: file
    }));
  };

  const handleSubmitSupplementaryRequest = async () => {
    // In a real implementation, you would submit to API
    console.log('Submitting supplementary request:', {
      date: selectedDate,
      ...supplementaryRequest
    });
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('Đơn bổ sung công đã được gửi thành công!');
    handleCloseSupplementaryRequest();
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
      'text/x-comma-separated-values'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadMessage({ type: 'error', text: 'Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      // Upload file using attendance service
      const result = await attendanceService.uploadAttendanceFile(selectedFile);
      
      setUploadMessage({ 
        type: 'success', 
        text: `Upload file "${selectedFile.name}" thành công! ${result.message || 'Dữ liệu đang được xử lý.'}` 
      });
      setSelectedFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('attendance-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh attendance data
      fetchAttendanceStats();
      fetchAttendanceRecords();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.';
      setUploadMessage({ 
        type: 'error', 
        text: errorMessage
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
          Theo dõi và quản lý chấm công, đi muộn, về sớm, nghỉ phép của nhân viên.
        </p>
      </div>

      {/* Upload Section - Only visible for users with permission */}
      {canUploadAttendance && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload file chấm công</h2>
              <p className="text-gray-500 text-sm">
                Upload file Excel hoặc CSV để import dữ liệu chấm công
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-700 font-medium truncate">{selectedFile.name}</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              )}
              
              {uploadMessage && (
                <div className={`mt-4 p-3 rounded-md w-full max-w-md ${
                  uploadMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {uploadMessage.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <li>File cần có cấu trúc cột: Mã NV, Tên NV, Ngày, Giờ vào, Giờ ra, Ghi chú</li>
              <li>Định dạng ngày: DD/MM/YYYY hoặc YYYY-MM-DD</li>
              <li>Định dạng giờ: HH:MM (24h)</li>
              <li>Dung lượng file tối đa: 10MB</li>
            </ul>
          </div>
        </div>
      )}


      {/* Summary Statistics - Moved to top as requested */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900">Tổng ngày công</h3>
          <p className="text-3xl font-bold text-blue-700 mt-2">
            {attendanceStats?.statistics?.total_days || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900">Đi đúng giờ</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {attendanceStats?.statistics?.status_summary?.PRESENT || 0}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-900">Đi muộn</h3>
          <p className="text-3xl font-bold text-yellow-700 mt-2">
            {attendanceStats?.statistics?.status_summary?.LATE || 0}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-medium text-red-900">Vắng mặt</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">
            {attendanceStats?.statistics?.status_summary?.ABSENT || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-900">Giải trình còn lại</h3>
          <p className="text-3xl font-bold text-purple-700 mt-2">
            {attendanceStats?.remaining_explanations || 0}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Tháng hiện tại
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mb-6">
        <AttendanceCalendar onDateClick={handleDateClick} />
      </div>

      {/* Attendance Details Modal */}
      {showAttendanceModal && selectedDate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CalendarIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Chi tiết chấm công ngày {selectedDate.toLocaleDateString('vi-VN')}
                      </h3>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-500"
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
                        <h4 className="font-medium text-gray-900">Thông tin nhân viên</h4>
                        <p className="text-sm text-gray-600">
                          {currentEmployee ? (
                            `${currentEmployee.full_name} - ${currentEmployee.employee_id}`
                          ) : (
                            'Đang tải thông tin...'
                          )}
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

                  {/* Attendance Details Table */}
                  <div className="border rounded-lg overflow-hidden">
                    {fetchingDetails ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-600">Đang tải chi tiết chấm công...</p>
                      </div>
                    ) : attendanceDetails.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
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
                                {record.check_in ? new Date(`2000-01-01T${record.check_in}`).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.check_out ? new Date(`2000-01-01T${record.check_out}`).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.working_hours ? `${record.working_hours.toFixed(1)} giờ` : '0 giờ'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                  record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                                  record.status === 'EARLY_LEAVE' ? 'bg-orange-100 text-orange-800' :
                                  record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                  record.status === 'HALF_DAY' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {record.status_display || record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-gray-600">Không có dữ liệu chấm công cho ngày này</p>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 text-sm">Tổng giờ làm</h4>
                      <p className="text-xl font-bold text-blue-700 mt-1">
                        {attendanceSummary ? `${attendanceSummary.totalHours.toFixed(1)} giờ` : '0 giờ'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900 text-sm">Ca đủ công</h4>
                      <p className="text-xl font-bold text-green-700 mt-1">
                        {attendanceSummary?.presentCount || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-900 text-sm">Ca đi muộn</h4>
                      <p className="text-xl font-bold text-yellow-700 mt-1">
                        {attendanceSummary?.lateCount || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm">Tổng ca</h4>
                      <p className="text-xl font-bold text-gray-700 mt-1">
                        {attendanceSummary?.totalShifts || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={handleOpenSupplementaryRequest}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <DocumentPlusIcon className="h-5 w-5 mr-2" />
                      Làm đơn bổ sung công
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentPlusIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Đơn bổ sung công
                      </h3>
                      <button
                        onClick={handleCloseSupplementaryRequest}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Gửi đơn bổ sung công cho ngày {selectedDate.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Date Info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ngày cần bổ sung công</p>
                        <p className="text-sm text-gray-600">{selectedDate.toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Trạng thái hiện tại</p>
                        <p className="text-sm text-yellow-700">Thiếu công (1 ca đi muộn)</p>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="expectedStatus" className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái mong muốn
                      </label>
                      <select
                        id="expectedStatus"
                        name="expectedStatus"
                        value={supplementaryRequest.expectedStatus}
                        onChange={handleSupplementaryRequestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="PRESENT">Có mặt (Đủ công)</option>
                        <option value="LATE">Đi muộn</option>
                        <option value="EARLY_LEAVE">Về sớm</option>
                        <option value="ABSENT">Vắng mặt</option>
                        <option value="HALF_DAY">Nửa ngày</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                        Lý do bổ sung công
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        value={supplementaryRequest.reason}
                        onChange={handleSupplementaryRequestChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nhập lý do cần bổ sung công..."
                      />
                    </div>

                    <div>
                      <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-1">
                        Bằng chứng (tùy chọn)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="evidence-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                            >
                              <span>Tải lên file</span>
                              <input
                                id="evidence-upload"
                                name="evidence-upload"
                                type="file"
                                className="sr-only"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                onChange={handleEvidenceChange}
                              />
                            </label>
                            <p className="pl-1">hoặc kéo và thả</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            JPG, PNG, PDF, DOC, DOCX tối đa 5MB
                          </p>
                        </div>
                      </div>
                      {supplementaryRequest.evidence && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{supplementaryRequest.evidence.name}</span>
                            <span className="ml-auto text-xs text-gray-500">
                              {(supplementaryRequest.evidence.size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 gap-2 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmitSupplementaryRequest}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Gửi đơn
                </button>
                <button
                  type="button"
                  onClick={handleCloseSupplementaryRequest}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Hủy
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
