import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ScanPreviewRow,
  personalDocumentScanService,
  scanError,
} from '../../services/personalDocumentScan.service';

/**
 * Tải lên hàng loạt hồ sơ nhân viên (HCNS SK 2026-11-10): mỗi nhân viên MỘT file PDF scan
 * gộp, tên bắt đầu bằng mã nhân viên (SK00085.pdf, "SK00085 - Trần Thị Linh.pdf").
 * B1 chọn file → backend đọc mã NV trong tên, báo file nào không khớp.
 * B2 gửi từng file (2 file cùng lúc); mỗi file thành một lượt quét AI chạy nền, AI đọc xong
 *    tự lưu các loại giấy tờ vào hồ sơ. Theo dõi / sửa ở trang Kết quả quét AI.
 */

const PARALLEL_UPLOADS = 2;

type RowState = 'ready' | 'uploading' | 'sent' | 'skipped' | 'error';
type Row = ScanPreviewRow & { file: File; state: RowState; message?: string };

const STATE_TEXT: Record<RowState, string> = {
  ready: 'Sẵn sàng',
  uploading: 'Đang tải lên...',
  sent: 'Đã gửi AI đọc',
  skipped: 'Đã quét trước đó, bỏ qua',
  error: 'Lỗi',
};

const BulkScanUploadModal: React.FC<{ onClose: (changed: boolean) => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const choose = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setUploaded(false);
    try {
      const data = await personalDocumentScanService.preview(files.map((f) => f.name));
      setConfigured(data.ai_configured);
      setRows(data.results.map((r, i) => ({
        ...r, file: files[i], state: r.error ? 'error' : 'ready', message: r.error || undefined,
      })));
    } catch (err) {
      setError(scanError(err, 'Không đọc được danh sách file'));
    } finally {
      setBusy(false);
    }
  };

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const readyIndexes = rows.map((r, i) => (r.state === 'ready' ? i : -1)).filter((i) => i >= 0);

  const upload = async () => {
    setBusy(true);
    setError(null);
    const queue = [...readyIndexes];
    const worker = async () => {
      while (queue.length) {
        const i = queue.shift() as number;
        update(i, { state: 'uploading' });
        try {
          const scan = await personalDocumentScanService.upload(rows[i].file);
          update(i, { state: 'sent', message: `${scan.page_count} trang` });
        } catch (err: any) {
          const duplicate = err?.response?.data?.code === 'duplicate';
          update(i, duplicate
            ? { state: 'skipped', message: undefined }
            : { state: 'error', message: scanError(err, 'Tải lên thất bại') });
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));
    setBusy(false);
    setUploaded(true);
  };

  const count = (state: RowState) => rows.filter((r) => r.state === state).length;
  const sent = count('sent');

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Tải lên hàng loạt hồ sơ nhân viên</h3>
            <p className="text-xs text-gray-500 mt-1">
              Mỗi nhân viên một file PDF scan gộp cả bộ hồ sơ, tên file bắt đầu bằng mã nhân viên, ví dụ{' '}
              <code className="px-1 bg-gray-100 rounded">SK00085.pdf</code>. AI đọc từng file (khoảng 30–40 giây / hồ sơ),
              nhận ra có những loại giấy tờ nào rồi tự lưu vào hồ sơ.
            </p>
          </div>
          <button onClick={() => onClose(uploaded)} disabled={busy} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {!configured && (
          <div className="mx-5 mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>Server chưa cấu hình key AI (ANTHROPIC_API_KEY) nên chưa quét được. Báo quản trị hệ thống.</span>
          </div>
        )}

        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b">
          <input ref={inputRef} type="file" multiple accept=".pdf,application/pdf" className="hidden"
            onChange={(e) => choose(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Chọn file
          </button>
          {rows.length > 0 && (
            <span className="text-sm text-gray-600">
              {rows.length} file
              {!uploaded && <> · <span className="text-emerald-700 font-semibold">{readyIndexes.length} sẵn sàng</span></>}
              {sent > 0 && <> · <span className="text-emerald-700 font-semibold">{sent} đã gửi AI</span></>}
              {count('skipped') > 0 && <> · {count('skipped')} đã quét trước đó</>}
              {count('error') > 0 && <> · <span className="text-red-600 font-semibold">{count('error')} lỗi</span></>}
            </span>
          )}
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        <div className="overflow-auto flex-1 px-5 py-3">
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Chọn các file hồ sơ scan gộp, mỗi nhân viên một file.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-white">
                <tr>
                  <th className="text-left py-2 pr-3">File</th>
                  <th className="text-left py-2 pr-3">Nhân viên</th>
                  <th className="text-left py-2">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={`${r.file_name}-${i}`} className={r.state === 'error' ? 'bg-red-50/60' : ''}>
                    <td className="py-2 pr-3 break-all">{r.file_name}</td>
                    <td className="py-2 pr-3">{r.employee ? `${r.employee.employee_id} · ${r.employee.full_name}` : '—'}</td>
                    <td className={`py-2 ${r.state === 'error' ? 'text-red-600' : r.state === 'sent' ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {r.state === 'error' ? r.message : STATE_TEXT[r.state]}
                      {r.state === 'sent' && r.message && <span className="text-gray-400"> · {r.message}</span>}
                      {r.state === 'ready' && r.already_scanned && (
                        <span className="block text-xs text-amber-700">Nhân viên này đã có lượt quét cùng tên file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {uploaded && sent > 0 && (
          <p className="px-5 pb-1 text-sm text-gray-700">
            AI đang đọc {sent} hồ sơ ở chế độ chạy nền, đọc xong tự lưu vào hồ sơ. Có thể đóng hộp này; tải lại trang
            Hồ sơ giấy tờ sau vài phút để thấy kết quả.
          </p>
        )}

        <div className="px-5 py-4 border-t flex flex-wrap items-center justify-end gap-3">
          {uploaded && sent > 0 && (
            <button onClick={() => navigate('/dashboard/personal-documents/scans')}
              className="mr-auto text-sm font-semibold text-primary-700 hover:underline">
              Xem tiến độ ở Kết quả quét AI
            </button>
          )}
          <button onClick={() => onClose(uploaded)} disabled={busy}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">
            Đóng
          </button>
          <button
            onClick={upload}
            disabled={busy || readyIndexes.length === 0 || !configured}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy && rows.some((r) => r.state === 'uploading') ? 'Đang tải lên...' : `Tải lên ${readyIndexes.length} hồ sơ`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BulkScanUploadModal;
