import { COLORS, SIZE_A, SIZE_B_H, SIZE_B_W } from "./constants";
import { CanvasSlot, FrameState } from "./types";

export function getSlot(format: "A" | "B"): CanvasSlot {
  if (format === "A") {
    return {
      shape: "circle",
      cx: 600,
      cy: 590,
      r: 380,
      x: 220,
      y: 210,
      w: 760,
      h: 760,
    };
  }
  // Photo slot for ID card — pink background area
  return { shape: "rect", x: 130, y: 205, w: 820, h: 440, r: 0 };
}

export function hexToRgba(hex: string, a: number): string {
  const v = hex.replace("#", "");
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
  spacing: number,
): CanvasPattern {
  console.log(w, h);
  const pc = document.createElement("canvas");
  pc.width = spacing;
  pc.height = spacing;
  const pctx = pc.getContext("2d")!;
  pctx.fillStyle = "rgba(0,0,0,0)";
  pctx.fillRect(0, 0, spacing, spacing);
  pctx.fillStyle = hexToRgba(color, alpha);
  pctx.beginPath();
  pctx.arc(spacing / 2, spacing / 2, 1.6, 0, Math.PI * 2);
  pctx.fill();
  return ctx.createPattern(pc, "repeat")!;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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
  family: string,
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
  spacing: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(startAngle);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
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
  state: FrameState,
): void {
  ctx.save();
  if (slot.shape === "circle") {
    ctx.beginPath();
    ctx.arc(slot.cx!, slot.cy!, slot.r!, 0, Math.PI * 2);
    ctx.clip();
  } else {
    roundRectPath(ctx, slot.x!, slot.y!, slot.w!, slot.h!, slot.r!);
    ctx.clip();
  }
  const drawW = state.imgW * state.scale;
  const drawH = state.imgH * state.scale;
  const slotCx = slot.shape === "circle" ? slot.cx! : slot.x! + slot.w! / 2;
  const slotCy = slot.shape === "circle" ? slot.cy! : slot.y! + slot.h! / 2;
  const dx = slotCx - state.cx * state.scale;
  const dy = slotCy - state.cy * state.scale;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();
}

export function builderNumber(seedStr: string): string {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const n = (h % 900) + 100;
  return "ID-" + String(n).padStart(2, "0");
}

// ─────────────────────────────────────────────────────────────────────
// DRAW CIRCUIT BOARD PATTERN on the dark green background
// ─────────────────────────────────────────────────────────────────────
function drawCircuitPattern(
  ctx: CanvasRenderingContext2D,
  W: number,
): void {
  ctx.save();
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.12);
  ctx.lineWidth = 2;
  ctx.lineCap = "square";

  // Horizontal lines with breaks (circuit traces)
  const hLines = [
    { y: 140, x1: 60, x2: 320 },
    { y: 220, x1: 200, x2: 500 },
    { y: 340, x1: 60, x2: 180 },
    { y: 480, x1: 60, x2: 140 },
    { y: 560, x1: 60, x2: 260 },
    { y: 760, x1: 800, x2: W - 60 },
    { y: 840, x1: 700, x2: W - 60 },
    { y: 940, x1: 800, x2: W - 60 },
    { y: 1020, x1: 700, x2: W - 60 },
    { y: 160, x1: W - 360, x2: W - 60 },
    { y: 300, x1: W - 300, x2: W - 60 },
    { y: 420, x1: W - 260, x2: W - 60 },
  ];

  hLines.forEach(({ y, x1, x2 }) => {
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  });

  // Vertical connector stubs
  const vLines = [
    { x: 320, y1: 140, y2: 220 },
    { x: 200, y1: 220, y2: 340 },
    { x: 140, y1: 340, y2: 480 },
    { x: 260, y1: 480, y2: 560 },
    { x: 800, y1: 760, y2: 840 },
    { x: 700, y1: 840, y2: 940 },
    { x: 800, y1: 940, y2: 1020 },
    { x: W - 260, y1: 300, y2: 420 },
    { x: W - 60, y1: 160, y2: 300 },
  ];

  vLines.forEach(({ x, y1, y2 }) => {
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  });

  // Dots at junctions
  ctx.fillStyle = hexToRgba(COLORS.cream, 0.25);
  const dots = [
    [320, 140], [200, 220], [140, 340], [260, 480],
    [800, 760], [700, 840], [800, 940], [W - 260, 300], [W - 60, 160],
    [180, 560], [500, 220],
  ];
  dots.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Small circuit component rectangles
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.1);
  ctx.lineWidth = 2;
  const rects = [
    [280, 130, 60, 20],
    [160, 210, 60, 20],
    [100, 330, 60, 20],
    [750, 750, 60, 20],
  ];
  rects.forEach(([rx, ry, rw, rh]) => {
    ctx.strokeRect(rx, ry, rw, rh);
  });

  // Small dot clusters (component pads)
  ctx.fillStyle = hexToRgba(COLORS.rust, 0.4);
  const pinkDots = [
    [90, 480], [90, 500], [90, 520],
    [W - 90, 300], [W - 90, 320],
  ];
  pinkDots.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────
