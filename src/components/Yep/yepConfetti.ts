/**
 * Pháo giấy nhỏ cho trang YEP (thay thư viện canvas-confetti của trang cũ, khỏi thêm dependency).
 * Màu SK: xanh thương hiệu + vàng điểm nhấn — giống SK_CONFETTI_COLORS bên repo yep.
 */
const COLORS = ['#2E7A2E', '#4C8925', '#72C272', '#A9DBA9', '#F2C75C', '#FFFFFF'];

interface Piece { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vr: number }

export function yepConfetti({ count = 120, originY = 0.7 } = {}) {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '60' });
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = (-90 + (Math.random() - 0.5) * 110) * (Math.PI / 180);
    const speed = 7 + Math.random() * 9;
    return {
      x: w / 2, y: h * originY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6, color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    };
  });
  const started = performance.now();
  const frame = (now: number) => {
    const t = now - started;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(0, 1 - t / 2600);
    for (const p of pieces) {
      p.vy += 0.25;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
