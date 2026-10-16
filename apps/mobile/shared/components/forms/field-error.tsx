import type { AnyFieldApi } from "@tanstack/react-form";
import { Text } from "react-native";

export function FieldError({ error, field }: { error?: unknown; field?: AnyFieldApi }) {
	if (field) {
		const errors = field.state.meta.errors;
		if (!errors?.length) return null;
		const message = errors
			.map((item) => {
				if (typeof item === "string") return item;
				if (item && typeof item === "object" && "message" in item) {
					return item.message;
				}
				return "";
			})
			.filter(Boolean)
			.join(", ");
		if (!message) return null;
		return <ErrorText message={message} />;
	}
	if (typeof error !== "string" || !error) return null;
	return <ErrorText message={error} />;
}

export function ErrorText({ message }: { message: string }) {
	return <Text className="mt-2 font-hanken text-[13px] text-danger">{message}</Text>;
}
