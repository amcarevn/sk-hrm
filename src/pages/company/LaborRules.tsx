import React from 'react';
import { ArrowLeftIcon, ScaleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const LaborRules: React.FC = () => {
  const navigate = useNavigate();

  const laborRules = [
    {
      id: 1,
      title: 'Nội quy lao động chính thức',
      description: 'Quy định chính thức về nội quy và kỷ luật lao động',
      category: 'Nội quy',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Cao'
    },
    {
      id: 2,
      title: 'Quy định về thời gian làm việc',
      description: 'Quy định về giờ làm việc, tăng ca và nghỉ phép',
      category: 'Thời gian',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Cao'
    },
    {
      id: 3,
      title: 'Quy tắc ứng xử tại nơi làm việc',
      description: 'Quy tắc ứng xử và văn hóa doanh nghiệp',
      category: 'Ứng xử',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Trung bình'
    },
    {
      id: 4,
      title: 'Quy định về trang phục',
      description: 'Quy định về trang phục và phong cách làm việc',
      category: 'Trang phục',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Trung bình'
    },
    {
      id: 5,
      title: 'Chính sách xử lý vi phạm',
      description: 'Quy trình xử lý các vi phạm nội quy lao động',
      category: 'Kỷ luật',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Cao'
    },
    {
      id: 6,
      title: 'Quy định về an toàn vệ sinh lao động',
      description: 'Các quy định về an toàn và vệ sinh tại nơi làm việc',
      category: 'An toàn',
      effectiveDate: '01/01/2026',
      status: 'Đang áp dụng',
      importance: 'Cao'
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
            <h1 className="text-2xl font-bold text-gray-900">Nội quy lao động</h1>
            <p className="mt-1 text-sm text-gray-600">
              Các quy định, nội quy và quy tắc làm việc trong công ty
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ScaleIcon className="h-8 w-8 text-green-600" />
          <span className="text-sm font-medium text-gray-700">{laborRules.length} quy định</span>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lưu ý quan trọng</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>• Tất cả nhân viên bắt buộc phải tuân thủ nội quy lao động</p>
              <p>• Vi phạm nội quy có thể dẫn đến các hình thức kỷ luật</p>
              <p>• Cập nhật mới nhất có hiệu lực từ ngày 01/01/2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Danh sách nội quy</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {laborRules.map((rule) => (
            <div key={rule.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      rule.importance === 'Cao' ? 'bg-red-100' : 
                      rule.importance === 'Trung bình' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <DocumentTextIcon className={`h-6 w-6 ${
                        rule.importance === 'Cao' ? 'text-red-600' : 
                        rule.importance === 'Trung bình' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{rule.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.importance === 'Cao' ? 'bg-red-100 text-red-800' : 
                          rule.importance === 'Trung bình' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rule.importance}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {rule.category}
                        </span>
                        <span className="text-sm text-gray-500">Hiệu lực: {rule.effectiveDate}</span>
                        <span className="text-sm text-gray-500">Trạng thái: {rule.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phân loại nội quy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nội quy bắt buộc</span>
              <span className="text-sm font-medium text-gray-900">4 quy định</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quy tắc ứng xử</span>
              <span className="text-sm font-medium text-gray-900">2 quy định</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quy định an toàn</span>
              <span className="text-sm font-medium text-gray-900">1 quy định</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Phòng Nhân sự</p>
                <p className="text-sm text-gray-500">Ext: 101</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email hỗ trợ</p>
                <p className="text-sm text-gray-500">hr@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborRules;
