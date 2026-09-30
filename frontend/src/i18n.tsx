import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export type SupportedLanguage = "en" | "hi";

type TranslationKey =
  | "offlineMovementScreening"
  | "oaRiskDetector"
  | "movementScreeningAndAssessment"
  | "newAssessment"
  | "beginWithPatientDetails"
  | "patients"
  | "history"
  | "settings"
  | "systemStatus"
  | "onThisDevice"
  | "camera"
  | "ready"
  | "permissionDenied"
  | "notYetAllowed"
  | "poseDetection"
  | "localStorage"
  | "model"
  | "patientInformationStaysHere"
  | "patientDetails"
  | "recordThePersonBeingAssessed"
  | "identification"
  | "patientId"
  | "leaveBlankToGenerate"
  | "name"
  | "fullName"
  | "basicMeasurements"
  | "age"
  | "years"
  | "sex"
  | "selectBelow"
  | "height"
  | "cm"
  | "weight"
  | "kg"
  | "bodyRegion"
  | "areaBeingAssessed"
  | "patientSavedLocally"
  | "patientCouldNotBeSaved"
  | "continueToQuestionnaire"
  | "continue"
  | "generateIfBlank"
  | "enterPatientName"
  | "enterAgeBetween"
  | "selectAnOption"
  | "enterHeightInCentimetres"
  | "enterWeightInKilograms"
  | "selectBodyRegion"
  | "female"
  | "male"
  | "intersex"
  | "preferNotToSay"
  | "language"
  | "english"
  | "hindi"
  | "savedLocally"
  | "noAssessmentsYet"
  | "saved"
  | "notInstalled"
  | "deviceAndModelStatus"
  | "noAssessments"
  | "languageLabel";

type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = "oa-risk-language";

