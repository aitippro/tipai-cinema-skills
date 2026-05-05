/**
 * TipAi Skill — 文件解析 + 风格分析
 *
 * 支持 .txt / .docx / .pdf 文本提取
 * 本地启发式风格分析（色彩、情绪、节奏、题材）
 *
 * @module file-parser
 */

export interface FileParseResult {
  text: string;
  fileName: string;
  fileType: "txt" | "docx" | "pdf";
  charCount: number;
}

export interface StyleAnalysis {
  primaryStyle: string;
  colorPalette: string[];
  mood: string;
  genre: string;
  pacing: string;
}

export async function parseTextFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<FileParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return { text: result.value, fileName, fileType: "docx", charCount: result.value.length };
  }

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return { text: result.text ?? "", fileName, fileType: "pdf", charCount: (result.text ?? "").length };
  }

  const text = new TextDecoder("utf-8").decode(buffer);
  return { text, fileName, fileType: "txt", charCount: text.length };
}

/** 本地启发式文本风格分析 — 零 AI 调用 */
export function analyzeStyle(text: string): StyleAnalysis {
  const sample = text.slice(0, 4000);

  const colorKeywords = ["红", "橙", "黄", "绿", "蓝", "靛", "紫", "金", "银", "白", "黑", "灰", "粉", "棕", "青", "碧", "赤", "朱", "墨", "玄", "素"];
  const colorPalette = colorKeywords.filter((c) => sample.includes(c)).slice(0, 6);

  const stylePatterns: [RegExp, string][] = [
    [/[一-龥]{4,}(?:的|之)[一-龥]{2,}(?:，|。)/g, "古典/诗意"],
    [/(?:说道|喊道|低语|咆哮|呢喃|问|回答)/g, "对话驱动"],
    [/(?:突然|猛地|立刻|顿时|霎时|瞬间|急速)/g, "快节奏动作"],
    [/(?:缓缓|慢慢|渐渐|逐渐|徐徐|悠悠)/g, "慢节奏抒情"],
    [/(?:绚烂|璀璨|斑驳|闪烁|耀眼|辉煌)/g, "视觉华丽"],
    [/(?:黑暗|阴冷|潮湿|阴森|恐怖|诡异)/g, "暗黑/悬疑"],
  ];

  let primaryStyle = "现代叙事";
  let maxHits = 0;
  for (const [re, label] of stylePatterns) {
    const hits = (sample.match(re) ?? []).length;
    if (hits > maxHits) { maxHits = hits; primaryStyle = label; }
  }

  const moodPatterns: [RegExp, string][] = [
    [/[。！？](?:她|他|它).*?(?:哭|泣|悲|伤|痛|哀)/g, "悲伤"],
    [/[。！？](?:她|他|它).*?(?:笑|喜|乐|悦|欢|欣)/g, "欢乐"],
    [/[。！？].*?(?:愤怒|暴怒|生气|怒|恼)/g, "愤怒"],
    [/[。！？].*?(?:紧张|绷紧|屏息|凝神|惊)/g, "紧张"],
    [/[。！？].*?(?:宁静|安详|平静|静谧|祥和)/g, "宁静"],
  ];
  const moodScores: Record<string, number> = {};
  for (const [re, label] of moodPatterns) {
    const hits = (sample.match(re) ?? []).length;
    if (hits > 0) moodScores[label] = hits;
  }
  const mood = Object.keys(moodScores).length > 0
    ? Object.entries(moodScores).sort((a, b) => b[1] - a[1])[0][0] : "中性";

  const genrePatterns: [RegExp, string][] = [
    [/江湖|侠|剑|武功|门派/g, "武侠"], [/魔法|咒语|巫师|龙|精灵|矮人/g, "奇幻"],
    [/飞船|星际|外星|激光|太空|星球/g, "科幻"], [/侦探|推理|案件|凶手|线索|谜/g, "悬疑"],
    [/爱情|恋爱|情人|约会|玫瑰|浪漫/g, "言情"],
  ];
  const genreScores: Record<string, number> = {};
  for (const [re, label] of genrePatterns) {
    const hits = (sample.match(re) ?? []).length;
    if (hits > 0) genreScores[label] = hits;
  }
  const genre = Object.keys(genreScores).length > 0
    ? Object.entries(genreScores).sort((a, b) => b[1] - a[1])[0][0] : "通用";

  const totalSentences = (sample.match(/[。！？]/g) ?? []).length || 1;
  const longSentences = (sample.match(/[^。！？]{40,}[。！？]/g) ?? []).length;
  const pacing = longSentences / totalSentences > 0.3 ? "慢节奏" : longSentences / totalSentences < 0.1 ? "快节奏" : "适中";

  return { primaryStyle, colorPalette: colorPalette.length > 0 ? colorPalette : ["黑", "白", "灰"], mood, genre, pacing };
}
