/**
 * 多模态引擎测试
 * 用法: DEEPSEEK_API_KEY=sk-xxx npx tsx scripts/test.ts
 */

import { createMultimodalSkill, analyzeStyle } from "../src/index";

const KEY = process.env.DEEPSEEK_API_KEY || "";
if (!KEY) { console.error("请设置 DEEPSEEK_API_KEY 环境变量"); process.exit(1); }

const skill = createMultimodalSkill({
  async chat({ system, user, temperature: t = 0.7 }) {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", temperature: t, max_tokens: 4000, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!r.ok) { console.error(`API ${r.status}`); return null; }
    const d = await r.json() as any;
    return d.choices?.[0]?.message?.content ?? null;
  },
});

async function run() {
  console.log("═".repeat(50) + "\n📸 文生图\n" + "═".repeat(50));
  const r1 = await skill.generate({ mode: "text-to-image", request: "一只穿宇航服的橘猫在月球表面漫步，超写实风格" });
  for (const v of r1.variants) console.log(`[${v.title}] ${v.prompt.slice(0, 200)}...\n`);

  console.log("═".repeat(50) + "\n🔍 图生文\n" + "═".repeat(50));
  const r2 = await skill.generate({ mode: "image-to-text", request: "分析产品海报的色彩搭配和视觉层次" });
  for (const v of r2.variants) console.log(`[${v.title}] ${v.prompt.slice(0, 200)}...\n`);

  console.log("═".repeat(50) + "\n🎬 视频分镜 + 风格分析\n" + "═".repeat(50));
  const text = "她推开木门，铜铃清脆作响。午后的阳光斜洒进来，给木桌镀上金色。她走向角落——那个位置空着，是第一次见面的地方。坐下的瞬间，眼眶微微泛红，嘴角却扬起若有若无的笑。";
  const style = analyzeStyle(text);
  console.log(`风格分析: ${style.primaryStyle} | ${style.mood} | ${style.genre} | ${style.pacing}`);
  const r3 = await skill.generate({ mode: "video-storyboard", request: "生成5镜头分镜脚本", expression: true, context: text, styleHint: `${style.primaryStyle} ${style.mood} ${style.pacing}` });
  for (const v of r3.variants) console.log(`[${v.title}] ${v.prompt.slice(0, 300)}...\n`);

  console.log("═".repeat(50) + "\n✅ 完成");
}
run().catch(e => { console.error(e); process.exit(1); });
