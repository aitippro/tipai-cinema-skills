<div align="center">

<img src="https://raw.githubusercontent.com/aitippro/TipAi/main/public/logo.png" width="80" />

# 🎬 TipAi Cinema Skills

**AI 视频创作 Skill 模块集**

[![License](https://img.shields.io/badge/License-NonCommercial-red?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-5-blue?style=flat-square)](skills/)
[![Validator](https://img.shields.io/badge/Validator-10_rules-green?style=flat-square)](validator/check-shots.js)

源自 [TipAi](https://github.com/aitippro/TipAi) 桌面版 TPEMA 引擎迁移 · Agent 加载即用 · 零依赖

</div>

---

## 🧠 架构

```
  skills/ai-video-studio.md  ──→  Agent 加载 Skill 指令
         │
         ▼
  Agent 生成镜头提示词 (自带 AI)
         │
         ▼
  validator/check-shots.js  ──→  10 条规则真实校验
         │
         ▼
  ✅ 通过 / ⚠ 警告 / ❌ 自动修复
```

**Skill** = 给 Agent 看的指令，告诉它怎么拆剧本、锁角色、设计过渡  
**Validator** = 真实运行的代码，检查生成结果是否一致

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

### 10 条规则

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
│   └── ai-video-studio.md      ← 🎯 主 Skill (加载这个)
├── validator/
│   └── check-shots.js           ← 🛡️ 10 条质检规则
├── examples/
│   ├── project.json             ← 示例项目 (2角色 2场景)
│   ├── shots-example.json       ← 示例镜头 (100%通过)
│   └── context-table.json       ← 完整上下表示例
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
<sub>非商业使用许可 · TipAi Team © 2026</sub>
</div>
