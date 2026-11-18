import React from 'react';
import { DisciplineGroup, DisciplineRule } from '../../services/disciplineRule.service';

/**
 * Bảng lỗi & mức phạt của một nhóm (HCNS SK 2026-11-17). Dùng ở trang "Nội quy & mức phạt" và trong
 * mô tả công việc. Chỉ hiện cột có dữ liệu (tab KPI MKT có "Chỉ tiêu", vài tab không có "Lần 3").
 * Màn hình hẹp hiện dạng thẻ thay cho bảng.
 */

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export const filterRules = (rules: DisciplineRule[], query: string): DisciplineRule[] => {
  const q = normalize(query.trim());
  if (!q) return rules;
  return rules.filter((r) => normalize(
    [r.category, r.detail, r.target, r.penalty_1, r.penalty_2, r.penalty_3, r.applies_to, r.note].join(' '),
  ).includes(q));
};

const Penalty: React.FC<{ value: string }> = ({ value }) => (
  value ? <span className="whitespace-pre-line">{value}</span> : <span className="text-gray-300">—</span>
);

const DisciplineRulesTable: React.FC<{ group: DisciplineGroup; query?: string; compact?: boolean }> = ({ group, query = '', compact = false }) => {
  const rules = filterRules(group.rules, query);
  const has = (key: keyof DisciplineRule) => group.rules.some((r) => String(r[key] || '').trim());
  const showCategory = has('category');
  const showTarget = has('target');
  const showThird = has('penalty_3');
  const showNote = has('note');

  if (rules.length === 0) {
    return <p className="text-sm text-gray-400 py-3">{query ? 'Không có lỗi nào khớp từ khoá.' : 'Chưa có lỗi nào.'}</p>;
  }

  return (
    <div>
      {/* Thẻ cho màn hình hẹp */}
      <ul className={`space-y-2 ${compact ? '' : 'md:hidden'}`}>
        {rules.map((r) => (
          <li key={r.id} className="rounded-xl border border-gray-100 p-3 text-sm">
            {showCategory && r.category && <p className="text-xs font-semibold text-primary-700 mb-0.5">{r.category}</p>}
            <p className="text-gray-900 whitespace-pre-line">
              {r.stt && <span className="font-semibold text-gray-500 mr-1">{r.stt}.</span>}{r.detail}
            </p>
            {r.target && <p className="mt-1 text-xs text-gray-600"><span className="font-medium">Chỉ tiêu:</span> {r.target}</p>}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {[r.penalty_1, r.penalty_2, r.penalty_3].map((p, i) => (i < 2 || showThird) && (
                <div key={i} className="rounded-lg bg-red-50/60 px-2 py-1.5">
                  <p className="font-semibold text-red-700">Lần {i + 1}</p>
                  <p className="text-gray-800"><Penalty value={p} /></p>
                </div>
              ))}
            </div>
            {r.applies_to && <p className="mt-2 text-xs text-gray-500"><span className="font-medium">Áp dụng:</span> {r.applies_to}</p>}
            {r.note && <p className="mt-1 text-xs text-amber-700">{r.note}</p>}
          </li>
        ))}
      </ul>

      {/* Bảng cho màn hình rộng */}
      {!compact && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-3 py-2.5 w-10">STT</th>
                {showCategory && <th className="text-left px-3 py-2.5 w-40">Loại lỗi</th>}
                <th className="text-left px-3 py-2.5">Chi tiết lỗi</th>
                {showTarget && <th className="text-left px-3 py-2.5 w-24">Chỉ tiêu</th>}
                <th className="text-left px-3 py-2.5 w-36">Lần 1</th>
                <th className="text-left px-3 py-2.5 w-36">Lần 2</th>
                {showThird && <th className="text-left px-3 py-2.5 w-32">Lần 3</th>}
                <th className="text-left px-3 py-2.5 w-48">Vị trí áp dụng</th>
                {showNote && <th className="text-left px-3 py-2.5 w-32">Ghi chú</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 text-gray-500">{r.stt}</td>
                  {showCategory && <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-pre-line">{r.category}</td>}
                  <td className="px-3 py-2.5 text-gray-900 whitespace-pre-line">{r.detail}</td>
                  {showTarget && <td className="px-3 py-2.5 text-gray-700">{r.target}</td>}
                  <td className="px-3 py-2.5 text-red-700"><Penalty value={r.penalty_1} /></td>
                  <td className="px-3 py-2.5 text-red-700"><Penalty value={r.penalty_2} /></td>
                  {showThird && <td className="px-3 py-2.5 text-red-700"><Penalty value={r.penalty_3} /></td>}
                  <td className="px-3 py-2.5 text-gray-600 whitespace-pre-line">{r.applies_to}</td>
                  {showNote && <td className="px-3 py-2.5 text-amber-700 whitespace-pre-line">{r.note}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {group.notes && <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 whitespace-pre-line">{group.notes}</p>}
    </div>
  );
};

export default DisciplineRulesTable;
