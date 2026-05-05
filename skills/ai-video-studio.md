# Skill: AI 视频创作工作室 v4

剧本→AI视频。内置连续性与过渡管理系统。

> **v4 新增**: 极致细节模式 — 加载 micro-detail-injection.md 的 10 维度参数网格，所有提示词输出经过 cross-audit.md 5 层交叉审计后才交付用户。

> **协作关系:** 本 Skill 是主入口。镜头拆解规则见 director-storyboard.md，角色/场景锁定格式见 prompt-lifecycle.md，表情注入详见 tpema-expression.md，最终提示词输出见 multimodal-prompt.md。极致细节参数网格见 micro-detail-injection.md，交叉审计见 cross-audit.md。

---

## 核心机制：持续上下文表

在生成所有镜头时，**必须在内存中维护一张跨镜头的状态表**。每个镜头生成前，先读取上一个镜头的终结状态，确保连贯。

### 上下文表结构
```
Shot | Time  | Characters (state, emotion, position)      | Scene State | Light | Transition
001  | 0:00  | C01: 坐窗边/杯在手/平静                 | SCENE_01基线  | 暖光15:00 | —
002  | 0:05  | C01: 抬头/放杯/微惊→喜悦                | SCENE_01不变   | 暖光+0    | 匹配剪辑(杯)
003  | 0:12  | C01: 起身/走向门/喜悦 C02: 推门/扫视/焦急 | SCENE_01不变   | 暖光+0    | 动作衔接(看→进)
004  | 0:22  | C01: 街边/并肩/释然 C02: 街边/手兜/微笑   | SCENE_02      | 黄昏 -3° | 跟随门转场
```

### 使用规则
1. **镜头001**：自由创建，建立基线
2. **镜头N (N>1)**：
   - 先读取镜头N-1的终结状态
   - 人物外观/位置/情绪必须承接
   - 光线变化≤3°/镜（除非场景切换）
   - 设计N-1到N的过渡方式

---

## 工作流

```
剧本分析 → 建上下文表 → 逐镜头生成(读上一镜→设计过渡→生成→更新表) → 质检 → 导出
```

---

## Step 1: 剧本分析

### 角色(人物恒定性优先)
```
[CHAR_01] 名称 v1.0
恒定特征: [面部特征(≥3项)]-[体型特征]-[标志物]
可变特征: [表情/姿势/位置/服装细节]
禁止变化: [恒定特征中的任何项]
参考提示词: "英文描述(仅恒定特征，不含可变特征)"
负面提示词: "排除项"
```

> **关键**: 恒定特征跨越所有镜头不变。可变特征在上下文中跟踪。

### 场景
```
[SCENE_01] 名称
恒定: [地点/建筑特征/色彩基调]
可变: [时间/光线角度/天气/人物位置]
参考提示词: "英文场景描述(仅恒定元素)"
```

### Step 1c: 微细节环境提取 (Micro-Detail Extraction)

在角色/场景分析完成后，立即提取每场景的物理级参数基线。这些基线在整个镜头序列中作为默认值，在逐镜头生成时可按情绪微调。

```
SCENE_01 微细节基线:
  灯光: kelvin={由时间推导}K, diffusion={场景类型推导}, key:fill={情绪推导}
  摄影机: body={项目风格决定}, fps={24/30/12}
  大气: particleType={场景推导}, density={默认值}, convection={空间推导}
  色彩: LUT={风格推导}, grain%={ISO推导}, warmCoolBalance={情绪推导}
```

推导规则详见 micro-detail-injection.md Dimension 1-10。

---

## Step 2: 角色解剖锁定 + 上下文表初始化

### 2a: 角色微细节解剖 (Character Micro-Anatomy)

每个角色除恒定特征外，须建立微细节解剖档案。这些数据在生成提示词时直接注入，不再使用抽象的 CHAR_XX 引用。

