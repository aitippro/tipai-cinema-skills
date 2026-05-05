# Skill: 多模态提示词生成 v2

文生图、图生文、视频分镜的专业提示词生成引擎。加载此 Skill 后，Agent 可针对不同模态和目标工具自动生成最优提示词。

---

## 核心机制：模态路由

```
用户输入
  ├── 纯文本描述 → 文生图管线 (4 变体)
  ├── 文本 + 参考图 → 风格分析 → 文生图管线
  ├── 图片 → 图生文管线 (3 角度)
  └── 创意/小说/剧本 → 视频分镜管线
```

所有输出提示词中，角色/场景引用统一使用 `[CHAR_XX]` / `[SCENE_XX]` 体系。

---

## 管线 1: 文生图

### 输入
用户提供视觉描述文本；可附带参考图（风格/构图/色彩参考）。

### 工作流
```
解析描述 → 提取主体/场景/光线/风格/情绪
   ↓
如有参考图 → 分析视觉风格 (色彩分布/构图/纹理)
   ↓
生成 4 种风格变体 → 每变体含完整提示词 + 参数
   ↓
返回变体清单，用户选择后生成
```

### 4 变体模板

#### 变体 A: 写实电影感 (Photorealistic Cinematic)
```
Title: [场景名] — 写实电影
Prompt: "[主体描述], [动作/姿态], [光线/氛围]. [场景描述]. Photorealistic, cinematic color grading, 85mm lens, shallow depth of field, 8k resolution, highly detailed skin texture, natural lighting."
Negative Prompt: "cartoon, anime, illustration, 3d render, low quality, blurry, distorted face, extra limbs, watermark, text"
Parameters: --ar 16:9 --style raw --stylize 150
Best for: 真人短剧、电影关键帧、现实题材
```

#### 变体 B: 日系动画 (Anime Style)
```
Title: [场景名] — 日系动画
Prompt: "[主体描述], [动作/姿态], [光线/氛围]. [场景描述]. Anime style, Makoto Shinkai aesthetic, clean lines, vibrant colors, cel shading, volumetric lighting, studio quality, 8k."
Negative Prompt: "realistic, photorealistic, western cartoon, 3d, blurry, deformed, extra fingers, watermark"
Parameters: --ar 16:9 --niji 5 --style expressive --stylize 200
Best for: 动漫短剧、日系MV、轻小说改编
```

#### 变体 C: 水墨国风 (Ink Wash Painting)
```
Title: [场景名] — 水墨国风
Prompt: "[主体描述], [动作/姿态], [光线/氛围]. [场景描述]. Traditional Chinese ink wash painting style, sumi-e, watercolor texture, rice paper background, minimalist, poetic atmosphere, flowing brushstrokes, elegant composition."
Negative Prompt: "oil painting, western style, photorealistic, 3d, thick paint, colorful, busy composition"
Parameters: --ar 16:9 --style raw --stylize 100
Best for: 古风短剧、诗词可视化、国风漫画
```

#### 变体 D: 赛博朋克 (Cyberpunk / 风格化)
```
Title: [场景名] — 赛博朋克
Prompt: "[主体描述], [动作/姿态]. [场景描述]. Cyberpunk aesthetic, neon lights, rain-slicked streets, holographic displays, high contrast, blue and magenta color palette, volumetric fog, blade runner style, cinematic, 8k."
Negative Prompt: "natural landscape, daylight, warm colors, rural, vintage, medieval, low contrast"
Parameters: --ar 16:9 --style raw --stylize 300
Best for: 科幻短剧、都市夜景、反乌托邦题材
```

### 参考图风格分析（有图时先执行）

```
## 参考图分析
- 色彩分布: [主色/辅色/点缀色 + 占比]
- 饱和度: [高/中/低] → 影响 --stylize 参数
- 对比度: [高/中/低] → 影响 lighting 描述
- 构图: [三分法/中心/对角线/框架] → 影响 prompt composition
- 纹理: [光滑/粗糙/颗粒/水彩] → 影响 style 词
- 光线: [方向/色温/软硬] → 注入 lighting 描述
- 景深: [浅/深] → 影响 DOF 参数

→ 上述特征自动注入 4 变体的 prompt 和 parameters
```

