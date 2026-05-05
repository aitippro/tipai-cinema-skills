# Skill: AI 视频创作工作室

一站式剧本→AI视频工作流。加载此 Skill 即可获得完整创作管线。

---

## 工作流概览

```
用户上传剧本/小说
  ↓
Step 1  剧本分析 → 角色档案 + 场景清单 + 视觉风格
  ↓
Step 2  角色锁定 → 外貌描述锁定、生成参考提示词
  ↓
Step 3  镜头拆解 → 每段→多个镜头(含景别/运镜/时长)
  ↓
Step 4  提示词生成 → 每镜头：视频提示词 + 负面提示词
  ↓
Step 5  表情注入 → 对话镜头自动注入 FACS AU+语气+语速
  ↓
Step 6  版本管理 → 迭代不丢失、可回滚、可快照
```

---

## Step 1: 剧本分析

阅读用户文本，输出结构化分析报告。

### 输出格式
```markdown
## 剧本分析

### 角色
| ID | 名称 | 外貌 | 性格 | 关键特征 |
|----|------|------|------|---------|
| CHAR_01 | [名] | [描述] | [标签] | [独特标记] |

### 场景
| ID | 名称 | 地点 | 时间 | 光线 | 色调 |
|----|------|------|------|------|------|
| SCENE_01 | [名] | [描述] | [时间] | [光线] | [色调] |

### 视觉风格
- 风格: [写实/赛博朋克/日系/水墨/...]
- 色调: [暖/冷/高饱和/低饱和]
- 宽高比: [16:9 / 9:16 / 21:9]
```

---

## Step 2: 角色锁定

为每个角色创建锁定档案。锁定后所有镜头使用 `[CHAR_01]` 引用，保证 100% 外貌一致。

### 角色档案模板
```
【CHAR_01】张三
外貌: 男, 28岁, 瘦削180cm, 方脸浓眉单眼皮, 黑色短发偏分微卷, 左颊浅疤
服装: 黑色风衣+白衬衫+深灰长裤
关键特征: 左颊浅疤, 额前卷发

参考提示词: "Male, 28yo, East Asian, lean build, square jaw, thick eyebrows, 
  monolid eyes, short black wavy hair side-parted, pale skin, faint scar on 
  left cheek. Black trench coat over white button-up, dark gray trousers. 
  Cinematic portrait, 85mm lens, soft lighting."

负面提示词: "beard, glasses, different hair color, western features, muscular build"
```

### 锁定规则
- 锁定后外貌不可改，修改=创建新版本+
- 所有镜头引用 `[CHAR_01]` 而非文字描述
- 版本号: `CHAR_01 v1.0 → v1.1(微调) → v2.0(重新设计)`

---

## Step 3: 镜头拆解

按事件节点拆剧本为镜头序列。

### 拆解规则
- 动作变化 → 新镜头
- 情绪转折 → 新镜头
- 场景切换 → 新镜头
- 对话超15秒 → 切镜头
- 长对话 → 2-3个不同景别交替

### 景别参考
| 景别 | 英文 | 用途 |
|------|------|------|
| EWS 大远景 | Extreme Wide | 环境建立 |
| WS 全景 | Wide | 场景+全身 |
| MS 中景 | Medium | 膝盖以上 |
| CU 近景 | Close-up | 胸部以上 |
| ECU 特写 | Extreme CU | 面部/细节 |

### 运镜参考
| 运镜 | 效果 |
|------|------|
| Static 固定 | 稳定观察 |
| Push in 推 | 关注聚焦 |
| Pull out 拉 | 揭示环境 |
| Pan 摇 | 场景扫描 |
| Tracking 跟 | 跟随运动 |
| Handheld 手持 | 紧张/真实感 |

### 拆解输出
```
【镜头 001】 5s | MS | Static
角色: [CHAR_01]
场景: SCENE_01
内容: 张三推门进入咖啡馆，环顾四周
情绪: 平静

【镜头 002】 3s | ECU | Push in
角色: [CHAR_01]
场景: SCENE_01
内容: 张三的眼睛特写，缓慢推进，眼中闪过一丝犹豫
情绪: 犹豫
```

---

## Step 4: 提示词生成

