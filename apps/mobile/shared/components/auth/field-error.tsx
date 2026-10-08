import type { AnyFieldApi } from "@tanstack/react-form";
import { Text } from "react-native";

export default function FieldError({ field }: { field: AnyFieldApi }) {
	const errors = field.state.meta.errors;
	if (!errors?.length) return null;
	const message = errors
		.map((error) => {
			if (typeof error === "string") return error;
			if (error && typeof error === "object" && "message" in error) {
				return error.message;
			}
			return "";
		})
		.filter(Boolean)
		.join(", ");
	if (!message) return null;
	return <Text className="font-hanken text-[12px] text-danger">{message}</Text>;
}
