'use client';

import { useRef, useEffect } from 'react';
import { FrameState } from '@/lib/types';
import { SIZE_A, SIZE_B_W, SIZE_B_H } from '@/lib/constants';

interface CanvasProps {
  state: FrameState;
  onDragStart: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDragMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDragEnd: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: WheelEvent) => void;
}

export default function Canvas({
  state,
  onDragStart,
  onDragMove,
  onDragEnd,
  onWheel,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (state.format === 'A') {
      canvas.width = SIZE_A;
      canvas.height = SIZE_A;
    } else {
      canvas.width = SIZE_B_W;
      canvas.height = SIZE_B_H;
    }
  }, [state.format]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', onWheel as EventListener, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel as EventListener);
  }, [onWheel]);

  return (
    <div
      className="canvas-shell"
      style={{
        display: state.img ? 'flex' : 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        id="stage"
        className={state.dragging ? 'dragging' : ''}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onPointerLeave={onDragEnd}
      />
      <div className="hint" id="dragHint">
        Drag to reposition
      </div>
    </div>
  );
}
