# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HH Goa 2026 Frame Builder** — A browser-based photo framing tool for creating and sharing HH Goa 2026 event graphics. Users upload photos, crop them live, and download or share graphics in two formats: PFP frames (1200×1200px circular) and Builder ID cards (1080×1350px portrait badge with editable fields).

This is a **Next.js 15 + React 19 + TypeScript** application with canvas-based rendering.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 with hooks
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom CSS (globals.css)
- **Canvas**: Native HTML5 Canvas 2D
- **External Libraries**: heic2any (for iPhone HEIC photo conversion)

### Directory Structure

```
humble-fools/
├── app/
│   ├── layout.tsx (root layout, metadata)
│   ├── page.tsx (entry point, renders FrameBuilder)
│   ├── globals.css (tailwind + design system CSS)
│   └── favicon.ico
├── components/
│   ├── FrameBuilder.tsx (main component, state + logic)
│   ├── Canvas.tsx (canvas element wrapper, pointer handlers)
│   ├── Controls.tsx (tabs, upload, zoom, buttons)
│   ├── FormFields.tsx (Format B form inputs)
│   └── constants.ts (colors, sizes, titles)
├── lib/
│   ├── types.ts (TypeScript interfaces)
│   ├── constants.ts (design tokens, dimensions)
│   ├── renderCanvas.ts (pure canvas rendering functions)
│   ├── imageProcessing.ts (file upload, HEIC conversion)
│   └── export.ts (download, share, clipboard logic)
├── public/ (static assets)
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── CLAUDE.md (this file)
```

## Key Files & Responsibilities

### `components/FrameBuilder.tsx` (Main Component)
- **State Management**: Uses `useState` for all app state (format, image, zoom, pan, fields)
- **Lifecycle**: `useEffect` for font loading, initial render
- **Interaction**: Pointer drag (pan), wheel (zoom), form inputs (re-render)
- **RAF Debouncing**: `rafPending` flag to prevent redundant canvas renders
- **Canvas Ref**: Direct reference to canvas element for rendering/export
- **Public Interface**: Renders header, hero text, panel with Controls + Canvas + FormFields + buttons

### `lib/renderCanvas.ts` (Pure Canvas Logic)
- **Format A**: `renderA()` — circular PFP frame with arc text ring and timestamp
- **Format B**: `renderB()` — portrait badge with photo, name, role, title fields
- **Helpers**: 
  - `getSlot()` — returns bounding box for photo clipping (circle vs rounded rect)
  - `drawPhoto()` — clips image to slot shape, applies pan/zoom
  - `drawStamp()`, `drawMiniMark()`, `drawArcText()` — layout elements
  - `buildDotPattern()` — procedural dot background
  - `fitFontSize()` — responsive text sizing
- **Note**: All functions are **pure** (no React dependencies), accepting canvas context + state

### `components/Canvas.tsx` (Canvas Wrapper)
- Manages canvas element ref, size (reactive to format change)
- Delegates pointer/wheel events to FrameBuilder
- Shows/hides based on `state.img` (upload state)
- Displays "Drag to reposition" hint

### `components/Controls.tsx` (UI Controls)
- Tab buttons (Format A ↔ B)
- Upload dropzone with drag-drop + file input
- Zoom slider (100–320%)
- "Change photo" button
- Download / Share to X buttons
- Status message display

### `components/FormFields.tsx` (Format B Form)
- Name input (max 28 chars)
- Role/stack input (max 34 chars)
- Title input (max 32 chars) + dice button (random title)
- Helper text
- Conditional render: only visible when `state.format === 'B'`

### `lib/imageProcessing.ts`
- `handleFileUpload()` — validates MIME type, file size (25MB limit), calls HEIC converter
- `convertHeic()` — uses heic2any library to convert iPhone photos to JPEG
- `loadImageFromBlob()` — creates blob URL, loads as HTMLImageElement

### `lib/export.ts`
- `downloadImage()` — `canvas.toBlob()` → download file
- `shareToX()` — three-tier fallback:
  1. Clipboard API (copy image, open tweet composer)
  2. Download + Twitter intent link (if clipboard fails)
  3. Manual attachment (fallback note in footer)
- `currentCaption()` — generates tweet caption based on format + fields
- `showToast()` — displays toast notification