---

## 管线 2: 图生文

### 输入
用户上传一张或多张图片。

### 工作流
```
图片 → 多模态视觉分析 → 3 角度输出
```

### 角度 A: 详细描述 (Detailed Description)
用于：为图片生成精确的文字描述，方便后续编辑或索引。

```markdown
## 角度 A: 详细描述

### 主体
- 人物: [数量/性别/年龄/外貌/服装/姿态/表情]
- 物体: [类别/材质/颜色/状态/位置]

### 场景
- 地点: [室内/室外 + 具体类型]
- 时间: [白天/夜晚/黄昏 + 判断依据]
- 光线: [方向/色温/强度 + 高光/阴影描述]

### 构图
- 视角: [平视/俯视/仰视]
- 景别: [EWS/WS/MS/CU/ECU]
- 景深: [浅(背景虚化)/深(全景清晰)]
- 引导线: [如有]

### 色彩
- 主色调: [色名 + 色相范围]
- 饱和度: [高/中/低]
- 对比度: [强/弱]

### 情绪
- 氛围: [1-3 词]
- 情感倾向: [正面/负面/中性/复杂]

### 英文描述 (可用于反向生成)
"A highly detailed description of [场景]. [主体]. [光线]. [构图]. [情绪]."
```

### 角度 B: 结构化分析 (Structured Analysis)
用于：入库检索、跨项目匹配、风格复现。

```json
{
  "analysisType": "structured",
  "subject": {
    "humans": [{"count": 1, "gender": "female", "age": "25-30", "pose": "sitting", "expression": "pensive"}],
    "objects": [{"type": "coffee cup", "material": "ceramic", "color": "white"}],
    "primaryFocus": "human face"
  },
  "scene": {
    "location": "cafe",
    "timeOfDay": "afternoon",
    "lightDirection": "window side-light",
    "lightColorTemp": 3200,
    "lightQuality": "soft diffused"
  },
  "composition": {
    "aspectRatio": "16:9",
    "shotType": "MS",
    "cameraAngle": "eye level",
    "depthOfField": "shallow",
    "ruleOfThirds": true,
    "headroom": "proper"
  },
  "color": {
    "palette": ["#8B6914", "#D2B48C", "#FFF8DC"],
    "saturation": "medium",
    "contrast": "medium-high",
    "dominantHue": "warm amber"
  },
  "style": {
    "genre": "cinematic realism",
    "era": "contemporary",
    "texture": "smooth with film grain",
    "referenceVibes": ["Wong Kar-wai", "cafe scene"]
  },
  "technical": {
    "estimatedLens": "85mm",
    "estimatedAperture": "f/1.4-f/2.8",
    "sensorFormat": "full frame"
  }
}
```

### 角度 C: 创意解读 (Creative Interpretation)
用于：寻找灵感、生成变体、叙事扩展。

```markdown
## 角度 C: 创意解读

### 此刻的故事
[以文学化语言描述图片中的瞬间，包括前因和可能的后续]

### 隐藏的细节
[3-5 个容易被忽略但富有意味的细节]

### 如果这是电影的一幕
- 这一幕的前一场戏: [描述]
- 这一幕的后一场戏: [描述]
- 配乐建议: [风格/乐器/节奏]
- 色彩叙事: [这个画面的色彩在讲什么]

### 3 种变体想象
1. 同一场景，不同光线: [描述]
2. 同一场景，不同年代: [描述]
3. 同一场景，不同风格: [描述]

### 一句话标签
"[年代]·[风格]·[情绪]·[标志性元素]"
```

---

## 管线 3: 视频分镜

### 输入
创意/小说/剧本文本。

### 工作流
```
文本 → 风格分析(色彩/情绪/节奏) → 分镜拆解 → 每镜头 3 种输出
```

