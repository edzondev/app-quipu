import {
	editableFromRecentExpense,
	presentMovementList,
	readRecentExpenses,
} from "@/shared/lib/movements/model";

const DAY = 24 * 60 * 60 * 1000;
const START = Date.parse("2026-08-01T00:00:00-05:00");
const END = START + 30 * DAY;
const NOW = Date.parse("2026-08-15T21:00:00-05:00");

const PLAZA = Date.parse("2026-08-15T19:12:00-05:00");
const MENU = Date.parse("2026-08-15T13:20:00-05:00");
const METRO = Date.parse("2026-08-15T08:05:00-05:00");
const FARMACIA = Date.parse("2026-08-14T18:00:00-05:00");
const CAFE = Date.parse("2026-08-14T09:00:00-05:00");
const SUELDO = Date.parse("2026-08-01T09:00:00-05:00");

function detectedExpense<T extends object>(row: T): T {
	return Object.assign(row, { detected: true });
}

const cycle = {
	currencyCode: "PEN",
	cycle: { startDate: START, endDate: END },
	movements: [
		detectedExpense({
			id: "exp_plaza",
			kind: "expense" as const,
			label: "Plaza Vea",
			amount: 4200,
			timestamp: PLAZA,
			envelopeType: "wants" as const,
			envelopeLabel: "Gustos",
			envelopeId: "env_wants_should_not_render",
		}),
		{
			id: "exp_menu",
			kind: "expense" as const,
			label: "Menú del día",
			amount: 1500,
			timestamp: MENU,
			envelopeType: "wants" as const,
			envelopeLabel: "Gustos",
		},
		{
			id: "exp_metro",
			kind: "expense" as const,
			label: "Metropolitano",
			amount: 500,
			timestamp: METRO,
			envelopeType: "needs" as const,
			envelopeLabel: "Necesidades",
		},
		{
			id: "exp_farm",
			kind: "expense" as const,
			label: "Farmacia Inkafarma",
			amount: 2310,
			timestamp: FARMACIA,
			envelopeType: "needs" as const,
			envelopeLabel: "Necesidades",
		},
		{
			id: "exp_cafe",
			kind: "expense" as const,
			label: "Café con Andrea",
			amount: 1500,
			timestamp: CAFE,
			envelopeType: "wants" as const,
			envelopeLabel: "Gustos",
		},
		{
			id: "exp_fund",
			kind: "expense" as const,
			label: "Fondo",
			amount: 1000,
			timestamp: Date.parse("2026-08-10T12:00:00-05:00"),
			envelopeLabel: "Ahorro",
		},
		{
			id: "in_sueldo",
			kind: "income" as const,
			label: "Sueldo",
			amount: 350_000,
			timestamp: SUELDO,
			occurredAt: SUELDO,
			source: "payroll" as const,
			distributionPolicy: "profile_default" as const,
		},
	],
};

function present(filter: "all" | "needs" | "wants" | "savings" = "all", query = "") {
	return presentMovementList(cycle, { filter, query, now: NOW });
}

