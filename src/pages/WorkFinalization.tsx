import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
  CalendarIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { departmentsAPI, employeesAPI, Department, Employee } from '../utils/api';
import { workFinalizationService, WorkFinalizationRecord } from '../services/workFinalization.service';
import type { FinalizeAllResponse, FinalizeDepartmentResponse } from '../services/workFinalization.service';
import AttendanceCalendar from '../components/AttendanceCalendar';

const WorkFinalization: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role ? user.role.toUpperCase() : 'USER';

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<WorkFinalizationRecord[]>([]);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [finalizingAll, setFinalizingAll] = useState(false);
  const [finalizingDepartment, setFinalizingDepartment] = useState(false);
  const [finalizeAllResult, setFinalizeAllResult] = useState<FinalizeAllResponse | null>(null);
  const [finalizeDepartmentResult, setFinalizeDepartmentResult] = useState<FinalizeDepartmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected employee for calendar view
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Load departments once
  useEffect(() => {
    departmentsAPI
      .list({ page_size: 200 })
      .then((res) => setDepartments(res.results))
      .catch(() => { });
  }, []);

  // Load employees when dept filter changes
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const params: any = { page_size: 200 };
      if (selectedDepartment) params.department = Number(selectedDepartment);
      const res = await employeesAPI.list(params);
      setEmployees(res.results);
    } catch {
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Load finalization records for the selected month/year/dept
  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    setError(null);
    try {
      const params: any = { year: selectedYear, month: selectedMonth };
      if (selectedDepartment) params.department_id = Number(selectedDepartment);
      const res = await workFinalizationService.list(params);
      setRecords(res.results);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        'Không thể tải dữ liệu chốt công. Vui lòng thử lại.'
      );
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedYear, selectedMonth, selectedDepartment]);

  // Derived state: filtered employees based on search term
  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      emp.full_name.toLowerCase().includes(search) ||
      emp.employee_id.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Returns the finalization record for an employee (by employee_id / ma_nv)
  const getFinalizedRecord = (emp: Employee): WorkFinalizationRecord | undefined =>
    records.find((r) => r.ma_nv === emp.employee_id);

  const handleFinalize = async (emp: Employee) => {
    setFinalizing(emp.employee_id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await workFinalizationService.finalize({
        employee_code: emp.employee_id,
        year: selectedYear,
        month: selectedMonth,
      });
      setSuccessMsg(
        `${res.created ? 'Chốt công thành công' : 'Đã cập nhật chốt công'} cho ${emp.employee_id} - ${emp.full_name}`
      );
      await loadRecords();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        `Lỗi khi chốt công cho ${emp.employee_id}`
      );
    } finally {
      setFinalizing(null);
    }
  };

  const handleFinalizeAll = async () => {
    if (!window.confirm(`Bạn có chắc muốn chốt công cho toàn bộ nhân viên tháng ${selectedMonth}/${selectedYear}?`)) {
      return;
    }
    setFinalizingAll(true);
    setError(null);
    setSuccessMsg(null);
    setFinalizeAllResult(null);
    try {
      const res = await workFinalizationService.finalizeAll({
        year: selectedYear,
        month: selectedMonth,
      });
      setFinalizeAllResult(res);
      setSuccessMsg(
        `Đã chốt công ${res.total_processed} nhân viên tháng ${selectedMonth}/${selectedYear}` +
        (res.total_errors > 0 ? ` (${res.total_errors} lỗi)` : '')
      );
      await loadRecords();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        'Lỗi khi chốt công toàn bộ. Vui lòng thử lại.'
      );
    } finally {
      setFinalizingAll(false);
    }
  };

  const handleFinalizeDepartment = async () => {
    if (!selectedDepartment) return;
    const dept = departments.find((d) => d.id === Number(selectedDepartment));
    const deptName = dept ? dept.name : `Phòng ban #${selectedDepartment}`;
    if (!window.confirm(`Bạn có chắc muốn chốt công cho phòng ban "${deptName}" tháng ${selectedMonth}/${selectedYear}?`)) {
      return;
    }
    setFinalizingDepartment(true);
    setError(null);
    setSuccessMsg(null);
    setFinalizeDepartmentResult(null);
    try {
      const res = await workFinalizationService.finalizeDepartment({
        year: selectedYear,
        month: selectedMonth,
        department_id: Number(selectedDepartment),
      });
      setFinalizeDepartmentResult(res);
      setSuccessMsg(
        `Đã chốt công ${res.total_processed} nhân viên phòng ban "${deptName}" tháng ${selectedMonth}/${selectedYear}` +
        (res.total_errors > 0 ? ` (${res.total_errors} lỗi)` : '')
      );
      await loadRecords();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        'Lỗi khi chốt công phòng ban. Vui lòng thử lại.'
      );
    } finally {
      setFinalizingDepartment(false);
    }
  };

  const handleExport = async () => {
    if (records.length === 0) return;
    setExporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(
        `Tháng ${selectedMonth}_${selectedYear}`
      );

      const HEADER_FILL = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF4472C4' },
      };
      const HEADER_FONT = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      const BORDER = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      };

      const headers = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Mã NV', key: 'ma_nv', width: 10 },
        { header: 'Họ và Tên', key: 'ho_va_ten', width: 24 },
        { header: 'Phòng Ban', key: 'phong_ban', width: 18 },
        { header: 'Vị Trí', key: 'vi_tri', width: 18 },
        { header: 'Bác Sĩ', key: 'bac_si', width: 10 },
        { header: 'Ngày BĐ Làm Việc', key: 'ngay_bat_dau_lam_viec', width: 18 },
        { header: 'Ngày KT Thử Việc', key: 'ngay_ket_thuc_thu_viec', width: 18 },
        { header: 'ON/OFF', key: 'on_off', width: 8 },
        { header: 'Ngày Nghỉ Việc', key: 'ngay_nghi_viec', width: 16 },
        { header: 'Hình Thức LV', key: 'hinh_thuc_lam_viec', width: 14 },
        { header: 'Công Thử Việc', key: 'cong_thu_viec', width: 14 },
        { header: 'Công Chính Thức', key: 'cong_chinh_thuc', width: 16 },
        { header: 'Có Lễ', key: 'co_le', width: 10 },
        { header: 'Công Thực Tế', key: 'cong_thuc_te', width: 14 },
        { header: 'Tổng Công', key: 'tong_cong', width: 12 },
        { header: 'Nghỉ Phép', key: 'nghi_phep', width: 12 },
        { header: 'Làm Việc Online', key: 'lam_viec_online', width: 14 },
        { header: 'Tổng Phạt', key: 'tong_phat', width: 14 },
        { header: 'Tăng Ca', key: 'tang_ca', width: 10 },
        { header: 'Làm Tối', key: 'lam_toi', width: 10 },
        { header: 'Trực Tối', key: 'truc_toi', width: 10 },
        { header: 'Làm Thêm Giờ', key: 'lam_them_gio', width: 14 },
        { header: 'Live', key: 'live', width: 8 },
        { header: 'Phụ Cấp Gửi Xe', key: 'phu_cap_gui_xe', width: 16 },
      ];

      sheet.columns = headers;

      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDER;
      });
      headerRow.height = 36;

      records.forEach((rec) => {
        const row = sheet.addRow({
          stt: rec.stt,
          ma_nv: rec.ma_nv,
          ho_va_ten: rec.ho_va_ten,
          phong_ban: rec.phong_ban ?? '',
          vi_tri: rec.vi_tri ?? '',
          bac_si: rec.bac_si ?? '',
          ngay_bat_dau_lam_viec: rec.ngay_bat_dau_lam_viec
            ? new Date(rec.ngay_bat_dau_lam_viec)
            : '',
          ngay_ket_thuc_thu_viec: rec.ngay_ket_thuc_thu_viec
            ? new Date(rec.ngay_ket_thuc_thu_viec)
            : '',
          on_off: rec.on_off ?? '',
          ngay_nghi_viec: rec.ngay_nghi_viec
            ? new Date(rec.ngay_nghi_viec)
            : '',
          hinh_thuc_lam_viec: rec.hinh_thuc_lam_viec ?? '',
          cong_thu_viec: rec.cong_thu_viec,
          cong_chinh_thuc: rec.cong_chinh_thuc,
          co_le: rec.co_le ?? '',
          cong_thuc_te: rec.cong_thuc_te,
          tong_cong: rec.tong_cong,
          nghi_phep: rec.nghi_phep,
          tong_phat: rec.tong_phat,
          tang_ca: rec.tang_ca,
          lam_toi: rec.lam_toi ?? '',
          truc_toi: rec.truc_toi,
          lam_them_gio: rec.lam_them_gio,
          live: rec.live,
          phu_cap_gui_xe: rec.phu_cap_gui_xe,
        });

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = BORDER;
          if (colNumber >= 12) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        });

        ['ngay_bat_dau_lam_viec', 'ngay_ket_thuc_thu_viec', 'ngay_nghi_viec'].forEach(
          (key) => {
            const col = headers.findIndex((h) => h.key === key) + 1;
            const cell = row.getCell(col);
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy';
            }
          }
        );

        const tongPhatCol = headers.findIndex((h) => h.key === 'tong_phat') + 1;
        const phuCapCol = headers.findIndex((h) => h.key === 'phu_cap_gui_xe') + 1;
        row.getCell(tongPhatCol).numFmt = '#,##0';
        row.getCell(phuCapCol).numFmt = '#,##0';
      });

      sheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bang_cham_cong_Thang${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('vi-VN');
  };

  if (userRole !== 'ADMIN' && userRole !== 'HR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const finalizedRec = selectedEmployee ? getFinalizedRecord(selectedEmployee) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chốt Công</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý bảng tính công hàng tháng và xuất báo cáo tính lương
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/work-finalization/approvals"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
            Phê duyệt chốt công
          </Link>
          <button
            onClick={handleFinalizeAll}
            disabled={finalizingAll || finalizingDepartment || finalizing !== null || exporting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BoltIcon className="w-4 h-4 mr-2" />
            {finalizingAll ? 'Đang chốt...' : `Chốt tất cả (Tháng ${selectedMonth}/${selectedYear})`}
          </button>
          {selectedDepartment && (
            <button
              onClick={handleFinalizeDepartment}
              disabled={finalizingDepartment || finalizingAll || finalizing !== null || exporting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BoltIcon className="w-4 h-4 mr-2" />
              {finalizingDepartment
                ? 'Đang chốt...'
                : `Chốt phòng ban (Tháng ${selectedMonth}/${selectedYear})`}
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting || records.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            {exporting ? 'Đang xuất...' : `Xuất Excel (${records.length} đã chốt)`}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
          <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center p-4 text-sm text-green-800 bg-green-50 rounded-lg border border-green-200">
          <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Finalize-all result summary */}
      {finalizeAllResult && (
        <div className="bg-white shadow rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-indigo-500" />
              Kết quả chốt công toàn công ty — Tháng {finalizeAllResult.month}/{finalizeAllResult.year}
            </span>
            <button
              onClick={() => setFinalizeAllResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Đóng
            </button>
          </div>
          <div className="flex gap-4 text-sm mb-3">
            <span className="text-green-700 font-medium">✓ Đã xử lý: {finalizeAllResult.total_processed}</span>
            {finalizeAllResult.total_errors > 0 && (
              <span className="text-red-600 font-medium">✗ Lỗi: {finalizeAllResult.total_errors}</span>
            )}
          </div>
          {finalizeAllResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-700 mb-1">Chi tiết lỗi:</p>
              <ul className="space-y-1">
                {finalizeAllResult.errors.map((e) => (
                  <li key={e.employee_code} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                    <span className="font-mono">{e.employee_code}</span> — {e.ho_va_ten}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Finalize-department result summary */}
      {finalizeDepartmentResult && (
        <div className="bg-white shadow rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-purple-500" />
              Kết quả chốt công phòng ban — Tháng {finalizeDepartmentResult.month}/{finalizeDepartmentResult.year}
            </span>
            <button
              onClick={() => setFinalizeDepartmentResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Đóng
            </button>
          </div>
          <div className="flex gap-4 text-sm mb-3">
            <span className="text-green-700 font-medium">✓ Đã xử lý: {finalizeDepartmentResult.total_processed}</span>
            {finalizeDepartmentResult.total_errors > 0 && (
              <span className="text-red-600 font-medium">✗ Lỗi: {finalizeDepartmentResult.total_errors}</span>
            )}
          </div>
          {finalizeDepartmentResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-700 mb-1">Chi tiết lỗi:</p>
              <ul className="space-y-1">
                {finalizeDepartmentResult.errors.map((e) => (
                  <li key={e.employee_code} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                    <span className="font-mono">{e.employee_code}</span> — {e.ho_va_ten}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FunnelIcon className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Bộ lọc & Tìm kiếm</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phòng Ban</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedEmployee(null);
              }}
              className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên hoặc mã NV..."
                className="block w-full pl-10 pr-3 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { loadEmployees(); loadRecords(); }}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Main two-panel layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Left: Employee list */}
        <div className="w-80 flex-shrink-0 bg-white shadow rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              Danh sách nhân sự
            </span>
            <span className="text-xs text-gray-500">
              {searchTerm ? `${filteredEmployees.length}/` : ''}{employees.length} NV · {records.length} đã chốt
            </span>
          </div>
          {loadingEmployees ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-4 text-center">
              {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có nhân viên nào'}
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredEmployees.map((emp) => {
                const rec = getFinalizedRecord(emp);
                const isFinalized = !!rec;
                const isSelected = selectedEmployee?.id === emp.id;
                const isBeingFinalized = finalizing === emp.employee_id;
                return (
                  <li
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`px-3 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {emp.full_name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {emp.employee_id}
                          </p>
                          {emp.department && (
                            <p className="text-xs text-gray-400 truncate">
                              {emp.department.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {isFinalized ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-0.5" />
                            Đã chốt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Chưa chốt
                          </span>
                        )}
                        {!isFinalized && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFinalize(emp);
                            }}
                            disabled={isBeingFinalized}
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBeingFinalized ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              'Chốt công'
                            )}
                          </button>
                        )}
                        {isFinalized && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFinalize(emp);
                            }}
                            disabled={isBeingFinalized}
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBeingFinalized ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              'Chốt lại'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Show summary if finalized */}
                    {isFinalized && rec && (
                      <div className="mt-2 flex gap-3 text-xs text-gray-500">
                        <span>Công: <strong className="text-gray-700">{rec.tong_cong}</strong></span>
                        <span>Phạt: <strong className="text-red-600">{formatNumber(rec.tong_phat)}đ</strong></span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Calendar / Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {!selectedEmployee ? (
            <div className="flex-1 bg-white shadow rounded-lg flex flex-col items-center justify-center text-gray-400 p-10">
              <CalendarIcon className="h-16 w-16 mb-4 text-gray-200" />
              <p className="text-base font-medium">Chọn một nhân viên</p>
              <p className="text-sm mt-1">để xem lịch chấm công</p>
            </div>
          ) : (
            <>
              {/* Employee info bar */}
              <div className="bg-white shadow rounded-lg px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedEmployee.employee_id}
                      {selectedEmployee.department && ` · ${selectedEmployee.department.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {finalizedRec ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Đã chốt công tháng {selectedMonth}/{selectedYear}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Chưa chốt công tháng {selectedMonth}/{selectedYear}
                    </span>
                  )}
                  <button
                    onClick={() => handleFinalize(selectedEmployee)}
                    disabled={finalizing === selectedEmployee.employee_id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {finalizing === selectedEmployee.employee_id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                    )}
                    {finalizedRec ? 'Chốt lại' : 'Chốt công'}
                  </button>
                </div>
              </div>

              {/* Attendance Calendar */}
              <AttendanceCalendar
                year={selectedYear}
                month={selectedMonth - 1}
                employeeId={selectedEmployee.id}
                showInternalDialog={true}
              />

              {/* Finalization details if finalized */}
              {finalizedRec && (
                <div className="bg-white shadow rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">
                    Kết quả chốt công tháng {selectedMonth}/{selectedYear}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Công thử việc', value: String(finalizedRec.cong_thu_viec), cardCls: 'bg-blue-50', labelCls: 'text-blue-700', valCls: 'text-blue-800 font-bold' },
                      { label: 'Công chính thức', value: `${finalizedRec.cong_chinh_thuc} công`, cardCls: 'bg-indigo-50', labelCls: 'text-indigo-700', valCls: 'text-indigo-800 font-bold' },
                      { label: 'Công thực tế', value: `${finalizedRec.cong_thuc_te} công`, cardCls: 'bg-green-50', labelCls: 'text-green-700', valCls: 'text-green-800 font-bold' },
                      { label: 'Tổng công', value: `${finalizedRec.tong_cong} công`, cardCls: 'bg-emerald-50', labelCls: 'text-emerald-700', valCls: 'text-emerald-800 font-extrabold' },
                      { label: 'Nghỉ phép tháng', value: `${finalizedRec.nghi_phep} ngày`, cardCls: 'bg-indigo-50/50', labelCls: 'text-indigo-700', valCls: 'text-indigo-800 font-bold' },
                      { label: 'Làm việc online', value: `${finalizedRec.lam_viec_online ?? 0} ngày`, cardCls: 'bg-cyan-50', labelCls: 'text-cyan-700', valCls: 'text-cyan-800 font-bold' },
                      { label: 'Tăng ca', value: `${finalizedRec.tang_ca} giờ`, cardCls: 'bg-orange-50', labelCls: 'text-orange-700', valCls: 'text-orange-800 font-bold' },
                      { label: 'Trực tối', value: `${finalizedRec.truc_toi} buổi`, cardCls: 'bg-purple-50', labelCls: 'text-purple-700', valCls: 'text-purple-800 font-bold' },
                      { label: 'Làm thêm giờ', value: `${finalizedRec.lam_them_gio} giờ`, cardCls: 'bg-yellow-50', labelCls: 'text-yellow-700', valCls: 'text-yellow-800 font-bold' },
                      { label: 'Live', value: `${finalizedRec.live} ca`, cardCls: 'bg-pink-50', labelCls: 'text-pink-700', valCls: 'text-pink-800 font-bold' },
                      { label: 'PC Gửi xe', value: `${formatNumber(finalizedRec.phu_cap_gui_xe)}đ`, cardCls: 'bg-teal-50', labelCls: 'text-teal-700', valCls: 'text-teal-800 font-bold' },
                      { label: 'Tổng phạt', value: `${formatNumber(finalizedRec.tong_phat)}đ`, cardCls: 'bg-red-50', labelCls: 'text-red-700', valCls: 'text-red-800 font-bold' },
                    ].map((item) => (
                      <div key={item.label} className={`${item.cardCls} rounded-lg p-3`}>
                        <p className={`text-xs font-medium ${item.labelCls}`}>{item.label}</p>
                        <p className={`text-lg mt-0.5 ${item.valCls}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkFinalization;

