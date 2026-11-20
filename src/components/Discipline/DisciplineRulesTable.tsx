import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type ColumnKey = 'stt' | 'category' | 'detail' | 'target' | 'penalty_1' | 'penalty_2' | 'penalty_3' | 'applies_to' | 'note';

const CELL_CLASS: Record<ColumnKey, string> = {
  stt: 'text-gray-500',
  category: 'font-medium text-gray-700 whitespace-pre-line',
  detail: 'text-gray-900 whitespace-pre-line',
  target: 'text-gray-700',
  penalty_1: 'text-red-700',
  penalty_2: 'text-red-700',
  penalty_3: 'text-red-700',
  applies_to: 'text-gray-600 whitespace-pre-line',
  note: 'text-amber-700 whitespace-pre-line',
};

/**
 * Độ rộng cột cân theo nội dung (2026-11-20). Trước đây "Chi tiết lỗi" ăn hết phần còn lại còn "Ghi chú" cố
 * định 128px, nên nhóm có ghi chú dài (KPI MKT) thành cột ghi chú rất cao, cột chi tiết thừa khoảng trống.
 *
 * Cách chia (theo bề rộng bảng thật): mỗi cột bắt đầu ở mức tối thiểu, rồi từng 0.5% còn lại được cho cột nào
 * làm các hàng thấp xuống nhiều nhất. Chiều cao hàng = số dòng chữ ước lượng của ô cao nhất; cộng bình phương
 * để phạt hàng cao vọt (một ô ghi chú dài bị bóp hẹp). So trước theo số dòng làm tròn (đúng như hiển thị), hoà
 * thì so theo số dòng không làm tròn (để vẫn tiến dần tới mức bớt được một dòng). Cột gần như trống (vd "Lần 3"
 * của nhóm Cơ sở) giữ ở mức tối thiểu.
 */
const MIN_PERCENT: Record<ColumnKey, number> = {
  stt: 4.5, category: 8, detail: 18, target: 7, penalty_1: 9.5, penalty_2: 9.5, penalty_3: 9.5, applies_to: 8, note: 8,
};
const MIN_TABLE_PX = 880;   // hẹp hơn thì bảng cuộn ngang (khớp min-w của <table>)
const CHAR_PX = 7.2;        // bề rộng trung bình một ký tự text-sm
const WRAP_LOSS_CHARS = 3;  // xuống dòng theo từ nên mỗi dòng hụt vài ký tự
const CELL_PADDING_PX = 24;
const STEP = 0.5;

export interface RuleCell {
  key: ColumnKey;      // cột đầu của ô (quyết định kiểu chữ)
  keys: ColumnKey[];   // các cột ô này chiếm (> 1 = ô gộp)
  text: string;
}

/**
 * Các ô của một hàng (trừ STT). Ô liền nhau cùng nội dung được gộp làm một: Google Sheet của HCNS có ô gộp
 * ngang (vd "Lần 1" + "Lần 2" chung một mức phạt, dòng "Lưu ý" trải từ "Chi tiết" tới "Vị trí áp dụng"), lúc
 * nhập nội dung bị chép vào từng cột — hiện riêng từng cột thì lặp chữ và hàng cao vọt.
 */
export const rowCells = (rule: DisciplineRule, columns: ColumnKey[]): RuleCell[] => {
  const cells: RuleCell[] = [];
  for (const key of columns) {
    if (key === 'stt') continue;
    const text = String(rule[key] || '').trim();
    const last = cells[cells.length - 1];
    if (last && text && last.text === text) last.keys.push(key);
    else cells.push({ key, keys: [key], text });
  }
  return cells;
};

