import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ScanSummary,
  isBusy,
  personalDocumentScanService,
  scanError,
} from '../services/personalDocumentScan.service';

/**
 * Quét hồ sơ gộp bằng AI (chỉ Admin/HCNS).
 * HCNS chọn các PDF gộp đặt tên theo mã NV (SK00346.pdf) → mỗi file tải lên một request,
 * AI đọc nền khoảng 30 giây / hồ sơ → mở từng lượt để duyệt và tách vào hồ sơ giấy tờ.
 */

type UploadLine = { name: string; state: 'waiting' | 'uploading' | 'done' | 'error'; message?: string; scanId?: number };

const FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'READY', label: 'Chờ duyệt' },
  { key: 'PROCESSING', label: 'Đang đọc' },
  { key: 'FAILED', label: 'Lỗi' },
  { key: 'APPLIED', label: 'Đã lưu' },
];

export const scanStatusBadge = (s: ScanSummary) => {
  if (s.is_stuck) {
    return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">Bị kẹt</span>;
  }
  switch (s.status) {
    case 'PENDING':
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
          <ArrowPathIcon className="h-3 w-3 animate-spin" /> AI đang đọc
        </span>
      );
    case 'READY':
      return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">Chờ duyệt</span>;
    case 'FAILED':
      return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">Lỗi</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Đã lưu vào hồ sơ</span>;
  }
};

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

const PersonalDocumentScans: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ScanSummary[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<UploadLine[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await personalDocumentScanService.list({ status: filter, search: search.trim() });
      setRows(data.results);
      setConfigured(data.ai_configured);
      setError(null);
    } catch (err) {
      setError(scanError(err, 'Không tải được danh sách'));
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Còn lượt AI đang đọc thì cập nhật lại mỗi 4 giây.
  const anyBusy = rows.some(isBusy);
  useEffect(() => {
    if (!anyBusy) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [anyBusy, load]);

  const choose = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length) return;
    setUploading(true);
    setLines(files.map((f) => ({ name: f.name, state: 'waiting' })));
    for (let i = 0; i < files.length; i += 1) {
      setLines((prev) => prev.map((l, j) => (j === i ? { ...l, state: 'uploading' } : l)));
      try {
        const scan = await personalDocumentScanService.upload(files[i]);
        setLines((prev) => prev.map((l, j) => (j === i
          ? { ...l, state: 'done', scanId: scan.id, message: `${scan.employee.employee_id} · ${scan.employee.full_name} · ${scan.page_count} trang` }
          : l)));
      } catch (err: any) {
        const data = err?.response?.data;
        setLines((prev) => prev.map((l, j) => (j === i
          ? { ...l, state: 'error', message: scanError(err, 'Tải lên thất bại'), scanId: data?.existing_id }
          : l)));
      }
      load();
    }
    setUploading(false);
  };

  const retry = async (s: ScanSummary) => {
    try {
      await personalDocumentScanService.retry(s.id);
      load();
    } catch (err) {
      alert(scanError(err));
    }
  };

  const remove = async (s: ScanSummary) => {
    const note = s.status === 'APPLIED' ? ' Giấy tờ đã lưu vào hồ sơ vẫn giữ nguyên.' : '';
    if (!window.confirm(`Xoá lượt quét "${s.file_name}"?${note}`)) return;
    try {
      await personalDocumentScanService.remove(s.id);
      load();
    } catch (err) {
      alert(scanError(err));
    }
  };

  const readyCount = rows.filter((r) => r.status === 'READY').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/personal-documents" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" title="Về Hồ sơ giấy tờ">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <DocumentMagnifyingGlassIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Quét hồ sơ gộp bằng AI</h1>
          <p className="text-sm text-gray-500">AI chia file scan gộp theo từng loại giấy tờ. HCNS duyệt rồi lưu vào hồ sơ.</p>
        </div>
      </div>

      {!configured && (
        <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>Server chưa cấu hình key AI (ANTHROPIC_API_KEY) nên chưa quét được. Báo quản trị hệ thống.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={inputRef} type="file" multiple accept=".pdf,application/pdf" className="hidden"
            onChange={(e) => choose(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !configured}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Chọn file PDF gộp
          </button>
          <p className="text-xs text-gray-500 flex-1 min-w-[220px]">
            Mỗi nhân viên một file, tên bắt đầu bằng mã nhân viên, ví dụ <code className="px-1 bg-gray-100 rounded">SK00346.pdf</code>.
            Ảnh giấy tờ được gửi cho AI (Claude) để đọc. Mỗi hồ sơ mất khoảng 30 giây.
          </p>
        </div>
        {lines.length > 0 && (
          <ul className="divide-y divide-gray-100 text-sm border border-gray-100 rounded-xl">
            {lines.map((l, i) => (
              <li key={`${l.name}-${i}`} className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-gray-800 break-all">{l.name}</span>
                <span className={`text-xs ${l.state === 'error' ? 'text-red-600' : l.state === 'done' ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {l.state === 'waiting' && 'Đang chờ'}
                  {l.state === 'uploading' && 'Đang tải lên...'}
                  {l.state === 'done' && `Đã nhận · ${l.message}`}
                  {l.state === 'error' && l.message}
                </span>
                {l.scanId && (
                  <button onClick={() => navigate(`/dashboard/personal-documents/scans/${l.scanId}`)}
                    className="text-xs font-semibold text-primary-600 hover:underline">
                    Mở
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.label}{f.key === 'READY' && !filter && readyCount ? ` (${readyCount})` : ''}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã, tên nhân viên, tên file"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Đang tải...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">Chưa có lượt quét nào.</p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Nhân viên</th>
                <th className="text-left px-4 py-3">File</th>
                <th className="text-right px-4 py-3">Trang</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Tải lên</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{s.employee.full_name}</p>
                    <p className="text-xs text-gray-500">{s.employee.employee_id}{s.employee.department_name ? ` · ${s.employee.department_name}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 break-all text-gray-700">{s.file_name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{s.page_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {scanStatusBadge(s)}
                      {s.status === 'READY' && s.review_count > 0 && (
                        <span className="text-xs text-amber-700">{s.review_count} trang cần xem lại</span>
                      )}
                      {(s.status === 'FAILED' || s.is_stuck) && s.error && (
                        <span className="text-xs text-red-600 max-w-xs">{s.error}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {fmtTime(s.created_at)}
                    {s.created_by_name && <span className="block">{s.created_by_name}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(s.status === 'FAILED' || s.is_stuck) && (
                        <button onClick={() => retry(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 hover:bg-sky-50">
                          Chạy lại
                        </button>
                      )}
                      {!isBusy(s) && (
                        <button onClick={() => navigate(`/dashboard/personal-documents/scans/${s.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100">
                          {s.status === 'READY' ? 'Duyệt' : 'Xem'}
                        </button>
                      )}
                      {!isBusy(s) && (
                        <button onClick={() => remove(s)} title="Xoá lượt quét" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PersonalDocumentScans;
