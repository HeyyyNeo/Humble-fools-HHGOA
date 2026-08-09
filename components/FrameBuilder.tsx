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

      // Clamp center
      const halfW = slot.w! / 2 / scale;
      const halfH = slot.h! / 2 / scale;
      cx = Math.min(Math.max(cx, halfW), Math.max(halfW, s.imgW - halfW));
      cy = Math.min(Math.max(cy, halfH), Math.max(halfH, s.imgH - halfH));

      return { ...s, scale, minScale, cx, cy, zoomPct: 100 };
    });
  }, []);

  // Render function
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

  // Trigger render on state changes
  useEffect(() => {
    if (state.fontsReady) {
      render();
    }
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

  // Handle file upload
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
      const message =
        err instanceof Error ? err.message : "Error loading photo";
      setStatusMsg(message);
    }
  };

  // Handle format change
  const handleFormatChange = (format: "A" | "B") => {
    setState((s) => ({ ...s, format }));
    if (state.img) {
      recomputeCover(true);
    }
  };

  // Handle zoom
  const handleZoomChange = (pct: number) => {
    const clamped = Math.min(320, Math.max(100, pct));
    setState((s) => ({
      ...s,
      zoomPct: clamped,
      scale: s.minScale * (clamped / 100),
    }));
  };

  // Handle pointer drag
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
    const dxLogical = dxCss * scaleFactor;
    const dyLogical = dyCss * scaleFactor;

    let cx = pointer.startCx - dxLogical / state.scale;
    let cy = pointer.startCy - dyLogical / state.scale;

    // Clamp
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

  // Shuffle title
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

  // Initialize title if empty
  useEffect(() => {
    if (state.img && !state.fields.title) {
      shuffleTitle();
    }
  }, [state.img, state.fields.title, shuffleTitle]);

  const showCanvas = !!state.img;
  const showZoom = !!state.img;
  const showActions = !!state.img;

  return (
    <>
      <header className="top">
        <div className="brand">
          <svg className="mark" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="19"
              fill="none"
              stroke="#FFB238"
              strokeWidth="2"
            />
            <path
              d="M6 24 Q13 18 20 24 T34 24"
              stroke="#1FD1B0"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="20" cy="14" r="6" fill="#FF5A4E" />
          </svg>
          <div className="word">
            HH GOA
            <small>Builder Edition · 2026</small>
          </div>
        </div>
        <div className="hashtag">#FrameInGoa</div>
      </header>

      <h1 className="hero">
        Turn your photo into an <em>HH Goa 2026</em> flex.
      </h1>
      <p className="sub">
        Upload a photo. Crop it live. Download or post straight to X — no login,
        no waiting.
      </p>

      <div className="panel">
        <div className="stage-col">
          <div className="tabs">
            <button
              className={`tab ${state.format === "A" ? "active" : ""}`}
              onClick={() => handleFormatChange("A")}
            >
              PFP Frame
            </button>
            <button
              className={`tab ${state.format === "B" ? "active" : ""}`}
              onClick={() => handleFormatChange("B")}
            >
              Builder ID Card
            </button>
          </div>

          <div
            className="dropzone"
            onDrop={(e) => {
              e.preventDefault();
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
            <div className="small">JPG · PNG · HEIC (iPhone) — up to 25MB</div>
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

          <Canvas
            ref={canvasRef}
            state={state}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onWheel={handleWheel}
          />

          <div
            className="zoomrow"
            style={{ display: showZoom ? "flex" : "none" }}
          >
            <label>ZOOM</label>
            <input
              type="range"
              min="100"
              max="320"
              value={state.zoomPct}
              onChange={(e) => handleZoomChange(parseInt(e.target.value, 10))}
            />
          </div>

          <div
            className="actions"
            style={{ display: showActions ? "flex" : "none" }}
          >
            <button
              className="btn secondary"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              Change photo
            </button>
          </div>

          <div
            className="status"
            style={{ display: showCanvas ? "none" : "block" }}
          >
            Upload a photo to get started — the graphic updates live as you
            crop.
          </div>

          <div
            className="status"
            style={{
              color: statusMsg.includes("Error")
                ? "#ff5a4e"
                : "rgba(246, 233, 210, 0.55)",
            }}
          >
            {statusMsg}
          </div>
        </div>

        <div className="form-col">
          <FormFields
            state={state}
            onNameChange={(name) =>
              setState((s) => ({
                ...s,
                fields: { ...s.fields, name },
              }))
            }
            onRoleChange={(role) =>
              setState((s) => ({
                ...s,
                fields: { ...s.fields, role },
              }))
            }
            onTitleChange={(title) =>
              setState((s) => ({
                ...s,
                fields: { ...s.fields, title },
              }))
            }
            onDiceClick={shuffleTitle}
            visible={state.format === "B"}
          />

          <div className="actions">
            <button
              className="btn primary"
              onClick={async () => {
                try {
                  if (canvasRef.current) {
                    await downloadImage(canvasRef.current, state.format);
                    showToast("Downloaded — ready to post.");
                  }
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Download failed";
                  showToast(msg);
                }
              }}
              disabled={!state.img}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
              </svg>
              Download
            </button>
            <button
              className="btn secondary"
              onClick={async () => {
                try {
                  if (canvasRef.current) {
                    shareToX(canvasRef.current, state.format, state.fields);
                    showToast(
                      "Image copied — press Ctrl/Cmd+V in the tweet box that just opened to attach it.",
                    );
                  }
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Share failed";
                  showToast(msg);
                }
              }}
              disabled={!state.img}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6l12.1 16Z" />
              </svg>
              Share to X
            </button>
          </div>
          <div className="status" id="statusMsg">
            {statusMsg}
          </div>
        </div>
      </div>

      <footer className="note">
        Runs entirely in your browser — your photo is never uploaded anywhere.
        On phones, &quot;Share to X&quot; hands the image straight to the X app via your
        device&apos;s share sheet. On desktop, the image is copied to your clipboard
        and a pre-filled tweet opens — just press Ctrl/Cmd+V in the tweet box to
        attach it (X&apos;s composer accepts pasted images). If your browser doesn&apos;t
        support clipboard images, the graphic downloads instead and you can drag
        it in.
      </footer>

      <div className="toast" id="toast"></div>
    </>
  );
}
