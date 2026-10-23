/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	resolver: "<rootDir>/jest.config.resolver.js",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	moduleNameMapper: {
		"^react-native-keyboard-controller$": "react-native-keyboard-controller/jest",
		"^reicon-react-native/icons/(.*)$": "<rootDir>/__mocks__/reicon-icon.js",
		"^@/(.*)$": "<rootDir>/$1",
	},
	transformIgnorePatterns: [
		"node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))",
	],
};
