"use client";

import { TITLES } from "@/lib/constants";
import { downloadImage, shareToX, showToast } from "@/lib/export";
import { handleFileUpload, loadImageFromBlob } from "@/lib/imageProcessing";
import { getSlot, renderA, renderB } from "@/lib/renderCanvas";
import { FrameState } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import FormFields from "./FormFields";

export default function FrameBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<FrameState>({
    format: "A",
    img: null,
    imgW: 0,
    imgH: 0,
    scale: 1,
    minScale: 1,
    cx: 0,
    cy: 0,
    zoomPct: 100,
    dragging: false,
    fields: { name: "", role: "", title: "" },
    fontsReady: false,
    patternA: null,
    patternB: null,
  });

  const [statusMsg, setStatusMsg] = useState("");
  const [lastTitleIdx, setLastTitleIdx] = useState(-1);
  const [rafPending, setRafPending] = useState(false);
  const [pointer, setPointer] = useState({
    active: false,
    startX: 0,
    startY: 0,
    startCx: 0,
    startCy: 0,
  });

  // Setup fonts
  useEffect(() => {
    const fontPromises = [
      document.fonts.load('700 40px "Space Grotesk"'),
      document.fonts.load('500 40px "Space Grotesk"'),
      document.fonts.load('600 20px "IBM Plex Mono"'),
    ];

    Promise.all(fontPromises)
      .then(() => {
        setState((s) => ({ ...s, fontsReady: true }));
      })
      .catch(() => {});
  }, []);

  // Compute cover dimensions
  const recomputeCover = useCallback((reset: boolean) => {
    setState((s) => {
      const slot = getSlot(s.format);
      const minScale = Math.max(slot.w! / s.imgW, slot.h! / s.imgH);

      let scale = s.scale;
      let cx = s.cx;
      let cy = s.cy;

      if (reset) {
        scale = minScale;
        cx = s.imgW / 2;
        cy = s.imgH / 2;
      }

      const halfW = slot.w! / 2 / scale;
      const halfH = slot.h! / 2 / scale;
      cx = Math.min(Math.max(cx, halfW), Math.max(halfW, s.imgW - halfW));
      cy = Math.min(Math.max(cy, halfH), Math.max(halfH, s.imgH - halfH));

      return { ...s, scale, minScale, cx, cy, zoomPct: 100 };
    });
  }, []);

  const render = useCallback(() => {
    if (rafPending || !canvasRef.current || !state.fontsReady) return;

    setRafPending(true);
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (state.format === "A") {
        renderA(ctx, state);
      } else {
        renderB(ctx, state);
      }

      setRafPending(false);
    });
  }, [state, rafPending]);

  useEffect(() => {
    if (state.fontsReady) render();
  }, [
    state.fontsReady,
    state.format,
    state.img,
    state.cx,
    state.cy,
    state.scale,
    state.fields,
    render,
  ]);

  const handleUpload = async (file: File) => {
    setStatusMsg("Loading photo…");
    try {
      const blob = await handleFileUpload(file);
      const img = await loadImageFromBlob(blob);

      setState((s) => ({
        ...s,
        img,
        imgW: img.naturalWidth,
        imgH: img.naturalHeight,
      }));

      setStatusMsg("");
      recomputeCover(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading photo";
      setStatusMsg(message);
    }
  };

  const handleFormatChange = (format: "A" | "B") => {
    setState((s) => ({ ...s, format }));
    if (state.img) recomputeCover(true);
  };

  const handleZoomChange = (pct: number) => {
    const clamped = Math.min(320, Math.max(100, pct));
    setState((s) => ({
      ...s,
      zoomPct: clamped,
      scale: s.minScale * (clamped / 100),
    }));
  };

  const handleDragStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!state.img) return;
    setPointer({
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startCx: state.cx,
      startCy: state.cy,
    });
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    const hint = document.getElementById("dragHint");
    if (hint) hint.style.opacity = "0";
  };

  const handleDragMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointer.active || !state.img) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / rect.width;
    const dxCss = e.clientX - pointer.startX;
    const dyCss = e.clientY - pointer.startY;
    let cx = pointer.startCx - (dxCss * scaleFactor) / state.scale;
    let cy = pointer.startCy - (dyCss * scaleFactor) / state.scale;
    const slot = getSlot(state.format);
    const halfW = slot.w! / 2 / state.scale;
    const halfH = slot.h! / 2 / state.scale;
    cx = Math.min(Math.max(cx, halfW), Math.max(halfW, state.imgW - halfW));
    cy = Math.min(Math.max(cy, halfH), Math.max(halfH, state.imgH - halfH));
    setState((s) => ({ ...s, cx, cy }));
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setPointer({ ...pointer, active: false });
    e.currentTarget.classList.remove("dragging");
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!state.img) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -8 : 8;
      handleZoomChange(state.zoomPct + delta);
    },
    [state.img, state.zoomPct],
  );

  const shuffleTitle = useCallback(() => {
    let idx;
    do {
      idx = Math.floor(Math.random() * TITLES.length);
    } while (idx === lastTitleIdx && TITLES.length > 1);
    setLastTitleIdx(idx);
    setState((s) => ({
      ...s,
      fields: { ...s.fields, title: TITLES[idx] },
    }));
  }, [lastTitleIdx]);

  useEffect(() => {
    if (state.img && !state.fields.title) shuffleTitle();
  }, [state.img, state.fields.title, shuffleTitle]);

  const showCanvas = !!state.img;
  const showZoom = !!state.img;
  const showActions = !!state.img;

  return (
    <>
      {/* ── HEADER ── */}
      <header className="top">
        <div className="brand">
          {/* H mark logo */}
          <svg className="mark" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="6" fill="#1A3320" />
            <text
              x="20"
              y="27"
              textAnchor="middle"
              fill="#F0C030"
              fontFamily="Space Grotesk, sans-serif"
              fontWeight="700"
              fontSize="22"
            >
              H
            </text>
          </svg>
          <div className="word">
            HH GOA
            <small>Builder Edition · 2026</small>
          </div>
        </div>
        <div className="hh-label">HACKER HOUSE GOA</div>
      </header>

      {/* ── HERO SECTION ── */}
      <div className="hero-section">
        {/* Decorative: sun top-left */}
        <div className="deco-wrap" style={{ top: 20, left: 20 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 6 L24 2" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 46 L24 42" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M6 24 L2 24" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M46 24 L42 24" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M10.4 10.4 L7.6 7.6" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M40.4 40.4 L37.6 37.6" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M37.6 10.4 L40.4 7.6" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M7.6 40.4 L10.4 37.6" stroke="#D4246A" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="10" fill="#F5C0C0" stroke="#D4246A" strokeWidth="2"/>
          </svg>
        </div>

        {/* Decorative: circuit node top-right area */}
        <div className="deco-wrap" style={{ top: 30, right: 160 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="5" fill="#1C1C1C" fillOpacity="0.35"/>
            <line x1="26" y1="2" x2="26" y2="18" stroke="#1C1C1C" strokeOpacity="0.3" strokeWidth="2"/>
            <line x1="26" y1="34" x2="26" y2="50" stroke="#1C1C1C" strokeOpacity="0.3" strokeWidth="2"/>
            <line x1="2" y1="26" x2="18" y2="26" stroke="#1C1C1C" strokeOpacity="0.3" strokeWidth="2"/>
            <line x1="34" y1="26" x2="50" y2="26" stroke="#1C1C1C" strokeOpacity="0.3" strokeWidth="2"/>
            <circle cx="26" cy="2" r="3" fill="#1C1C1C" fillOpacity="0.3"/>
            <circle cx="26" cy="50" r="3" fill="#1C1C1C" fillOpacity="0.3"/>
            <circle cx="2" cy="26" r="3" fill="#1C1C1C" fillOpacity="0.3"/>
            <circle cx="50" cy="26" r="3" fill="#1C1C1C" fillOpacity="0.3"/>
          </svg>
        </div>

        {/* Decorative: plant/botanical top-right */}
        <div className="deco-wrap" style={{ top: -10, right: 24 }}>
          <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
            <path d="M40 90 C40 90 20 60 30 30 C35 15 55 10 60 25 C65 40 45 55 40 90Z" fill="#2D5A3D" fillOpacity="0.7"/>
            <path d="M40 90 C40 90 60 65 45 35 C38 20 18 20 20 38 C22 55 40 65 40 90Z" fill="#1A3320" fillOpacity="0.6"/>
            <line x1="40" y1="90" x2="40" y2="30" stroke="#1A3320" strokeOpacity="0.4" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="hero-eyebrow">OFFICIAL NGOA 2026 IDENTITY BUILDER</div>

        <h1 className="hero">
          CHOOSE<br />
          YOUR<br />
          <span className="flex-word">FLEX.</span>
        </h1>

        <div className="hero-subtitle">
          HACKER HOUSE GO<span style={{color:'#C9371A'}}>★</span>A 2026<br />
          OFFICIAL BUILDER PASS &amp; PFP CREATOR
        </div>

        <div style={{ marginTop: 16 }}>
          <span className="badge-stamp">★ NO GATEKEEPING ★</span>
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="page-wrap">
        <div className="choose-proof-label">CHOOSE YOUR PROOF.</div>

        <div className="panel">
          {/* ── LEFT: Stage column ── */}
          <div className="stage-col">
            {/* Frame selector tabs */}
            <div>
              <div className="section-label">SELECTED FRAME</div>
              <div className="tabs">
                <button
                  id="tab-pfp"
                  className={`tab ${state.format === "A" ? "active" : ""}`}
                  onClick={() => handleFormatChange("A")}
                >
                  PFP Frame
                </button>
                <button
                  id="tab-id"
                  className={`tab ${state.format === "B" ? "active" : ""}`}
                  onClick={() => handleFormatChange("B")}
                >
                  Builder ID Card
                </button>
              </div>
              <div className="frame-info">
                {state.format === "A"
                  ? "Square 1:1 · Best for profile photos on X / Discord"
                  : "Portrait 4:5 · Hacker House GOA official ID card"}
              </div>
            </div>

            {/* Dropzone */}
            <div
              className="dropzone"
              id="dropzone"
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("over");
                const file = e.dataTransfer.files?.[0];
                if (file) handleUpload(file);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("over");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("over");
              }}
              onClick={() => document.getElementById("fileInput")?.click()}
              style={{ display: showCanvas ? "none" : "block" }}
            >
              <div className="big">Drop a photo here, or tap to upload</div>
              <div className="small">JPG · PNG · HEIC (iPhone) — up to 25 MB</div>
              <input
                id="fileInput"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </div>

            {/* Canvas */}
            <Canvas
              ref={canvasRef}
              state={state}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onWheel={handleWheel}
            />

            {/* Zoom row */}
            <div className="zoomrow" style={{ display: showZoom ? "flex" : "none" }}>
              <label>ZOOM</label>
              <input
                type="range"
                min="100"
                max="320"
                value={state.zoomPct}
                onChange={(e) => handleZoomChange(parseInt(e.target.value, 10))}
              />
            </div>

            {/* Change photo */}
            <div className="actions" style={{ display: showActions ? "flex" : "none" }}>
              <button
                id="change-photo-btn"
                className="btn secondary"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                Change photo
              </button>
            </div>

            {/* Status when no photo */}
            <div className="status" style={{ display: showCanvas ? "none" : "block" }}>
              Upload a photo to get started — the graphic updates live as you crop.
            </div>

            <div
              className="status"
              style={{
                color: statusMsg.includes("Error") ? "#C9371A" : "rgba(28,28,28,0.45)",
              }}
            >
              {statusMsg}
            </div>
          </div>

          {/* ── RIGHT: Form + actions ── */}
          <div className="form-col">
            <FormFields
              state={state}
              onNameChange={(name) =>
                setState((s) => ({ ...s, fields: { ...s.fields, name } }))
              }
              onRoleChange={(role) =>
                setState((s) => ({ ...s, fields: { ...s.fields, role } }))
              }
              onTitleChange={(title) =>
                setState((s) => ({ ...s, fields: { ...s.fields, title } }))
              }
              onDiceClick={shuffleTitle}
              visible={state.format === "B"}
            />

            <div className="actions">
              <button
                id="download-btn"
                className="btn primary"
                onClick={async () => {
                  try {
                    if (canvasRef.current) {
                      await downloadImage(canvasRef.current, state.format);
                      showToast("Downloaded — ready to post.");
                    }
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Download failed";
                    showToast(msg);
                  }
                }}
                disabled={!state.img}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
                </svg>
                Download Frame
              </button>
              <button
                id="share-btn"
                className="btn secondary"
                onClick={async () => {
                  try {
                    if (canvasRef.current) {
                      shareToX(canvasRef.current, state.format, state.fields);
                      showToast(
                        "Image copied — press Ctrl/Cmd+V in the tweet box to attach it.",
                      );
                    }
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Share failed";
                    showToast(msg);
                  }
                }}
                disabled={!state.img}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6l12.1 16Z" />
                </svg>
                Share to X
              </button>
            </div>

            <div className="status" id="statusMsg">{statusMsg}</div>

            {/* "Your Signal in Public" preview note */}
            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1.5px solid rgba(28,28,28,0.12)' }}>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'rgba(28,28,28,0.35)',
                marginBottom: 6
              }}>
                LIKE THE PFP POSITION / INSTANTLY UPDATES
              </div>
              <div style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.1,
                color: 'var(--charcoal)',
                marginBottom: 6
              }}>
                YOUR SIGNAL,<br />
                <span style={{ color: 'var(--pink)' }}>IN PUBLIC.</span>
              </div>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 11,
                color: 'rgba(28,28,28,0.45)',
                lineHeight: 1.6
              }}>
                Your photo stays on your device. The preview
                updates live. One upload. Everything
                intentional.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER BANNER ── */}
      <div className="footer-banner">
        28 — 31 OCT / GOA, INDIA&nbsp;📍
      </div>

      <footer className="footer-note">
        Runs entirely in your browser — your photo is never uploaded anywhere.
        On phones, &quot;Share to X&quot; hands the image straight to the X app via your
        device&apos;s share sheet. On desktop, the image is copied to your clipboard
        and a pre-filled tweet opens.
      </footer>

      <div className="toast" id="toast"></div>
    </>
  );
}
