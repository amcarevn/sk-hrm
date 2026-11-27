import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  IdentificationIcon,
  MapPinIcon,
  PrinterIcon,
  QrCodeIcon,
  ShareIcon,
  TicketIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  TBA,
  TICKET_TEXT,
  YEP_ASSETS,
  formatEventDate,
  type YepEvent,
  type YepMe,
} from '../../services/yep.service';
import { yepConfetti } from './yepConfetti';

/**
 * Vé tham dự YEP (chuyển từ #ticketDesign + các nút Tải / Chia sẻ / In của repo yep).
 * "Tải vé" in họ tên / phòng ban / số may mắn + ngày giờ / địa điểm lên poster yep_2026_ticket.jpg theo đúng toạ độ cũ.
 */

interface Props {
  event: YepEvent;
  me: YepMe | null;
  /** Lựa chọn đang chọn trên form khi chưa đăng ký — vé xem trước chạy theo form như trang cũ. */
  previewParticipation?: string | null;
}

const statusText = (participation?: string | null) =>
  participation === 'yes' ? 'Đã đăng ký tham gia' : participation === 'no' ? 'Đã đăng ký không tham gia' : 'Chưa đăng ký';

/** "Saturday 16/01/2027 | 17:30" — đúng định dạng dòng ngày giờ trên poster gốc. */
const posterDateLine = (event: YepEvent) => {
  const date = formatEventDate(event.event_date);
  if (!date || !event.event_date) return TBA;
  const [y, m, d] = event.event_date.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday} ${date}${event.event_time ? ` | ${event.event_time}` : ''}`;
};

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

async function drawPoster(event: YepEvent, name: string, department: string, luckyNumber: string) {
  const img = await loadImage(YEP_ASSETS.ticketPoster);
  // Chờ font Be Vietnam Pro sẵn sàng để chữ trên vé không rơi về font mặc định
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('400 32px "Be Vietnam Pro"'),
      document.fonts.load('600 36px "Be Vietnam Pro"'),
    ]).catch(() => undefined);
  }
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = TICKET_TEXT.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  const cx = canvas.width / 2;
  const line = (text: string, y: number, font: string) => {
    ctx.font = font;
    ctx.strokeText(text, cx, y);
    ctx.fillText(text, cx, y);
  };
  line(name, TICKET_TEXT.name_y, '600 42px "Be Vietnam Pro", Arial');
  if (department) line(`Phòng ban: ${department}`, TICKET_TEXT.department_y, '400 32px "Be Vietnam Pro", Arial');
  line(`Số may mắn: ${luckyNumber}`, TICKET_TEXT.lucky_number_y, '400 32px "Be Vietnam Pro", Arial');

  // Ngày giờ / địa điểm / thành phố giữa hai cặp ly (giới hạn 520px để không đè lên ly)
  ctx.save();
  ctx.fillStyle = TICKET_TEXT.info_color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.font = '400 38px "Be Vietnam Pro", Arial';
  ctx.fillText(posterDateLine(event), cx, TICKET_TEXT.datetime_y, 520);
  if (event.venue_name) {
    ctx.font = '600 36px "Be Vietnam Pro", Arial';
    ctx.fillText(event.venue_name, cx, TICKET_TEXT.venue_y, 520);
  }
  if (event.venue_city) {
    ctx.font = '400 32px "Be Vietnam Pro", Arial';
    ctx.fillText(event.venue_city, cx, TICKET_TEXT.city_y, 520);
  }
  ctx.restore();
  return canvas;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const Row: React.FC<{ icon: React.ElementType; label: string; value: string; strong?: boolean }> = ({ icon: Icon, label, value, strong }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-[color:var(--yep-ticket-line)] last:border-0">
    <span className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--yep-muted)] shrink-0">
      <Icon className="h-4 w-4 text-[color:var(--yep-icon)]" /> {label}
    </span>
    <span className={`text-right ${strong ? 'text-xl font-extrabold text-[color:var(--yep-gold-text)] tracking-widest' : 'text-sm font-bold text-[color:var(--yep-strong)]'}`}>{value}</span>
  </div>
);

const YepTicket: React.FC<Props> = ({ event, me, previewParticipation }) => {
  const reg = me?.registration || null;
  const [busy, setBusy] = useState(false);
  const status = statusText(reg ? reg.participation : previewParticipation);
  const lucky = reg?.lucky_number || '---';

  const download = async () => {
    if (!me || !reg) return;
    setBusy(true);
    try {
      const canvas = await drawPoster(event, me.full_name, me.department, reg.lucky_number);
      const link = document.createElement('a');
      link.download = `ve-${event.short_name.replace(/\s+/g, '-').toLowerCase()}-${me.employee_code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      yepConfetti({ count: 150, originY: 0.8 });
    } catch {
      window.alert('Không tạo được ảnh vé, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!reg) return;
    const text = `Tôi vừa đăng ký tham gia ${event.short_name}! Số may mắn: ${reg.lucky_number}`;
    if (navigator.share) {
      await navigator.share({ title: `Vé tham dự ${event.short_name}`, text }).catch(() => undefined);
    } else {
      window.alert('Chức năng chia sẻ chỉ khả dụng trên các trình duyệt hỗ trợ chia sẻ (thường là điện thoại).');
    }
  };

  const print = () => {
    if (!me || !reg) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const rows: [string, string][] = [
      ['Mã nhân viên', me.employee_code], ['Họ và tên', me.full_name], ['Phòng ban', me.department || '—'],
      ['Số may mắn', reg.lucky_number], ['Trạng thái', status],
      ['Ngày', formatEventDate(event.event_date) || TBA], ['Giờ', event.event_time || TBA], ['Địa điểm', event.venue_name || TBA],
    ];
    w.document.write(`<html><head><title>In vé - ${escapeHtml(event.short_name)}</title><style>
      body{font-family:Arial,sans-serif;padding:20px}
      .t{border:2px solid #2E7A2E;border-radius:10px;padding:20px;max-width:500px;margin:0 auto}
      h3{margin:0 0 4px;color:#2E7A2E}.s{margin:0 0 16px;color:#555}
      .r{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #cfe3cf}.r b{font-weight:bold}
      .f{margin-top:16px;text-align:center;letter-spacing:2px;color:#2E7A2E;font-weight:bold}
    </style></head><body><div class="t"><h3>VÉ THAM DỰ</h3><p class="s">MINI GAME ${escapeHtml(event.short_name.toUpperCase())}</p>
      ${rows.map(([k, v]) => `<div class="r"><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></div>`).join('')}
      <div class="f">${escapeHtml(event.company_name.toUpperCase())}</div></div></body></html>`);
    w.document.close();
    w.print();
  };

  const btn = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-md rounded-2xl overflow-hidden yep-ticket shadow-xl bg-white ring-1 ring-emerald-100">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-[#2E7A2E] to-[#1D4E1D] text-white">
          <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-2xl">🦷</div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-extrabold tracking-wide">VÉ THAM DỰ</div>
            <div className="text-xs text-white/80 tracking-wider">MINI GAME {event.short_name.toUpperCase()}</div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-[var(--yep-field)] flex items-center justify-center">
            <QrCodeIcon className="h-8 w-8 text-[color:var(--yep-title)]" />
          </div>
        </div>
        <div className="px-5 py-3">
          <Row icon={IdentificationIcon} label="Mã nhân viên" value={me?.employee_code || '---'} />
          <Row icon={UserIcon} label="Họ và tên" value={me?.full_name || '---'} />
          <Row icon={BuildingOfficeIcon} label="Phòng ban" value={me?.department || '---'} />
          <Row icon={TicketIcon} label="Số may mắn" value={lucky} strong />
          <Row icon={CheckBadgeIcon} label="Trạng thái" value={status} />
        </div>
        <div className="px-5 py-3 bg-[var(--yep-panel)] text-xs text-[color:var(--yep-text)] grid gap-1">
          {([[CalendarDaysIcon, 'Ngày', formatEventDate(event.event_date) || TBA], [ClockIcon, 'Giờ', event.event_time || TBA],
            [MapPinIcon, 'Địa điểm', event.venue_name || TBA]] as [React.ElementType, string, string][]).map(([Icon, label, value]) => (
            <div key={label} className="flex items-start gap-1.5">
              <Icon className="h-4 w-4 text-[color:var(--yep-icon)] shrink-0 mt-px" />
              <span>{label}: <b>{value}</b></span>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-[color:var(--yep-ticket-line)] px-5 py-2 text-center text-[11px] font-bold tracking-[0.3em] text-[color:var(--yep-icon)]">
          {event.company_name.toUpperCase()}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={download} disabled={!reg || busy} className={`${btn} yep-gold shadow`}>
          <ArrowDownTrayIcon className="h-4 w-4" /> {busy ? 'Đang tạo...' : 'Tải vé'}
        </button>
        <button onClick={share} disabled={!reg} className={`${btn} bg-[var(--yep-raised)] text-[color:var(--yep-text)] ring-1 ring-[color:var(--yep-line)] hover:bg-[var(--yep-panel)]`}>
          <ShareIcon className="h-4 w-4" /> Chia sẻ
        </button>
        <button onClick={print} disabled={!reg} className={`${btn} bg-[var(--yep-raised)] text-[color:var(--yep-text)] ring-1 ring-[color:var(--yep-line)] hover:bg-[var(--yep-panel)]`}>
          <PrinterIcon className="h-4 w-4" /> In vé
        </button>
      </div>
    </div>
  );
};

export default YepTicket;