```
[CHAR_01] 名称 v1.0
恒定特征: [面部特征(≥3项)]-[体型特征]-[标志物]

微细节解剖 (注入每镜头prompt):
  HAIR: #{color} {length}cm {texture} flyaway{0.x} highlights#{hex}
  SKIN: #{tone} {texture} SSS[{zones}] oil{0.x}
  EYES: iris#{color} catchlight_{type} lash_{density}
  HANDS: nail{mm}mm polish#{hex} vein{0.x} knuckle{0.x}
  CLOTHING: {fabric} wea{0.x} drape{0.x} wear:{description}
  FACS基线: AU1={n} AU2={n} AU4={n} AU5={n} AU6={n} AU7={n} AU12={n} AU15={n} ... (其余0.0)

禁止变化: [恒定特征中的任何项]
```

> 完整解剖参数表见 micro-detail-injection.md Dimension 3。

### 2b: 上下文表初始化

```
创建空上下文表，建立初始基线:

| Shot | Time  | C01位置/情绪/动作 | C02位置/情绪/动作 | 场景状态 | 光线(K) | 摄影机(Lens/T) | 大气 | 镜头→镜头过渡 |
```

---

## Step 3: 逐镜头生成

对每镜头执行以下 3 步：

### 3a. 读上下文
```
上一镜头: SHOT_XXX
终结状态:
  - C01: [位置/姿势/情绪]  
  - C02: [位置/姿势/情绪]
  - 场景: [状态]  光线: [当前值]  时间: [故事时间]
```

### 3b. 设计过渡
```
SHOT_XXX → SHOT_YYY 过渡方式:
- 类型: [切/淡入/匹配剪辑/动作衔接/声音桥接/L-cut/J-cut]
- 连接点: [两个镜头共享的视觉/听觉/运动元素]
```

#### 过渡类型库
| 类型 | 说明 | 使用场景 |
|------|------|---------|
| 切 (Cut) | 直接切换 | 连续动作 |
| 匹配剪辑 | 形状/颜色/动作匹配 | 诗意转场 |
| 动作衔接 | 前镜头动作→后镜头反应 | 对话/互动 |
| L-Cut | 声音提前进入 | 对话场景 |
| J-Cut | 画面先行，声音延迟 | 建立氛围 |
| 淡入淡出 | 渐黑/渐亮 | 时间跳跃 |
| 跟随转场 | 跟随主体运动切换 | 空间连续 |

### 3c. 生成提示词 (10维度极致细节模式)

**生成前先加载 micro-detail-injection.md 的 10 维度参数网格。**

对每个镜头必须填充以下所有维度，不允许使用标签级描述（如"warm light"），必须使用物理量（如"4200K"）。

```
━━ SHOT_{id} [{duration}s | {shotType} | {cameraMove} | ← {prev_id}] ━━

LIGHTING: {kelvin}K key@{az}°/{el}° {diff}({mat}), key:fill {ratio}, rim sep {sep}°, shadow {hard}, falloff {falloff}, {practicals} practicals

CAMERA: {body} {sensor}, {lens} @ {tStop}, ISO {iso}, shutter {angle}°, {stab}, H{height}cm D{dist}cm T{tilt}°

CHAR_{id}: HAIR #{color} {len}cm {texture} flyaway{0.x}; SKIN #{tone} {texture} SSS[{zones}] oil{0.x}; EYES iris#{hex} ct_{type} lash_{density}; HANDS nail{mm}mm #{polish}; CLOTHING {fabric} wea{0.x} dra{0.x} wear:{desc}

FACS: AU1={} AU2={} AU4={} AU5={} AU6={} AU7={} AU9={} AU10={} AU12={} AU14={} AU15={} AU16={} AU17={} AU18={} AU20={} AU22={} AU23={} AU24={} AU25={} AU26={} AU27={} AU43={} AU45={}
  BLINK:{bpm}bpm PUPIL:{mm}mm BREATH:{cpm}cpm ch{chest}%dia{diaph}% | HEAD:p{p}° y{y}° r{r}° | GAZE:{state}

ACTION: speed{cm/s}cm/s, {trajectory}, {Hz}Hz, {cm}cm amp, {accel}, weight{feel}, 2nd{sec}, grip{grip} def{def}mm

ATMOSPHERE: {particle} dens{density} size{μm}μm, {convection}, humid:{humid}, vol{vol}, AO{ao}

COLOR: LUT_{lut}, grain{grain}%, sat R{sr} G{sg} B{sb}, contrast{cr}:1, BP{bp}IRE WP{wp}IRE, {harmony}, {warm}%warm

MATERIAL: [{surfaces with rough/spec/sss/fresnel/anisot/clear/metal/bump}]

AUDIO: src[{x},{y},{z}]cm, reverb_{type} {ms}ms, viseme:[{seq}], ambient:"{ambient}"

POST: grain_{type} {pct}%, halation{0.x}, CA{px}px, distort{lensDist}%, vignette{0.x}, gate{gate}px, squeeze{sq}x

SYNTHESIZED PROMPT:
"[将所有维度合成为连贯英文描述，100-400词，适合目标 AI 视频工具]"

TRANSITION: [{type}] — {connection_point} | LIGHT Δ: {from_K}K→{to_K}K
```

