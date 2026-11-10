import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  CONFIDENCE_LABELS,
  DROP_TYPE,
  ScanDetail,
  ScanPage,
  isBusy,
  pageRanges,
  personalDocumentScanService,
  scanError,
} from '../services/personalDocumentScan.service';
import { scanStatusBadge } from './PersonalDocumentScans';

/**
 * Duyệt một lượt quét hồ sơ gộp: bảng loại từng trang (AI gán, HCNS sửa), khung xem trang
 * PDF, các loại giấy tờ sẽ ghi nhận và loại còn thiếu. "Lưu vào hồ sơ" ghi nhận từng loại vào
 * hồ sơ giấy tờ của nhân viên, trỏ về chính file gộp (không cắt PDF, HCNS SK 2026-11-10).
 */

const SHORT_LABELS: Record<string, string> = {
  SYLL: 'Sơ yếu lý lịch',
  KHAI_SINH: 'Khai sinh',
  HO_KHAU: 'Hộ khẩu / Cư trú',
  KHAM_SK: 'Khám sức khỏe',
  BANG_CAP: 'Bằng cấp',
  HOP_DONG: 'Hợp đồng',
  BAO_MAT: 'Bảo mật',
  KHAC: 'Giấy tờ khác',
  BO: 'Bỏ trang này',
};

const label = (code: string) => SHORT_LABELS[code] || code;

