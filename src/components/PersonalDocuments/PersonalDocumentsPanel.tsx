import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FolderOpenIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  EmployeeDocumentsPayload,
  PersonalDocState,
  STATE_LABELS,
  personalDocumentService,
} from '../../services/personalDocument.service';

/**
 * Hồ sơ giấy tờ của 1 nhân viên (trang chi tiết nhân viên) — chỉ hiện cho Admin/HCNS.
 * Mỗi loại: trạng thái, các file đã tải, tải thêm / xoá, đánh dấu "Không áp dụng".
 */

const STATE_BADGE: Record<PersonalDocState, string> = {
  FILE: 'bg-emerald-100 text-emerald-700',
  SYSTEM_CONTRACT: 'bg-sky-100 text-sky-700',
  NOT_APPLICABLE: 'bg-gray-100 text-gray-600',
  MISSING: 'bg-red-100 text-red-700',
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Giấy tờ ghi nhận từ file scan gộp trỏ về cả file gộp; ghi chú bắt đầu bằng "Trang N…"
 * (backend: hrm/personal_document_scan.py document_note) → mở file ngay trang đầu của loại đó.
 */
const withFirstPage = (url: string, note: string) => {
  const m = /^Trang (\d+)/.exec(note || '');
  return m ? `${url}#page=${m[1]}` : url;
};

const errorMessage = (err: any) =>
  err?.response?.data?.detail || err?.message || 'Lỗi không xác định';

const PersonalDocumentsPanel: React.FC<{ employeeId: number }> = ({ employeeId }) => {
  const [data, setData] = useState<EmployeeDocumentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyType, setBusyType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    personalDocumentService
      .getForEmployee(employeeId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId]);

  const run = async (docType: string, action: () => Promise<EmployeeDocumentsPayload>) => {
    setBusyType(docType);
    setError(null);
    try {
      setData(await action());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyType(null);
    }
  };

  const onFilesChosen = (docType: string, files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (fileInputs.current[docType]) fileInputs.current[docType]!.value = '';
    if (list.length) run(docType, () => personalDocumentService.upload(employeeId, docType, list));
  };

  const missingCount = data?.missing.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="h-9 w-9 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <FolderOpenIcon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Hồ sơ giấy tờ</h3>
        {data && (
          missingCount > 0 ? (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Thiếu {missingCount} giấy tờ
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              Đủ hồ sơ
            </span>
          )
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Đang tải hồ sơ giấy tờ...</p>}

      {data && (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {data.types.map((type) => {
            const st = data.status[type.code];
            const docs = data.documents.filter((d) => d.doc_type === type.code && !d.not_applicable);
            const naDoc = data.documents.find((d) => d.doc_type === type.code && d.not_applicable);
            const busy = busyType === type.code;
            const missing = st.state === 'MISSING' && type.required;
            return (
              <div key={type.code} className={`px-4 py-3 ${missing ? 'bg-red-50/60' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <DocumentTextIcon className={`h-5 w-5 flex-shrink-0 ${missing ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold text-gray-900">{type.label}</span>
                  {!type.required && <span className="text-xs text-gray-400">(không bắt buộc)</span>}
                  {(type.required || st.state !== 'MISSING') && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATE_BADGE[st.state]}`}>
                      {STATE_LABELS[st.state]}
                      {st.state === 'FILE' && st.file_count > 1 ? ` (${st.file_count} file)` : ''}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    {type.required && st.state !== 'FILE' && st.state !== 'SYSTEM_CONTRACT' && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={st.state === 'NOT_APPLICABLE'}
                          disabled={busy}
                          onChange={(e) => run(type.code, () =>
                            personalDocumentService.setNotApplicable(employeeId, type.code, e.target.checked))}
                        />
                        Không áp dụng
                      </label>
                    )}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                      className="hidden"
                      ref={(el) => { fileInputs.current[type.code] = el; }}
                      onChange={(e) => onFilesChosen(type.code, e.target.files)}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => fileInputs.current[type.code]?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      {busy ? 'Đang xử lý...' : 'Tải lên'}
                    </button>
                  </div>
                </div>

                {st.state === 'SYSTEM_CONTRACT' && docs.length === 0 && (
                  <p className="mt-1 ml-7 text-xs text-sky-700">Đã có hợp đồng ký trên HRM (xem ở mục Hợp đồng).</p>
                )}
                {naDoc?.note && <p className="mt-1 ml-7 text-xs text-gray-500">Ghi chú: {naDoc.note}</p>}

                {docs.length > 0 && (
                  <ul className="mt-2 ml-7 space-y-1">
                    {docs.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium text-gray-800 break-all">{d.file_name}</span>
                        {/* Ghi nhận từ file scan gộp: ghi chú "Trang 7, 9-14 trong SK00346.pdf (quét AI)". */}
                        {d.note && <span className="text-gray-600">{d.note}</span>}
                        <span className="text-gray-400">
                          {[formatSize(d.file_size), new Date(d.uploaded_at).toLocaleDateString('vi-VN'), d.uploaded_by_name]
                            .filter(Boolean).join(' · ')}
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          {d.file_url && (
                            <a
                              href={withFirstPage(d.file_url, d.note)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-primary-700 hover:bg-primary-50"
                            >
                              <EyeIcon className="h-4 w-4" /> Xem
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`Xoá file "${d.file_name}" khỏi hồ sơ?`)) {
                                run(type.code, () => personalDocumentService.remove(d.id));
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" /> Xoá
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonalDocumentsPanel;
