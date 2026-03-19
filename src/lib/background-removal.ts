import type { RemovalResult, RemovalProgress, MattingMode } from "./types";

// Re-export types for backward compatibility
export type { RemovalResult, RemovalProgress, MattingMode };

// API base URL - Go backend
// In production, use relative path (Nginx proxies /api/* to Go backend)
// In development, use NEXT_PUBLIC_API_URL env var
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Convert a File/Blob to base64 data URL
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType = "image/png"): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Get dimensions of an image blob
 */
function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Remove background from an image file using Next.js API Route
 */
export async function removeImageBackground(
  imageFile: File | Blob,
  onProgress?: (progress: RemovalProgress) => void,
  mode: MattingMode = "portrait"
): Promise<RemovalResult> {
  // Phase 1: Converting image to base64
  onProgress?.({
    phase: "loading",
    progress: 0.1,
    message: "Preparing image...",
  });

  const base64DataUrl = await fileToBase64(imageFile);

  // Phase 2: Sending to API
  onProgress?.({
    phase: "processing",
    progress: 0.3,
    message: "Sending to AI server...",
  });

  const response = await fetch("/api/remove-bg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64DataUrl,
      mode: mode,
    }),
  });

  onProgress?.({
    phase: "processing",
    progress: 0.6,
    message: "AI is removing background...",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to remove background");
  }

  // Phase 3: Processing result
  onProgress?.({
    phase: "processing",
    progress: 0.85,
    message: "Processing result...",
  });

  // Convert base64 result to Blob
  const resultBlob = base64ToBlob(data.image);
  const resultUrl = URL.createObjectURL(resultBlob);

  // Get image dimensions
  const dimensions = await getImageDimensions(resultBlob);

  onProgress?.({
    phase: "done",
    progress: 1,
    message: "Background removed!",
  });

  return {
    blob: resultBlob,
    url: resultUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Get image file info
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Apply a solid color background to a transparent image
 */
export function applyBackground(
  transparentImageUrl: string,
  backgroundColor: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        0.95
      );
    };
    img.onerror = reject;
    img.src = transparentImageUrl;
  });
}

/**
 * Apply a background image behind a transparent foreground
 */
export function applyBackgroundImage(
  transparentImageUrl: string,
  backgroundImageUrl: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => {
      const scale = Math.max(width / bgImg.width, height / bgImg.height);
      const bgW = bgImg.width * scale;
      const bgH = bgImg.height * scale;
      ctx.drawImage(bgImg, (width - bgW) / 2, (height - bgH) / 2, bgW, bgH);

      const fgImg = new Image();
      fgImg.crossOrigin = "anonymous";
      fgImg.onload = () => {
        ctx.drawImage(fgImg, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png",
          0.95
        );
      };
      fgImg.onerror = reject;
      fgImg.src = transparentImageUrl;
    };
    bgImg.onerror = reject;
    bgImg.src = backgroundImageUrl;
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
