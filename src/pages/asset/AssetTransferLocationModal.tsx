import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Asset, assetsAPI, departmentsAPI } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';

/**
 * "Chuyển cơ sở" (HCNS SK 2026-11-23): đổi Phòng ban sử dụng / Khu vực sử dụng / Mã cơ sở của tài sản, kèm
 * ngày chuyển + ghi chú. Backend ghi lịch sử nơi sử dụng (từ … sang …) nên vẫn biết tài sản từng ở cơ sở cũ.
 * Người được bàn giao không đổi — cần giao cho người ở cơ sở mới thì bàn giao lại riêng.
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onDone: (updated: Asset) => void;
}

const today = () => new Date().toLocaleDateString('sv-SE');

const describe = (dept?: string | null, area?: string | null, code?: string | null) =>
  [dept, area, code].filter((v) => v && String(v).trim()).join(' · ') || 'Chưa ghi nơi sử dụng';

export default function AssetTransferLocationModal({ isOpen, onClose, asset, onDone }: Props) {
  const [departments, setDepartments] = useState<SelectOption<string>[]>([]);
  const [form, setForm] = useState({ usage_department: '', usage_area: '', facility_code: '', moved_date: today(), note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm({
      usage_department: asset.usage_department ? String(asset.usage_department) : '',
      usage_area: asset.usage_area || '',
      facility_code: asset.facility_code || '',
      moved_date: today(),
      note: '',
    });
    departmentsAPI.list({ page_size: 200 })
      .then((data: any) => setDepartments([
        { value: '', label: '-- Không chọn --' },
        ...(data.results || []).map((d: any) => ({ value: String(d.id), label: d.code ? `${d.name} (${d.code})` : d.name })),
      ]))
      .catch(() => setDepartments([]));
  }, [isOpen, asset]);

  const unchanged = form.usage_department === (asset.usage_department ? String(asset.usage_department) : '')
    && form.usage_area.trim() === (asset.usage_area || '')
    && form.facility_code.trim() === (asset.facility_code || '');
  const newDeptName = departments.find((d) => d.value === form.usage_department && d.value)?.label;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unchanged) {
      setError('Nơi sử dụng mới đang trùng với hiện tại.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await assetsAPI.transferLocation(asset.id, {
        usage_department_id: form.usage_department ? Number(form.usage_department) : null,
        usage_area: form.usage_area.trim(),
        facility_code: form.facility_code.trim(),
        moved_date: form.moved_date,
        note: form.note.trim(),
      });
      onDone(updated);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Không chuyển được nơi sử dụng. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={() => !saving && onClose()}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
              <DialogPanel className="relative w-full transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <DialogTitle as="h3" className="text-base font-bold text-gray-900">Chuyển cơ sở / nơi sử dụng</DialogTitle>
                  <button type="button" onClick={onClose} disabled={saving}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                    <p className="font-semibold text-gray-900">{asset.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                      <span>{describe(asset.usage_department_name, asset.usage_area, asset.facility_code)}</span>
                      {!unchanged && (
                        <>
                          <ArrowRightIcon className="h-3.5 w-3.5 text-primary-600" />
                          <span className="font-semibold text-primary-700">
                            {describe(newDeptName, form.usage_area.trim(), form.facility_code.trim())}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <SelectBox
                    label="Phòng ban sử dụng (mới)"
                    value={form.usage_department}
                    options={departments}
                    onChange={(val) => setForm((f) => ({ ...f, usage_department: String(val ?? '') }))}
                    placeholder="-- Chọn phòng ban --"
                    searchable
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="tl_area" className="block text-xs font-medium text-gray-600 mb-1">Khu vực sử dụng</label>
                      <input id="tl_area" className="input-field" value={form.usage_area} maxLength={255}
                        onChange={(e) => setForm((f) => ({ ...f, usage_area: e.target.value }))} placeholder="VD: HN" />
                    </div>
                    <div>
                      <label htmlFor="tl_code" className="block text-xs font-medium text-gray-600 mb-1">Mã cơ sở</label>
                      <input id="tl_code" className="input-field" value={form.facility_code} maxLength={50}
                        onChange={(e) => setForm((f) => ({ ...f, facility_code: e.target.value }))} placeholder="VD: HNCSKM" />
                    </div>
                    <div>
                      <label htmlFor="tl_date" className="block text-xs font-medium text-gray-600 mb-1">Ngày chuyển</label>
                      <input id="tl_date" type="date" className="input-field" value={form.moved_date} max={today()} required
                        onChange={(e) => setForm((f) => ({ ...f, moved_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tl_note" className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                    <textarea id="tl_note" rows={2} className="input-field" value={form.note} maxLength={500}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="VD: Chuyển bàn sang CS Kim Mã" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Nơi sử dụng cũ được lưu vào lịch sử của tài sản. Người được bàn giao không đổi — cần giao cho người ở cơ sở
                    mới thì thu hồi / bàn giao lại riêng.
                  </p>
                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">Huỷ</button>
                    <button type="submit" disabled={saving || unchanged} className="btn-primary disabled:opacity-50">
                      {saving ? 'Đang chuyển...' : 'Chuyển'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
