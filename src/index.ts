/**
 * TipAi Skills — 多模态引擎
 *
 * 用法:
 *   import { createMultimodalSkill } from "@tipai/skills";
 *   const multimodal = createMultimodalSkill({ ai: myAICaller });
 *   const result = await multimodal.generate({ mode: "text-to-image", request: "..." });
 *
 * @module @tipai/skills
 */

// ── Config ─────────────────────────────────────────────────

export interface SkillConfig {
  /** AI 调用器 — 用户提供任意模型的实现 */
  ai: AICaller;
  /** 默认模型 */
  defaultModel?: string;
}

// ── AI Call Interface ─────────────────────────────────────

export interface AICaller {
  /** 文本对话 */
  chat(params: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string | null>;

  /** 视觉分析 (可选) */
  vision?(params: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    imageBase64: string;
    temperature?: number;
  }): Promise<string | null>;
}

// ── Types ─────────────────────────────────────────────────

export type MultimodalMode = "text-to-image" | "image-to-text" | "video-storyboard";

export interface GeneratedPrompt {
  title: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, string | number>;
  purpose: string;
  expressionControls?: ExpressionControl;
}

export interface GenerateResult {
  mode: MultimodalMode;
  originalRequest: string;
  generatedPrompts: GeneratedPrompt[];
  tips: string[];
  recommendedModel: string;
  styleAnalysis?: StyleAnalysis;
}

export interface GenerateOptions {
  mode: MultimodalMode;
  request: string;
  model?: string;
  /** 参考图片 base64 (文生图 / 图生文) */
  imageData?: string;
  /** 启用表情控制 (视频分镜) */
  enableExpression?: boolean;
  /** 文件内容 (视频分镜参考文本) */
  fileContent?: string;
  /** 预计算的风格分析 */
  styleAnalysis?: StyleAnalysis;
}

// ── Expression Types ──────────────────────────────────────

export type GazeState = "FOCUS" | "SCAN" | "RECALL" | "AVOID" | "EMPHASIS";
export type EasingCurve = "linear" | "easeInOut" | "elasticOut" | "backOut" | "sineInOut";
export type ExportFormat = "json" | "csv" | "facs-xml" | "prompt-text";

export interface PunctuationProfile {
  punctuation: string;
  auCodes: string[];
  intensity: number;
  gazeState: GazeState;
  duration: number;
  easingCurve: EasingCurve;
}

export interface ExpressionControl {
  punctuationMap: PunctuationProfile[];
  sentimentWeight: number;
  noiseSeed: string;
  noiseAmplitude: number;
  gazeTransitions: { trigger: string; targetState: GazeState; transitionType: "smooth" | "snap" }[];
  exportFormats: ExportFormat[];
}

export interface StyleAnalysis {
  primaryStyle: string;
  colorPalette: string[];
  mood: string;
  genre: string;
  pacing: string;
}

export interface FileParseResult {
  text: string;
  fileName: string;
  fileType: "txt" | "docx" | "pdf";
  charCount: number;
}

// ── Prompt Builders ───────────────────────────────────────

function buildTextToImagePrompt(request: string, styleHint?: string): string {
  const ref = styleHint ? `\n参考风格：${styleHint}\n请与上述风格一致。\n` : "";
  return `你是AI图像生成提示词工程师。生成4个不同风格的英文提示词。
${ref}用户请求：${request}
输出JSON: [{"title":"...","prompt":"English prompt","negativePrompt":"...","parameters":{},"purpose":"..."}]`;
}

function buildImageToTextPrompt(request: string): string {
  return `你是图像分析提示词工程师。生成3个不同角度的分析提示词。
用户请求：${request}
输出JSON: [{"title":"...","prompt":"...","purpose":"..."}]`;
}

function buildVideoStoryboardPrompt(
  request: string,
  fileContent?: string,
  styleAnalysis?: StyleAnalysis,
  enableExpression?: boolean,
): string {
  const fc = fileContent ? `\n参考文本(节选):\n${fileContent.slice(0, 2000)}\n` : "";
  const st = styleAnalysis ? `\n风格分析: ${styleAnalysis.primaryStyle} | 情绪:${styleAnalysis.mood} | 题材:${styleAnalysis.genre} | 节奏:${styleAnalysis.pacing}\n` : "";
  const ex = enableExpression ? "\n重要：包含表情控制(标点→AU映射、情绪权重、视线状态机)。" : "";
  return `你是资深视频分镜师。生成专业分镜脚本。
${fc}${st}用户请求：${request}${ex}
输出JSON: {"scenes":["Scene 1:..."],"variants":[{"title":"...","prompt":"...","purpose":"...","expressionControls":{...}}]}`;
}

