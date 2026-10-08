function Icon() {
	return null;
}

module.exports = new Proxy(
	{ __esModule: true, default: Icon },
	{
		get(target, prop) {
			if (prop in target) return target[prop];
			return Icon;
		},
	},
);
