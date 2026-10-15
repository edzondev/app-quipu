// Mocks oficiales de Worklets y Reanimated para Jest (módulos nativos).
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

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
}));

jest.mock("@expo/ui/community/datetime-picker", () => {
	const React = require("react");
	const { View } = require("react-native");
	function DateTimePicker(props) {
		return React.createElement(View, { ...props, testID: props.testID ?? "pay-date-picker" });
	}
	return { __esModule: true, default: DateTimePicker };
});
