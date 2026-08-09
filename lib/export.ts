export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      },
      "image/png",
      0.95,
    );
  });
}

export function currentFilename(format: "A" | "B"): string {
  const base = format === "A" ? "hh-goa-2026-pfp" : "hh-goa-2026-builder-id";
  return `${base}.png`;
}

export function currentCaption(
  format: "A" | "B",
  fields: { name: string; role: string; title: string },
): string {
  if (format === "A") {
    return "Just framed my X pfp for HH Goa 2026 🌴⚡ building on the beach this year. #FrameInGoa";
  }

  const name = (fields.name || "").trim();
  const title = (fields.title || "a Builder").trim();

  if (name) {
    return `${name} is pulling up to HH Goa 2026 as "${title}" 🌴💻 #FrameInGoa`;
  }

  return `I'm pulling up to HH Goa 2026 as "${title}" 🌴💻 #FrameInGoa`;
}

export async function downloadImage(
  canvas: HTMLCanvasElement,
  format: "A" | "B",
): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = currentFilename(format);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}

export async function uploadImageToVercelBlob(
  canvas: HTMLCanvasElement,
  format: "A" | "B",
): Promise<string> {
  const blob = await canvasToBlob(canvas);
  const filename = `${Date.now()}-${currentFilename(format)}`;

  console.log("Uploading to API:", filename);

  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("filename", filename);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Upload failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("Upload successful:", data.url);
    return data.url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function shareViaClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    // Upload to Vercel Blob first
    const imageUrl = await uploadImageToVercelBlob(canvas, "B");
    console.log("Image uploaded:", imageUrl);

    // const tweetUrl =
    //   'https://twitter.com/intent/tweet?text=' +
    //   encodeURIComponent(caption);
    // window.open(tweetUrl, '_blank');

    return true;
  } catch (error) {
    console.error("Clipboard share failed:", error);
    return false;
  }
}

async function downloadThenIntent(
  canvas: HTMLCanvasElement,
  format: "A" | "B",
  caption: string,
): Promise<void> {
  await downloadImage(canvas, format);

  const tweetUrl =
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(caption);
  window.open(tweetUrl, "_blank");
}

export async function shareToX(
  canvas: HTMLCanvasElement,
  format: "A" | "B",
  fields: { name: string; role: string; title: string },
): Promise<void> {
  const caption = currentCaption(format, fields);

  // Try clipboard first
  const clipboardSuccess = await shareViaClipboard(canvas);
  if (clipboardSuccess) {
    return;
  }

  // Fallback: download + open intent link
  await downloadThenIntent(canvas, format, caption);
}

export function showToast(message: string, duration: number = 3600): void {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}
