const base = require("./app.base.json").expo;

module.exports = () => ({
  ...base,
  ios: {
    ...base.ios,
    ...(process.env.GOOGLE_MAPS_IOS_KEY
      ? { config: { googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY } }
      : {}),
  },
  android: {
    ...base.android,
    ...(process.env.GOOGLE_MAPS_ANDROID_KEY
      ? {
          config: {
            googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY },
          },
        }
      : {}),
  },
});