/** % độ rộng từng cột (tổng 100) cho bảng rộng `tablePx`. */
export const columnWidths = (rules: DisciplineRule[], columns: ColumnKey[], tablePx = 1100): Record<string, number> => {
  const px = Math.max(MIN_TABLE_PX, tablePx);
  const width: Record<string, number> = Object.fromEntries(columns.map((key) => [key, MIN_PERCENT[key]]));
  const free = columns.filter((key) => key !== 'stt');
  // Mỗi hàng: các ô (kể cả ô gộp) + độ dài từng đoạn chữ (ngắt theo xuống dòng) — tính một lần.
  const rows = rules.map((r) => rowCells(r, columns).map((cell) => ({
    keys: cell.keys,
    paragraphs: cell.text ? cell.text.split('\n').map((p) => p.trim().length) : [],
  })));
  const lines = (paragraphs: number[], percent: number, round: boolean) => {
    if (paragraphs.length === 0) return 1;
    const perLine = Math.max(1, ((percent / 100) * px - CELL_PADDING_PX) / CHAR_PX - WRAP_LOSS_CHARS);
    return paragraphs.reduce((n, len) => n + Math.max(1, round ? Math.ceil(len / perLine) : len / perLine), 0);
  };
  const cost = (round: boolean) => rows.reduce((sum, cells) => {
    const h = Math.max(...cells.map((c) => lines(c.paragraphs, c.keys.reduce((w, key) => w + width[key], 0), round)));
    return sum + h * h;
  }, 0);

  const better = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1] - 1e-9);

  let left = 100 - columns.reduce((sum, key) => sum + width[key], 0);
  while (free.length && left >= STEP) {
    let pick = free[0];
    let best: [number, number] | null = null;
    for (const key of free) {
      width[key] += STEP;
      const score: [number, number] = [cost(true), cost(false)];
      width[key] -= STEP;
      if (!best || better(score, best)) { best = score; pick = key; }
    }
    width[pick] += STEP;
    left -= STEP;
  }
  if (free.length && left > 0) width[free[0]] += left;

  // Tinh chỉnh: chia từng bước nhỏ không quay lại được (vd cột "Vị trí áp dụng" cần thêm ~3% một lần mới hết
  // xuống dòng ở mọi hàng), nên thử chuyển 1% / 3% giữa hai cột, chuyển nào làm bảng thấp hơn thì giữ.
  let current: [number, number] = [cost(true), cost(false)];
  for (let round = 0; round < 30; round += 1) {
    let move: [ColumnKey, ColumnKey, number] | null = null;
    let best = current;
    for (const from of free) {
      for (const to of free) {
        if (from === to) continue;
        for (const delta of [1, 3]) {
          if (width[from] - delta < MIN_PERCENT[from]) continue;
          width[from] -= delta;
          width[to] += delta;
          const score: [number, number] = [cost(true), cost(false)];
          width[from] += delta;
          width[to] -= delta;
          if (better(score, best)) { best = score; move = [from, to, delta]; }
        }
      }
    }
    if (!move) break;
    width[move[0]] -= move[2];
    width[move[1]] += move[2];
    current = best;
  }
  return Object.fromEntries(columns.map((key) => [key, Math.round(width[key] * 10) / 10]));
};

/** Bề rộng thật của khung bảng (làm tròn 40px để không tính lại liên tục khi kéo cửa sổ). */
const useWidth = (ref: React.RefObject<HTMLElement>, active: boolean) => {
  const [width, setWidth] = useState(1100);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width / 40) * 40;
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, active]);
  return width;
};

