"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/use-form-action";
import { checkoutAction, type CheckoutState } from "@/app/(store)/checkout/actions";
import { shippingFor } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { PROVINCES } from "@/lib/validation";
import { cartSubtotal, useCart } from "@/store/cart";

function Field({
  name,
  label,
  state,
  className = "",
  ...props
}: { name: string; label: string; state: CheckoutState; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = state.fieldErrors?.[name];
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={state.values?.[name]}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`input ${error ? "border-rose-500/70" : ""}`}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ demo }: { demo: boolean }) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const [state, action, pending] = useActionState(checkoutAction, {});

  if (!hydrated) return <div className="card h-96 animate-pulse" />;
  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="font-display text-xl text-white">No hay productos en tu carrito</p>
        <Link href="/productos" className="btn-primary mt-6">
          Ver productos
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const cartJson = JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
      <input type="hidden" name="cart" value={cartJson} />

      <div className="space-y-6">
        {state.error && (
          <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {state.error}{" "}
            {!state.fieldErrors && (
              <Link href="/carrito" className="font-semibold underline">
                Ir al carrito
              </Link>
            )}
          </div>
        )}

        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="sr-only">Tus datos</legend>
          <h2 className="font-display text-lg font-semibold text-white sm:col-span-2">1. Tus datos</h2>
          <Field state={state} name="customerName" label="Nombre y apellido" autoComplete="name" required className="sm:col-span-2" />
          <Field state={state} name="customerEmail" label="Email" type="email" autoComplete="email" required />
          <Field state={state} name="customerPhone" label="Teléfono" type="tel" autoComplete="tel" placeholder="11 2345 6789" required />
          <Field state={state} name="customerDni" label="DNI" inputMode="numeric" placeholder="Sin puntos" required />
        </fieldset>

        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="sr-only">Envío</legend>
          <h2 className="font-display text-lg font-semibold text-white sm:col-span-2">2. ¿A dónde te lo enviamos?</h2>
          <Field state={state} name="street" label="Calle y número" autoComplete="street-address" className="sm:col-span-2" required />
          <Field state={state} name="city" label="Localidad" autoComplete="address-level2" required />
          <div>
            <label htmlFor="province" className="label">
              Provincia
            </label>
            <select id="province" name="province" defaultValue={state.values?.province ?? ""} className={`input ${state.fieldErrors?.province ? "border-rose-500/70" : ""}`} required>
              <option value="" disabled>
                Elegí una provincia
              </option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            {state.fieldErrors?.province && <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.province}</p>}
          </div>
          <Field state={state} name="zipCode" label="Código postal" autoComplete="postal-code" required />
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="label">
              Notas para la entrega (opcional)
            </label>
            <textarea id="notes" name="notes" rows={2} maxLength={300} defaultValue={state.values?.notes} className="input" placeholder="Piso, depto, horario…" />
          </div>
        </fieldset>
      </div>

      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-semibold text-white">Tu pedido</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span className="text-zinc-400">
                {i.name} <span className="text-zinc-500">× {i.quantity}</span>
              </span>
              <span className="shrink-0 text-white">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-ink-700 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Envío</dt>
            <dd className="text-white">{shipping ? formatPrice(shipping) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold text-white">Total</dt>
            <dd className="font-display text-xl font-bold text-neon">{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Preparando el pago…" : "Pagar con Mercado Pago"}
        </button>
        <p className="text-center text-xs text-zinc-500">
          {demo
            ? "Modo demo: vas a un simulador de pago, no se cobra nada."
            : "Te redirigimos a Mercado Pago. Reservamos el stock por 30 minutos."}
        </p>
      </aside>
    </form>
  );
}