// DRAW TROPICAL LEAVES (canvas paths)
// ─────────────────────────────────────────────────────────────────────
function drawTropicalLeaves(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number = 1,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const leafColor1 = "#2E6B40";
  const leafColor2 = "#1A4A28";
  const leafColor3 = "#3A7A4C";

  // Large leaf sweeping right
  ctx.fillStyle = leafColor1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(80, -60, 200, -40, 280, 20);
  ctx.bezierCurveTo(220, 40, 80, 60, 0, 0);
  ctx.fill();

  // Center vein
  ctx.strokeStyle = leafColor2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(80, -20, 180, 0, 280, 20);
  ctx.stroke();

  // Second leaf sweeping down-right
  ctx.fillStyle = leafColor2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.bezierCurveTo(40, 80, 120, 160, 80, 240);
  ctx.bezierCurveTo(40, 200, -30, 120, -10, 10);
  ctx.fill();

  // Third smaller leaf top-right
  ctx.fillStyle = leafColor3;
  ctx.beginPath();
  ctx.moveTo(60, -40);
  ctx.bezierCurveTo(100, -100, 200, -120, 240, -80);
  ctx.bezierCurveTo(180, -60, 120, -30, 60, -40);
  ctx.fill();

  // Fourth leaf bottom left
  ctx.fillStyle = leafColor1;
  ctx.beginPath();
  ctx.moveTo(-30, 40);
  ctx.bezierCurveTo(-100, 80, -160, 140, -140, 200);
  ctx.bezierCurveTo(-100, 170, -40, 100, -30, 40);
  ctx.fill();

  // Fifth thin spear leaf
  ctx.fillStyle = leafColor2;
  ctx.beginPath();
  ctx.moveTo(20, -20);
  ctx.bezierCurveTo(60, -160, 120, -200, 100, -240);
  ctx.bezierCurveTo(80, -200, 20, -160, 20, -20);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────
// DRAW 3D BACKING CARDS STACK (behind ID Badge)
// ─────────────────────────────────────────────────────────────────────
function drawBackingCardsStack(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
): void {
  ctx.save();

  // Card 3: Rightmost Blue Card with rounded logo mark
  ctx.save();
  ctx.translate(W / 2 + 50, H / 2 + 30);
  ctx.rotate((10 * Math.PI) / 180);
  ctx.translate(-(W / 2 + 50), -(H / 2 + 30));
  ctx.fillStyle = "#1D5D8A";
  roundRectPath(ctx, 70, 50, W - 140, H - 100, 28);
  ctx.fill();

  // White circle logo on blue card
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(W - 130, H / 2, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Card 2: Pastel Light Blue / Cyan Card
  ctx.save();
  ctx.translate(W / 2 + 25, H / 2 + 15);
  ctx.rotate((5 * Math.PI) / 180);
  ctx.translate(-(W / 2 + 25), -(H / 2 + 15));
  ctx.fillStyle = "#68A5C0";
  roundRectPath(ctx, 50, 40, W - 100, H - 80, 28);
  ctx.fill();
  ctx.restore();

  // Card 1: Leftmost Red Card (angled left)
  ctx.save();
  ctx.translate(W / 2 - 35, H / 2 + 20);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.translate(-(W / 2 - 35), -(H / 2 + 20));
  ctx.fillStyle = "#C83226";
  roundRectPath(ctx, 30, 30, W - 60, H - 60, 28);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────
// DRAW BINDER CLIP (for ID card)
// ─────────────────────────────────────────────────────────────────────
function drawBinderClip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
): void {
  ctx.save();

  // Metal loop / ring at top center
  ctx.fillStyle = "#A8B2B0";
  ctx.beginPath();
  ctx.arc(cx, y - 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6E7876";
  ctx.beginPath();
  ctx.arc(cx, y - 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Clip body (silver metallic rectangle)
  const clipW = 100;
  const clipH = 50;
  const clipX = cx - clipW / 2;
  const clipY = y + 14;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRectPath(ctx, clipX + 4, clipY + 4, clipW, clipH, 6);
  ctx.fill();

  // Body gradient
  const clipGrad = ctx.createLinearGradient(clipX, clipY, clipX + clipW, clipY + clipH);
  clipGrad.addColorStop(0, "#C4CCC8");
  clipGrad.addColorStop(0.5, "#E2ECE8");
  clipGrad.addColorStop(1, "#98A29E");
  ctx.fillStyle = clipGrad;
  roundRectPath(ctx, clipX, clipY, clipW, clipH, 6);
  ctx.fill();
  ctx.strokeStyle = "#6B7571";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hole rivet in clip center
  ctx.fillStyle = "#5A625E";
  ctx.beginPath();
  ctx.arc(cx, clipY + 20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D0D8D4";
  ctx.beginPath();
  ctx.arc(cx, clipY + 20, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────
// DRAW H LOGO MARK
// ─────────────────────────────────────────────────────────────────────
function drawHMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fg: string,
  bg: string,
): void {
  ctx.save();
  // Background square
  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, size, size, 4);
  ctx.fill();
  // H letter
  ctx.fillStyle = fg;
  ctx.font = `700 ${size * 0.6}px "Space Grotesk"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", x + size / 2, y + size / 2 + 1);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────
// RENDER A — PFP Frame (dark green circuit board + cream square)
// ─────────────────────────────────────────────────────────────────────
export function renderA(
  ctx: CanvasRenderingContext2D,
  state: FrameState,
): void {
  const W = SIZE_A;
  const H = SIZE_A;
  ctx.clearRect(0, 0, W, H);

  // ── Background: dark forest green ──
  ctx.fillStyle = COLORS.darkGreen;
  ctx.fillRect(0, 0, W, H);

  // ── Circuit board line pattern ──
  drawCircuitPattern(ctx, W);

  // ── Cream inner frame (square inset) ──
  const inset = 120;
  const innerX = inset;
  const innerY = 110;
  const innerW = W - inset * 2;
  const innerH = H - inset * 2;

  // Outer border of cream area (dark green frame lines)
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.35);
  ctx.lineWidth = 3;
  ctx.strokeRect(innerX - 10, innerY - 10, innerW + 20, innerH + 20);
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.15);
  ctx.lineWidth = 1;
  ctx.strokeRect(innerX - 18, innerY - 18, innerW + 36, innerH + 36);

  // Cream fill
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(innerX, innerY, innerW, innerH);

  // ── Photo circle slot ──
  const slot = getSlot("A");
  if (state.img) {
    drawPhoto(ctx, state.img, slot, state);
  } else {
    // Placeholder: circle outline with text
    ctx.strokeStyle = hexToRgba(COLORS.darkGreen, 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(slot.cx!, slot.cy!, slot.r!, 0, Math.PI * 2);
    ctx.stroke();

    // Person silhouette placeholder text
    ctx.fillStyle = hexToRgba(COLORS.darkGreen, 0.22);
    ctx.beginPath();
    ctx.arc(slot.cx!, slot.cy!, slot.r!, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hexToRgba(COLORS.darkGreen, 0.55);
    ctx.font = '700 52px "Space Grotesk"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOUR", slot.cx!, slot.cy! - 60);
    ctx.fillText("[PROFILE]", slot.cx!, slot.cy! - 2);
    ctx.fillText("FACE GOES", slot.cx!, slot.cy! + 56);
    ctx.fillText("HERE", slot.cx!, slot.cy! + 112);
  }

  // ── Circle outline ring ──
  ctx.strokeStyle = hexToRgba(COLORS.darkGreen, 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(slot.cx!, slot.cy!, slot.r! + 6, 0, Math.PI * 2);
  ctx.stroke();

  // ── Tropical leaves framing corners cleanly ──
  // Bottom Right Corner
  drawTropicalLeaves(ctx, W - innerX - 20, innerY + innerH - 30, 1.2);
  // Top Right Corner Accent
  ctx.save();
  ctx.translate(W - innerX - 20, innerY + 30);
  ctx.scale(1, -1);
  drawTropicalLeaves(ctx, 0, 0, 0.9);
  ctx.restore();

  // ── Header: "HH GOA 2026" ──
  ctx.fillStyle = COLORS.cream;
  ctx.font = '700 58px "Space Grotesk"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HH GOA 2026", W / 2, inset / 2 + 30);

  // ── Footer bar at bottom ──
  const footerH = 80;
  const footerY = H - footerH;
  ctx.fillStyle = COLORS.darkGreen;
  ctx.fillRect(0, footerY, W, footerH);
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();

  ctx.fillStyle = COLORS.cream;
  ctx.font = '600 22px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HACKER HOUSE: GOA IDENTITY", W / 2, footerY + footerH / 2);
}

// ─────────────────────────────────────────────────────────────────────
// RENDER B — Builder ID Card (lanyard badge style)
// ─────────────────────────────────────────────────────────────────────
export function renderB(
  ctx: CanvasRenderingContext2D,
  state: FrameState,
): void {
  const W = SIZE_B_W;
  const H = SIZE_B_H;
  ctx.clearRect(0, 0, W, H);

  // ── 3D Layered Backing Cards Stack (behind main badge) ──
  drawBackingCardsStack(ctx, W, H);

  // ── Main Card background (off-white/cream with dot pattern) ──
  ctx.fillStyle = COLORS.offwhite;
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.save();
  ctx.clip();
  ctx.fill();

  // Dot pattern overlay
  if (!state.patternB) {
    state.patternB = buildDotPattern(ctx, W, H, COLORS.charcoal, 0.07, 28);
  }
  ctx.fillStyle = state.patternB;
  ctx.fillRect(0, 0, W, H);

  // ── Card header: dark green strip ──
  const headerH = 190;
  ctx.fillStyle = COLORS.darkGreen;
  ctx.fillRect(0, 0, W, headerH);

  // H logo mark
  drawHMark(ctx, 50, 44, 68, COLORS.darkGreen, COLORS.cream);

  // Header text
  ctx.fillStyle = COLORS.cream;
  ctx.font = '700 20px "Space Grotesk"';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("HACKER HOUSE GOA / 2026", 136, 50);
  ctx.font = '600 16px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.cream, 0.65);
  ctx.fillText("OFFICIAL ID", 136, 80);

  // Separator line
  ctx.strokeStyle = hexToRgba(COLORS.cream, 0.25);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 136);
  ctx.lineTo(W - 50, 136);
  ctx.stroke();

  ctx.font = '600 13px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.cream, 0.5);
  ctx.textBaseline = "middle";
  ctx.fillText("BUILDER ACCESS PASS · HACKER HOUSE GOA", 50, 162);

  // ── Photo area: pink/blush background ──
  const slot = getSlot("B");
  const photoX = slot.x!;
  const photoY = slot.y!;
  const photoW = slot.w!;
  const photoH = slot.h!;

  ctx.fillStyle = COLORS.blush;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  if (state.img) {
    drawPhoto(ctx, state.img, slot, state);
  } else {
    // Silhouette placeholder
    ctx.fillStyle = hexToRgba(COLORS.darkGreen, 0.25);
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Person silhouette (simple head + body)
    ctx.fillStyle = hexToRgba(COLORS.darkGreen, 0.55);
    // Head
    ctx.beginPath();
    ctx.arc(W / 2, photoY + 150, 100, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.moveTo(W / 2 - 160, photoY + photoH);
    ctx.bezierCurveTo(W / 2 - 140, photoY + 320, W / 2 - 50, photoY + 280, W / 2, photoY + 280);
    ctx.bezierCurveTo(W / 2 + 50, photoY + 280, W / 2 + 140, photoY + 320, W / 2 + 160, photoY + photoH);
    ctx.closePath();
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = hexToRgba(COLORS.darkGreen, 0.7);
    ctx.font = '700 34px "Space Grotesk"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOUR FACE GOES HERE", W / 2, photoY + 350);
  }

  // ── Builder ID sticker (red tag top-right of photo) ──
  const tagW = 200;
  const tagH = 160;
  const tagX = photoX + photoW - tagW + 20;
  const tagY = photoY - 20;

  ctx.save();
  ctx.translate(tagX + tagW / 2, tagY + tagH / 2);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.translate(-(tagX + tagW / 2), -(tagY + tagH / 2));

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  roundRectPath(ctx, tagX + 4, tagY + 4, tagW, tagH, 14);
  ctx.fill();

  ctx.fillStyle = COLORS.rust;
  roundRectPath(ctx, tagX, tagY, tagW, tagH, 14);
  ctx.fill();

  // Small hole at top for tag with metal pin
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.arc(tagX + tagW / 2, tagY + 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // Small metallic rivet pin head
  ctx.fillStyle = "#CCCCCC";
  ctx.beginPath();
  ctx.arc(tagX + tagW / 2, tagY + 14, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = '600 18px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUILDER ID", tagX + tagW / 2, tagY + 50);
  ctx.font = '700 22px "IBM Plex Mono"';
  ctx.fillText("HH 2026", tagX + tagW / 2, tagY + 84);
  ctx.font = '700 26px "IBM Plex Mono"';
  ctx.fillText(builderNumber(state.fields.name || "builder"), tagX + tagW / 2, tagY + 120);
  ctx.restore();

  // ── Body text fields ──
  const bodyX = 130;
  const bodyStartY = photoY + photoH + 70; // 205 + 440 + 70 = 715

  // "BUILDER ID CARD" big title
  ctx.fillStyle = COLORS.charcoal;
  ctx.font = '700 44px "Space Grotesk"';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("BUILDER ID CARD", bodyX, bodyStartY);

  // Divider
  ctx.strokeStyle = hexToRgba(COLORS.charcoal, 0.2);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX, bodyStartY + 18);
  ctx.lineTo(W - bodyX, bodyStartY + 18);
  ctx.stroke();

  // NAME field
  const nameY = bodyStartY + 55; // 770
  ctx.font = '600 14px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.charcoal, 0.5);
  ctx.textBaseline = "alphabetic";
  ctx.fillText("NAME:", bodyX, nameY);
  const name = (state.fields.name || "YOUR NAME").toUpperCase().trim() || "YOUR NAME";
  const nameSize = fitFontSize(ctx, name, W - bodyX * 2, 32, 18, "700", '"Space Grotesk"');
  ctx.font = `700 ${nameSize}px "Space Grotesk"`;
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillText(name, bodyX, nameY + 36);

  // Divider
  ctx.strokeStyle = hexToRgba(COLORS.charcoal, 0.12);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bodyX, nameY + 48);
  ctx.lineTo(W - bodyX, nameY + 48);
  ctx.stroke();

  // STACK / ROLE field
  const roleY = nameY + 70; // 840
  ctx.font = '600 14px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.charcoal, 0.5);
  ctx.fillText("STACK / ROLE:", bodyX, roleY);
  const role = (state.fields.role || "Full-Stack Builder").toUpperCase().trim() || "FULL-STACK BUILDER";
  const roleSize = fitFontSize(ctx, role, W - bodyX * 2, 26, 16, "700", '"Space Grotesk"');
  ctx.font = `700 ${roleSize}px "Space Grotesk"`;
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillText(role, bodyX, roleY + 34);

  // Divider
  ctx.strokeStyle = hexToRgba(COLORS.charcoal, 0.12);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bodyX, roleY + 44);
  ctx.lineTo(W - bodyX, roleY + 44);
  ctx.stroke();

  // BUILDER TITLE field
  const titleY = roleY + 65; // 905
  ctx.font = '600 14px "IBM Plex Mono"';
  ctx.fillStyle = hexToRgba(COLORS.charcoal, 0.5);
  ctx.fillText("BUILDER TITLE:", bodyX, titleY);
  const title = (state.fields.title || "Full-Stack Wave Rider").toUpperCase().trim() || "FULL-STACK WAVE RIDER";
  const titleSize = fitFontSize(ctx, title, W - bodyX * 2, 24, 15, "700", '"Space Grotesk"');
  ctx.font = `700 ${titleSize}px "Space Grotesk"`;
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillText(title, bodyX, titleY + 32);

  ctx.restore(); // end card clip

  // ── Crimson footer bar ──
  const footerH = 120;
  const footerY = H - footerH;

  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = COLORS.rust;
  ctx.fillRect(0, footerY, W, footerH);

  // Footer text
  ctx.fillStyle = "#fff";
  ctx.font = '700 36px "Space Grotesk"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("28 — 31 OCT / GOA, INDIA  📍", W / 2, footerY + footerH / 2);

  ctx.restore();

  // ── Outer card border hairline ──
  roundRectPath(ctx, 1, 1, W - 2, H - 2, 27);
  ctx.strokeStyle = hexToRgba(COLORS.charcoal, 0.2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Binder clip at top center ──
  drawBinderClip(ctx, W / 2, -20);
}
