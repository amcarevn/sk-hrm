import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import JobDescriptionContent from '../components/JobDescription/JobDescriptionContent';
import {
  AckReport,
  DUTY_LABELS,
  DutyFrequency,
  JobContent,
  JobDescriptionDetail,
  Options,
  emptyContent,
  errorMessage,
  jobDescriptionService,
  kpiTotal,
} from '../services/jobDescription.service';
import { statusBadge } from './JobDescriptionList';

/**
 * Soạn / công bố một bản mô tả công việc (Admin/HCNS).
 * - Soạn nội dung theo 6 khối, "Lưu nháp" bất cứ lúc nào; nhân viên chưa thấy bản nháp.
 * - "Công bố" tạo phiên bản mới (tổng KPI phải = 100%); nhân viên phải xác nhận lại.
 */

type Tab = 'content' | 'mapping' | 'acks' | 'history';
const FREQS = Object.keys(DUTY_LABELS) as DutyFrequency[];

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    {children}{hint && <span className="font-normal text-gray-400"> — {hint}</span>}
  </label>
);

const Card: React.FC<{ title: string; children: React.ReactNode; tone?: 'default' | 'private' }> = ({ title, children, tone = 'default' }) => (
  <section className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 space-y-3 ${tone === 'private' ? 'border-amber-200' : 'border-gray-100'}`}>
    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
    {children}
  </section>
);

const JobDescriptionEdit: React.FC = () => {
  const { id } = useParams();
  const jdId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<JobDescriptionDetail | null>(null);
  const [draft, setDraft] = useState<JobContent>(emptyContent());
  const [dutyText, setDutyText] = useState<Record<DutyFrequency, string>>({ daily: '', weekly: '', monthly: '' });
  const [meta, setMeta] = useState({ title: '', code: '', is_active: true });
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [documentIds, setDocumentIds] = useState<number[]>([]);
  const [options, setOptions] = useState<Options | null>(null);
  const [acks, setAcks] = useState<AckReport | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [openVersion, setOpenVersion] = useState<number | null>(null);

  const applyDetail = (d: JobDescriptionDetail) => {
    setDetail(d);
    const base = emptyContent();
    setDraft({ ...base, ...d.draft_content, compensation: d.draft_content.compensation || base.compensation });
    setDutyText({
      daily: (d.draft_content.duties?.daily || []).join('\n'),
      weekly: (d.draft_content.duties?.weekly || []).join('\n'),
      monthly: (d.draft_content.duties?.monthly || []).join('\n'),
    });
    setMeta({ title: d.title, code: d.code, is_active: d.is_active });
    setPositionIds(d.positions.map((p) => p.id));
    setDocumentIds(d.documents.map((x) => x.id));
    setDirty(false);
  };

  useEffect(() => {
    jobDescriptionService.get(jdId).then(applyDetail).catch((err) => setError(errorMessage(err, 'Không tải được mô tả công việc')));
    jobDescriptionService.options().then(setOptions).catch(() => { });
  }, [jdId]);

  useEffect(() => {
    if (tab === 'acks' && detail?.current_version) {
      jobDescriptionService.acknowledgements(jdId).then(setAcks).catch((err) => setError(errorMessage(err, 'Không tải được danh sách xác nhận')));
    }
  }, [tab, jdId, detail?.current_version?.id]);

  const content: JobContent = useMemo(() => ({
    ...draft,
    duties: { daily: lines(dutyText.daily), weekly: lines(dutyText.weekly), monthly: lines(dutyText.monthly) },
  }), [draft, dutyText]);
  const total = kpiTotal(draft.kpis);

  const edit = (fn: (c: JobContent) => JobContent) => { setDraft((c) => fn(c)); setDirty(true); setNotice(null); };
  const setGov = (key: keyof JobContent['governance'], value: string) => edit((c) => ({ ...c, governance: { ...c.governance, [key]: value } }));

  const save = async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      applyDetail(await jobDescriptionService.update(jdId, {
        ...meta, position_ids: positionIds, document_ids: documentIds, draft_content: content,
      }));
      setNotice('Đã lưu bản nháp. Nhân viên chưa thấy thay đổi cho tới khi bấm "Công bố".');
      return true;
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (dirty && !(await save())) return;
    setBusy(true);
    setError(null);
    try {
      const d = await jobDescriptionService.publish(jdId, changeNote);
      applyDetail(d);
      setPublishOpen(false);
      setChangeNote('');
      setAcks(null);
      setNotice(`Đã công bố phiên bản ${d.current_version?.version}. Nhân viên ở các vị trí áp dụng cần vào "Công việc của tôi" để xác nhận.`);
    } catch (err) {
      setError(errorMessage(err, 'Không công bố được'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xoá bản mô tả "${meta.title}"? Bản này chưa công bố nên xoá được.`)) return;
    try {
      await jobDescriptionService.remove(jdId);
      navigate('/dashboard/job-descriptions');
    } catch (err) {
      setError(errorMessage(err, 'Không xoá được'));
    }
  };

  const toggle = (list: number[], value: number, setter: (v: number[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setDirty(true);
    setNotice(null);
  };

  if (!detail) {
    return <div className="text-sm text-gray-500">{error || 'Đang tải...'}</div>;
  }

  const filteredPositions = (options?.positions || []).filter((p) =>
    !positionSearch.trim() || `${p.title} ${p.code}`.toLowerCase().includes(positionSearch.trim().toLowerCase()));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'Soạn nội dung' },
    { key: 'mapping', label: `Vị trí & tài liệu (${positionIds.length})` },
    { key: 'acks', label: 'Xác nhận của nhân viên' },
    { key: 'history', label: `Lịch sử phiên bản (${detail.versions.length})` },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      <button onClick={() => navigate('/dashboard/job-descriptions')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeftIcon className="h-4 w-4" /> Danh sách mô tả công việc
      </button>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{detail.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
            {statusBadge({ ...detail, has_unpublished_changes: detail.has_unpublished_changes || dirty })}
            {detail.current_version && <span>công bố {fmt(detail.current_version.published_at)}</span>}
            {detail.draft_updated_at && <span>· nháp sửa {fmt(detail.draft_updated_at)}{detail.draft_updated_by_name ? ` bởi ${detail.draft_updated_by_name}` : ''}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!detail.current_version && (
            <button onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50">
              <TrashIcon className="h-4 w-4" /> Xoá
            </button>
          )}
          <button onClick={save} disabled={busy || !dirty}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Lưu nháp
          </button>
          <button onClick={() => { setPublishOpen(true); setError(null); }} disabled={busy || (!dirty && !detail.has_unpublished_changes)}
            title={!dirty && !detail.has_unpublished_changes ? 'Không có thay đổi để công bố' : ''}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
            Công bố
          </button>
        </div>
      </div>

      {notice && <p className="text-sm text-emerald-800 bg-emerald-50 rounded-xl p-3">{notice}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{error}</p>}
      {!dirty && detail.publish_errors.length > 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">
          <p className="font-semibold">Cần sửa trước khi công bố:</p>
          <ul className="list-disc ml-5">{detail.publish_errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      {publishOpen && (
        <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-4 space-y-3">
          <p className="text-sm text-gray-800">
            Công bố thành <b>phiên bản {(detail.current_version?.version || 0) + 1}</b>. Nhân viên ở{' '}
            {positionIds.length} vị trí áp dụng sẽ thấy bản này và phải xác nhận lại.
            {dirty && ' Các thay đổi chưa lưu sẽ được lưu trước.'}
          </p>
          {total !== 100 && <p className="text-sm text-red-600">Tổng trọng số KPI đang là {total}% — phải bằng 100% mới công bố được.</p>}
          <div>
            <Label hint="nhân viên sẽ thấy dòng này">Nội dung thay đổi</Label>
            <input value={changeNote} onChange={(e) => setChangeNote(e.target.value)} className={inputCls}
              placeholder={detail.current_version ? 'Vd: Bổ sung chế tài phạt, sửa KPI tỷ lệ chốt' : 'Bản đầu tiên'} />
          </div>
          <div className="flex gap-2">
            <button onClick={publish} disabled={busy} className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
              {busy ? 'Đang công bố...' : 'Xác nhận công bố'}
            </button>
            <button onClick={() => setPublishOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Huỷ</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
              {preview ? <><PencilSquareIcon className="h-4 w-4" /> Quay lại soạn</> : <><EyeIcon className="h-4 w-4" /> Xem như nhân viên thấy</>}
            </button>
          </div>

          {preview ? <JobDescriptionContent content={content} /> : (
            <>
              <Card title="1. Quản trị">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><Label>Quản lý trực tiếp</Label><input className={inputCls} value={draft.governance.direct_manager} onChange={(e) => setGov('direct_manager', e.target.value)} /></div>
                  <div><Label>Báo cáo trực tiếp</Label><input className={inputCls} value={draft.governance.reports_to} onChange={(e) => setGov('reports_to', e.target.value)} /></div>
                  <div><Label>Phòng ban tương tác</Label><input className={inputCls} value={draft.governance.interacts_with} onChange={(e) => setGov('interacts_with', e.target.value)} /></div>
                </div>
                <div><Label>Giới hạn quyền hạn</Label><textarea rows={3} className={inputCls} value={draft.governance.authority_limits} onChange={(e) => setGov('authority_limits', e.target.value)} /></div>
              </Card>

              <Card title="2. Phân luồng công việc & đầu mối phối hợp">
                {draft.workflows.map((w, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">{i + 1}.</span>
                      <input className={inputCls} placeholder="Tên công việc, vd Tiếp đón Check-in" value={w.name}
                        onChange={(e) => edit((c) => ({ ...c, workflows: c.workflows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                      <button onClick={() => edit((c) => ({ ...c, workflows: c.workflows.filter((_, j) => j !== i) }))} className="p-2 text-gray-400 hover:text-red-600" title="Xoá dòng">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea rows={2} className={inputCls} placeholder="Phạm vi chuyên môn" value={w.scope}
                      onChange={(e) => edit((c) => ({ ...c, workflows: c.workflows.map((x, j) => (j === i ? { ...x, scope: e.target.value } : x)) }))} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="Vị trí phối hợp trực tiếp" value={w.coordinate_with}
                        onChange={(e) => edit((c) => ({ ...c, workflows: c.workflows.map((x, j) => (j === i ? { ...x, coordinate_with: e.target.value } : x)) }))} />
                      <input className={inputCls} placeholder="Dữ liệu / sản phẩm" value={w.outputs}
                        onChange={(e) => edit((c) => ({ ...c, workflows: c.workflows.map((x, j) => (j === i ? { ...x, outputs: e.target.value } : x)) }))} />
                    </div>
                  </div>
                ))}
                <button onClick={() => edit((c) => ({ ...c, workflows: [...c.workflows, { name: '', scope: '', coordinate_with: '', outputs: '' }] }))}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700"><PlusIcon className="h-4 w-4" /> Thêm công việc</button>
              </Card>

              <Card title="3. Nhiệm vụ theo tần suất">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FREQS.map((f) => (
                    <div key={f}>
                      <Label hint="mỗi dòng một nhiệm vụ">{DUTY_LABELS[f]}</Label>
                      <textarea rows={7} className={inputCls} value={dutyText[f]}
                        onChange={(e) => { setDutyText((t) => ({ ...t, [f]: e.target.value })); setDirty(true); setNotice(null); }} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="4. Kiến thức chuyên môn & đào tạo">
                <div><Label>Kiến thức / kỹ năng cốt lõi bắt buộc</Label>
                  <textarea rows={3} className={inputCls} value={draft.knowledge.core_skills}
                    onChange={(e) => edit((c) => ({ ...c, knowledge: { ...c.knowledge, core_skills: e.target.value } }))} /></div>
                <div><Label>Người phụ trách đào tạo trực tiếp</Label>
                  <input className={inputCls} value={draft.knowledge.trainer}
                    onChange={(e) => edit((c) => ({ ...c, knowledge: { ...c.knowledge, trainer: e.target.value } }))} /></div>
              </Card>

              <Card title="5. Lương, thưởng KPI & kỷ luật — chỉ HCNS / Admin thấy" tone="private">
                <p className="text-xs text-amber-700">Nhân viên không thấy khối này ở "Công việc của tôi".</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([['base_salary', 'Lương cứng'], ['bonus', 'Cơ chế thưởng doanh số / KPI'], ['penalties', 'Chế tài phạt']] as const).map(([key, label]) => (
                    <div key={key}><Label>{label}</Label>
                      <textarea rows={3} className={inputCls} value={draft.compensation?.[key] || ''}
                        onChange={(e) => edit((c) => ({ ...c, compensation: { ...(c.compensation || emptyContent().compensation!), [key]: e.target.value } }))} /></div>
                  ))}
                </div>
              </Card>

              <Card title="6. Khung đánh giá KPI cuối tháng">
                {draft.kpis.map((k, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500 w-5">{i + 1}.</span>
                    <input className={inputCls} placeholder="Tiêu chí đánh giá" value={k.criterion}
                      onChange={(e) => edit((c) => ({ ...c, kpis: c.kpis.map((x, j) => (j === i ? { ...x, criterion: e.target.value } : x)) }))} />
                    <div className="relative w-24 flex-shrink-0">
                      <input className={`${inputCls} pr-7 text-right`} inputMode="decimal" value={k.weight ?? ''}
                        onChange={(e) => edit((c) => ({ ...c, kpis: c.kpis.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                    </div>
                    <button onClick={() => edit((c) => ({ ...c, kpis: c.kpis.filter((_, j) => j !== i) }))} className="p-2 text-gray-400 hover:text-red-600" title="Xoá dòng">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={() => edit((c) => ({ ...c, kpis: [...c.kpis, { criterion: '', weight: '' }] }))}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700"><PlusIcon className="h-4 w-4" /> Thêm tiêu chí</button>
                  <span className={`text-sm font-bold ${total === 100 ? 'text-emerald-600' : 'text-red-600'}`}>Tổng: {total}% {total !== 100 && '(phải bằng 100%)'}</span>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="space-y-4">
          <Card title="Thông tin chung">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2"><Label>Tên vị trí / nhóm vị trí</Label>
                <input className={inputCls} value={meta.title} onChange={(e) => { setMeta((m) => ({ ...m, title: e.target.value })); setDirty(true); }} /></div>
              <div><Label hint="chữ không dấu">Mã</Label>
                <input className={`${inputCls} font-mono`} value={meta.code} onChange={(e) => { setMeta((m) => ({ ...m, code: e.target.value })); setDirty(true); }} /></div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded border-gray-300" checked={meta.is_active}
                onChange={(e) => { setMeta((m) => ({ ...m, is_active: e.target.checked })); setDirty(true); }} />
              Đang dùng (bỏ chọn để ngừng áp dụng, nhân viên sẽ không thấy nữa)
            </label>
          </Card>

          <Card title="Vị trí áp dụng trên HRM">
            <p className="text-xs text-gray-500">Nhân viên đang giữ các vị trí được chọn sẽ thấy bản mô tả này. Mỗi vị trí chỉ theo một bản.</p>
            <input className={inputCls} placeholder="Tìm vị trí" value={positionSearch} onChange={(e) => setPositionSearch(e.target.value)} />
            <div className="max-h-80 overflow-auto divide-y divide-gray-50 border border-gray-100 rounded-xl">
              {filteredPositions.map((p) => {
                const takenBy = p.job_description && p.job_description.id !== jdId ? p.job_description : null;
                return (
                  <label key={p.id} className={`flex items-center gap-2 px-3 py-2 text-sm ${takenBy ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input type="checkbox" className="rounded border-gray-300" disabled={!!takenBy}
                      checked={positionIds.includes(p.id)} onChange={() => toggle(positionIds, p.id, setPositionIds)} />
                    <span className="flex-1">{p.title} <span className="text-xs font-mono text-gray-400">{p.code}</span></span>
                    {takenBy && <span className="text-xs text-gray-500">đang theo "{takenBy.title}"</span>}
                  </label>
                );
              })}
              {options && filteredPositions.length === 0 && <p className="px-3 py-4 text-sm text-gray-400">Không có vị trí phù hợp.</p>}
            </div>
          </Card>

          <Card title="Tài liệu chuyên môn liên quan">
            <p className="text-xs text-gray-500">
              Lấy từ "Tài liệu công ty" (kịch bản, bảng giá, quy trình...). Nhân viên chỉ thấy tài liệu đã công bố và còn hiệu lực.
            </p>
            <div className="max-h-80 overflow-auto divide-y divide-gray-50 border border-gray-100 rounded-xl">
              {(options?.documents || []).map((d) => (
                <label key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" checked={documentIds.includes(d.id)}
                    onChange={() => toggle(documentIds, d.id, setDocumentIds)} />
                  <span className="flex-1">{d.title} <span className="text-xs text-gray-400">{d.document_type_display}</span></span>
                  {!d.is_current && <span className="text-xs text-amber-700">{d.status_display} · nhân viên chưa thấy</span>}
                </label>
              ))}
              {options && options.documents.length === 0 && <p className="px-3 py-4 text-sm text-gray-400">Chưa có tài liệu công ty nào.</p>}
            </div>
          </Card>
          <p className="text-xs text-gray-500">Thay đổi vị trí và tài liệu có hiệu lực ngay khi bấm "Lưu nháp", không cần công bố lại.</p>
        </div>
      )}

      {tab === 'acks' && (
        !detail.current_version ? <p className="text-sm text-gray-500">Chưa công bố phiên bản nào.</p> : (
          <div className="space-y-3">
            {acks && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400 uppercase">Nhân viên áp dụng</p><p className="text-2xl font-extrabold">{acks.total}</p></div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400 uppercase">Đã xác nhận v{acks.version?.version}</p><p className="text-2xl font-extrabold text-emerald-600">{acks.acknowledged}</p></div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400 uppercase">Chưa xác nhận</p><p className="text-2xl font-extrabold text-amber-600">{acks.pending}</p></div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-3 py-3">Mã NV</th><th className="text-left px-3 py-3">Họ và tên</th>
                    <th className="text-left px-3 py-3">Vị trí</th><th className="text-left px-3 py-3">Phòng ban</th>
                    <th className="text-left px-3 py-3">Xác nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!acks && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Đang tải...</td></tr>}
                  {acks && acks.results.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Chưa có nhân viên nào ở các vị trí áp dụng.</td></tr>}
                  {acks?.results.map((r) => (
                    <tr key={r.employee.id}>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.employee.employee_id}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{r.employee.full_name}</td>
                      <td className="px-3 py-2.5 text-gray-600">{r.employee.position_title || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600">{r.employee.department_name || '—'}</td>
                      <td className="px-3 py-2.5">
                        {r.acknowledged_at
                          ? <span className="text-emerald-700">✓ {fmt(r.acknowledged_at)}</span>
                          : <span className="text-amber-700">Chưa{r.acknowledged_older_version ? ' (đã xác nhận bản cũ)' : ''}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === 'history' && (
        detail.versions.length === 0 ? <p className="text-sm text-gray-500">Chưa công bố phiên bản nào.</p> : (
          <div className="space-y-2">
            {detail.versions.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <button onClick={() => setOpenVersion(openVersion === v.id ? null : v.id)} className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-900">Phiên bản {v.version}</span>
                  <span className="text-sm text-gray-500">{fmt(v.published_at)}{v.published_by_name ? ` · ${v.published_by_name}` : ''}</span>
                  {v.change_note && <span className="text-sm text-gray-600">· {v.change_note}</span>}
                  <span className="ml-auto text-sm text-primary-700">{openVersion === v.id ? 'Thu gọn' : 'Xem'}</span>
                </button>
                {openVersion === v.id && <div className="px-4 pb-4"><JobDescriptionContent content={v.content} showCompensation /></div>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default JobDescriptionEdit;
