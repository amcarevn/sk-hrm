import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { departmentsAPI } from '../utils/api';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import BulkUploadModal from '../components/PersonalDocuments/BulkUploadModal';
import {
  PersonalDocState,
  ReportPayload,
  ReportRow,
  STATE_LABELS,
  personalDocumentService,
} from '../services/personalDocument.service';

/**
 * Hồ sơ giấy tờ nhân viên — ai đủ, ai thiếu (chỉ Admin/HCNS).
 * Nhân sự hiện tại (chưa nghỉ việc). Thiếu loại bắt buộc nào thì ô đó đỏ.
 */

const SHORT_LABELS: Record<string, string> = {
  SYLL: 'SYLL',
  KHAI_SINH: 'Khai sinh',
  HO_KHAU: 'Hộ khẩu/Cư trú',
  KHAM_SK: 'Khám SK',
  BANG_CAP: 'Bằng cấp',
  HOP_DONG: 'Hợp đồng',
  BAO_MAT: 'Bảo mật',
  KHAC: 'Khác',
};

const cellView = (state: PersonalDocState, required: boolean) => {
  switch (state) {
    case 'FILE':
      return <span className="text-emerald-600 font-bold" title={STATE_LABELS.FILE}>✓</span>;
    case 'SYSTEM_CONTRACT':
      return <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-bold" title={STATE_LABELS.SYSTEM_CONTRACT}>HRM</span>;
    case 'NOT_APPLICABLE':
      return <span className="text-gray-400 text-xs" title={STATE_LABELS.NOT_APPLICABLE}>K/AD</span>;
    default:
      return required
        ? <span className="text-red-600 font-bold" title={STATE_LABELS.MISSING}>✗</span>
        : <span className="text-gray-300">—</span>;
  }
};

const PersonalDocumentReport: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [department, setDepartment] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await personalDocumentService.report({ department: department === 'all' ? undefined : department }));
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không tải được báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentsAPI.list().then((res: any) => setDepartments(res.results || [])).catch(() => { });
  }, []);

  useEffect(() => { load(); }, [department]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.results || []).filter((r) =>
      (!missingOnly || r.missing_count > 0)
      && (!term || r.employee_id.toLowerCase().includes(term) || r.full_name.toLowerCase().includes(term)));
  }, [data, search, missingOnly]);

  const exportExcel = async () => {
    if (!data) return;
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hồ sơ giấy tờ');
    sheet.columns = [
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Họ và tên', key: 'name', width: 28 },
      { header: 'Phòng ban', key: 'dept', width: 24 },
      { header: 'Vị trí', key: 'pos', width: 22 },
      ...data.types.map((t) => ({ header: t.label, key: t.code, width: 16 })),
      { header: 'Số loại thiếu', key: 'missing_count', width: 14 },
      { header: 'Còn thiếu', key: 'missing', width: 50 },
    ];
    const header = sheet.getRow(1);
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    header.height = 32;
    const labelOf = Object.fromEntries(data.types.map((t) => [t.code, t.label]));
    rows.forEach((r: ReportRow) => {
      const row = sheet.addRow({
        code: r.employee_id,
        name: r.full_name,
        dept: r.department_name || '',
        pos: r.position_title || '',
        ...Object.fromEntries(data.types.map((t) => [
          t.code, r.status[t.code] === 'MISSING' && !t.required ? '' : STATE_LABELS[r.status[t.code]],
        ])),
        missing_count: r.missing_count,
        missing: r.missing.map((c) => labelOf[c]).join(', '),
      });
      data.types.forEach((t) => {
        if (t.required && r.status[t.code] === 'MISSING') {
          const cell = row.getCell(t.code);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { color: { argb: 'FFB91C1C' }, bold: true };
        }
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ho_so_giay_to_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <FolderOpenIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Hồ sơ giấy tờ nhân viên</h1>
          <p className="text-sm text-gray-500">Nhân sự hiện tại. Ô đỏ là giấy tờ bắt buộc còn thiếu.</p>
        </div>
        <button onClick={exportExcel} disabled={!data}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
        </button>
        <button onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">
          <ArrowUpTrayIcon className="h-4 w-4" /> Tải lên hàng loạt
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase">Nhân sự hiện tại</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" /> Đủ hồ sơ
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.complete}</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" /> Thiếu hồ sơ
            </p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{summary.incomplete}</p>
          </div>
        </div>
      )}

      {summary && data && (
        <div className="flex flex-wrap gap-2">
          {data.types.filter((t) => t.required).map((t) => (
            <span key={t.code} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${summary.missing_by_type[t.code] ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {t.label}: thiếu {summary.missing_by_type[t.code] || 0}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã hoặc tên nhân viên"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <SelectBox<string>
            label="Phòng ban"
            value={department}
            options={[{ value: 'all', label: 'Tất cả phòng ban' }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
            onChange={(v) => setDepartment(v)}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
          <input type="checkbox" className="rounded border-gray-300" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
          Chỉ hiện người còn thiếu
        </label>
        <span className="text-sm text-gray-500 pb-2 sm:ml-auto">{rows.length} nhân viên</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-3 py-3 whitespace-nowrap">Mã NV</th>
              <th className="text-left px-3 py-3 whitespace-nowrap">Họ và tên</th>
              <th className="text-left px-3 py-3 whitespace-nowrap">Phòng ban</th>
              {data?.types.map((t) => (
                <th key={t.code} className="text-center px-2 py-3 whitespace-nowrap">{SHORT_LABELS[t.code] || t.label}</th>
              ))}
              <th className="text-center px-3 py-3 whitespace-nowrap">Thiếu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={20} className="px-3 py-8 text-center text-gray-500">Đang tải...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={20} className="px-3 py-8 text-center text-gray-500">
                {missingOnly ? 'Không có ai thiếu hồ sơ.' : 'Không có nhân viên.'}
              </td></tr>
            )}
            {!loading && data && rows.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/dashboard/employees/${r.id}`)}
                className="hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-700 whitespace-nowrap">{r.employee_id}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{r.full_name}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.department_name || '—'}</td>
                {data.types.map((t) => (
                  <td key={t.code} className={`px-2 py-2.5 text-center ${t.required && r.status[t.code] === 'MISSING' ? 'bg-red-50' : ''}`}>
                    {cellView(r.status[t.code], t.required)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center">
                  {r.missing_count > 0
                    ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{r.missing_count}</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Đủ</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUpload && (
        <BulkUploadModal onClose={(changed) => { setShowUpload(false); if (changed) load(); }} />
      )}
    </div>
  );
};

export default PersonalDocumentReport;
