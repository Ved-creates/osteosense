import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDate } from "@/src/assessment/format";
import { formatMetric } from "@/src/assessment/metrics";
import { buildAssessmentReportHtml } from "@/src/assessment/report";
import { makeStyles, useTheme } from "@/src/theme";
import type { Assessment } from "@/src/types/assessment";
import { getAssessment } from "@/src/utils/storage/assessmentStorage";

export default function RiskResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { assessmentId } = useLocalSearchParams<{ assessmentId?: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setLoaded(true);
      return;
    }
    getAssessment(assessmentId).then((record) => {
      setAssessment(record);
      setLoaded(true);
    });
  }, [assessmentId]);

  const exportPdf = async () => {
    if (!assessment) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const file = await Print.printToFileAsync({ html: buildAssessmentReportHtml(assessment) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        setPdfError(`PDF created at ${file.uri}, but sharing is unavailable on this device.`);
      }
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Could not create the PDF report.");
    } finally {
      setPdfBusy(false);
    }
  };

  const left = assessment?.manualSensorData?.left;
  const right = assessment?.manualSensorData?.right;

  return (
    <View style={styles.screen} testID="risk-result-screen">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to assessment results">
            <Ionicons name="arrow-back" size={21} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.stepLabel}>SCREENING REPORT</Text>
        </View>

        {!loaded ? (
          <View style={styles.loading}><ActivityIndicator color={colors.brandPrimary} /></View>
        ) : !assessment ? (
          <Text style={styles.muted}>This assessment could not be found on this device.</Text>
        ) : (
          <>
            <Text style={styles.patientName}>{assessment.patientName || assessment.patientId}</Text>
            <Text style={styles.date}>{formatDate(assessment.createdAt)} · {assessment.bodyRegion || "Movement screening"}</Text>

            <View style={styles.riskPanel} testID="demo-risk-result">
              <View style={styles.riskHeading}>
                <Text style={styles.riskEyebrow}>DEMO SCREENING STATUS</Text>
                <Text style={styles.demoTag}>NOT CLINICAL</Text>
              </View>
              <Text style={styles.riskLabel}>NO RISK</Text>
              <Text style={styles.riskPercent}>{assessment.demoRisk?.percentage ?? 10}%</Text>
              <Text style={styles.riskDisclaimer}>Fixed demo placeholder only. This status is not computed from the screening data and cannot establish that a person has no osteoarthritis risk.</Text>
            </View>

            <Text style={styles.sectionTitle}>CAMERA · KNEE MOVEMENT</Text>
            <View style={styles.dataTable}>
              <DataRow label="Left knee angle ROM" value={formatMetric(assessment.cameraFeatures.leftKneeRomDeg, "°")} />
              <DataRow label="Right knee angle ROM" value={formatMetric(assessment.cameraFeatures.rightKneeRomDeg, "°")} />
              <DataRow label="Combined knee ROM" value={formatMetric(assessment.cameraFeatures.kneeRomDeg, "°")} />
              <DataRow label="Repetitions" value={formatMetric(assessment.cameraFeatures.repetitions, "")} />
              <DataRow label="Camera quality" value={assessment.quality.state} last />
            </View>

            <Text style={styles.sectionTitle}>PRESSURE · FSR</Text>
            <View style={styles.dataTable}>
              {left ? <>
                <DataRow label="Left leg · FSR 1" value={`${left.pressureFsr1Mv} mV`} />
                <DataRow label="Left leg · FSR 2" value={`${left.pressureFsr2Mv} mV`} />
              </> : <DataRow label="Left leg" value="No sensor value entered" />}
              {right ? <>
                <DataRow label="Right leg · FSR 3" value={`${right.pressureFsr1Mv} mV`} />
                <DataRow label="Right leg · FSR 4" value={`${right.pressureFsr2Mv} mV`} last />
              </> : <DataRow label="Right leg" value="No sensor value entered" last />}
            </View>

            <Text style={styles.sectionTitle}>IMU · ACCELEROMETER AND GYROSCOPE</Text>
            <View style={styles.dataTable}>
              <ImuRows side="Left" data={left} />
              <ImuRows side="Right" data={right} />
            </View>
            {assessment.manualSensorData ? <Text style={styles.manualNote}>Sensor readings are manually entered demo values, not verified ESP32 measurements.</Text> : null}

            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={17} color={colors.brandPrimary} />
              <Text style={styles.noticeText}>This screening summary is for demonstration only. It is not a diagnosis and the fixed “NO RISK” label is not a medical conclusion. Ask a qualified healthcare professional to interpret symptoms and measurements.</Text>
            </View>

            {pdfError ? <Text style={styles.error}>{pdfError}</Text> : null}
            <Pressable onPress={exportPdf} disabled={pdfBusy} testID="risk-export-pdf-button" accessibilityRole="button" style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, pdfBusy && styles.disabled]}>
              {pdfBusy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Ionicons name="document-text-outline" size={19} color={colors.onBrandPrimary} />}
              <Text style={styles.exportText}>{pdfBusy ? "CREATING PDF…" : "EXPORT PDF REPORT"}</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/osteocare")} testID="risk-osteocare-button" accessibilityRole="button" style={({ pressed }) => [styles.osteocareButton, pressed && styles.pressed]}>
              <Ionicons name="leaf-outline" size={19} color={colors.success} />
              <Text style={styles.osteocareText}>OPEN THE OSTEOCARE DAILY GUIDE</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.success} />
            </Pressable>
            <Pressable onPress={() => router.replace("/")} style={styles.homeButton} accessibilityRole="button" testID="risk-back-home-button">
              <Text style={styles.homeText}>BACK TO HOME</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DataRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.dataRow, last && styles.dataRowLast]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function ImuRows({ side, data }: { side: "Left" | "Right"; data?: NonNullable<Assessment["manualSensorData"]>["left"] }) {
  if (!data) return <DataRow label={`${side} leg IMU`} value="No sensor values entered" last={side === "Right"} />;
  return <>
    <DataRow label={`${side} accelerometer · X / Y / Z`} value={`${data.accelXG}, ${data.accelYG}, ${data.accelZG} g`} />
    <DataRow label={`${side} gyroscope · X / Y / Z`} value={`${data.gyroXDps}, ${data.gyroYDps}, ${data.gyroZDps} deg/s`} last={side === "Right"} />
  </>;
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  topBar: { minHeight: 44, flexDirection: "row", alignItems: "center" },
  backButton: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  stepLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.muted, fontSize: 14, marginTop: 24 },
  patientName: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 27, marginTop: 22 },
  date: { color: colors.muted, fontSize: 13, marginTop: 6 },
  riskPanel: { marginTop: 24, padding: 20, borderWidth: 1, borderColor: colors.warning, borderRadius: 10, backgroundColor: colors.surfaceSecondary },
  riskHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  riskEyebrow: { color: colors.onSurfaceSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  demoTag: { color: colors.onWarning, fontSize: 9, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: colors.warning },
  riskLabel: { color: colors.success, fontFamily: "Georgia", fontSize: 40, fontWeight: "800", marginTop: 12 },
  riskPercent: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 32, marginTop: 0 },
  riskDisclaimer: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  sectionTitle: { color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 26, marginBottom: 9 },
  dataTable: { paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  dataRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  dataRowLast: { borderBottomWidth: 0 },
  dataLabel: { flex: 1, color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 17 },
  dataValue: { maxWidth: "48%", color: colors.onSurface, fontSize: 12, lineHeight: 17, textAlign: "right", fontWeight: "700", fontVariant: ["tabular-nums"] },
  manualNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 22, padding: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  noticeText: { flex: 1, color: colors.onSurfaceSecondary, fontSize: 11, lineHeight: 17 },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 12 },
  exportButton: { minHeight: 54, marginTop: 24, borderRadius: 9, backgroundColor: colors.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  exportText: { color: colors.onBrandPrimary, fontSize: 13, fontWeight: "800", letterSpacing: 0.8 },
  osteocareButton: { minHeight: 54, marginTop: 11, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  osteocareText: { flex: 1, color: colors.onSurface, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  homeButton: { minHeight: 50, marginTop: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  homeText: { color: colors.onSurface, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.6 },
}));
