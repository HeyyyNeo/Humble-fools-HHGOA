import { MAX_FILE_SIZE } from './constants';

declare global {
  interface Window {
    heic2any?: any;
  }
}

export async function handleFileUpload(file: File): Promise<Blob> {
  // Validate file type
  if (
    !file.type.match(/^image\//) &&
    !/\.(heic|heif)$/i.test(file.name)
  ) {
    throw new Error(
      "That file doesn't look like a photo — try a JPG, PNG, or HEIC."
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('That photo is over 25MB — try a smaller one.');
  }

  const isHeic =
    /image\/hei[cf]/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    return convertHeic(file);
  }

  return file;
}

export async function convertHeic(file: File): Promise<Blob> {
  if (typeof window === 'undefined' || !window.heic2any) {
    throw new Error(
      'HEIC support failed to load — try exporting as JPG first.'
    );
  }

  try {
    const result = await window.heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    throw new Error(
      "Couldn't convert that HEIC photo — try exporting as JPG."
    );
  }
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that photo — try a different file."));
    };

    img.src = url;
  });
}
