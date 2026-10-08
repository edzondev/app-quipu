import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { MAX_SAVINGS_GOALS } from "./lib/savingsMath";
import schema from "./schema";

const modules = {
	"./_generated/api.js": () => import("./_generated/api.js"),
	"./closedCycleSurplus.js": () => import("./closedCycleSurplus.js"),
	"./savings.js": () => import("./savings.js"),
};

function testBackend() {
	return convexTest(schema, modules);
}

type Backend = ReturnType<typeof testBackend>;

type ClosedCycleHarness = {
	userId: string;
	cycleId: Id<"financialCycles">;
	fundId: Id<"subEnvelopes">;
	tripId: Id<"subEnvelopes">;
	needsEnvelopeId: Id<"envelopes">;
	savingsEnvelopeId: Id<"envelopes">;
};

async function seedClosedCycle(
	t: Backend,
	options: {
		userId: string;
		needsRemaining?: number;
		wantsRemaining?: number;
		savingsRemaining?: number;
		status?: "active" | "closed";
		endDate?: number;
		fundAmount?: number;
	},
): Promise<ClosedCycleHarness> {
	const needsRemaining = options.needsRemaining ?? 10_000;
	const wantsRemaining = options.wantsRemaining ?? 0;
	const savingsRemaining = options.savingsRemaining ?? 0;
	const status = options.status ?? "closed";
	const endDate = options.endDate ?? 2;
	const fundAmount = options.fundAmount ?? 0;

	return t.run(async (ctx) => {
		const profileId = await ctx.db.insert("profiles", {
			userId: options.userId,
			name: "Ana",
			country: "PE",
			currencyCode: "PEN",
			currencySymbol: "S/",
			incomeModel: "fixed",
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
			onboardingComplete: true,
			plan: "free",
			createdAt: 1,
		});
		const cycleId = await ctx.db.insert("financialCycles", {
			profileId,
			startDate: 1,
			endDate,
			status,
			totalIncomeReceived: 20_000,
		});
		const needsEnvelopeId = await ctx.db.insert("envelopes", {
			profileId,
			cycleId,
			type: "needs",
			allocatedAmount: 20_000,
			remainingAmount: needsRemaining,
		});
		await ctx.db.insert("envelopes", {
			profileId,
			cycleId,
			type: "wants",
			allocatedAmount: 8_000,
			remainingAmount: wantsRemaining,
		});
		const savingsEnvelopeId = await ctx.db.insert("envelopes", {
			profileId,
			cycleId,
			type: "savings",
			allocatedAmount: 4_000,
			remainingAmount: savingsRemaining,
		});
		const fundId = await ctx.db.insert("subEnvelopes", {
			profileId,
			parentEnvelopeType: "savings",
			label: "Fondo de emergencia",
			emoji: "",
			currentAmount: fundAmount,
			targetAmount: 100_000,
			isSystemDefault: true,
		});
		const tripId = await ctx.db.insert("subEnvelopes", {
			profileId,
			parentEnvelopeType: "savings",
			label: "Aaa viaje",
			emoji: "",
			currentAmount: 0,
			isSystemDefault: false,
		});
		return {
			userId: options.userId,
			cycleId,
			fundId,
			tripId,
			needsEnvelopeId,
			savingsEnvelopeId,
		};
	});
}

async function readLedger(
	t: Backend,
	seed: Pick<
		ClosedCycleHarness,
		"cycleId" | "fundId" | "tripId" | "needsEnvelopeId" | "savingsEnvelopeId"
	>,
) {
	return t.run(async (ctx) => {
		const dispositions = await ctx.db
			.query("closedCycleSurplusDispositions")
			.withIndex("by_cycle", (q) => q.eq("closedCycleId", seed.cycleId))
			.collect();
		const contributions = await ctx.db
			.query("surplusContributions")
			.withIndex("by_cycle", (q) => q.eq("cycleId", seed.cycleId))
			.collect();
		const fund = await ctx.db.get("subEnvelopes", seed.fundId);
		const trip = await ctx.db.get("subEnvelopes", seed.tripId);
		const needs = await ctx.db.get("envelopes", seed.needsEnvelopeId);
		const savings = await ctx.db.get("envelopes", seed.savingsEnvelopeId);
		if (!fund || !trip || !needs || !savings) {
			throw new Error("Faltan documentos del ciclo de prueba.");
		}
		return {
			dispositionCount: dispositions.length,
			contributionCount: contributions.length,
			contributionOrigins: contributions.map((row) => row.fromEnvelope),
			fundAmount: fund.currentAmount,
			tripAmount: trip.currentAmount,
			needsRemaining: needs.remainingAmount,
			savingsRemaining: savings.remainingAmount,
		};
	});
}

