import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseIcon, DocumentArrowUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import JobDescriptionPdfModal from '../components/JobDescription/JobDescriptionPdfModal';
import { JobDescriptionItem, errorMessage, jobDescriptionService } from '../services/jobDescription.service';

/**
 * Mô tả công việc theo vị trí — danh sách cho Admin/HCNS.
 * Mỗi bản gắn với các vị trí trên HRM; công bố xong nhân viên thấy ở "Công việc của tôi".
 */

export const statusBadge = (jd: Pick<JobDescriptionItem, 'is_active' | 'current_version' | 'has_unpublished_changes'>) => {
  if (!jd.is_active) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Ngừng dùng</span>;
  if (!jd.current_version) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Nháp · chưa công bố</span>;
  if (jd.has_unpublished_changes) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">v{jd.current_version.version} · có sửa chưa công bố</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Đã công bố v{jd.current_version.version}</span>;
};

/**
 * Hỏi xác nhận rồi xoá 1 bản mô tả (HCNS SK 2026-11-11: xoá được cả bản đã công bố). Đã có nhân viên
 * xác nhận đọc thì hỏi lần 2, ghi rõ số lượt xác nhận sẽ mất. true = đã xoá; lỗi khác thì throw.
 */
export const confirmDeleteJobDescription = async (
  jd: Pick<JobDescriptionItem, 'id' | 'title' | 'current_version' | 'employee_count'>,
): Promise<boolean> => {
  const intro = jd.current_version
    ? `Bản "${jd.title}" đã công bố v${jd.current_version.version}`
      + `${jd.employee_count ? `, đang áp dụng cho ${jd.employee_count} nhân viên` : ''}. Xoá thì nhân viên không còn thấy bản này.`
    : `Xoá bản nháp "${jd.title}"?`;
  if (!window.confirm(`${intro}\n\nXoá vĩnh viễn, không khôi phục được. Tiếp tục?`)) return false;
  try {
    await jobDescriptionService.remove(jd.id);
  } catch (err: any) {
    const data = err?.response?.data;
    if (data?.code !== 'has_acknowledgements') throw err;
    if (!window.confirm(`${data.detail}\n\nVẫn xoá, kể cả ${data.acknowledgement_count} lượt xác nhận?`)) return false;
    await jobDescriptionService.remove(jd.id, true);
  }
  return true;
};

const JobDescriptionList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<JobDescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const remove = async (jd: JobDescriptionItem) => {
    setError(null);
    setDeletingId(jd.id);
    try {
      if (await confirmDeleteJobDescription(jd)) setItems((prev) => prev.filter((x) => x.id !== jd.id));
    } catch (err) {
      setError(errorMessage(err, 'Không xoá được mô tả công việc'));
    } finally {
      setDeletingId(null);
    }
  };

  const load = () => {
    jobDescriptionService.list()
      .then(setItems)
      .catch((err) => setError(errorMessage(err, 'Không tải được danh sách')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const jd = await jobDescriptionService.create({ title: newTitle.trim() });
      navigate(`/dashboard/job-descriptions/${jd.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Không tạo được mô tả công việc'));
      setCreating(false);
    }
  };

  const unmappedCount = items.filter((jd) => jd.is_active && jd.positions.length === 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <BriefcaseIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Mô tả công việc theo vị trí</h1>
          <p className="text-sm text-gray-500">
            Soạn, công bố và theo dõi nhân viên đã xác nhận đọc. Phần lương / thưởng / phạt chỉ HCNS và Admin thấy.
          </p>
        </div>
        <form onSubmit={create} className="flex gap-2 w-full sm:w-auto">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Tên vị trí mới, vd Bảo vệ"
            className="flex-1 sm:w-56 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="submit" disabled={!newTitle.trim() || creating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
            <PlusIcon className="h-4 w-4" /> Thêm
          </button>
          <button type="button" onClick={() => setShowPdf(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <DocumentArrowUpIcon className="h-4 w-4" /> Thêm từ PDF
          </button>
        </form>
      </div>

      {unmappedCount > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">
          {unmappedCount} bản mô tả chưa gắn vị trí nào trên HRM nên chưa nhân viên nào thấy. Mở từng bản, vào tab
          "Vị trí & tài liệu" để gắn.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Mô tả công việc</th>
              <th className="text-left px-4 py-3">Vị trí áp dụng</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Trạng thái</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Đã xác nhận</th>
              <th className="px-2 py-3"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa có mô tả công việc nào.</td></tr>
            )}
            {items.map((jd) => {
              const pct = jd.employee_count ? Math.round((jd.acknowledged_count / jd.employee_count) * 100) : 0;
              return (
                <tr key={jd.id} onClick={() => navigate(`/dashboard/job-descriptions/${jd.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{jd.title}</p>
                    <p className="text-xs font-mono text-gray-400">{jd.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    {jd.positions.length ? (
                      <div className="flex flex-wrap gap-1">
                        {jd.positions.map((p) => (
                          <span key={p.id} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs">{p.title}</span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-amber-700">Chưa gắn vị trí</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{statusBadge(jd)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {jd.current_version ? (
                      <div className="w-36">
                        <p className="text-xs text-gray-600">{jd.acknowledged_count}/{jd.employee_count} nhân viên</p>
                        <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); remove(jd); }} disabled={deletingId === jd.id}
                      title="Xoá mô tả công việc" aria-label={`Xoá ${jd.title}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPdf && (
        <JobDescriptionPdfModal onClose={(created) => { setShowPdf(false); if (created) load(); }} />
      )}
    </div>
  );
};

export default JobDescriptionList;