### 风格分析（先于拆解）
```markdown
## 风格分析

### 视觉风格
- 色彩基调: [暖/冷/混合] — [主色系]
- 画面风格: [写实/日系/赛博朋克/水墨/美式/...]
- 宽高比: [16:9 / 21:9 / 9:16 / 4:3]
- 帧率: [24fps(电影) / 30fps(网络) / 12fps(动态漫)]

### 叙事节奏
- 整体: [快/慢/混合/渐强]
- 关键转折点: [1→2→3]

### 情感曲线
[开场情绪] → [中段情绪] → [高潮情绪] → [尾声情绪]
```

### 分镜拆解

对每段文本，按 director-storyboard.md 的拆解规则：
- 动作变化 → 新镜头
- 情绪转折 → 新镜头
- 场景切换 → 新镜头
- 对话 >15 秒 → 切镜头
- 连续镜头景别不超过 3 次重复

### 每镜头 3 种输出

#### 输出 A: 关键帧提示词 (Midjourney / SD / FLUX)
```
**SHOT_XXX [Xs | 景别 | 运镜]**
Prompt: "[英文提示词: 主体 + 场景 + 光线 + 构图 + 风格 + 质量标签]"
Negative: "[负面提示词]"
--ar 16:9 --style raw
```

#### 输出 B: 视频提示词 — 极致细节模式 (10维注入)

激活条件: 用户说"极致"、"extreme detail"、"micro-detail"、"10维" 或加载 micro-detail-injection.md 后自动启用。

每镜头输出格式 — 先结构化10维块，再合成自然语言:

```
━━ SHOT_{id} [{duration}s | {shotType} | {cameraMove} | ← {prev_id}] ━━

LIGHTING: {kelvin}K key@{az}°/{el}° {diffusion}({mat}), key:fill {ratio}, rim sep {sep}°, shadow {hard}, falloff {falloff}, {practicals} practicals

CAMERA: {body} {sensor}, {lens} @ {tStop}, ISO {iso}, shutter {angle}°, {stab}, H{height}cm D{dist}cm T{tilt}°

CHAR_{id}: HAIR #{color} {len}cm {texture} fly{flyaway}; SKIN #{tone} {texture} SSS[{zones}] oil{oil}; EYES iris#{iris} ct_{catchlight} lash_{density}; HANDS nail{mm}mm #{polish}; CLOTHING {fabric} wea{weave} dra{drape}

FACS: AU1={}...AU27={} (23 values) | BLINK:{bpm}bpm PUPIL:{mm}mm BREATH:{cpm}cpm | HEAD:p{p}° y{y}° r{r}° GAZE:{state}
  对话镜头附加 VISEME: [{time}:{phoneme}:{AU25}:{AU26}:{AU27}]...

ACTION: speed{cm/s}cm/s, {trajectory}, {Hz}Hz, {cm}cm amp, {accel}, weight{feel}

ATMOSPHERE: {particle} dens{density} size{um}μm, {convection}, humid:{humidity}, vol{volumetric}, AO{ao}

COLOR: LUT_{lut}, grain{grain}%, sat R{sr} G{sg} B{sb}, {contrast}:1, BP{bp}IRE WP{wp}IRE, {harmony}, {warm}%warm

MATERIAL: [{key_surfaces}: rough{0.x} spec{0.x} sss{0.x} fresnel{0.x} metal{0.x}...]

AUDIO: src[{x},{y},{z}]cm, reverb_{type} {ms}ms, ambient:"{ambient}"

POST: grain_{type} {grain%}%, halation{0.x}, CA{ca}px, distort{distortion}%, vignette{vignette}, gate{gate}px

SYNTHESIZED PROMPT:
"[所有10维度合成为连贯英文，100-400词]"

AUDIT: ✅L1:self-consistent ✅L2:all-10-dims ✅L3:physics ✅L4:refs ✅L5:synthesizable → DELIVER
```

#### 输出 B: 视频提示词 — 标准模式 (Quick Mode)

无极致细节要求时使用简化版:

```
**SHOT_XXX [Xs | 运镜 | 承接 SHOT_YYY]**
A [运镜] shot. [主体描述]. [动作描述]. [光线环境]. [氛围]. [风格词], [帧率], [质量标签].
Character refs: CHAR_XX ([恒定特征摘要])
Scene refs: SCENE_XX ([光线基准])
```

