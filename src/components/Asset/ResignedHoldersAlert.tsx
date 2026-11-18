import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { assetsAPI } from '@/utils/api';
import type { ResignedHolderAsset } from '@/utils/api/types';
import { isoToVnDate } from '@/pages/asset/assetTypes';

/**
 * Cảnh báo đầu trang cho HCNS/Admin: hotline / tài sản đang giao cho người đã nghỉ việc
 * (= không ai dùng). HCNS SK 2026-11-18 muốn biết ngay khi có người nghỉ mà còn giữ số, không đợi
 * mở trang Quản lý tài sản. Backend tính theo ngày nghỉ việc nên tới ngày là tự hiện, thu hồi /
 * bàn giao lại xong thì tự hết. Bấm vào → danh sách, bấm từng dòng mở thẳng chi tiết tài sản.
 * Lỗi / không có quyền → không hiện gì (cảnh báo phụ, không chặn việc dùng HRM).
 */
const ResignedHoldersAlert: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ResignedHolderAsset[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await assetsAPI.resignedHolders();
      setRows(data.results || []);
    } catch {
      // im lặng
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (rows.length === 0 && !open) return null;

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <>
      {rows.length > 0 && (
        <button
          type="button"
          onClick={() => { setOpen(true); load(); }}
          title="Người đã nghỉ việc vẫn đang giữ hotline / tài sản — bấm để xem và thu hồi"
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-2 ring-red-300 animate-blink motion-reduce:animate-none hover:bg-red-700 hover:animate-none sm:px-3 sm:text-sm"
        >
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden whitespace-nowrap md:inline">Người nghỉ còn giữ tài sản</span>
          <span className="whitespace-nowrap md:hidden">Tài sản</span>
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-extrabold text-red-600">
            {rows.length}
          </span>
        </button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
              <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-800">Hotline / tài sản của người đã nghỉ việc</h3>
                <p className="mt-0.5 text-sm text-red-700">
                  {rows.length > 0
                    ? `${rows.length} tài sản đang bàn giao cho người đã nghỉ — thực tế không ai dùng. Thu hồi hoặc bàn giao lại cho người khác.`
                    : 'Không còn tài sản nào đang giao cho người đã nghỉ việc.'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-red-400 hover:text-red-600" aria-label="Đóng">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {rows.map((a) => {
                const label = a.phone_number || a.name;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => go(`/dashboard/assets/${a.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {label}
                          {a.phone_number && a.name && a.name !== a.phone_number && (
                            <span className="font-normal text-gray-500"> · {a.name}</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {a.asset_code}{a.department_name ? ` · ${a.department_name}` : ''}
                        </p>
                        {a.resigned_holders.map((h) => (
                          <p key={h.employee_id} className="mt-0.5 text-xs font-medium text-red-600">
                            {h.name}{h.employee_code ? ` (${h.employee_code})` : ''}
                            {h.end_date ? ` · nghỉ từ ${isoToVnDate(h.end_date)}` : ' · đã nghỉ'}
                          </p>
                        ))}
                      </div>
                      <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
              <button onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Đóng
              </button>
              <button onClick={() => go('/dashboard/assets?resigned=1')}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                Mở trang Quản lý tài sản
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default ResignedHoldersAlert;
