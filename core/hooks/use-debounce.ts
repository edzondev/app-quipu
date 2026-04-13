import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable debounced version of `callback` that fires only after
 * `delay` ms of inactivity. The returned function identity is stable across
 * renders as long as `delay` does not change, so it is safe to use in
 * dependency arrays without causing loops.
 *
 * Key design decisions:
 * - `callbackRef` is updated synchronously during render so the timer always
 *   invokes the *latest* version of the callback, even if it changed between
 *   the call and the timeout firing. No effect needed — setting a ref during
 *   render (without reading it) is a well-established React pattern.
 * - The timeout ID is stored in a ref; clearing it on unmount prevents
 *   callbacks from running after the component is gone.
 */
export function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep the ref in sync with the latest callback on every render.
  callbackRef.current = callback;

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
