import type { AnyFieldApi } from "@tanstack/react-form";
import { render } from "@testing-library/react-native";
import FieldError from "@/shared/components/auth/field-error";

function makeField(errors: unknown[]) {
	return { state: { meta: { errors } } } as unknown as AnyFieldApi;
}

describe("FieldError", () => {
	it("no renderiza nada sin errores", async () => {
		const { toJSON } = await render(<FieldError field={makeField([])} />);
		expect(toJSON()).toBeNull();
	});

	it("renderiza el mensaje cuando el error es string", async () => {
		const { getByText } = await render(
			<FieldError field={makeField(["El email es obligatorio"])} />,
		);
		expect(getByText("El email es obligatorio")).toBeTruthy();
	});

	it("extrae .message de errores tipo Standard Schema issue", async () => {
		const { getByText } = await render(
			<FieldError field={makeField([{ message: "Email inválido" }])} />,
		);
		expect(getByText("Email inválido")).toBeTruthy();
	});

	it("une múltiples errores con coma y descarta los vacíos", async () => {
		const { getByText } = await render(
			<FieldError field={makeField(["uno", { message: "dos" }, ""])} />,
		);
		expect(getByText("uno, dos")).toBeTruthy();
	});
});