// ── Main Skill ────────────────────────────────────────────

export function createMultimodalSkill(config: SkillConfig) {
  const { ai, defaultModel = "deepseek-chat" } = config;

  async function generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || defaultModel;
    const { mode, request, imageData, enableExpression, fileContent, styleAnalysis } = options;

    let system = "你是专业的多模态提示词工程师。";
    let user = "";
    let recommended = "";

    switch (mode) {
      case "text-to-image": {
        const hint = styleAnalysis ? `风格:${styleAnalysis.primaryStyle} 色彩:${styleAnalysis.colorPalette.join(",")} 情绪:${styleAnalysis.mood}` : undefined;
        user = buildTextToImagePrompt(request, hint);
        recommended = "DALL-E 3 / Stable Diffusion XL / Midjourney";
        system += "为图像生成模型撰写高质量英文提示词。";
        break;
      }
      case "image-to-text":
        user = buildImageToTextPrompt(request);
        recommended = "GPT-4V / Claude 3 Vision / Gemini Pro Vision";
        system += "为视觉语言模型撰写结构化分析提示词。";
        break;
      case "video-storyboard":
        user = buildVideoStoryboardPrompt(request, fileContent, styleAnalysis, enableExpression);
        recommended = "Runway Gen-3 / Pika Labs / Kling / Sora";
        system += "为AI视频工具撰写专业分镜脚本。";
        break;
    }

    let response: string | null;
    const hasVision = mode === "image-to-text" && imageData && ai.vision;
    if (hasVision) {
      response = await ai.vision!({ model, systemPrompt: system, userMessage: user, imageBase64: imageData, temperature: 0.7 });
    } else if (mode === "text-to-image" && imageData && ai.vision) {
      // Reference image: use vision to analyze, then text for generation
      const styleResult = await ai.vision!({ model, systemPrompt: "分析图片视觉风格：色彩、光线、构图", userMessage: "描述这张图片的视觉风格特征", imageBase64: imageData, temperature: 0.3 });
      if (styleResult) user = buildTextToImagePrompt(request, styleResult);
      response = await ai.chat({ model, systemPrompt: system, userMessage: user, temperature: 0.7, maxTokens: 4000 });
    } else {
      response = await ai.chat({ model, systemPrompt: system, userMessage: user, temperature: 0.7, maxTokens: 4000 });
    }

    if (!response) throw new Error("AI 调用失败：模型未返回结果");

    const prompts = parseGeneratedPrompts(response);
    if (!prompts || prompts.length === 0) throw new Error("AI 返回解析失败：无法提取 JSON");

    return { mode, originalRequest: request, generatedPrompts: prompts, tips: getTips(mode), recommendedModel: recommended, styleAnalysis };
  }

  function generateSync(request: string, mode: MultimodalMode, model?: string) {
    return generate({ request, mode, model });
  }

  return { generate, generateSync, config: { ...config, defaultModel } };
}

// ── Helpers ───────────────────────────────────────────────

function parseGeneratedPrompts(text: string): GeneratedPrompt[] | null {
  try {
    const arr = text.match(/\[[\s\S]*\]/)?.[0];
    if (arr) { const p = JSON.parse(arr); if (Array.isArray(p)) return p; }
    const obj = text.match(/\{[\s\S]*\}/)?.[0];
    if (obj) { const p = JSON.parse(obj); if (p.variants && Array.isArray(p.variants)) return p.variants; }
  } catch { /* parse error */ }
  return null;
}

function getTips(mode: MultimodalMode): string[] {
  return mode === "text-to-image"
    ? ["使用英文提示词效果更好", "Negative prompt 对开源模型效果明显", "添加风格关键词提升一致性", "CFG Scale 7-8 最佳平衡"]
    : mode === "image-to-text"
      ? ["上传高清原图分析更准确", "明确输出格式(JSON/Markdown)", "OCR 需要指定文字语言", "多轮追问深入细节"]
      : ["每镜头 3-5 秒", "镜头运动描述越具体越稳定", "保持角色场景一致性", "先静态分镜后动态视频"];
}

