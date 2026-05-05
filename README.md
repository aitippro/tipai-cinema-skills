# TipAi Skills

独立可克隆的多模态提示词引擎。直接加载使用，零框架依赖。

## 快速开始

```bash
git clone https://github.com/aitippro/tipai-skills.git
cd tipai-skills
npm install
```

## 使用

```typescript
import { createMultimodalSkill, analyzeStyle, parseTextFile } from "tipai-skills"

// 1. 创建 skill 实例，注入 AI 调用器
const skill = createMultimodalSkill({
  ai: {
    async chat({ model, systemPrompt, userMessage, temperature }) {
      // 调用你的 AI 模型（DeepSeek / OpenAI / Claude / ...）
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model, temperature, max_tokens: 4000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      })
      const data = await res.json()
      return data.choices[0].message.content
    },
    // vision() 是可选的 — 支持图片分析
    async vision({ model, systemPrompt, userMessage, imageBase64 }) { ... }
  },
})

// 2. 生成提示词
const result = await skill.generate({
  mode: "text-to-image",        // "text-to-image" | "image-to-text" | "video-storyboard"
  request: "一只穿宇航服的橘猫在月球漫步",
  enableExpression: false,       // 视频分镜启用表情控制
  styleAnalysis: undefined,      // 可选：预计算的风格分析
  fileContent: undefined,        // 可选：参考文本内容
})
```

## 三种模式

| 模式 | 说明 | 推荐模型 |
|------|------|---------|
| `text-to-image` | 生成 4 种风格变体的图像生成提示词 | DALL-E 3 / Stable Diffusion / Midjourney |
| `image-to-text` | 生成 3 种角度的图像分析提示词 | GPT-4V / Claude 3 Vision |
| `video-storyboard` | 专业分镜脚本 + 可选表情控制 | Runway / Pika / Kling / Sora |

## 风格分析

```typescript
import { analyzeStyle } from "tipai-skills"

const style = analyzeStyle("她推开木门，铜铃清脆作响...")
// => { primaryStyle: "慢节奏抒情", colorPalette: ["金","红","白"], mood: "宁静", genre: "言情", pacing: "慢节奏" }
```

## 文件解析

```typescript
import { parseTextFile } from "tipai-skills"

const buffer = await fs.readFile("novel.txt")
const result = await parseTextFile(buffer.buffer, "novel.txt")
// => { text: "...", fileType: "txt", charCount: 1234 }
// 支持: .txt / .docx / .pdf
```

## 测试

```bash
DEEPSEEK_API_KEY=sk-xxx npm test
```

## 许可证

非商业使用许可 — 个人免费使用，禁止商业使用/转售。
