const mockClear = jest.fn();

jest.mock("@/lib/device-sign-out", () => ({
	signOutAndClearLocalData: (action: "pause" | "clear") => mockClear(action),
}));

import { clearDeviceAfterAccountDeleted } from "@/lib/clear-device-after-delete";

describe("clearDeviceAfterAccountDeleted", () => {
	it("limpia el teléfono y no usa serverNotified", async () => {
		mockClear.mockResolvedValue({ serverNotified: false });
		await expect(clearDeviceAfterAccountDeleted()).resolves.toBeUndefined();
		expect(mockClear).toHaveBeenCalledWith("clear");
	});
});
