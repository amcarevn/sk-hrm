import { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CheckIcon,
  EyeIcon,
  MegaphoneIcon,
  PaperClipIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { hrmAPI } from '../../utils/api';
import { useNotificationDrawer } from '../../contexts/NotificationDrawerContext';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import PdfFrame from '../Common/PdfFrame';
import FilePreviewModal from '../Common/FilePreviewModal';
import './MandatoryAnnouncementPopup.css';

/**
 * Popup "bắt buộc đọc" thông báo khi vào HRM (HCNS SK 2026-11-27): có thông báo mới (đang hiệu lực, áp dụng cho
 * mình, chưa đọc) thì hiện ngay giữa màn hình — không đóng được bằng bấm ra ngoài / phím Esc, chỉ đóng bằng nút
 * "Đã đọc, đóng" (ghi nhận đã đọc qua acknowledge) rồi dùng HRM bình thường. Nhiều thông báo thì hiện lần lượt.
 * Danh sách & thứ tự do backend quyết định: GET company-announcements/must_read/.
 */

type Attachment = { id: number | string; file_name: string; file_url: string };

const PRIORITY_HEADER: Record<string, string> = {
  URGENT: 'from-red-600 to-red-700',
  HIGH: 'from-orange-500 to-orange-600',
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  LOW: 'bg-gray-100 text-gray-600',
};

const TYPE_BADGE: Record<string, string> = {
  ANNOUNCEMENT: 'bg-indigo-100 text-indigo-700',
  DECISION: 'bg-purple-100 text-purple-700',
  NOTICE: 'bg-teal-100 text-teal-700',
  CIRCULAR: 'bg-cyan-100 text-cyan-700',
  DIRECTIVE: 'bg-amber-100 text-amber-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

/** Mỗi trang của HRM tự dựng lại Layout → giữ hàng đợi ở mức module để chuyển trang (kể cả nút Back) popup
 *  vẫn còn, và chỉ hỏi lại backend tối đa 5 phút / lần. */
const RECHECK_MS = 5 * 60 * 1000;
let pendingQueue: any[] = [];
let lastCheckedAt = 0;

const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const isPdf = (name: string) => name.toLowerCase().split('?')[0].endsWith('.pdf');

/** File đính kèm mới (attachments) + file cũ một-file (attachment) của các thông báo đăng trước đây. */
const attachmentsOf = (a: any): Attachment[] => {
  const list: Attachment[] = (a.attachments || []).filter((x: any) => x.file_url);
  if (!list.length && typeof a.attachment === 'string' && a.attachment) {
    const name = decodeURIComponent(a.attachment.split('?')[0].split('/').pop() || 'Tệp đính kèm');
    list.push({ id: 'legacy', file_name: name, file_url: a.attachment });
  }
  return list;
};

export default function MandatoryAnnouncementPopup() {
  const { refreshUnread } = useNotificationDrawer();
  const [queue, setQueue] = useState<any[]>(pendingQueue);
  const [total, setTotal] = useState(pendingQueue.length);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const current = queue[0] ?? null;
  useLockBodyScroll(!!current);

  useEffect(() => {
    if (pendingQueue.length || Date.now() - lastCheckedAt < RECHECK_MS) return;
    lastCheckedAt = Date.now();
    hrmAPI.getMustReadAnnouncements()
      .then((items) => {
        if (!items?.length) return;
        pendingQueue = items;
        setQueue(items);
        setTotal(items.length);
      })
      .catch(() => {
        lastCheckedAt = 0; // lỗi mạng: lần chuyển trang sau thử lại
      });
  }, []);

  if (!current) return null;

  // Bấm là đóng / sang thông báo tiếp ngay, ghi nhận "đã đọc" chạy nền. Đã xác nhận từ trước (400) thì bỏ qua;
  // lỗi mạng thì backend chưa ghi → lần sau vào HRM popup hiện lại thông báo đó.
  const acknowledge = () => {
    const id = current.id;
    hrmAPI.acknowledgeAnnouncement(id)
      .catch(() => undefined)
      .finally(() => {
        if (!pendingQueue.length) refreshUnread(); // cập nhật số chưa đọc ở chuông thông báo
      });
    pendingQueue = pendingQueue.filter((a) => a.id !== id);
    setQueue(pendingQueue);
  };

  const files = attachmentsOf(current);
  const inlinePdf = files.find((f) => isPdf(f.file_name) || isPdf(f.file_url));
  const position = total - queue.length + 1;
  const hasNext = queue.length > 1;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-3 sm:p-6"
        role="dialog" aria-modal="true" aria-labelledby="mandatory-announcement-title">
        <div key={current.id} className="ann-pop w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className={`flex items-center gap-3 px-5 py-4 text-white bg-gradient-to-r ${PRIORITY_HEADER[current.priority] || 'from-primary-600 to-primary-700'}`}>
            <span className="ann-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
              <MegaphoneIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold leading-tight">Thông báo mới — vui lòng đọc</div>
              <div className="text-xs text-white/85">Đọc xong bấm "Đã đọc, đóng" để tiếp tục dùng HRM.</div>
            </div>
            {total > 1 && (
              <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tabular-nums">{position}/{total}</span>
            )}
          </div>

          {/* Nội dung */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[current.announcement_type] || 'bg-gray-100 text-gray-600'}`}>
                  {current.announcement_type_display || current.announcement_type}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[current.priority] || 'bg-gray-100 text-gray-600'}`}>
                  {current.priority_display || current.priority}
                </span>
              </div>
              <h2 id="mandatory-announcement-title" className="text-lg font-bold leading-snug text-gray-900">{current.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {current.effective_from && (
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {formatDate(current.effective_from)}{current.effective_to ? ` – ${formatDate(current.effective_to)}` : ''}
                  </span>
                )}
                {current.created_by_name && (
                  <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{current.created_by_name}</span>
                )}
              </div>
            </div>

            {current.content && (
              <div className="px-5 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{current.content}</p>
              </div>
            )}

            {/* Văn bản có dấu: PDF đầu tiên hiện luôn trong popup */}
            {inlinePdf && (
              <div className="px-5 pb-4">
                <div className="h-[55vh] min-h-[320px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  <PdfFrame src={inlinePdf.file_url} title={inlinePdf.file_name} className="h-full w-full border-0" />
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-4">
                {files.map((f) => (
                  <div key={f.id} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 pl-3 text-sm text-gray-700">
                    <PaperClipIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{f.file_name}</span>
                    <button type="button" onClick={() => setPreview(f)} title="Xem"
                      className="ml-1 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-700">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <a href={f.file_url} target="_blank" rel="noopener noreferrer" download={f.file_name} title="Tải xuống"
                      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-700">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3">
            <p className="text-xs text-gray-500">
              {hasNext ? `Còn ${queue.length - 1} thông báo nữa cần đọc.` : 'Bấm "Đã đọc, đóng" để xác nhận bạn đã đọc thông báo này.'}
            </p>
            <button type="button" onClick={acknowledge}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700">
              <CheckIcon className="h-5 w-5" />
              {hasNext ? 'Đã đọc, xem thông báo tiếp' : 'Đã đọc, đóng'}
            </button>
          </div>
        </div>
      </div>

      <FilePreviewModal
        open={!!preview}
        file_name={preview?.file_name || ''}
        file_url={preview?.file_url || ''}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
