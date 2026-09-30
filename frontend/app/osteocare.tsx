import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, useTheme } from "@/src/theme";

type GuideTab = "food" | "move" | "ease";

const TABS: { id: GuideTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "food", label: "NOURISH", icon: "leaf-outline" },
  { id: "move", label: "MOVE", icon: "walk-outline" },
  { id: "ease", label: "EASE", icon: "hand-left-outline" },
];

export default function Osteocare() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<GuideTab>("food");

  return (
    <View style={styles.screen} testID="osteocare-screen">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={21} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.topLabel}>OSTEOCARE · DAILY GUIDE</Text>
        </View>

        <Text style={styles.eyebrow}>SMALL STEPS, STEADY DAYS</Text>
        <Text style={styles.title}>{"Care for the\nlong game."}</Text>
        <Text style={styles.intro}>A simple starting point for nourishing your body, keeping gently active, and finding moments of ease.</Text>

        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="sunny-outline" size={22} color={colors.onSurfaceInverse} />
          </View>
          <View style={styles.featureCopy}>
            <Text style={styles.featureLabel}>A KINDER ROUTINE</Text>
            <Text style={styles.featureText}>Choose one small thing today. Consistency can matter more than intensity.</Text>
          </View>
          <Text style={styles.featureMark}>01</Text>
        </View>

        <View style={styles.tabBar} accessibilityRole="tablist">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}
              >
                <Ionicons name={tab.icon} size={17} color={selected ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "food" ? <FoodGuide /> : activeTab === "move" ? <MovementGuide /> : <EaseGuide />}

        <View style={styles.clinicalNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.clinicalNoteText}>This is general education, not a personalized treatment plan. A clinician or registered dietitian can tailor advice to your health, medicines, and needs.</Text>
        </View>

        <Pressable onPress={() => router.replace("/")} style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]} accessibilityRole="button">
          <Ionicons name="home-outline" size={18} color={colors.onBrandPrimary} />
          <Text style={styles.homeButtonText}>BACK TO HOME</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FoodGuide() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID="osteocare-food-guide">
      <GuideHeading kicker="NOURISH" title="Build from the plate." description="Aim for a varied, balanced pattern. No single food or vitamin is an osteoarthritis cure." />
      <GuideRow number="A" title="Calcium-rich choices" detail="Yogurt, milk or fortified alternatives, calcium-set tofu, and some leafy greens support everyday bone nutrition." />
      <GuideRow number="B" title="Vitamin D sources" detail="Oily fish, egg yolks, and fortified foods can contribute. Sun exposure and vitamin D needs vary by person and place." />
      <GuideRow number="C" title="Protein through the day" detail="Beans, lentils, eggs, fish, dairy, tofu, or nuts can help make meals satisfying and support muscle." />
      <GuideRow number="D" title="Add color and fiber" detail="Fruit, vegetables, whole grains, and pulses bring variety and useful fiber to meals." last />
      <View style={styles.tip}>
        <Ionicons name="medical-outline" size={18} color={colors.warning} />
        <Text style={styles.tipText}>Food first. Supplements are not a replacement for treatment; ask a clinician or pharmacist before starting them, especially if you take medicines.</Text>
      </View>
    </View>
  );
}

function MovementGuide() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID="osteocare-movement-guide">
      <GuideHeading kicker="MOVE" title="Easy does it." description="Try a short, comfortable starter set near a sturdy chair. Begin with one round and take your time." />
      <GuideRow number="01" title="Warm up · 3 minutes" detail="Walk slowly indoors or march gently on the spot. Keep a chair or counter within reach." />
      <GuideRow number="02" title="Chair stands · 5 repetitions" detail="From a firm chair, lean forward and stand using your hands for support if needed. Sit down slowly." />
      <GuideRow number="03" title="Seated knee straightening · 6 each side" detail="Sit tall, slowly straighten one knee, pause briefly, then lower. Stay in a comfortable range." />
      <GuideRow number="04" title="Heel raises · 8 repetitions" detail="Hold a counter, rise gently onto your toes, then lower with control. Keep your weight even." last />
      <View style={styles.tip}>
        <Ionicons name="pause-circle-outline" size={18} color={colors.warning} />
        <Text style={styles.tipText}>Stop for sharp or increasing pain, dizziness, or new swelling. If symptoms linger or you have a recent injury or surgery, check with a clinician or physiotherapist first.</Text>
      </View>
    </View>
  );
}

