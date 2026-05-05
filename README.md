<div align="center">

<img src="https://raw.githubusercontent.com/aitippro/TipAi/main/public/logo.png" width="80" />

# 🎬 TipAi Cinema Skills

**AI 视频创作 Skill 模块集**

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-7-blue?style=flat-square)](skills/)
[![Validator](https://img.shields.io/badge/Validator-19_rules-green?style=flat-square)](validator/check-shots.js)
[![CI](https://img.shields.io/badge/CI-validate-blue?style=flat-square)](.github/workflows/test.yml)

源自 [TipAi](https://github.com/aitippro/TipAi) 桌面版 TPEMA 引擎迁移 · Agent 加载即用 · 零依赖

</div>

---

## 🧠 架构

```
  skills/ai-video-studio.md  ──→  Agent 加载 Skill 指令
         │
         ▼
  skills/micro-detail-injection.md  ──→  10维度物理级参数注入
         │
         ▼
  Agent 生成镜头提示词 (自带 AI)
         │
         ▼
  skills/cross-audit.md  ──→  5层交叉审计 (自一致性→完整性→物理→引用→可合成)
         │
         ▼
  ✅ 审计通过 → 交付用户 / ❌ 自动修复 → 重新审计
         │
         ▼
  validator/check-shots.js  ──→  19 条规则真实校验
```

**Skill** = 给 Agent 看的指令，告诉它怎么拆剧本、锁角色、设计过渡  
**Validator** = 真实运行的代码，检查生成结果是否一致

### 🔗 Skill 协作关系

```
用户贴剧本
  │
  ▼
ai-video-studio.md  ← 🎯 主入口，串联全流程
  │
  ├── Step 1-2: 剧本分析 + 角色锁定
  │     └── 引用 prompt-lifecycle.md 的 Character/Scene schema
  │
  ├── Step 3: 上下文表 + 过渡设计
  │     └── 自建连续性表，7种过渡类型
  │
  ├── Step 4: 镜头拆解
  │     └── 调用 director-storyboard.md 的拆解规则和景别/运镜表
  │
  ├── Step 5: 表情注入
  │     └── 调用 tpema-expression.md 的标点→AU映射 + 视线状态机
  │
  └── Step 6: 质检
        ├── Skill 层: 上下文表交叉对比
        └── 代码层: validator/check-shots.js ← 16条规则真实校验
              │
              └── 最终提示词通过 multimodal-prompt.md 输出 (4变体/3角度/3格式)
```

---

## 🔬 极致细节模式 (v4 新增)

激活: 用户说"极致"、"extreme detail"、"10维" 或加载 micro-detail-injection.md 后自动启用。

**标准模式 vs 极致模式 — 同一个镜头 SHOT_001 的提示词对比:**

```
标准:  "ECU of hands around cup. Warm amber light, soft bokeh. Static." (15词)

极致:  "ECU. LIGHTING: 4200K key@45°/30° china_silk(grid_60), key:fill 3:1, 
        rim sep 45°, shadow 0.3. CAMERA: ARRI_Alexa_35 S35, UltraPrime_85mm @ T1.4, 
        ISO 800, shutter 180°, tripod, H130cm D40cm. CHAR: HAIR #1a1a1a 25cm 
        straight flyaway0.2; SKIN #f5f0e8 fine_pores SSS[cheek,nose,ear]; 
        EYES iris#4a2810 ct_window_rect lash_medium; HANDS nail2mm #c48a7c. 
        FACS: AU1=0.05 AU2=0.02 AU4=0.05... (23 values). ACTION: thumbTrace 
        0.3cm/s arc, steamWobble 0.8Hz. ATMOSPHERE: steam+dust dens0.15 
        rising-swirling, vol0.6. COLOR: Kodak2383 LUT, grain2.5%, sat 
        R1.05 G0.95 B0.90. POST: fine_grain 2.5%, halation0.1, CA0.3px. 
        ✅ 交叉审计通过 → 交付" (140+词, 10维全填充)
```

**信息密度: 50x 提升，所有描述从标签级升级为物理量级。**

### 10 维度参数

| 维度 | 参数示例 |
|------|---------|
| D1 灯光物理 | 4200K, 45°/30°, china_silk, 3:1, shadow 0.3 |
| D2 摄影机物理 | ARRI Alexa 35, 85mm @ T1.4, ISO 800, 180° |
| D3 角色解剖 | 头发/皮肤/眼睛/手部/服装 hex值+物理参数 |
| D4 表情 FACS | 23 AU × 强度值 + blink/pupil/breathing/head pose |
| D5 动作微运动 | 速度cm/s, 轨迹, 频率Hz, 振幅cm, 重量感 |
| D6 大气环境 | 粒子类型+density, 对流模式, 体光强度 |
| D7 色彩科学 | LUT, grain%, sat曲线, 对比度, 暖冷比 |
| D8 材质属性 | roughness/specularity/SSS/fresnel/metallic |
| D9 视听同步 | 声源位置, 混响, viseme序列, 环境音 |
| D10 后期处理 | grain type+%, halation, CA, vignette, gate weave |

### 5 层交叉审计

```
生成 → Audit1(自一致性) → Audit2(维度完整) → Audit3(物理合理) 
    → Audit4(引用完整) → Audit5(可合成性) → ✅交付 / ❌修复→重审
```

---

## 🎯 核心 Skill

📂 **[ai-video-studio.md](skills/ai-video-studio.md)** — 加载这一个就够了

```
剧本分析 → 角色锁定 → 上下文表 → 逐镜生成 → 过渡设计 → 连续性校验
```

### 内置能力

| 模块 | 说明 |
|------|------|
| 🔍 剧本分析 | 提取角色(外貌/性格/关键特征)、场景(光线/色调/时间) |
| 🔒 角色锁定 | 恒定特征(≥3项)跨镜头不变，用 `[CHAR_XX]` 引用 |
| 📋 上下文表 | 跨镜状态跟踪：位置→情绪→光线→时间线 |
| ✂️ 镜头拆解 | 景别 5 级 + 运镜 7 种 + 对话切分规则 |
| 🎞️ 过渡设计 | 7 种过渡类型：切/匹配剪辑/动作衔接/L-Cut/跟随转场... |
| 😊 表情注入 | 标点→FACS AU + 语速 + 视线状态机 |
| ✅ 一致性校验 | 10 条规则自动检查 |

---

## 🛡️ 验证器

```bash
node validator/check-shots.js examples/context-table.json --project examples/project.json

# 可选参数:
#   --json      输出 JSON 格式
#   --verbose   显示规则说明 + 通过镜头
```

```
  质检报告
  ════════
  总镜头: 4
  ✅ 通过: 3
  ⚠ 警告: 1     ← SHOT_003 人物入场缺少过渡说明
  ❌ 错误: 0
  通过率: 75%
```

### 16 条规则

| # | 规则 | 类型 |
|---|------|------|
| 1 | 镜头 ID 唯一性 | 错误 |
| 2 | 角色引用有效性 | 错误 |
| 3 | 场景引用有效性 | 错误 |
| 4 | 时长合理性 | 警告/错误 |
| 5 | 景别连续重复 ≤3 | 警告 |
| 6 | 提示词要素完整性 | 警告 |
| 7 | 相邻镜头过渡定义 | 警告 |
| 8 | 人物状态承接 | 警告 |
| 9 | 同场景光线渐变 ≤±3° | 警告 |
| 10 | 场景切换过渡说明 | 警告 |
| 11 | 角色关键特征一致性 | 错误 |
| 12 | 同场景空间连续性 | 警告 |
| 13 | 情绪转折合理性 | 警告 |
| 14 | 节奏（紧张场景时长） | 警告 |
| 15 | 版本号格式 (semver) | 警告 |
| 16 | 引用完整性 (dangling ref) | 错误 |

---

## 📖 使用教程

### 场景：用户贴了一段小说，想做成 AI 短剧

**Step 1: 加载 Skill**

将 `skills/ai-video-studio.md` 的内容复制给 Agent，或直接告诉 Agent：

> "加载 https://github.com/aitippro/tipai-cinema-skills/blob/main/skills/ai-video-studio.md 这个 Skill"

**Step 2: 贴剧本**

```
分析这个剧本，按 Skill 工作流处理：

她推开咖啡馆的木门，门上的铜铃发出清脆的声响。
午后的阳光斜斜地洒进来，给每一张木桌镀上一层金色。
她扫视了一圈——角落里的位置还空着，
那是他们第一次见面时坐的地方。

她深吸一口气，走向角落。
指尖轻轻划过沿途的桌面，仿佛在触摸记忆。
坐下的瞬间，她的眼眶微微泛红，
嘴角却扬起一抹若有若无的笑。

门外，一个人影停住了脚步。
他的手指悬在铜铃上方，迟迟没有推开。
```

**Step 3: Agent 自动执行 6 步工作流**

Agent 会按 Skill 指令依次执行：

| 步骤 | Agent 做什么 | 输出 |
|------|-------------|------|
| 1. 剧本分析 | 提取角色、场景、情感曲线 | 角色表 + 场景表 |
| 2. 角色锁定 | 为每个角色建立档案 | `[CHAR_01]` 锁定描述 |
| 3. 镜头拆解 | 逐段拆为镜头序列 | 编号镜头清单 |
| 4. 提示词生成 | 每个镜头输出 AI 视频提示词 | 英文 prompt |
| 5. 表情注入 | 对话镜头注入标点→AU 映射 | 表情控制数据 |
| 6. 连续性校验 | 交叉检查角色/场景/光线 | 质检报告 |

**Step 4: 触发生成**

当剧本分析完成、角色锁定后，用户可以逐镜头触发生成：

```
生成镜头 1-5 的提示词
```

或批量：

```
拆解全部镜头，生成所有提示词，然后质检
```

**Step 5: 验证输出**

将 Agent 生成的 JSON 保存为 `my-shots.json`，运行验证器：

```bash
node validator/check-shots.js my-shots.json --project my-project.json
```

---

## 🚀 快速开始

```bash
git clone https://github.com/aitippro/tipai-cinema-skills.git
```

1. 将 `skills/ai-video-studio.md` 加载到你的 Agent
2. Agent 按 Skill 指令处理你的剧本
3. 用 `node validator/check-shots.js` 检查输出质量

---

## 📂 目录

```
tipai-cinema-skills/
├── skills/
│   ├── ai-video-studio.md          ← 🎯 主 Skill v4 (加载这个)
│   ├── micro-detail-injection.md   ← 🔬 10维度物理级参数引擎 (NEW)
│   ├── cross-audit.md              ← 🔍 5层交叉审计引擎 (NEW)
│   ├── director-storyboard.md      ← ✂️ 分镜引擎
│   ├── multimodal-prompt.md        ← 🎨 多模态提示词 (含极致模式)
│   ├── prompt-lifecycle.md         ← 📦 生命周期 & 统一 Schema
│   └── tpema-expression.md         ← 😊 TPEMA 表情引擎 v2 (25+ AU)
├── validator/
│   └── check-shots.js              ← 🛡️ 19 条质检规则
├── .github/workflows/
│   └── test.yml                    ← 🤖 CI 自动校验
├── examples/
│   ├── project.json                ← 示例项目 (2角色 2场景)
│   ├── shots-example.json          ← 标准模式示例镜头
│   ├── context-table.json          ← 上下文表示例 (含过渡/状态)
│   └── extreme-shot.json           ← 极致细节单镜头示例 (NEW)
└── README.md
```

---

## 📜 来源

由 **TipAi v1.0** 桌面应用的核心引擎迁移提炼：

> TipAi 是本地优先的全链路 AI 提示词工程桌面工具
> React 19 · Electron 41 · Rust NAPI-RS · AES-256-GCM
> [github.com/aitippro/TipAi](https://github.com/aitippro/TipAi)

---

<div align="center">
<sub>MIT License · TipAi Team © 2026</sub>
</div>
