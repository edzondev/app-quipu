import { cleanup, render } from "@testing-library/react-native";
import { closeReport } from "@/__fixtures__/progress";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import ClosePage from "@/app/(tabs)/savings/cierre";
import { presentClose } from "@/shared/lib/progress/model";

// Any Convex read answers with a non-zero surplus, so a re-added card would show up.
const mockUseQuery = jest.fn(() => ({
	needs: 10000,
	wants: 6000,
	extraordinary: 5000,
	total: 21000,
	movedAt: null,
}));

const mockClose = presentClose(closeReport, savingsOverview);

jest.mock("convex/react", () => ({ useQuery: () => mockUseQuery() }));
jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));
jest.mock("@/shared/hooks/use-progress", () => ({
	useProgress: () => ({ status: "ready", close: mockClose }),
}));

describe("cierre", () => {
	afterEach(() => {
		cleanup();
	});

	it("muestra cuánto sobró sin la tarjeta SOBRANTE", async () => {
		const view = await render(<ClosePage />);

		expect(view.getByText("SOBRÓ S/ 210")).toBeTruthy();
		expect(view.queryByText("SOBRANTE")).toBeNull();
		expect(view.getAllByText("Necesidades")).toHaveLength(1);
		expect(mockUseQuery).not.toHaveBeenCalled();
	});
});