describe("presentMovementList", () => {
	it("agrupa por día, marca el detectado y reparte el ingreso", () => {
		const model = present();
		expect(model.cycleLine).toBe("CICLO 1 – 30 AGO · 7 REGISTROS");
		expect(model.isEmpty).toBe(false);
		expect(model.groups.map((group) => group.title)).toEqual([
			"HOY · 15 AGO",
			"AYER · 14 AGO",
			"10 AGO",
			"1 AGO",
		]);
		expect(model.groups[0]).toMatchObject({
			totalLabel: "− S/ 62.00",
			rows: [
				{
					label: "Plaza Vea",
					amountLabel: "− S/ 42.00",
					dot: "wants",
					meta: "DETECTADO · 19:12",
					metaTone: "detected",
					opensExpense: true,
				},
				{
					label: "Menú del día",
					amountLabel: "− S/ 15.00",
					meta: "13:20",
					dot: "wants",
				},
				{
					label: "Metropolitano",
					amountLabel: "− S/ 5.00",
					meta: "08:05",
					dot: "needs",
				},
			],
		});
		expect(model.groups[1]?.rows.map((row) => row.meta)).toEqual([null, null]);
		expect(model.groups[1]?.totalLabel).toBe("− S/ 38.10");
		expect(model.groups[2]?.rows[0]).toMatchObject({
			label: "Fondo",
			dot: "savings",
			opensExpense: true,
			meta: null,
		});
		expect(model.groups[3]?.rows[0]).toMatchObject({
			label: "Sueldo",
			amountLabel: "+ S/ 3,500",
			amountTone: "in",
			dot: "income",
			meta: "REPARTIDO",
			opensExpense: false,
		});
		expect(model.groups[3]?.totalLabel).toBe("+ S/ 3,500.00");
	});

	it("filtra por sobre sin cambiar el conteo del ciclo", () => {
		const wants = present("wants");
		expect(wants.cycleLine).toBe("CICLO 1 – 30 AGO · 7 REGISTROS");
		expect(wants.groups.map((group) => group.title)).toEqual(["HOY · 15 AGO", "AYER · 14 AGO"]);
		expect(wants.groups[0]?.totalLabel).toBe("− S/ 57.00");
		expect(present("savings").groups[0]?.rows[0]?.label).toBe("Fondo");
		expect(present("needs").groups.flatMap((group) => group.rows)).toHaveLength(2);
	});

	it("busca por nombre y no muestra identificadores", () => {
		const found = present("all", "plaza");
		expect(found.groups).toHaveLength(1);
		expect(found.groups[0]?.rows).toHaveLength(1);
		const visible = found.groups
			.flatMap((group) => [
				group.title,
				group.totalLabel,
				...group.rows.flatMap((row) => [row.label, row.meta, row.amountLabel]),
			])
			.join(" ");
		expect(visible).not.toContain("env_wants_should_not_render");
		expect(visible).not.toContain("exp_plaza");
		expect(visible).not.toContain("—");
		expect(present("all", "no-existe").isFilterEmpty).toBe(true);
	});

	it("acopla ingreso extraordinario y regla automática en la línea meta", () => {
		const model = presentMovementList(
			{
				currencyCode: "PEN",
				cycle: { startDate: START, endDate: END },
				movements: [
					{
						id: "in_cts",
						kind: "income" as const,
						label: "CTS",
						amount: 120_000,
						timestamp: SUELDO,
						occurredAt: SUELDO,
						source: "payroll" as const,
						isExtraordinaryIncome: true,
						extraordinaryLabel: "CTS",
						appliedByAutoRule: true,
						distributionPolicy: "all_to_savings" as const,
					},
				],
			},
			{ filter: "all", query: "", now: NOW },
		);
		expect(model.groups[0]?.rows[0]?.meta).toBe("AUTO · CTS · TODO A AHORRO");
		expect(model.groups[0]?.rows[0]?.metaTone).toBe("note");
	});

	it("deja el ciclo vacío sin filas de relleno", () => {
		const model = presentMovementList(
			{
				currencyCode: "USD",
				cycle: { startDate: START, endDate: END },
				movements: [],
			},
			{ filter: "all", query: "", now: NOW },
		);
		expect(model.isEmpty).toBe(true);
		expect(model.groups).toEqual([]);
		expect(model.cycleLine).toBe("CICLO 1 – 30 AGO · 0 REGISTROS");
		expect(JSON.stringify(model)).not.toContain("—");
	});

	it("cruza de mes en el encabezado del ciclo", () => {
		const start = Date.parse("2026-07-28T00:00:00-05:00");
		const model = presentMovementList(
			{
				currencyCode: "PEN",
				cycle: { startDate: start, endDate: start + 30 * DAY },
				movements: [],
			},
			{ filter: "all", query: "", now: NOW },
		);
		expect(model.cycleLine).toBe("CICLO 28 JUL – 26 AGO · 0 REGISTROS");
	});

	it("sin ciclo activo no inventa fechas", () => {
		expect(presentMovementList(null, { filter: "all", query: "", now: NOW })).toMatchObject({
			cycleLine: "0 REGISTROS",
			isEmpty: true,
			groups: [],
		});
	});
});

describe("editableFromRecentExpense", () => {
	it("convierte un gasto reciente de gustos en borrador editable", () => {
		expect(
			editableFromRecentExpense({
				_id: "exp1",
				amount: 1550,
				description: "Café",
				envelopeType: "wants",
			}),
		).toEqual({
			id: "exp1",
			amountCents: 1550,
			description: "Café",
			envelopeType: "wants",
		});
	});

	it("lee gastos recientes y descarta filas incompletas", () => {
		expect(
			readRecentExpenses([
				{
					_id: "exp1",
					amount: 500,
					description: "Bus",
					timestamp: 10,
					envelopeType: "needs",
				},
				{ amount: 100 },
				null,
			]),
		).toEqual([
			{
				_id: "exp1",
				amount: 500,
				description: "Bus",
				timestamp: 10,
				envelopeType: "needs",
			},
		]);
		expect(readRecentExpenses(null)).toEqual([]);
	});

	it("ignora gastos sin sobre de necesidades o gustos", () => {
		expect(
			editableFromRecentExpense({
				_id: "exp2",
				amount: 100,
				description: "Ahorro",
				envelopeType: "savings",
			}),
		).toBeNull();
		expect(
			editableFromRecentExpense({
				_id: "exp3",
				amount: 100,
				description: "Sin sobre",
			}),
		).toBeNull();
	});
});
