import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildPoseHtml } from "@/src/pose/poseHtml";
import { ensureMediapipeAssets } from "@/src/pose/mediapipeAssets";
import type { PoseCameraProps } from "@/src/pose/types";

// Native pose camera: MediaPipe runs inside a WebView. The app-level CAMERA
// permission (expo-camera) must already be granted; the WebView then receives
// the media permission automatically on Android, and via the grant type on iOS.
//
// The MediaPipe files are bundled into the app (assets/mediapipe/) and copied
// once onto the device's file system so the WebView can load them from a real
// file:// folder — no network needed, unlike the old jsdelivr/CDN URLs.
export function PoseCamera({ facing, onMessage }: PoseCameraProps) {
  const [assetDir, setAssetDir] = useState<string | null>(null);
  const ref = useRef<WebView>(null);

  useEffect(() => {
    let cancelled = false;
    ensureMediapipeAssets()
      .then((dir) => { if (!cancelled) setAssetDir(dir); })
      .catch((e) => onMessage(JSON.stringify({ type: "error", message: `Could not prepare the pose model files: ${e?.message || e}` })));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const html = useMemo(() => (assetDir ? buildPoseHtml(facing, assetDir) : null), [facing, assetDir]);

  if (!assetDir || !html) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Preparing pose model…</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <WebView
        ref={ref}
        style={styles.fill}
        source={{ html, baseUrl: assetDir }}
        originWhitelist={["*"]}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onMessage={(event) => onMessage(event.nativeEvent.data)}
        onError={(event) => onMessage(JSON.stringify({ type: "error", message: event.nativeEvent.description || "The pose view failed to load." }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#666" },
});
