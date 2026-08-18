"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * SSR-safe hydration gate: false during server render and on the first client
 * render pass, true afterwards. Prevents localStorage-persisted store
 * mismatches without setting state inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}