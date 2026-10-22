/** Opciones compartidas de Stacks anidados en tabs (Plan, Progreso). */
export function tabStackScreenOptions(backgroundColor: string) {
	return {
		headerShown: false,
		contentStyle: {
			flex: 1,
			backgroundColor,
		},
	};
}
