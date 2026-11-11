import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, CheckCircleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PdfPosition, errorMessage, jobDescriptionService } from '../../services/jobDescription.service';

/**
 * "Thêm từ PDF" (HCNS SK 2026-11-11): AI đọc file mô tả công việc, tách mỗi vị trí thành một BẢN NHÁP
 * theo 6 khối của trang Mô tả công việc. Bản nháp chưa ai thấy cho tới khi HCNS rà lại và công bố.
 * B1 AI liệt kê các vị trí trong file → HCNS chọn / sửa tên. B2 từng vị trí: AI lấy nội dung → tạo nháp
 * (vị trí HRM trùng tên được backend tự gắn). Backend: POST /job-descriptions/from-pdf/.
 */

type RowState = 'idle' | 'reading' | 'created' | 'error';
type Row = PdfPosition & {
  name: string;
  checked: boolean;
  state: RowState;
  message?: string;
  createdId?: number;
  notes?: string;
};

const JobDescriptionPdfModal: React.FC<{ onClose: (created: boolean) => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [phase, setPhase] = useState<'pick' | 'reading' | 'choose' | 'creating' | 'done'>('pick');
  const [error, setError] = useState<string | null>(null);

  const busy = phase === 'reading' || phase === 'creating';
  const createdCount = rows.filter((r) => r.state === 'created').length;
  const selected = rows.filter((r) => r.checked && r.name.trim());

  const choose = async (list: FileList | null) => {
    const picked = list?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!picked) return;
    setFile(picked);
    setRows([]);
    setError(null);
    setPhase('reading');
    try {
      const data = await jobDescriptionService.pdfOutline(picked);
      setPageCount(data.page_count);
      setRows(data.positions.map((p) => ({ ...p, name: p.title, checked: !p.existing, state: 'idle' })));
      setPhase('choose');
    } catch (err) {
      setError(errorMessage(err, 'AI không đọc được file'));
      setPhase('pick');
    }
  };

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const create = async () => {
    if (!file) return;
    setPhase('creating');
    setError(null);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.checked || !row.name.trim() || row.state === 'created') continue;
      update(i, { state: 'reading', message: undefined });
      try {
        const data = await jobDescriptionService.pdfExtract(file, row.title, row.pages);
        const jd = await jobDescriptionService.create({ title: row.name.trim(), draft_content: data.content });
        update(i, { state: 'created', createdId: jd.id, notes: data.notes, checked: false });
      } catch (err) {
        update(i, { state: 'error', message: errorMessage(err, 'Không tạo được bản nháp') });
      }
    }
    setPhase('done');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Thêm mô tả công việc từ PDF</h3>
            <p className="mt-1 text-xs text-gray-500">
              AI đọc file, tách mỗi vị trí thành một <b>bản nháp</b> theo đúng các mục của trang này. Bản nháp chưa nhân
              viên nào thấy cho tới khi HCNS rà lại và bấm công bố. Vị trí trên HRM trùng tên được tự gắn.
            </p>
          </div>
          <button onClick={() => onClose(createdCount > 0)} disabled={busy} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => choose(e.target.files)} />
          <button onClick={() => inputRef.current?.click()} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <ArrowUpTrayIcon className="h-4 w-4" /> {file ? 'Chọn file khác' : 'Chọn file PDF'}
          </button>
          {file && (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-gray-600">
              <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{file.name}</span>
              {pageCount > 0 && <span className="text-gray-400">· {pageCount} trang</span>}
            </span>
          )}
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        <div className="flex-1 overflow-auto px-5 py-3">
          {phase === 'pick' && !error && (
            <p className="py-8 text-center text-sm text-gray-500">Chọn file PDF mô tả công việc (một hoặc nhiều vị trí).</p>
          )}
          {phase === 'reading' && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              AI đang đọc file để tìm các vị trí (khoảng 10–30 giây)...
            </div>
          )}
          {rows.length > 0 && (
            <>
              <p className="mb-2 text-sm text-gray-700">
                Tìm thấy <b>{rows.length}</b> vị trí. Chọn vị trí cần tạo, sửa tên nếu muốn. AI đọc mỗi vị trí khoảng 10–40 giây.
              </p>
              <ul className="space-y-2">
                {rows.map((r, i) => (
                  <li key={`${r.title}-${i}`}
                    className={`rounded-xl border px-3 py-2.5 ${r.state === 'created' ? 'border-emerald-200 bg-emerald-50/60'
                      : r.state === 'error' ? 'border-red-200 bg-red-50/60' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-2 rounded border-gray-300"
                        checked={r.checked} disabled={busy || r.state === 'created'}
                        onChange={(e) => update(i, { checked: e.target.checked })} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <input value={r.name} disabled={busy || r.state === 'created'}
                            onChange={(e) => update(i, { name: e.target.value })}
                            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-transparent disabled:border-transparent" />
                          {r.pages && <span className="text-xs text-gray-400">tr. {r.pages}</span>}
                        </div>
                        {r.summary && <p className="mt-1 text-xs text-gray-500">{r.summary}</p>}
                        {r.state !== 'created' && r.existing && (
                          <p className="mt-1 text-xs text-amber-700">
                            Đã có bản "{r.existing.title}". Muốn tạo thêm bản mới thì đổi tên khác.
                          </p>
                        )}
                        {r.state !== 'created' && r.matched_positions.length > 0 && (
                          <p className="mt-1 text-xs text-primary-700">Sẽ gắn vị trí: {r.matched_positions.join(', ')}</p>
                        )}
                        {r.state === 'reading' && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                            AI đang đọc nội dung...
                          </p>
                        )}
                        {r.state === 'error' && <p className="mt-1 text-xs text-red-600">{r.message}</p>}
                        {r.state === 'created' && (
                          <div className="mt-1 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircleIcon className="h-4 w-4" /> Đã tạo bản nháp
                            </span>
                            <button onClick={() => navigate(`/dashboard/job-descriptions/${r.createdId}`)}
                              className="ml-2 font-semibold text-primary-700 hover:underline">Mở để rà lại →</button>
                            {r.notes && <p className="mt-0.5 text-amber-700">Cần bổ sung: {r.notes}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4">
          {createdCount > 0 && !busy && (
            <span className="mr-auto text-sm text-emerald-700">Đã tạo {createdCount} bản nháp.</span>
          )}
          <button onClick={() => onClose(createdCount > 0)} disabled={busy}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">
            Đóng
          </button>
          <button onClick={create} disabled={busy || selected.length === 0}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {phase === 'creating' ? 'Đang tạo...' : `Tạo ${selected.length} bản nháp`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default JobDescriptionPdfModal;
