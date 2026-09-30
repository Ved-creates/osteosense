import "react-native-url-polyfill/auto";

if (!globalThis.URL) {
  const { URL, URLSearchParams } = require("react-native-url-polyfill");
  globalThis.URL = URL;
  globalThis.URLSearchParams = URLSearchParams;
}

// Expo Router app entry
import "expo-router/entry";
