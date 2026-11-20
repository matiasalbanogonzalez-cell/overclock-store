"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";

const MAX = 8;
const MAX_MB = 4;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Subida de fotos con vista previa: arrastrar o elegir archivos, ordenar, elegir portada y quitar */
export function ImageUploader({ initial, error }: { initial: string[]; error?: string }) {
  const [images, setImages] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(fileList: FileList | File[]) {
    setMessage(null);
    const files = [...fileList];
    const room = MAX - images.length;
    if (room <= 0) return setMessage(`Máximo ${MAX} fotos por producto.`);
    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) return setMessage(`“${tooBig.name}” pesa más de ${MAX_MB} MB. Achicala antes de subirla.`);

    const body = new FormData();
    files.slice(0, room).forEach((f) => body.append("files", f));
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls) throw new Error(data.error ?? "No se pudo subir");
      setImages((prev) => [...prev, ...data.urls!].slice(0, MAX));
      if (files.length > room) setMessage(`Se subieron solo ${room}: el máximo es ${MAX} fotos.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function addUrl() {
    const value = url.trim();
    if (!/^https:\/\/\S+$/.test(value)) return setMessage("El link tiene que empezar con https://");
    if (images.length >= MAX) return setMessage(`Máximo ${MAX} fotos por producto.`);
    setImages((prev) => [...prev, value]);
    setUrl("");
    setMessage(null);
  }

  const move = (from: number, to: number) =>
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  return (
    <div>
      <span className="label">Fotos del producto</span>
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-600 bg-ink-850">
              <Image src={src} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-md bg-neon px-1.5 py-0.5 text-[10px] font-bold text-ink-950">PORTADA</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover a la izquierda" className="rounded-md bg-ink-800/90 px-2 py-1 text-xs text-white disabled:opacity-30">←</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Mover a la derecha" className="rounded-md bg-ink-800/90 px-2 py-1 text-xs text-white disabled:opacity-30">→</button>
                </div>
                {i !== 0 && (
                  <button type="button" onClick={() => move(i, 0)} className="rounded-md bg-ink-800/90 px-2 py-1 text-[10px] text-neon">Portada</button>
                )}
                <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label={`Quitar foto ${i + 1}`} className="rounded-md bg-rose-600/90 px-2 py-1 text-xs text-white">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length < MAX && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${dragging ? "border-neon bg-neon/5" : "border-ink-600 bg-ink-850"}`}
        >
          <svg viewBox="0 0 24 24" className="size-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="2" />
            <path d="m21 16-5-5-9 9" />
          </svg>
          <p className="text-sm text-zinc-300">{uploading ? "Subiendo…" : "Arrastrá las fotos acá o"}</p>
          <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="btn-ghost py-2">
            Elegir fotos
          </button>
          <p className="text-xs text-zinc-500">
            JPG, PNG, WEBP o AVIF · hasta {MAX_MB} MB cada una · {images.length}/{MAX}
          </p>
          <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="…o pegá el link de una foto (https://…)"
          className="input"
          aria-label="Link de una foto"
        />
        <button type="button" onClick={addUrl} className="btn-ghost shrink-0 py-2">
          Agregar
        </button>
      </div>

      {(message || error) && <p className="mt-2 text-xs text-rose-400">{message ?? error}</p>}
      {images.length === 0 && <p className="mt-2 text-xs text-zinc-500">Sin fotos se muestra una ilustración generada automáticamente.</p>}
    </div>
  );
}