describe("assignClosedCycleSurplus", () => {
	it("asigna todo el sobrante al Fondo y decided pasa a true", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-fund", needsRemaining: 10_000 });
		const asUser = t.withIdentity({ subject: seed.userId });

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 10_000 },
			],
		});

		const ledger = await readLedger(t, seed);
		expect(ledger.fundAmount).toBe(10_000);
		expect(ledger.contributionCount).toBe(1);
		expect(ledger.contributionOrigins).toEqual(["needs"]);
		expect(ledger.dispositionCount).toBe(1);
		expect(ledger.needsRemaining).toBe(10_000);

		const report = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(report).toMatchObject({
			closedCycleId: seed.cycleId,
			decided: true,
			envelopes: [{ fromEnvelope: "needs", label: "Necesidades", total: 10_000, available: 0 }],
			assignments: [
				{
					fromEnvelope: "needs",
					amount: 10_000,
					destination: {
						kind: "subEnvelope",
						subEnvelopeId: seed.fundId,
						name: "Fondo de emergencia",
						isSystemDefault: true,
					},
				},
			],
		});
		expect(report?.savingsSubEnvelopes[0]).toMatchObject({
			id: seed.fundId,
			name: "Fondo de emergencia",
			currentAmount: 10_000,
			isSystemDefault: true,
		});
	});

	it("reparte entre Fondo, otro sub-sobre y leave sin mover el sobrante original", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-split", needsRemaining: 10_000 });
		const asUser = t.withIdentity({ subject: seed.userId });

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 5_000 },
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.tripId }, amount: 3_000 },
				{ destination: { kind: "leave" }, amount: 2_000 },
			],
		});

		const ledger = await readLedger(t, seed);
		expect(ledger.fundAmount).toBe(5_000);
		expect(ledger.tripAmount).toBe(3_000);
		expect(ledger.contributionCount).toBe(2);
		expect(ledger.dispositionCount).toBe(3);
		expect(ledger.needsRemaining).toBe(10_000);

		const report = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(report?.decided).toBe(true);
		expect(report?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 10_000, available: 0 },
		]);
		expect(report?.assignments).toEqual([
			{
				fromEnvelope: "needs",
				amount: 5_000,
				destination: {
					kind: "subEnvelope",
					subEnvelopeId: seed.fundId,
					name: "Fondo de emergencia",
					isSystemDefault: true,
				},
			},
			{
				fromEnvelope: "needs",
				amount: 3_000,
				destination: {
					kind: "subEnvelope",
					subEnvelopeId: seed.tripId,
					name: "Aaa viaje",
					isSystemDefault: false,
				},
			},
			{ fromEnvelope: "needs", amount: 2_000, destination: { kind: "leave" } },
		]);
		expect(report?.savingsSubEnvelopes.map((row) => row.name)).toEqual([
			"Fondo de emergencia",
			"Aaa viaje",
		]);
	});

	it("permite asignación parcial en dos llamadas y decided solo al cubrir todo", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, {
			userId: "user-partial",
			needsRemaining: 10_000,
			wantsRemaining: 4_000,
		});
		const asUser = t.withIdentity({ subject: seed.userId });

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 4_000 },
			],
		});

		const pending = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(pending?.decided).toBe(false);
		expect(pending?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 10_000, available: 6_000 },
			{ fromEnvelope: "wants", label: "Gustos", total: 4_000, available: 4_000 },
		]);

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [{ destination: { kind: "leave" }, amount: 6_000 }],
		});

		const partial = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(partial?.decided).toBe(false);
		expect(partial?.envelopes.find((row) => row.fromEnvelope === "needs")).toEqual({
			fromEnvelope: "needs",
			label: "Necesidades",
			total: 10_000,
			available: 0,
		});

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "wants",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.tripId }, amount: 4_000 },
			],
		});

		const decided = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(decided?.decided).toBe(true);
		expect(decided?.assignments).toHaveLength(3);
		const ledger = await readLedger(t, seed);
		expect(ledger.fundAmount).toBe(4_000);
		expect(ledger.tripAmount).toBe(4_000);
		expect(ledger.contributionCount).toBe(2);
		expect(ledger.needsRemaining).toBe(10_000);
	});

	it("rechaza el exceso sobre el disponible sin escribir", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-excess", needsRemaining: 10_000 });
		const asUser = t.withIdentity({ subject: seed.userId });

		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: seed.cycleId,
				fromEnvelope: "needs",
				allocations: [
					{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 6_000 },
					{ destination: { kind: "leave" }, amount: 5_000 },
				],
			}),
		).rejects.toThrow("La suma supera el sobrante disponible de ese sobre.");

		const ledger = await readLedger(t, seed);
		expect(ledger.dispositionCount).toBe(0);
		expect(ledger.contributionCount).toBe(0);
		expect(ledger.fundAmount).toBe(0);
		expect(ledger.needsRemaining).toBe(10_000);
	});

	it("rechaza un ciclo activo", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, {
			userId: "user-active",
			status: "active",
			needsRemaining: 10_000,
		});
		const asUser = t.withIdentity({ subject: seed.userId });

		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: seed.cycleId,
				fromEnvelope: "needs",
				allocations: [{ destination: { kind: "leave" }, amount: 1_000 }],
			}),
		).rejects.toThrow("Solo puedes asignar el sobrante de un ciclo cerrado.");

		const ledger = await readLedger(t, seed);
		expect(ledger.dispositionCount).toBe(0);
	});

	it("rechaza el ciclo de otro usuario", async () => {
		const t = testBackend();
		const owner = await seedClosedCycle(t, { userId: "user-owner", needsRemaining: 10_000 });
		await seedClosedCycle(t, { userId: "user-other", needsRemaining: 10_000 });
		const asOther = t.withIdentity({ subject: "user-other" });

		await expect(
			asOther.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: owner.cycleId,
				fromEnvelope: "needs",
				allocations: [{ destination: { kind: "leave" }, amount: 1_000 }],
			}),
		).rejects.toThrow("No encontramos ese ciclo cerrado.");

		const ledger = await readLedger(t, owner);
		expect(ledger.dispositionCount).toBe(0);
	});

	it("rechaza un sub-sobre de otro usuario y no escribe nada", async () => {
		const t = testBackend();
		const owner = await seedClosedCycle(t, { userId: "user-owner-sub", needsRemaining: 10_000 });
		const other = await seedClosedCycle(t, { userId: "user-foreign-sub", needsRemaining: 10_000 });
		const asOwner = t.withIdentity({ subject: owner.userId });

		await expect(
			asOwner.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: owner.cycleId,
				fromEnvelope: "needs",
				allocations: [
					{ destination: { kind: "subEnvelope", subEnvelopeId: owner.fundId }, amount: 1_000 },
					{ destination: { kind: "subEnvelope", subEnvelopeId: other.fundId }, amount: 1_000 },
				],
			}),
		).rejects.toThrow("Esa meta no es un sub-sobre de ahorro tuyo.");

		const ledger = await readLedger(t, owner);
		expect(ledger.dispositionCount).toBe(0);
		expect(ledger.contributionCount).toBe(0);
		expect(ledger.fundAmount).toBe(0);
		const otherLedger = await readLedger(t, other);
		expect(otherLedger.fundAmount).toBe(0);
		expect(otherLedger.dispositionCount).toBe(0);
	});

	it("rechaza monto 0 y allocations vacío", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-invalid", needsRemaining: 10_000 });
		const asUser = t.withIdentity({ subject: seed.userId });

		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: seed.cycleId,
				fromEnvelope: "needs",
				allocations: [{ destination: { kind: "leave" }, amount: 0 }],
			}),
		).rejects.toThrow("Cada monto debe ser un entero de céntimos mayor a cero.");

		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: seed.cycleId,
				fromEnvelope: "needs",
				allocations: [],
			}),
		).rejects.toThrow("Indica al menos un destino para el sobrante.");

		const ledger = await readLedger(t, seed);
		expect(ledger.dispositionCount).toBe(0);
		expect(ledger.contributionCount).toBe(0);
	});

	it("rechaza más destinos que las metas más dejarlo en el sobre, sin escribir", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-too-many", needsRemaining: 10_000 });
		const asUser = t.withIdentity({ subject: seed.userId });
		const allocations: Array<{ destination: { kind: "leave" }; amount: number }> = [];
		for (let index = 0; index < MAX_SAVINGS_GOALS + 2; index += 1) {
			allocations.push({ destination: { kind: "leave" }, amount: 1 });
		}

		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: seed.cycleId,
				fromEnvelope: "needs",
				allocations,
			}),
		).rejects.toThrow("Hay demasiados destinos para este sobrante.");

		const ledger = await readLedger(t, seed);
		expect(ledger.dispositionCount).toBe(0);
		expect(ledger.contributionCount).toBe(0);
		expect(ledger.fundAmount).toBe(0);
		expect(ledger.needsRemaining).toBe(10_000);
	});

	it("muestra vacío sin ciclo cerrado y decidido cuando no hay sobrante", async () => {
		const t = testBackend();
		const active = await seedClosedCycle(t, {
			userId: "user-empty",
			status: "active",
			needsRemaining: 10_000,
		});
		const asUser = t.withIdentity({ subject: active.userId });
		expect(await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {})).toBeNull();

		const closed = await seedClosedCycle(t, {
			userId: "user-zero",
			needsRemaining: 0,
			wantsRemaining: 0,
			savingsRemaining: 8_000,
		});
		const asZero = t.withIdentity({ subject: closed.userId });
		const report = await asZero.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(report?.decided).toBe(true);
		expect(report?.envelopes).toEqual([]);
		expect(report?.assignments).toEqual([]);
	});

	it("no descuenta aportes previos ni el remaining al asignar el pool extraordinario", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, {
			userId: "user-extra",
			needsRemaining: 5_000,
			savingsRemaining: 7_000,
		});
		await t.run(async (ctx) => {
			const cycle = await ctx.db.get("financialCycles", seed.cycleId);
			if (!cycle) throw new Error("Ciclo de prueba ausente.");
			await ctx.db.insert("incomeEvents", {
				profileId: cycle.profileId,
				cycleId: seed.cycleId,
				amount: 10_000,
				source: "other",
				description: "CTS",
				occurredAt: 1,
				incomeKind: "extraordinary",
				distributionApplied: { needs: 0, wants: 0, savings: 10_000 },
			});
			await ctx.db.insert("surplusContributions", {
				profileId: cycle.profileId,
				cycleId: seed.cycleId,
				fromEnvelope: "extraordinary",
				amount: 3_000,
				subEnvelopeId: seed.fundId,
				createdAt: 1,
				contributionKind: "additional",
			});
			await ctx.db.insert("surplusContributions", {
				profileId: cycle.profileId,
				cycleId: seed.cycleId,
				fromEnvelope: "needs",
				amount: 2_000,
				subEnvelopeId: seed.fundId,
				createdAt: 1,
				contributionKind: "additional",
			});
			await ctx.db.patch(seed.fundId, { currentAmount: 5_000 });
		});

		const asUser = t.withIdentity({ subject: seed.userId });
		const before = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(before?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 5_000, available: 5_000 },
			{ fromEnvelope: "extraordinary", label: "Ingresos extra", total: 7_000, available: 7_000 },
		]);

		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "extraordinary",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 7_000 },
			],
		});
		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [{ destination: { kind: "leave" }, amount: 5_000 }],
		});

		const ledger = await readLedger(t, seed);
		expect(ledger.savingsRemaining).toBe(7_000);
		expect(ledger.needsRemaining).toBe(5_000);
		expect(ledger.fundAmount).toBe(12_000);
		const after = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(after?.decided).toBe(true);
		expect(after?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 5_000, available: 0 },
			{ fromEnvelope: "extraordinary", label: "Ingresos extra", total: 7_000, available: 0 },
		]);
	});

	it("elige el ciclo cerrado insertado más tarde, no el de mayor endDate", async () => {
		const t = testBackend();
		const older = await seedClosedCycle(t, {
			userId: "user-latest",
			needsRemaining: 1_000,
			endDate: 9_000,
		});
		const newerId = await t.run(async (ctx) => {
			const olderCycle = await ctx.db.get("financialCycles", older.cycleId);
			if (!olderCycle) throw new Error("Ciclo de prueba ausente.");
			const cycleId = await ctx.db.insert("financialCycles", {
				profileId: olderCycle.profileId,
				startDate: 1,
				endDate: 10,
				status: "closed",
				totalIncomeReceived: 0,
			});
			await ctx.db.insert("financialCycles", {
				profileId: olderCycle.profileId,
				startDate: 20,
				endDate: 50_000,
				status: "active",
				totalIncomeReceived: 0,
			});
			await ctx.db.insert("envelopes", {
				profileId: olderCycle.profileId,
				cycleId,
				type: "needs",
				allocatedAmount: 2_000,
				remainingAmount: 2_000,
			});
			return cycleId;
		});

		const report = await t
			.withIdentity({ subject: older.userId })
			.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(report?.closedCycleId).toBe(newerId);
		expect(report?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 2_000, available: 2_000 },
		]);
	});

	it("rechaza asignar el sobrante de un ciclo cerrado que no es el último", async () => {
		const t = testBackend();
		const older = await seedClosedCycle(t, {
			userId: "user-old-cycle",
			needsRemaining: 4_000,
			endDate: 9_000,
		});
		await t.run(async (ctx) => {
			const olderCycle = await ctx.db.get("financialCycles", older.cycleId);
			if (!olderCycle) throw new Error("Ciclo de prueba ausente.");
			const cycleId = await ctx.db.insert("financialCycles", {
				profileId: olderCycle.profileId,
				startDate: 1,
				endDate: 10,
				status: "closed",
				totalIncomeReceived: 0,
			});
			await ctx.db.insert("envelopes", {
				profileId: olderCycle.profileId,
				cycleId,
				type: "needs",
				allocatedAmount: 2_000,
				remainingAmount: 2_000,
			});
		});

		const asUser = t.withIdentity({ subject: older.userId });
		await expect(
			asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
				closedCycleId: older.cycleId,
				fromEnvelope: "needs",
				allocations: [{ destination: { kind: "leave" }, amount: 1_000 }],
			}),
		).rejects.toThrow("Solo puedes asignar el sobrante del último ciclo cerrado.");

		const ledger = await readLedger(t, older);
		expect(ledger.dispositionCount).toBe(0);
		expect(ledger.contributionCount).toBe(0);
		expect(ledger.fundAmount).toBe(0);
		expect(ledger.needsRemaining).toBe(4_000);
	});

	it("devuelve name null si el sub-sobre de la asignación ya no existe", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, { userId: "user-deleted", needsRemaining: 1_000 });
		const asUser = t.withIdentity({ subject: seed.userId });
		await asUser.mutation(api.closedCycleSurplus.assignClosedCycleSurplus, {
			closedCycleId: seed.cycleId,
			fromEnvelope: "needs",
			allocations: [
				{ destination: { kind: "subEnvelope", subEnvelopeId: seed.fundId }, amount: 1_000 },
			],
		});
		await t.run(async (ctx) => {
			await ctx.db.delete(seed.fundId);
		});

		const report = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		// Sin el documento no hay isSystemDefault real: false no afirma que no fuera el Fondo.
		expect(report?.assignments).toEqual([
			{
				fromEnvelope: "needs",
				amount: 1_000,
				destination: {
					kind: "subEnvelope",
					subEnvelopeId: seed.fundId,
					name: null,
					isSystemDefault: false,
				},
			},
		]);
		expect(report?.savingsSubEnvelopes.map((row) => row.id)).not.toContain(seed.fundId);
	});

	it("no cuenta dos veces un moveSurplusToSavings que ya bajó el remaining", async () => {
		const t = testBackend();
		const seed = await seedClosedCycle(t, {
			userId: "user-once",
			status: "active",
			needsRemaining: 10_000,
			wantsRemaining: 8_000,
			savingsRemaining: 20_000,
		});
		await t.run(async (ctx) => {
			const cycle = await ctx.db.get("financialCycles", seed.cycleId);
			if (!cycle) throw new Error("Ciclo de prueba ausente.");
			await ctx.db.insert("incomeEvents", {
				profileId: cycle.profileId,
				cycleId: seed.cycleId,
				amount: 10_000,
				source: "other",
				description: "CTS",
				occurredAt: 1,
				incomeKind: "extraordinary",
				distributionApplied: { needs: 0, wants: 0, savings: 10_000 },
			});
		});

		const asUser = t.withIdentity({ subject: seed.userId });
		await asUser.mutation(api.savings.moveSurplusToSavings, {
			fromEnvelope: "needs",
			amount: 3_000,
			toSubEnvelopeId: seed.fundId,
		});
		await asUser.mutation(api.savings.moveSurplusToSavings, {
			fromEnvelope: "wants",
			amount: 2_000,
			toSubEnvelopeId: seed.fundId,
		});
		await asUser.mutation(api.savings.moveSurplusToSavings, {
			fromEnvelope: "extraordinary",
			amount: 4_000,
			toSubEnvelopeId: seed.fundId,
		});
		await t.run(async (ctx) => {
			await ctx.db.patch(seed.cycleId, { status: "closed" });
		});

		const report = await asUser.query(api.closedCycleSurplus.getClosedCycleSurplus, {});
		expect(report?.envelopes).toEqual([
			{ fromEnvelope: "needs", label: "Necesidades", total: 7_000, available: 7_000 },
			{ fromEnvelope: "wants", label: "Gustos", total: 6_000, available: 6_000 },
			{ fromEnvelope: "extraordinary", label: "Ingresos extra", total: 6_000, available: 6_000 },
		]);
		const ledger = await readLedger(t, seed);
		expect(ledger.needsRemaining).toBe(7_000);
		expect(ledger.savingsRemaining).toBe(16_000);
	});
});
