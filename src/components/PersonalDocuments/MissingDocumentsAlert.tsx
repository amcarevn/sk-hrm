import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { MyDocumentsPayload, personalDocumentService } from '../../services/personalDocument.service';

/**
 * Cảnh báo "Thiếu hồ sơ" nhấp nháy trên thanh đầu trang cho nhân viên còn thiếu giấy tờ bắt buộc
 * (HCNS SK 2026-11-10). Bấm vào → hộp liệt kê mình còn thiếu loại nào, đã có loại nào.
 * Chỉ trạng thái, không có file (xem file vẫn chỉ Admin/HCNS). Lỗi / backend chưa có API → không hiện gì.
 */

const PRESENT_TEXT: Record<string, string> = {
  FILE: 'Đã nộp',
  SYSTEM_CONTRACT: 'Đã ký trên HRM',
  NOT_APPLICABLE: 'Không áp dụng',
};

const MissingDocumentsAlert: React.FC = () => {
  const [data, setData] = useState<MyDocumentsPayload | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await personalDocumentService.mine());
    } catch {
      // im lặng: cảnh báo phụ, không chặn việc dùng HRM
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const missing = data?.missing || [];
  if (!data?.employee || missing.length === 0) return null;

  const required = data.types.filter((t) => t.required);
  const missingTypes = required.filter((t) => missing.includes(t.code));
  const presentTypes = required.filter((t) => !missing.includes(t.code));

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); load(); }}
        title="Bấm để xem bạn còn thiếu giấy tờ nào"
        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-2 ring-red-300 animate-blink motion-reduce:animate-none hover:bg-red-700 hover:animate-none sm:px-3 sm:text-sm"
      >
        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">Thiếu hồ sơ</span>
        <span className="hidden sm:inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-extrabold text-red-600">
          {missing.length}
        </span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
              <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-800">Hồ sơ giấy tờ của bạn còn thiếu</h3>
                <p className="mt-0.5 text-sm text-red-700">
                  Còn thiếu {missing.length} / {required.length} loại giấy tờ bắt buộc.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-red-400 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Cần nộp bổ sung</p>
                <ul className="space-y-1.5">
                  {missingTypes.map((t) => (
                    <li key={t.code} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>

              {presentTypes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Đã có</p>
                  <ul className="space-y-1">
                    {presentTypes.map((t) => {
                      const state = data.status[t.code];
                      const na = state === 'NOT_APPLICABLE';
                      return (
                        <li key={t.code} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700">
                          {na
                            ? <MinusCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                            : <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-500" />}
                          <span className="flex-1">{t.label}</span>
                          <span className={`text-xs ${na ? 'text-gray-400' : 'text-emerald-700'}`}>{PRESENT_TEXT[state] || ''}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                Vui lòng nộp bản giấy hoặc bản scan các giấy tờ trên cho <b>phòng HCNS</b> để bổ sung hồ sơ.
                Đã nộp rồi mà vẫn báo thiếu thì báo HCNS kiểm tra lại.
              </p>
            </div>

            <div className="border-t px-5 py-3 text-right">
              <button onClick={() => setOpen(false)}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default MissingDocumentsAlert;
