export interface FrameState {
  format: 'A' | 'B';
  img: HTMLImageElement | null;
  imgW: number;
  imgH: number;
  scale: number;
  minScale: number;
  cx: number;
  cy: number;
  zoomPct: number;
  dragging: boolean;
  fields: {
    name: string;
    role: string;
    title: string;
  };
  fontsReady: boolean;
  patternA: CanvasPattern | null;
  patternB: CanvasPattern | null;
}

export interface CanvasSlot {
  shape: 'circle' | 'rect';
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface ColorMap {
  navy: string;
  navy2: string;
  navy3: string;
  sand: string;
  coral: string;
  pink: string;
  gold: string;
  teal: string;
  // New palette
  darkGreen: string;
  forest: string;
  cream: string;
  cream2: string;
  rust: string;
  mustard: string;
  blush: string;
  charcoal: string;
  offwhite: string;
}
