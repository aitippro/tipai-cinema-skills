# TipAi Skills

AI Skill 模块集。Agent 加载后直接用自身 AI 能力执行，零代码、零依赖。

---

## Skills

| Skill | 应用场景 | 核心能力 |
|-------|---------|---------|
| **director-storyboard** | AI 漫剧 / AI 短剧 | 剧本→分镜提示词：角色分析、镜头拆解、连续性检查 |
| **prompt-lifecycle** | 长线视频创作 | 提示词生命周期：角色锁定、场景复用、版本管理、快照 |
| **tpema-expression** | 数字人 / 虚拟主播 | 标点→FACS AU + 语气语速 + 视线控制 + Perlin 微表情 |
| **multimodal-prompt** | 通用多模态 | 文生图 / 图生文 / 视频分镜提示词模板 |

---

## 长视频创作方案

长线创作（漫剧/短剧）的核心挑战：
1. **人物一致性** — 100+ 镜头中角色外貌不变
2. **场景复用** — 同一场景跨镜头跨集复用
3. **版本管理** — 迭代不丢失历史
4. **称谓不乱** — 角色名/别名/标签体系

推荐加载顺序：
```
director-storyboard  →  剧本拆解、角色场景提取
prompt-lifecycle     →  版本管理、角色锁定、快照备份
tpema-expression     →  人物表情控制（说话场景）
multimodal-prompt    →  通用提示词模板
```

---

## 使用

```
将 .md 文件加载到你的 Agent
→ Agent 按 Skill 指令工作
→ 无需 API Key / 无需安装 / 无需代码
```
