import React from 'react';

const Onboarding: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboard nhân sự</h1>
        <p className="text-gray-600 mt-2">
          Quản lý quy trình tuyển dụng và onboarding nhân viên mới.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quy trình onboarding</h2>
            <p className="text-gray-500 text-sm">Có 0 ứng viên đang trong quá trình onboarding</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Mẫu quy trình
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
              + Tạo quy trình mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Ứng viên mới</h3>
            <p className="text-3xl font-bold text-blue-700 mt-2">0</p>
            <p className="text-blue-600 text-sm mt-1">Chờ xử lý hồ sơ</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900">Đang onboarding</h3>
            <p className="text-3xl font-bold text-yellow-700 mt-2">0</p>
            <p className="text-yellow-600 text-sm mt-1">Trong quá trình nhập việc</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Hoàn thành</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">0</p>
            <p className="text-green-600 text-sm mt-1">Đã onboard thành công</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ứng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giai đoạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiến độ
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">Chưa có ứng viên nào</p>
                    <p className="text-gray-500 mt-1">Bắt đầu bằng cách thêm ứng viên mới</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Các bước onboarding tiêu chuẩn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900">Tiếp nhận hồ sơ</h4>
              </div>
              <p className="text-gray-600 text-sm">Kiểm tra và xác nhận hồ sơ ứng viên</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900">Ký hợp đồng</h4>
              </div>
              <p className="text-gray-600 text-sm">Chuẩn bị và ký kết hợp đồng lao động</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900">Đào tạo</h4>
              </div>
              <p className="text-gray-600 text-sm">Đào tạo nội quy, quy trình công việc</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <h4 className="font-medium text-gray-900">Bàn giao công việc</h4>
              </div>
              <p className="text-gray-600 text-sm">Bàn giao thiết bị và công việc chính thức</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
