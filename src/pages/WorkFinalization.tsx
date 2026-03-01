import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { departmentsAPI, Department } from '../utils/api';
import { workFinalizationService, WorkFinalizationRecord } from '../services/workFinalization.service';

const WorkFinalization: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role ? user.role.toUpperCase() : 'USER';

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [employeeCodeFilter, setEmployeeCodeFilter] = useState<string>('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [records, setRecords] = useState<WorkFinalizationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Load departments once
  useEffect(() => {
    departmentsAPI
      .list({ page_size: 200 })
      .then((res) => setDepartments(res.results))
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { year: selectedYear, month: selectedMonth };
      if (selectedDepartment) params.department_id = Number(selectedDepartment);
      if (employeeCodeFilter.trim()) params.employee_code = employeeCodeFilter.trim();

      const res = await workFinalizationService.list(params);
      setRecords(res.results);
      setTotal(res.total);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Không thể tải dữ liệu chốt công. Vui lòng thử lại.'
      );
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedDepartment, employeeCodeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFinalize = async (employeeCode: string) => {
    setFinalizing(employeeCode);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await workFinalizationService.finalize({
        employee_code: employeeCode,
        year: selectedYear,
        month: selectedMonth,
      });
      setSuccessMsg(
        `${res.created ? 'Chốt công thành công' : 'Đã cập nhật chốt công'} cho ${employeeCode}`
      );
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          `Lỗi khi chốt công cho ${employeeCode}`
      );
    } finally {
      setFinalizing(null);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('vi-VN');
  };

  const handleExport = async () => {
    if (records.length === 0) return;
    setExporting(true);
    try {
      // Dynamically import exceljs to keep the bundle lean
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
        { header: 'Tổng Phạt', key: 'tong_phat', width: 14 },
        { header: 'Tăng Ca', key: 'tang_ca', width: 10 },
        { header: 'Làm Tối', key: 'lam_toi', width: 10 },
        { header: 'Trực Tối', key: 'truc_toi', width: 10 },
        { header: 'Thêm Giờ', key: 'them_gio', width: 10 },
        { header: 'Live', key: 'live', width: 8 },
        { header: 'Phụ Cấp Gửi Xe', key: 'phu_cap_gui_xe', width: 16 },
      ];

      sheet.columns = headers;

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDER;
      });
      headerRow.height = 36;

      // Add data rows
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
          tong_phat: rec.tong_phat,
          tang_ca: rec.tang_ca,
          lam_toi: rec.lam_toi ?? '',
          truc_toi: rec.truc_toi,
          them_gio: rec.them_gio,
          live: rec.live,
          phu_cap_gui_xe: rec.phu_cap_gui_xe,
        });

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = BORDER;
          // Numeric columns: right-align
          if (colNumber >= 12) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        });

        // Format date cells
        ['ngay_bat_dau_lam_viec', 'ngay_ket_thuc_thu_viec', 'ngay_nghi_viec'].forEach(
          (key) => {
            const col = headers.findIndex((h) => h.key === key) + 1;
            const cell = row.getCell(col);
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy';
            }
          }
        );

        // Format currency/number cells for tong_phat and phu_cap_gui_xe
        const tongPhatCol = headers.findIndex((h) => h.key === 'tong_phat') + 1;
        const phuCapCol = headers.findIndex((h) => h.key === 'phu_cap_gui_xe') + 1;
        row.getCell(tongPhatCol).numFmt = '#,##0';
        row.getCell(phuCapCol).numFmt = '#,##0';
      });

      // Freeze first row
      sheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Generate file and trigger download
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

  if (userRole !== 'ADMIN' && userRole !== 'HR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chốt Công</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý bảng tính công hàng tháng và xuất báo cáo tính lương
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || records.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          {exporting ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
        </button>
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

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FunnelIcon className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Bộ lọc</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Month */}
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

          {/* Year */}
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

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phòng Ban
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
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

          {/* Employee Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mã Nhân Viên
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={employeeCodeFilter}
                onChange={(e) => setEmployeeCodeFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                placeholder="VD: NV001"
                className="block w-full pl-3 pr-3 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-indigo-600"
                title="Tải lại"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Table summary */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Tháng <strong>{selectedMonth}/{selectedYear}</strong> — Tổng:{' '}
            <strong>{total}</strong> nhân viên
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">
              Chưa có dữ liệu chốt công cho tháng {selectedMonth}/{selectedYear}.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Hãy chốt công cho từng nhân viên bằng nút bên dưới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {[
                    'STT',
                    'Mã NV',
                    'Họ và Tên',
                    'Phòng Ban',
                    'Vị Trí',
                    'Bác Sĩ',
                    'Ngày BĐ LV',
                    'Ngày KT TV',
                    'ON/OFF',
                    'Ngày NV',
                    'Hình Thức LV',
                    'C. Thử Việc',
                    'C. Chính Thức',
                    'Có Lễ',
                    'C. Thực Tế',
                    'Tổng Công',
                    'Tổng Phạt',
                    'Tăng Ca',
                    'Làm Tối',
                    'Trực Tối',
                    'Thêm Giờ',
                    'Live',
                    'PC Gửi Xe',
                    'Thao Tác',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {records.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2 py-2 text-center">{rec.stt}</td>
                    <td className="px-2 py-2 font-mono font-medium text-indigo-700">
                      {rec.ma_nv}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{rec.ho_va_ten}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{rec.phong_ban ?? '—'}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{rec.vi_tri ?? '—'}</td>
                    <td className="px-2 py-2 text-center">{rec.bac_si ?? '—'}</td>
                    <td className="px-2 py-2 text-center">
                      {formatDate(rec.ngay_bat_dau_lam_viec)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {formatDate(rec.ngay_ket_thuc_thu_viec)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          rec.on_off === 'ON'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rec.on_off ?? '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {formatDate(rec.ngay_nghi_viec)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {rec.hinh_thuc_lam_viec ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.cong_thu_viec)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.cong_chinh_thuc)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.co_le)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.cong_thuc_te)}</td>
                    <td className="px-2 py-2 text-right font-semibold">{formatNumber(rec.tong_cong)}</td>
                    <td className="px-2 py-2 text-right text-red-600">{formatNumber(rec.tong_phat)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.tang_ca)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.lam_toi)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.truc_toi)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.them_gio)}</td>
                    <td className="px-2 py-2 text-right">{rec.live}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(rec.phu_cap_gui_xe)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleFinalize(rec.ma_nv)}
                        disabled={finalizing === rec.ma_nv}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Chốt công lại"
                      >
                        {finalizing === rec.ma_nv ? (
                          <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                        )}
                        {finalizing === rec.ma_nv ? '' : 'Chốt lại'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkFinalization;