> 详细参数范围、推导逻辑、默认值见 micro-detail-injection.md。

---

## 过渡设计示例

```
SHOT_003 → SHOT_004
过渡: 跟随转场 — 摄影机跟随CHAR_02推门动作，门开启瞬间场景切换至SCENE_02外景
C01: 起身/走向门/喜悦 → 踏出门槛/深吸气/释然
C02: 已推门/侧身让路/焦急 → 跟出/手插兜/放松
光线: SCENE_01暖光15:00 → SCENE_02黄昏17:00 (场景切换允许跳变)

提示词:
  "SHOT_003 ends with CHAR_02 pushing cafe door open from inside. 
   SHOT_004 begins immediately: exterior street at golden hour. 
   Door swings outward, CHAR_01 steps through threshold into warm 
   sunset backlight. CHAR_02 follows, hands in pockets. 
   Wide tracking shot following them. Cinematic, 24fps."
```

---

## Step 4: 镜头拆解

> **拆解规则详见 director-storyboard.md**，此处仅列出核心原则。完整模板（含景别/运镜参考表）参见 director-storyboard.md 第二步。

### 拆解规则
- 动作变化 → 新镜头
- 情绪转折 → 新镜头  
- 场景切换 → 新镜头 (必须设计过渡)
- 对话>15秒 → 切镜头
- 连续镜头景别不超过3次重复

### 景别: EWS WS MS CU ECU
### 运镜: Static Push Pull Pan Tracking Handheld Crane

---

## Step 5: 表情注入 (FACS Vector Injection)

> **完整 AU 参照表、生理模型、viseme 映射见 tpema-expression.md v2。**

对话镜头生成提示词时，必须注入完整的 Prompt-FACS Vector（25+ AU），不再使用抽象情绪标签。

### 注入格式 (直接嵌入 prompt 的 FACIAL 块)
```
FACS: AU1={n} AU2={n} AU4={n} AU5={n} AU6={n} AU7={n} AU9={n} AU10={n} AU12={n} AU14={n} AU15={n} AU16={n} AU17={n} AU18={n} AU20={n} AU22={n} AU23={n} AU24={n} AU25={n} AU26={n} AU27={n} AU43={n} AU45={n}
  BLINK: {bpm}bpm | PUPIL: {mm}mm arousal{0.x} | BREATH: {cpm}cpm chest{chest%}%dia{diaph%}%
  HEAD: pitch{pitch}° yaw{yaw}° roll{roll}° | GAZE: {state}
  VISEME: [{time_ms}:{phoneme}:{AU25}:{AU26}:{AU27}]...
```

### 标点→AU 快速映射 (详表见 tpema-expression.md)
| 标点 | 关键 AU | 视线 | 语速 | 
|------|---------|------|------|
| ， | AU1+2 0.3 | FOCUS | 1.0x |
| 。 | AU1+2 0.15 | FOCUS | 0.9x |
| ？ | AU1+2+AU5 0.75 | EMPHASIS | 1.1x |
| ！ | AU20+AU5+AU12 0.85 | EMPHASIS | 1.2x |
| … | AU1+2 0.4 | AVOID | 0.5x |

### 非对话镜头也须注入 FACS 基线
```
FACS: AU1=0.05 AU2=0.02 AU4=0.05 AU5=0.0 AU6=0.0 AU7=0.1 AU12=0.05 AU15=0.05 ... (其余0.0)
  BLINK: 18bpm | PUPIL: 4.0mm | BREATH: 14cpm chest40%dia60%
  HEAD: p0° y0° r0° | GAZE: FOCUS
```

