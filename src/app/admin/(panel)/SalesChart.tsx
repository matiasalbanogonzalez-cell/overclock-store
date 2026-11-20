import { formatPrice } from "@/lib/format";

/** Gráfico de barras simple (una sola serie, sin librerías). Cada barra muestra su valor al pasar el mouse. */
export function SalesChart({ days }: { days: { day: string; total: number }[] }) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const label = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(d)}/${Number(m)}`;
  };

  return (
    <figure className="mt-6">
      <div className="flex h-48 items-end gap-1.5 border-b border-ink-600" role="img" aria-label="Ventas por día de los últimos 14 días">
        {days.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0}>
            <div
              className="w-full max-w-7 rounded-t bg-neon/80 transition group-hover:bg-neon group-focus:bg-neon"
              style={{ height: d.total ? `${Math.max(2, (d.total / max) * 100)}%` : "2px", opacity: d.total ? 1 : 0.25 }}
            />
            <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden rounded-lg border border-ink-600 bg-ink-850 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl group-hover:block group-focus:block">
              <p className="text-zinc-400">{label(d.day)}</p>
              <p className="font-semibold text-white tabular-nums">{formatPrice(d.total)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[10px] text-zinc-500">
        {days.map((d, i) => (
          <span key={d.day} className="flex-1 text-center">
            {i % 2 === 0 ? label(d.day) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventas por día</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th>{d.day}</th>
              <td>{formatPrice(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
