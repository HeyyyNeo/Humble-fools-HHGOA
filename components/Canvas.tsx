'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { FrameState } from '@/lib/types';
import { SIZE_A, SIZE_B_W, SIZE_B_H } from '@/lib/constants';

interface CanvasProps {
  state: FrameState;
  onDragStart: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDragMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDragEnd: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: WheelEvent) => void;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ state, onDragStart, onDragMove, onDragEnd, onWheel }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || internalRef;

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
    }, [state.format, canvasRef]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        onWheel(e);
      };

      canvas.addEventListener('wheel', handleWheel as EventListener, {
        passive: false,
      });
      return () =>
        canvas.removeEventListener('wheel', handleWheel as EventListener);
    }, [onWheel, canvasRef]);

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
        />
        <div className="hint" id="dragHint">
          Drag to reposition
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;
