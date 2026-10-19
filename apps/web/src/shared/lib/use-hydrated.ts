"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => undefined;

/** `false` during server rendering and hydration, `true` after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
