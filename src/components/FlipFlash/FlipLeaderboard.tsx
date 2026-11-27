import React, { useEffect, useState } from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import {
  type FlipRound,
  type Leaderboard,
  flipErrorMessage,
  flipFlashService,
  formatRange,
  formatDuration,
} from '../../services/flipFlash.service';

/** Bảng xếp hạng từng vòng (Tuần 1–4, Chung kết). Admin / HCNS thấy cả kết quả bị loại + nút Loại / Khôi phục. */

interface Props {
  seasonId: number;
  rounds: FlipRound[];
  initialRound: number;
  myCode: string | null;
  isManager: boolean;
  refreshKey: number;
  onChanged: () => void;
}

const medal = (rank: number | null) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

const FlipLeaderboard: React.FC<Props> = ({ seasonId, rounds, initialRound, myCode, isManager, refreshKey, onChanged }) => {
  const [round, setRound] = useState(initialRound);
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setRound(initialRound), [initialRound, seasonId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    flipFlashService.leaderboard(seasonId, round)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((err) => {
        if (alive) setError(flipErrorMessage(err, 'Không tải được bảng xếp hạng'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [seasonId, round, refreshKey]);

  const disqualify = async (attemptId: number, name: string) => {
    const reason = window.prompt(`Lý do loại kết quả của ${name}?`);
    if (!reason?.trim()) return;
    try {
      await flipFlashService.disqualify(attemptId, reason.trim());
      onChanged();
    } catch (err) {
      window.alert(flipErrorMessage(err, 'Không loại được kết quả'));
    }
  };

  const reinstate = async (attemptId: number) => {
    try {
      await flipFlashService.reinstate(attemptId);
      onChanged();
    } catch (err) {
      window.alert(flipErrorMessage(err, 'Không khôi phục được'));
    }
  };

  const current = rounds.find((r) => r.round_no === round);
  // Vòng đang chạy: người sẽ nhận giải nếu tuần kết thúc lúc này (đã bỏ qua người thắng các tuần trước).
  const leaderAttempt = current?.status === 'ongoing' ? current.leader?.attempt_id : undefined;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <TrophyIcon className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-bold text-gray-900">Bảng xếp hạng</h2>
      </div>

      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
        {rounds.map((r) => (
          <button key={r.round_no} onClick={() => setRound(r.round_no)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border ${round === r.round_no
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {r.label}
            {r.status === 'ongoing' && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />}
          </button>
        ))}
      </div>

      {current && (
        <p className="text-xs text-gray-500">
          {formatRange(current.start, current.end, true)} ·{' '}
          {current.status === 'ongoing' ? 'Đang diễn ra' : current.status === 'upcoming' ? 'Chưa bắt đầu' : 'Đã kết thúc'}
          {current.round_no < rounds.length && ' · Giải tuần dành cho người nhanh nhất chưa thắng tuần nào trước đó'}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !data && <p className="text-sm text-gray-500">Đang tải...</p>}
      {data && data.rows.length === 0 && !loading && (
        <p className="text-sm text-gray-500 py-6 text-center">Chưa có ai hoàn thành vòng này.</p>
      )}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="py-2 pl-4 sm:pl-2 pr-2 w-12">Hạng</th>
                <th className="py-2 pr-2">Nhân sự</th>
                <th className="py-2 pr-2 text-right">Thời gian</th>
                <th className="py-2 pr-4 sm:pr-2 text-right">Lượt</th>
                {isManager && <th className="py-2 pr-4 sm:pr-2" />}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const mine = !!myCode && r.employee_code === myCode;
                const out = r.status === 'DISQUALIFIED';
                return (
                  <tr key={r.attempt_id}
                    className={`border-b border-gray-50 ${mine ? 'bg-primary-50' : ''} ${r.is_winner ? 'bg-amber-50' : ''} ${out ? 'opacity-60' : ''}`}>
                    <td className="py-2 pl-4 sm:pl-2 pr-2 font-bold text-gray-700 tabular-nums">
                      {out ? '—' : (medal(r.rank) || r.rank)}
                    </td>
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-1">
                        {r.full_name}
                        {r.is_winner && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                            <TrophyIcon className="h-3 w-3" /> {current?.round_no === rounds.length ? 'Vô địch' : 'Giải tuần'}
                          </span>
                        )}
                        {r.attempt_id === leaderAttempt && (
                          <span className="text-[10px] font-bold text-amber-700 border border-amber-300 rounded px-1.5 py-0.5">Đang dẫn đầu</span>
                        )}
                        {r.is_previous_winner && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">Đã thắng tuần trước</span>
                        )}
                        {mine && <span className="text-[10px] font-semibold text-primary-700 bg-primary-100 rounded px-1.5 py-0.5">Bạn</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.employee_code}{r.department ? ` · ${r.department}` : ''}
                      </div>
                      {out && <div className="text-xs text-red-600">Bị loại: {r.disqualified_reason}</div>}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono font-semibold tabular-nums text-gray-900">{formatDuration(r.duration_ms)}</td>
                    <td className="py-2 pr-4 sm:pr-2 text-right tabular-nums text-gray-600">{r.moves}</td>
                    {isManager && (
                      <td className="py-2 pr-4 sm:pr-2 text-right whitespace-nowrap">
                        {out ? (
                          <button onClick={() => reinstate(r.attempt_id)} className="text-xs font-semibold text-primary-600 hover:underline">Khôi phục</button>
                        ) : (
                          <button onClick={() => disqualify(r.attempt_id, r.full_name)} className="text-xs font-semibold text-red-600 hover:underline">Loại</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default FlipLeaderboard;
