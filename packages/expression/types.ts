// ── TPEMA v0.2 表情控制核心类型 ────────────────────────────

export type GazeState = "FOCUS" | "SCAN" | "RECALL" | "AVOID" | "EMPHASIS";
export type EasingCurve = "linear" | "easeInOut" | "elasticOut" | "backOut" | "sineInOut";
export type ExportFormat = "json" | "csv" | "facs-xml" | "prompt-text";

export interface PunctuationProfile {
  punctuation: string;
  auCodes: string[];
  intensity: number;
  headPoseDelta?: { pitch: number; yaw: number; roll: number };
  gazeState: GazeState;
  duration: number; // ms
  easingCurve: EasingCurve;
}

export interface GazeTransition {
  trigger: string;
  targetState: GazeState;
  transitionType: "smooth" | "snap";
}

export interface ExpressionControl {
  punctuationMap: PunctuationProfile[];
  sentimentWeight: number;
  noiseSeed: string;
  noiseAmplitude: number;
  gazeTransitions: GazeTransition[];
  exportFormats: ExportFormat[];
}

// ── 预设配置 ──────────────────────────────────────────────

export const DEFAULT_EXPRESSION_CONTROL: ExpressionControl = {
  punctuationMap: [
    { punctuation: "，", auCodes: ["AU1+2"], intensity: 0.4, gazeState: "FOCUS", duration: 200, easingCurve: "linear" },
    { punctuation: "。", auCodes: ["AU1+2"], intensity: 0.2, gazeState: "FOCUS", duration: 300, easingCurve: "easeInOut" },
    { punctuation: "？", auCodes: ["AU1+2", "AU5"], intensity: 0.8, gazeState: "EMPHASIS", duration: 500, easingCurve: "backOut" },
    { punctuation: "！", auCodes: ["AU20", "AU5", "AU12"], intensity: 0.9, gazeState: "EMPHASIS", duration: 600, easingCurve: "elasticOut" },
    { punctuation: "…", auCodes: ["AU1+2"], intensity: 0.5, gazeState: "AVOID", duration: 800, easingCurve: "sineInOut" },
    { punctuation: "；", auCodes: ["AU1+2", "AU4"], intensity: 0.6, gazeState: "SCAN", duration: 400, easingCurve: "easeInOut" },
  ],
  sentimentWeight: 1.0,
  noiseSeed: "default",
  noiseAmplitude: 0.05,
  gazeTransitions: [
    { trigger: "！", targetState: "EMPHASIS", transitionType: "snap" },
    { trigger: "？", targetState: "FOCUS", transitionType: "snap" },
    { trigger: "…", targetState: "AVOID", transitionType: "smooth" },
  ],
  exportFormats: ["json", "csv", "facs-xml", "prompt-text"],
};

export const DEEPSEEK_OPTIMIZED_EXPRESSION: ExpressionControl = {
  punctuationMap: [
    { punctuation: "，", auCodes: ["AU1+2"], intensity: 0.3, gazeState: "FOCUS", duration: 200, easingCurve: "linear" },
    { punctuation: "。", auCodes: [], intensity: 0.1, gazeState: "FOCUS", duration: 200, easingCurve: "linear" },
    { punctuation: "？", auCodes: ["AU1+2", "AU5"], intensity: 0.8, gazeState: "EMPHASIS", duration: 500, easingCurve: "backOut" },
    { punctuation: "！", auCodes: ["AU20", "AU5", "AU12"], intensity: 0.9, gazeState: "EMPHASIS", duration: 600, easingCurve: "elasticOut" },
    { punctuation: "…", auCodes: ["AU1+2"], intensity: 0.5, gazeState: "AVOID", duration: 800, easingCurve: "sineInOut" },
    { punctuation: "；", auCodes: ["AU1+2", "AU4"], intensity: 0.6, gazeState: "SCAN", duration: 400, easingCurve: "easeInOut" },
  ],
  sentimentWeight: 0.8,
  noiseSeed: "deepseek_portrait",
  noiseAmplitude: 0.06,
  gazeTransitions: [
    { trigger: "！", targetState: "EMPHASIS", transitionType: "snap" },
    { trigger: "？", targetState: "FOCUS", transitionType: "snap" },
    { trigger: "…", targetState: "AVOID", transitionType: "smooth" },
  ],
  exportFormats: ["json", "csv", "facs-xml", "prompt-text"],
};
