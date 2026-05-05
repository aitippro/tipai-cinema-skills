/**
 * 多模态引擎质量测试
 * 用法: DEEPSEEK_API_KEY=sk-xxx npx tsx scripts/test.ts
 */

import { createMultimodalSkill, analyzeStyle, type AICaller } from "../src/index";

const KEY = process.env.DEEPSEEK_API_KEY || "";
if (!KEY) { console.error("请设置 DEEPSEEK_API_KEY"); process.exit(1); }

const ai: AICaller = {
  async chat({ model, systemPrompt, userMessage, temperature: t = 0.7 }) {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model, temperature: t, max_tokens: 4000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }] }),
    });
    if (!r.ok) { console.error(`API ${r.status}: ${await r.text().catch(() => "")}`); return null; }
    const d = await r.json() as any;
    return d.choices?.[0]?.message?.content ?? null;
  },
};

const skill = createMultimodalSkill({ ai, defaultModel: "deepseek-chat" });

async function run() {
  // ── 文生图 ──
  console.log("═".repeat(50) + "\n📸 文生图\n" + "═".repeat(50));
  const r1 = await skill.generate({ mode: "text-to-image", request: "一只穿宇航服的橘猫在月球表面漫步，超写实风格" });
  for (const p of r1.generatedPrompts) console.log(`[${p.title}]\n  ${p.prompt.slice(0, 250)}...\n`);

  // ── 图生文 ──
  console.log("═".repeat(50) + "\n🔍 图生文\n" + "═".repeat(50));
  const r2 = await skill.generate({ mode: "image-to-text", request: "分析产品海报的色彩搭配和视觉层次" });
  for (const p of r2.generatedPrompts) console.log(`[${p.title}]\n  ${p.prompt.slice(0, 200)}...\n`);

  // ── 视频分镜 + 风格分析 ──
  console.log("═".repeat(50) + "\n🎬 视频分镜 + 风格分析\n" + "═".repeat(50));
  const text = "她推开木门，铜铃清脆作响。午后的阳光斜洒进来，给木桌镀上金色。她走向角落——那里空着，是第一次见面的位置。坐下的瞬间，眼眶微微泛红，嘴角却扬起一抹若有若无的笑。";
  const style = analyzeStyle(text);
  console.log(`风格: ${style.primaryStyle} | ${style.mood} | ${style.genre} | ${style.pacing} | 色彩: ${style.colorPalette.join(",")}`);
  const r3 = await skill.generate({ mode: "video-storyboard", request: "生成5镜头分镜", enableExpression: true, fileContent: text, styleAnalysis: style });
  for (const p of r3.generatedPrompts) console.log(`[${p.title}]\n  ${p.prompt.slice(0, 300)}...\n`);
  console.log("✅ 完成");
}
run().catch(e => { console.error(e); process.exit(1); });
