import { CanvasSlot, FrameState } from './types';
import {
  SIZE_A,
  SIZE_B_W,
  SIZE_B_H,
  COLORS,
} from './constants';

export function getSlot(format: 'A' | 'B'): CanvasSlot {
  if (format === 'A') {
    return {
      shape: 'circle',
      cx: 600,
      cy: 600,
      r: 430,
      x: 600 - 430,
      y: 600 - 430,
      w: 860,
      h: 860,
    };
  }
  return { shape: 'rect', x: 140, y: 210, w: 800, h: 640, r: 26 };
}

export function hexToRgba(hex: string, a: number): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function buildDotPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  alpha: number,
  spacing: number
): CanvasPattern {
  const pc = document.createElement('canvas');
  pc.width = spacing;
  pc.height = spacing;
  const pctx = pc.getContext('2d')!;
  pctx.fillStyle = 'rgba(0,0,0,0)';
  pctx.fillRect(0, 0, spacing, spacing);
  pctx.fillStyle = hexToRgba(color, alpha);
  pctx.beginPath();
  pctx.arc(spacing / 2, spacing / 2, 1.6, 0, Math.PI * 2);
  pctx.fill();
  return ctx.createPattern(pc, 'repeat')!;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight: string,
  family: string
): number {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  color: string,
  font: string,
  spacing: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(startAngle);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const w = ctx.measureText(ch).width + spacing;
    const ang = w / radius;
    ctx.rotate(ang / 2);
    ctx.save();
    ctx.translate(0, -radius);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    ctx.rotate(ang / 2);
  }
  ctx.restore();
}

export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: CanvasSlot,
  state: FrameState
): void {
  ctx.save();
  if (slot.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(slot.cx!, slot.cy!, slot.r!, 0, Math.PI * 2);
    ctx.clip();
  } else {
    roundRectPath(ctx, slot.x!, slot.y!, slot.w!, slot.h!, slot.r!);
    ctx.clip();
  }
  const drawW = state.imgW * state.scale;
  const drawH = state.imgH * state.scale;
  const slotCx = slot.shape === 'circle' ? slot.cx! : slot.x! + slot.w! / 2;
  const slotCy = slot.shape === 'circle' ? slot.cy! : slot.y! + slot.h! / 2;
  const dx = slotCx - state.cx * state.scale;
  const dy = slotCy - state.cy * state.scale;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();
}

export function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rot: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.translate(-cx, -cy);
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.navy;
  ctx.font = '700 15px "Space Grotesk"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', cx, cy + 4);
  drawArcText(
    ctx,
    '✦ GOA ✦ 15.30N ',
    cx,
    cy,
    r - 20,
    -Math.PI / 2,
    COLORS.navy,
    '600 9px "IBM Plex Mono"',
    1.5
  );
  ctx.restore();
}

export function drawMiniMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.save();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.teal;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy + r * 0.15);
  ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.15, cx, cy + r * 0.15);
  ctx.quadraticCurveTo(cx + r * 0.3, cy + r * 0.4, cx + r * 0.55, cy + r * 0.15);
  ctx.stroke();
  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.3, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function builderNumber(seedStr: string): string {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const n = (h % 900) + 100;
  return '#' + String(n).padStart(4, '0');
}

