import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";
import FieldError from "@/shared/components/auth/field-error";

type AuthLabeledFieldProps = {
	label: string;
	field: AnyFieldApi;
	error?: ReactNode;
	labelTrailing?: ReactNode;
} & Omit<TextInputProps, "value" | "onChangeText" | "onBlur">;

export function AuthLabeledField({
	label,
	field,
	error,
	labelTrailing,
	...input
}: AuthLabeledFieldProps) {
	return (
		<View className="gap-1">
			<View className="flex-row items-center justify-between">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55 uppercase">
					{label}
				</Text>
				{labelTrailing}
			</View>
			<TextInput
				value={field.state.value}
				onChangeText={field.handleChange}
				onBlur={field.handleBlur}
				accessibilityLabel={label}
				className="border-b border-line py-2.5 font-hanken text-[17px] text-foreground"
				{...input}
			/>
			{error ?? <FieldError field={field} />}
		</View>
	);
}
