import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  EnvelopeOpenIcon,
  EyeSlashIcon,
  GiftIcon,
  MapPinIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  SparklesIcon,
  StarIcon,
  TicketIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import YepManager from '../components/Yep/YepManager';
import YepTicket from '../components/Yep/YepTicket';
import YepWordCloud from '../components/Yep/YepWordCloud';
import { yepConfetti } from '../components/Yep/yepConfetti';
import '../components/Yep/yep.css';
import {
  TBA,
  YEP_ASSETS,
  type YepComment,
  type YepEvent,
  type YepOverview,
  eventStart,
  eventWhen,
  yepErrorMessage,
  yepService,
} from '../services/yep.service';

/**
 * YEP – Year End Party (HCNS SK 2026-11-27): trang yep.amcare.vn (repo trunganh-group/yep, nhánh sk) chuyển vào HRM
 * để không phải dùng domain riêng. Nhân viên đăng nhập HRM = người đăng ký, nên không phải gõ mã NV / họ tên / phòng ban.
 * Luật & dữ liệu ở backend (hrm/yep.py).
 */

const FONT_LINK_ID = 'yep-title-fonts';
const URL_RE = /(https?:\/\/|www\.)\S+/i;

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const Card: React.FC<{ id?: string; icon: React.ElementType; title: string; children: React.ReactNode; className?: string }> = ({ id, icon: Icon, title, children, className = '' }) => (
  <section id={id} className={`scroll-mt-4 bg-white rounded-3xl shadow-lg p-5 sm:p-7 ${className}`}>
    <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1D4E1D] mb-4">
      <Icon className="h-6 w-6 text-[#2E7A2E]" /> {title}
    </h2>
    {children}
  </section>
);

const Countdown: React.FC<{ event: YepEvent }> = ({ event }) => {
  const target = eventStart(event);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target?.getTime()]);
  if (!target) return null;
  const seconds = Math.floor((target.getTime() - now) / 1000);
  if (seconds <= 0) return <p className="text-xl font-extrabold text-[#F2C75C] mb-6">🎉 Đêm tiệc đã bắt đầu!</p>;
  const units: [number, string][] = [
    [Math.floor(seconds / 86400), 'ngày'], [Math.floor((seconds % 86400) / 3600), 'giờ'],
    [Math.floor((seconds % 3600) / 60), 'phút'], [seconds % 60, 'giây'],
  ];
  return (
    <div className="flex justify-center gap-2 sm:gap-3 mb-7">
      {units.map(([v, label]) => (
        <div key={label} className="flex-1 sm:flex-none sm:min-w-[76px] rounded-2xl px-2 py-2.5 bg-black/20 ring-1 ring-[#FFE9A8]/25">
          <strong className="block text-2xl sm:text-3xl font-extrabold leading-tight text-[#F2C75C] tabular-nums">{String(v).padStart(2, '0')}</strong>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{label}</span>
        </div>
      ))}
    </div>
  );
};