---

### Step 5.5: 微细节一致性检查 (Micro-Detail Consistency)

在提交交叉审计前，先自查 10 维度间的内部一致性：

- [ ] LIGHTING: Kelvin 匹配场景时间(±500K)，key:fill 匹配情绪，diffusion→shadowHardness 自洽
- [ ] CAMERA: distance 在 shotType 物理范围内，T-stop + lens + distance → DOF 自洽
- [ ] CHARACTER: 每个出场角色有 hair/skin/eyes/hands/clothing 5 项数据
- [ ] FACS: 所有 23 个 AU 已赋值(可为0)，对话镜头有 viseme 序列
- [ ] ACTION: speed/amplitude/weight 在物理合理范围
- [ ] ATMOSPHERE: particleType 匹配场景类型，density 非零(除非"none")
- [ ] COLOR: LUT 已指定，warmCoolBalance 匹配情绪
- [ ] MATERIAL: 至少 1 个主表面有 rough/spec/metallic 参数
- [ ] POST: grain% 匹配 ISO
- [ ] 维度间: D1(Light.K) ↔ D7(Color.warmCool) 一致, D2(T-stop) ↔ D8(Material.roughness/bump) 自洽

## Step 6: 交叉审计 + 一致性质检

> **这是提示词交付用户的最终关卡。详见 cross-audit.md。**

### 6a: 交叉审计 (Cross-Audit)

每个镜头生成完成后，必须通过 5 层交叉审计：

| 审计层 | 检查内容 | 不通过时 |
|--------|---------|---------|
| **Audit 1** 自一致性 | 维度间矛盾检测 (T-stop vs DOF, Kelvin vs 色彩描述等 10 条规则) | auto-fix → 重审 |
| **Audit 2** 维度完整性 | 10 维度全部填充 (每维 ≥1 参数，对话镜头额外 FACS+viseme) | auto-fill → 重审 |
| **Audit 3** 物理合理性 | 参数值在物理世界可能吗？ | fix → 重审 |
| **Audit 4** 引用完整性 | CHAR_/SCENE_ 可解析，跨镜解剖数据一致 | fix → 重审 |
| **Audit 5** 可合成性 | 结构化数据→自然语言完整，无占位符/省略/中英混用 | fix → 重审 |

```
ALL 5 PASS → "✅ 交叉审计通过 → 交付用户"
ANY FAIL  → "❌ 审计失败[{audit_name}]: {reason} → 自动修复 → 重新审计"
```

审计报告格式和完整规则表见 cross-audit.md。

### 6b: 传统一致性质检 (Validator 16条 + 3条新规则)

- [ ] 角色恒定特征跨镜头不变 (用上下文表交叉对比)
- [ ] 场景恒定元素跨镜头一致
- [ ] 光线渐变合理(同场景≤3°/镜)
- [ ] 时间流逝合理(时长×镜数≈故事时间)
- [ ] 相邻镜头有明确过渡设计
- [ ] 角色状态从上一镜终结状态合理承接
- [ ] 称谓统一(全片用同一CHAR_ID/SCENE_ID)
- [ ] Rule 17: 微细节完整性 (lighting/camera/anatomy/atmosphere 非标签级)
- [ ] Rule 18: FACS 注入 (对话镜头有 AU 向量)
- [ ] Rule 19: 交叉审计标记 (prompt 带有审计通过标记)

### 自动修复
质检不通过时:
1. 用上下文表的终结状态修正当前镜头起始状态
2. 补全缺失的过渡设计
3. 锁定角色恒定特征描述
4. 交叉审计失败 → 按 cross-audit.md 逐项自动修复 → 重新审计

---

## 快速命令

**基础**: "分析剧本" | "建上下文表" | "生成镜头X" | "设计过渡 SHOT_X→SHOT_Y" | "质检连续性" | "修复一致性" | "导出上下文表"

**极致模式**: "极致细节模式" | "10维度输出" | "注入全维度" | "展开角色解剖" | "生成FACS向量" | "交叉审计 SHOT_X" | "全序列审计" | "审计通过→交付用户"
