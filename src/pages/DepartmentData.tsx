import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  DocumentIcon,
  EyeIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  DataDepartment,
  DataItem,
  DepartmentDetail,
  Director,
  departmentDataService,
  errorMessage,
} from '../services/departmentData.service';
import { employeesAPI } from '../utils/api';

/**
 * Dữ liệu phòng ban — HCNS SK phần 5: mỗi phòng ban một kho file / link dùng chung.
 * Trưởng phòng quản lý phòng mình; Ban Giám đốc xem mọi phòng; Admin / HCNS quản lý mọi phòng.
 */

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// ── Thêm / sửa 1 mục ─────────────────────────────────────────────────────────

type EditorState = { mode: 'file' | 'link'; item?: DataItem };

const ItemEditor: React.FC<{
  departmentId: number;
  state: EditorState;
  onClose: (changed: boolean) => void;
}> = ({ departmentId, state, onClose }) => {
  const editing = state.item;
  const [title, setTitle] = useState(editing?.title || '');
  const [note, setNote] = useState(editing?.note || '');
  const [url, setUrl] = useState(editing?.kind === 'LINK' ? editing.url : '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLink = state.mode === 'link';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await departmentDataService.update(editing.id, {
          title, note, ...(isLink ? { url } : {}), ...(file ? { file } : {}),
        });
      } else if (isLink) {
        await departmentDataService.addLink(departmentId, url, title, note);
      } else {
        if (!file) throw new Error('Chọn file để tải lên.');
        await departmentDataService.addFile(departmentId, file, title, note);
      }
      onClose(true);
    } catch (err: any) {
      setError(errorMessage(err, 'Lưu không thành công, vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  const heading = editing ? 'Sửa dữ liệu' : isLink ? 'Thêm link' : 'Tải file lên';
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onClose(false)}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <h3 className="flex-1 text-lg font-bold text-gray-900">{heading}</h3>
          <button type="button" onClick={() => onClose(false)} disabled={busy} aria-label="Đóng"
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {isLink ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Link *</span>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/..." required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">
                {editing ? `File hiện tại: ${editing.file_name || '—'} (chọn file mới để thay)` : 'File *'}
              </span>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.zip"
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700" />
              <span className="mt-1 block text-xs text-gray-500">Excel, Word, PDF, PowerPoint, ảnh, CSV, TXT, ZIP — tối đa 30MB.</span>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Tên dữ liệu{isLink ? ' *' : ''}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required={isLink || !!editing}
              placeholder={isLink ? 'vd Sổ theo dõi chi phí 2026' : 'Để trống thì lấy theo tên file'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Ghi chú</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Nội dung, ai cập nhật, khi nào dùng…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onClose(false)} disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Huỷ
          </button>
          <button type="submit" disabled={busy}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

// ── Ban Giám đốc (Admin / HCNS) ──────────────────────────────────────────────

const DirectorsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [people, setPeople] = useState<Director[]>([]);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<{ id: number; employee_id: string; full_name: string; department_name?: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentDataService.directors().then(setPeople).catch((e) => setError(errorMessage(e, 'Không tải được danh sách.')));
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(() => {
      employeesAPI.list({ search: search.trim(), page_size: 8 })
        .then((res) => setFound(res.results.map((e: any) => ({
          id: e.id, employee_id: e.employee_id, full_name: e.full_name,
          department_name: e.department_name ?? e.department?.name ?? null,
        }))))
        .catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = async (employeeId: number, isBod: boolean) => {
    setError(null);
    try {
      setPeople(await departmentDataService.setDirector(employeeId, isBod));
      if (isBod) setSearch('');
    } catch (e) {
      setError(errorMessage(e, 'Không lưu được, vui lòng thử lại.'));
    }
  };

  const chosen = new Set(people.map((p) => p.id));
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Ban Giám đốc</h3>
            <p className="mt-0.5 text-xs text-gray-500">Những người này xem được dữ liệu của mọi phòng ban (chỉ xem, không sửa).</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <ul className="space-y-1.5">
            {people.length === 0 && <li className="text-sm text-gray-500">Chưa có ai trong Ban Giám đốc.</li>}
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{p.full_name} <span className="font-normal text-gray-500">({p.employee_id})</span></p>
                  <p className="truncate text-xs text-gray-500">{[p.position_title, p.department_name].filter(Boolean).join(' · ')}</p>
                </div>
                <button onClick={() => toggle(p.id, false)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Bỏ</button>
              </li>
            ))}
          </ul>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Thêm người</label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã nhân viên"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <ul className="mt-1.5 divide-y divide-gray-100 rounded-lg border border-gray-100 empty:hidden">
              {found.filter((e) => !chosen.has(e.id)).map((e) => (
                <li key={e.id}>
                  <button onClick={() => toggle(e.id, true)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{e.full_name} <span className="text-gray-500">({e.employee_id})</span></span>
                    <span className="text-xs font-semibold text-primary-700">Thêm</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ── Trang ────────────────────────────────────────────────────────────────────

export default function DepartmentData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get('d')) || null;
  const [departments, setDepartments] = useState<DataDepartment[]>([]);
  const [canManageAll, setCanManageAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<DepartmentDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [showDirectors, setShowDirectors] = useState(false);
  const [openViews, setOpenViews] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    try {
      const data = await departmentDataService.departments();
      setDepartments(data.departments);
      setCanManageAll(data.can_manage_all);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách phòng ban.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    setDetailError(null);
    try {
      setDetail(await departmentDataService.detail(id));
    } catch (e) {
      setDetail(null);
      setDetailError(errorMessage(e, 'Không tải được dữ liệu phòng ban.'));
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Chỉ có 1 phòng (trưởng phòng) → mở luôn phòng đó, một lần lúc vào trang (bấm ← vẫn về danh sách được).
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current || loading) return;
    autoOpened.current = true;
    if (!selectedId && departments.length === 1 && !canManageAll) {
      setSearchParams({ d: String(departments[0].id) }, { replace: true });
    }
  }, [loading, departments, selectedId, canManageAll, setSearchParams]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const shown = useMemo(() => {
    const q = fold(search.trim());
    if (!q) return departments;
    return departments.filter((d) => fold(`${d.name} ${d.code} ${d.manager_name || ''}`).includes(q));
  }, [departments, search]);

  const select = (id: number | null) => setSearchParams(id ? { d: String(id) } : {});

  const openItem = async (item: DataItem) => {
    // Mở tab trước (đồng bộ với cú bấm) để trình duyệt không chặn popup, rồi gán link sau.
    const win = window.open('', '_blank');
    try {
      const { url } = await departmentDataService.open(item.id);
      if (win) win.location.href = url;
      else window.location.href = url;
      if (selectedId) loadDetail(selectedId);
    } catch (e) {
      win?.close();
      alert(errorMessage(e, 'Không mở được dữ liệu này.'));
    }
  };

  const removeItem = async (item: DataItem) => {
    if (!window.confirm(`Xoá "${item.title}" khỏi dữ liệu phòng ban?\n\nXoá vĩnh viễn, không khôi phục được.`)) return;
    try {
      await departmentDataService.remove(item.id);
      if (selectedId) loadDetail(selectedId);
      loadList();
    } catch (e) {
      alert(errorMessage(e, 'Không xoá được, vui lòng thử lại.'));
    }
  };

  const closeEditor = (changed: boolean) => {
    setEditor(null);
    if (changed && selectedId) {
      loadDetail(selectedId);
      loadList();
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-500">Đang tải…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <CircleStackIcon className="h-6 w-6" />
        </div>
        <div className="min-w-[16rem] flex-1">
          <h1 className="text-xl font-bold text-gray-900">Dữ liệu phòng ban</h1>
          <p className="text-sm text-gray-500">
            Mỗi phòng ban một kho file / link dùng chung. Trưởng phòng quản lý dữ liệu phòng mình; Ban Giám đốc và Admin
            xem được mọi phòng.
          </p>
        </div>
        {canManageAll && (
          <button onClick={() => setShowDirectors(true)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <UserGroupIcon className="h-4 w-4" /> Ban Giám đốc
          </button>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!error && departments.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          Bạn chưa được xem dữ liệu phòng ban nào. Trưởng phòng, Ban Giám đốc và Admin mới có quyền.
        </p>
      )}

      {departments.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          {/* Danh sách phòng ban — điện thoại: ẩn khi đang xem 1 phòng */}
          <div className={`${selectedId ? 'hidden lg:block' : ''} space-y-2`}>
            {departments.length > 6 && (
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm phòng ban"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-2xl bg-white p-2 shadow-sm">
              {shown.map((d) => (
                <li key={d.id}>
                  <button onClick={() => select(d.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${d.id === selectedId ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-gray-50'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{d.name}</p>
                      <p className="truncate text-xs text-gray-500">{d.code}{d.manager_name ? ` · TP: ${d.manager_name}` : ''}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.item_count ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
                      {d.item_count}
                    </span>
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-gray-500">Không có phòng ban phù hợp.</li>}
            </ul>
          </div>

          {/* Chi tiết 1 phòng ban */}
          <div className={`${selectedId ? '' : 'hidden lg:block'} min-w-0`}>
            {!selectedId && (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">Chọn một phòng ban để xem dữ liệu.</div>
            )}
            {selectedId && detailError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{detailError}</p>}
            {selectedId && detail && (
              <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <button onClick={() => select(null)} aria-label="Danh sách phòng ban"
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden">
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="min-w-[12rem] flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{detail.department.name}</h2>
                    <p className="text-xs text-gray-500">
                      {detail.department.code}
                      {detail.department.parent_name ? ` · Thuộc ${detail.department.parent_name}` : ''}
                      {` · Trưởng phòng: ${detail.department.manager_name || 'chưa có'}`}
                    </p>
                  </div>
                  {detail.can_manage && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditor({ mode: 'file' })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                        <ArrowUpTrayIcon className="h-4 w-4" /> Tải file lên
                      </button>
                      <button onClick={() => setEditor({ mode: 'link' })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        <LinkIcon className="h-4 w-4" /> Thêm link
                      </button>
                    </div>
                  )}
                </div>

                {detail.items.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                    {detail.can_manage
                      ? 'Chưa có dữ liệu. Bấm "Tải file lên" hoặc "Thêm link" (vd link Google Sheet đang dùng).'
                      : 'Phòng ban chưa có dữ liệu.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {detail.items.map((item) => (
                      <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${item.kind === 'LINK' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.kind === 'LINK' ? <LinkIcon className="h-5 w-5" /> : <DocumentIcon className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => openItem(item)} className="text-left text-sm font-semibold text-gray-900 hover:text-primary-700 hover:underline">
                              {item.title}
                            </button>
                            <p className="truncate text-xs text-gray-500">
                              {item.kind === 'LINK' ? hostOf(item.url) : [item.file_name, formatSize(item.file_size)].filter(Boolean).join(' · ')}
                            </p>
                            {item.note && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{item.note}</p>}
                            <p className="mt-1 text-xs text-gray-400">
                              Cập nhật {formatDateTime(item.updated_at)}{item.updated_by_name ? ` · ${item.updated_by_name}` : ''}
                            </p>
                            {item.view_count !== undefined && (
                              <div className="mt-1">
                                <button onClick={() => setOpenViews(openViews === item.id ? null : item.id)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                  <EyeIcon className="h-3.5 w-3.5" /> {item.view_count} lượt mở
                                </button>
                                {openViews === item.id && (item.recent_views?.length ?? 0) > 0 && (
                                  <ul className="mt-1 space-y-0.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    {item.recent_views!.map((v, i) => (
                                      <li key={i}>{v.name || '—'} · {formatDateTime(v.viewed_at)}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-1 pl-12 sm:pl-0">
                          <button onClick={() => openItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Mở
                          </button>
                          {detail.can_manage && (
                            <>
                              <button onClick={() => setEditor({ mode: item.kind === 'LINK' ? 'link' : 'file', item })}
                                aria-label="Sửa" title="Sửa"
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50">
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => removeItem(item)} aria-label="Xoá" title="Xoá"
                                className="rounded-lg border border-gray-200 p-1.5 text-red-600 hover:bg-red-50">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editor && selectedId && <ItemEditor departmentId={selectedId} state={editor} onClose={closeEditor} />}
      {showDirectors && <DirectorsModal onClose={() => { setShowDirectors(false); loadList(); }} />}
    </div>
  );
}
