# 📚 参考手册: 提示词生命周期管理系统 (Prompt LCM)

> **本文件是参考手册。** ai-video-studio.md v5 已内联 Character/Scene schema、版本管理和存储结构要点，AI 运行时无需加载此文件。此文件保留供长线项目管理、多项目复用和快照策略参考。

---

## 核心概念

```
项目 (Project)
├── 角色库 (Character Library)
│   ├── 角色A (锁定版 v1.2)
│   └── 角色B (迭代中 v2.0)
├── 场景库 (Scene Library)
│   ├── 场景1: 咖啡馆
│   └── 场景2: 天台
├── 镜头序列 (Shot Sequence)
│   ├── 镜头 001 (已生成 → 待审核)
│   ├── 镜头 002 (已审核 → 已锁定)
│   └── 镜头 003 (v1 → v2 迭代中)
└── 项目快照 (Snapshot)
    └── 2026-05-05 全量备份
```

---

## 阶段 1: 角色设计 → 锁定

### 角色创建模板
```json
{
  "characterId": "CHAR_001",
  "name": "张三",
  "aliases": ["阿三", "三哥"],
  "version": "1.0",
  "status": "draft|locked|iterating",
  "profile": {
    "gender": "男",
    "age": 28,
    "build": "瘦削，180cm",
    "face": "方脸、浓眉、单眼皮、薄唇",
    "hair": "黑色短发，偏分，微卷",
    "eyes": "深棕色",
    "skin": "偏白，左颊有浅疤"
  },
  "wardrobe": {
    "default": "黑色风衣、白衬衫、深灰长裤、黑色皮鞋",
    "alternatives": ["灰色连帽卫衣、深蓝牛仔裤"]
  },
  "keyFeatures": "左颊浅疤、额前卷发",
  "referencePrompt": "Male, 28yo, East Asian, lean build, square jaw, thick eyebrows, monolid eyes, short black wavy hair side-parted, pale skin, faint scar on left cheek. Wearing black trench coat over white button-up, dark gray trousers. Cinematic portrait, 85mm lens, soft lighting.",
  "negativePrompt": "beard, glasses, different hair color, western features, muscular build",
  "generationHistory": [
    {"version": "0.1", "date": "2026-05-01", "result": "too gaunt, adjusting build"},
    {"version": "1.0", "date": "2026-05-03", "result": "approved"}
  ]
}
```

### 角色一致性规则
- **锁定后**: 所有提示词引用 `characterId` 而非描述文字
- **修改角色**: 创建新版本，旧版本保留用于已生成镜头
- **跨项目复用**: 从角色库加载，自动带入 referencePrompt + keyFeatures

---

## 阶段 2: 场景设计 → 锁定

### 场景创建模板
```json
{
  "sceneId": "SCENE_001",
  "name": "咖啡馆",
  "version": "1.0",
  "status": "locked",
  "environment": {
    "location": "老城区街角咖啡馆",
    "time": "下午 3 点",
    "lighting": "暖黄自然光 + 窗边逆光",
    "colorPalette": "暖木色、琥珀色、深棕",
    "props": "木桌、铜铃门、老式收银机、磨豆机"
  },
  "referencePrompt": "Cozy vintage cafe interior, corner location, afternoon sunlight streaming through large window, warm amber and wood tones. Brass bell on door, old register on counter. Soft bokeh background. Afternoon atmosphere, golden hour glow. 16:9 cinematic composition.",
  "negativePrompt": "modern, bright fluorescent lighting, white walls, empty room",
  "linkedCharacters": ["CHAR_001", "CHAR_002"]
}
```

### 场景规则
- 场景锁定后不可修改光线方向和色温基准
- 所有镜头必须在此基准上做 ±20% 变化
- 同一场景的不同时间(白天/夜晚)创建为独立版本

---

## 阶段 3: 剧本拆解 → 镜头序列

**输入**: 用户剧本/小说文本  
**输出**: JSON 镜头序列表

### 拆解流程
1. 逐段扫描剧本，标记事件节点
2. 每事件节点拆分为 1-N 个镜头
3. 为每镜头分配角色(引用 characterId)、场景(引用 sceneId)
4. 生成唯一 shotId

### 镜头模板
```json
{
  "shotId": "SHOT_042",
  "scriptRef": "第3幕第2段",
  "sceneId": "SCENE_001",
  "characters": ["CHAR_001", "CHAR_002"],
  "duration": 5,
  "shotType": "CU",
  "cameraMove": "push in",
  "dialogue": "你还记得...那天吗？",
  "emotion": "犹豫、感伤",
  "promptVersion": "1.0",
  "promptStatus": "generated|reviewed|approved|locked",
  "promptText": "[生成的 AI 视频提示词]",
  "negativePromptText": "[负面提示词]",
  "generationHistory": []
}
```

