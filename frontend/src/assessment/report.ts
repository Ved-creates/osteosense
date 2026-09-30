import type { Assessment } from "@/src/types/assessment";
import { MOVEMENT_TEST_INFO } from "./movementTests";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function display(value: number | null | undefined, digits = 2) {
  return value === null || value === undefined ? "Not available" : value.toFixed(digits);
}

export function buildAssessmentReportHtml(assessment: Assessment) {
  const sensor = assessment.manualSensorData;
  const testName = MOVEMENT_TEST_INFO[assessment.movementTest]?.label ?? assessment.movementTest;
  const createdAt = new Date(assessment.createdAt).toLocaleString();
  const patientName = escapeHtml(assessment.patientName || assessment.patientId);
  const movementRows = [
    ["Left knee ROM", display(assessment.cameraFeatures.leftKneeRomDeg), "degrees"],
    ["Right knee ROM", display(assessment.cameraFeatures.rightKneeRomDeg), "degrees"],
    ["Knee ROM", display(assessment.cameraFeatures.kneeRomDeg), "degrees"],
    ["Repetitions", display(assessment.cameraFeatures.repetitions, 0), ""],
    ["Cadence", display(assessment.cameraFeatures.cadenceStepsPerMin), "steps/min"],
    ["Pose visibility", display(assessment.quality.poseVisibility === null ? null : assessment.quality.poseVisibility * 100), "%"],
  ];
  const legRows = (side: "Left" | "Right") => {
    const leg = side === "Left" ? sensor?.left : sensor?.right;
    if (!leg) return `<tr><td>${side} leg</td><td colspan="3">No manual sensor data entered</td></tr>`;
    const fields = side === "Left"
      ? [["FSR 1", leg.pressureFsr1Mv, "mV"], ["FSR 2", leg.pressureFsr2Mv, "mV"]]
      : [["FSR 3", leg.pressureFsr1Mv, "mV"], ["FSR 4", leg.pressureFsr2Mv, "mV"]];
    const rows = [
      ...fields,
      ["Accelerometer X / Y / Z", `${display(leg.accelXG)}, ${display(leg.accelYG)}, ${display(leg.accelZG)}`, "g"],
      ["Gyroscope X / Y / Z", `${display(leg.gyroXDps)}, ${display(leg.gyroYDps)}, ${display(leg.gyroZDps)}`, "deg/s"],
    ];
    return rows.map(([label, value, unit]) => `<tr><td>${side} leg</td><td>${label}</td><td>${value}</td><td>${unit}</td></tr>`).join("");
  };

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { margin: 22mm 16mm; }
  body { font-family: Arial, sans-serif; color: #252522; font-size: 11pt; }
  h1 { font-size: 21pt; margin: 0 0 5px; color: #314d45; }
  h2 { font-size: 12pt; margin: 22px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #c8c8be; color: #314d45; }
  .subtitle, .muted { color: #66665f; }
  .risk { margin-top: 18px; padding: 15px; border: 1px solid #c8c8be; background: #f3f3ed; }
  .risk strong { font-size: 20pt; }
  .warning { margin-top: 8px; color: #744f21; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 6px; border-bottom: 1px solid #deded6; text-align: left; }
  th { background: #f3f3ed; }
  .footer { margin-top: 24px; font-size: 9pt; color: #66665f; line-height: 1.45; }
</style></head><body>
  <h1>Osteoarthritis Screening Report</h1>
  <div class="subtitle">Movement screening record · ${escapeHtml(createdAt)}</div>
  <h2>Assessment</h2>
  <table><tbody>
    <tr><th>Patient</th><td>${patientName}</td><th>Patient ID</th><td>${escapeHtml(assessment.patientId)}</td></tr>
    <tr><th>Body region</th><td>${escapeHtml(assessment.bodyRegion || "Not specified")}</td><th>Movement test</th><td>${escapeHtml(testName)}</td></tr>
    <tr><th>Assessment ID</th><td colspan="3">${escapeHtml(assessment.assessmentId)}</td></tr>
    <tr><th>Camera quality</th><td>${escapeHtml(assessment.quality.state)}</td><th>Session</th><td>${assessment.sessionDurationS}s</td></tr>
  </tbody></table>
  <div class="risk"><div>DEMO RESULT (NOT A CLINICAL RISK SCORE)</div><strong>${assessment.demoRisk?.percentage ?? 10}%</strong><div class="warning">${escapeHtml(assessment.demoRisk?.note ?? "Demonstration placeholder only; no validated osteoarthritis risk model calculated this value.")}</div></div>
  <h2>Camera movement features</h2>
  <table><thead><tr><th>Feature</th><th>Value</th><th>Unit</th></tr></thead><tbody>${movementRows.map(([label, value, unit]) => `<tr><td>${label}</td><td>${value}</td><td>${unit}</td></tr>`).join("")}</tbody></table>
  <h2>Manual BLE sensor values (${sensor ? "demo/manual entry" : "not entered"})</h2>
  <table><thead><tr><th>Leg</th><th>Sensor</th><th>Value</th><th>Unit</th></tr></thead><tbody>${legRows("Left")}${legRows("Right")}</tbody></table>
  <div class="footer">This report is for software demonstration and screening workflow testing only. The manually entered values are not verified sensor measurements. The displayed percentage is a fixed placeholder and is not calculated from the camera or sensor data. This report does not diagnose osteoarthritis or rule it out. A qualified healthcare professional should interpret clinical findings.</div>
</body></html>`;
}
