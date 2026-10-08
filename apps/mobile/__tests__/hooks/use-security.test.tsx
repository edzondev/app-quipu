import { act, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { useSecurity } from "@/shared/hooks/use-security";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseConvexAuth = jest.fn();
const mockUseSession = jest.fn();
const mockSignOut = jest.fn();
const mockAddPasskey = jest.fn();
const mockDeletePasskey = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
	useConvexAuth: () => mockUseConvexAuth(),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => mockUseSession(),
		signOut: (...args: unknown[]) => mockSignOut(...args),
		passkey: {
			addPasskey: (...args: unknown[]) => mockAddPasskey(...args),
			deletePasskey: (...args: unknown[]) => mockDeletePasskey(...args),
		},
	},
}));

const revokeSessionMock = jest.fn();
const revokeAllMock = jest.fn();

function queryName(query: unknown): string {
	return getFunctionName(query as Parameters<typeof getFunctionName>[0]);
}

let security: ReturnType<typeof useSecurity> | null = null;

function Host() {
	security = useSecurity();
	return null;
}

describe("useSecurity", () => {
	beforeEach(async () => {
		jest.clearAllMocks();
		mockUseSession.mockReturnValue({ isPending: false });
		mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseQuery.mockImplementation((query: unknown, args: unknown) => {
			if (args === "skip") return undefined;
			const name = queryName(query);
			if (name === "profiles:getMyProfile") return { name: "Edzon" };
			if (name === "settings:listMyPasskeys")
				return { passkeys: [], passkeysSource: "better_auth" };
			if (name === "settings:listMySessions") return { sessions: [], apiReady: true };
			if (name === "settings:getSettingsOverview") {
				return { security: { hasPassword: true, emailVerified: true } };
			}
			return null;
		});
		mockUseMutation.mockImplementation((mutation: unknown) => {
			const name = queryName(mutation);
			if (name === "settings:revokeMySession") return revokeSessionMock;
			if (name === "settings:revokeAllSessions") return revokeAllMock;
			throw new Error(`useMutation inesperado: ${name}`);
		});
		revokeAllMock.mockResolvedValue({ success: true });
		mockSignOut.mockResolvedValue({ data: { success: true }, error: null });
		mockAddPasskey.mockResolvedValue({ data: { id: "pk" }, error: null });
		mockDeletePasskey.mockResolvedValue({ data: { success: true }, error: null });
		security = null;
		await render(<Host />);
	});

	it("cerrar todas llama a revokeAllSessions y después a signOut", async () => {
		const order: string[] = [];
		revokeAllMock.mockImplementation(async () => {
			order.push("revoke");
			return { success: true };
		});
		mockSignOut.mockImplementation(async () => {
			order.push("signOut");
			return { error: null };
		});
		await act(async () => {
			await security?.revokeAllAndSignOut();
		});
		expect(revokeAllMock).toHaveBeenCalledWith({});
		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(order).toEqual(["revoke", "signOut"]);
	});

	it("no hace signOut si revokeAllSessions falla", async () => {
		revokeAllMock.mockRejectedValue(new Error("red"));
		await expect(security?.revokeAllAndSignOut()).rejects.toThrow("red");
		expect(mockSignOut).not.toHaveBeenCalled();
	});

	it("agrega sin name y borra por id, sin propagar el error de auth", async () => {
		await act(async () => {
			await security?.addPasskey();
			await security?.deletePasskey("pk-1");
		});
		expect(mockAddPasskey).toHaveBeenCalledTimes(1);
		expect(mockAddPasskey.mock.calls[0]).toEqual([]);
		expect(mockDeletePasskey).toHaveBeenCalledWith({ id: "pk-1" });

		mockAddPasskey.mockResolvedValue({ error: { message: "token secreto de sesión" } });
		await expect(security?.addPasskey()).rejects.toThrow(
			"No pudimos agregar la Passkey. Intenta de nuevo.",
		);
		await expect(security?.addPasskey()).rejects.not.toThrow(/token|sesión/);
	});
});
