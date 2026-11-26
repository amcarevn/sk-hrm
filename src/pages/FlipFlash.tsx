import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cog6ToothIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import FlipBoard from '../components/FlipFlash/FlipBoard';
import FlipLeaderboard from '../components/FlipFlash/FlipLeaderboard';
import FlipSeasonManager from '../components/FlipFlash/FlipSeasonManager';
import {
  type FlipAttemptState,
  type FlipEntry,
  type FlipOverview,
  type FlipRound,
  flipErrorMessage,
  flipFlashService,
  formatDay,
  formatDuration,
} from '../services/flipFlash.service';

/**
 * Minigame Flip Flash – Memory Challenge (HCNS SK 2026-11-26).
 * Mỗi đợt: Tuần 1–4 + Vòng chung kết cho người thắng tuần. Mỗi người chơi 1 lượt / vòng; nhanh nhất thắng.
 * Luật & tính giải ở backend (hrm/flip_flash.py) — trang chỉ hiển thị.
 */

const statusText: Record<string, string> = { upcoming: 'Sắp tới', ongoing: 'Đang diễn ra', ended: 'Đã kết thúc' };

const Person: React.FC<{ e: FlipEntry; muted?: boolean }> = ({ e, muted }) => (
  <div className={muted ? 'text-gray-500' : 'text-gray-900'}>
    <div className="font-semibold text-sm truncate">{e.full_name}</div>
    <div className="text-xs text-gray-500 truncate">{e.employee_code} · <span className="font-mono">{formatDuration(e.duration_ms)}</span></div>
  </div>
);

const RoundCard: React.FC<{ r: FlipRound; current: boolean }> = ({ r, current }) => (
  <div data-current={current} className={`shrink-0 w-44 sm:w-auto rounded-xl border p-3 ${current ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white'}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-gray-900">{r.label}</span>
      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${r.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700'
        : r.status === 'ended' ? 'bg-gray-100 text-gray-600' : 'bg-sky-50 text-sky-700'}`}>{statusText[r.status]}</span>
    </div>
    <div className="text-xs text-gray-500 mb-2">{formatDay(r.start)} – {formatDay(r.end)}</div>
    {r.winner ? (
      <div className="flex items-start gap-1.5"><TrophyIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><Person e={r.winner} /></div>
    ) : r.leader ? (
      <div><div className="text-[10px] uppercase tracking-wide text-gray-400">Đang dẫn đầu</div><Person e={r.leader} /></div>
    ) : (
      <div className="text-xs text-gray-400">{r.status === 'ended' ? 'Không có giải' : r.status === 'ongoing' ? 'Chưa ai hoàn thành' : '—'}</div>
    )}
  </div>
);

const Rules: React.FC<{ overview: FlipOverview }> = ({ overview }) => {
  const s = overview.season;
  const minutes = Math.round(overview.config.max_play_seconds / 60);
  return (
    <details className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 group" open>
      <summary className="text-sm font-bold text-gray-900 cursor-pointer select-none">Luật chơi</summary>
      <ul className="mt-3 space-y-1.5 text-sm text-gray-600 list-disc pl-5">
        <li>Mỗi nhân sự chơi <b>1 lượt mỗi tuần</b> (tính theo mã nhân viên).</li>
        <li>Bàn chơi có {s ? `${s.rows * s.cols} thẻ (${s.rows * s.cols / 2} cặp)` : 'các thẻ'} úp xuống. Mỗi lượt lật 2 thẻ:
          giống nhau thì giữ mở, khác nhau thì tự úp lại.</li>
        <li>Tìm hết các cặp để hoàn thành. Đồng hồ chạy từ lần lật thẻ đầu tiên — tải lại trang hay thoát ra đồng hồ vẫn chạy,
          quá {minutes} phút là hết lượt.</li>
        <li>Xếp hạng theo thời gian, bằng nhau thì ai ít lượt hơn xếp trên.</li>
        <li>Hết mỗi tuần, người nhanh nhất <b>chưa từng thắng tuần nào</b> trong đợt nhận giải tuần — người đã thắng vẫn chơi
          và lên bảng xếp hạng bình thường.</li>
        <li>Sau Tuần 4 là <b>Vòng chung kết</b>{s ? ` (${s.final_days} ngày)` : ''} chỉ dành cho những người thắng tuần —
          ai nhanh nhất là Vô địch.</li>
      </ul>
    </details>
  );
};