const DisciplineRulesTable: React.FC<{ group: DisciplineGroup; query?: string; compact?: boolean }> = ({ group, query = '', compact = false }) => {
  const rules = filterRules(group.rules, query);
  const has = (key: keyof DisciplineRule) => group.rules.some((r) => String(r[key] || '').trim());
  const showCategory = has('category');
  const showTarget = has('target');
  const showThird = has('penalty_3');
  const showAppliesTo = has('applies_to');
  const showNote = has('note');
  const columns: ColumnKey[] = [
    'stt',
    ...(showCategory ? ['category' as const] : []),
    'detail',
    ...(showTarget ? ['target' as const] : []),
    'penalty_1', 'penalty_2',
    ...(showThird ? ['penalty_3' as const] : []),
    ...(showAppliesTo ? ['applies_to' as const] : []),
    ...(showNote ? ['note' as const] : []),
  ];
  const tableBoxRef = useRef<HTMLDivElement>(null);
  const tablePx = useWidth(tableBoxRef, !compact && rules.length > 0);
  const columnsKey = columns.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const widths = useMemo(() => columnWidths(group.rules, columns, tablePx), [group.rules, columnsKey, tablePx]);

  if (rules.length === 0) {
    return <p className="text-sm text-gray-400 py-3">{query ? 'Không có lỗi nào khớp từ khoá.' : 'Chưa có lỗi nào.'}</p>;
  }

  // Thẻ (màn hẹp) dùng đủ cột Lần 3 / Vị trí áp dụng để nhận ra ô gộp giống bảng.
  const cardColumns: ColumnKey[] = ['detail', 'penalty_1', 'penalty_2', ...(showThird ? ['penalty_3' as const] : []), 'applies_to'];

  return (
    <div>
      {/* Thẻ cho màn hình hẹp */}
      <ul className={`space-y-2 ${compact ? '' : 'md:hidden'}`}>
        {rules.map((r) => {
          const cells = rowCells(r, cardColumns);
          const covered = new Set(cells[0].keys); // cột nằm trong ô "Chi tiết" (dòng lưu ý trải ngang)
          const penaltyCells = cells.filter((c) => c.key.startsWith('penalty_'));
          return (
            <li key={r.id} className="rounded-xl border border-gray-100 p-3 text-sm">
              {showCategory && r.category && <p className="text-xs font-semibold text-primary-700 mb-0.5">{r.category}</p>}
              <p className="text-gray-900 whitespace-pre-line">
                {r.stt && <span className="font-semibold text-gray-500 mr-1">{r.stt}.</span>}{r.detail}
              </p>
              {r.target && <p className="mt-1 text-xs text-gray-600"><span className="font-medium">Chỉ tiêu:</span> {r.target}</p>}
              {penaltyCells.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  {penaltyCells.map((c) => {
                    const times = c.keys.filter((k) => k.startsWith('penalty_')).map((k) => k.slice(-1));
                    return (
                      <div key={c.key} className="rounded-lg bg-red-50/60 px-2 py-1.5"
                        style={times.length > 1 ? { gridColumn: `span ${times.length} / span ${times.length}` } : undefined}>
                        <p className="font-semibold text-red-700">Lần {times.length > 1 ? `${times[0]}–${times[times.length - 1]}` : times[0]}</p>
                        <p className="text-gray-800"><Penalty value={c.text} /></p>
                      </div>
                    );
                  })}
                </div>
              )}
              {r.applies_to && !covered.has('applies_to') && !penaltyCells.some((c) => c.keys.includes('applies_to')) && (
                <p className="mt-2 text-xs text-gray-500"><span className="font-medium">Áp dụng:</span> {r.applies_to}</p>
              )}
              {r.note && <p className="mt-1 text-xs text-amber-700">{r.note}</p>}
            </li>
          );
        })}
      </ul>

      {/* Bảng cho màn hình rộng */}
      {!compact && (
        <div ref={tableBoxRef} className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-sm">
            <colgroup>
              {columns.map((key) => <col key={key} style={{ width: `${widths[key]}%` }} />)}
            </colgroup>
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-2 py-2.5">STT</th>
                {showCategory && <th className="text-left px-3 py-2.5">Loại lỗi</th>}
                <th className="text-left px-3 py-2.5">Chi tiết lỗi</th>
                {showTarget && <th className="text-left px-3 py-2.5">Chỉ tiêu</th>}
                <th className="text-left px-3 py-2.5">Lần 1</th>
                <th className="text-left px-3 py-2.5">Lần 2</th>
                {showThird && <th className="text-left px-3 py-2.5">Lần 3</th>}
                {showAppliesTo && <th className="text-left px-3 py-2.5">Vị trí áp dụng</th>}
                {showNote && <th className="text-left px-3 py-2.5">Ghi chú</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top [&_td]:break-words">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-2 py-2.5 text-gray-500">{r.stt}</td>
                  {rowCells(r, columns).map((c) => (
                    <td key={c.key} colSpan={c.keys.length > 1 ? c.keys.length : undefined} className={`px-3 py-2.5 ${CELL_CLASS[c.key]}`}>
                      {c.key.startsWith('penalty_') ? <Penalty value={c.text} /> : c.text}
                    </td>
                  ))}
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
