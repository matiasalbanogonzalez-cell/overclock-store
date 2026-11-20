"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/use-form-action";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    
    <form onSubmit={submitWithoutReset(action)} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-rose-400">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