const PlayPanel: React.FC<{ overview: FlipOverview; onChanged: () => void }> = ({ overview, onChanged }) => {
  const me = overview.me;
  const season = overview.season;
  const [attempt, setAttempt] = useState<FlipAttemptState | null>(me?.attempt || null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setAttempt(me?.attempt || null), [me?.attempt?.id, me?.attempt?.status]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      setAttempt(await flipFlashService.play());
    } catch (err) {
      setError(flipErrorMessage(err, 'Không mở được lượt chơi'));
    } finally {
      setStarting(false);
    }
  };

  // Ghép xong cặp cuối: giữ bàn chơi (đồng hồ đã dừng) thêm 1 giây cho người chơi thấy, rồi mới hiện kết quả.
  const finishTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(finishTimer.current), []);
  const onChange = useCallback((s: FlipAttemptState) => {
    if (s.status !== 'PLAYING') {
      window.clearTimeout(finishTimer.current);
      finishTimer.current = window.setTimeout(() => {
        setAttempt(s);
        onChanged();
      }, s.status === 'FINISHED' ? 1000 : 0);
    }
  }, [onChanged]);

  // Điện thoại: bàn chơi nằm dưới phần lịch vòng → tự cuộn tới khi bắt đầu / mở lại lượt đang chơi.
  const boardRef = useRef<HTMLElement>(null);
  const playingId = attempt?.status === 'PLAYING' ? attempt.id : null;
  useEffect(() => {
    if (playingId) boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [playingId]);

  const roundLabel = season?.rounds.find((r) => r.round_no === me?.round_no)?.label;
  const box = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5';

  if (attempt?.status === 'PLAYING') {
    return (
      <section ref={boardRef} className={`${box} scroll-mt-4`}>
        <div className="text-sm font-bold text-gray-900 mb-3">{attempt.round_label} — lượt chơi của bạn</div>
        <FlipBoard key={attempt.id} attempt={attempt} onChange={onChange} />
      </section>
    );
  }

  if (attempt) {
    return (
      <section className={`${box} text-center space-y-2`}>
        <div className="text-sm font-semibold text-gray-500">{attempt.round_label}</div>
        {attempt.status === 'FINISHED' && (
          <>
            <div className="text-4xl">🎉</div>
            <div className="text-lg font-bold text-gray-900">Hoàn thành!</div>
            <div className="font-mono text-3xl font-bold text-primary-700 tabular-nums">{formatDuration(attempt.duration_ms)}</div>
            <div className="text-sm text-gray-600">{attempt.moves} lượt lật · Hạng <b>{attempt.rank ?? '—'}</b> {attempt.round_label.toLowerCase()}</div>
            <p className="text-xs text-gray-500">Bạn đã dùng lượt của vòng này. Hẹn bạn vòng sau!</p>
          </>
        )}
        {attempt.status === 'EXPIRED' && (
          <p className="text-sm text-gray-600">Lượt chơi đã quá giờ hoặc bị bỏ dở nên không được tính. Hẹn bạn vòng sau!</p>
        )}
        {attempt.status === 'DISQUALIFIED' && (
          <p className="text-sm text-red-600">Kết quả của bạn đã bị HCNS loại: {attempt.disqualified_reason}</p>
        )}
      </section>
    );
  }

  return (
    <section className={`${box} text-center space-y-3`}>
      <div className="text-5xl">🃏</div>
      {me?.can_play ? (
        <>
          <div className="text-lg font-bold text-gray-900">{roundLabel} đang mở!</div>
          <p className="text-sm text-gray-600">
            Bạn có <b>1 lượt</b> cho {roundLabel?.toLowerCase()}. Bấm bắt đầu để hiện bàn chơi — đồng hồ chỉ chạy khi bạn lật thẻ đầu tiên.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={start} disabled={starting}
            className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50">
            {starting ? 'Đang mở...' : 'Bắt đầu'}
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-600">{me?.reason || 'Hiện chưa có vòng nào để chơi.'}</p>
      )}
    </section>
  );
};

