import React from 'react';
import {
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DUTY_LABELS, DutyFrequency, JobContent, kpiTotal } from '../../services/jobDescription.service';

/**
 * Hiển thị (chỉ đọc) 6 khối của một bản mô tả công việc.
 * Dùng ở "Công việc của tôi" và khi HCNS xem trước / xem phiên bản cũ.
 * Khối lương / thưởng / phạt chỉ hiện khi `showCompensation` (Admin/HCNS).
 */

const Section: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
      <Icon className="h-5 w-5 text-primary-600" /> {title}
    </h3>
    {children}
  </section>
);

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 whitespace-pre-line mt-0.5">{value || '—'}</p>
  </div>
);

const JobDescriptionContent: React.FC<{ content: JobContent; showCompensation?: boolean }> = ({ content, showCompensation = false }) => {
  const { governance, workflows, duties, knowledge, kpis } = content;
  const total = kpiTotal(kpis);

  return (
    <div className="space-y-4">
      <Section icon={UserGroupIcon} title="Quản trị">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Quản lý trực tiếp" value={governance.direct_manager} />
          <Field label="Báo cáo trực tiếp" value={governance.reports_to} />
          <Field label="Phòng ban tương tác" value={governance.interacts_with} />
        </div>
        {governance.authority_limits && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3 flex gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800">Giới hạn quyền hạn</p>
              <p className="text-sm text-amber-900 whitespace-pre-line">{governance.authority_limits}</p>
            </div>
          </div>
        )}
      </Section>

      <Section icon={ArrowsRightLeftIcon} title="Phân luồng công việc & đầu mối phối hợp">
        {workflows.length === 0 ? <p className="text-sm text-gray-400">—</p> : (
          <div className="space-y-3">
            {workflows.map((w, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-semibold text-gray-900">{i + 1}. {w.name || '—'}</p>
                <p className="text-sm text-gray-700 mt-1">{w.scope}</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span><span className="font-medium text-gray-600">Phối hợp:</span> {w.coordinate_with || '—'}</span>
                  <span><span className="font-medium text-gray-600">Dữ liệu / sản phẩm:</span> {w.outputs || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={CalendarDaysIcon} title="Nhiệm vụ theo tần suất">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(DUTY_LABELS) as DutyFrequency[]).map((freq) => (
            <div key={freq}>
              <p className="text-xs font-bold text-primary-700 uppercase mb-2">{DUTY_LABELS[freq]}</p>
              {duties[freq]?.length ? (
                <ul className="space-y-1.5">
                  {duties[freq].map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-primary-400 mt-0.5">•</span><span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">—</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={AcademicCapIcon} title="Kiến thức chuyên môn & đào tạo">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2"><Field label="Kiến thức / kỹ năng cốt lõi bắt buộc" value={knowledge.core_skills} /></div>
          <Field label="Người phụ trách đào tạo trực tiếp" value={knowledge.trainer} />
        </div>
      </Section>

      {showCompensation && content.compensation && (
        <Section icon={BanknotesIcon} title="Lương, thưởng KPI & kỷ luật (chỉ HCNS / Admin thấy)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Lương cứng" value={content.compensation.base_salary} />
            <Field label="Cơ chế thưởng doanh số / KPI" value={content.compensation.bonus} />
            <Field label="Chế tài phạt" value={content.compensation.penalties} />
          </div>
        </Section>
      )}

      <Section icon={ChartBarIcon} title="Khung đánh giá KPI cuối tháng">
        {kpis.length === 0 ? <p className="text-sm text-gray-400">—</p> : (
          <div className="space-y-2.5">
            {kpis.map((k, i) => {
              const weight = Number(k.weight) || 0;
              return (
                <div key={i}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-gray-800">{i + 1}. {k.criterion}</span>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{k.weight ?? '—'}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(weight, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            <p className={`text-xs text-right font-semibold ${total === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
              Tổng trọng số: {total}%
            </p>
          </div>
        )}
      </Section>
    </div>
  );
};

export default JobDescriptionContent;
