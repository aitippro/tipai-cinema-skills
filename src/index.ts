/**
 * @tipai/skills — 多模态提示词引擎
 *
 * 独立 Skill，零框架依赖。克隆即用。
 *
 * ```ts
 * import { createMultimodalSkill } from "./tipai-skills/src/index.ts"
 *
 * const skill = createMultimodalSkill({
 *   chat: async (opts) => { ... },  // 你的 AI 调用
 * })
 *
 * const result = await skill.generate({
 *   mode: "text-to-image",
 *   request: "一只穿宇航服的猫在月球"
 * })
 * ```
 */

// ── 类型 ────────────────────────────────────────────────────

export type Mode = "text-to-image" | "image-to-text" | "video-storyboard";

export interface ChatOptions {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}

export interface SkillOptions {
  /** AI 文本对话 — 用户提供任意模型的实现 */
  chat: (opts: ChatOptions) => Promise<string | null>;
  /** AI 视觉分析 (可选，图生文模式需要) */
  vision?: (opts: ChatOptions & { imageBase64: string }) => Promise<string | null>;
  /** 默认模型名 (仅用于提示信息) */
  defaultModel?: string;
}

export interface PromptVariant {
  title: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, string | number>;
  purpose: string;
  expressionControls?: ExpressionProfile;
}

export interface GenerateInput {
  mode: Mode;
  request: string;
  /** 参考图片 base64 */
  imageData?: string;
  /** 启用表情控制 (视频分镜) */
  expression?: boolean;
  /** 参考文本 */
  context?: string;
  /** 风格提示 */
  styleHint?: string;
}

export interface GenerateOutput {
  mode: Mode;
  request: string;
  variants: PromptVariant[];
  tips: string[];
  recommendedTools: string;
}

// ── 表情控制 ────────────────────────────────────────────────

export type Gaze = "FOCUS" | "SCAN" | "RECALL" | "AVOID" | "EMPHASIS";
export type Curve = "linear" | "easeInOut" | "elasticOut" | "backOut" | "sineInOut";

export interface ExpressionProfile {
  punctuationMap: {
    punctuation: string;
    auCodes: string[];
    intensity: number;
    gazeState: Gaze;
    duration: number;
    easingCurve: Curve;
  }[];
  sentimentWeight: number;
  noiseSeed: string;
  noiseAmplitude: number;
  gazeTransitions: { trigger: string; targetState: Gaze; transitionType: "smooth" | "snap" }[];
  exportFormats: ("json" | "csv" | "facs-xml" | "prompt-text")[];
}

// ── 风格分析 ────────────────────────────────────────────────

export interface StyleAnalysis {
  primaryStyle: string;
  colorPalette: string[];
  mood: string;
  genre: string;
  pacing: string;
}

// ── Prompt 模板 ─────────────────────────────────────────────

const PROMPTS = {
  textToImage: (request: string, hint?: string) =>
    `你是专业AI图像生成提示词工程师。根据描述生成4个不同风格的英文提示词。
${hint ? `\n参考风格：${hint}\n` : ""}
用户请求：${request}

严格输出JSON数组(不要任何额外内容):
[{"title":"标准版","prompt":"English prompt...","negativePrompt":"...","parameters":{},"purpose":"适用场景"}]`,

  imageToText: (request: string) =>
    `你是专业图像分析提示词工程师。生成3个不同角度的分析提示词。
用户请求：${request}

严格输出JSON数组:
[{"title":"标题","prompt":"提示词内容","purpose":"用途"}]`,

  videoStoryboard: (request: string, context?: string, styleHint?: string, expr?: boolean) =>
    `你是资深视频分镜师${expr ? "兼AI表情控制专家" : ""}。生成专业分镜脚本。
${context ? `\n参考文本:\n${context.slice(0, 2000)}\n` : ""}${styleHint ? `\n风格参考: ${styleHint}\n` : ""}
用户请求：${request}${expr ? "\n\n重要：包含表情控制指令(标点→FACS AU映射、情绪权重、视线状态机)" : ""}

严格输出JSON(不要任何额外内容):
{"scenes":["Scene 1: ...","Scene 2: ..."],"variants":[{"title":"完整分镜","prompt":"...","purpose":"...","expressionControls":{...}}]}`,
};

// ── 结果解析 ───────────────────────────────────────────────

function parse(text: string): { variants?: PromptVariant[]; expressionControls?: ExpressionProfile } | null {
  try {
    const arr = text.match(/\[[\s\S]*\]/)?.[0];
    if (arr) return { variants: JSON.parse(arr) };
    const obj = text.match(/\{[\s\S]*\}/)?.[0];
    if (obj) { const d = JSON.parse(obj); return { variants: d.variants, expressionControls: d.expressionControls }; }
  } catch { /* AI JSON 可能格式问题 */ }
  return null;
}

// ── Skill 创建 ─────────────────────────────────────────────

