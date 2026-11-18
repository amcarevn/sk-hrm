import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DepartmentRef, jobDescriptionService } from '../../services/jobDescription.service';

/**
 * "Xuất dữ liệu lương" — HCNS SK 2026-11-17, phần 3: "Từ mô tả công việc, xuất giúp chị 1 file excel
 * đầy đủ dữ liệu lương của các bộ phận phòng ban". Chỉ HCNS / Admin (trang này đã giới hạn quyền,
 * backend cũng chặn). File 3 sheet: theo phòng ban, theo vị trí (cơ chế trong mô tả công việc + khoảng
 * lương thực tế), chi tiết từng nhân viên. Dữ liệu tính lúc bấm nên luôn mới.
 */
const SalaryExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobDescriptionService.options().then((o) => setDepartments(o.departments || [])).catch(() => { });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const code = departments.find((d) => d.id === departmentId)?.code;
      const { blob, filename } = await jobDescriptionService.salaryExport(departmentId || null, code);
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
      setError(err?.message || 'Không tạo được file Excel, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Xuất dữ liệu lương theo phòng ban</h3>
            <p className="mt-1 text-xs text-gray-500">
              File Excel lấy số liệu lương trong hồ sơ nhân sự hiện tại và cơ chế lương / thưởng ghi trong mô tả công việc.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Đóng"
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Phòng ban</label>
            <select value={departmentId} disabled={busy}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">Chọn một phòng ban thì gồm cả các bộ phận con của phòng ban đó.</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            <p className="font-semibold text-gray-800">File gồm 3 sheet</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li><b>Theo phòng ban</b>: số nhân sự, tổng và bình quân lương cơ bản, phụ cấp.</li>
              <li><b>Theo vị trí</b>: cơ chế lương / thưởng trong mô tả công việc và khoảng lương thực tế.</li>
              <li><b>Chi tiết nhân viên</b>: lương cơ bản, phụ cấp, % doanh số, % lợi nhuận, thử việc, ghi chú lương.</li>
            </ul>
          </div>

          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            File có dữ liệu lương và ghi chú nội bộ của HCNS. Chỉ lưu và chia sẻ cho người có thẩm quyền.
          </p>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Đóng
          </button>
          <button onClick={download} disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            <ArrowDownTrayIcon className="h-4 w-4" /> {busy ? 'Đang tạo file…' : 'Tải file Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SalaryExportModal;