export function renderA(
  ctx: CanvasRenderingContext2D,
  state: FrameState
): void {
  const W = SIZE_A;
  const H = SIZE_A;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, W, H);

  if (!state.patternA) {
    state.patternA = buildDotPattern(ctx, W, H, COLORS.sand, 0.05, 34);
  }
  ctx.fillStyle = state.patternA;
  ctx.fillRect(0, 0, W, H);

  const sunset = ctx.createRadialGradient(600, 600, 120, 600, 600, 600);
  sunset.addColorStop(0, hexToRgba(COLORS.gold, 0.35));
  sunset.addColorStop(0.55, hexToRgba(COLORS.coral, 0.16));
  sunset.addColorStop(1, 'rgba(10,14,26,0)');
  ctx.fillStyle = sunset;
  ctx.beginPath();
  ctx.arc(600, 600, 600, 0, Math.PI * 2);
  ctx.fill();

  const slot = getSlot('A');
  if (state.img) {
    drawPhoto(ctx, state.img, slot, state);
  } else {
    ctx.fillStyle = COLORS.navy3;
    ctx.beginPath();
    ctx.arc(slot.cx!, slot.cy!, slot.r!, 0, Math.PI * 2);
    ctx.fill();
  }

  // ring
  const ringGrad = ctx.createConicGradient ? ctx.createConicGradient(0, 600, 600) : null;
  if (ringGrad) {
    ringGrad.addColorStop(0, COLORS.coral);
    ringGrad.addColorStop(0.33, COLORS.pink);
    ringGrad.addColorStop(0.66, COLORS.gold);
    ringGrad.addColorStop(1, COLORS.coral);
    ctx.strokeStyle = ringGrad;
  } else {
    ctx.strokeStyle = COLORS.coral;
  }
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.arc(600, 600, 452, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = hexToRgba(COLORS.navy, 0.6);
  ctx.beginPath();
  ctx.arc(600, 600, 432, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(600, 600, 472, 0, Math.PI * 2);
  ctx.stroke();

  // arc text ring
  const arcStr = 'HH GOA 2026 ✦ BUILDER EDITION ✦ ';
  const full = arcStr.repeat(3);
  drawArcText(
    ctx,
    full,
    600,
    600,
    545,
    -Math.PI / 2,
    hexToRgba(COLORS.sand, 0.85),
    '600 21px "IBM Plex Mono"',
    3
  );

  // tide stamp
  drawStamp(ctx, 887, 1010, 78, (-12 * Math.PI) / 180);

  ctx.strokeStyle = hexToRgba(COLORS.sand, 0.08);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(600, 600, 598, 0, Math.PI * 2);
  ctx.stroke();
}

export function renderB(
  ctx: CanvasRenderingContext2D,
  state: FrameState
): void {
  const W = SIZE_B_W;
  const H = SIZE_B_H;
  ctx.clearRect(0, 0, W, H);

  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(0, 0, W, H);
  if (!state.patternB) {
    state.patternB = buildDotPattern(ctx, W, H, COLORS.navy, 0.05, 30);
  }
  ctx.fillStyle = state.patternB;
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, W, 150);
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, hexToRgba(COLORS.coral, 0.5));
  hg.addColorStop(1, hexToRgba(COLORS.teal, 0.35));
  ctx.fillStyle = hg;
  ctx.fillRect(0, 144, W, 6);

  ctx.fillStyle = COLORS.sand;
  ctx.font = '700 34px "Space Grotesk"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HH GOA', 56, 62);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('2026', 56, 100);
  ctx.font = '600 11px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.sand, 0.6);
  ctx.fillText('BUILDER ACCESS PASS', 56 + 150, 100);

  drawMiniMark(ctx, W - 95, 75, 34);

  // dashed separator under header
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = hexToRgba(COLORS.navy, 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 150);
  ctx.lineTo(W - 30, 150);
  ctx.stroke();
  ctx.setLineDash([]);

  // photo frame
  const slot = getSlot('B');
  const borderGrad = ctx.createLinearGradient(
    slot.x!,
    slot.y!,
    slot.x! + slot.w!,
    slot.y! + slot.h!
  );
  borderGrad.addColorStop(0, COLORS.coral);
  borderGrad.addColorStop(0.5, COLORS.pink);
  borderGrad.addColorStop(1, COLORS.gold);
  roundRectPath(
    ctx,
    slot.x! - 8,
    slot.y! - 8,
    slot.w! + 16,
    slot.h! + 16,
    slot.r! + 8
  );
  ctx.fillStyle = borderGrad;
  ctx.fill();

  if (state.img) {
    drawPhoto(ctx, state.img, slot, state);
  } else {
    roundRectPath(ctx, slot.x!, slot.y!, slot.w!, slot.h!, slot.r!);
    ctx.fillStyle = COLORS.navy3;
    ctx.fill();
    ctx.fillStyle = hexToRgba(COLORS.sand, 0.4);
    ctx.font = '500 16px "IBM Plex Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Your photo goes here',
      slot.x! + slot.w! / 2,
      slot.y! + slot.h! / 2
    );
  }

  // name
  const name = (state.fields.name || 'Your Name').trim() || 'Your Name';
  const nameY = slot.y! + slot.h! + 64;
  const nameSize = fitFontSize(
    ctx,
    name,
    W - 160,
    54,
    28,
    '700',
    '"Space Grotesk"'
  );
  ctx.font = `700 ${nameSize}px "Space Grotesk"`;
  ctx.fillStyle = COLORS.navy;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, W / 2, nameY);

  // role chip
  const role = (state.fields.role || 'Full-Stack Builder').trim() || 'Full-Stack Builder';
  const roleText = '</> ' + role;
  ctx.font = '600 17px "IBM Plex Mono"';
  const roleSize = fitFontSize(
    ctx,
    roleText,
    W - 220,
    17,
    12,
    '600',
    '"IBM Plex Mono"'
  );
  ctx.font = `600 ${roleSize}px "IBM Plex Mono"`;
  const rw = ctx.measureText(roleText).width + 40;
  const rh = roleSize + 22;
  const ry = nameY + 26;
  roundRectPath(ctx, W / 2 - rw / 2, ry, rw, rh, rh / 2);
  ctx.fillStyle = COLORS.navy;
  ctx.fill();
  ctx.fillStyle = COLORS.teal;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, W / 2, ry + rh / 2 + 1);

  // builder title
  const titleY = ry + rh + 58;
  ctx.font = '600 12px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.navy, 0.5);
  ctx.textAlign = 'center';
  ctx.fillText('B U I L D E R   T I T L E', W / 2, titleY);

  const title = (state.fields.title || 'Full-Stack Wave Rider').trim() || 'Full-Stack Wave Rider';
  const titleSize = fitFontSize(
    ctx,
    title,
    W - 140,
    40,
    22,
    '700',
    '"Space Grotesk"'
  );
  ctx.font = `700 ${titleSize}px "Space Grotesk"`;
  const tg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  tg.addColorStop(0, COLORS.coral);
  tg.addColorStop(1, COLORS.pink);
  ctx.fillStyle = tg;
  ctx.fillText(title, W / 2, titleY + 48);

  ctx.restore(); // end clip for rounded card

  // footer
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.save();
  ctx.clip();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = hexToRgba(COLORS.navy, 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, H - 150);
  ctx.lineTo(W - 30, H - 150);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, H - 144, W, 144);
  const fg = ctx.createLinearGradient(0, 0, W, 0);
  fg.addColorStop(0, hexToRgba(COLORS.teal, 0.35));
  fg.addColorStop(1, hexToRgba(COLORS.coral, 0.5));
  ctx.fillStyle = fg;
  ctx.fillRect(0, H - 150, W, 6);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 16px "Space Grotesk"';
  ctx.fillStyle = COLORS.sand;
  ctx.fillText('HH GOA 2026', 56, H - 100);
  ctx.font = '500 11px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.sand, 0.55);
  ctx.fillText('15.2993° N · 74.1240° E', 56, H - 76);

  ctx.textAlign = 'center';
  ctx.font = '600 15px "IBM Plex Mono"';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('#FrameInGoa', W / 2, H - 88);

  ctx.textAlign = 'right';
  ctx.font = '600 11px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.sand, 0.55);
  ctx.fillText('BUILDER NO.', W - 56, H - 100);
  ctx.font = '700 20px "IBM Plex Mono"';
  ctx.fillStyle = COLORS.sand;
  ctx.fillText(builderNumber(name), W - 56, H - 76);

  ctx.restore();

  // outer hairline
  roundRectPath(ctx, 1, 1, W - 2, H - 2, 27);
  ctx.strokeStyle = hexToRgba(COLORS.navy, 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
}
