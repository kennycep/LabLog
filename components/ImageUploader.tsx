"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 8;
const MAX_DIMENSION = 1400; // px on the longest edge
const JPEG_QUALITY = 0.72;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // reject absurdly large originals

// Resize + re-encode through a canvas. Besides shrinking the data URL so it
// fits in localStorage, re-rasterizing strips EXIF and any embedded active
// content (e.g. scripts in an SVG) — the output is always a plain JPEG.
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files are allowed."));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error("That image is too large (max 25 MB)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(img.width, img.height)
        );
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing isn't supported here."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  value,
  onChange,
  label = "Images",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setBusy(true);
    const room = MAX_IMAGES - value.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    const added: string[] = [];
    for (const file of picked) {
      try {
        added.push(await processImage(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add that image.");
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (files.length > room) {
      setError(`You can attach up to ${MAX_IMAGES} images per log.`);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}

      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div
            key={i}
            className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Attachment ${i + 1}`}
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => setLightbox(src)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            {busy ? (
              <span className="text-xs">…</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
                </svg>
                <span className="text-[11px]">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
      <p className="mt-1.5 text-xs text-muted/80">
        Stored on this device only · resized automatically · up to {MAX_IMAGES}.
      </p>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Attachment"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
