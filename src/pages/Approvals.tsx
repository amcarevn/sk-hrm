import React from 'react';

const Approvals: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phê duyệt</h1>
        <p className="text-gray-600 mt-2">
          Duyệt các đơn xin nghỉ phép, làm thêm giờ, giải trình chấm công và các yêu cầu khác.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Yêu cầu chờ duyệt</h2>
            <p className="text-gray-500 text-sm">Có 0 yêu cầu cần xử lý</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Lịch sử duyệt
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-900">Nghỉ phép</h3>
                <p className="text-3xl font-bold text-blue-700 mt-2">0</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-purple-900">Làm thêm giờ</h3>
                <p className="text-3xl font-bold text-purple-700 mt-2">0</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-yellow-900">Giải trình</h3>
                <p className="text-3xl font-bold text-yellow-700 mt-2">0</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-green-900">Đã duyệt</h3>
                <p className="text-3xl font-bold text-green-700 mt-2">0</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Tháng này
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">Không có yêu cầu nào chờ duyệt</p>
                    <p className="text-gray-500 mt-1">Tất cả yêu cầu đã được xử lý</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quy trình duyệt của bạn</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-700">
                  Bạn có quyền duyệt các đơn: <span className="font-medium">Nghỉ phép, Làm thêm giờ, Giải trình chấm công</span>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Cấp duyệt: Quản lý trực tiếp • Thời gian xử lý: 24 giờ
                </p>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                Cấu hình quy trình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approvals;
