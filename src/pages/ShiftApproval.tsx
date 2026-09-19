import React, { useEffect, useMemo, useRef, useState } from 'react';
import { employeesAPI, shiftRegistrationsAPI } from '../utils/api';
import type { ShiftRegistration as ShiftRegistrationType } from '../utils/api';
import type { ShiftRegistrationUploadResult } from '../utils/api/shift-registration.api';
import { useAuth } from '../contexts/AuthContext';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import {
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const fmtDate = (ymd: string): string => {
  const d = new Date(ymd);
  return `${WD[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
};

const fmtRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const f = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${f(s)} – ${f(e)}`;
};

const fmtTime = (t?: string): string => (t ? t.slice(0, 5) : '');

const TABS: Array<{ key: 'PENDING' | 'APPROVED' | 'REJECTED'; label: string }> = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const DEPT_FALLBACK = 'Chưa xác định phòng ban';

const ShiftApproval: React.FC = () => {
  const { user } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  const isAdmin =
    (user as any)?.is_superuser ||
    (user as any)?.is_staff ||
    user?.role?.toUpperCase() === 'ADMIN';
  const isHR = currentEmployee?.is_hr === true || user?.role?.toUpperCase() === 'HR';
  const isManagement =
    currentEmployee?.is_manager === true ||
    currentEmployee?.position?.is_management === true ||
    (currentEmployee?.department?.manager_id != null &&
      currentEmployee.department.manager_id === currentEmployee?.id);
  const isPrivileged = isAdmin || isHR; // có thể duyệt bước HCNS
  const hasBulkApprovePermission = isAdmin || isHR || isManagement;

  useEffect(() => {
    employeesAPI
      .me()
      .then(setCurrentEmployee)
      .catch((err) => console.error('Lỗi tải hồ sơ nhân viên hiện tại:', err));
  }, []);

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [items, setItems] = useState<ShiftRegistrationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [bulkProcessingDept, setBulkProcessingDept] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ShiftRegistrationType | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  const [filterName, setFilterName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(today.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(today.getFullYear());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ShiftRegistrationUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportYear, setExportYear] = useState<number>(today.getFullYear());
  const [exportMonth, setExportMonth] = useState<number>(today.getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftRegistrationsAPI.pendingApprovals({
        status: activeTab,
        year: filterYear,
        month: filterMonth,
      });
      setItems(data);
    } catch (err) {
      console.error('Lỗi tải danh sách đăng ký ca:', err);
      setError('Không thể tải danh sách đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterMonth, filterYear]);

  const filteredItems = useMemo(() => {
    const q = filterName.trim().toLowerCase();
    return items.filter((r) => {
      if (q) {
        const name = r.employee_detail?.full_name?.toLowerCase() || '';
        const code = r.employee_detail?.employee_id?.toLowerCase() || '';
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      if (filterDepartment && (r.employee_detail?.department_name || DEPT_FALLBACK) !== filterDepartment) {
        return false;
      }
      return true;
    });
  }, [items, filterName, filterDepartment]);

  const deptOptions = useMemo(() => {
    const names = Array.from(
      new Set(items.map((r) => r.employee_detail?.department_name || DEPT_FALLBACK))
    ).sort();
    return [{ value: '', label: 'Tất cả phòng ban' }, ...names.map((n) => ({ value: n, label: n }))];
  }, [items]);

  const groupedByDept = useMemo(() => {
    const groups: Record<string, ShiftRegistrationType[]> = {};
    filteredItems.forEach((r) => {
      const dept = r.employee_detail?.department_name || DEPT_FALLBACK;
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(r);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredItems]);

  const toggleDept = (dept: string) =>
    setExpandedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );

  // Bước hiện tại của đơn (chỉ có ý nghĩa khi PENDING)
  const stageLabel = (reg: ShiftRegistrationType): { text: string; className: string } =>
    reg.direct_manager_approved
      ? { text: 'Chờ HCNS duyệt', className: 'bg-sky-100 text-sky-700' }
      : { text: 'Chờ QLTT duyệt', className: 'bg-amber-100 text-amber-700' };

  // Người xem hiện tại có còn việc phải làm trên đơn này không (PENDING tab)
  const canApproveNow = (reg: ShiftRegistrationType): boolean => {
    if (isAdmin) return true;
    if (isPrivileged) return !!reg.direct_manager_approved; // HR chỉ duyệt được sau khi QLTT xong
    return !reg.direct_manager_approved; // Quản lý thường: chỉ còn việc khi họ chưa duyệt bước 1
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await shiftRegistrationsAPI.exportMonthly({
        year: exportYear,
        month: exportMonth,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ca_lam_${String(exportMonth).padStart(2, '0')}_${exportYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (err: any) {
      console.error('Export ca làm failed:', err);
      let msg = 'Xuất file thất bại.';
      const data = err?.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text);
          msg = parsed?.detail || msg;
        } catch {
          /* ignore */
        }
      } else if (typeof data === 'string') {
        msg = data;
      } else if (data?.detail) {
        msg = data.detail;
      }
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const res = await shiftRegistrationsAPI.upload(f);
      setUploadResult(res);
      await fetchItems();
    } catch (err: any) {
      console.error('Upload ca làm failed:', err);
      const data = err?.response?.data;
      let msg = 'Upload thất bại.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data && typeof data === 'object') {
        const parts: string[] = [];
        for (const [k, v] of Object.entries(data)) {
          const text = Array.isArray(v) ? v.join('; ') : String(v);
          parts.push(k === 'non_field_errors' ? text : `${k}: ${text}`);
        }
        if (parts.length) msg = parts.join(' | ');
      } else if (err?.message) {
        msg = err.message;
      }
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApprove = async (reg: ShiftRegistrationType) => {
    setProcessingId(reg.id);
    try {
      await shiftRegistrationsAPI.approve(reg.id);
      await fetchItems();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Duyệt thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    setProcessingId(rejectTarget.id);
    try {
      await shiftRegistrationsAPI.reject(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      await fetchItems();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async (dept: string, regs: ShiftRegistrationType[]) => {
    const ids = regs.filter(canApproveNow).map((r) => r.id);
    if (ids.length === 0) return;
    setBulkProcessingDept(dept);
    try {
      const res = await shiftRegistrationsAPI.bulkApprove(ids);
      if (res.error_count > 0) {
        alert(
          `Đã duyệt ${res.success_count}/${ids.length} đơn. ${res.error_count} đơn lỗi:\n` +
            res.errors.map((e) => `#${e.id}: ${e.error}`).join('\n')
        );
      }
      await fetchItems();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Duyệt nhanh thất bại. Vui lòng thử lại.');
    } finally {
      setBulkProcessingDept(null);
    }
  };

  const statusBadgeForTab = (reg: ShiftRegistrationType) => {
    if (reg.status === 'APPROVED') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đã duyệt</span>;
    }
    if (reg.status === 'REJECTED') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Bị từ chối</span>;
    }
    const stage = stageLabel(reg);
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.className}`}>{stage.text}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Duyệt ca làm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Duyệt đăng ký ca làm theo tuần — 2 cấp: Quản lý trực tiếp (QLTT) rồi đến HCNS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            title="Upload danh sách ca làm (Mã NV, Ngày, Mã ca)"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {uploading ? 'Đang tải lên…' : 'Upload ca làm'}
          </button>
          <button
            onClick={() => {
              setExportError(null);
              setExportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            title="Xuất danh sách ca làm theo tháng"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Xuất ca tháng
          </button>
        </div>
      </div>

      {(uploadResult || uploadError) && (
        <div className={`rounded-2xl border p-4 shadow-sm ${uploadError ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              {uploadError ? (
                <p className="font-semibold text-red-700">Lỗi: {uploadError}</p>
              ) : uploadResult && (
                <>
                  <p className="font-semibold text-emerald-700">
                    Đã xử lý {uploadResult.total_rows} dòng — Tạo mới {uploadResult.created_registrations} đơn, cập nhật {uploadResult.updated_registrations} đơn, {uploadResult.imported_days} ngày được ghi.
                  </p>
                  {uploadResult.failed.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-red-700">{uploadResult.failed.length} dòng lỗi:</p>
                      <ul className="mt-1 list-disc list-inside text-xs text-red-600 max-h-32 overflow-auto">
                        {uploadResult.failed.slice(0, 50).map((f, i) => (
                          <li key={i}>Dòng {f.row}{f.employee_code ? ` (${f.employee_code})` : ''}: {f.error}</li>
                        ))}
                        {uploadResult.failed.length > 50 && <li>… và {uploadResult.failed.length - 50} dòng khác</li>}
                      </ul>
                    </div>
                  )}
                  {uploadResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-amber-700">{uploadResult.warnings.length} cảnh báo:</p>
                      <ul className="mt-1 list-disc list-inside text-xs text-amber-700 max-h-24 overflow-auto">
                        {uploadResult.warnings.slice(0, 20).map((w, i) => (
                          <li key={i}>Dòng {w.row}: {w.warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => { setUploadResult(null); setUploadError(null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 px-3 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
              {t.key === activeTab && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs bg-primary-100 text-primary-700">
                  {filteredItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-5 py-4 border-t border-gray-100">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Tìm tên hoặc mã nhân viên..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <SelectBox
            label=""
            value={filterDepartment}
            options={deptOptions}
            onChange={setFilterDepartment}
            placeholder="Tất cả phòng ban"
          />
          <SelectBox
            label=""
            value={filterMonth.toString()}
            options={Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `Tháng ${i + 1}` }))}
            onChange={(v) => setFilterMonth(parseInt(v, 10))}
          />
          <SelectBox
            label=""
            value={filterYear.toString()}
            options={Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((y) => ({
              value: y.toString(),
              label: y.toString(),
            }))}
            onChange={(v) => setFilterYear(parseInt(v, 10))}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchItems} className="btn-primary text-xs px-4 py-2 mt-4">
            Thử lại
          </button>
        </div>
      ) : groupedByDept.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            {activeTab === 'PENDING' ? 'Không có đơn chờ duyệt' : activeTab === 'APPROVED' ? 'Chưa có đơn nào được duyệt' : 'Chưa có đơn nào bị từ chối'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Thử đổi bộ lọc tháng/năm hoặc phòng ban.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDept.map(([dept, regs]) => {
            const isExpanded = expandedDepartments.includes(dept);
            const actionableCount = activeTab === 'PENDING' ? regs.filter(canApproveNow).length : 0;
            return (
              <div key={dept} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gray-50/60 border-b border-gray-100">
                  <button
                    onClick={() => toggleDept(dept)}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-gray-800 truncate">{dept}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{regs.length} đơn</span>
                  </button>
                  {hasBulkApprovePermission && activeTab === 'PENDING' && actionableCount > 0 && (
                    <button
                      onClick={() => handleBulkApprove(dept, regs)}
                      disabled={bulkProcessingDept === dept}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-semibold rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                      title={`Duyệt nhanh ${actionableCount} đơn của phòng ${dept}`}
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      {bulkProcessingDept === dept ? 'Đang xử lý...' : `Duyệt nhanh ${actionableCount} đơn`}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {regs.map((reg) => (
                      <div key={reg.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">
                                {reg.employee_detail?.full_name || `NV #${reg.employee}`}
                              </p>
                              {statusBadgeForTab(reg)}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {reg.employee_detail?.employee_id ? `${reg.employee_detail.employee_id} · ` : ''}
                              {reg.employee_detail?.position_name ? `${reg.employee_detail.position_name} · ` : ''}
                              Tuần {fmtRange(reg.week_start_date, reg.week_end_date)}
                            </p>
                            {reg.status === 'REJECTED' && reg.reject_reason && (
                              <p className="text-xs text-red-600 mt-1">Lý do từ chối: {reg.reject_reason}</p>
                            )}
                          </div>
                          {activeTab === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setRejectTarget(reg);
                                  setRejectReason('');
                                }}
                                disabled={processingId === reg.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                              >
                                <XMarkIcon className="h-4 w-4" />
                                Từ chối
                              </button>
                              {canApproveNow(reg) ? (
                                <button
                                  onClick={() => handleApprove(reg)}
                                  disabled={processingId === reg.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  {processingId === reg.id ? 'Đang xử lý...' : isPrivileged && reg.direct_manager_approved ? 'Duyệt (HCNS)' : 'Duyệt'}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic px-2">
                                  {isPrivileged ? 'Chờ QLTT duyệt trước' : 'Bạn đã duyệt — chờ HCNS'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                          {reg.days
                            .slice()
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((day) => (
                              <div key={day.date} className="border border-gray-100 rounded-xl px-3 py-2 text-center">
                                <p className="text-xs text-gray-400">{fmtDate(day.date)}</p>
                                {day.shift_detail ? (
                                  <>
                                    <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                      {day.shift_detail.name}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {fmtTime(day.shift_detail.start_time)}–{fmtTime(day.shift_detail.end_time)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm font-medium text-gray-400 mt-1">Nghỉ</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !exporting && setExportOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Xuất ca làm theo tháng</h3>
            <p className="text-xs text-gray-400 mb-4">
              Chọn tháng cần xuất. File Excel sẽ liệt kê toàn bộ ca đã duyệt của mỗi nhân viên trong tháng.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                  className="input-field w-full"
                  disabled={exporting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="input-field w-full"
                  disabled={exporting}
                >
                  {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {exportError && (
              <p className="text-xs text-red-600 mt-3">{exportError}</p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setExportOpen(false)}
                disabled={exporting}
                className="btn-secondary text-xs px-4 py-2"
              >
                Huỷ
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {exporting ? 'Đang tạo file…' : 'Tải xuống'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setRejectTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Từ chối đăng ký ca</h3>
            <p className="text-xs text-gray-400 mb-4">
              {rejectTarget.employee_detail?.full_name} · Tuần{' '}
              {fmtRange(rejectTarget.week_start_date, rejectTarget.week_end_date)}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="input-field w-full"
              placeholder="Nhập lý do từ chối..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Huỷ
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === rejectTarget.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === rejectTarget.id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftApproval;
