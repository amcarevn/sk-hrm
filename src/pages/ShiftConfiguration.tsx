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
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { companyConfigAPI, ShiftConfig, departmentsAPI, positionsAPI } from '../utils/api';
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

interface EmployeeShiftInfo {
  employee_id: number;
  full_name: string;
  employee_code: string;
  current_shifts: ShiftConfig[];
}

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
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');
  // FIX: Modal is now an overlay — state kept separately, not used to swap views
  const [showEmployeeShiftsModal, setShowEmployeeShiftsModal] = useState(false);
  const [selectedEmployeeForShifts, setSelectedEmployeeForShifts] = useState<EmployeeShiftInfo | null>(null);
  const [loadingEmployeeShifts, setLoadingEmployeeShifts] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, [currentPage]);

  const fetchShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companyConfigAPI.listShiftConfigs({
        page: currentPage,
        page_size: 50,
        is_current: 'all',
      });
      setShifts(response.results);
      setTotalPages(Math.ceil(response.count / 50));
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
    if ((type === 'positions' || type === 'departments') && selectedItems[type].includes(id)) {
      (async () => {
        try {
          let employeesToRemove: number[] = [];
          if (type === 'positions') {
            const posEmployees = await positionsAPI.employees(id, { page_size: 1000 });
            employeesToRemove = posEmployees.results.map((e: any) => e.id);
          } else if (type === 'departments') {
            const deptEmployees = await departmentsAPI.employees(id, { page_size: 1000 });
            employeesToRemove = deptEmployees.results.map((e: any) => e.id);
          }

          setSelectedItems((prev) => ({
            ...prev,
            [type]: prev[type].filter((item) => item !== id),
            employees: prev.employees.filter((empId) => !employeesToRemove.includes(empId)),
          }));
        } catch (err) {
          console.error(`Error removing employees from ${type}:`, err);
          setSelectedItems((prev) => ({
            ...prev,
            [type]: prev[type].filter((item) => item !== id),
          }));
        }
      })();
    } else {
      setSelectedItems((prev) => {
        const items = prev[type];
        if (items.includes(id)) {
          return { ...prev, [type]: items.filter((item) => item !== id) };
        } else {
          return { ...prev, [type]: [...items, id] };
        }
      });
    }
  };

  const handleApplyAssignment = async () => {
    if (!selectedShift) return;

    setAssigning(true);
    setError(null);

    try {
      let allEmployeeIds = [...selectedItems.employees];

      if (selectedItems.departments.length > 0) {
        for (const deptId of selectedItems.departments) {
          try {
            const deptEmployees = await departmentsAPI.employees(deptId, { page_size: 1000 });
            const deptEmployeeIds = deptEmployees.results.map((emp: any) => emp.id);
            allEmployeeIds = [...new Set([...allEmployeeIds, ...deptEmployeeIds])];
          } catch (err) {
            console.error(`Error fetching employees for department ${deptId}:`, err);
          }
        }
      }

      if (selectedItems.positions.length > 0) {
        for (const posId of selectedItems.positions) {
          try {
            const posEmployees = await positionsAPI.employees(posId, { page_size: 1000 });
            const posEmployeeIds = posEmployees.results.map((emp: any) => emp.id);
            allEmployeeIds = [...new Set([...allEmployeeIds, ...posEmployeeIds])];
          } catch (err) {
            console.error(`Error fetching employees for position ${posId}:`, err);
          }
        }
      }

      const response = await companyConfigAPI.assignShiftConfig(selectedShift.id, {
        employee_ids: allEmployeeIds,
        ...(selectedItems.positions.length > 0 && { position_ids: selectedItems.positions }),
        ...(selectedItems.departments.length > 0 && { department_ids: selectedItems.departments }),
      });

      setSuccessMessage(response.message || 'Cấu hình ca làm thành công!');
      setSelectedShift(null);
      setAssignOptions(null);
      fetchShifts();

      setTimeout(() => setSuccessMessage(null), 3000);
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
    setSelectedItems({ employees: [], positions: [], departments: [] });
    setEmployeeSearchQuery('');
    setPositionSearchQuery('');
    setDepartmentSearchQuery('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleViewEmployeeShifts = async (employee: any) => {
    setSelectedEmployeeForShifts({
      employee_id: employee.id,
      full_name: employee.full_name,
      employee_code: employee.employee_id || '',
      current_shifts: [],
    });
    setLoadingEmployeeShifts(true);
    setShowEmployeeShiftsModal(true);
    setError(null);

    try {
      // FIX: Fetch ALL shifts of this employee — do NOT filter by selectedShift
      const response: any = await companyConfigAPI.getEmployeeShiftConfigs(employee.id);

      let employeeShifts: ShiftConfig[] = [];
      if (Array.isArray(response)) {
        employeeShifts = response;
      } else if (response?.results && Array.isArray(response.results)) {
        employeeShifts = response.results;
      }

      // No filtering here — show all shifts this employee belongs to
      console.log(`Employee ${employee.id} (${employee.full_name}) all shifts:`, employeeShifts);

      setSelectedEmployeeForShifts((prev) =>
        prev ? { ...prev, current_shifts: employeeShifts } : null
      );
    } catch (err: any) {
      console.error('Error fetching employee shifts:', err);
      setSelectedEmployeeForShifts((prev) =>
        prev ? { ...prev, current_shifts: [] } : null
      );
      setError('Lỗi khi tải ca làm của nhân viên');
    } finally {
      setLoadingEmployeeShifts(false);
    }
  };

  const handleCloseModal = () => {
    setShowEmployeeShiftsModal(false);
    setSelectedEmployeeForShifts(null);
  };

  const handleRemoveShiftFromEmployee = async (employeeId: number, shiftId: number) => {
    try {
      // Gọi endpoint mới — chỉ remove employee khỏi direct assignment
      // Không đụng đến department/position assignments
      await companyConfigAPI.removeEmployeeFromShift(shiftId, employeeId);

      setSuccessMessage('Đã xóa ca làm khỏi nhân viên');

      // Refresh modal với shifts mới của employee
      if (selectedEmployeeForShifts) {
        const updatedResponse: any = await companyConfigAPI.getEmployeeShiftConfigs(employeeId);
        let updatedShifts: ShiftConfig[] = [];
        if (Array.isArray(updatedResponse)) {
          updatedShifts = updatedResponse;
        } else if (updatedResponse?.results && Array.isArray(updatedResponse.results)) {
          updatedShifts = updatedResponse.results;
        }

        setSelectedEmployeeForShifts((prev) =>
          prev ? { ...prev, current_shifts: updatedShifts } : null
        );

        // Nếu employee không còn ca nào → bỏ tick + đóng modal
        if (updatedShifts.length === 0) {
          setSelectedItems((prev) => ({
            ...prev,
            employees: prev.employees.filter((id) => id !== employeeId),
          }));
          setTimeout(handleCloseModal, 500);
        }
      }

      // Refresh danh sách shift chính
      fetchShifts();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi xóa ca làm');
      console.error('Error removing shift from employee:', err);
    }
  };

const filteredEmployees = assignOptions
  ? (() => {
      const query = employeeSearchQuery.trim().toLowerCase();
      const unique = assignOptions.available_options.employees.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex((x: any) => x.id === item.id)
      );
      if (!query) return unique;
      return unique.filter((employee: any) =>
        (employee.full_name?.toLowerCase() || '').includes(query) ||
        (employee.employee_id?.toLowerCase() || '').includes(query)
      );
    })()
  : [];

const filteredPositions = assignOptions
  ? (() => {
      const query = positionSearchQuery.trim().toLowerCase();
      const unique = assignOptions.available_options.positions.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex((x: any) => x.id === item.id)
      );
      if (!query) return unique;
      return unique.filter((position: any) =>
        (position.title?.toLowerCase() || '').includes(query) ||
        (position.name?.toLowerCase() || '').includes(query) ||   // fallback nếu API dùng 'name'
        (position.code?.toLowerCase() || '').includes(query)
      );
    })()
  : [];

