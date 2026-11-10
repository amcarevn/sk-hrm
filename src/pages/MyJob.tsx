import React, { useEffect, useState } from 'react';
import {
  BriefcaseIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import JobDescriptionContent from '../components/JobDescription/JobDescriptionContent';
import {
  MyJobDescription,
  MyPayload,
  errorMessage,
  jobDescriptionService,
} from '../services/jobDescription.service';

/**
 * Công việc của tôi — mô tả công việc của vị trí mình (bản công bố mới nhất).
 * Nhân viên đọc rồi bấm "Tôi đã đọc và hiểu"; có phiên bản mới thì phải xác nhận lại.
 * Không có phần lương / thưởng / phạt (chỉ HCNS xem).
 */

const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const JobCard: React.FC<{ item: MyJobDescription; onChange: (p: MyPayload) => void }> = ({ item, onChange }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acknowledge = async () => {
    setSaving(true);
    setError(null);
    try {
      onChange(await jobDescriptionService.acknowledge(item.version.id));
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được xác nhận'));
    } finally {
      setSaving(false);
    }
  };

  const openDocument = async (id: number) => {
    // Mở tab trước khi gọi API để trình duyệt không chặn cửa sổ bật lên.
    const tab = window.open('', '_blank');
    try {
      const url = await jobDescriptionService.openDocument(id);
      if (tab) tab.location.href = url; else window.location.href = url;
    } catch (err) {
      tab?.close();
      setError(errorMessage(err, 'Không mở được tài liệu'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-500">
              Phiên bản {item.version.version} · công bố {fmt(item.version.published_at)}
            </p>
            {item.version.change_note && (
              <p className="text-sm text-gray-600 mt-1">Thay đổi: {item.version.change_note}</p>
            )}
          </div>
          {item.acknowledged_at ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
              <CheckBadgeIcon className="h-5 w-5" /> Đã xác nhận {fmt(item.acknowledged_at)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
              <ExclamationTriangleIcon className="h-5 w-5" /> Chưa xác nhận
            </span>
          )}
        </div>
        {!item.acknowledged_at && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">
            {item.acknowledged_older_version
              ? `Mô tả công việc đã được cập nhật lên phiên bản ${item.version.version}. Vui lòng đọc lại và xác nhận ở cuối trang.`
              : 'Vui lòng đọc kỹ mô tả công việc dưới đây và xác nhận ở cuối trang.'}
          </p>
        )}
      </div>

      <JobDescriptionContent content={item.content} />

      {item.documents.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
            <DocumentTextIcon className="h-5 w-5 text-primary-600" /> Tài liệu chuyên môn cần đọc
          </h3>
          <ul className="divide-y divide-gray-100">
            {item.documents.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                  <p className="text-xs text-gray-500">{d.document_type_display}</p>
                </div>
                {d.has_file && (
                  <button onClick={() => openDocument(d.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-primary-700 hover:bg-primary-50">
                    Mở
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!item.acknowledged_at && (
        <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-4 sm:p-5 space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input type="checkbox" className="mt-0.5 rounded border-gray-300" checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)} />
            Tôi đã đọc toàn bộ mô tả công việc phiên bản {item.version.version}, hiểu rõ nhiệm vụ, giới hạn quyền hạn
            và các tiêu chí KPI của vị trí mình.
          </label>
          <button onClick={acknowledge} disabled={!confirmed || saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Tôi đã đọc và hiểu'}
          </button>
        </div>
      )}
    </div>
  );
};

const MyJob: React.FC = () => {
  const [data, setData] = useState<MyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobDescriptionService.mine()
      .then(setData)
      .catch((err) => setError(errorMessage(err, 'Không tải được mô tả công việc')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <BriefcaseIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Công việc của tôi</h1>
          <p className="text-sm text-gray-500">
            {data?.employee?.position_title ? `Vị trí: ${data.employee.position_title}` : 'Mô tả công việc theo vị trí của bạn'}
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && data && data.job_descriptions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {data.employee?.position_title
            ? `Vị trí "${data.employee.position_title}" chưa có mô tả công việc được công bố. Vui lòng liên hệ HCNS.`
            : 'Tài khoản chưa được gán vị trí công việc. Vui lòng liên hệ HCNS.'}
        </div>
      )}

      {data?.job_descriptions.map((item) => <JobCard key={item.id} item={item} onChange={setData} />)}
    </div>
  );
};

export default MyJob;
