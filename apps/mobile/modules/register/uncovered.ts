export function uncoveredCommitmentsCents(commitments: unknown): number {
  if (!Array.isArray(commitments)) return 0;
  return commitments.reduce<number>((sum, row) => {
    if (!row || typeof row !== "object") return sum;
    const remaining =
      "remaining" in row && typeof row.remaining === "number"
        ? row.remaining
        : 0;
    if (!Number.isFinite(remaining) || remaining <= 0) return sum;
    const status =
      "coverageStatus" in row && typeof row.coverageStatus === "string"
        ? row.coverageStatus
        : "";
    if (status === "covered") return sum;
    return sum + remaining;
  }, 0);
}
