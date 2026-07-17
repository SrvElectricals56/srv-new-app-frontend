const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Defer module evaluation until a screen actually needs it. This reduces
// startup work without changing navigation or data-loading behaviour.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Resolve '@/*' path alias to './src/*' — matches tsconfig and babel config
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