export function createMultimodalSkill(opts: SkillOptions) {
  const { chat, vision, defaultModel = "deepseek-chat" } = opts;

  async function generate(input: GenerateInput): Promise<GenerateOutput> {
    const { mode, request, imageData, expression, context, styleHint } = input;

    let system = "你是专业多模态提示词工程师。严格按JSON格式输出。";
    let user = "";
    let tools = "";

    switch (mode) {
      case "text-to-image":
        user = PROMPTS.textToImage(request, styleHint);
        tools = "DALL-E 3 / Stable Diffusion XL / Midjourney";
        system += "为图像生成模型撰写高质量英文提示词。";
        break;
      case "image-to-text":
        user = PROMPTS.imageToText(request);
        tools = "GPT-4V / Claude 3 Vision / Gemini Pro Vision";
        system += "为视觉语言模型撰写结构化分析提示词。";
        break;
      case "video-storyboard":
        user = PROMPTS.videoStoryboard(request, context, styleHint, expression);
        tools = "Runway Gen-3 / Pika Labs / Kling / Sora";
        system += "为AI视频工具撰写专业分镜脚本。";
        break;
    }

    // 视觉模式优先用 vision caller
    let response: string | null = null;
    if (imageData && vision) {
      if (mode === "image-to-text") {
        response = await vision({ system, user, temperature: 0.7, maxTokens: 4000, imageBase64: imageData });
      } else if (mode === "text-to-image") {
        // 参考图：先用 vision 分析风格，再用文本生成
        const styleInfo = await vision({
          system: "分析图片视觉特征：色彩、光线、构图、风格",
          user: "用一句话描述图片的视觉风格",
          temperature: 0.3, maxTokens: 200, imageBase64: imageData,
        });
        if (styleInfo) user = PROMPTS.textToImage(request, styleInfo);
        response = await chat({ system, user, temperature: 0.7, maxTokens: 4000 });
        tools += " + 参考图风格分析";
      }
    }

    if (!response) {
      response = await chat({ system, user, temperature: 0.7, maxTokens: 4000 });
    }

    if (!response) throw new Error("AI 调用失败：模型未返回结果");

    const parsed = parse(response);
    if (!parsed?.variants?.length) throw new Error("AI 返回解析失败：无法提取有效JSON");

    return {
      mode,
      request,
      variants: parsed.variants.map(v => ({ ...v, expressionControls: v.expressionControls ?? parsed.expressionControls })),
      tips: getTips(mode),
      recommendedTools: tools,
    };
  }

  return { generate, defaultModel };
}

function getTips(mode: Mode): string[] {
  return {
    "text-to-image": ["英文提示词效果更好", "Negative prompt 对 SD 效果明显", "添加风格关键词提升一致性", "CFG Scale 7-8 最佳平衡点"],
    "image-to-text": ["上传高清原图分析更准", "明确指定输出格式", "OCR 需额外指定文字语言", "多轮追问可深入细节"],
    "video-storyboard": ["每镜头建议3-5秒", "镜头运动描述越具体越稳定", "保持角色和场景一致性", "先静态分镜再动态视频"],
  }[mode];
}

// ── 辅助工具 ───────────────────────────────────────────────

/** 本地文本风格分析 — 零 AI 调用 */
export function analyzeStyle(text: string): StyleAnalysis {
  const s = text.slice(0, 4000);
  const colors = "红橙黄绿蓝靛紫金银白黑灰粉棕青碧赤朱墨玄素".match(/./g)!.filter(c => s.includes(c)).slice(0, 6);
  const styles: [RegExp, string][] = [
    [/[一-龥]{4,}(?:的|之)[一-龥]{2,}(?:，|。)/g, "古典/诗意"], [/(?:说道|喊道|低语|咆哮|呢喃|问|回答)/g, "对话驱动"],
    [/(?:突然|猛地|立刻|顿时|霎时|瞬间|急速)/g, "快节奏动作"], [/(?:缓缓|慢慢|渐渐|逐渐|徐徐|悠悠)/g, "慢节奏抒情"],
  ];
  let primary = "现代叙事", max = 0;
  for (const [r, l] of styles) { const n = (s.match(r) ?? []).length; if (n > max) { max = n; primary = l; } }

  const moods: [RegExp, string][] = [
    [/[。！？].*?(?:哭|泣|悲|伤|痛|哀)/g, "悲伤"], [/[。！？].*?(?:笑|喜|乐|悦|欢|欣)/g, "欢乐"],
    [/[。！？].*?(?:愤怒|暴怒|生气|怒|恼)/g, "愤怒"], [/[。！？].*?(?:紧张|绷紧|屏息|凝神|惊)/g, "紧张"],
  ];
  const ms: Record<string, number> = {};
  for (const [r, l] of moods) { const n = (s.match(r) ?? []).length; if (n > 0) ms[l] = n; }
  const mood = Object.keys(ms).length > 0 ? Object.entries(ms).sort((a, b) => b[1] - a[1])[0][0] : "中性";

  const genres: [RegExp, string][] = [
    [/江湖|侠|剑|武功/g, "武侠"], [/魔法|咒语|龙|精灵/g, "奇幻"],
    [/飞船|星际|外星|太空/g, "科幻"], [/侦探|推理|案件|凶手/g, "悬疑"],
  ];
  const gs: Record<string, number> = {};
  for (const [r, l] of genres) { const n = (s.match(r) ?? []).length; if (n > 0) gs[l] = n; }
  const genre = Object.keys(gs).length > 0 ? Object.entries(gs).sort((a, b) => b[1] - a[1])[0][0] : "通用";

  const total = (s.match(/[。！？]/g) ?? []).length || 1;
  const long = (s.match(/[^。！？]{40,}[。！？]/g) ?? []).length;
  const pacing = long / total > 0.3 ? "慢节奏" : long / total < 0.1 ? "快节奏" : "适中";

  return { primaryStyle: primary, colorPalette: colors.length > 0 ? colors : ["黑","白","灰"], mood, genre, pacing };
}
