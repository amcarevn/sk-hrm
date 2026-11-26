import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  FLIP_SYMBOLS,
  type FlipAttemptState,
  flipErrorMessage,
  flipFlashService,
  formatDuration,
} from '../../services/flipFlash.service';

/**
 * Bàn chơi Flip Flash. Server giữ đáp án: mỗi lần lật gửi 1 request, server trả hình của ô đó và tự xét
 * ghép cặp / tính giờ. Click được xếp hàng đợi rồi gửi lần lượt, nên bấm nhanh không bị mất thao tác.
 * 2 thẻ lật sai tự úp lại sau MISMATCH_MS, hoặc ngay khi người chơi lật thẻ tiếp theo.
 */

const MISMATCH_MS = 800;

interface Props {
  attempt: FlipAttemptState;
  onChange: (state: FlipAttemptState) => void;
}

const toMap = (obj: Record<string, number>) => new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));

const FlipBoard: React.FC<Props> = ({ attempt, onChange }) => {
  const [state, setState] = useState(attempt);
  const [error, setError] = useState<string | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const board = useRef({
    matched: toMap(attempt.matched),
    shown: new Map<number, number>(attempt.pending ? [[attempt.pending.index, attempt.pending.symbol]] : []),
    wrong: [] as number[],
    queued: new Set<number>(),
    pop: new Set<number>(),
  });
  const queue = useRef<number[]>([]);
  const pumping = useRef(false);
  const hideTimer = useRef<number>();
  const clock = useRef({
    base: attempt.elapsed_ms ?? 0,
    at: performance.now(),
    running: !!attempt.started_at && attempt.status === 'PLAYING',
  });
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => clock.current.running && tick((t) => t + 1), 50);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  const apply = useCallback((s: FlipAttemptState) => {
    const playing = s.status === 'PLAYING' && !!s.started_at;
    clock.current = { base: (playing ? s.elapsed_ms : s.duration_ms) ?? 0, at: performance.now(), running: playing };
    setState(s);
    onChange(s);
  }, [onChange]);

  const hideWrong = () => {
    const b = board.current;
    window.clearTimeout(hideTimer.current);
    b.wrong.forEach((k) => b.shown.delete(k));
    b.wrong = [];
  };

  const resync = async () => {
    try {
      const s = await flipFlashService.play();
      const b = board.current;
      b.matched = toMap(s.matched);
      b.shown = new Map(s.pending ? [[s.pending.index, s.pending.symbol]] : []);
      b.wrong = [];
      apply(s);
    } catch {
      /* giữ nguyên bàn, lỗi đã hiện */
    }
  };

  const pump = async () => {
    if (pumping.current) return;
    pumping.current = true;
    const b = board.current;
    try {
      while (queue.current.length) {
        const index = queue.current.shift()!;
        try {
          const r = await flipFlashService.flip(state.id, index);
          b.queued.delete(index);
          if (b.wrong.length) hideWrong();
          if (r.result === 'first') {
            b.shown.set(index, r.symbol);
          } else if (r.result === 'match' && r.first_index != null) {
            b.shown.delete(r.first_index);
            b.matched.set(r.first_index, r.symbol);
            b.matched.set(index, r.symbol);
            b.pop = new Set([r.first_index, index]);
          } else if (r.first_index != null) {
            b.shown.set(index, r.symbol);
            b.wrong = [r.first_index, index];
            const pair = b.wrong;
            hideTimer.current = window.setTimeout(() => {
              if (board.current.wrong === pair) {
                hideWrong();
                rerender();
              }
            }, MISMATCH_MS);
          }
          setError(null);
          apply(r.state);
        } catch (err) {
          queue.current = [];
          b.queued.clear();
          setError(flipErrorMessage(err, 'Không lật được thẻ, thử lại.'));
          await resync();
        }
        rerender();
      }
    } finally {
      pumping.current = false;
    }
  };

  const click = (i: number) => {
    const b = board.current;
    if (state.status !== 'PLAYING' || b.matched.has(i) || b.queued.has(i)) return;
    if (b.shown.has(i) && !b.wrong.includes(i)) return; // thẻ đang mở chờ ghép
    if (b.wrong.length) hideWrong();
    b.queued.add(i);
    queue.current.push(i);
    rerender();
    pump();
  };

  const b = board.current;
  const elapsed = clock.current.running
    ? clock.current.base + (performance.now() - clock.current.at)
    : clock.current.base;
  const total = state.rows * state.cols;
  const finished = state.status === 'FINISHED';

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 rounded-xl bg-gray-900 text-white px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-white/60">Thời gian</div>
          <div className="font-mono text-2xl font-bold tabular-nums">{formatDuration(elapsed)}</div>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 px-3 py-2 text-center min-w-[72px]">
          <div className="text-[11px] uppercase tracking-wide text-gray-400">Cặp</div>
          <div className="text-lg font-bold text-gray-900 tabular-nums">{b.matched.size / 2}/{state.total_pairs}</div>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 px-3 py-2 text-center min-w-[72px]">
          <div className="text-[11px] uppercase tracking-wide text-gray-400">Lượt</div>
          <div className="text-lg font-bold text-gray-900 tabular-nums">{state.moves}</div>
        </div>
      </div>

      {!state.started_at && !finished && (
        <p className="text-xs text-gray-500 text-center">Đồng hồ bắt đầu chạy khi bạn lật thẻ đầu tiên.</p>
      )}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="mx-auto w-full max-w-[520px] grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${state.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, i) => {
          const symbol = b.matched.get(i) ?? b.shown.get(i);
          const isMatched = b.matched.has(i);
          const isWrong = b.wrong.includes(i);
          const faceUp = symbol != null || b.queued.has(i);
          return (
            <button key={i} type="button" onClick={() => click(i)} aria-label={`Thẻ ${i + 1}`}
              disabled={finished || isMatched}
              className="relative aspect-square [perspective:600px] focus:outline-none">
              <div className={`absolute inset-0 transition-transform duration-300 [transform-style:preserve-3d] ${faceUp ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm flex items-center justify-center [backface-visibility:hidden] hover:brightness-110">
                  <span className="text-white/60 font-black text-[10px] sm:text-xs tracking-widest">SK</span>
                </div>
                <div className={`absolute inset-0 rounded-lg sm:rounded-xl border-2 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] text-2xl sm:text-3xl select-none
                  ${isMatched ? 'bg-emerald-50 border-emerald-300' : isWrong ? 'bg-red-50 border-red-300' : 'bg-white border-primary-200'}
                  ${isMatched && b.pop.has(i) ? 'animate-[pulse_0.6s_ease-out_1]' : ''}`}>
                  {symbol != null ? FLIP_SYMBOLS[symbol] ?? '?' : (
                    <span className="h-4 w-4 rounded-full border-2 border-primary-300 border-t-transparent animate-spin" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FlipBoard;
