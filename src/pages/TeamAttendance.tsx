import React, { useEffect, useMemo, useState } from 'react';
import { BuildingOfficeIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { SelectBox, type SelectOption } from '../components/LandingLayout/SelectBox';
import { Employee, departmentsAPI, employeesAPI } from '@/utils/api';

// Tab "Nhân viên" ở trang Chấm công (HCNS SK 2026-10-27, như Trung Anh): xem bảng công
// tháng của MỘT nhân viên khác ở chế độ chỉ xem.
// - Admin/HR: chọn phòng ban rồi chọn nhân viên trong phòng ban đó.
// - QLTT/Trưởng phòng: danh sách là chính mình + những người mình được xem công
//   (cấp dưới trực tiếp/cấp 2/cấp 3, phòng ban mình quản lý) — backend tự giới hạn qua
//   /employees/?scope=attendance_team và chặn lại ở API lịch công, FE chỉ lo luồng chọn.

interface DepartmentLite {
  id: number;
  name: string;
  code?: string;
}

/** Đã nghỉ việc theo end_date (employment_status/is_active thường không được cập nhật). */
const todayYMD = (() => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
const hasResigned = (emp: Employee): boolean => {
  const end = (emp as any)?.end_date;
  return !!end && String(end).slice(0, 10) <= todayYMD;
};
const fmtDate = (v?: string): string => {
  if (!v) return '';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : String(v);
};

const TeamAttendance: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const isAdminOrHR = role === 'ADMIN' || role === 'HR' || !!(user as any)?.is_super_admin;

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<DepartmentLite[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showResigned, setShowResigned] = useState(false);

  useEffect(() => {
    employeesAPI.me().then(setCurrentEmployee).catch(() => setCurrentEmployee(null));
  }, []);

  // Admin/HR: chọn phòng ban trước.
  useEffect(() => {
    if (!isAdminOrHR) return;
    departmentsAPI
      .list({ page_size: 500 } as any)
      .then((res: any) => setDepartments(res.results || res || []))
      .catch(() => setDepartments([]));
  }, [isAdminOrHR]);

  // Danh sách nhân viên: Admin/HR theo phòng ban đã chọn; QLTT lấy luôn phạm vi của mình.
  useEffect(() => {
    setSelectedEmployeeId(null);
    if (isAdminOrHR && !selectedDepartment) {
      setEmployeeList([]);
      return;
    }
    setLoadingEmployees(true);
    const params: any = { scope: 'attendance_team', page_size: 5000, ordering: 'full_name', include_inactive: 'true' };
    if (isAdminOrHR) params.department = selectedDepartment;
    employeesAPI
      .list(params)
      .then((res: any) => setEmployeeList(res.results || []))
      .catch(() => setEmployeeList([]))
      .finally(() => setLoadingEmployees(false));
  }, [isAdminOrHR, selectedDepartment]);

  const employeeOptions = useMemo<SelectOption<number>[]>(() => {
    return employeeList
      .filter((emp) => showResigned || !hasResigned(emp) || emp.id === selectedEmployeeId)
      .map((emp) => ({
        value: emp.id,
        label:
          `${emp.employee_id} - ${emp.full_name}` +
          (currentEmployee && emp.id === currentEmployee.id ? ' (Tôi)' : '') +
          (hasResigned(emp) ? ` (đã nghỉ ${fmtDate((emp as any).end_date)})` : ''),
      }));
  }, [employeeList, showResigned, selectedEmployeeId, currentEmployee]);

  const resignedCount = useMemo(() => employeeList.filter(hasResigned).length, [employeeList]);
  const selectedEmployee = employeeList.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className={`grid grid-cols-1 gap-4 ${isAdminOrHR ? 'md:grid-cols-2' : ''}`}>
          {isAdminOrHR && (
            <div>
              <label className="flex items-center text-xs font-semibold text-gray-500 mb-1">
                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                Phòng ban
              </label>
              <SelectBox<number | null>
                label=""
                value={selectedDepartment}
                options={departments.map((d) => ({ value: d.id, label: d.code ? `${d.code} - ${d.name}` : d.name }))}
                onChange={setSelectedDepartment}
                placeholder="-- Chọn phòng ban --"
                searchable
                portal
              />
            </div>
          )}
          <div>
            <label className="flex items-center text-xs font-semibold text-gray-500 mb-1">
              <UserIcon className="h-4 w-4 mr-1" />
              Nhân viên
            </label>
            <SelectBox<number | null>
              label=""
              value={selectedEmployeeId}
              options={employeeOptions}
              onChange={setSelectedEmployeeId}
              placeholder={
                isAdminOrHR && !selectedDepartment
                  ? 'Chọn phòng ban trước'
                  : loadingEmployees
                    ? 'Đang tải...'
                    : 'Tìm theo tên hoặc mã nhân viên...'
              }
              searchable
              portal
            />
            {!isAdminOrHR && (
              <p className="text-[11px] text-gray-400 mt-1">
                Bạn xem được bảng công của chính mình và nhân viên cấp dưới.
              </p>
            )}
            {!loadingEmployees && (!isAdminOrHR || selectedDepartment) && employeeOptions.length === 0 && (
              <p className="text-[11px] text-gray-400 mt-1">Không có nhân viên nào để hiển thị.</p>
            )}
            {resignedCount > 0 && (
              <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showResigned}
                  onChange={(e) => setShowResigned(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Hiện cả nhân viên đã nghỉ việc
                <span className="font-semibold text-gray-500">({resignedCount})</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {!selectedEmployeeId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa chọn nhân viên</h3>
          <p className="text-sm text-gray-500">
            {isAdminOrHR ? 'Chọn phòng ban rồi chọn nhân viên để xem bảng công.' : 'Chọn nhân viên để xem bảng công.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          {selectedEmployee && (
            <p className="mb-3 text-sm text-gray-600">
              Bảng công của <strong className="text-gray-900">{selectedEmployee.full_name}</strong>{' '}
              ({selectedEmployee.employee_id})
            </p>
          )}
          {/* key: đổi người thì dựng lại lịch để không lẫn dữ liệu người trước */}
          <AttendanceCalendar key={selectedEmployeeId} employeeId={selectedEmployeeId} showInternalDialog />
        </div>
      )}
    </div>
  );
};

export default TeamAttendance;