const FlipFlash: React.FC = () => {
  const [overview, setOverview] = useState<FlipOverview | null>(null);
  const [seasonId, setSeasonId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManager, setShowManager] = useState(false);

  const load = useCallback(() => {
    flipFlashService.overview(seasonId)
      .then((d) => {
        setOverview(d);
        setError(null);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => setError(flipErrorMessage(err, 'Không tải được Flip Flash')));
  }, [seasonId]);
  useEffect(load, [load]);

  const season = overview?.season;
  const lastEnded = season ? [...season.rounds].reverse().find((r) => r.status === 'ended')?.round_no : undefined;
  const initialRound = season?.current_round || lastEnded || 1;

  // Điện thoại: dải Tuần 1–4 + Chung kết cuộn ngang → đưa vòng đang diễn ra vào giữa khung nhìn.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.querySelector<HTMLElement>('[data-current="true"]');
    if (strip && card && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft = card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2;
    }
  }, [season?.id, season?.current_round]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          <PuzzlePieceIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Flip Flash – Memory Challenge</h1>
          <p className="text-sm text-gray-500">Lật thẻ tìm cặp — ai nhanh nhất tuần sẽ vào chung kết cuối đợt.</p>
        </div>
        {overview && overview.seasons.length > 1 && (
          <select value={season?.id || ''} onChange={(e) => setSeasonId(Number(e.target.value) || undefined)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            {overview.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {overview?.is_manager && (
          <button onClick={() => setShowManager(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Cog6ToothIcon className="h-4 w-4" /> Quản lý đợt
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!overview && !error && <p className="text-sm text-gray-500">Đang tải...</p>}

      {overview && !season && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          Chưa có đợt Flip Flash nào.{overview.is_manager ? ' Bấm "Quản lý đợt" để tạo đợt đầu tiên.' : ' HCNS sẽ thông báo khi mở đợt.'}
        </div>
      )}

      {overview && season && (
        <>
          <section className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-4 sm:p-5 space-y-1">
            <div className="text-xs uppercase tracking-wide text-white/70">{statusText[season.status]}</div>
            <div className="text-lg font-bold">{season.name}</div>
            <div className="text-sm text-white/80">{formatDay(season.start_date)} – {formatDay(season.end_date, true)} · {season.rows}×{season.cols} thẻ</div>
            {season.note && <div className="text-sm text-white/90 whitespace-pre-line pt-1">🎁 {season.note}</div>}
            {season.champion && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2">
                <TrophyIcon className="h-5 w-5 text-amber-300" />
                <span className="text-sm">Vô địch: <b>{season.champion.full_name}</b> ({season.champion.employee_code}) ·{' '}
                  <span className="font-mono">{formatDuration(season.champion.duration_ms)}</span></span>
              </div>
            )}
          </section>

          <div ref={stripRef} className="relative flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
            {season.rounds.map((r) => <RoundCard key={r.round_no} r={r} current={r.round_no === season.current_round} />)}
          </div>

          {season.finalists.length > 0 && (
            <div className="text-sm text-gray-600">
              <b>Vào chung kết:</b> {season.finalists.map((f) => `${f.full_name} (${f.employee_code})`).join(', ')}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-5">
              <PlayPanel overview={overview} onChanged={load} />
              <Rules overview={overview} />
            </div>
            <FlipLeaderboard seasonId={season.id} rounds={season.rounds} initialRound={initialRound}
              myCode={overview.me?.employee_code || null} isManager={overview.is_manager}
              refreshKey={refreshKey} onChanged={load} />
          </div>
        </>
      )}

      {showManager && (
        <FlipSeasonManager config={overview?.config || null} onClose={(changed) => {
          setShowManager(false);
          if (changed) load();
        }} />
      )}
    </div>
  );
};

export default FlipFlash;
