import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LaborBookInfo, laborBookService } from '../../services/laborBook.service';

/**
 * "Sổ quản lý lao động" — HCNS SK phần 4: "Theo quy định công ty cần có sổ lao động theo dõi nhân sự ... Sau chị
 * cần chị xuất excel ra là được. Cái này chị cần để xem chung vs kế toán và khi kiểm tra." Mỗi pháp nhân một sổ,
 * bố cục theo file mẫu của HCNS. Chỉ Admin / HCNS (backend cũng chặn).
 */
const LaborBookExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [info, setInfo] = useState<LaborBookInfo | null>(null);
  const [unitId, setUnitId] = useState<number | ''>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    laborBookService.info()
      .then((data) => {
        setInfo(data);
        setYear(data.year);
        const active = data.units.filter((u) => u.is_active);
        if (active.length === 1) setUnitId(active[0].id);
      })
      .catch((err) => setError(err?.response?.data?.detail || 'Không tải được danh sách pháp nhân.'));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const unit = info?.units.find((u) => u.id === unitId) || null;
  const thisYear = info?.year ?? new Date().getFullYear();
  const missingHeader = unit && (!unit.tax_code || !unit.address);

  const download = async () => {
    if (!unit) {
      setError('Chọn pháp nhân.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await laborBookService.export(unit, year);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không tạo được sổ quản lý lao động, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Xuất sổ quản lý lao động</h3>
            <p className="mt-1 text-xs text-gray-500">
              Theo mẫu sổ của HCNS (Nghị định 145/2020/NĐ-CP), mỗi pháp nhân một sổ, gồm cả người đã nghỉ.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Đóng"
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="labor-book-unit" className="mb-1 block text-xs font-semibold text-gray-600">Pháp nhân</label>
              <select id="labor-book-unit" value={unitId} disabled={busy || !info}
                onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">{info ? '— Chọn pháp nhân —' : 'Đang tải…'}</option>
                {info?.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employee_count} người){u.is_active ? '' : ' — ngừng hoạt động'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="labor-book-year" className="mb-1 block text-xs font-semibold text-gray-600">Năm tổng hợp</label>
              <select id="labor-book-year" value={year} disabled={busy}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {[thisYear, thisYear - 1, thisYear - 2].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {missingHeader && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Pháp nhân này chưa có {!unit?.tax_code && 'mã số thuế'}{!unit?.tax_code && !unit?.address && ' và '}
              {!unit?.address && 'địa chỉ'} — đầu sổ sẽ để trống. Bổ sung ở{' '}
              <Link to="/dashboard/company-units" className="font-semibold underline">Quản lý pháp nhân</Link>.
            </p>
          )}
          {!!info?.unassigned && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              {info.unassigned} nhân viên chưa gán pháp nhân nên không có trong sổ nào. Gán ở mục
              <b> Pháp nhân</b> trên hồ sơ nhân viên.
            </p>
          )}

          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            <p className="font-semibold text-gray-800">Số liệu tự tổng hợp từ HRM</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Số ngày nghỉ, số giờ làm thêm: theo chốt công các tháng của năm đã chọn.</li>
              <li>Nâng lương: theo lịch sử lương. Chế độ BHXH: thai sản đã ghi trên hồ sơ.</li>
              <li>Dòng cam: HĐLĐ hết hạn trong 30 ngày tới · đỏ: HĐLĐ đã quá hạn · xám: đã nghỉ việc.</li>
            </ul>
          </div>

          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Sổ có CCCD, lương, tài khoản ngân hàng của người lao động. Chỉ chia sẻ cho kế toán và người có thẩm quyền.
          </p>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Đóng
          </button>
          <button onClick={download} disabled={busy || !unit}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            <ArrowDownTrayIcon className="h-4 w-4" /> {busy ? 'Đang tạo sổ…' : 'Tải sổ Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LaborBookExportModal;
