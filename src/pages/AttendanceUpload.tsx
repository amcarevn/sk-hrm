import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upload file chấm công</h2>
                <p className="text-gray-500 text-sm">
                  Upload file Excel hoặc CSV để import dữ liệu chấm công
                </p>
              </div>
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
                
                <p className="text-gray-600 mb-2">
                  Kéo thả file vào đây hoặc click để chọn file
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <label className="cursor-pointer bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium">
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
                      className={`px-6 py-3 rounded-md transition-colors font-medium ${
                        uploading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  <div className="mt-6 p-4 bg-blue-50 rounded-md w-full max-w-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <span className="text-gray-700 font-medium truncate block">{selectedFile.name}</span>
                          <span className="text-gray-500 text-sm">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {uploadMessage && (
                  <div className={`mt-6 p-4 rounded-md w-full max-w-md ${
                    uploadMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      {uploadMessage.type === 'success' ? (
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{uploadMessage.text}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Hướng dẫn sử dụng:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li>File cần có cấu trúc cột theo đúng định dạng</li>
                  <li>Định dạng file hỗ trợ: Excel (.xlsx, .xls) hoặc CSV (.csv)</li>
                  <li>Dung lượng file tối đa: 10MB</li>
                  <li>Dữ liệu sẽ được xử lý tự động sau khi upload thành công</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Template & History Section */}
        <div className="space-y-6">
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
    </div>
  );
};

export default AttendanceUpload;
