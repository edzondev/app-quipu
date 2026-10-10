import { render } from "@testing-library/react-native";
import AuthButton from "@/shared/components/auth/auth-button";

describe("AuthButton", () => {
	it("pone testID en el botón", async () => {
		const view = await render(
			<AuthButton label="Entrar" onPress={() => undefined} testID="sign-in-submit" />,
		);
		expect(view.getByTestId("sign-in-submit").props.accessibilityLabel).toBe("Entrar");
	});
});
