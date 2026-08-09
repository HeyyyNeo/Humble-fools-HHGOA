'use client';

import { FrameState } from '@/lib/types';

interface ControlsProps {
  state: FrameState;
  onUpload: (file: File) => void;
  onChangePhoto: () => void;
  onZoomChange: (zoom: number) => void;
  statusMsg: string;
  showCanvas: boolean;
  showZoom: boolean;
  showActions: boolean;
}

export default function Controls({
  state,
  onUpload,
  onChangePhoto,
  onZoomChange,
  statusMsg,
  showCanvas,
  showZoom,
  showActions,
}: ControlsProps) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('over');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('over');
  };

  return (
    <div className="stage-col">

      <div
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
        style={{ display: showCanvas ? 'none' : 'block' }}
      >
        <div className="big">Drop a photo here, or tap to upload</div>
        <div className="small">JPG · PNG · HEIC (iPhone) — up to 25MB</div>
        <input
          id="fileInput"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleFileInput}
        />
      </div>

      <div
        className="zoomrow"
        style={{ display: showZoom ? 'flex' : 'none' }}
      >
        <label>ZOOM</label>
        <input
          type="range"
          min="100"
          max="320"
          value={state.zoomPct}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
        />
      </div>

      <div
        className="actions"
        style={{ display: showActions ? 'flex' : 'none' }}
      >
        <button
          className="btn secondary"
          onClick={onChangePhoto}
        >
          Change photo
        </button>
      </div>

      <div className="status" style={{ display: showCanvas ? 'none' : 'block' }}>
        Upload a photo to get started — the graphic updates live as you crop.
      </div>

      <div className="status err" style={{ color: statusMsg.includes('error') || statusMsg.includes('Error') ? '#ff5a4e' : 'rgba(246, 233, 210, 0.55)' }}>
        {statusMsg}
      </div>
    </div>
  );
}
