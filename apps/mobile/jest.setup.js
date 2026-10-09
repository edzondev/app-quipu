// Mocks oficiales de Worklets y Reanimated para Jest (módulos nativos).
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// uniwind publica ESM; en Jest solo hace falta dejar pasar el componente.
jest.mock("uniwind", () => ({
	withUniwind: (Component) => Component,
}));
