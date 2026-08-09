# HH Goa 2026 Frame Builder

A modern Next.js web application for creating and sharing HH Goa 2026 photo frames. Upload a photo, crop it live, and download or share instantly to X (Twitter).

## Features

- **Two Frame Formats**:
  - PFP Frame: 1200×1200px circular profile picture frame with gradient ring and arc text
  - Builder ID Card: 1080×1350px portrait badge with editable name, role, and title fields
- **Live Photo Editing**: Drag to pan, wheel/slider to zoom (100-320%)
- **Format Switching**: Instant canvas redraw when switching formats
- **HEIC Support**: Automatically converts iPhone photos to JPEG
- **Download & Share**: 
  - Download as PNG
  - Share to X with clipboard fallback
  - Three-tier fallback system (clipboard → intent link → manual)
- **No Upload**: Runs entirely in the browser, photos never leave your device
- **Responsive**: Works on mobile and desktop

## Tech Stack

- **Next.js 15** – React framework with App Router
- **React 19** – UI component library
- **TypeScript** – Type-safe code
- **Tailwind CSS** – Utility-first styling
- **Canvas 2D API** – Real-time graphics rendering
- **heic2any** – HEIC/HEIF to JPEG conversion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Entry point
│   └── globals.css         # Global styles and design system
├── components/
│   ├── FrameBuilder.tsx    # Main component with state and logic
│   ├── Canvas.tsx          # Canvas element wrapper
│   ├── Controls.tsx        # UI controls (tabs, upload, buttons)
│   └── FormFields.tsx      # Format B form inputs
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── constants.ts        # Colors, sizes, titles
│   ├── renderCanvas.ts     # Pure canvas rendering functions
│   ├── imageProcessing.ts  # File upload and HEIC conversion
│   └── export.ts           # Download and share logic
└── public/                 # Static assets
```

## Key Features Explained

### Canvas Rendering

Two render modes with pure, reusable functions:
- **Format A**: `renderA()` – circular PFP with arc text ring and timestamp stamp
- **Format B**: `renderB()` – portrait card with photo, name, role, builder title, coordinates, builder number

All rendering logic is pure (no React dependencies) for easy testing and reuse.

### Image Processing

1. User uploads or drags photo
2. File validation (MIME type, 25MB limit)
3. Auto-conversion of HEIC (iPhone) photos to JPEG
4. Image dimensions calculated, slot/clamp computed
5. Pan/zoom applied, canvas redrawn

### State Management

React hooks manage all app state:
- `format` – 'A' or 'B'
- `img` – HTMLImageElement
- `scale`, `cx`, `cy` – Zoom and pan
- `zoomPct` – User-facing zoom percentage
- `fields` – Name, role, title (Format B)
- `dragging`, `fontsReady`, patterns – Internal state

RAF debouncing ensures smooth 60fps rendering.

## Deployment

### Vercel

The project is Vercel-ready:

```bash
git push
# Deploys automatically
```

### Other Platforms

Works on any static host (GitHub Pages, Netlify, etc.) since it's a Next.js app.

## Performance

- Canvas rendering debounced with RAF
- Patterns cached in state to avoid rebuilding
- Images clipped/scaled on-canvas (no pre-processing)
- Google Fonts loaded from CDN
- Optimized PNG export (0.95 quality)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires: Canvas 2D, File API, Pointer Events, Clipboard API (for share feature)

## License

ISC

## Support

For issues or feedback, create an issue on GitHub or reach out to the HH Goa organizers.
