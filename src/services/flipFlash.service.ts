import { managementApi } from '../utils/api';

/**
 * Minigame Flip Flash – Memory Challenge (HCNS SK 2026-11-26). Backend: hrm/flip_flash*.py (nhánh sk).
 * Luật (số vòng, giờ chơi tối đa, số thẻ...) nằm ở backend — trang chỉ đọc qua API. Đáp án chỉ nằm ở
 * server: mỗi lần lật, server trả hình của đúng ô đó, và server tính giờ.
 */

const BASE = '/api-hrm/flip-flash';
const SEASONS = '/api-hrm/flip-flash-seasons';

export type AttemptStatus = 'PLAYING' | 'FINISHED' | 'EXPIRED' | 'DISQUALIFIED';
export type PhaseStatus = 'upcoming' | 'ongoing' | 'ended';

export interface FlipEntry {
  attempt_id: number;
  employee: number;
  employee_code: string;
  full_name: string;
  department: string;
  duration_ms: number;
  moves: number;
  flips: number;
  finished_at: string;
}

export interface FlipRound {
  round_no: number;
  label: string;
  start: string;
  end: string;
  status: PhaseStatus;
  player_count: number;
  winner: FlipEntry | null;
  leader: FlipEntry | null;
}

export interface FlipAttemptState {
  id: number;
  season: number;
  round_no: number;
  round_label: string;
  status: AttemptStatus;
  rows: number;
  cols: number;
  total_pairs: number;
  matched: Record<string, number>;
  pending: { index: number; symbol: number } | null;
  flips: number;
  moves: number;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  elapsed_ms: number | null;
  max_play_seconds: number;
  rank: number | null;
  disqualified_reason: string;
}

export interface FlipConfig {
  week_rounds: number;
  final_round: number;
  max_play_seconds: number;
  symbol_count: number;
  min_side: number;
  max_side: number;
  max_final_days: number;
}

export interface FlipOverview {
  config: FlipConfig;
  today: string;
  is_manager: boolean;
  seasons: { id: number; name: string; start_date: string; end_date: string }[];
  season: null | {
    id: number;
    name: string;
    note: string;
    start_date: string;
    end_date: string;
    final_days: number;
    rows: number;
    cols: number;
    status: PhaseStatus;
    current_round: number | null;
    rounds: FlipRound[];
    finalists: FlipEntry[];
    champion: FlipEntry | null;
  };
  me: null | {
    employee_code: string | null;
    full_name: string | null;
    round_no: number | null;
    can_play: boolean;
    reason: string | null;
    is_finalist: boolean;
    attempt: FlipAttemptState | null;
  };
}

export interface FlipResult {
  index: number;
  symbol: number;
  result: 'first' | 'match' | 'mismatch';
  first_index: number | null;
  state: FlipAttemptState;
}

export interface LeaderboardRow extends FlipEntry {
  rank: number | null;
  status: AttemptStatus;
  is_winner: boolean;
  is_previous_winner: boolean;
  disqualified_reason?: string;
}

export interface Leaderboard {
  season: number;
  round_no: number;
  label: string;
  rows: LeaderboardRow[];
  my_rank: number | null;
}

export interface FlipSeason {
  id: number;
  name: string;
  start_date: string;
  final_days: number;
  rows: number;
  cols: number;
  note: string;
  end_date: string;
  attempt_count: number;
}

export type FlipSeasonInput = Pick<FlipSeason, 'name' | 'start_date' | 'final_days' | 'rows' | 'cols' | 'note'>;

/** Lỗi DRF: {detail} hoặc {field: [msg]} → 1 câu. */
export const flipErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return err?.message || fallback;
};

export const flipFlashService = {
  async overview(seasonId?: number): Promise<FlipOverview> {
    const res = await managementApi.get(`${BASE}/`, { params: seasonId ? { season: seasonId } : {} });
    return res.data;
  },

  async play(): Promise<FlipAttemptState> {
    const res = await managementApi.post(`${BASE}/play/`);
    return res.data;
  },

  async flip(attempt: number, index: number): Promise<FlipResult> {
    const res = await managementApi.post(`${BASE}/flip/`, { attempt, index });
    return res.data;
  },

  async leaderboard(season: number, round: number): Promise<Leaderboard> {
    const res = await managementApi.get(`${BASE}/leaderboard/`, { params: { season, round } });
    return res.data;
  },

  async disqualify(attempt: number, reason: string): Promise<void> {
    await managementApi.post(`${BASE}/disqualify/`, { attempt, reason });
  },

  async reinstate(attempt: number): Promise<void> {
    await managementApi.post(`${BASE}/reinstate/`, { attempt });
  },

  async seasons(): Promise<FlipSeason[]> {
    const res = await managementApi.get(`${SEASONS}/`);
    return res.data;
  },

  async saveSeason(input: FlipSeasonInput, id?: number): Promise<FlipSeason> {
    const res = id
      ? await managementApi.patch(`${SEASONS}/${id}/`, input)
      : await managementApi.post(`${SEASONS}/`, input);
    return res.data;
  },

  async deleteSeason(id: number): Promise<void> {
    await managementApi.delete(`${SEASONS}/${id}/`);
  },
};

/** 32 hình thẻ — mã 0–31 do server trả (config.symbol_count). */
export const FLIP_SYMBOLS = [
  '🦷', '🪥', '😁', '💎', '🌟', '🍀', '🍎', '🍋', '🍇', '🍓', '🍉', '🥑', '🌸', '🌻', '🌈', '🔥',
  '⚡', '❄️', '🎈', '🎁', '🎵', '⚽', '🏀', '🚀', '🐶', '🐱', '🐼', '🦊', '🐬', '🦋', '🐢', '🦄',
];

/** 83456 ms → "01:23.45" */
export const formatDuration = (ms: number | null | undefined): string => {
  if (ms == null) return '—';
  const total = Math.max(0, Math.floor(ms / 10));
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

/** "2026-11-30" → "30/11" (kèm năm nếu withYear) */
export const formatDay = (iso: string, withYear = false): string => {
  const [y, m, d] = iso.split('-');
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
};
