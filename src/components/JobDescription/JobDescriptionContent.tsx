import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DUTY_LABELS, DutyFrequency, JobContent, kpiTotal } from '../../services/jobDescription.service';
import { DisciplineGroup } from '../../services/disciplineRule.service';
import DisciplineRulesTable from '../Discipline/DisciplineRulesTable';

/**
 * Hiển thị (chỉ đọc) 6 khối của một bản mô tả công việc.
 * Dùng ở "Công việc của tôi" và khi HCNS xem trước / xem phiên bản cũ.
 * Khung lương / thưởng theo vị trí chỉ hiện khi `showCompensation` (Admin/HCNS).
 * Nội quy & mức phạt (HCNS SK 2026-11-17) là quy định chung — ai cũng thấy: `disciplineGroups` là các
 * nhóm đã chọn kèm bảng lỗi (lấy từ trang "Nội quy & mức phạt").
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

const DisciplineSection: React.FC<{ content: JobContent; groups?: DisciplineGroup[] }> = ({ content, groups }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const codes = content.discipline?.groups || [];
  const notes = content.discipline?.notes || '';
  if (!codes.length && !notes) return null;
  const byCode = new Map((groups || []).map((g) => [g.code, g]));
  return (
    <Section icon={ScaleIcon} title="Nội quy & mức phạt áp dụng">
      {notes && <p className="text-sm text-gray-800 whitespace-pre-line mb-3">{notes}</p>}
      <div className="space-y-2">
        {codes.map((code) => {
          const group = byCode.get(code);
          const isOpen = !!open[code];
          return (
            <div key={code} className="rounded-xl border border-gray-100">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [code]: !isOpen }))}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                <span className="flex-1 text-sm font-semibold text-gray-900">{group?.title || code}</span>
                <span className="text-xs text-gray-500">{group ? `${group.rules.length} lỗi` : 'chưa có dữ liệu'}</span>
                <span className="text-sm font-semibold text-primary-700">{isOpen ? 'Thu gọn' : 'Xem'}</span>
              </button>
              {isOpen && group && <div className="px-3 pb-3"><DisciplineRulesTable group={group} /></div>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Toàn bộ quy định xem ở trang <Link to="/dashboard/discipline-rules" className="font-semibold text-primary-700 hover:underline">Nội quy & mức phạt</Link>.
      </p>
    </Section>
  );
};

const JobDescriptionContent: React.FC<{ content: JobContent; showCompensation?: boolean; disciplineGroups?: DisciplineGroup[] }> = ({
  content, showCompensation = false, disciplineGroups,
}) => {
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
        <Section icon={BanknotesIcon} title="Khung lương / thưởng theo vị trí (chỉ HCNS / Admin thấy)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Lương cứng" value={content.compensation.base_salary} />
            <Field label="Cơ chế thưởng doanh số / KPI" value={content.compensation.bonus} />
          </div>
        </Section>
      )}

      <DisciplineSection content={content} groups={disciplineGroups} />

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