// ── File Parser ───────────────────────────────────────────

export async function parseTextFile(buffer: ArrayBuffer, fileName: string): Promise<FileParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: Buffer.from(buffer) as any });
    return { text: r.value, fileName, fileType: "docx", charCount: r.value.length };
  }
  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const p = new PDFParse({ data: Buffer.from(buffer) as any });
    const r = await p.getText();
    await p.destroy();
    return { text: r.text ?? "", fileName, fileType: "pdf", charCount: (r.text ?? "").length };
  }
  const text = new TextDecoder("utf-8").decode(buffer);
  return { text, fileName, fileType: "txt", charCount: text.length };
}

export function analyzeStyle(text: string): StyleAnalysis {
  const s = text.slice(0, 4000);
  const colors = ["红","橙","黄","绿","蓝","靛","紫","金","银","白","黑","灰","粉","棕","青","碧","赤","朱","墨","玄","素"].filter(c => s.includes(c)).slice(0, 6);
  const styles: [RegExp, string][] = [
    [/[一-龥]{4,}(?:的|之)[一-龥]{2,}(?:，|。)/g, "古典/诗意"], [/(?:说道|喊道|低语|咆哮|呢喃|问|回答)/g, "对话驱动"],
    [/(?:突然|猛地|立刻|顿时|霎时|瞬间|急速)/g, "快节奏动作"], [/(?:缓缓|慢慢|渐渐|逐渐|徐徐|悠悠)/g, "慢节奏抒情"],
    [/(?:绚烂|璀璨|斑驳|闪烁|耀眼|辉煌)/g, "视觉华丽"], [/(?:黑暗|阴冷|潮湿|阴森|恐怖|诡异)/g, "暗黑/悬疑"],
  ];
  let primary = "现代叙事"; let max = 0;
  for (const [re, l] of styles) { const n = (s.match(re) ?? []).length; if (n > max) { max = n; primary = l; } }
  const moods: [RegExp, string][] = [
    [/[。！？](?:她|他|它).*?(?:哭|泣|悲|伤|痛|哀)/g, "悲伤"], [/[。！？](?:她|他|它).*?(?:笑|喜|乐|悦|欢|欣)/g, "欢乐"],
    [/[。！？].*?(?:愤怒|暴怒|生气|怒|恼)/g, "愤怒"], [/[。！？].*?(?:紧张|绷紧|屏息|凝神|惊)/g, "紧张"],
    [/[。！？].*?(?:宁静|安详|平静|静谧|祥和)/g, "宁静"],
  ];
  const ms: Record<string, number> = {};
  for (const [re, l] of moods) { const n = (s.match(re) ?? []).length; if (n > 0) ms[l] = n; }
  const mood = Object.keys(ms).length > 0 ? Object.entries(ms).sort((a, b) => b[1] - a[1])[0][0] : "中性";
  const genres: [RegExp, string][] = [
    [/江湖|侠|剑|武功|门派/g, "武侠"], [/魔法|咒语|巫师|龙|精灵|矮人/g, "奇幻"],
    [/飞船|星际|外星|激光|太空|星球/g, "科幻"], [/侦探|推理|案件|凶手|线索|谜/g, "悬疑"],
    [/爱情|恋爱|情人|约会|玫瑰|浪漫/g, "言情"],
  ];
  const gs: Record<string, number> = {};
  for (const [re, l] of genres) { const n = (s.match(re) ?? []).length; if (n > 0) gs[l] = n; }
  const genre = Object.keys(gs).length > 0 ? Object.entries(gs).sort((a, b) => b[1] - a[1])[0][0] : "通用";
  const ts = (s.match(/[。！？]/g) ?? []).length || 1;
  const ls = (s.match(/[^。！？]{40,}[。！？]/g) ?? []).length;
  const pacing = ls / ts > 0.3 ? "慢节奏" : ls / ts < 0.1 ? "快节奏" : "适中";
  return { primaryStyle: primary, colorPalette: colors.length > 0 ? colors : ["黑","白","灰"], mood, genre, pacing };
}
