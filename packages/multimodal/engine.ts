/**
 * TipAi Skill — 多模态提示词引擎
 *
 * 支持三种场景：
 *  - text-to-image: 文生图优化提示词
 *  - image-to-text: 图生文分析提示词
 *  - video-storyboard: 视频分镜脚本
 *
 * @module multimodal-engine
 */

export type MultimodalMode = "text-to-image" | "image-to-text" | "video-storyboard";

export interface GeneratedPrompt {
  title: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, string | number>;
  purpose: string;
  expressionControls?: ExpressionControl;
}

export interface MultimodalPromptResult {
  mode: MultimodalMode;
  originalRequest: string;
  generatedPrompts: GeneratedPrompt[];
  tips: string[];
  recommendedModel: string;
  styleAnalysis?: StyleAnalysis;
}

// ── Expression Controls (re-exported from expression package) ──

import type { ExpressionControl } from "../expression/types";
import type { StyleAnalysis } from "./file-parser";

// ── AI Call Interface (user provides their own implementation) ──

export interface AICaller {
  callAI(model: string, apiKey: string, system: string, user: string, temperature?: number): Promise<string | null>;
  callAIVision(model: string, apiKey: string, system: string, user: string, imageBase64: string, temperature?: number): Promise<string | null>;
}

// ── Prompt Builders ────────────────────────────────────────

function buildTextToImagePrompt(request: string, styleHint?: string): string {
  const refSection = styleHint
    ? `\n参考风格分析：${styleHint}\n请使生成的提示词风格与上述参考风格一致。\n`
    : "";
  return `你是一位专业的 AI 图像生成提示词工程师。请根据用户的描述，生成 4 个不同风格的优化提示词。
${refSection}
用户请求：${request}
输出 JSON 数组格式：[{ "title": "...", "prompt": "...", "negativePrompt": "...", "parameters": {...}, "purpose": "..." }]`;
}

function buildImageToTextPrompt(request: string): string {
  return `你是一位专业的图像分析提示词工程师。请根据用户的分析需求，生成 3 个不同用途的图像分析提示词。
用户请求：${request}
输出 JSON 数组：[{ "title": "...", "prompt": "...", "purpose": "..." }]`;
}

function buildVideoStoryboardPrompt(
  request: string,
  enableExpression?: boolean,
  fileContent?: string,
  styleAnalysis?: StyleAnalysis,
): string {
  const hasFile = fileContent ? `\n参考文本内容（节选前2000字）：\n${fileContent.slice(0, 2000)}\n` : "";
  const hasStyle = styleAnalysis
    ? `\n文本风格分析：风格=${styleAnalysis.primaryStyle}，色彩=${styleAnalysis.colorPalette.join("、")}，情绪=${styleAnalysis.mood}，题材=${styleAnalysis.genre}，节奏=${styleAnalysis.pacing}\n`
    : "";
  const exprHint = enableExpression
    ? `\n重要：请包含表情控制指令（标点→AU映射，情绪权重，视线状态机）。`
    : "";

  return `你是一位资深视频分镜师。请根据用户的视频创意，生成专业的分镜脚本。
用户请求：${request}${hasFile}${hasStyle}${exprHint}
输出 JSON：{ "scenes": ["Scene 1: ...", ...], "variants": [{ "title": "...", "prompt": "...", "purpose": "...", "expressionControls": {...} }] }`;
}

// ── Main API ───────────────────────────────────────────────

export async function generateMultimodalPrompt(
  request: string,
  mode: MultimodalMode,
  model: string,
  apiKey: string,
  ai: AICaller,
  options?: {
    imageData?: string;
    enableExpression?: boolean;
    fileContent?: string;
    styleAnalysis?: StyleAnalysis;
  },
): Promise<MultimodalPromptResult> {
  const { imageData, enableExpression, fileContent, styleAnalysis } = options ?? {};

  let systemPrompt = "你是一位专业的多模态提示词工程师。";
  let userPrompt = "";
  let recommendedModel = "";

  switch (mode) {
    case "text-to-image": {
      const styleHint = styleAnalysis
        ? `风格：${styleAnalysis.primaryStyle}，色彩：${styleAnalysis.colorPalette.join("、")}，情绪：${styleAnalysis.mood}`
        : undefined;
      userPrompt = buildTextToImagePrompt(request, styleHint);
      recommendedModel = "DALL-E 3 / Stable Diffusion XL";
      systemPrompt += "你擅长为图像生成模型撰写高质量的英文提示词。";
      break;
    }
    case "image-to-text":
      userPrompt = buildImageToTextPrompt(request);
      recommendedModel = "GPT-4V / Claude 3 Vision / Gemini Pro Vision";
      systemPrompt += "你擅长分析图像内容并撰写结构化、精确的分析结果。";
      break;
    case "video-storyboard":
      userPrompt = buildVideoStoryboardPrompt(request, enableExpression, fileContent, styleAnalysis);
      recommendedModel = "Runway Gen-3 / Pika Labs / Sora";
      systemPrompt += "你擅长为 AI 视频生成工具撰写专业的分镜脚本。";
      break;
  }

  // Call AI (vision API if imageData provided)
  let response: string | null;
  if ((mode === "image-to-text" || mode === "text-to-image") && imageData) {
    response = await ai.callAIVision(model, apiKey, systemPrompt, userPrompt, imageData, 0.7);
  } else {
    response = await ai.callAI(model, apiKey, systemPrompt, userPrompt, 0.7);
  }

  if (!response) throw new Error("AI 调用失败：模型未返回有效结果");

  const prompts = parseGeneratedPrompts(response);
  if (!prompts || prompts.length === 0) {
    throw new Error("AI 返回结果解析失败：无法提取有效的 JSON");
  }

  return {
    mode,
    originalRequest: request,
    generatedPrompts: prompts,
    tips: getTips(mode),
    recommendedModel,
    styleAnalysis,
  };
}

// ── Helpers ─────────────────────────────────────────────────

function parseGeneratedPrompts(text: string): GeneratedPrompt[] | null {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) { const p = JSON.parse(match[0]); if (Array.isArray(p)) return p; }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const p = JSON.parse(objMatch[0]);
      if (p.variants && Array.isArray(p.variants)) return p.variants;
    }
  } catch { /* parse error */ }
  return null;
}

function getTips(mode: MultimodalMode): string[] {
  switch (mode) {
    case "text-to-image":
      return ["使用英文提示词可获得更好的生成效果", "Negative prompt 对开源模型效果更明显", "适当添加风格关键词可大幅提升一致性", "CFG Scale 7-8 是大多数场景的最佳平衡点"];
    case "image-to-text":
      return ["上传高清原图可获得更准确的分析", "明确指定输出格式（JSON/Markdown/纯文本）", "如需 OCR，建议额外指定文字语言", "多轮追问可深入挖掘图片细节"];
    case "video-storyboard":
      return ["每个镜头建议控制在 3-5 秒", "镜头运动描述越具体，AI 生成越稳定", "保持角色和场景描述的一致性", "先完成静态分镜，再生成动态视频"];
  }
}

export function getMultimodalModes(): { value: MultimodalMode; label: string; description: string }[] {
  return [
    { value: "text-to-image", label: "文生图", description: "生成图像生成模型的优化提示词" },
    { value: "image-to-text", label: "图生文", description: "生成图像分析、描述和 OCR 提示词" },
    { value: "video-storyboard", label: "视频分镜", description: "生成视频分镜脚本和镜头描述" },
  ];
}
