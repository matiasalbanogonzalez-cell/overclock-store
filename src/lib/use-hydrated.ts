"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true sólo en el navegador, después de hidratar (evita diferencias con el carrito guardado en localStorage) */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
