import type { AnyFieldApi } from "@tanstack/react-form";

// Re-ejecuta la validación onBlur en cada cambio tras el primer blur
// (o tras submit): limpia el mensaje en vivo sin molestar durante la
// primera escritura. Uso: <form.Field listeners={{ onChange: revalidateOnBlur }}>
export function revalidateOnBlur({ fieldApi }: { fieldApi: AnyFieldApi }) {
	if (fieldApi.state.meta.isBlurred || fieldApi.state.meta.errors.length > 0) {
		fieldApi.validate("blur");
	}
}

type FormApiWithSubmitError = {
	setErrorMap: (map: { onSubmit: { form: string; fields: Record<string, never> } }) => void;
};

export function setFormError(formApi: FormApiWithSubmitError, message: string) {
	formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
}

export function formErrorMessage(error: unknown): string | null {
	if (typeof error === "string" && error.length > 0) return error;
	if (!error || typeof error !== "object" || !("form" in error)) return null;
	if (typeof error.form !== "string" || error.form.length === 0) return null;
	return error.form;
}
