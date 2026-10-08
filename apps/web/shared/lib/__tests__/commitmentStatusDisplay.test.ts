import { describe, expect, it } from "vitest";
import { formatCommitmentStatusLines } from "@/shared/lib/commitmentStatusDisplay";

describe("formatCommitmentStatusLines", () => {
	it("shows covered + pending when funded but not paid", () => {
		expect(
			formatCommitmentStatusLines({
				coverageStatus: "covered",
				paymentStatus: "pending",
			}),
		).toEqual(["Cubierto", "Pendiente de pago"]);
	});

	it("shows covered + paid date when marked paid", () => {
		expect(
			formatCommitmentStatusLines({
				coverageStatus: "covered",
				paymentStatus: "paid",
				paidAtForCycle: new Date("2026-08-12T17:00:00.000Z").getTime(),
			}),
		).toEqual(["Cubierto", "Pagado el 12 ago. 2026"]);
	});

	it("shows vence hoy when due today and pending", () => {
		expect(
			formatCommitmentStatusLines({
				coverageStatus: "covered",
				paymentStatus: "pending",
				daysUntilDue: 0,
			}),
		).toEqual(["Cubierto", "Vence hoy"]);
	});

	it("shows overdue payment line even when not covered", () => {
		expect(
			formatCommitmentStatusLines({
				coverageStatus: "uncovered",
				paymentStatus: "overdue",
			}),
		).toEqual(["Sin cubrir", "Vencido"]);
	});
});
