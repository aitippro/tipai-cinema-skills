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

## 🧠 架构 (v5 — 自包含)

```
  用户贴剧本 + 说 "开始创作"
         │
         ▼
  skills/ai-video-studio.md  ← 🎯 单文件自包含 (加载这一个就够了)
         │
         ├── Step 1-2: 剧本分析 + 角色锁定 (内联全模板)
         ├── Step 3:   镜头拆解 (内联景别/运镜/过渡表)
         ├── Step 4:   逐镜生成 (内联10维度参数网格)
         ├── Step 5:   表情注入 (内联25+AU + 生理模型)
         └── Step 6:   交叉审计 (内联5层审计 + 19条质检)
               │
               ▼
         ✅ 审计通过 → 交付用户 / ❌ 自动修复 → 重审
               │
               ▼
         validator/check-shots.js  (代码层额外校验)
```

**v5 核心原则**: AI 加载一个文件就拥有全部运行所需数据，不再依赖外部引用。  
**Skill** = 给 AI 看的运行指令，每步有强制检查点，禁止跳步省略  
**Validator** = 真实运行的代码，检查生成结果是否一致  
**📚 参考手册** = 子 Skill 文件保留供深度查询，但 AI 运行时不需要加载

---

## 🔬 极致细节模式 (v5 默认启用)

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

## 🎯 核心 Skill (v5 自包含)

📂 **[ai-video-studio.md](skills/ai-video-studio.md)** — **只加载这一个就够了**

```
剧本分析 → 角色锁定 → 镜头拆解 → 逐镜10维生成 → FACS表情注入 → 5层交叉审计
```

### v5 新增特性

| 特性 | 说明 |
|------|------|
| 🔒 用户控制进入/退出 | AI 不会自动激活，用户说 "开始创作" 才进入，说 "结束创作" 才退出 |
| 📋 6个强制检查点 | 每步结束输出 [CHECKPOINT_N]，用户确认后才进入下一步 |
| 🚫 反偷懒铁律 | 禁止省略/跳步/空值/部分完成，违规则执行失败 |
| 📦 全内联自包含 | 10维度参数/AU表/审计规则全部写入主文件，不依赖外部引用 |
| 🔄 跨回合状态追踪 | 每回合输出当前进度状态块，AI 不会忘记做到哪一步 |

### 内置能力 (全部内联，无需加载其他文件)

| 模块 | 说明 |
|------|------|
| 🔍 剧本分析 | 提取角色(外貌/性格/特征)、场景(光线/色调/时间)、情感曲线 |
| 🔒 角色锁定 | 恒定特征(≥3项)跨镜头不变 + 微细节解剖档案(hair/skin/eyes/hands/clothing) |
| 📋 上下文表 | 跨镜状态跟踪：位置→情绪→光线→时间线→过渡承接 |
| ✂️ 镜头拆解 | 景别 5 级 + 运镜 7 种 + 过渡 7 种 + 5条拆解铁律 |
| 🔬 10维度生成 | D1灯光 D2摄影机 D3角色 D4表情 D5动作 D6大气 D7色彩 D8材质 D9音频 D10后期 |
| 😊 表情注入 | 标点→25+AU映射 + 情绪混合公式 + 生理模型(眨眼/瞳孔/呼吸/头部/视线) |
| ✅ 5层交叉审计 | 自一致性→维度完整→物理合理→引用完整→可合成 → ✅交付/❌修复重审 |

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

### 20 条规则

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
| 11 | 角色关键特征+解剖一致性 (跨镜对比) | 错误 |
| 12 | 同场景空间连续性 | 警告 |
| 13 | 情绪转折合理性 | 警告 |
| 14 | 节奏（紧张场景时长） | 警告 |
| 15 | 版本号格式 (semver) | 警告 |
| 16 | 引用完整性 (dangling ref) | 错误 |
| 17 | 微细节完整性 (非标签级) | 警告 |
| 18 | 对话镜头 FACS AU 向量注入 | 警告 |
| 19 | 交叉审计标记 | 信息 |
| 20 | 10维度完整覆盖检查 | 警告 |

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
git clone git@github.com:aitippro/tipai-cinema-skills.git
```

1. 将 `skills/ai-video-studio.md` 加载到你的 AI Agent
2. 对 AI 说 **"开始创作"** 然后贴入剧本
3. AI 会按 6 步工作流执行，每步有 `[CHECKPOINT_N]` 供你确认
4. 说 **"继续"** 进入下一步，说 **"暂停"** 保存状态，说 **"结束创作"** 退出
5. 可选：用 `node validator/check-shots.js` 检查输出质量

---

## 📂 目录

```
tipai-cinema-skills/
├── skills/
│   ├── ai-video-studio.md          ← 🎯 主 Skill v5 — 自包含，单文件加载即用
│   ├── micro-detail-injection.md   ← 📚 参考手册: 10维度参数引擎
│   ├── cross-audit.md              ← 📚 参考手册: 5层交叉审计
│   ├── director-storyboard.md      ← 📚 参考手册: 分镜引擎
│   ├── multimodal-prompt.md        ← 📚 参考手册: 多模态提示词 (含文生图/图生文)
│   ├── prompt-lifecycle.md         ← 📚 参考手册: 生命周期 & Schema
│   └── tpema-expression.md         ← 📚 参考手册: TPEMA 表情引擎
├── validator/
│   └── check-shots.js              ← 🛡️ 19 条质检规则 (代码层)
├── .github/workflows/
│   └── test.yml                    ← 🤖 CI 自动校验
├── examples/
│   ├── project.json                ← 示例项目 (2角色 2场景)
│   ├── shots-example.json          ← 标准模式示例镜头
│   ├── context-table.json          ← 上下文表示例 (含过渡/状态)
│   └── extreme-shot.json           ← 极致细节单镜头示例
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
