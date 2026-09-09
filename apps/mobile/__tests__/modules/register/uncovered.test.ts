import { uncoveredCommitmentsCents } from "@/modules/register/uncovered";

describe("uncoveredCommitmentsCents", () => {
  it("suma remaining de los no cubiertos", () => {
    expect(
      uncoveredCommitmentsCents([
        { remaining: 100_000, coverageStatus: "uncovered" },
        { remaining: 26_500, coverageStatus: "partial" },
        { remaining: 80_000, coverageStatus: "covered" },
      ]),
    ).toBe(126_500);
  });

  it("vacío o raro es 0", () => {
    expect(uncoveredCommitmentsCents([])).toBe(0);
    expect(uncoveredCommitmentsCents(undefined)).toBe(0);
  });
});
