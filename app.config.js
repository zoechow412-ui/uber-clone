const base = require("./app.base.json").expo;

if (
  process.env.APP_ENV === "production" &&
  !/^https:\/\/[^\s/]+/.test(process.env.EXPO_PUBLIC_PASSENGER_API_URL || "")
) {
  throw new Error("正式 iOS 建置必須設定 HTTPS EXPO_PUBLIC_PASSENGER_API_URL");
}

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
