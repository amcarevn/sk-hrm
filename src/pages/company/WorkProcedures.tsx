import React from 'react';
import { ArrowLeftIcon, CogIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const WorkProcedures: React.FC = () => {
  const navigate = useNavigate();

  const workProcedures = [
    {
      id: 1,
      title: 'Quy trình tuyển dụng',
      description: 'Quy trình tuyển dụng nhân sự từ khi đăng tin đến khi nhân viên vào làm',
      department: 'Nhân sự',
      steps: 8,
      version: '3.2',
      status: 'Đang áp dụng',
      lastReview: '15/12/2025'
    },
    {
      id: 2,
      title: 'Quy trình mua sắm',
      description: 'Quy trình đề xuất, phê duyệt và thực hiện mua sắm trang thiết bị',
      department: 'Mua sắm',
      steps: 6,
      version: '2.5',
      status: 'Đang áp dụng',
      lastReview: '10/12/2025'
    },
    {
      id: 3,
      title: 'Quy trình xử lý khiếu nại',
      description: 'Quy trình tiếp nhận và xử lý khiếu nại của khách hàng',
      department: 'Chăm sóc khách hàng',
      steps: 5,
      version: '1.8',
      status: 'Đang áp dụng',
      lastReview: '05/12/2025'
    },
    {
      id: 4,
      title: 'Quy trình phê duyệt dự án',
      description: 'Quy trình đề xuất, đánh giá và phê duyệt dự án mới',
      department: 'Quản lý dự án',
      steps: 7,
      version: '2.0',
      status: 'Đang áp dụng',
      lastReview: '01/12/2025'
    },
    {
      id: 5,
      title: 'Quy trình đào tạo nội bộ',
      description: 'Quy trình tổ chức và thực hiện các khóa đào tạo nội bộ',
      department: 'Đào tạo',
      steps: 4,
      version: '1.5',
      status: 'Đang áp dụng',
      lastReview: '25/11/2025'
    },
    {
      id: 6,
      title: 'Quy trình báo cáo tài chính',
      description: 'Quy trình lập và trình báo cáo tài chính định kỳ',
      department: 'Kế toán',
      steps: 9,
      version: '3.0',
      status: 'Đang áp dụng',
      lastReview: '20/11/2025'
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
            <h1 className="text-2xl font-bold text-gray-900">Quy trình làm việc</h1>
            <p className="mt-1 text-sm text-gray-600">
              Các quy trình làm việc chuẩn của các bộ phận trong công ty
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CogIcon className="h-8 w-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">{workProcedures.length} quy trình</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Tổng quy trình</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{workProcedures.length}</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CogIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Tổng bước công việc</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {workProcedures.reduce((sum, proc) => sum + proc.steps, 0)}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Đang áp dụng</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{workProcedures.length}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Bộ phận</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">6</p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Procedures List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Danh sách quy trình</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {workProcedures.map((procedure) => (
            <div key={procedure.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{procedure.title}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {procedure.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{procedure.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {procedure.department}
                        </span>
                        <span className="text-sm text-gray-500">{procedure.steps} bước</span>
                        <span className="text-sm text-gray-500">Phiên bản: {procedure.version}</span>
                        <span className="text-sm text-gray-500">Rà soát: {procedure.lastReview}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quy trình theo bộ phận</h3>
        <div className="space-y-4">
          {[
            { name: 'Nhân sự', count: 1, color: 'bg-blue-100', textColor: 'text-blue-800' },
            { name: 'Mua sắm', count: 1, color: 'bg-green-100', textColor: 'text-green-800' },
            { name: 'Chăm sóc khách hàng', count: 1, color: 'bg-purple-100', textColor: 'text-purple-800' },
            { name: 'Quản lý dự án', count: 1, color: 'bg-yellow-100', textColor: 'text-yellow-800' },
            { name: 'Đào tạo', count: 1, color: 'bg-red-100', textColor: 'text-red-800' },
            { name: 'Kế toán', count: 1, color: 'bg-indigo-100', textColor: 'text-indigo-800' },
          ].map((dept) => (
            <div key={dept.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 ${dept.color} rounded-full flex items-center justify-center`}>
                  <span className={`text-xs font-medium ${dept.textColor}`}>{dept.count}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{dept.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color.replace('100', '500')} rounded-full`} style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-gray-500">{dept.count} quy trình</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow Example */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ví dụ về quy trình làm việc</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-blue-800">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Đề xuất</p>
              <p className="text-sm text-gray-600">Nhân viên đề xuất công việc/dự án</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-green-800">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Phê duyệt</p>
              <p className="text-sm text-gray-600">Quản lý trực tiếp phê duyệt đề xuất</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-yellow-800">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Thực hiện</p>
              <p className="text-sm text-gray-600">Nhân viên thực hiện công việc đã được phê duyệt</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-800">4</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Báo cáo</p>
              <p className="text-sm text-gray-600">Báo cáo kết quả và đánh giá hiệu quả</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkProcedures;
