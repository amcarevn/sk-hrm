import React from 'react';
import { ArrowLeftIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const TrainingDocuments: React.FC = () => {
  const navigate = useNavigate();

  const trainingDocuments = [
    {
      id: 1,
      title: 'Hướng dẫn hội nhập nhân viên mới',
      description: 'Tài liệu hướng dẫn chi tiết quy trình hội nhập cho nhân viên mới',
      category: 'Đào tạo hội nhập',
      fileSize: '2.4 MB',
      uploadDate: '15/12/2025',
      downloads: 45
    },
    {
      id: 2,
      title: 'Quy trình làm việc nội bộ',
      description: 'Hướng dẫn các quy trình làm việc và giao tiếp nội bộ',
      category: 'Quy trình',
      fileSize: '1.8 MB',
      uploadDate: '10/12/2025',
      downloads: 32
    },
    {
      id: 3,
      title: 'Chính sách bảo mật thông tin',
      description: 'Hướng dẫn về chính sách bảo mật và bảo vệ dữ liệu công ty',
      category: 'Chính sách',
      fileSize: '3.1 MB',
      uploadDate: '05/12/2025',
      downloads: 28
    },
    {
      id: 4,
      title: 'Hướng dẫn sử dụng hệ thống HRM',
      description: 'Tài liệu hướng dẫn sử dụng hệ thống quản lý nhân sự',
      category: 'Hệ thống',
      fileSize: '4.2 MB',
      uploadDate: '01/12/2025',
      downloads: 56
    },
    {
      id: 5,
      title: 'Quy định về an toàn lao động',
      description: 'Các quy định và hướng dẫn về an toàn lao động tại nơi làm việc',
      category: 'An toàn',
      fileSize: '2.7 MB',
      uploadDate: '25/11/2025',
      downloads: 39
    },
    {
      id: 6,
      title: 'Hướng dẫn đánh giá hiệu suất',
      description: 'Quy trình và tiêu chí đánh giá hiệu suất làm việc',
      category: 'Đánh giá',
      fileSize: '1.9 MB',
      uploadDate: '20/11/2025',
      downloads: 41
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tài liệu đào tạo hội nhập</h1>
            <p className="mt-1 text-sm text-gray-600">
              Các tài liệu hướng dẫn, đào tạo và hội nhập cho nhân viên
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">{trainingDocuments.length} tài liệu</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Tổng số tài liệu</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{trainingDocuments.length}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Tổng lượt tải</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {trainingDocuments.reduce((sum, doc) => sum + doc.downloads, 0)}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowDownTrayIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Tài liệu mới nhất</p>
              <p className="text-lg font-bold text-purple-900 mt-1">15/12/2025</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Danh sách tài liệu</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {trainingDocuments.map((doc) => (
            <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.category}
                        </span>
                        <span className="text-sm text-gray-500">{doc.fileSize}</span>
                        <span className="text-sm text-gray-500">Đăng: {doc.uploadDate}</span>
                        <span className="text-sm text-gray-500">{doc.downloads} lượt tải</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Tải xuống
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Thông tin quan trọng</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>• Tất cả nhân viên mới cần hoàn thành khóa đào tạo hội nhập trong vòng 2 tuần đầu tiên</p>
              <p>• Các tài liệu được cập nhật định kỳ hàng quý</p>
              <p>• Liên hệ Phòng Nhân sự nếu cần hỗ trợ thêm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDocuments;
