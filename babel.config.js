module.exports = function (api) {
  api.cache(true);
  // SDK 57 configures Reanimated/Worklets through babel-preset-expo.
  // The passenger screen uses inline styles; the old NativeWind v2 transform
  // is intentionally disabled for this isolated iPhone preview.
  return {
    presets: ["babel-preset-expo"],
  };
};
