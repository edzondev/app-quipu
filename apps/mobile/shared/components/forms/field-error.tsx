import { Text } from "react-native";

export function FieldError({ error }: { error: unknown }) {
	if (typeof error !== "string" || !error) return null;
	return <ErrorText message={error} />;
}

export function ErrorText({ message }: { message: string }) {
	return <Text className="mt-2 font-hanken text-[13px] text-danger">{message}</Text>;
}
