"use client";

import Image from "next/image";
import { useState } from "react";

/** Galería de la página de producto: foto grande + miniaturas */
export function ProductGallery({ images, alt, badge }: { images: string[]; alt: string; badge?: React.ReactNode }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-ink-700 bg-ink-900">
        <Image key={images[current]} src={images[current]} alt={`${alt} (foto ${current + 1} de ${images.length})`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        {badge}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/70 text-white backdrop-blur hover:bg-ink-950"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              aria-label="Foto siguiente"
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/70 text-white backdrop-blur hover:bg-ink-950"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === current}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${i === current ? "border-neon" : "border-ink-700 opacity-60 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