### 批量生成规则
- 每个角色在连续镜头中保持 100% 一致的外貌描述
- 使用 `characterId` 引用 → 自动注入角色 referencePrompt
- 场景切换时，先插入环境建立镜头(EWS)

---

## 阶段 4: 迭代管理 → 版本控制

### 版本命名规范: `major.minor` 语义化版本

| 版本变化 | 示例 | 说明 |
|---------|------|------|
| 表情调整 | v1.0 → v1.1 | minor：同一镜头微调表情 |
| 动作修改 | v1.0 → v1.2 | minor：镜头内动作调整 |
| 重新生成 | v1.0 → v2.0 | major：完全不同的生成结果 |
| 人物调整 | v2.0 → v3.0 | major：角色模型更新后重新生成 |

### 版本记录格式
```json
{
  "shotId": "SHOT_042",
  "versions": [
    {"v": "1.0", "date": "2026-05-05", "prompt": "...", "result": "generated_example.mp4", "review": "approved"},
    {"v": "1.1", "date": "2026-05-06", "prompt": "...", "result": "generated_example_v2.mp4", "review": "pending"}
  ],
  "activeVersion": "1.1"
}
```

### 回滚机制
- 任何时候可回滚到已审核的旧版本
- 回滚不删除新版本，仅切换 activeVersion
- 项目快照可导出整个版本状态

---

## 阶段 5: 本地存储 → 项目快照

### 存储结构 (建议 JSON 文件)
```
project-name/
├── project.json              # 项目元数据 + 角色/场景引用
├── characters/
│   ├── char_001.json         # 角色完整档案
│   └── char_002.json
├── scenes/
│   ├── scene_001.json        # 场景完整档案
│   └── scene_002.json
├── shots/
│   ├── episode_01/
│   │   ├── shot_001.json     # 单镜头全版本
│   │   └── shot_002.json
│   └── episode_02/
├── snapshots/
│   └── 2026-05-05_140000.json  # 全量快照
└── exports/
    └── episode_01_prompts.csv   # 批量导出
```

### 快照策略
- 每日自动快照
- 每集完成后手动快照
- 快照不可变(只读)
- 保留最近 10 个快照

---

## 阶段 6: 复用 → 跨项目一致性

### 加载已有角色
```
使用角色 CHAR_001 (张三 v1.2):
- 自动注入 referencePrompt: "Male, 28yo..."
- 自动注入 keyFeatures: "左颊浅疤、额前卷发"
- 自动注入 negativePrompt
```

### 称谓系统
| 角色 ID | 标准名称 | 别名 | 标签 |
|---------|---------|------|------|
| CHAR_001 | 张三 | 阿三/三哥 | 男主/人类/青年 |
| CHAR_002 | 李四 | 小四/四儿 | 女主/人类/少女 |
| CHAR_003 | 老陈 | 陈叔/陈伯 | 配角/人类/老年 |

### 跨项目检查清单
- [ ] 角色 ID 全局唯一
- [ ] 角色别名不冲突
- [ ] 同一角色跨项目外貌一致
- [ ] 角色标签体系一致

---

## AI 视频工具提示词注入规范

### 角色注入 (每个镜头自动附加)
```
--char CHAR_001: "Male, 28yo, East Asian, lean build, square jaw, thick eyebrows, monolid eyes, short black wavy hair side-parted, pale skin, faint scar on left cheek. Wearing black trench coat over white button-up, dark gray trousers."
--neg CHAR_001: "beard, glasses, different hair color, western features, muscular build"
```

### 场景注入
```
--scene SCENE_001: "Cozy vintage cafe interior, warm amber tones. Afternoon sunlight through window, soft bokeh. Brass bell on door."
--neg SCENE_001: "modern, bright fluorescent, white walls, empty room"
```

### 镜头注入 (合成最终提示词)
```
SHOT_042 [5s | CU | push in]
--char CHAR_001, CHAR_002
--scene SCENE_001
--shot "Close-up of Zhang San's face, slowly pushing in. His eyes are welling up, jaw clenching. Warm amber light from window casting shadows. Shallow depth of field, 85mm. Photorealistic, 24fps."
--neg "wide shot, full body, other people visible, smiling"
```

---

## 最佳实践

1. **角色先锁后用**: 先花 3-5 次迭代锁定角色外貌，再开始生成镜头
2. **场景独立测试**: 新场景先单独生成参考图确认氛围
3. **每 10 镜审核**: 不批量生成所有镜头，每 10 个审核一次
4. **版本不删除**: 旧版本保留作为历史参考
5. **快照定期做**: 每天收工时快照，防止丢失
