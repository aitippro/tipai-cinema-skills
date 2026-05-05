# TipAi Skills

可复用的 AI 技能模块集合 — 从 TipAi 桌面应用中提取的独立功能包。

## 技能列表

### 🎨 多模态提示词引擎 (`packages/multimodal`)

AI 驱动的多模态提示词生成，支持：
- **文生图** — 为 DALL-E / Midjourney / Stable Diffusion 生成优化提示词
- **图生文** — 图像分析、描述、OCR 提示词
- **视频分镜** — 专业分镜脚本 + 表情控制指令
- **文件解析** — .txt / .docx / .pdf → 文本 + 风格分析
- **风格分析** — 本地启发式算法检测色彩、情绪、叙事节奏

```typescript
import { generateMultimodalPrompt, getMultimodalModes } from "tipai-skills/multimodal";

const result = await generateMultimodalPrompt(
  "一只穿宇航服的猫在月球漫步", 
  "text-to-image",
  "deepseek-chat", 
  "sk-xxx",
  myAICaller  // 实现 AICaller 接口
);
```

### 🎭 TPEMA 表情控制引擎 (`packages/expression`)

文本驱动数字人面部微表情引擎（Text-Prompt Expression Micro-Animation）：
- **情绪分析** — 双语三级词典，≥120 词条，贪心整词匹配
- **标点→AU 映射** — ，→AU1+2 挑眉；？→AU1+2+AU5 惊讶；！→AU20+AU5+AU12
- **5 种缓动曲线** — linear / easeInOut / elasticOut / backOut / sineInOut
- **30fps 时间轴** — 逐标点插值 + AU 状态 + 视线机
- **Perlin 噪声** — 确定性微扰动，消除机械感
- **4 种导出** — JSON / CSV / FACS-XML / Prompt-Text

```typescript
import { DEFAULT_EXPRESSION_CONTROL, DEEPSEEK_OPTIMIZED_EXPRESSION } from "tipai-skills/expression";
```

### 👁️ AI 视觉分析 (`packages/ai-vision`)

统一的 AI Vision API 客户端接口：
- 支持 OpenAI / Claude / Gemini Vision API
- 自定义 AI 调用器注入

## 安装

```bash
npm install @tipai/skills
```

## 许可证

非商业使用许可 — 个人免费使用，禁止商业使用/转售。
详见 [LICENSE](LICENSE.md)
