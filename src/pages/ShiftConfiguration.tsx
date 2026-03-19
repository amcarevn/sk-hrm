import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { companyConfigAPI, ShiftConfig } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface AssignOptions {
  shift: ShiftConfig;
  current_assignments: {
    employees: any[];
    positions: any[];
    departments: any[];
  };
  available_options: {
    employees: any[];
    positions: any[];
    departments: any[];
  };
}

type AssignmentTab = 'employees' | 'positions' | 'departments';

const ShiftConfiguration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftConfig | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssignOptions | null>(null);
  const [loadingAssignOptions, setLoadingAssignOptions] = useState(false);
  const [assignmentTab, setAssignmentTab] = useState<AssignmentTab>('employees');
  const [selectedItems, setSelectedItems] = useState<{
    employees: number[];
    positions: number[];
    departments: number[];
  }>({
    employees: [],
    positions: [],
    departments: [],
  });
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchShifts();
  }, [currentPage]);

  const fetchShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companyConfigAPI.listShiftConfigs({
        page: currentPage,
        page_size: 10,
      });
      setShifts(response.results);
      setTotalPages(Math.ceil(response.count / 10));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tải danh sách ca làm');
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShift = async (shift: ShiftConfig) => {
    setSelectedShift(shift);
    setLoadingAssignOptions(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await companyConfigAPI.getShiftConfigAssignOptions(shift.id);
      setAssignOptions(response);

      // Initialize selected items with current assignments
      setSelectedItems({
        employees: response.current_assignments.employees.map((e: any) => e.id),
        positions: response.current_assignments.positions.map((p: any) => p.id),
        departments: response.current_assignments.departments.map((d: any) => d.id),
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tải thông tin gán ca');
      console.error('Error fetching assign options:', err);
    } finally {
      setLoadingAssignOptions(false);
    }
  };

  const handleItemToggle = (type: AssignmentTab, id: number) => {
    setSelectedItems((prev) => {
      const items = prev[type];
      if (items.includes(id)) {
        return {
          ...prev,
          [type]: items.filter((item) => item !== id),
        };
      } else {
        return {
          ...prev,
          [type]: [...items, id],
        };
      }
    });
  };

  const handleApplyAssignment = async () => {
    if (!selectedShift) return;

    setAssigning(true);
    setError(null);

    try {
      const response = await companyConfigAPI.assignShiftConfig(selectedShift.id, {
        employee_ids: selectedItems.employees,
        position_ids: selectedItems.positions,
        department_ids: selectedItems.departments,
      });

      setSuccessMessage(response.message || 'Cấu hình ca làm thành công!');
      setSelectedShift(null);
      setAssignOptions(null);
      fetchShifts();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors
        ? Object.entries(err.response.data.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : err.response?.data?.detail || 'Lỗi khi cấu hình ca làm';
      setError(errorMessage);
      console.error('Error assigning shift:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleBackToList = () => {
    setSelectedShift(null);
    setAssignOptions(null);
    setSelectedItems({
      employees: [],
      positions: [],
      departments: [],
    });
    setError(null);
    setSuccessMessage(null);
  };

  if (!selectedShift || !assignOptions) {
    // View 1: List of Shifts
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình ca làm</h1>
            <p className="mt-2 text-gray-600">
              Chọn một ca làm để cấu hình các nhân viên, vị trí hoặc phòng ban áp dụng ca làm này.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start">
              <XMarkIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Lỗi</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start">
              <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Thành công</h3>
                <p className="mt-1 text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : shifts.length === 0 ? (
            <div className="rounded-lg bg-white border border-gray-200 p-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không có ca làm nào</h3>
              <p className="mt-2 text-gray-600">Vui lòng tạo ca làm trước.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => handleSelectShift(shift)}
                  className="w-full text-left bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {shift.code}
                        </span>
                        {shift.is_active ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Vô hiệu
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Giờ làm</p>
                          <p className="text-sm font-medium text-gray-900">
                            {shift.start_time} - {shift.end_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tổng giờ</p>
                          <p className="text-sm font-medium text-gray-900">{shift.total_hours} giờ</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Loại ca</p>
                          <p className="text-sm font-medium text-gray-900">{shift.shift_type_display}</p>
                        </div>
                      </div>

                      {shift.description && (
                        <p className="mt-3 text-sm text-gray-600">{shift.description}</p>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <EyeIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-xs text-gray-600">Cấu hình</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View 2: Assignment Configuration
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình ca: {selectedShift.name}</h1>
            <p className="mt-2 text-gray-600">
              Chọn nhân viên, vị trí hoặc phòng ban để áp dụng ca làm này
            </p>
          </div>
        </div>

        {/* Shift Details Card */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Mã ca</p>
              <p className="text-lg font-semibold text-gray-900">{selectedShift.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Giờ bắt đầu</p>
              <p className="text-lg font-semibold text-gray-900">{selectedShift.start_time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Giờ kết thúc</p>
              <p className="text-lg font-semibold text-gray-900">{selectedShift.end_time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng giờ</p>
              <p className="text-lg font-semibold text-gray-900">{selectedShift.total_hours} giờ</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start">
            <XMarkIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Lỗi</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Assign Options */}
        {loadingAssignOptions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                {['employees', 'positions', 'departments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAssignmentTab(tab as AssignmentTab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      assignmentTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {tab === 'employees' && <UserIcon className="h-5 w-5 mr-2" />}
                      {tab === 'positions' && <BriefcaseIcon className="h-5 w-5 mr-2" />}
                      {tab === 'departments' && <BuildingOfficeIcon className="h-5 w-5 mr-2" />}
                      {tab === 'employees' && 'Nhân viên'}
                      {tab === 'positions' && 'Vị trí'}
                      {tab === 'departments' && 'Phòng ban'}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {assignmentTab === 'employees' && 'Danh sách nhân viên'}
                  {assignmentTab === 'positions' && 'Danh sách vị trí'}
                  {assignmentTab === 'departments' && 'Danh sách phòng ban'}
                </h3>

                <div className="bg-white rounded-lg border border-gray-200">
                  {assignOptions.available_options[assignmentTab].length === 0 ? (
                    <div className="p-8 text-center">
                      <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        Không có {assignmentTab === 'employees' ? 'nhân viên' : assignmentTab === 'positions' ? 'vị trí' : 'phòng ban'} nào
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {assignOptions.available_options[assignmentTab].map((item: any) => (
                        <label
                          key={item.id}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems[assignmentTab].includes(item.id)}
                            onChange={() => handleItemToggle(assignmentTab, item.id)}
                            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {item.full_name || item.title || item.name}
                            </p>
                            {item.employee_id && (
                              <p className="text-xs text-gray-600">{item.employee_id}</p>
                            )}
                            {item.code && (
                              <p className="text-xs text-gray-600">{item.code}</p>
                            )}
                            {item.department__name && (
                              <p className="text-xs text-gray-600">{item.department__name}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Assignments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {assignmentTab === 'employees' && 'Nhân viên được chọn'}
                  {assignmentTab === 'positions' && 'Vị trí được chọn'}
                  {assignmentTab === 'departments' && 'Phòng ban được chọn'}
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({selectedItems[assignmentTab].length})
                  </span>
                </h3>

                <div className="bg-white rounded-lg border border-gray-200">
                  {selectedItems[assignmentTab].length === 0 ? (
                    <div className="p-8 text-center">
                      <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">Chưa chọn</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {selectedItems[assignmentTab]
                        .map((itemId) => {
                          const item = assignOptions.available_options[assignmentTab].find(
                            (i: any) => i.id === itemId
                          );
                          return item;
                        })
                        .filter(Boolean)
                        .map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.full_name || item.title || item.name}
                              </p>
                              {item.employee_id && (
                                <p className="text-xs text-gray-600">{item.employee_id}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleItemToggle(assignmentTab, item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={handleBackToList}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyAssignment}
                disabled={assigning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {assigning ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Áp dụng
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftConfiguration;