每个镜头输出 AI 视频生成提示词。

### 提示词模板
```
[SHOT_001] 5s | MS | Static
[CHAR_01] in SCENE_01 interior. [CHAR_01] pushes open cafe door, 
brass bell rings. He scans the room slowly. Warm amber afternoon 
light, dust particles floating. Photorealistic, 24fps, cinematic 
color grading, 8k quality.
--char [CHAR_01]
--scene SCENE_01
```

### 提示词要素清单
每镜头必须包含:
- [x] 角色引用 `[CHAR_XX]`
- [x] 场景引用 `SCENE_XX`
- [x] 动作描述
- [x] 光线/色彩
- [x] 镜头运动
- [x] 时长
- [x] 情绪/氛围
- [x] 风格标签

### 不同 AI 工具适配
| 工具 | 最佳时长 | Prompt 长度 | 注意事项 |
|------|---------|------------|---------|
| Runway Gen-3 | 4-10s | 200-400词 | 指定 motion/camera |
| Pika Labs | 2-5s | 100-200词 | 支持图生视频 |
| Kling | 5-10s | 150-300词 | 中文友好 |
| Sora | 10-60s | 300-500词 | 需详细场景 |
| Luma Dream | 2-5s | 100-250词 | 风格迁移强 |

---

## Step 5: 表情注入（对话镜头）

对话/独白镜头自动注入 TPEMA 表情控制。

### 标点→表情映射
| 标点 | FACS AU | 强度 | 视线 | 语速 | 语气 |
|------|---------|------|------|------|------|
| `，` | AU1+2 内眉微抬 | 0.3 | FOCUS | 1.0x | 平 |
| `。` | AU1+2 回落 | 0.15 | FOCUS | 0.9x | 降 |
| `？` | AU1+2+AU5 眉抬+睁眼 | 0.75 | EMPHASIS | 1.1x | 升 |
| `！` | AU20+AU5+AU12 咧嘴+睁眼+嘴角 | 0.85 | EMPHASIS | 1.2x | 升+颤 |
| `…` | AU1+2 轻抬眉 | 0.4 | AVOID | 0.5x | 降+飘 |
| `；` | AU1+2+AU4 抬眉+皱眉 | 0.55 | SCAN | 1.0x | 平 |

### 视线状态机
```
FOCUS ─(！)→ EMPHASIS ─(。)→ FOCUS
FOCUS ─(？)→ EMPHASIS ─(。)→ FOCUS
FOCUS ─(…)→ AVOID ───(。)→ FOCUS
```

### 对话注入示例
```
[SHOT_042] 5s | CU | Push in
[CHAR_02] speaking: "你还记得...那天吗？"
Expression: 
  "…" → AVOID, AU1+2 0.4, 语速0.5x, 音量-3dB
  "？" → EMPHASIS, AU1+2+AU5 0.75, 语速1.1x, 音量+2dB
[CHAR_02] close-up, eyes drifting away then snapping back.
Soft warm light, shallow depth of field, 85mm.
```

---

## Step 6: 版本管理

### 版本规则
| 变化 | 版本 | 说明 |
|------|------|------|
| 表情微调 | v1.0→v1.1 | minor |
| 动作修改 | v1.1→v1.2 | minor |
| 重新生成 | v1.0→v2.0 | major |
| 角色更新 | v2.0→v3.0 | major |

### 输出快照
每集完成或每天收工时:
```markdown
## 项目快照 2026-05-05
- 角色: CHAR_01 v1.0 CHAR_02 v1.2
- 场景: SCENE_01 v1.0 SCENE_02 v1.0
- 镜头: 042个 | 已审核:30个 | 待审:12个
- 当前版本: v1.5
```

---

## 快速命令

用户可以用自然语言触发各步骤:

- "分析这个剧本" → Step 1
- "锁定角色 CHAR_01" → Step 2
- "拆解第3幕" → Step 3
- "生成镜头 1-10 的提示词" → Step 4
- "给镜头 42 加表情控制" → Step 5
- "快照当前项目" → Step 6
- "对比镜头 5 的 v1 和 v2" → 版本对比
- "回滚到昨天的快照" → 恢复
- "导出所有提示词为 CSV" → 导出
