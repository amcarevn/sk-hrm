import React from 'react';
import { ArrowLeftIcon, DocumentDuplicateIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const InternalForms: React.FC = () => {
  const navigate = useNavigate();

  const internalForms = [
    {
      id: 1,
      title: 'Đơn xin nghỉ phép',
      description: 'Mẫu đơn xin nghỉ phép năm, nghỉ ốm, nghỉ việc riêng',
      category: 'Nhân sự',
      code: 'HR-FORM-001',
      version: '2.0',
      lastUpdate: '15/12/2025'
    },
    {
      id: 2,
      title: 'Đề xuất công tác',
      description: 'Mẫu đề xuất đi công tác và thanh toán chi phí',
      category: 'Hành chính',
      code: 'ADMIN-FORM-002',
      version: '1.5',
      lastUpdate: '10/12/2025'
    },
    {
      id: 3,
      title: 'Đề xuất mua sắm',
      description: 'Mẫu đề xuất mua sắm trang thiết bị, vật tư',
      category: 'Mua sắm',
      code: 'PUR-FORM-003',
      version: '1.2',
      lastUpdate: '05/12/2025'
    },
    {
      id: 4,
      title: 'Báo cáo công việc',
      description: 'Mẫu báo cáo công việc hàng tuần/tháng',
      category: 'Báo cáo',
      code: 'REPORT-FORM-004',
      version: '3.0',
      lastUpdate: '01/12/2025'
    },
    {
      id: 5,
      title: 'Đề xuất đào tạo',
      description: 'Mẫu đề xuất tham gia khóa đào tạo',
      category: 'Đào tạo',
      code: 'TRAIN-FORM-005',
      version: '1.8',
      lastUpdate: '25/11/2025'
    },
    {
      id: 6,
      title: 'Phiếu đề xuất ý tưởng',
      description: 'Mẫu đề xuất ý tưởng cải tiến, sáng kiến',
      category: 'Sáng kiến',
      code: 'IDEA-FORM-006',
      version: '1.0',
      lastUpdate: '20/11/2025'
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
            <h1 className="text-2xl font-bold text-gray-900">Mẫu giấy tờ nội bộ</h1>
            <p className="mt-1 text-sm text-gray-600">
              Các mẫu đơn, biểu mẫu và giấy tờ sử dụng nội bộ công ty
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DocumentDuplicateIcon className="h-8 w-8 text-yellow-600" />
          <span className="text-sm font-medium text-gray-700">{internalForms.length} mẫu</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <PrinterIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-center">In mẫu nhanh</h3>
          <p className="text-sm text-gray-500 text-center mt-2">In trực tiếp các mẫu đơn thông dụng</p>
        </button>

        <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 text-center">Tải mẫu Word</h3>
          <p className="text-sm text-gray-500 text-center mt-2">Tải về để chỉnh sửa và điền thông tin</p>
        </button>

        <button className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 text-center">Gửi trực tuyến</h3>
          <p className="text-sm text-gray-500 text-center mt-2">Điền và gửi trực tiếp qua hệ thống</p>
        </button>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Danh sách mẫu giấy tờ</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sắp xếp theo:</span>
              <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                <option>Phổ biến nhất</option>
                <option>Mới nhất</option>
                <option>Theo danh mục</option>
              </select>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {internalForms.map((form) => (
            <div key={form.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DocumentDuplicateIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{form.title}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          {form.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {form.category}
                        </span>
                        <span className="text-sm text-gray-500">Phiên bản: {form.version}</span>
                        <span className="text-sm text-gray-500">Cập nhật: {form.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    In
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Danh mục mẫu giấy tờ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Nhân sự</p>
            <p className="text-xs text-gray-500">2 mẫu</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Hành chính</p>
            <p className="text-xs text-gray-500">1 mẫu</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Mua sắm</p>
            <p className="text-xs text-gray-500">1 mẫu</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Báo cáo</p>
            <p className="text-xs text-gray-500">2 mẫu</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hướng dẫn sử dụng</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-blue-800">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Chọn mẫu cần sử dụng</p>
              <p className="text-sm text-gray-600 mt-1">Tìm và chọn mẫu giấy tờ phù hợp với nhu cầu</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-green-800">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tải về hoặc in trực tiếp</p>
              <p className="text-sm text-gray-600 mt-1">Tải file Word để chỉnh sửa hoặc in trực tiếp từ trình duyệt</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-purple-800">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Điền thông tin và gửi</p>
              <p className="text-sm text-gray-600 mt-1">Điền đầy đủ thông tin và gửi cho bộ phận liên quan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalForms;