const PersonalDocumentScanDetail: React.FC = () => {
  const { id } = useParams();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [onlyReview, setOnlyReview] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const accept = (data: ScanDetail) => {
    setScan(data);
    setPages(data.pages);
    setDirty(false);
  };

  const load = useCallback(async (keepEdits = false) => {
    try {
      const data = await personalDocumentScanService.get(id as string);
      setScan(data);
      if (!keepEdits) setPages(data.pages);
      setLoadError(null);
    } catch (err) {
      setLoadError(scanError(err, 'Không tải được lượt quét'));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // AI đang đọc thì hỏi lại mỗi 3 giây.
  const busy = scan ? isBusy(scan) : false;
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => load(), 3000);
    return () => clearInterval(t);
  }, [busy, load]);

  // PDF gốc qua API -> blob URL cho khung xem trước (link media/presigned có thể bị chặn nhúng).
  const hasResult = scan?.status === 'READY' || scan?.status === 'APPLIED';
  const scanId = scan?.id;
  useEffect(() => {
    if (!hasResult || !scanId) return undefined;
    let url: string | null = null;
    let cancelled = false;
    personalDocumentScanService.fileBlob(scanId)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        setBlobUrl(url);
      })
      .catch((err) => !cancelled && setPreviewError(scanError(err, 'Không tải được file gốc')));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [hasResult, scanId]);

  const editable = scan?.status === 'READY';
  const typeOptions = scan?.types || [];
  const requiredTypes = typeOptions.filter((t) => t.required).map((t) => t.code);

  const plan = useMemo(() => {
    const groups = new Map<string, number[]>();
    pages.forEach((p) => {
      if (p.doc_type === DROP_TYPE) return;
      groups.set(p.doc_type, [...(groups.get(p.doc_type) || []), p.page]);
    });
    const order = typeOptions.map((t) => t.code);
    return Array.from(groups.entries())
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([docType, numbers]) => ({ docType, numbers }));
  }, [pages, typeOptions]);

  const missingAfter = scan
    ? requiredTypes.filter((t) => scan.current_status[t] === 'MISSING' && !plan.some((g) => g.docType === t))
    : [];
  const dropped = pages.filter((p) => p.doc_type === DROP_TYPE).length;
  const reviewCount = pages.filter((p) => p.needs_review).length;
  const shownPages = onlyReview ? pages.filter((p) => p.needs_review) : pages;

  const changeType = (pageNo: number, docType: string) => {
    setPages((prev) => prev.map((p) => (p.page === pageNo ? { ...p, doc_type: docType } : p)));
    setDirty(true);
    setNotice(null);
    setConfirming(false);
  };

  const payload = () => pages.map((p) => ({ page: p.page, doc_type: p.doc_type }));

  const save = async () => {
    if (!scan) return;
    setSaving(true);
    setActionError(null);
    try {
      accept(await personalDocumentScanService.savePages(scan.id, payload()));
      setNotice('Đã lưu chỉnh sửa.');
    } catch (err) {
      setActionError(scanError(err));
    } finally {
      setSaving(false);
    }
  };

  const apply = async () => {
    if (!scan) return;
    setSaving(true);
    setActionError(null);
    try {
      accept(await personalDocumentScanService.apply(scan.id, payload()));
      setConfirming(false);
      setNotice('Đã lưu vào hồ sơ giấy tờ.');
    } catch (err) {
      setActionError(scanError(err));
    } finally {
      setSaving(false);
    }
  };

  const retry = async () => {
    if (!scan) return;
    setActionError(null);
    try {
      accept(await personalDocumentScanService.retry(scan.id));
    } catch (err) {
      setActionError(scanError(err));
    }
  };

  if (loadError && !scan) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }
  if (!scan) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  const pageCount = scan.page_count || pages.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/personal-documents/scans" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" title="Danh sách lượt quét">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{scan.employee.full_name}</h1>
            <span className="text-sm text-gray-500">{scan.employee.employee_id}</span>
            {scanStatusBadge(scan)}
          </div>
          <p className="text-sm text-gray-500 break-all">
            {scan.file_name} · {pageCount} trang
            {scan.owner_name && scan.owner_name !== scan.employee.full_name && (
              <span className="text-amber-700"> · AI đọc chủ hồ sơ là "{scan.owner_name}"</span>
            )}
          </p>
        </div>
        {scan.file_url && (
          <a href={scan.file_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Mở file gốc
          </a>
        )}
      </div>

      {busy && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
          <ArrowPathIcon className="h-8 w-8 text-sky-500 animate-spin mx-auto" />
          <p className="font-semibold text-gray-800">AI đang đọc {pageCount} trang...</p>
          <p className="text-sm text-gray-500">Thường mất khoảng 30 giây. Có thể rời trang này, kết quả vẫn được lưu.</p>
        </div>
      )}

      {(scan.status === 'FAILED' || scan.is_stuck) && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex flex-wrap items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <p className="flex-1 text-sm text-red-700">
            {scan.is_stuck ? 'Lượt quét bị kẹt quá lâu (server có thể đã khởi động lại).' : scan.error || 'AI không đọc được file này.'}
          </p>
          <button onClick={retry} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            Chạy lại
          </button>
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {hasResult && (
        <>
          {/* Dải các loại sẽ ghi nhận + nút lưu ở trên, để khung xem PDF bên dưới có trọn chiều cao màn hình. */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col xl:flex-row xl:items-start gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-bold text-gray-900">
                  {scan.status === 'APPLIED' ? `Đã ghi nhận ${plan.length} loại giấy tờ vào hồ sơ` : `Có ${plan.length} loại giấy tờ`}
                </h2>
                {dropped > 0 && <span className="text-xs text-gray-500">Bỏ {dropped} trang (không lưu)</span>}
              </div>
              {plan.length === 0 ? (
                <p className="text-sm text-gray-500">Mọi trang đang để "Bỏ".</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {plan.map((g) => (
                    <li key={g.docType}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <span className="font-semibold text-gray-800">{label(g.docType)}</span>
                      <span className="text-gray-500"> · tr. {pageRanges(g.numbers)}</span>
                      {editable && (scan.current_file_counts[g.docType] || 0) > 0 && (
                        <span className="text-amber-700"> · hồ sơ đã có {scan.current_file_counts[g.docType]} file</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {missingAfter.length > 0 ? (
                <p className="text-sm text-red-600">
                  {scan.status === 'APPLIED' ? 'Còn thiếu' : 'Sau khi lưu vẫn thiếu'}: {missingAfter.map(label).join(', ')}
                </p>
              ) : (
                <p className="text-sm text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" /> Đủ giấy tờ bắt buộc
                </p>
              )}
            </div>

            <div className="xl:w-80 flex-shrink-0 space-y-2">
              {editable && !confirming && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={save} disabled={!dirty || saving}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    Lưu chỉnh sửa
                  </button>
                  <button onClick={() => setConfirming(true)} disabled={saving || plan.length === 0}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
                    Lưu vào hồ sơ
                  </button>
                </div>
              )}
              {editable && confirming && (
                <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 space-y-2">
                  <p className="text-sm text-gray-800">
                    Ghi nhận {plan.length} loại giấy tờ vào hồ sơ của <b>{scan.employee.full_name}</b>? File gộp được lưu nguyên, không tách.
                    {reviewCount > 0 && ' Hãy chắc là đã xem các dòng vàng.'}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirming(false)} disabled={saving}
                      className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-white">
                      Huỷ
                    </button>
                    <button onClick={apply} disabled={saving}
                      className="flex-1 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
                      {saving ? 'Đang lưu...' : 'Xác nhận lưu'}
                    </button>
                  </div>
                </div>
              )}
              {scan.status === 'APPLIED' && (
                <p className="text-xs text-gray-500">
                  {scan.applied_by_name ? `${scan.applied_by_name} lưu` : 'Đã lưu'}
                  {scan.applied_at ? ` lúc ${new Date(scan.applied_at).toLocaleString('vi-VN')}` : ''}.{' '}
                  <Link to="/dashboard/personal-documents" className="text-primary-600 hover:underline">Xem hồ sơ giấy tờ</Link>
                </p>
              )}
              {scan.ai_model && (
                <p className="text-[11px] text-gray-400">
                  {scan.ai_model} · {scan.input_tokens.toLocaleString('vi-VN')} token vào / {scan.output_tokens.toLocaleString('vi-VN')} token ra
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-600 flex-1">
                {editable
                  ? 'Kiểm tra từng trang, sửa cột Loại nếu AI gán sai. Dòng vàng là trang nên xem lại.'
                  : 'Kết quả phân loại đã lưu.'}
              </p>
              {reviewCount > 0 && (
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600" />
                  Chỉ trang cần xem ({reviewCount})
                </label>
              )}
            </div>
            <ul className="divide-y divide-gray-100">
              {shownPages.map((p) => {
                const isDrop = p.doc_type === DROP_TYPE;
                const changed = p.doc_type !== p.ai_doc_type;
                return (
                  <li key={p.page} onClick={() => setPreviewPage(p.page)}
                    className={`px-4 py-2.5 lg:cursor-pointer ${p.needs_review ? 'bg-amber-50' : isDrop ? 'bg-gray-100/70' : 'lg:hover:bg-gray-50'} ${previewPage === p.page ? 'lg:ring-2 lg:ring-inset lg:ring-primary-400' : ''}`}>
                    {/* Tầng 1: số trang, loại (sửa được), nhãn. Tầng 2: người trên trang + ghi chú AI. */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="w-12 flex-shrink-0 text-sm font-bold text-gray-700">Tr. {p.page}</span>
                      <select value={p.doc_type} disabled={!editable} onChange={(e) => changeType(p.page, e.target.value)}
                        className={`flex-1 min-w-[150px] sm:flex-none sm:w-44 rounded-lg border-gray-200 text-sm py-1.5 ${isDrop ? 'text-gray-500' : 'text-gray-900'} disabled:bg-transparent disabled:border-transparent disabled:px-0`}>
                        {typeOptions.map((t) => <option key={t.code} value={t.code}>{label(t.code)}</option>)}
                      </select>
                      {p.needs_review && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-800 text-[10px] font-semibold">Cần xem</span>
                      )}
                      {changed && <span className="text-[11px] text-sky-700">AI gán: {label(p.ai_doc_type)}</span>}
                      <EyeIcon className={`hidden lg:block ml-auto h-4 w-4 ${previewPage === p.page ? 'text-primary-600' : 'text-gray-300'}`} />
                    </div>
                    {(p.person_name || p.note || p.confidence !== 'high') && (
                      <div className="mt-1 pl-14 text-sm break-words">
                        {p.person_name && <span className="font-medium text-gray-800">{p.person_name}</span>}
                        {p.person_name && p.note && <span className="text-gray-300"> · </span>}
                        {p.note && <span className="text-xs text-gray-500">{p.note}</span>}
                        {p.confidence !== 'high' && (
                          <span className="block text-[11px] font-semibold text-amber-700">Độ tin cậy: {CONFIDENCE_LABELS[p.confidence]}</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Khung xem trang: rộng hơn bảng, cao gần trọn màn hình, bám theo khi cuộn danh sách trang. */}
          <div className="hidden lg:flex lg:flex-col lg:col-span-6 xl:col-span-7 lg:sticky lg:top-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 border-b flex items-center gap-2">
              <button onClick={() => setPreviewPage((n) => Math.max(1, n - 1))} disabled={previewPage <= 1}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-700">Trang {previewPage}/{pageCount}</span>
              <button onClick={() => setPreviewPage((n) => Math.min(pageCount, n + 1))} disabled={previewPage >= pageCount}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <span className="ml-auto text-xs font-medium text-gray-600">
                {label(pages.find((p) => p.page === previewPage)?.doc_type || '')}
              </span>
            </div>
            {blobUrl ? (
              // navpanes=0: ẩn cột thumbnail của trình xem PDF để trang hiện to hơn. Chrome không nhận
              // view=FitH nên giữ mặc định vừa trang; cần đọc kỹ thì bấm + trên thanh công cụ.
              <iframe key={previewPage} title="Xem trang" src={`${blobUrl}#page=${previewPage}&navpanes=0`}
                className="w-full h-[calc(100vh-150px)] min-h-[480px] bg-gray-100" />
            ) : (
              <p className="h-[calc(100vh-150px)] min-h-[480px] flex items-center justify-center text-sm text-gray-500 px-4 text-center">
                {previewError || 'Đang tải file...'}
              </p>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonalDocumentScanDetail;
