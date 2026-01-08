import React from 'react';

const Offboarding: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offboard nhân sự</h1>
        <p className="text-gray-600 mt-2">
          Quản lý quy trình nghỉ việc, chuyển công tác và các trường hợp offboard khác.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quy trình offboarding</h2>
            <p className="text-gray-500 text-sm">Có 0 nhân viên đang trong quá trình offboarding</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Mẫu checklist
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
              + Tạo yêu cầu offboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900">Đang xử lý</h3>
            <p className="text-3xl font-bold text-yellow-700 mt-2">0</p>
            <p className="text-yellow-600 text-sm mt-1">Đang trong quá trình offboard</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-900">Đã nghỉ việc</h3>
            <p className="text-3xl font-bold text-red-700 mt-2">0</p>
            <p className="text-red-600 text-sm mt-1">Trong 30 ngày qua</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Chuyển công tác</h3>
            <p className="text-3xl font-bold text-blue-700 mt-2">0</p>
            <p className="text-blue-600 text-sm mt-1">Trong năm nay</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại offboard
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">Chưa có yêu cầu offboard nào</p>
                    <p className="text-gray-500 mt-1">Bắt đầu bằng cách tạo yêu cầu offboard mới</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist offboarding tiêu chuẩn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Hoàn thành công việc</h4>
              </div>
              <p className="text-gray-600 text-sm">Bàn giao công việc, tài liệu cho người kế nhiệm</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Thu hồi tài sản</h4>
              </div>
              <p className="text-gray-600 text-sm">Thu hồi laptop, thẻ ra vào, thiết bị công ty</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Thanh toán lương</h4>
              </div>
              <p className="text-gray-600 text-sm">Tính toán và thanh toán lương, phụ cấp còn lại</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Hủy quyền truy cập</h4>
              </div>
              <p className="text-gray-600 text-sm">Hủy tài khoản email, phần mềm, hệ thống nội bộ</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Phỏng vấn exit</h4>
              </div>
              <p className="text-gray-600 text-sm">Phỏng vấn nghỉ việc để thu thập phản hồi</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Cập nhật hồ sơ</h4>
              </div>
              <p className="text-gray-600 text-sm">Cập nhật trạng thái nhân viên trong hệ thống</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offboarding;
