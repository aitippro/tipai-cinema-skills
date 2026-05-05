# TipAi Cinema Skills

源自 [TipAi](https://github.com/aitippro/TipAi) 桌面版多模态引擎迁移的 AI Skill + 验证工具集。

**Skill (指令)** → Agent 生成内容  
**Validator (代码)** → 真实校验，发现不一致自动报告

---

## Skills

| Skill | 说明 |
|-------|------|
| **[ai-video-studio.md](skills/ai-video-studio.md)** | 一站式 6 步创作工作流 |

## 验证器

| 工具 | 说明 |
|------|------|
| **[check-shots.js](validator/check-shots.js)** | 镜头一致性校验 (角色引用/场景/时长/景别/完整性) |

```bash
node validator/check-shots.js examples/shots-example.json --project examples/project.json
```

## 示例

| 文件 | 说明 |
|------|------|
| [project.json](examples/project.json) | 项目示例 (2角色, 2场景) |
| [shots-example.json](examples/shots-example.json) | 镜头示例 (4镜头, 100%通过质检) |

## 来源

由 **TipAi v1.0** 桌面应用的 TPEMA 表情引擎 + 多模态提示词引擎 + 提示词生命周期管理提炼迁移。

> TipAi 是本地优先的全链路 AI 提示词工程桌面工具（React + Electron + Rust），详见 [TipAi 主仓库](https://github.com/aitippro/TipAi)。
