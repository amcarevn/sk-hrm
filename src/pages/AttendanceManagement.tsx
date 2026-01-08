import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if user has permission to upload attendance files
  // For now, only ADMIN role can upload
  const canUploadAttendance = user?.role === 'ADMIN';

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
      // In a real implementation, you would upload to an API endpoint
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadMessage({ 
        type: 'success', 
        text: `Upload file "${selectedFile.name}" thành công! Dữ liệu đang được xử lý.` 
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bảng chấm công tháng 1/2026</h2>
            <p className="text-gray-500 text-sm">Cập nhật lần cuối: Hôm nay, 14:45</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Xuất báo cáo
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
              + Thêm chấm công
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">Chưa có dữ liệu chấm công</p>
                    <p className="text-gray-500 mt-1">Bắt đầu bằng cách thêm bản ghi chấm công</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Tổng ngày công</h3>
            <p className="text-3xl font-bold text-blue-700 mt-2">0</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Đi đúng giờ</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">0</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900">Đi muộn</h3>
            <p className="text-3xl font-bold text-yellow-700 mt-2">0</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-900">Vắng mặt</h3>
            <p className="text-3xl font-bold text-red-700 mt-2">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
