jest.mock("@/widgets/SpendableToday", () => ({
	updateSpendableWidget: jest.fn(),
}));

jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));
require("react-native-reanimated").setUpTests();

// Los tests suelen mockear expo-router entero sin useFocusEffect.
// Este wrapper se mockea una vez y el hook de atrás nativo sigue funcionando.
jest.mock("@/shared/navigation/use-focus-effect", () => {
	const React = require("react");
	return {
		useFocusEffect: (callback) => {
			React.useEffect(() => {
				const cleanup = callback();
				return typeof cleanup === "function" ? cleanup : undefined;
			}, [callback]);
		},
	};
});

// uniwind publica ESM; en Jest solo hace falta dejar pasar el componente.
jest.mock("uniwind", () => ({
	withUniwind: (Component) => Component,
	useCSSVariable: (name) =>
		Array.isArray(name) ? name.map(() => "oklch(0.5 0 0)") : "oklch(0.5 0 0)",
	useResolveClassNames: () => ({ color: "oklch(0.5 0 0 / 0.45)" }),
}));

jest.mock("@expo/ui/community/datetime-picker", () => {
	const React = require("react");
	const { View } = require("react-native");
	function DateTimePicker(props) {
		return React.createElement(View, { ...props, testID: props.testID ?? "pay-date-picker" });
	}
	return { __esModule: true, default: DateTimePicker };
});