function EaseGuide() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID="osteocare-ease-guide">
      <GuideHeading kicker="EASE" title="A softer reset." description="If it feels pleasant, try a brief hand massage around—not on—the knee joint." />
      <GuideRow number="01" title="Settle in" detail="Sit comfortably and let your leg rest. Use clean hands and a light touch." />
      <GuideRow number="02" title="Try gentle circles" detail="With fingertips, make small circles over the front thigh above the kneecap, then over the upper calf. Avoid the kneecap and the hollow behind the knee." />
      <GuideRow number="03" title="Keep it comfortable" detail="Use light pressure for about 20 seconds per area. It should not hurt, tingle, or leave marks; stop if it does." last />
      <View style={styles.tip}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
        <Text style={styles.tipText}>Evidence that acupressure relieves osteoarthritis symptoms is limited. Avoid massage over a hot or swollen area, broken skin, or a recent injury; ask a clinician if unsure.</Text>
      </View>
    </View>
  );
}

function GuideHeading({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  const styles = useStyles();
  return (
    <View style={styles.guideHeading}>
      <Text style={styles.guideKicker}>{kicker} / YOUR FIELD NOTES</Text>
      <Text style={styles.guideTitle}>{title}</Text>
      <Text style={styles.guideDescription}>{description}</Text>
    </View>
  );
}

function GuideRow({ number, title, detail, last = false }: { number: string; title: string; detail: string; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.guideRow, last && styles.guideRowLast]}>
      <Text style={styles.rowNumber}>{number}</Text>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  topBar: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 5 },
  backButton: { width: 40, height: 44, justifyContent: "center" },
  topLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  eyebrow: { color: colors.success, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 24 },
  title: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 36, lineHeight: 41, marginTop: 9 },
  intro: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 23, marginTop: 12 },
  feature: { minHeight: 112, flexDirection: "row", alignItems: "center", gap: 13, marginTop: 23, padding: 16, borderRadius: 8, backgroundColor: colors.surfaceInverse },
  featureIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: colors.success },
  featureCopy: { flex: 1 },
  featureLabel: { color: colors.brandTertiary, fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  featureText: { color: colors.onSurfaceInverse, fontSize: 13, lineHeight: 19, marginTop: 5 },
  featureMark: { alignSelf: "flex-start", color: colors.brandTertiary, fontFamily: "Georgia", fontSize: 16 },
  tabBar: { flexDirection: "row", gap: 6, marginTop: 25, padding: 5, borderRadius: 8, backgroundColor: colors.surfaceTertiary },
  tab: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 6 },
  tabSelected: { backgroundColor: colors.brandPrimary },
  tabText: { color: colors.onSurfaceSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  tabTextSelected: { color: colors.onBrandPrimary },
  guideHeading: { marginTop: 28, marginBottom: 8 },
  guideKicker: { color: colors.brandPrimary, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  guideTitle: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 25, marginTop: 8 },
  guideDescription: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20, marginTop: 7 },
  guideRow: { minHeight: 83, flexDirection: "row", gap: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.divider },
  guideRowLast: { borderBottomWidth: 0 },
  rowNumber: { width: 27, color: colors.success, fontFamily: "Georgia", fontSize: 15, paddingTop: 1 },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  rowDetail: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 12, padding: 13, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  tipText: { flex: 1, color: colors.onSurfaceSecondary, fontSize: 11, lineHeight: 17 },
  clinicalNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  clinicalNoteText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 17 },
  homeButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 22, borderRadius: 8, backgroundColor: colors.brandPrimary },
  homeButtonText: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  pressed: { opacity: 0.78 },
}));