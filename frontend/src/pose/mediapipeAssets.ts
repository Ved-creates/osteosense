// Copies the MediaPipe pose-detection files (bundled inside the app via
// public/mediapipe/) onto the device's local file system, once, so the
// native WebView can load them from disk instead of a CDN.
//
// Why this is needed: the WebView in PoseCamera.tsx loads a page of raw
// HTML with no real server behind it. A relative or root path like
// "/mediapipe/..." has nothing to resolve against there. Giving the
// WebView a real file:// folder as its baseUrl fixes that.
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

export const MEDIAPIPE_DIR = `${FileSystem.documentDirectory}mediapipe/`;

// relative path (on-device destination) -> function that returns the bundled
// module. Wrapped in functions (instead of a plain object built at import
// time) so nothing under here actually runs until ensureMediapipeAssets() is
// called — Expo Router eagerly imports every app/*.tsx file at boot to build
// its route table, which would otherwise trigger these requires (and whatever
// asset-URL resolution they kick off) before the app has even rendered a
// screen.
//
// Note: the three wasm "loader" .js files are required via a renamed .jsasset
// extension so Metro treats them as opaque assets instead of trying to parse
// them as JS source — they contain Node-only fallback code (require("node:fs"))
// that Metro's static resolver chokes on even though it never runs here. The
// destination filename is put back to the original .js name below, since
// that's the name vision_bundle.mjs actually fetches at runtime in the WebView.
const FILE_LOADERS: Record<string, () => number> = {
  "vision_bundle.mjs": () => require("../../assets/mediapipe/vision_bundle.mjsasset"),
  "wasm/vision_wasm_internal.js": () => require("../../assets/mediapipe/wasm/vision_wasm_internal.jsasset"),
  "wasm/vision_wasm_internal.wasm": () => require("../../assets/mediapipe/wasm/vision_wasm_internal.wasm"),
  "wasm/vision_wasm_module_internal.js": () => require("../../assets/mediapipe/wasm/vision_wasm_module_internal.jsasset"),
  "wasm/vision_wasm_module_internal.wasm": () => require("../../assets/mediapipe/wasm/vision_wasm_module_internal.wasm"),
  "wasm/vision_wasm_nosimd_internal.js": () => require("../../assets/mediapipe/wasm/vision_wasm_nosimd_internal.jsasset"),
  "wasm/vision_wasm_nosimd_internal.wasm": () => require("../../assets/mediapipe/wasm/vision_wasm_nosimd_internal.wasm"),
  "model/pose_landmarker_lite.task": () => require("../../assets/mediapipe/model/pose_landmarker_lite.task"),
};

let cached: Promise<string> | null = null;

// Copies every file in FILES into MEDIAPIPE_DIR (only if not already done),
// preserving the wasm/ and model/ sub-folders so the relative imports
// inside vision_bundle.mjs keep working. Returns the local folder path
// (with a trailing slash) to use as the WebView's baseUrl.
export function ensureMediapipeAssets(): Promise<string> {
  if (!cached) {
    cached = (async () => {
      const marker = `${MEDIAPIPE_DIR}.ready`;
      const markerInfo = await FileSystem.getInfoAsync(marker);
      if (!markerInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${MEDIAPIPE_DIR}wasm`, { intermediates: true });
        await FileSystem.makeDirectoryAsync(`${MEDIAPIPE_DIR}model`, { intermediates: true });

        for (const [relPath, loadModule] of Object.entries(FILE_LOADERS)) {
          const asset = Asset.fromModule(loadModule());
          await asset.downloadAsync();
          const dest = MEDIAPIPE_DIR + relPath;
          const destInfo = await FileSystem.getInfoAsync(dest);
          if (!destInfo.exists) {
            await FileSystem.copyAsync({ from: asset.localUri ?? asset.uri, to: dest });
          }
        }
        await FileSystem.writeAsStringAsync(marker, "ok");
      }
      return MEDIAPIPE_DIR;
    })();
  }
  return cached;
}
