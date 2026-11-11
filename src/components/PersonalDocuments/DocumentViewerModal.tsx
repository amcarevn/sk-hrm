import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PersonalDocument, notePages, personalDocumentService } from '../../services/personalDocument.service';

/**
 * Khung xem giấy tờ của 1 nhân viên (trang Hồ sơ giấy tờ, HCNS SK 2026-11-11).
 * PDF mở thẳng tới trang của loại giấy tờ (giấy tờ quét AI trỏ chung file gộp, ghi chú "Trang 7, 9-14 trong …").
 * File lấy qua API thành blob: link media / presigned có thể bị chặn nhúng iframe. Cùng 1 file gộp chỉ tải 1 lần,
 * chuyển giữa các loại chỉ đổi trang.
 */

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');
const fileKey = (d: PersonalDocument) => `${d.file_name}|${d.file_size}`;

const DocumentViewerModal: React.FC<{
  employeeName: string;
  documents: PersonalDocument[];
  initialId: number;
  labelOf: Record<string, string>;
  onClose: () => void;
}> = ({ employeeName, documents, initialId, labelOf, onClose }) => {
  const [currentId, setCurrentId] = useState(initialId);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const loading = useRef<Set<string>>(new Set());
  const created = useRef<string[]>([]);

  const current = documents.find((d) => d.id === currentId) || documents[0];
  const key = current ? fileKey(current) : '';
  const url = urls[key];
  const ext = current ? extOf(current.file_name) : '';
  const { first, ranges } = notePages(current?.note);

  useEffect(() => {
    if (!current || urls[key] || loading.current.has(key)) return;
    loading.current.add(key);
    setError(null);
    personalDocumentService.fileBlob(current.id)
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        created.current.push(objectUrl);
        setUrls((prev) => ({ ...prev, [key]: objectUrl }));
      })
      .catch(async (err) => {
        let detail = err?.message || 'Không tải được file';
        const data = err?.response?.data;
        if (data instanceof Blob) {
          try { detail = JSON.parse(await data.text()).detail || detail; } catch { /* giữ thông báo gốc */ }
        }
        setError(detail);
      })
      .finally(() => loading.current.delete(key));
  }, [current, key, urls]);

  useEffect(() => () => created.current.forEach((u) => URL.revokeObjectURL(u)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pdfSrc = url ? `${url}#page=${first || 1}&navpanes=0` : '';

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-gray-900">
              {current ? labelOf[current.doc_type] || current.doc_type_display : ''}
              <span className="font-normal text-gray-500"> · {employeeName}</span>
            </h3>
            {current && (
              <p className="truncate text-xs text-gray-500">
                {ranges ? `Trang ${ranges} trong ${current.file_name}` : current.file_name}
              </p>
            )}
          </div>
          {url && (
            <a href={ext === 'pdf' ? pdfSrc : url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary-700 hover:bg-primary-50">
              <ArrowTopRightOnSquareIcon className="h-4 w-4" /> <span className="hidden sm:inline">Mở tab mới</span>
            </a>
          )}
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {documents.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b bg-gray-50 px-4 py-2">
            {documents.map((d) => {
              const p = notePages(d.note);
              const active = d.id === current?.id;
              return (
                <button key={d.id} onClick={() => { setError(null); setCurrentId(d.id); }}
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${active
                    ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}>
                  {labelOf[d.doc_type] || d.doc_type_display}
                  {p.ranges && <span className={active ? 'text-primary-100' : 'text-gray-400'}> · tr. {p.ranges}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex-1 bg-gray-100">
          {error ? (
            <p className="p-6 text-center text-sm text-red-600">{error}</p>
          ) : !url ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              Đang tải file...
            </div>
          ) : ext === 'pdf' ? (
            <iframe key={`${key}-${first}`} src={pdfSrc} title="Xem giấy tờ" className="h-full w-full" />
          ) : IMAGE_EXT.includes(ext) ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={url} alt={current?.file_name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-gray-600">
              Trình duyệt không xem trước được định dạng .{ext}. Bấm "Mở tab mới" để tải file về.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DocumentViewerModal;
