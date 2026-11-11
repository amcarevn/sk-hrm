import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  MinusCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  EmployeeDocumentsPayload,
  PersonalDocument,
  notePages,
  personalDocumentService,
} from '../../services/personalDocument.service';
import DocumentViewerModal from './DocumentViewerModal';

/**
 * Bấm 1 nhân viên trên trang Hồ sơ giấy tờ → xổ xuống danh sách giấy tờ của người đó (HCNS SK 2026-11-11).
 * Mỗi file có nút "Xem": mở khung xem PDF ngay trang của loại giấy tờ. Sửa / tải thêm vẫn ở hồ sơ nhân viên.
 */

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

const EmployeeDocumentsDropdown: React.FC<{ employeeId: number; employeeName: string }> = ({ employeeId, employeeName }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDocumentsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    personalDocumentService.getForEmployee(employeeId)
      .then((d) => { if (alive) setData(d); })
      .catch((err) => { if (alive) setError(err?.response?.data?.detail || err?.message || 'Không tải được giấy tờ'); });
    return () => { alive = false; };
  }, [employeeId]);

  if (error) return <p className="px-4 py-3 text-sm text-red-600">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /> Đang tải giấy tờ...
      </div>
    );
  }

  const labelOf = Object.fromEntries(data.types.map((t) => [t.code, t.label]));
  const typeOrder = data.types.map((t) => t.code);
  const files = data.documents
    .filter((d) => !d.not_applicable && d.file_url)
    .sort((a, b) => typeOrder.indexOf(a.doc_type) - typeOrder.indexOf(b.doc_type));
  const filesOf = (code: string) => files.filter((d) => d.doc_type === code);

  const fileLine = (d: PersonalDocument) => {
    const { ranges } = notePages(d.note);
    return (
      <div key={d.id} className="flex items-center gap-2 text-xs">
        <span className="min-w-0 flex-1 truncate text-gray-600" title={d.note || d.file_name}>
          {ranges ? <><b className="text-gray-800">Trang {ranges}</b> · {d.file_name}</> : d.file_name}
          <span className="text-gray-400"> · {formatDate(d.uploaded_at)}</span>
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setViewing(d.id); }}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 font-semibold text-white hover:bg-primary-700"
        >
          <EyeIcon className="h-3.5 w-3.5" /> Xem
        </button>
      </div>
    );
  };

  return (
    <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm font-semibold text-gray-800">
          Giấy tờ của {employeeName}
          <span className="font-normal text-gray-500">
            {' '}· {files.length ? `${files.length} file` : 'chưa có file nào'}
          </span>
        </p>
        <button onClick={() => navigate(`/dashboard/employees/${employeeId}`)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline">
          Mở hồ sơ nhân viên <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {data.types.map((t) => {
          const state = data.status[t.code]?.state;
          const list = filesOf(t.code);
          const missing = state === 'MISSING' && t.required;
          return (
            <div key={t.code}
              className={`rounded-xl border px-3 py-2 ${missing ? 'border-red-200 bg-red-50/70' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2">
                {state === 'FILE' || state === 'SYSTEM_CONTRACT'
                  ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  : state === 'NOT_APPLICABLE' || !t.required
                    ? <MinusCircleIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    : <XCircleIcon className="h-4 w-4 flex-shrink-0 text-red-500" />}
                <span className={`flex-1 text-sm font-semibold ${missing ? 'text-red-700' : 'text-gray-800'}`}>{t.label}</span>
                {state === 'SYSTEM_CONTRACT' && <span className="text-xs text-sky-700">Đã ký trên HRM</span>}
                {state === 'NOT_APPLICABLE' && <span className="text-xs text-gray-500">Không áp dụng</span>}
                {missing && <span className="text-xs font-semibold text-red-600">Thiếu</span>}
                {state === 'MISSING' && !t.required && <span className="text-xs text-gray-400">Không có</span>}
              </div>
              {list.length > 0 && <div className="mt-1.5 space-y-1 pl-6">{list.map(fileLine)}</div>}
            </div>
          );
        })}
      </div>

      {viewing !== null && (
        <DocumentViewerModal
          employeeName={employeeName}
          documents={files}
          initialId={viewing}
          labelOf={labelOf}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
};

export default EmployeeDocumentsDropdown;
