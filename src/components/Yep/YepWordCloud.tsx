import React, { useMemo } from 'react';
import { CloudIcon } from '@heroicons/react/24/outline';
import type { YepComment } from '../../services/yep.service';

/**
 * Word cloud từ các chia sẻ (chuyển từ generateWordCloud/renderWordCloud của repo yep): mỗi câu là 1 "viên"
 * trong khung flex-wrap nên không chồng nhau. Câu nhiều người cùng gửi to hơn và nằm giữa; câu dài nhỏ lại.
 */

// Bảng màu SK: xanh thương hiệu, xanh ngọc, vàng đất (đủ đậm để đọc trên nền nhạt)
const COLORS = ['#2E7A2E', '#4C8925', '#1D4E1D', '#2F8F6B', '#B7791F', '#5A7D1E', '#266426', '#A86B12'];

/** Băm đơn giản để mỗi câu luôn giữ cùng màu / cỡ giữa các lần tải trang */
const hash = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
};

const YepWordCloud: React.FC<{ comments: YepComment[] }> = ({ comments }) => {
  const { chips, total, distinct, top } = useMemo(() => {
    const freq = new Map<string, number>();
    comments.forEach((c) => {
      const text = c.comment.trim().replace(/\s+/g, ' ');
      if (text) freq.set(text, (freq.get(text) || 0) + 1);
    });
    const limit = typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40;
    const entries = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const maxF = Math.max(1, ...entries.map(([, f]) => f));
    const sized = entries.map(([text, frequency]) => {
      const h = hash(text);
      const boost = maxF > 1 ? Math.round(((frequency - 1) / (maxF - 1)) * 3) : 0;
      const rhythm = h % 3 === 0 ? 1 : 0; // xen kẽ to / nhỏ khi mọi câu chỉ gửi 1 lần
      const penalty = text.length > 70 ? 2 : text.length > 40 ? 1 : 0;
      return { text, frequency, size: Math.min(5, Math.max(1, 2 + boost + rhythm - penalty)), color: COLORS[h % COLORS.length] };
    });
    // Câu to nhất ở giữa, nhỏ dần ra hai bên
    sized.sort((a, b) => b.size - a.size || b.frequency - a.frequency);
    const ordered: typeof sized = [];
    sized.forEach((c, i) => (i % 2 === 0 ? ordered.push(c) : ordered.unshift(c)));
    return { chips: ordered, total: comments.length, distinct: freq.size, top: entries[0]?.[0] || '---' };
  }, [comments]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Những chia sẻ của mọi người trong năm qua. Chia sẻ được nhiều người cùng gửi sẽ to hơn và nằm ở giữa.
      </p>
      <div className="yep-wc-canvas">
        {chips.length === 0 ? (
          <div className="text-sm text-gray-400 flex flex-col items-center gap-2">
            <CloudIcon className="h-10 w-10" /> Chưa có chia sẻ để tạo word cloud
          </div>
        ) : chips.map((c, i) => (
          <span key={c.text} title={c.frequency > 1 ? `${c.frequency} người cùng chia sẻ` : undefined}
            className={`yep-wc-chip yep-wc-${c.size}`}
            style={{ '--chip-color': c.color, '--delay': `${Math.min(i * 0.03, 0.9)}s` } as React.CSSProperties}>
            {c.text}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-xl bg-white ring-1 ring-gray-100 px-3 py-2">Tổng chia sẻ: <b>{total}</b></div>
        <div className="rounded-xl bg-white ring-1 ring-gray-100 px-3 py-2 truncate" title={top}>Nổi bật nhất: <b>{top}</b></div>
        <div className="rounded-xl bg-white ring-1 ring-gray-100 px-3 py-2">Chia sẻ khác nhau: <b>{distinct}</b></div>
      </div>
    </div>
  );
};

export default YepWordCloud;
