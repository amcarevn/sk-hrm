import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  type YepEvent,
  type YepEventInput,
  type YepManageData,
  yepErrorMessage,
  yepService,
} from '../../services/yep.service';

/** Admin / HCNS: sửa thông tin sự kiện (trước đây sửa file event_config.py), xem danh sách đăng ký / văn nghệ, xuất Excel. */

type Tab = 'event' | 'registrations' | 'performances';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const toForm = (e: YepEvent) => ({
  name: e.name, short_name: e.short_name, year: e.year, company_name: e.company_name, company_address: e.company_address,
  event_date: e.event_date || '', event_time: e.event_time || '', venue_name: e.venue_name, venue_address: e.venue_address,
  venue_city: e.venue_city, dresscode: e.dresscode, registration_open: e.registration_open, open_to_staff: e.open_to_staff,
  cultural_prizes: Object.fromEntries(e.prizes.map((p) => [p.type, p.amount || ''])) as Record<string, string>,
});

const YepManager: React.FC<{ event: YepEvent; onClose: (changed: boolean) => void }> = ({ event, onClose }) => {
  const [tab, setTab] = useState<Tab>('event');
  const [form, setForm] = useState(() => toForm(event));
  const [data, setData] = useState<YepManageData | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [savedOpen, setSavedOpen] = useState(event.open_to_staff);

  const load = () => {
    yepService.manage().then(setData).catch((err) => setError(yepErrorMessage(err, 'Không tải được danh sách')));
  };
  useEffect(load, []);

  const save = async () => {
    if (form.open_to_staff && !savedOpen
      && !window.confirm('Mở trang YEP cho toàn bộ nhân viên? Nhân viên sẽ thấy menu "YEP – Year End Party" và đăng ký được.')) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: YepEventInput = { ...form, event_date: form.event_date || null, event_time: form.event_time || null };
      const saved = await yepService.updateEvent(payload);
      setForm(toForm(saved));
      setSavedOpen(saved.open_to_staff);
      setChanged(true);
      setNotice('Đã lưu thông tin sự kiện.');
    } catch (err) {
      setError(yepErrorMessage(err, 'Không lưu được'));
    } finally {
      setBusy(false);
    }
  };

  const exportExcel = async () => {
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await yepService.exportExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(yepErrorMessage(err, 'Không xuất được file Excel'));
    } finally {
      setBusy(false);
    }
  };

  const removePerformance = async (id: number, name: string) => {
    if (!window.confirm(`Xoá tiết mục "${name}"?`)) return;
    try {
      await yepService.deletePerformance(id);
      setChanged(true);
      load();
    } catch (err) {
      setError(yepErrorMessage(err, 'Không xoá được tiết mục'));
    }
  };

  const q = fold(query.trim());
  const regs = useMemo(() => (data?.registrations || []).filter((r) => !q
    || fold(`${r.lucky_number} ${r.employee_code} ${r.full_name} ${r.department}`).includes(q)), [data, q]);
  const perfs = useMemo(() => (data?.performances || []).filter((p) => !q
    || fold(`${p.employee_code} ${p.full_name} ${p.department} ${p.program_name}`).includes(q)), [data, q]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const field = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const label = 'block text-sm font-semibold text-gray-700';
  const th = 'py-2 pr-3 text-left text-[11px] uppercase tracking-wide text-gray-400 font-semibold whitespace-nowrap';
  const td = 'py-2 pr-3 align-top';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => onClose(changed)}>
      <div className="bg-white w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <h2 className="flex-1 text-base font-bold text-gray-900">Quản lý {event.short_name}</h2>
          <button onClick={() => onClose(changed)} className="p-1 rounded-lg hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="flex gap-1 px-5 pt-3 border-b border-gray-100 overflow-x-auto">
          {([['event', 'Thông tin sự kiện'], ['registrations', `Đăng ký (${data?.registrations.length ?? '…'})`],
            ['performances', `Văn nghệ (${data?.performances.length ?? '…'})`]] as [Tab, string][]).map(([key, text]) => (
            <button key={key} onClick={() => { setTab(key); setQuery(''); }}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {text}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}

          {tab === 'event' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Ô để trống sẽ hiện "Sẽ thông báo sau" trên trang và trên vé. Đếm ngược chỉ hiện khi có đủ ngày và giờ.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>Tên sự kiện<input className={field} value={form.name} onChange={(e) => set({ name: e.target.value })} /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={label}>Tên ngắn<input className={field} value={form.short_name} onChange={(e) => set({ short_name: e.target.value })} /></label>
                  <label className={label}>Năm<input type="number" className={field} value={form.year} onChange={(e) => set({ year: Number(e.target.value) })} /></label>
                </div>
                <label className={label}>Ngày tổ chức<input type="date" className={field} value={form.event_date} onChange={(e) => set({ event_date: e.target.value })} /></label>
                <label className={label}>Giờ bắt đầu<input type="time" className={field} value={form.event_time} onChange={(e) => set({ event_time: e.target.value })} /></label>
                <label className={label}>Địa điểm (tên ngắn, in trên vé)<input className={field} value={form.venue_name} onChange={(e) => set({ venue_name: e.target.value })} /></label>
                <label className={label}>Thành phố (in trên vé)<input className={field} value={form.venue_city} onChange={(e) => set({ venue_city: e.target.value })} /></label>
                <label className={`${label} sm:col-span-2`}>Địa chỉ địa điểm (trong thư mời)<input className={field} value={form.venue_address} onChange={(e) => set({ venue_address: e.target.value })} /></label>
                <label className={label}>Dresscode<input className={field} value={form.dresscode} onChange={(e) => set({ dresscode: e.target.value })} /></label>
                <label className={label}>Đơn vị tổ chức<input className={field} value={form.company_name} onChange={(e) => set({ company_name: e.target.value })} /></label>
                <label className={`${label} sm:col-span-2`}>Địa chỉ công ty (chân trang)<input className={field} value={form.company_address} onChange={(e) => set({ company_address: e.target.value })} /></label>
              </div>
              <div>
                <div className={label}>Giải thưởng văn nghệ</div>
                <div className="grid gap-3 sm:grid-cols-2 mt-1">
                  {event.prizes.map((p) => (
                    <label key={p.type} className="block text-xs text-gray-500">{p.label}
                      <input className={field} value={form.cultural_prizes[p.type] || ''} placeholder="VD: 2.000.000đ"
                        onChange={(e) => set({ cultural_prizes: { ...form.cultural_prizes, [p.type]: e.target.value } })} />
                    </label>
                  ))}
                </div>
              </div>
              <label className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${form.open_to_staff ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <input type="checkbox" checked={form.open_to_staff} onChange={(e) => set({ open_to_staff: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600" />
                <span>
                  <b className="text-gray-900">Mở trang YEP cho toàn bộ nhân viên</b>
                  <span className="block text-xs text-gray-600">
                    Tắt: chỉ Admin / HCNS thấy menu và trang (xem trước, chạy thử). Bật: mọi nhân viên thấy menu
                    "YEP – Year End Party" (nhân viên đang mở HRM cần tải lại trang).
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={form.registration_open} onChange={(e) => set({ registration_open: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                Đang mở đăng ký (tham dự + văn nghệ)
              </label>
              <div className="flex justify-end">
                <button onClick={save} disabled={busy}
                  className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                  {busy ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </div>
          )}

          {tab !== 'event' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã NV, tên, phòng ban... (không dấu cũng được)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={exportExcel} disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
              </button>
            </div>
          )}

          {tab === 'registrations' && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className={th}>Số</th><th className={th}>Nhân sự</th><th className={th}>Phòng ban</th>
                  <th className={th}>Vùng</th><th className={th}>Tham gia</th><th className={th}>Đăng ký lúc</th>
                </tr></thead>
                <tbody>
                  {regs.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className={`${td} font-mono font-bold text-[#B7791F]`}>{r.lucky_number}</td>
                      <td className={td}><div className="font-semibold text-gray-900">{r.full_name}</div><div className="text-xs text-gray-500">{r.employee_code}</div></td>
                      <td className={`${td} text-gray-600`}>{r.department || '—'}</td>
                      <td className={`${td} text-gray-600 whitespace-nowrap`}>{r.region_label}</td>
                      <td className={td}>
                        <span className={`text-xs font-semibold rounded px-1.5 py-0.5 ${r.participation === 'yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{r.participation_label}</span>
                      </td>
                      <td className={`${td} text-xs text-gray-500 whitespace-nowrap`}>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data && regs.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Chưa có đăng ký nào.</p>}
            </div>
          )}

          {tab === 'performances' && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className={th}>Tiết mục</th><th className={th}>Loại</th><th className={th}>Người đăng ký</th><th className={th}>Phòng ban</th><th className={th} />
                </tr></thead>
                <tbody>
                  {perfs.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className={`${td} font-semibold text-gray-900`}>{p.program_name}</td>
                      <td className={`${td} text-gray-600`}>{p.type_label}</td>
                      <td className={td}><div className="text-gray-900">{p.full_name}</div><div className="text-xs text-gray-500">{p.employee_code}</div></td>
                      <td className={`${td} text-gray-600`}>{p.department || '—'}</td>
                      <td className={`${td} text-right`}>
                        <button title="Xoá tiết mục" onClick={() => removePerformance(p.id, p.program_name)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data && perfs.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Chưa có tiết mục nào.</p>}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default YepManager;