const filteredDepartments = assignOptions
  ? (() => {
      const query = departmentSearchQuery.trim().toLowerCase();
      const unique = assignOptions.available_options.departments.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex((x: any) => x.id === item.id)
      );
      if (!query) return unique;
      return unique.filter((department: any) =>
        (department.name?.toLowerCase() || '').includes(query) ||
        (department.code?.toLowerCase() || '').includes(query)
      );
    })()
  : [];

  // ─── VIEW 1: List of Shifts ───────────────────────────────────────────────
  if (!selectedShift || !assignOptions) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình ca làm</h1>
            <p className="mt-2 text-gray-600">
              Chọn một ca làm để cấu hình các nhân viên, vị trí hoặc phòng ban áp dụng ca làm này.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start">
              <XMarkIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Lỗi</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start">
              <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Thành công</h3>
                <p className="mt-1 text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

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

  // ─── VIEW 2: Assignment Configuration + Modal overlay ────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* FIX: Modal is an overlay on top of View 2, not a separate view */}
      {showEmployeeShiftsModal && selectedEmployeeForShifts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Ca làm của: {selectedEmployeeForShifts.full_name}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Mã nhân viên: {selectedEmployeeForShifts.employee_code}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 ml-4">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingEmployeeShifts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : selectedEmployeeForShifts.current_shifts.length === 0 ? (
                <div className="text-center py-8">
                  <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">Nhân viên này chưa được gán ca làm nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEmployeeForShifts.current_shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{shift.name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {shift.code}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {shift.start_time} - {shift.end_time} ({shift.total_hours}h)
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveShiftFromEmployee(selectedEmployeeForShifts.employee_id, shift.id)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa ca làm này khỏi nhân viên"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
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

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start">
            <XMarkIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Lỗi</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start">
            <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Thành công</h3>
              <p className="mt-1 text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {loadingAssignOptions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Lưu ý:</strong> Khi bạn chọn một <strong>vị trí</strong> hoặc{' '}
                <strong>phòng ban</strong>, tất cả nhân viên thuộc vị trí/phòng ban đó sẽ tự động
                nhận được ca làm này.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                {(['employees', 'positions', 'departments'] as AssignmentTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setAssignmentTab(tab);
                      setEmployeeSearchQuery('');
                      setPositionSearchQuery('');
                      setDepartmentSearchQuery('');
                    }}
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
              <div key={`available-${assignmentTab}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {assignmentTab === 'employees' && 'Danh sách nhân viên'}
                  {assignmentTab === 'positions' && 'Danh sách vị trí'}
                  {assignmentTab === 'departments' && 'Danh sách phòng ban'}
                </h3>

                {assignmentTab === 'employees' && (
                  <div className="mb-4 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      key={`employee-search-${assignmentTab}`}
                      type="text"
                      placeholder="Tìm kiếm theo mã nhân viên hoặc tên..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {assignmentTab === 'positions' && (
                  <div className="mb-4 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      key={`position-search-${assignmentTab}`}
                      type="text"
                      placeholder="Tìm kiếm theo mã vị trí hoặc tên..."
                      value={positionSearchQuery}
                      onChange={(e) => setPositionSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {assignmentTab === 'departments' && (
                  <div className="mb-4 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      key={`department-search-${assignmentTab}`}
                      type="text"
                      placeholder="Tìm kiếm theo mã phòng ban hoặc tên..."
                      value={departmentSearchQuery}
                      onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {(assignmentTab === 'positions' || assignmentTab === 'departments') && (
                  <div className="mb-4 text-sm text-gray-600 italic p-3 bg-gray-50 rounded-lg border border-gray-200">
                    ✓ Tất cả nhân viên thuộc{' '}
                    {assignmentTab === 'positions' ? 'vị trí' : 'phòng ban'} này sẽ nhận được ca
                    làm này
                  </div>
                )}

                <div key={`list-${assignmentTab}`} className="bg-white rounded-lg border border-gray-200">
                  {(assignmentTab === 'employees'
                    ? filteredEmployees
                    : assignmentTab === 'positions'
                    ? filteredPositions
                    : filteredDepartments
                  ).length === 0 ? (
                    <div className="p-8 text-center">
                      <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        Không có{' '}
                        {assignmentTab === 'employees'
                          ? 'nhân viên'
                          : assignmentTab === 'positions'
                          ? 'vị trí'
                          : 'phòng ban'}{' '}
                        nào
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {(assignmentTab === 'employees'
                        ? filteredEmployees
                        : assignmentTab === 'positions'
                        ? filteredPositions
                        : filteredDepartments
                      ).map((item: any) => (
                        <div
                          key={`${assignmentTab}-${item.id}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          <label className="flex items-center flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedItems[assignmentTab].includes(item.id)}
                              onChange={() => handleItemToggle(assignmentTab, item.id)}
                              className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {assignmentTab === 'employees' && (item.full_name || 'N/A')}
                                {assignmentTab === 'positions' && (item.title || item.name || 'N/A')}
                                {assignmentTab === 'departments' && (item.name || 'N/A')}
                              </p>
                              {assignmentTab === 'employees' && item.employee_id && (
                                <p className="text-xs text-gray-600 font-mono">{item.employee_id}</p>
                              )}
                              {assignmentTab === 'positions' && item.code && (
                                <p className="text-xs text-gray-600">{item.code}</p>
                              )}
                              {assignmentTab === 'positions' && item.department && (
                                <p className="text-xs text-gray-600">
                                  {Array.isArray(item.department)
                                    ? item.department.map((d: any) => d.name).join(', ')
                                    : item.department.name}
                                </p>
                              )}
                              {assignmentTab === 'departments' && item.code && (
                                <p className="text-xs text-gray-600">{item.code}</p>
                              )}
                              {assignmentTab === 'employees' && item.department__name && (
                                <p className="text-xs text-gray-600">{item.department__name}</p>
                              )}
                            </div>
                          </label>

                          {assignmentTab === 'employees' && (
                            <button
                              onClick={() => handleViewEmployeeShifts(item)}
                              title="Xem tất cả ca làm của nhân viên này"
                              className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Items */}
              <div key={`selected-${assignmentTab}`}>
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
                        .map((itemId) =>
                          assignOptions.available_options[assignmentTab].find(
                            (i: any) => i.id === itemId
                          )
                        )
                        .filter(Boolean)
                        .map((item: any) => (
                          <div
                            key={`${assignmentTab}-${item.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {assignmentTab === 'employees' && (item.full_name || 'N/A')}
                                {assignmentTab === 'positions' && (item.title || item.name || 'N/A')}
                                {assignmentTab === 'departments' && (item.name || 'N/A')}
                              </p>
                              {assignmentTab === 'employees' && item.employee_id && (
                                <p className="text-xs text-gray-600">{item.employee_id}</p>
                              )}
                              {assignmentTab === 'positions' && item.code && (
                                <p className="text-xs text-gray-600">{item.code}</p>
                              )}
                              {assignmentTab === 'positions' && item.department && (
                                <p className="text-xs text-gray-600">
                                  {Array.isArray(item.department)
                                    ? item.department.map((d: any) => d.name).join(', ')
                                    : item.department.name}
                                </p>
                              )}
                              {assignmentTab === 'departments' && item.code && (
                                <p className="text-xs text-gray-600">{item.code}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {assignmentTab === 'employees' && (
                                <button
                                  onClick={() => handleViewEmployeeShifts(item)}
                                  title="Xem tất cả ca làm của nhân viên này"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleItemToggle(assignmentTab, item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
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