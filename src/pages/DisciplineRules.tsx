import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpTrayIcon, MagnifyingGlassIcon, ScaleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import DisciplineRulesTable, { filterRules } from '../components/Discipline/DisciplineRulesTable';
import {
  DisciplineGroup,
  DisciplineImportResult,
  disciplineRuleService,
} from '../services/disciplineRule.service';
import { errorMessage } from '../services/jobDescription.service';

/**
 * Nội quy & mức phạt (HCNS SK 2026-11-17) — quy định chung, mọi nhân viên đều xem được (nhiều vị trí
 * áp dụng chồng nhau). HCNS / Admin cập nhật: tải Google Sheet "QUY ĐỊNH NHA KHOA SK" về .xlsx rồi
 * "Nhập từ Excel" — xem trước số lỗi đọc được ở từng tab rồi mới ghi; mỗi tab thay toàn bộ lỗi của nhóm
 * cùng tên, nhóm không có trong file giữ nguyên.
 */

const ImportModal: React.FC<{ onClose: (changed: boolean) => void }> = ({ onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DisciplineImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const choose = async (list: FileList | null) => {
    const picked = list?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!picked) return;
    setFile(picked);
    setPreview(null);
    setSaved(false);
    setError(null);
    setBusy(true);
    try {
      setPreview(await disciplineRuleService.importXlsx(picked, true));
    } catch (err) {
      setError(errorMessage(err, 'Không đọc được file Excel'));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPreview(await disciplineRuleService.importXlsx(file, false));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Không ghi được'));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Nhập nội quy & mức phạt từ Excel</h3>
            <p className="mt-1 text-xs text-gray-500">
              Mở Google Sheet "QUY ĐỊNH NHA KHOA SK" → Tệp → Tải xuống → Microsoft Excel (.xlsx), rồi chọn file đó. Mỗi tab
              là một nhóm; tab trong file thay toàn bộ lỗi của nhóm cùng tên, nhóm không có trong file giữ nguyên.
            </p>
          </div>
          <button onClick={() => onClose(saved)} disabled={busy} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b px-5 py-3">
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => choose(e.target.files)}
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <button onClick={() => inputRef.current?.click()} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <ArrowUpTrayIcon className="h-4 w-4" /> {file ? `Chọn file khác (${file.name})` : 'Chọn file Excel (.xlsx)'}
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {busy && <p className="text-sm text-gray-600">Đang xử lý...</p>}
          {!busy && !preview && !error && <p className="py-6 text-center text-sm text-gray-500">Chưa chọn file.</p>}
          {preview && (
            <>
              <p className={`text-sm rounded-xl p-3 ${saved ? 'bg-emerald-50 text-emerald-800' : 'bg-primary-50 text-primary-800'}`}>
                {saved ? 'Đã ghi vào HRM. Mọi nhân viên thấy bảng mới ngay.' : 'Xem trước — chưa ghi gì. Kiểm tra số lỗi từng nhóm rồi bấm "Ghi vào HRM".'}
              </p>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                {preview.groups.map((g) => (
                  <li key={g.code} className="px-3 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{g.title}</span>
                      <span className="text-gray-600">{g.rule_count} lỗi</span>
                      <span className="text-xs text-gray-400">
                        {g.previous_rule_count == null ? '(nhóm mới)' : `(trước: ${g.previous_rule_count})`}
                      </span>
                    </div>
                    {g.sample[0] && <p className="mt-0.5 text-xs text-gray-500 truncate">Vd: {g.sample[0].detail}</p>}
                  </li>
                ))}
              </ul>
              {preview.skipped_sheets.length > 0 && (
                <p className="text-xs text-gray-500">Bỏ qua tab không có bảng mức phạt: {preview.skipped_sheets.join(', ')}.</p>
              )}
              {preview.untouched_groups.length > 0 && (
                <p className="text-xs text-gray-500">Giữ nguyên các nhóm không có trong file: {preview.untouched_groups.join(', ')}.</p>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <button onClick={() => onClose(saved)} disabled={busy} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">Đóng</button>
          {!saved && (
            <button onClick={apply} disabled={busy || !preview}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              Ghi vào HRM
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const DisciplineRules: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canImport = role === 'ADMIN' || role === 'HR' || !!user?.is_super_admin || !!(user as any)?.is_superuser
    || !!(user as any)?.is_staff;

  const [groups, setGroups] = useState<DisciplineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>('');
  const [query, setQuery] = useState('');
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    setLoading(true);
    disciplineRuleService.list()
      .then((data) => {
        setGroups(data);
        setActive((cur) => (data.some((g) => g.code === cur) ? cur : data[0]?.code || ''));
      })
      .catch((err) => setError(errorMessage(err, 'Không tải được nội quy')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const searching = query.trim().length > 0;
  const matches = useMemo(
    () => groups.map((g) => ({ group: g, count: filterRules(g.rules, query).length })),
    [groups, query],
  );
  const current = groups.find((g) => g.code === active);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <ScaleIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Nội quy & mức phạt</h1>
          <p className="text-sm text-gray-500">Quy định chung của Nha khoa SK — mọi nhân viên đều xem được.</p>
        </div>
        {canImport && (
          <button onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowUpTrayIcon className="h-4 w-4" /> Nhập từ Excel
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
      {!loading && groups.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          Chưa có nội quy nào.{canImport ? ' Bấm "Nhập từ Excel" để nhập từ Google Sheet của HCNS.' : ''}
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm lỗi, mức phạt, vị trí... (gõ không dấu cũng được)"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {!searching && (
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
              {groups.map((g) => (
                <button key={g.code} onClick={() => setActive(g.code)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${active === g.code ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                  {g.title} <span className="text-xs font-normal text-gray-400">{g.rules.length}</span>
                </button>
              ))}
            </div>
          )}

          {searching ? (
            matches.filter((m) => m.count > 0).length === 0
              ? <p className="text-sm text-gray-500">Không có lỗi nào khớp "{query}".</p>
              : matches.filter((m) => m.count > 0).map(({ group, count }) => (
                <section key={group.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">{group.title} <span className="font-normal text-gray-400">· {count} kết quả</span></h2>
                  <DisciplineRulesTable group={group} query={query} />
                </section>
              ))
          ) : current && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              {current.heading && <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">{current.heading}</h2>}
              <DisciplineRulesTable group={current} />
            </section>
          )}
        </>
      )}

      {showImport && <ImportModal onClose={(changed) => { setShowImport(false); if (changed) load(); }} />}
    </div>
  );
};

export default DisciplineRules;
