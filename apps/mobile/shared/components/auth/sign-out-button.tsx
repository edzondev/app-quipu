import { useState } from "react";
import { Pressable, Text } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
	const [error, setError] = useState(false);

	const handleSignOut = async () => {
		try {
			setError(false);
			await authClient.signOut();
		} catch {
			setError(true);
			setTimeout(() => setError(false), 2000);
		}
	};

	return (
		<Pressable hitSlop={12} onPress={() => void handleSignOut()}>
			<Text
				className={`font-hanken-semibold text-[12px] ${
					error ? "text-red-500" : "text-foreground/45"
				}`}
			>
				{error ? "No se pudo cerrar sesión" : "Salir"}
			</Text>
		</Pressable>
	);
}
