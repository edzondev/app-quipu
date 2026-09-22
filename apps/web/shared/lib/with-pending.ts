/**
 * Clears a flag after `task`, including when it throws or returns early.
 * Lives outside components: the React Compiler does not support `try/finally`.
 */
export async function withFlag<T>(
  setFlag: (value: T) => void,
  active: T,
  idle: T,
  task: () => Promise<void>,
): Promise<void> {
  setFlag(active);
  try {
    await task();
  } finally {
    setFlag(idle);
  }
}

export function withPending(
  setPending: (pending: boolean) => void,
  task: () => Promise<void>,
): Promise<void> {
  return withFlag(setPending, true, false, task);
}
