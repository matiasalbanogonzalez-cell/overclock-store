"use client";

export function QuantityInput({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const set = (n: number) => onChange(Math.max(1, Math.min(max, n)));
  return (
    <div className="inline-flex h-11 items-center rounded-xl border border-ink-600 bg-ink-850">
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Restar uno" className="h-full px-3.5 text-lg text-zinc-300 hover:text-neon disabled:opacity-30">
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Cantidad"
        className="w-10 bg-transparent text-center text-sm font-semibold text-white focus:outline-none"
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Sumar uno" className="h-full px-3.5 text-lg text-zinc-300 hover:text-neon disabled:opacity-30">
        +
      </button>
    </div>
  );
}
