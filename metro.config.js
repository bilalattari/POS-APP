const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Wrap default Metro config with Reanimated Metro Config
const reanimatedConfig = wrapWithReanimatedMetroConfig(defaultConfig);

// Merge configurations properly
const finalConfig = mergeConfig(reanimatedConfig, {});

module.exports = finalConfig;
