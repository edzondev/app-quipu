import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { ProgressPreviewPicker } from "@/shared/components/progress/progress-preview-picker";
import { PROGRESS_SCENARIO_IDS } from "@/shared/dev/progress-scenarios";
import { useProgress } from "@/shared/hooks/use-progress";
import { selectProgressScenario } from "@/shared/hooks/use-progress-preview";

const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));

let latest: ReturnType<typeof useProgress> | null = null;

function Probe() {
	latest = useProgress();
	return null;
}

function progress() {
	if (latest === null) throw new Error("useProgress no se montó");
	return latest;
}

describe("escenarios de prueba de Progreso", () => {
	beforeEach(() => {
		latest = null;
		mockUseQuery.mockReset();
		mockUseQuery.mockReturnValue(undefined);
	});

	afterEach(async () => {
		await act(async () => {
			selectProgressScenario(null);
		});
		cleanup();
	});

	it("sin escenario sigue leyendo Convex: mientras no responde, carga", async () => {
		await render(<Probe />);
		expect(progress().status).toBe("loading");
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {});
	});

	it("con un escenario no consulta a Convex y entrega modelo listo", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("rachaSeis"));
		expect(progress().status).toBe("ready");
		for (const call of mockUseQuery.mock.calls.slice(-4)) {
			expect(call[1]).toBe("skip");
		}
	});

	it("Sin ciclos muestra el estado vacío", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("sinCiclos"));
		expect(progress().progress?.empty).toBe(true);
		expect(progress().progress?.closeEntry).toBeNull();
		expect(progress().close).toBeNull();
	});

	it("Primer cierre resalta la entrada y cuenta cuánto sobró", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("primerCierre"));
		const model = progress().progress;
		expect(model?.empty).toBe(false);
		expect(model?.streakLabel).toBe("1");
		expect(model?.closeEntry).toEqual({ label: "CICLO CERRADO · SETIEMBRE", highlighted: true });
		expect(progress().close?.title).toBe("Cerraste setiembre con S/ 400 de sobra.");
		expect(progress().close?.subtitle).toBe("Primer ciclo de la racha.");
	});

	it("Racha de 6 trae barras verdes, logros y la próxima recompensa", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("rachaSeis"));
		const model = progress().progress;
		expect(model?.streakLabel).toBe("6");
		expect(model?.bars.filter((bar) => bar.tone === "compliant")).toHaveLength(6);
		expect(model?.bars.at(-1)?.tone).toBe("current");
		expect(model?.achievements.filter((row) => row.done)).toHaveLength(3);
		expect(model?.rewardText).toBe("Informe anual a los 12 ciclos");
		expect(model?.closeEntry?.highlighted).toBe(false);
		expect(progress().close?.subtitle).toBe("6 ciclos seguidos.");
	});

	it("Racha rota mezcla verde, aviso y rojo, y no inventa un sobrante", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("rachaRota"));
		const model = progress().progress;
		expect(model?.streakLabel).toBe("0");
		expect(model?.bars.map((bar) => bar.tone)).toEqual([
			"compliant",
			"compliant",
			"warning",
			"compliant",
			"failed",
			"current",
		]);
		expect(progress().close?.title).toBe("Cerraste setiembre.");
		expect(progress().close?.surplusLabel).toBeNull();
		expect(progress().close?.subtitle).toBe("La racha vuelve a empezar.");
	});

	it("volver a «Datos reales» devuelve el control a Convex", async () => {
		await render(<Probe />);
		await act(async () => selectProgressScenario("rachaSeis"));
		await act(async () => selectProgressScenario(null));
		expect(progress().status).toBe("loading");
		expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), {});
	});

	it("el selector lista Datos reales y cada escenario, y cambia la selección", async () => {
		const view = await render(
			<>
				<ProgressPreviewPicker />
				<Probe />
			</>,
		);
		expect(view.getByText("Vista de prueba · solo desarrollo")).toBeTruthy();
		expect(view.getByTestId("progress-preview-live").props.accessibilityState.selected).toBe(true);
		for (const id of PROGRESS_SCENARIO_IDS) {
			expect(view.getByTestId(`progress-preview-${id}`)).toBeTruthy();
		}

		await fireEvent.press(view.getByTestId("progress-preview-rachaSeis"));
		expect(view.getByTestId("progress-preview-rachaSeis").props.accessibilityState.selected).toBe(
			true,
		);
		expect(view.getByTestId("progress-preview-live").props.accessibilityState.selected).toBe(false);
		expect(progress().progress?.streakLabel).toBe("6");
	});

	it("fuera de desarrollo no existe selector ni escenarios", async () => {
		const globals = globalThis as { __DEV__?: boolean };
		const original = globals.__DEV__;
		globals.__DEV__ = false;
		try {
			const view = await render(<ProgressPreviewPicker />);
			expect(view.queryByTestId("progress-preview-picker")).toBeNull();
			await render(<Probe />);
			expect(progress().status).toBe("loading");
		} finally {
			globals.__DEV__ = original;
		}
	});
});
