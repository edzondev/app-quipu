/** Minimum duration (ms) to show the "assigning" animation before proceeding. */
export const MIN_ASSIGNING_MS = 3200;

/** Returns a promise that resolves after the given number of milliseconds. */
export function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
