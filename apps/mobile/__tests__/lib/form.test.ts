import type { AnyFieldApi } from "@tanstack/react-form";
import { revalidateOnBlur, setFormError } from "@/shared/lib/form";

function makeFieldApi(meta: { isBlurred?: boolean; errors?: unknown[] }) {
	return {
		state: {
			meta: { isBlurred: meta.isBlurred ?? false, errors: meta.errors ?? [] },
		},
		validate: jest.fn(),
	} as unknown as AnyFieldApi & { validate: jest.Mock };
}

describe("revalidateOnBlur", () => {
	it("no valida si el campo nunca perdió foco y no tiene errores", () => {
		const fieldApi = makeFieldApi({});
		revalidateOnBlur({ fieldApi });
		expect(fieldApi.validate).not.toHaveBeenCalled();
	});

	it("re-valida con causa blur cuando el campo ya perdió foco", () => {
		const fieldApi = makeFieldApi({ isBlurred: true });
		revalidateOnBlur({ fieldApi });
		expect(fieldApi.validate).toHaveBeenCalledTimes(1);
		expect(fieldApi.validate).toHaveBeenCalledWith("blur");
	});

	it("re-valida cuando el campo ya tiene errores (post-submit)", () => {
		const fieldApi = makeFieldApi({ errors: ["obligatorio"] });
		revalidateOnBlur({ fieldApi });
		expect(fieldApi.validate).toHaveBeenCalledWith("blur");
	});
});

describe("setFormError", () => {
	it("setea el error global de submit en el errorMap del form", () => {
		const formApi = { setErrorMap: jest.fn() };
		setFormError(formApi, "Email o contraseña incorrectos");
		expect(formApi.setErrorMap).toHaveBeenCalledTimes(1);
		expect(formApi.setErrorMap).toHaveBeenCalledWith({
			onSubmit: { form: "Email o contraseña incorrectos", fields: {} },
		});
	});
});
