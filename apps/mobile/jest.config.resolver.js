const path = require("node:path");

const WEB_ONLY_IN_JEST = new Set([
	"initializers",
	"mutables",
	"mappers",
	"ConfigHelper",
	"UpdateLayoutAnimations",
	"useAnimatedRef",
	"useAnimatedStyle",
	"WorkletEventHandler",
	"JSPropsUpdater",
	"updateProps",
	"util",
	"css/component/AnimatedComponent",
]);

const WORKLETS_DIR = /[\\/]react-native-worklets[\\/](src|lib)[\\/]/;

function withoutNativeExtensions(extensions) {
	return extensions?.filter((extension) => !extension.includes("native"));
}

function isWebOnlyInJest(request) {
	const basename = request.split("/").pop();
	return [...WEB_ONLY_IN_JEST].some((entry) =>
		entry.includes("/") ? request.endsWith(entry) : basename === entry,
	);
}

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
	const { defaultResolver } = options;

	if (
		request.startsWith(".") &&
		isWebOnlyInJest(request) &&
		options.basedir.includes("react-native-reanimated")
	) {
		return defaultResolver(request, {
			...options,
			extensions: withoutNativeExtensions(options.extensions),
		});
	}

	const resolvesWorklets =
		WORKLETS_DIR.test(options.basedir + path.sep) ||
		request === "react-native-worklets" ||
		request.startsWith("react-native-worklets/");

	if (!resolvesWorklets) {
		return defaultResolver(request, options);
	}

	return defaultResolver(request, {
		...options,
		extensions: withoutNativeExtensions(options.extensions),
	});
};
