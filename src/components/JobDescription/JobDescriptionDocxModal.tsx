import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, CheckCircleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  DepartmentRef,
  DocxPosition,
  errorMessage,
  jobDescriptionService,
} from '../../services/jobDescription.service';

/**
 * "Thêm từ Word" (HCNS SK 2026-11-17): đọc thẳng các bảng trong file .docx mô tả công việc (không AI),
 * mỗi vị trí thành một BẢN NHÁP. Chọn cơ sở (vd CS Xã Đàn) thì tạo bản RIÊNG của cơ sở đó — tên
 * "Lễ tân – CS Xã Đàn", gắn cùng các vị trí với bản chung "Lễ tân"; nhân viên cơ sở đó theo bản riêng,
 * cơ sở chưa có bản riêng vẫn theo bản chung. Vị trí đã có bản thì có thể cập nhật bản nháp của bản đó
 * (bản đã công bố không đổi cho tới khi HCNS bấm Công bố). Backend: POST /job-descriptions/from-docx/.
 */

type RowState = 'idle' | 'saving' | 'done' | 'error';
type Row = DocxPosition & { name: string; checked: boolean; state: RowState; message?: string; savedId?: number };

const JobDescriptionDocxModal: React.FC<{ onClose: (changed: boolean) => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [readFor, setReadFor] = useState<number | '' | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [phase, setPhase] = useState<'pick' | 'reading' | 'choose' | 'saving' | 'done'>('pick');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobDescriptionService.options().then((o) => setDepartments(o.departments || [])).catch(() => { });
  }, []);

  const busy = phase === 'reading' || phase === 'saving';
  const doneCount = rows.filter((r) => r.state === 'done').length;
  const selected = rows.filter((r) => r.checked && r.state !== 'done' && r.name.trim());
  const stale = file && readFor !== null && readFor !== departmentId;

  const read = async (picked: File, dept: number | '') => {
    setError(null);
    setRows([]);
    setPhase('reading');
    try {
      const data = await jobDescriptionService.fromDocx(picked, dept || null);
      setRows(data.positions.map((p) => ({ ...p, name: p.title, checked: !p.existing, state: 'idle' })));
      setReadFor(dept);
      setPhase('choose');
    } catch (err) {
      setError(errorMessage(err, 'Không đọc được file Word'));
      setPhase('pick');
    }
  };

  const choose = (list: FileList | null) => {
    const picked = list?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!picked) return;
    setFile(picked);
    read(picked, departmentId);
  };

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const save = async () => {
    setPhase('saving');
    setError(null);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.checked || row.state === 'done' || !row.name.trim()) continue;
      update(i, { state: 'saving', message: undefined });
      try {
        let id: number;
        if (row.existing) {
          id = (await jobDescriptionService.update(row.existing.id, { draft_content: row.content })).id;
        } else {
          id = (await jobDescriptionService.create({
            title: row.name.trim(),
            code: row.code,
            draft_content: row.content,
            ...(departmentId
              ? { department_ids: [departmentId], position_ids: row.positions.map((p) => p.id) }
              : {}),  // dùng chung: backend tự gắn vị trí trùng tên
          })).id;
        }
        update(i, { state: 'done', savedId: id, checked: false });
      } catch (err) {
        update(i, { state: 'error', message: errorMessage(err, 'Không lưu được bản nháp') });
      }
    }
    setPhase('done');
  };

  const deptName = departments.find((d) => d.id === departmentId)?.name;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Thêm mô tả công việc từ file Word</h3>
            <p className="mt-1 text-xs text-gray-500">
              Đọc thẳng các bảng trong file .docx (không dùng AI). Mỗi vị trí thành một <b>bản nháp</b>; nhân viên chưa
              thấy cho tới khi HCNS rà lại và bấm công bố.
            </p>
          </div>
          <button onClick={() => onClose(doneCount > 0)} disabled={busy} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b px-5 py-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Áp dụng cho</label>
            <select value={departmentId} disabled={busy}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Dùng chung mọi phòng ban (không chọn cơ sở)</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {departmentId
                ? `Tạo bản riêng của ${deptName}: nhân viên cơ sở này theo bản riêng, nơi khác vẫn theo bản chung.`
                : 'File của từng cơ sở (vd CS HHH, CS Xã Đàn) nên chọn đúng cơ sở để tạo bản riêng.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => choose(e.target.files)}
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            <button onClick={() => inputRef.current?.click()} disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <ArrowUpTrayIcon className="h-4 w-4" /> {file ? 'Chọn file khác' : 'Chọn file Word (.docx)'}
            </button>
            {file && (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-gray-600">
                <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{file.name}</span>
              </span>
            )}
            {stale && !busy && (
              <button onClick={() => file && read(file, departmentId)}
                className="text-sm font-semibold text-primary-700 hover:underline">Đọc lại theo lựa chọn mới</button>
            )}
          </div>
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        <div className="flex-1 overflow-auto px-5 py-3">
          {phase === 'pick' && !error && (
            <p className="py-8 text-center text-sm text-gray-500">Chọn cơ sở áp dụng (nếu có) rồi chọn file Word.</p>
          )}
          {phase === 'reading' && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              Đang đọc file...
            </div>
          )}
          {rows.length > 0 && (
            <>
              <p className="mb-2 text-sm text-gray-700">Tìm thấy <b>{rows.length}</b> vị trí. Chọn vị trí cần lưu, sửa tên nếu muốn.</p>
              <ul className="space-y-2">
                {rows.map((r, i) => (
                  <li key={`${r.code}-${i}`}
                    className={`rounded-xl border px-3 py-2.5 ${r.state === 'done' ? 'border-emerald-200 bg-emerald-50/60'
                      : r.state === 'error' ? 'border-red-200 bg-red-50/60' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-2 rounded border-gray-300" checked={r.checked}
                        disabled={busy || r.state === 'done'} onChange={(e) => update(i, { checked: e.target.checked })} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <input value={r.name} disabled={busy || r.state === 'done' || !!r.existing}
                            onChange={(e) => update(i, { name: e.target.value })}
                            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-transparent disabled:border-transparent" />
                          <span className="text-xs text-gray-400">KPI {r.kpi_total}%</span>
                        </div>
                        {r.state !== 'done' && (r.existing ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Đã có bản "{r.existing.title}"{r.existing.published ? ' (đã công bố)' : ' (nháp)'}. Tích chọn để
                            <b> cập nhật bản nháp</b> của bản đó theo file — bản đang công bố không đổi cho tới khi bấm Công bố.
                          </p>
                        ) : r.positions.length > 0 ? (
                          <p className="mt-1 text-xs text-primary-700">Sẽ gắn vị trí: {r.positions.map((p) => p.title).join(', ')}</p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-700">
                            {departmentId
                              ? (r.base ? `Bản chung "${r.base.title}" chưa gắn vị trí nào — ` : 'Chưa có bản chung cùng tên để lấy vị trí — ')
                              : 'Chưa có vị trí HRM nào trùng tên — '}
                            gắn vị trí sau khi tạo.
                          </p>
                        ))}
                        {r.notes.length > 0 && r.state !== 'done' && <p className="mt-0.5 text-xs text-gray-500">{r.notes.join(' ')}</p>}
                        {r.publish_errors.length > 0 && r.state !== 'done' && (
                          <p className="mt-0.5 text-xs text-red-600">Cần sửa trước khi công bố: {r.publish_errors.join(' ')}</p>
                        )}
                        {r.state === 'saving' && <p className="mt-1 text-xs text-gray-600">Đang lưu...</p>}
                        {r.state === 'error' && <p className="mt-1 text-xs text-red-600">{r.message}</p>}
                        {r.state === 'done' && (
                          <div className="mt-1 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircleIcon className="h-4 w-4" /> {r.existing ? 'Đã cập nhật bản nháp' : 'Đã tạo bản nháp'}
                            </span>
                            <button onClick={() => navigate(`/dashboard/job-descriptions/${r.savedId}`)}
                              className="ml-2 font-semibold text-primary-700 hover:underline">Mở để rà lại →</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4">
          {doneCount > 0 && !busy && <span className="mr-auto text-sm text-emerald-700">Đã lưu {doneCount} bản nháp.</span>}
          <button onClick={() => onClose(doneCount > 0)} disabled={busy} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">
            Đóng
          </button>
          <button onClick={save} disabled={busy || !!stale || selected.length === 0}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {phase === 'saving' ? 'Đang lưu...' : `Lưu ${selected.length} bản nháp`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default JobDescriptionDocxModal;
