import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BulkResult, personalDocumentService } from '../../services/personalDocument.service';

/**
 * Tải lên hàng loạt file giấy tờ đặt tên `<mã NV>_<loại>.pdf`.
 * B1 chọn file → hệ thống đọc tên (mã NV, loại) và báo lỗi từng file.
 * B2 tải các file hợp lệ theo lô nhỏ để không vượt giới hạn dung lượng 1 request.
 */

const BATCH_MAX_FILES = 10;
const BATCH_MAX_BYTES = 40 * 1024 * 1024;

const STATUS_TEXT: Record<string, string> = {
  uploaded: 'Đã tải lên',
  skipped: 'Đã có, bỏ qua',
  error: 'Lỗi',
};

function batches(files: File[]): File[][] {
  const out: File[][] = [];
  let current: File[] = [];
  let size = 0;
  for (const f of files) {
    if (current.length && (current.length >= BATCH_MAX_FILES || size + f.size > BATCH_MAX_BYTES)) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(f);
    size += f.size;
  }
  if (current.length) out.push(current);
  return out;
}

const BulkUploadModal: React.FC<{ onClose: (changed: boolean) => void }> = ({ onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<BulkResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const choose = async (list: FileList | null) => {
    const chosen = list ? Array.from(list) : [];
    if (inputRef.current) inputRef.current.value = '';
    if (!chosen.length) return;
    setBusy(true);
    setError(null);
    setUploaded(false);
    try {
      setRows(await personalDocumentService.bulkPreview(chosen.map((f) => f.name)));
      setFiles(chosen);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không đọc được danh sách file');
    } finally {
      setBusy(false);
    }
  };

  const validFiles = files.filter((_, i) => !rows[i]?.error);

  const upload = async () => {
    const groups = batches(validFiles);
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: validFiles.length });
    const resultByName = new Map<string, BulkResult>();
    try {
      let done = 0;
      for (const group of groups) {
        const res = await personalDocumentService.bulkUpload(group);
        res.forEach((r) => resultByName.set(r.file_name, r));
        done += group.length;
        setProgress({ done, total: validFiles.length });
      }
    } catch (err: any) {
      setError(`Dừng giữa chừng: ${err?.response?.data?.detail || err?.message || 'lỗi kết nối'}. Chọn lại thư mục để tải tiếp (file đã có sẽ được bỏ qua).`);
    } finally {
      setRows((prev) => prev.map((r) => resultByName.get(r.file_name) || r));
      setBusy(false);
      setUploaded(true);
    }
  };

  const errorCount = rows.filter((r) => r.error).length;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Tải lên hàng loạt giấy tờ</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tên file dạng <code className="px-1 bg-gray-100 rounded">mãNV_loại.pdf</code>, ví dụ SK00346_HO_KHAU.pdf, SK00346_KHAM_SK.pdf.
              Loại: SYLL, KHAI_SINH, HO_KHAU, KHAM_SK, BANG_CAP, HOP_DONG, BAO_MAT, KHAC. Hồ sơ scan gộp cả người
              (SK00346.pdf) thì dùng nút "Quét hồ sơ gộp (AI)" để AI nhận diện các loại giấy tờ.
            </p>
          </div>
          <button onClick={() => onClose(uploaded)} disabled={busy} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b">
          <input ref={inputRef} type="file" multiple className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e) => choose(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Chọn file
          </button>
          {rows.length > 0 && (
            <span className="text-sm text-gray-600">
              {rows.length} file · <span className="text-emerald-700 font-semibold">{rows.length - errorCount} hợp lệ</span>
              {errorCount > 0 && <> · <span className="text-red-600 font-semibold">{errorCount} lỗi</span></>}
            </span>
          )}
          {progress && busy && (
            <span className="text-sm text-primary-700">Đang tải {progress.done}/{progress.total}...</span>
          )}
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        <div className="overflow-auto flex-1 px-5 py-3">
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Chọn các file giấy tờ đã đặt tên theo mã nhân viên.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-white">
                <tr>
                  <th className="text-left py-2 pr-3">File</th>
                  <th className="text-left py-2 pr-3">Nhân viên</th>
                  <th className="text-left py-2 pr-3">Loại giấy tờ</th>
                  <th className="text-left py-2">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={`${r.file_name}-${i}`} className={r.error ? 'bg-red-50/60' : ''}>
                    <td className="py-2 pr-3 break-all">{r.file_name}</td>
                    <td className="py-2 pr-3">{r.employee ? `${r.employee.employee_id} · ${r.employee.full_name}` : '—'}</td>
                    <td className="py-2 pr-3">{r.doc_type_display || '—'}</td>
                    <td className={`py-2 ${r.error ? 'text-red-600' : r.status === 'uploaded' ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {r.error || (r.status ? STATUS_TEXT[r.status] : 'Sẵn sàng')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
          <button onClick={() => onClose(uploaded)} disabled={busy}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">
            Đóng
          </button>
          <button
            onClick={upload}
            disabled={busy || validFiles.length === 0 || uploaded}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            Tải lên {validFiles.length} file hợp lệ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BulkUploadModal;