const CommentCard: React.FC<{ c: YepComment; canDelete: boolean; onDelete: () => void }> = ({ c, canDelete, onDelete }) => {
  const [open, setOpen] = useState(false);
  const long = c.comment.length > 150;
  return (
    <div className="rounded-2xl bg-[#F0F7F0] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-full bg-[#2E7A2E] text-white flex items-center justify-center text-sm font-bold">
          {c.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{c.nickname}</div>
          <div className="text-[11px] text-gray-500">{new Date(c.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</div>
        </div>
        {canDelete && (
          <button title="Xoá chia sẻ" onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50"><TrashIcon className="h-4 w-4 text-red-500" /></button>
        )}
      </div>
      <p className={`text-sm text-gray-700 break-words ${long && !open ? 'line-clamp-3' : ''}`}>{c.comment}</p>
      {long && (
        <button onClick={() => setOpen(!open)} className="mt-1 text-xs font-semibold text-[#2E7A2E] hover:underline">
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

const Yep: React.FC = () => {
  const [data, setData] = useState<YepOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  // Đăng ký
  const [editing, setEditing] = useState(false);
  const [region, setRegion] = useState<string | null>(null);
  const [participation, setParticipation] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  // Văn nghệ
  const [program, setProgram] = useState('');
  const [perfType, setPerfType] = useState('');
  const [perfBusy, setPerfBusy] = useState(false);
  const [perfMsg, setPerfMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Chia sẻ
  const [nickname, setNickname] = useState('');
  const [comment, setComment] = useState('');
  const [cmtBusy, setCmtBusy] = useState(false);
  const [cmtError, setCmtError] = useState<string | null>(null);

  const load = useCallback(() => {
    yepService.overview()
      .then((d) => {
        setData(d);
        setError(null);
        const reg = d.me?.registration;
        setRegion(reg?.region ?? null);
        setParticipation(reg?.participation ?? null);
      })
      .catch((err) => setError(yepErrorMessage(err, 'Không tải được trang YEP')));
  }, []);

  useEffect(() => {
    load();
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Great+Vibes&family=Montserrat:wght@800&display=swap';
      document.head.appendChild(link);
    }
    const t = window.setTimeout(() => yepConfetti({ count: 100, originY: 0.6 }), 400);
    return () => window.clearTimeout(t);
  }, [load]);

  // Route dùng <Layout fullBleed> (không có padding) → các trạng thái phụ tự thêm khoảng cách.
  if (error) return <p className="p-4 sm:p-6 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-4 sm:p-6 text-sm text-gray-500">Đang tải...</p>;

  const { event, me, choices, is_manager: isManager } = data;
  if (!event) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {data.closed
            ? (data.closed_message || 'Trang YEP chưa mở cho nhân viên. HCNS sẽ thông báo khi mở đăng ký.')
            : 'Chưa có sự kiện YEP nào. HCNS sẽ thông báo khi mở đăng ký.'}
        </div>
      </div>
    );
  }

  const reg = me?.registration || null;
  const showForm = !!me && me.can_register && event.registration_open && (!reg || editing);
  const regOpen = event.registration_open;

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region || !participation) {
      setRegError('Chọn vùng / miền và có tham gia hay không.');
      return;
    }
    setRegBusy(true);
    setRegError(null);
    try {
      const res = await yepService.register(region, participation);
      setData((d) => d && { ...d, me: res.me, stats: res.stats });
      setEditing(false);
      yepConfetti({ count: 200, originY: 0.8 });
      window.setTimeout(() => scrollToId('ve-cua-ban'), 150);
    } catch (err) {
      setRegError(yepErrorMessage(err, 'Không đăng ký được'));
    } finally {
      setRegBusy(false);
    }
  };

  const submitPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerfBusy(true);
    setPerfMsg(null);
    try {
      const res = await yepService.addPerformance(program, perfType);
      setData((d) => d && { ...d, me: res.me, stats: res.stats });
      setProgram('');
      setPerfType('');
      setPerfMsg({ ok: true, text: 'Đăng ký tham gia văn nghệ thành công!' });
    } catch (err) {
      setPerfMsg({ ok: false, text: yepErrorMessage(err, 'Không đăng ký được tiết mục') });
    } finally {
      setPerfBusy(false);
    }
  };

  const removePerformance = async (id: number, name: string) => {
    if (!window.confirm(`Huỷ tiết mục "${name}"?`)) return;
    try {
      const res = await yepService.deletePerformance(id);
      setData((d) => d && { ...d, me: res.me, stats: res.stats });
    } catch (err) {
      setPerfMsg({ ok: false, text: yepErrorMessage(err, 'Không huỷ được tiết mục') });
    }
  };

  const commentHasLink = URL_RE.test(comment) || URL_RE.test(nickname);
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentHasLink) return;
    setCmtBusy(true);
    setCmtError(null);
    try {
      const res = await yepService.addComment(nickname, comment);
      setData((d) => d && { ...d, comments: res.comments, stats: res.stats });
      setComment('');
    } catch (err) {
      setCmtError(yepErrorMessage(err, 'Không gửi được chia sẻ'));
    } finally {
      setCmtBusy(false);
    }
  };

  const removeComment = async (c: YepComment) => {
    if (!window.confirm(`Xoá chia sẻ của "${c.nickname}"?`)) return;
    try {
      const res = await yepService.deleteComment(c.id);
      setData((d) => d && { ...d, comments: res.comments, stats: res.stats });
    } catch (err) {
      setCmtError(yepErrorMessage(err, 'Không xoá được chia sẻ'));
    }
  };

  const input = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7A2E]';
  const lockedBox = 'w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-100 text-gray-800 font-semibold';
  const primaryBtn = 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#2E7A2E] to-[#1D4E1D] text-white font-bold shadow hover:brightness-110 disabled:opacity-50';
  const radio = (name: string, value: string, label: string, current: string | null, onPick: (v: string) => void) => (
    <label key={value} className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-semibold transition
      ${current === value ? 'border-[#2E7A2E] bg-[#F0F7F0] text-[#1D4E1D]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick(value)} className="accent-[#2E7A2E]" />
      {label}
    </label>
  );
  const meta: [React.ElementType, string, string][] = [
    [CalendarDaysIcon, 'Thời gian', eventWhen(event)],
    [MapPinIcon, 'Địa điểm', event.venue_name || TBA],
    [SparklesIcon, 'Dresscode', event.dresscode || TBA],
  ];

  // Nền phủ kín vùng nội dung (route dùng <Layout fullBleed>). grow = lấp đầy khi nội dung ngắn; shrink-0 = khung
  // flex min-h-0 của Layout không co được trang lại → nội dung dài thì <main> cuộn. KHÔNG đặt overflow-hidden ở khung
  // này: item flex có overflow khác visible bị co về vừa màn hình → trang bị cắt, mất thanh cuộn (lỗi bản đầu).
  return (
    <div className="yep-page grow shrink-0 min-w-0 overflow-x-clip">
      {isManager && !event.open_to_staff && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 text-sm text-amber-900">
          <EyeSlashIcon className="h-5 w-5 shrink-0" />
          <p className="flex-1 min-w-[220px]">
            <b>Đang xem trước — nhân viên chưa thấy trang này.</b> Chỉ Admin / HCNS vào được. Đăng ký thử lúc này vẫn được
            lưu và chiếm số may mắn, nên xoá dữ liệu thử trước khi mở. Khi sẵn sàng, bật "Mở trang YEP cho toàn bộ nhân viên"
            trong Quản lý YEP.
          </p>
          <button onClick={() => setShowManager(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white ring-1 ring-amber-300 font-semibold hover:bg-amber-100">
            <Cog6ToothIcon className="h-4 w-4" /> Quản lý YEP
          </button>
        </div>
      )}
      {/* ── Banner kiểu poster ─────────────────────────────────────────── */}
      <header className="yep-hero px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 text-center text-white">
        {isManager && (
          <button onClick={() => setShowManager(true)}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold backdrop-blur">
            <Cog6ToothIcon className="h-4 w-4" /> Quản lý YEP
          </button>
        )}
        <div className="relative z-[1] max-w-3xl mx-auto">
          <img src={YEP_ASSETS.logoWhite} alt={event.company_name} className="h-16 sm:h-20 w-auto mx-auto mb-5 drop-shadow-lg" />
          <h1 className="yep-title mb-3" aria-label={event.name}>
            <span className="yep-title-main" aria-hidden="true">Year End</span>
            <span className="yep-title-script" aria-hidden="true">Party</span>
            <span className="yep-title-year" aria-hidden="true">{event.year}</span>
          </h1>
          <p className="max-w-xl mx-auto mb-6 text-base sm:text-lg font-medium text-white/90">Cả năm làm hết mình – Year End chơi hết nấc!</p>
          <div className="flex flex-wrap justify-center gap-3 mb-7">
            {meta.map(([Icon, label, value]) => (
              <div key={label} className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl text-left bg-black/20 ring-1 ring-white/20 backdrop-blur w-full sm:w-auto">
                <span className="yep-gold h-9 w-9 rounded-xl flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></span>
                <span>
                  <small className="block text-[11px] font-semibold uppercase tracking-widest text-white/70">{label}</small>
                  <strong className="text-sm sm:text-base font-bold">{value}</strong>
                </span>
              </div>
            ))}
          </div>
          <Countdown event={event} />
          <button onClick={() => scrollToId(reg ? 've-cua-ban' : 'dang-ky')}
            className="yep-gold inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-extrabold shadow-[0_12px_30px_rgba(217,162,58,0.35)] hover:-translate-y-0.5 transition">
            {reg ? <><TicketIcon className="h-5 w-5" /> Xem vé của bạn</> : <><PencilSquareIcon className="h-5 w-5" /> Đăng ký ngay</>}
          </button>
          {data.stats && (
            <p className="mt-4 text-xs text-white/70">
              {data.stats.participating} người tham gia · {data.stats.performances} tiết mục văn nghệ · {data.stats.comments} chia sẻ
            </p>
          )}
        </div>
      </header>

      <div className="px-3 sm:px-6 pb-8 space-y-6 max-w-6xl mx-auto">
        {/* ── Thư mời (nguyên văn thư ngỏ của trang cũ, chỉ thay tên công ty / năm / thông tin sự kiện) ── */}
        <section className="relative bg-white rounded-3xl shadow-lg px-5 sm:px-10 pt-10 pb-7 text-[15px] leading-relaxed text-gray-700">
          <span className="yep-gold absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full ring-4 ring-white flex items-center justify-center shadow">
            <EnvelopeOpenIcon className="h-6 w-6" />
          </span>
          <p className="text-lg font-extrabold text-[#1D4E1D] mb-4">Thân gửi: Toàn bộ Nhân sự của {event.company_name},</p>
          <p className="mb-4">Năm {event.year} khép lại với không ít biến động và thử thách, cũng là minh chứng cho tinh thần đoàn kết và nỗ lực không ngừng của tập thể Công ty trên hành trình trưởng thành và gặt hái những kết quả đáng trân trọng!</p>
          <p className="mb-4">Công ty xin gửi lời cảm ơn chân thành đến toàn thể nhân sự vì sự cống hiến, tinh thần trách nhiệm và gắn bó bền bỉ trong suốt một năm vừa qua.</p>
          <p className="mb-4">Như một lời tri ân sâu sắc, đồng thời tạo cơ hội để các thành viên gặp gỡ, chia sẻ và tiếp thêm năng lượng cùng hướng tới một năm mới nhiều mục tiêu và bứt phá, Công ty trân trọng tổ chức bữa tiệc {event.name} và thân mời toàn bộ nhân sự tham dự!</p>
          <ul className="grid gap-2 my-5 px-5 py-4 rounded-2xl bg-[#F0F7F0] border border-dashed border-[#2E7A2E]/35">
            <li><strong>🕐 Thời gian:</strong> {eventWhen(event, ' – ')}</li>
            <li><strong>📍 Địa điểm:</strong> {event.venue_address || event.venue_name || TBA}</li>
            <li><strong>👘 Dresscode:</strong> {event.dresscode || TBA}</li>
          </ul>
          <p className="mb-4">Để công tác tổ chức được chuẩn bị chu đáo, bạn vui lòng đăng ký tham dự bằng cách điền đầy đủ thông tin dưới đây. Sự hiện diện của bạn chính là mảnh ghép quan trọng cho đêm tiệc ấm áp và đáng nhớ của chúng ta!</p>
          <p className="font-bold text-[#2E7A2E]">Cả năm làm hết mình – Year End chơi hết nấc! Nhanh tay đăng ký để cùng nhau khép lại {event.year} thật rực rỡ 💙🔥</p>
        </section>

        {/* ── Đăng ký + vé ─────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card id="dang-ky" icon={PencilSquareIcon} title={reg && !editing ? 'Đăng ký thành công!' : 'Thông tin đăng ký'}>
            {!me ? (
              <p className="text-sm text-gray-600">Tài khoản chưa gắn với hồ sơ nhân viên nên không đăng ký được.</p>
            ) : !me.can_register ? (
              <p className="text-sm text-gray-600">Nhân viên đã nghỉ việc không đăng ký được.</p>
            ) : showForm ? (
              <form onSubmit={submitRegistration} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><div className="text-xs font-semibold text-gray-500 mb-1">Mã nhân viên</div><div className={lockedBox}>{me.employee_code}</div></div>
                  <div><div className="text-xs font-semibold text-gray-500 mb-1">Họ và tên</div><div className={lockedBox}>{me.full_name}</div></div>
                  <div className="sm:col-span-2"><div className="text-xs font-semibold text-gray-500 mb-1">Phòng ban</div><div className={lockedBox}>{me.department || '—'}</div></div>
                </div>
                <p className="text-xs text-gray-500">Thông tin lấy từ hồ sơ nhân sự trên HRM. Sai thông tin thì báo HCNS sửa hồ sơ.</p>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1.5">Vùng / Miền</div>
                  <div className="flex gap-2">{choices.regions.map((c) => radio('yep-region', c.value, c.label, region, setRegion))}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1.5">Bạn có tham gia YEP không?</div>
                  <div className="flex gap-2">{choices.participation.map((c) => radio('yep-participation', c.value, c.label, participation, setParticipation))}</div>
                </div>
                {regError && <p className="text-sm text-red-600">{regError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={regBusy} className={primaryBtn}>
                    <TicketIcon className="h-5 w-5" /> {regBusy ? 'Đang tạo vé...' : reg ? 'Cập nhật đăng ký' : 'Tạo vé ngay'}
                  </button>
                  {reg && (
                    <button type="button" onClick={() => { setEditing(false); setRegion(reg.region); setParticipation(reg.participation); setRegError(null); }}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Huỷ</button>
                  )}
                </div>
              </form>
            ) : reg ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="flex items-start gap-2"><CheckCircleIcon className="h-5 w-5 text-[#2E7A2E] shrink-0" />
                  Vé của bạn đã được tạo thành công. Bạn có thể tải về, chia sẻ hoặc in vé ngay bây giờ.</p>
                <p>Số may mắn: <b className="text-2xl font-extrabold text-[#B7791F] tracking-widest align-middle">{reg.lucky_number}</b></p>
                <p>{reg.region_label} · <b>{reg.participation === 'yes' ? 'Tham gia YEP' : 'Không tham gia YEP'}</b></p>
                {regOpen ? (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <PencilSquareIcon className="h-4 w-4" /> Sửa đăng ký
                  </button>
                ) : <p className="text-xs text-gray-500">Đã đóng đăng ký — muốn đổi thông tin thì liên hệ HCNS.</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Đã đóng đăng ký tham dự. Liên hệ HCNS nếu bạn cần đăng ký.</p>
            )}
          </Card>

          <Card id="ve-cua-ban" icon={TicketIcon} title="Vé của bạn">
            <YepTicket event={event} me={me} previewParticipation={showForm ? participation : null} />
          </Card>
        </div>

        {/* ── Lợi ích ─────────────────────────────────────────────────── */}
        <Card icon={StarIcon} title="Lợi ích khi tham gia">
          <div className="grid gap-3 sm:grid-cols-3">
            {([[GiftIcon, 'Quà tặng độc đáo', 'Nhận quà lưu niệm đặc biệt khi tham gia sự kiện'],
              [TrophyIcon, 'Giải thưởng giá trị', 'Cơ hội trúng thưởng giá trị cao với nhiều hạng mục'],
              [UsersIcon, 'Giao lưu đồng nghiệp', 'Kết nối và giao lưu với mọi người trong công ty']] as [React.ElementType, string, string][]).map(([Icon, t, d]) => (
              <div key={t} className="rounded-2xl bg-[#F0F7F0] p-5 text-center transition hover:-translate-y-1">
                <span className="yep-gold mx-auto mb-3 h-12 w-12 rounded-2xl flex items-center justify-center"><Icon className="h-6 w-6" /></span>
                <h3 className="font-bold text-gray-900">{t}</h3>
                <p className="text-sm text-gray-600">{d}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Văn nghệ ────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <Card id="van-nghe" icon={MusicalNoteIcon} title="Đăng ký tham gia văn nghệ">
            <p className="text-sm text-gray-600 mb-4">Nếu bạn muốn tham gia biểu diễn văn nghệ tại {event.short_name}, vui lòng đăng ký ở đây.</p>
            {me && me.can_register && regOpen ? (
              <form onSubmit={submitPerformance} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-gray-700">Tên tiết mục
                    <input className={input} value={program} maxLength={choices.program_max_length} required
                      onChange={(e) => setProgram(e.target.value)} placeholder="Nhập tên tiết mục" />
                  </label>
                  <label className="block text-sm font-semibold text-gray-700">Loại tiết mục
                    <select className={input} value={perfType} required onChange={(e) => setPerfType(e.target.value)}>
                      <option value="">-- Chọn loại tiết mục --</option>
                      {choices.performance_types.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </label>
                </div>
                <p className="text-xs text-gray-500">Người đăng ký: <b>{me.full_name}</b> ({me.employee_code}{me.department ? ` · ${me.department}` : ''})</p>
                {perfMsg && <p className={`text-sm ${perfMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{perfMsg.text}</p>}
                <button type="submit" disabled={perfBusy} className={primaryBtn}>
                  <MusicalNoteIcon className="h-5 w-5" /> {perfBusy ? 'Đang gửi...' : 'Đăng ký văn nghệ'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-500">{!regOpen ? 'Đã đóng đăng ký văn nghệ.' : 'Tài khoản của bạn không đăng ký được.'}</p>
            )}
            {me && me.performances.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-bold text-gray-900 mb-2">Tiết mục bạn đã đăng ký</div>
                <ul className="divide-y divide-gray-100 rounded-2xl ring-1 ring-gray-100">
                  {me.performances.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.program_name}</div>
                        <div className="text-xs text-gray-500">{p.type_label}</div>
                      </div>
                      <button title="Huỷ tiết mục" onClick={() => removePerformance(p.id, p.program_name)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card icon={TrophyIcon} title="Giải thưởng văn nghệ">
            <div className="grid gap-3 grid-cols-2">
              {event.prizes.map((p) => (
                <div key={p.type} className="rounded-2xl bg-[#F0F7F0] p-4 text-center">
                  <span className="yep-gold mx-auto mb-2 h-10 w-10 rounded-xl flex items-center justify-center"><TrophyIcon className="h-5 w-5" /></span>
                  <h3 className="text-sm font-bold text-gray-900">{p.label}</h3>
                  <p className={`text-sm font-extrabold ${p.amount ? 'text-[#B7791F]' : 'text-gray-400'}`}>{p.amount || TBA}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Chia sẻ + word cloud ────────────────────────────────────── */}
        <Card id="binh-luan" icon={ChatBubbleLeftRightIcon} title="Bình luận">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <form onSubmit={submitComment} className="space-y-3">
              <div className="text-sm font-bold text-gray-900">Nói điều gì đó bạn tự hào, hoặc nuối tiếc, trong năm vừa qua</div>
              <label className="block text-sm font-semibold text-gray-700">Biệt danh
                <input className={input} value={nickname} maxLength={choices.nickname_max_length} required
                  onChange={(e) => setNickname(e.target.value)} placeholder="Nhập biệt danh của bạn" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">Chia sẻ của bạn
                <textarea className={input} rows={4} value={comment} maxLength={choices.comment_max_length} required
                  onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ điều bạn tự hào hoặc nuối tiếc trong năm vừa qua..." />
              </label>
              <p className="text-xs text-gray-500">Chỉ hiện biệt danh — hệ thống không lưu tên người gửi.</p>
              {commentHasLink && <p className="text-sm text-red-600">Bình luận không được chứa đường link.</p>}
              {cmtError && <p className="text-sm text-red-600">{cmtError}</p>}
              <button type="submit" disabled={cmtBusy || commentHasLink || !me?.can_register} className={primaryBtn}>
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> {cmtBusy ? 'Đang gửi...' : 'Gửi chia sẻ'}
              </button>
            </form>
            <div>
              <div className="text-sm font-bold text-gray-900 mb-2">Bình luận gần đây</div>
              {data.comments.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-1">
                  {data.comments.map((c) => <CommentCard key={c.id} c={c} canDelete={isManager} onDelete={() => removeComment(c)} />)}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card icon={SparklesIcon} title="Word Cloud từ bình luận">
          <YepWordCloud comments={data.comments} />
        </Card>

        <footer className="text-center text-white/85 pt-4">
          <img src={YEP_ASSETS.logoWhite} alt={event.company_name} className="h-12 w-auto mx-auto mb-3 opacity-90" />
          <p className="text-sm font-semibold">{event.company_name.toUpperCase()}{event.company_address ? `, ${event.company_address}` : ''}</p>
          <p className="text-xs text-white/60">{event.name} · Cả năm làm hết mình – Year End chơi hết nấc!</p>
        </footer>
      </div>

      {showManager && (
        <YepManager event={event} onClose={(changed) => {
          setShowManager(false);
          if (changed) load();
        }} />
      )}
    </div>
  );
};

export default Yep;
