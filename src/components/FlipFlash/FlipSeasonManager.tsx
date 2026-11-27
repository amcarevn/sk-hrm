import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  type FlipConfig,
  type FlipSeason,
  type FlipSeasonInput,
  flipErrorMessage,
  flipFlashService,
  formatDay,
} from '../../services/flipFlash.service';

/** Admin / HCNS: tạo / sửa / xoá đợt Flip Flash. Mọi kiểm tra (thứ Hai, trùng lịch, số thẻ) do backend làm. */

const EMPTY: FlipSeasonInput = { name: '', start_date: '', rows: 6, cols: 6, note: '' };

const FlipSeasonManager: React.FC<{ config: FlipConfig | null; onClose: (changed: boolean) => void }> = ({ config, onClose }) => {
  const [seasons, setSeasons] = useState<FlipSeason[]>([]);
  const [editing, setEditing] = useState<{ id?: number; form: FlipSeasonInput } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const load = () => {
    flipFlashService.seasons().then(setSeasons).catch((err) => setError(flipErrorMessage(err, 'Không tải được danh sách đợt')));
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await flipFlashService.saveSeason(editing.form, editing.id);
      setEditing(null);
      setChanged(true);
      load();
    } catch (err) {
      setError(flipErrorMessage(err, 'Không lưu được đợt'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: FlipSeason) => {
    if (!window.confirm(`Xoá đợt "${s.name}"?`)) return;
    try {
      await flipFlashService.deleteSeason(s.id);
      setChanged(true);
      load();
    } catch (err) {
      setError(flipErrorMessage(err, 'Không xoá được đợt'));
    }
  };

  const set = (patch: Partial<FlipSeasonInput>) => editing && setEditing({ ...editing, form: { ...editing.form, ...patch } });
  const field = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const locked = !!editing?.id && (seasons.find((s) => s.id === editing.id)?.attempt_count || 0) > 0;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => onClose(changed)}>
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <h2 className="flex-1 text-base font-bold text-gray-900">Quản lý đợt Flip Flash</h2>
          <button onClick={() => onClose(changed)} className="p-1 rounded-lg hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Mỗi đợt 4 tuần tính từ ngày bắt đầu: Tuần 1–3 từ thứ Hai đến Chủ nhật, Tuần 4 từ thứ Hai đến thứ Bảy, và Vòng chung kết vào Chủ nhật của Tuần 4 cho những người thắng tuần.
            Không đổi được ngày bắt đầu / số thẻ khi đợt đã có người chơi.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {editing ? (
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <label className="block text-sm">
                <span className="font-semibold text-gray-700">Tên đợt</span>
                <input className={field} value={editing.form.name} placeholder="VD: Flip Flash tháng 12"
                  onChange={(e) => set({ name: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm col-span-2">
                  <span className="font-semibold text-gray-700">Ngày bắt đầu (thứ Hai)</span>
                  <input type="date" className={field} value={editing.form.start_date} disabled={locked}
                    onChange={(e) => set({ start_date: e.target.value })} />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold text-gray-700">Số hàng thẻ</span>
                  <input type="number" min={config?.min_side} max={config?.max_side} className={field} value={editing.form.rows} disabled={locked}
                    onChange={(e) => set({ rows: Number(e.target.value) })} />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold text-gray-700">Số cột thẻ</span>
                  <input type="number" min={config?.min_side} max={config?.max_side} className={field} value={editing.form.cols} disabled={locked}
                    onChange={(e) => set({ cols: Number(e.target.value) })} />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-semibold text-gray-700">Giải thưởng / ghi chú (hiện cho mọi người)</span>
                <textarea rows={2} className={field} value={editing.form.note}
                  onChange={(e) => set({ note: e.target.value })} />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setEditing(null); setError(null); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">Huỷ</button>
                <button onClick={save} disabled={busy}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                  {busy ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setEditing({ form: { ...EMPTY } }); setError(null); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700">
              <PlusIcon className="h-4 w-4" /> Tạo đợt mới
            </button>
          )}

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
            {seasons.length === 0 && <p className="p-4 text-sm text-gray-500">Chưa có đợt nào.</p>}
            {seasons.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDay(s.start_date)} – {formatDay(s.end_date, true)} · {s.rows}×{s.cols} thẻ · {s.attempt_count} lượt chơi
                  </div>
                </div>
                <button title="Sửa" onClick={() => {
                  setEditing({ id: s.id, form: { name: s.name, start_date: s.start_date, rows: s.rows, cols: s.cols, note: s.note } });
                  setError(null);
                }} className="p-1.5 rounded-lg hover:bg-gray-100"><PencilSquareIcon className="h-4 w-4 text-gray-500" /></button>
                {s.attempt_count === 0 && (
                  <button title="Xoá" onClick={() => remove(s)} className="p-1.5 rounded-lg hover:bg-red-50"><TrashIcon className="h-4 w-4 text-red-500" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FlipSeasonManager;