#### 输出 C: 动态漫提示词 (Anime / Motion Comic)
```
**SHOT_XXX [Xs | 景别 | 有限动画]**
Prompt: "[主体] in [场景], [动作]. Anime style, manga shading, cel animation, clean lines, limited animation, 2-3 layer parallax, [光线], 12fps."
Camera: Slow pan / subtle zoom / parallax scroll
Layers: [背景层] | [角色层] | [前景层]
```

### 批量输出模板
```json
{
  "project": "项目名",
  "style": {"palette": "暖木色", "genre": "日系清新", "fps": 24, "ratio": "16:9"},
  "shots": [
    {
      "id": "SHOT_001",
      "duration": 3,
      "shotType": "ECU",
      "cameraMove": "Static",
      "sceneId": "SCENE_01",
      "characters": ["CHAR_01"],
      "promptMJ": "ECU of CHAR_01 hands around coffee cup... --ar 16:9",
      "promptVideo": "A static shot. CHAR_01 hands... Photorealistic, 24fps.",
      "promptAnime": "ECU of hands on cup. Anime style, cel shading, 12fps."
    }
  ]
}
```

---

## 与其他 Skill 的协作

| 阶段 | 使用 Skill | 本 Skill 角色 |
|------|-----------|-------------|
| 角色/场景设计 | prompt-lifecycle.md | 不参与 — 由 LCM 锁定后注入 |
| 剧本拆解 | director-storyboard.md | 接收分镜序列，生成多格式提示词 |
| 连续性管理 | ai-video-studio.md | 注入 CHAR_XX / SCENE_XX 引用到 prompt |
| 表情注入 | tpema-expression.md | 对话镜头 prompt 中注入 AU 表情描述 |
| 质检 | validator/check-shots.js | prompt 完整性检查（要素清单） |

### 加载顺序
```
ai-video-studio.md (主入口)
  ├── 自动引用 director-storyboard.md (拆解)
  ├── 自动引用 tpema-expression.md (表情)
  ├── 自动引用 prompt-lifecycle.md (版本管理)
  └── 自动引用 multimodal-prompt.md (本 Skill — 最终提示词生成)
```

本 Skill 是管线的最后一步：把结构化的镜头数据转换为可直接粘贴到 AI 工具的最终提示词。

---

## 提示词要素检查清单

每个视频提示词输出前自检：

- [ ] 主体描述 (谁/什么)
- [ ] 动作描述 (干什么/怎么动)
- [ ] 光线/色彩 (氛围)
- [ ] 镜头运动 (推/拉/摇/跟/固定)
- [ ] 时长 (X 秒)
- [ ] 情绪/氛围词
- [ ] 风格词 (photorealistic / cinematic / anime / ink-wash)
- [ ] 分辨率/质量标签
- [ ] 角色引用 (CHAR_XX 或恒定特征摘要)
- [ ] 场景引用 (SCENE_XX 或光线基准)

---

## AI 工具参数速查

| 工具 | 最佳 Prompt 长度 | 时长 | 特色参数 |
|------|-----------------|------|---------|
| Runway Gen-3 | 200-400 词 | 4-10s | motion_bucket, camera |
| Pika Labs | 100-200 词 | 2-5s | image-to-video, motion |
| Kling | 150-300 词 | 5-10s | 中文友好, camera |
| Sora | 300-500 词 | 10-60s | 详细场景, 物理准确 |
| Luma Dream | 100-250 词 | 2-5s | 风格迁移强 |
| Jimeng | 50-150 词 | 2-5s | 字节系, 中文 |
| Midjourney | 50-200 词 | — | --ar --style --niji |
| SD/FLUX | 100-300 词 | — | CFG, steps, sampler |
| ComfyUI | 不限 | — | 节点式, AnimateDiff |

## 快速命令

"生成4变体" | "分析这张图" | "给我3个角度" | "生成视频分镜" | "导出所有提示词" | "转动态漫格式"