const translations: Record<SupportedLanguage, Partial<Record<TranslationKey, string>>> = {
  en: {
    offlineMovementScreening: "OFFLINE MOVEMENT SCREENING",
    oaRiskDetector: "OA RISK DETECTOR",
    movementScreeningAndAssessment: "Movement screening and assessment",
    newAssessment: "NEW ASSESSMENT",
    beginWithPatientDetails: "Begin with patient details",
    patients: "PATIENTS",
    history: "HISTORY",
    settings: "SETTINGS",
    systemStatus: "SYSTEM STATUS",
    onThisDevice: "ON THIS DEVICE",
    camera: "Camera",
    ready: "Ready",
    permissionDenied: "Permission denied",
    notYetAllowed: "Not yet allowed",
    poseDetection: "Pose detection",
    localStorage: "Local storage",
    model: "ML model",
    patientInformationStaysHere: "Patient information stays on this device.",
    patientDetails: "Patient details",
    recordThePersonBeingAssessed: "Record the person being assessed. Required fields are marked by the form validation.",
    identification: "IDENTIFICATION",
    patientId: "Patient ID",
    leaveBlankToGenerate: "Leave blank to generate",
    name: "Name",
    fullName: "Full name",
    basicMeasurements: "BASIC MEASUREMENTS",
    age: "Age",
    years: "Years",
    sex: "Sex",
    selectBelow: "Select below",
    height: "Height",
    cm: "cm",
    weight: "Weight",
    kg: "kg",
    bodyRegion: "BODY REGION",
    areaBeingAssessed: "Area being assessed",
    patientSavedLocally: "Patient saved locally",
    patientCouldNotBeSaved: "The patient could not be saved on this device. Please try again.",
    continueToQuestionnaire: "CONTINUE TO QUESTIONNAIRE",
    continue: "CONTINUE",
    generateIfBlank: "A local identifier is generated if none is entered.",
    enterPatientName: "Enter the patient name.",
    enterAgeBetween: "Enter an age between 1 and 120.",
    selectAnOption: "Select an option.",
    enterHeightInCentimetres: "Enter height in centimetres.",
    enterWeightInKilograms: "Enter weight in kilograms.",
    selectBodyRegion: "Select a body region.",
    female: "Female",
    male: "Male",
    intersex: "Intersex",
    preferNotToSay: "Prefer not to say",
    language: "Language",
    english: "English",
    hindi: "Hindi",
    savedLocally: "{count} saved locally",
    noAssessmentsYet: "No assessments yet",
    saved: "{count} saved",
    notInstalled: "Not installed",
    deviceAndModelStatus: "Device and model status",
    noAssessments: "No assessments",
    languageLabel: "Language",
  },
  hi: {
    offlineMovementScreening: "ऑफलाइन मूवमेंट स्क्रीनिंग",
    oaRiskDetector: "ओए रि‌स्क डिटेक्टर",
    movementScreeningAndAssessment: "मूवमेंट स्क्रीनिंग और मूल्यांकन",
    newAssessment: "नया मूल्यांकन",
    beginWithPatientDetails: "रोगी की जानकारी से शुरू करें",
    patients: "रोगी",
    history: "इतिहास",
    settings: "सेटिंग्स",
    systemStatus: "सिस्टम स्थिति",
    onThisDevice: "इस डिवाइस पर",
    camera: "कैमरा",
    ready: "तैयार",
    permissionDenied: "अनुमति रद्द",
    notYetAllowed: "अभी अनुमति नहीं",
    poseDetection: "पोज़ पहचान",
    localStorage: "लोकल स्टोरेज",
    model: "एमएल मॉडल",
    patientInformationStaysHere: "रोगी की जानकारी इस डिवाइस पर रहती है।",
    patientDetails: "रोगी की जानकारी",
    recordThePersonBeingAssessed: "मूल्यांकन करने वाले व्यक्ति का रिकॉर्ड भरें। आवश्यक फील्डस को फॉर्म सत्यापन द्वारा चिह्नित किया गया है।",
    identification: "पहचान",
    patientId: "रोगी आईडी",
    leaveBlankToGenerate: "जेनरेट करने के लिए खाली छोड़ें",
    name: "नाम",
    fullName: "पूरा नाम",
    basicMeasurements: "मूल माप",
    age: "उम्र",
    years: "वर्ष",
    sex: "लिंग",
    selectBelow: "नीचे चुनें",
    height: "ऊँचाई",
    cm: "सेमी",
    weight: "वज़न",
    kg: "किलोग्राम",
    bodyRegion: "शरीर का भाग",
    areaBeingAssessed: "मूल्यांकन का क्षेत्र",
    patientSavedLocally: "रोगी स्थानीय रूप से सेव हुआ",
    patientCouldNotBeSaved: "रोगी को इस डिवाइस पर सेव नहीं किया जा सका। कृपया फिर से प्रयास करें।",
    continueToQuestionnaire: "प्रश्नावली पर जाएँ",
    continue: "जारी रखें",
    generateIfBlank: "यदि कोई आईडी नहीं दी गई है, तो स्थानीय आईडी अपने आप बन जाएगी।",
    enterPatientName: "रोगी का नाम दर्ज करें।",
    enterAgeBetween: "1 और 120 के बीच उम्र दर्ज करें।",
    selectAnOption: "कृपया एक विकल्प चुनें।",
    enterHeightInCentimetres: "सेन्टीमीटर में ऊँचाई दर्ज करें।",
    enterWeightInKilograms: "किलो में वजन दर्ज करें।",
    selectBodyRegion: "शरीर का भाग चुनें।",
    female: "महिला",
    male: "पुरुष",
    intersex: "अंतरलिंग",
    preferNotToSay: "बताने से इनकार",
    language: "भाषा",
    english: "अंग्रेज़ी",
    hindi: "हिन्दी",
    savedLocally: "{count} स्थानीय रूप से सेव",
    noAssessmentsYet: "अभी कोई मूल्यांकन नहीं",
    saved: "{count} सेव",
    notInstalled: "इंस्टॉल नहीं",
    deviceAndModelStatus: "डिवाइस और मॉडल स्थिति",
    noAssessments: "कोई मूल्यांकन नहीं",
    languageLabel: "भाषा",
  },
};

const LanguageContext = createContext<{
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted) return;
        if (stored === "hi" || stored === "en") {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(STORAGE_KEY, nextLanguage).catch(() => undefined);
  };

  const t = (key: TranslationKey, params: TranslationParams = {}) => {
    const value = translations[language][key] ?? translations.en[key] ?? key;
    return Object.entries(params).reduce((result, [param, valueToReplace]) => {
      return result.replace(new RegExp(`\\{\\s*${param}\\s*\\}`, "g"), String(valueToReplace));
    }, value);
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>{t("languageLabel")}</Text>
      <View style={{ flexDirection: "row", borderRadius: 999, padding: 2, backgroundColor: "#E6DFD3" }}>
        {(["en", "hi"] as SupportedLanguage[]).map((value) => {
          const active = language === value;
          return (
            <Pressable
              key={value}
              onPress={() => setLanguage(value)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: active ? "#6E5E4E" : "transparent",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#FFFFFF" : "#4A4745" }}>
                {value === "en" ? t("english") : t("hindi")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