### `app/globals.css`
- **Tailwind Config**: Full Tailwind setup
- **CSS Variables**: Colors (--navy, --coral, etc.), spacing (--radius)
- **Component Classes**: .tabs, .panel, .btn, .field, .dropzone, .toast, etc.
- **Google Fonts**: Space Grotesk, IBM Plex Mono (via @import)

## Development Workflow

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Build for Production
```bash
npm run build
npm run start
```

### Deployment
- **Vercel**: Auto-detected as Next.js project, deploy via `git push`
- **Environment**: No environment variables needed (all hardcoded in constants)

## Image Processing Flow

1. User uploads photo → `handleFileUpload()` validates + converts HEIC if needed
2. `loadImageFromBlob()` creates HTMLImageImage from blob
3. Image loaded into `state.img`, dimensions stored in `state.imgW`/`state.imgH`
4. `recomputeCover()` calculates `minScale` (fill slot), resets pan to center
5. User drags to pan (changes `state.cx`/`state.cy`)
6. User zooms (changes `state.zoomPct` → `state.scale`)
7. Any state change triggers RAF-debounced render
8. `renderA()` or `renderB()` calls `drawPhoto()` which clips image to slot + applies transform

## Canvas Rendering Details

### Format A (PFP):
- **Size**: 1200×1200px
- **Shape**: Circle (430px radius at 600,600)
- **Ring**: Gradient (coral→pink→gold) with arc text "HH GOA 2026 ✦ BUILDER EDITION ✦"
- **Stamp**: Timestamp badge (lower right) with "2026" + arc text
- **Pattern**: Dot background (0.05 alpha sand)
- **Sunset Glow**: Radial gradient overlay

### Format B (Badge):
- **Size**: 1080×1350px
- **Shape**: Rounded rect (28px corner radius)
- **Header**: Navy with gradient border
- **Photo**: Rounded rect frame (26px radius) with gradient border
- **Fields**: Name, role chip (</> prefix), title (auto-generated)
- **Footer**: Coordinates, hashtag, builder number (hash-derived from name)
- **Pattern**: Dot background (0.05 alpha navy on sand)

### Slot Definition (`getSlot()`):
- **Format A**: `{ shape: 'circle', cx: 600, cy: 600, r: 430, x: 170, y: 170, w: 860, h: 860 }`
- **Format B**: `{ shape: 'rect', x: 140, y: 210, w: 800, h: 640, r: 26 }`

## Interaction Model

### Pan (Drag)
- Pointer down → record start position + initial center
- Pointer move → calculate delta, translate to image-space, clamp to bounds
- Pointer up → end drag
- Clamping prevents viewing blank canvas edges

### Zoom
- Slider / Wheel → set `zoomPct` (100–320%)
- Computed scale = `minScale * (zoomPct / 100)`
- Clamped to prevent over-zoom
- Re-clamped pan after zoom to maintain valid viewport

### State Reactivity
- Format change → re-slot, re-clamp, render
- Form field changes → re-render (Format B only)
- Photo upload → re-cover, re-clamp, render

## Important Notes

- **No external CSS framework**: Tailwind provides utilities, but most custom styling is in globals.css
- **CSS Variables**: All colors defined at `:root`, reused throughout
- **RAF Debouncing**: `rafPending` flag ensures max 1 canvas render per frame
- **Canvas Patterns**: Built on-demand, cached in `state.patternA`/`state.patternB`
- **Pointer Events**: Used for broad cross-device support (mouse, touch, stylus)
- **Mobile**: Fixed zoom range, viewport meta prevents pinch zoom, tap-to-upload
- **TypeScript**: Strict mode enabled, no `any` types (except window.heic2any)

## Common Development Tasks

- **Change rendering logic**: Edit `renderA()` or `renderB()` in `lib/renderCanvas.ts`
- **Add/modify form fields**: Update `components/FormFields.tsx` + `state.fields` in FrameBuilder.tsx
- **Adjust colors**: Edit CSS variables in `app/globals.css` or COLORS object in `lib/constants.ts`
- **Debug state**: Log `state` in FrameBuilder.tsx, inspect React DevTools
- **Test canvas**: Inspect canvas element in browser DevTools, use `canvas.toDataURL()` in console
- **Add random titles**: Extend TITLES array in `lib/constants.ts`
