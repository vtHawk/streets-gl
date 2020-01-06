let config = {
	drawDistance: 3000,
	textureAnisotropy: undefined,
	SSAA: 2
};

config.set = function (key, value, force) {
	if(config[key] === undefined || force)
		config[key] = value;
};

export default config;