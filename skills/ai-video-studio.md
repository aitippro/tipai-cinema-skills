# Skill: AI 视频创作工作室 v6

剧本→AI视频。v6 微表情增强引擎：不对称AU + OAO时序动力学 + 微表情泄漏 + 扩展眼动 + 共发音 + ANS效应 + 角色表情指纹。自包含，单文件加载即用。

---

## ⚠️ 强制协议

### 进入/退出 — 用户全权控制
```
进入: 用户说 "开始创作" | "拆解剧本" | "生成镜头" | "创作短剧" | "分析剧本"
退出: 用户说 "结束创作" | "退出" | "停止"
暂停: 用户说 "暂停" — 保存当前状态，等待后续"继续"指令
```

**AI 不得自动激活本 Skill。** 用户未说触发词时，按普通对话处理。

**AI 不得自动退出本 Skill。** 即使全部 6 步执行完毕、所有审计通过，也必须等待用户说 "结束创作" 才能退出 Skill 模式。退出决定权完全在用户。

**AI 不得替用户决定"是否继续"。** 每个检查点必须等待用户明确指令。禁止写"我将继续下一步"后自动执行。

### 反偷懒铁律
```
1. 禁止省略: 不得出现 "等"、 "..."、 "同上"、 "其余类似"、 "详见X"
2. 禁止跳步: 必须 Step 1→2→3→4→5→6 顺序执行，不得跳过
3. 禁止部分完成: 不得声称"已完成"但实际只做了前几步
4. 禁止空值: 不得出现 "TBD"、 "auto"、 "default"、 "—"、 "略"
5. 全填充: 每镜头10维度所有必填参数必须赋值
6. 逐镜独立: 每个镜头单独生成完整的10维块+合成prompt，不得批量概述
7. 最终prompt纯英文: SYNTHESIZED PROMPT 必须是纯英文，不得出现任何中文字符。10维参数标签用英文(如LIGHTING/CAMERA/CHAR)，但分析/检查点/状态块给用户看的部分用中文
```

### 检查点系统
每步结束时输出以下块，**用户确认后才能进入下一步**：

```
═══ [CHECKPOINT_N] ═══
步骤: Step N/6 — [步骤名]
状态: ✅ 完成
产出:
  - 具体产出项 (数量)
  - 具体产出项 (数量)
下一步: Step N+1 — [下一步名]
用户指令: 说 "继续" 进入下一步 / "修改 [项]" 修正 / "暂停" 保存 / "退出" 结束
═══════════════════════
```

---

## 🔄 跨回合状态

每个回合开始时，先输出当前状态：

```
═══ 当前进度 ═══
位置: Step N/6 — [步骤名]
角色: [已锁定的角色列表]
场景: [已锁定的场景列表]
镜头: [已生成数/总数]
待办: [当前步骤需完成的具体事项]
═══════════════
```

---

## 📋 工作流

```
Step 1: 剧本分析        → 角色表 + 场景表 + 情感曲线 + 视觉风格
Step 2: 角色锁定        → 角色解剖档案 + 表情指纹 + 场景锁定 + 上下文表初始化
Step 3: 镜头拆解        → 镜头序列表 (含景别/运镜/过渡设计/上下文承接)
Step 4: 逐镜生成        → 每镜头完整10维数据 + 合成英文prompt
Step 5: 表情注入 v6     → 不对称FACS + OAO时序 + 微表情泄漏 + 扩展眼动 + 共发音 + ANS
Step 6: 交叉审计        → 5层审计 + 22条质检 → ✅交付 / ❌修复→重审
```

---

## Step 1: 剧本分析

### 执行
阅读用户提供的文本，逐项提取以下四类信息。

### 1.1 角色提取
对每个出场角色，提取：
- 名称、性别、年龄范围
- 外貌特征 (面部≥3项、体型、标志物)
- 服装描述
- 性格标签 (1-3词)
- 在剧本中的情感弧线

输出格式:
```
[CHAR_01] 名称
  外貌: [面部特征(≥3项)] | [体型] | [标志物]
  服装: [默认服装描述]
  性格: [标签1/标签2/标签3]
  弧线: [起始情绪] → [中段情绪] → [结尾情绪]
```

### 1.2 场景提取
对每个场景，提取：
- 地点描述
- 时间 (dawn/morning/noon/afternoon/golden_hour/sunset/night/indoor)
- 光线特征
- 色彩基调
- 关键道具

输出格式:
```
[SCENE_01] 场景名
  地点: [具体描述]
  时间: [时间类型]
  光线: [方向/色温倾向/软硬]
  色调: [主色系]
  道具: [关键物品列表]
```

### 1.3 情感曲线
```
开场(情绪A) → 发展(情绪B) → 转折(情绪C) → 高潮(情绪D) → 尾声(情绪E)
```

### 1.4 视觉风格
```
色彩基调: [暖/冷/混合] — [具体色系]
画面风格: [写实/日系/赛博朋克/水墨/美式/...]
宽高比: [16:9/21:9/9:16/4:3]
帧率: [24fps/30fps/12fps]
```

### [CHECKPOINT_1]
```
═══ [CHECKPOINT_1] ═══
步骤: Step 1/6 — 剧本分析
状态: ✅ 完成
产出:
  - 角色表: [N]个角色
  - 场景表: [M]个场景
  - 情感曲线
  - 视觉风格
下一步: Step 2/6 — 角色锁定 + 上下文表初始化
用户指令: 说 "继续" / "修改 [角色/场景]" / "暂停" / "退出"
═══════════════════════
```

---

## Step 2: 角色锁定 + 上下文表初始化

### 2.1 角色恒定特征
为每个 CHAR 定义跨镜头不变的恒定特征 (≥3项) 和可变特征：

```
[CHAR_01] 名称 v1.0
恒定: [面部特征(≥3项)] | [体型] | [标志物] — 全片不变
可变: [表情/姿势/位置/服装细节] — 随镜头推进变化
禁止变化: [恒定特征中的任何项]
```

### 2.2 角色微细节解剖
每个角色必须建立以下物理级档案。**这些值在所有镜头中保持不变，直接注入每镜prompt。**

```
[CHAR_01] 解剖档案:
  HAIR:   #{颜色hex} [长度]cm [straight/wavy/curly/coiled] flyaway[0.x]
  SKIN:   #{肤色hex} [smooth/fine_pores/visible_pores/rough] SSS[cheek,nose,ear] oil[0.x]
  EYES:   iris#{虹膜hex} catchlight_[window_rect/ring_circle/softbox_square/dot] lash_[sparse/medium/thick]
  HANDS:  nail[0-30]mm polish#{hex} vein[0.x] knuckle[0.x]
  CLOTHING: [cotton/silk/wool/denim/leather/...] weave[0.x] drape[0.x] wear:[描述]
```

### 2.3 角色表情指纹 (v6 新增)
每个角色必须建立表情指纹档案。**这些值在所有镜头中决定角色表情风格，直接控制 Step 5 的 v6 FACS 注入参数。**

```
[CHAR_01] 表情指纹:
  静息张力 (Resting Face Tension):
    AU1=0.03 AU2=0.01 AU4=0.08 AU7=0.05 AU12=0.03 AU15=0.02 (其余AU=0)
    这些值在所有非对话镜头中叠加到FACS基线上
  
  表情幅度 (Expressivity): [0.0-1.0]
    0=面瘫/flat affect, 0.3=内向克制, 0.5=正常, 0.7=外向, 1.0=极度夸张
    所有情绪AU值 = 标准值 × expressivity

  全局不对称偏侧:
    bias: [L/R/none], magnitude: [0.0-0.12]
    AU级偏侧: AU12={bias:L/R, mag:0.0x}, AU1={bias:L/R, mag:0.0x}

  眨眼风格:
    rate: [8-35bpm], type_ratio: {soft:0.x, complete:0.x, double:0.x, long:0.x, flutter:0.x}

  习惯动作 (Habitual Mannerisms):
    - {trigger: "触发场景", AU: [AU组合及强度], gaze: [状态], head: [头动], dur: [ms]}
    - {trigger: "思考时", AU: [AU1+2=0.2, AU18=0.15], gaze: RECALL, head: yaw-5°, dur: 800-1200ms}

  情绪抑制特征 (Emotion Suppression Profile):
    anger:    {suppressibility: low/med/high, leak_AUs: [AU4,AU7], micro_flash: true/false}
    sadness:  {suppressibility: low/med/high, leak_AUs: [AU1,AU15], eye_leak: true/false}
    fear:     {suppressibility: low/med/high, leak_AUs: [AU5,AU20], micro_flash: true/false}
    happiness:{suppressibility: low/med/high, leak_AUs: [AU6], micro_flash: true/false}
    disgust:  {suppressibility: low/med/high, leak_AUs: [AU9]}
    contempt: {suppressibility: low/med/high, leak_AUs: [AU12_unilateral]}
    surprise: {suppressibility: low/med/high, leak_AUs: [AU5]}
    (suppressibility=抑制能力, leak_AUs=被压抑时哪些AU会微量泄漏, micro_flash=在<100ms内的微表情闪烁, eye_leak=眼睛区域尤其容易泄漏)

  角色原型 (Archetype):
    type: [内敛克制型/外向奔放型/冷面幽默型/易读透明型/焦虑紧张型/权威掌控型/天真烂漫型/忧郁沉思型]
    baseline_affect: [warm_resting/neutral_resting/cold_resting/sad_resting]
```

### 2.4 场景锁定
```
[SCENE_01] 场景名 v1.0
恒定: [地点] | [建筑特征] | [色彩基调] — 全片不变
可变: [时间] | [光线角度] | [天气] | [人物位置]
光线基准: [kelvin值]K — 所有该场景镜头在此基准±500K内
```

### 2.5 上下文表初始化
创建空上下文表，全片维护：

```
| Shot | Time | C01位置 | C01情绪 | C02位置 | C02情绪 | 场景状态 | 光线(K) | 过渡 |
|------|------|---------|---------|---------|---------|---------|---------|------|
| —    | 0:00 | (基线)  | (基线)  | (基线)  | (基线)  | (基线)  | (基线)  | —    |
```

### [CHECKPOINT_2]
```
═══ [CHECKPOINT_2] ═══
步骤: Step 2/6 — 角色锁定
状态: ✅ 完成
产出:
  - [N]个角色解剖档案 (含微细节 + 表情指纹)
  - [M]个场景锁定 (含光线基准)
  - 上下文表已初始化
下一步: Step 3/6 — 镜头拆解
用户指令: 说 "继续" / "修改 [角色/场景]" / "暂停" / "退出"
═══════════════════════
```

---

## Step 3: 镜头拆解

### 拆解规则 (5条铁律)
```
1. 动作变化 → 新镜头
2. 情绪转折 → 新镜头
3. 场景切换 → 新镜头 (必须设计过渡)
4. 对话超过15秒 → 切镜头
5. 连续镜头景别不超过3次重复
```

### 景别 (5级)
| 代码 | 名称 | 英文 | 适用 |
|------|------|------|------|
| EWS | 大远景 | Extreme Wide | 环境建立、场景切换后首镜 |
| WS | 全景 | Wide Shot | 人物全身+环境关系 |
| MS | 中景 | Medium Shot | 人物膝盖以上、多人对话 |
| CU | 近景 | Close-Up | 胸部以上、表情细节 |
| ECU | 特写 | Extreme Close-Up | 面部/手部/物品细节 |

### 运镜 (7种)
| 代码 | 名称 | 效果 |
|------|------|------|
| Static | 固定 | 稳定观察 |
| Push | 推 | 关注聚焦、情绪升温 |
| Pull | 拉 | 揭示环境、情绪退潮 |
| Pan | 摇 | 场景扫描、视线引导 |
| Tracking | 跟 | 跟随主体运动 |
| Crane | 升降 | 空间层次变化 |
| Handheld | 手持 | 紧张/真实/纪录片感 |

### 过渡类型 (7种)
| 类型 | 使用场景 |
|------|---------|
| Cut 切 | 连续动作、同场景 |
| MatchCut 匹配剪辑 | 形状/颜色/动作相似 → 诗意转场 |
| ActionBridge 动作衔接 | 前镜动作→后镜反应 |
| L-Cut | 声音先进，对话场景首选 |
| J-Cut | 画面先行，建立氛围 |
| Fade 淡入淡出 | 时间跳跃、章节分隔 |
| Follow 跟随转场 | 跟随主体穿越空间 |

### 每镜头模板
```
SHOT_{id} | {duration}s | {shotType} | {cameraMove} | ← SHOT_{prev}

承接状态 (从上一镜stateAfter):
  C01: 位置=[pos] 情绪=[emotion] 动作=[action]
  C02: 位置=[pos] 情绪=[emotion] 动作=[action]

本镜内容:
  画面: [核心画面一句话]
  角色动作: [谁做什么]
  对话: [如有]
  光线变化: {from_K}K→{to_K}K (Δ={delta}K)
  情绪: [此镜传达的情绪]

过渡设计: [{type}] — [{connection_point}]

终结状态 (stateAfter):
  C01: 位置=[pos] 情绪=[emotion] 动作=[action]
  C02: 位置=[pos] 情绪=[emotion] 动作=[action]
```

### [CHECKPOINT_3]
```
═══ [CHECKPOINT_3] ═══
步骤: Step 3/6 — 镜头拆解
状态: ✅ 完成
产出:
  - [N]个镜头的拆解序列
  - 每镜头含: 承接状态/本镜内容/过渡设计/终结状态
  - 总时长: [T]秒
下一步: Step 4/6 — 逐镜生成 (10维度)
用户指令: 说 "继续" / "修改镜头X" / "暂停" / "退出"
═══════════════════════
```

---

## Step 4: 逐镜生成 (10维度物理级参数)

**对每个镜头单独执行。** 每镜头输出完整10维块 + 合成英文prompt。禁止批量概述。

### ⚠️ 本步核心规则
```
- 禁止标签级描述 (如 "warm light"→用 "4200K")
- 禁止模糊量词 (如 "very bright"→用 "key:fill 4:1")
- 禁止省略任何维度 (即使值为0也要写出)
- 每个镜头独立输出完整块
```

### D1: 灯光物理

| 参数 | 范围/选项 | 推导 |
|------|----------|------|
| kelvin | 1000-20000K | dawn=3500, noon=5600, afternoon=4500, golden=3800, sunset=3000, tungsten=3200, night=4100 |
| keyAzimuth | 0-360° | 0=右, 90=正, 180=左, 270=背 |
| keyElevation | 0-90° | 0=地平, 45=经典, 90=顶光 |
| diffusion | china_silk / softbox_octa / softbox_rect / umbrella_white / umbrella_silver / fresnel / book_light / window_diffuse / bare_bulb / none |
| diffusionGrid | grid_40 / grid_60 / grid_80 / honeycomb_10 / honeycomb_30 / 216 / 250 / opal_frost / none |
| keyFillRatio | 1:1~16:1 | 1:1=flat, 2:1=beauty, 3:1=standard, 4:1=dramatic, 8:1=noir, 16:1=silhouette |
| shadowHardness | 0.0-1.0 | 0=全柔, 0.3=柔影, 0.5=中, 0.7=硬, 1.0=刀锋 |
| rimSeparation | 0-180° | key-rim夹角 |
| falloff | 0.1-1.0 | 小空间=1.0, 大空间=0.1 |
| practicals | 0-10 | 可见光源数 |

情绪→keyFillRatio: 中性=2:1~3:1, 浪漫=1:1~2:1, 紧张=4:1~8:1, 恐怖=8:1~16:1
情绪→kelvin偏移: 悲伤=-300K, 温馨=+200K, 紧张=-500K
shadowHardness = 1.0 - diffusionStopLoss/6

输出格式:
```
LIGHTING: {kelvin}K key@{az}°/{el}° {diffusion}({grid}), key:fill {ratio}, rim sep {sep}°, shadow {hardness}, falloff {falloff}, {practicals} practicals
```

### D2: 摄影机物理

| 参数 | 范围/选项 | 推导 |
|------|----------|------|
| body | ARRI_Alexa_35 / ARRI_Mini_LF / RED_V_Raptor / RED_Komodo / SONY_Venice_2 / SONY_FX6 / Canon_C500 / BM_Pocket_6K / BM_URSA_12K |
| sensor | full_frame / super_35 / s35_open_gate / MFT / anamorphic_s35 / 65mm |
| lens | "{brand}_{model}_{focal}mm" 例: ARRI_MasterPrime_85mm |
| tStop | T0.7-T64 | 亲密=T1.3~T2.0, 正常=T2.8~T4, 客观=T5.6~T11 |
| iso | 50-409600 | 日外=100~400, 日内=400~1600, 夜外=1600~12800 |
| shutterAngle | 45-360° | 标准=180°, 少模糊=45~90°, 多模糊=270~360° |
| stabilization | tripod / gimbal / steadicam / shoulder_rig / handheld / drone / dolly / crane |
| height | 0-500cm | eye=160, waist=100, low=30 |
| distance | 5-50000cm | ECU=5~40, CU=40~100, MS=100~500, WS=500~5000, EWS=>5000 |
| tilt | -90~+90° | 0=水平, +=仰, -=俯 |

焦距→透视: 12-18mm=夸张空间, 21-28mm=环境优先, 35-50mm=人眼, 65-100mm=面部压缩, 135-200mm=空间压缩
tStop+焦距+distance→DOF自洽: T1.4+85mm+50cm≈0.3cm DOF, T4+35mm+200cm≈120cm DOF, T11+24mm+500cm≈∞

输出格式:
```
CAMERA: {body} {sensor}, {lens} @ {tStop}, ISO {iso}, shutter {angle}°, {stabilization}, H{height}cm D{distance}cm T{tilt}°
```

### D3: 角色解剖

每出场角色必须完整注入以下5项数据。**使用 Step 2 中锁定的解剖档案值。**

```
CHAR_{id}:
  HAIR: #{hex} {length}cm {texture} flyaway{0.x} highlights#{hex}
  SKIN: #{hex} {texture} SSS[{zones}] oil{0.x}
  EYES: iris#{hex} catchlight_{type} lash_{density}
  HANDS: nail{mm}mm polish#{hex} vein{0.x} knuckle{0.x}
  CLOTHING: {fabric} weave{0.x} drape{0.x} wear:{desc}
```

情绪影响: 紧张→skin.oil+0.2, 冷光(>5600K)→sssZones-30%, 湿环境→drape-0.3

### D4: FACS 表情 v6 (详见 Step 5)

本步骤先注入 v6 基线值（含不对称标记和OAO时序），Step 5 做完整的对话驱动注入。

非对话镜头FACS v6基线（叠加角色表情指纹的静息张力值）:
```
FACS v6:
  AU1=0.05(L:0.05/R:0.05) AU2=0.02(L:0.02/R:0.02) AU4=0.05(L:0.05/R:0.05)
  AU5=0.0(L:0.0/R:0.0) AU6=0.0(L:0.0/R:0.0) AU7=0.1(L:0.1/R:0.1)
  AU9=0.0 AU10=0.0(L:0.0/R:0.0) AU12=0.05(L:0.05/R:0.05)
  AU14=0.0(L:0.0/R:0.0) AU15=0.05(L:0.05/R:0.05) AU16=0.0
  AU17=0.0 AU18=0.0 AU20=0.0(L:0.0/R:0.0) AU22=0.0 AU23=0.0 AU24=0.0
  AU25=0.0 AU26=0.0 AU27=0.0 AU43=0.0(L:0.0/R:0.0) AU45=0
  ASYMM_LEVEL: L0_SYMMETRIC
  EXPR_TIMING: onset=0ms apex=0ms offset=0ms curve=linear
  GENUINENESS: N/A (neutral baseline)
  COART: none→neutral (no transition)
  MICRO: macro[neutral/I0.0] leakage[none] suppression0.0
  EYES: GAZE:FOCUS SACC:0°/0°/s MICROSACC:2Hz HIPPUS:0.15mm VERGENCE:0° TEAR:0
  PHYSIO: BLINK:18bpm type:soft PUPIL:4.0mm BREATH:14cpm ch40%dia60%
  HEAD: pitch0° yaw0° roll0°
  ANS: PULSE car0.05/tem0.0 SKIN flush[] sweat0 tear0
```

对话镜头：先在此注入基线，Step 5 中按标点→AU映射覆盖，并补充不对称、OAO时序、泄漏和ANS。

### D5: 动作微运动

| 参数 | 范围 | 说明 |
|------|------|------|
| speed | 0.01-500 cm/s | 动作速度 |
| trajectory | linear/arc/s_curve/figure8/random_walk/bezier/oscillate/parabolic |
| cycleFreq | 0.1-20 Hz | 重复动作频率 |
| amplitude | 0.01-200 cm | 动作幅度 |
| accelCurve | linear/ease_in/ease_out/ease_in_out/bounce/elastic/exponential |
| weightFeel | featherlight(0.0)/light(0.25)/neutral(0.5)/heavy(0.75)/massive(1.0) |
| secondaryMotion | 0.0-1.0 | 次级运动(衣摆/发丝) |
| gripPressure | 0.0-1.0 | 接触握力 |
| contactDeformation | 0-5 mm | 接触变形量 |

情绪→运动: 紧张: speed+30% amplitude-50% freq+50%, 放松: speed-20% amplitude+20% freq-30%, 愤怒: speed+50% accel=exponential

输出格式:
```
ACTION: speed{speed}cm/s, {trajectory}, {freq}Hz, {amp}cm amp, {accel} ease, weight {weightFeel}, 2nd {sec}, grip{grip} def{def}mm
```

### D6: 大气环境

| 参数 | 范围 | 说明 |
|------|------|------|
| particleType | dust/fog/haze/smoke/steam/rain/snow/ash/pollen/none |
| density | 0.0-1.0 | 0=透明, 0.05=微尘, 0.3=明显雾, 0.7=浓雾 |
| particleSize | 1-500 μm | 1=细尘, 10=花粉, 50=雨滴, 200=雪花 |
| convection | still/rising/swirling/crosswind_left/crosswind_right/turbulent/thermal |
| humidityEffect | none/heat_shimmer/mist_breath/lens_fog/condensation |
| volumetricIntensity | 0.0-1.0 | 体光强度 |
| ambientOcclusion | 0.0-1.0 | AO强度 |

场景→particleType: 咖啡馆=steam+dust, 街道日=dust(low), 街道夜=fog, 雨天=rain, 森林=pollen+dust+mist, 室内=steam(厨房)/none(其他)

输出格式:
```
ATMOSPHERE: {particleType} dens{density} size{size}μm, {convection}, humidity:{humidityEffect}, vol{volumetric}, AO{ao}
```

### D7: 色彩科学

| 参数 | 范围/选项 |
|------|----------|
| LUT | Kodak_2383_D55 / Kodak_2383_D60 / Kodak_2393 / ARRI_LogC2Rec709 / Fuji_3510 / Fuji_3513 / ACES_1.3 / Bleach_Bypass / CrossProcess / TealOrange |
| grain% | 0-15% |
| satR/satG/satB | 0.0-2.0 (1.0=标准) |
| contrastRatio | 10:1-1000:1 |
| blackPoint | 0-10 IRE |
| whitePoint | 90-100 IRE |
| colorHarmony | complementary/analogous/triadic/split_complementary/monochromatic/tetradic |
| warmCoolBalance | 0-100 (0=全冷, 50=中性, 100=全暖) |

风格→LUT: 日系清新=Fuji_3510, 电影写实=Kodak_2383_D55, 赛博朋克=TealOrange, 战争灰暗=Bleach_Bypass
情绪→warmCool: 温馨=60-80, 中性=40-60, 冷峻=20-40, 恐怖=10-30

输出格式:
```
COLOR: LUT_{lut}, grain{grain}%, sat R{sr} G{sg} B{sb}, contrast{cr}:1, BP{bp}IRE WP{wp}IRE, {harmony}, {warm}%warm
```

### D8: 材质属性

按表面分别描述。常见预设:

| 表面 | rough | spec | sss | fresnel | metal | 其他 |
|------|-------|------|-----|---------|-------|------|
| 人体皮肤 | 0.4 | 0.05 | 0.4 | 0.3 | 0.0 | — |
| 陶瓷杯 | 0.1 | 0.8 | 0.05 | 0.5 | 0.0 | clear=0.3 |
| 木桌 | 0.7 | 0.02 | 0.0 | 0.1 | 0.0 | bump=0.4 |
| 玻璃窗 | 0.01 | 0.95 | 0.0 | 0.9 | 0.0 | — |
| 不锈钢 | 0.05 | 0.9 | 0.0 | 0.8 | 1.0 | anisot=0.3 |
| 丝绸 | 0.15 | 0.6 | 0.1 | 0.6 | 0.0 | anisot=0.4 |
| 水 | 0.02 | 0.95 | 0.1 | 0.95 | 0.0 | — |

输出格式:
```
MATERIAL: [{surface} rough{0.x} spec{0.x} sss{0.x} fresnel{0.x} anisot{0.x} clear{0.x} metal{0.x} bump{0.x}]
```

### D9: 视听同步

| 参数 | 范围/选项 |
|------|----------|
| soundSourcePos | {x,y,z} cm 相对摄影机 |
| reverbType | room/hall/cathedral/plate/spring/digital/outdoor_natural/anechoic/none |
| reverbDecay | 50-5000 ms |
| ambientLayer | 环境音文字描述 |

空间→reverb: 小房间=room 200-500ms, 中型=hall 500-1500ms, 大型=cathedral 1500-3000ms, 户外=outdoor 50-200ms

输出格式:
```
AUDIO: src[{x},{y},{z}]cm, reverb_{type} {decay}ms, ambient:"{ambient}"
```

### D10: 后期处理

| 参数 | 范围 | 说明 |
|------|------|------|
| grainType | fine_film/coarse_film/digital_noise_fine/digital_noise_coarse/bleach_bypass/none |
| grainIntensity | 0-15% | ISO100→0-1%, ISO800→1-3%, ISO3200→3-7%, ISO6400+→7-15% |
| halation | 0.0-1.0 | 胶片光晕 |
| chromaticAberration | 0-5 px | 色差 |
| lensDistortion | -5%~+5% | 负=桶形, 正=枕形 |
| vignette | 0.0-1.0 | 暗角 |
| gateWeave | 0-2 px | 片门抖动 |
| anamorphicSqueeze | 1.0/1.33/1.8/2.0 | 变形压缩比 |

输出格式:
```
POST: grain_{type} {pct}%, halation{0.x}, CA{px}px, distort{dist}%, vignette{0.x}, gate{gate}px, squeeze{sq}x
```

### 每镜头完整输出模板 (必须逐镜完整输出)

```
━━ SHOT_{id} [{duration}s | {shotType} | {cameraMove} | ← {prev_id}] ━━

LIGHTING: {kelvin}K key@{az}°/{el}° {diff}({grid}), key:fill {ratio}, rim sep {sep}°, shadow {hard}, falloff {falloff}, {practicals} practicals

CAMERA: {body} {sensor}, {lens} @ {tStop}, ISO {iso}, shutter {angle}°, {stab}, H{height}cm D{dist}cm T{tilt}°

CHAR_{id}: HAIR #{hex} {len}cm {texture} fly{flyaway}; SKIN #{hex} {texture} SSS[{zones}] oil{oil}; EYES iris#{hex} ct_{catchlight} lash_{density}; HANDS nail{mm}mm #{polish}; CLOTHING {fabric} wea{weave} dra{drape}

FACS: AU1={} AU2={} AU4={} AU5={} AU6={} AU7={} AU9={} AU10={} AU12={} AU14={} AU15={} AU16={} AU17={} AU18={} AU20={} AU22={} AU23={} AU24={} AU25={} AU26={} AU27={} AU43={} AU45={}
  BLINK: {bpm}bpm | PUPIL: {mm}mm | BREATH: {cpm}cpm chest{chest}%dia{diaph}%
  HEAD: p{pitch}° y{yaw}° r{roll}° | GAZE: {state}

ACTION: speed{speed}cm/s, {trajectory}, {freq}Hz, {amp}cm amp, {accel}, weight {weight}, 2nd {sec}, grip{grip} def{def}mm

ATMOSPHERE: {particle} dens{density} size{size}μm, {convection}, humidity:{humidity}, vol{vol}, AO{ao}

COLOR: LUT_{lut}, grain{grain}%, sat R{sr} G{sg} B{sb}, contrast{cr}:1, BP{bp}IRE WP{wp}IRE, {harmony}, {warm}%warm

MATERIAL: [{surface}: rough{0.x} spec{0.x} sss{0.x} fresnel{0.x} metal{0.x}]

AUDIO: src[{x},{y},{z}]cm, reverb_{type} {ms}ms, ambient:"{ambient}"

POST: grain_{type} {pct}%, halation{0.x}, CA{px}px, distort{dist}%, vignette{0.x}, gate{gate}px, squeeze{sq}x

SYNTHESIZED PROMPT:
⚠️ 必须纯英文。禁止出现任何中文字符。将10维结构化数据全部转化为流畅英文自然语言，100-400词。每个物理参数值必须在自然语言中有对应表述。适合目标AI视频工具直接粘贴使用。"[纯英文，100-400词]"

TRANSITION: [{type}] — {connection_point} | LIGHT Δ: {from_K}K→{to_K}K
```

### [CHECKPOINT_4]
```
═══ [CHECKPOINT_4] ═══
步骤: Step 4/6 — 逐镜生成
状态: ✅ 完成
产出:
  - [N]个镜头完整10维数据 + 合成prompt
  - 每镜头含 TRANSITION + LIGHT Δ
下一步: Step 5/6 — 表情注入 (FACS Vector)
用户指令: 说 "继续" / "修改镜头X" / "暂停" / "退出"
═══════════════════════
```

---

## Step 5: 表情注入 v6 (不对称FACS + OAO时序 + 泄漏 + 眼动 + 共发音 + ANS)

对**每个镜头**注入完整的 v6 FACS Vector。对话镜头按标点驱动，非对话镜头注入基线。v6 新增: 不对称AU、OAO时序动力学、微表情泄漏检测、扩展眼动、表情共发音、ANS自主神经效应。

### 5.1 标点→AU映射 (v6增强版，含不对称偏侧)

| 标点 | 关键AU (含L/R) | 强度 | OAO时序 | 头部 | 视线 | 语速 |
|------|---------------|------|---------|------|------|------|
| ， | AU1+2 (L略强) | 0.30 | onset=150ms apex=100ms offset=200ms gaussian | pitch+2° | FOCUS | 1.0x |
| 、 | AU1+2 (对称) | 0.25 | onset=120ms apex=80ms offset=150ms linear | — | FOCUS | 1.0x |
| 。 | AU1+2回落 | 0.15 | onset=250ms apex=100ms offset=300ms logistic | pitch-2° | FOCUS | 0.9x |
| ？ | AU1+2+5 (对称) | 0.75 | onset=80ms apex=150ms offset=300ms expDecay | pitch+5° yaw+3° | EMPHASIS | 1.1x |
| ！ | AU20+5+12 (AU12左偏~12%) | 0.85 | onset=60ms apex=200ms offset=400ms gaussian | pitch+8° | EMPHASIS | 1.2x |
| … | AU1+2 (R略强) | 0.40 | onset=300ms apex=400ms offset=500ms logistic | yaw-3° | AVOID | 0.5x |
| ； | AU1+2+4 (AU1单侧可能) | 0.55 | onset=180ms apex=200ms offset=350ms gaussian | pitch+3° yaw+2° | SCAN | 1.0x |
| ： | AU1+2 (对称) | 0.35 | onset=150ms apex=100ms offset=200ms linear | — | FOCUS | 1.0x |
| "" | AU1+2+20 (微不对称) | 0.50 | onset=120ms apex=180ms offset=300ms gaussian | yaw±2° | EMPHASIS | 1.0x |
| —— | AU1+2+4 (对称) | 0.45 | onset=200ms apex=150ms offset=300ms gaussian | pitch+3° | FOCUS | 1.0x |

### 5.2 完整25+ AU参照 (v6增强 — 含不对称标记)

| AU | 名称 | 范围 | 可不对称 | 日常基线 | 触发条件 |
|----|------|------|---------|---------|---------|
| AU1 | Inner Brow Raiser | 0-1 | ✅ L/R | 0.05 | 悲伤/疑问/惊讶/单侧=怀疑 |
| AU2 | Outer Brow Raiser | 0-1 | ✅ L/R | 0.02 | 惊讶/恐惧/单侧=质疑 |
| AU4 | Brow Lowerer | 0-1 | ✅ L/R | 0.05 | 愤怒/专注/困惑/单侧=思考 |
| AU5 | Upper Lid Raiser | 0-1 | ✅ L/R | 0.0 | 恐惧/惊讶 |
| AU6 | Cheek Raiser | 0-0.8 | ⚠️ 弱L偏 | 0.0 | Duchenne真诚标记(左脸~12%强) |
| AU7 | Lid Tightener | 0-0.6 | ✅ L/R | 0.1 | 专注/怀疑 |
| AU9 | Nose Wrinkler | 0-0.7 | ❌ 对称 | 0.0 | 厌恶(几乎总是对称) |
| AU10 | Upper Lip Raiser | 0-0.6 | ✅ L/R | 0.0 | 厌恶/蔑视/单侧=冷笑 |
| AU12 | Lip Corner Puller | 0-1 | ✅ L/R | 0.05 | **关键AU**: 单侧=蔑视, 左偏=真诚笑容 |
| AU14 | Dimpler | 0-0.5 | ✅ L/R | 0.0 | 酒窝/俏皮(常单侧) |
| AU15 | Lip Corner Depressor | 0-0.8 | ✅ L/R | 0.05 | 悲伤/失望/单侧=苦笑 |
| AU16 | Lower Lip Depressor | 0-0.6 | ❌ 对称 | 0.0 | 悲伤/不屑 |
| AU17 | Chin Raiser | 0-0.7 | ❌ 对称 | 0.0 | 不确定/委屈 |
| AU18 | Lip Puckerer | 0-0.5 | ❌ 对称 | 0.0 | 思考/亲吻 |
| AU20 | Lip Stretcher | 0-0.9 | ⚠️ 弱 | 0.0 | 恐惧/紧张/假笑 |
| AU22 | Lip Funneler | 0-0.6 | ❌ 对称 | 0.0 | "O"口型/惊喜 |
| AU23 | Lip Tightener | 0-0.9 | ❌ 对称 | 0.0 | 愤怒/克制 |
| AU24 | Lip Pressor | 0-0.8 | ❌ 对称 | 0.0 | 压抑/忍耐 |
| AU25 | Lips Part | 0-1 | ❌ 对称 | 0.0 | 说话/惊讶 |
| AU26 | Jaw Drop | 0-1 | ❌ 对称 | 0.0 | 惊讶/大笑 |
| AU27 | Mouth Stretch | 0-1 | ❌ 对称 | 0.0 | 极度惊讶/尖叫 |
| AU43 | Eye Closure | 0-1 | ✅ L/R | 0.0 | 闭眼/用力闭眼/单侧=wink |
| AU45 | Blink | 0/1 | ❌ 对称 | — | 每4-6秒一次 |

### 5.3 情绪混合公式 (v6增强 — 含不对称偏侧 + OAO时序 + 真伪诊断)

```
喜悦(Happiness) 真诚:
  AU6≥0.3(L:1.12×R) + AU12≥0.3(L:1.08×R) + AU25≥0.2(laugh)
  OAO: onset=120-180ms apex=200-500ms offset=250-500ms curve=gaussian
  genuineness: ≥0.85 (杜兴标记)

喜悦(Happiness) 社交假笑:
  AU12≥0.3(L=R) + AU6<0.15
  OAO: onset=60-100ms apex=400-800ms offset=100-200ms curve=linear
  genuineness: ≤0.4

悲伤(Sadness):
  AU1≥0.4(L略强) + AU4≥0.3 + AU15≥0.4(L略强) + AU17≥0.2 + AU43≥0.1
  OAO: onset=250-400ms apex=500-2000ms offset=400-700ms curve=logistic

愤怒(Anger):
  AU4≥0.6(L略强) + AU5≥0.3 + AU7≥0.4 + AU23≥0.5 + AU24≥0.2
  OAO: onset=50-100ms apex=200-1000ms offset=200-400ms curve=skewR

恐惧(Fear):
  AU1≥0.5 + AU2≥0.5 + AU4≥0.3 + AU5≥0.6 + AU20≥0.3 + AU25≥0.3 + AU26≥0.5
  OAO: onset=40-80ms apex=100-300ms offset=200-400ms curve=expDecay

厌恶(Disgust):
  AU4≥0.3 + AU7≥0.3 + AU9≥0.5 + AU10≥0.3
  OAO: onset=60-120ms apex=100-300ms offset=150-350ms curve=skewR

惊讶(Surprise):
  AU1≥0.4 + AU2≥0.4 + AU5≥0.5 + AU25≥0.3 + AU26≥0.6
  OAO: onset=30-80ms apex=100-200ms offset=200-400ms curve=expDecay

蔑视(Contempt):
  AU4≥0.2 + AU12单侧≥0.4(L/R差>0.35) + AU10≥0.1
  OAO: onset=80-150ms apex=200-600ms offset=150-300ms curve=skewR

紧张(Anxiety):
  AU1+2=0.3 + AU4=0.3 + AU7=0.4(L略强) + AU20=0.2 + AU23=0.2
  OAO: onset=100-200ms apex=随场景持续 offset=随缓解 curve=gaussian
  ANS: PULSE car0.3/tem0.15 SWEAT stage1-2 瞳孔扩大

释然(Relief):
  AU6=0.15 + AU12=0.2 + AU43=0.3(慢闭眼 L:0.35 R:0.25)
  OAO: onset=150-300ms apex=300-800ms offset=400-800ms curve=skewL
```

### 5.4 生理模型 (v6增强)

眨眼:
```
基线 15-20 bpm (每3-5s一次), 每次100-150ms
眨眼类型: soft(半眨75%)/complete(完全20%)/double(双连眨3%)/long(长闭>300ms 1%)/flutter(快速扇动1%)
高arousal(愤怒/恐惧/兴奋): +8-12 bpm → 20-35 bpm
低arousal(悲伤/疲劳): -5-10 bpm → 8-15 bpm
高度集中/阅读: -10-15 bpm → 5-10 bpm
欺骗/认知负荷: +5-8 bpm → 20-28 bpm, 同时减少眨眼幅度(变为更多soft类型)
```

瞳孔:
```
diameter(mm) = 2.0 + arousal × 6.0
arousal=0.0→2.0mm, 0.25→3.5mm, 0.5→5.0mm, 0.75→6.5mm, 1.0→8.0mm
明环境-1mm, 暗环境+1.5mm
瞳孔振荡(Hippus): ±0.15mm @0.3Hz (正常), 高arousal时消失
```

呼吸:
```
基线 12-16 cpm, 胸40%:腹60%
焦虑: 20-30 cpm, 胸70%:腹30% (浅快)
悲伤: 8-12 cpm, 胸30%:腹70% (深呼吸+叹息)
惊讶: 屏息0-3s后快速呼气
恐惧: 不规则浅快+偶尔屏息
愤怒: 深而有力的呼吸, 呼气延长
```

头部姿态:
```
基线 p0° y0° r0°
兴趣: yaw±3-5° pitch+3-5°
怀疑: yaw-5~-8°
赞同: pitch+3-5° 多次微点头
自信: pitch-2-3°
顺从: pitch+5-8°
困惑: pitch+5° yaw±3-5°
```

### 5.5 视线状态机 (v6扩展 — 8状态)

```
FOCUS ←→ SCAN (搜寻性眼跳 2-5Hz)
FOCUS ←→ EMPHASIS (！/？/引号，瞳孔扩大，眼裂微张)
FOCUS ←→ AVOID (…/回避场景，向下+侧方15-30°)
FOCUS ←→ RECALL (思考/回忆，上视L或R 20-35°)
FOCUS ←→ DART (焦虑，高频小幅眼跳4-6Hz，瞳孔扩大)
FOCUS → VACANT (走神/离解，正中无焦，瞳孔缩小)
FOCUS → PURSUIT (跟踪移动物体，平滑追随)
```

| 状态 | 眼球位置 | 瞳孔 | 扫视特征 | 触发 |
|------|---------|------|---------|------|
| **FOCUS** | 正中 | 正常 | 微眼跳1-2Hz | 默认/对话 |
| **SCAN** | 水平扫视L↔R | 正常 | 眼跳2-5Hz, 10-30° | 分号/列举/观察 |
| **EMPHASIS** | 正中 | 扩大0.5-1.5mm | 微眼跳↓ | ！/？/" |
| **AVOID** | 下+左/右15-30° | 缩小0.3-0.8mm | 减少 | …/羞愧/说谎 |
| **RECALL** | 左上/右上20-35° | 扩大0.3-0.8mm | 暂停 | 思考/回忆 |
| **DART** | 小幅快速跳动 | 扩大1-2mm | 4-6Hz, 3-8° | 焦虑/恐惧 |
| **VACANT** | 正中无焦 | 缩小0.5-1mm | 微眼跳↓ | 走神/离解 |
| **PURSUIT** | 平滑追踪 | 正常 | 0眼跳 | 追视移动物 |

### 5.6 微表情泄漏模式 (v6新增)

当角色试图压抑某种情绪时，微表情会在特定AU上以<200ms的速度泄漏：

| 压抑的情绪 | 泄漏AU | 典型持续时间 | OAO | 触发场景示例 |
|-----------|--------|------------|-----|------------|
| 压抑悲伤 | AU1+AU4 微闪 | 60-100ms | onset=50ms apex=40ms offset=70ms expDecay | 说到伤心事但强颜欢笑 |
| 压抑愤怒 | AU4+AU7 微闪 | 50-80ms | onset=30ms apex=40ms offset=60ms expDecay | 被冒犯但保持礼貌 |
| 压抑喜悦 | AU6 微闪 (杜兴泄漏) | 40-80ms | onset=30ms apex=30ms offset=50ms expDecay | 听到好消息但需保持严肃 |
| 压抑恐惧 | AU5 微闪 (上睑提) | 30-60ms | onset=20ms apex=30ms offset=40ms expDecay | 表面镇定但内心恐慌 |
| 压抑厌恶 | AU9 微闪 (皱鼻) | 40-70ms | onset=30ms apex=30ms offset=50ms expDecay | 吃难吃食物但礼貌 |
| 压抑蔑视 | AU12单侧微闪 | 40-80ms | onset=30ms apex=40ms offset=60ms expDecay | 面对讨厌的人但微笑 |
| 压抑紧张 | AU7+AU23+AU20 | 60-120ms | onset=40ms apex=50ms offset=80ms gaussian | 面试/演讲前的镇定面具 |
| 压抑惊讶 | AU1+2+5 微闪 | 50-100ms | onset=30ms apex=50ms offset=70ms expDecay | 已知道消息但装惊讶 |

### 5.7 表情共发音 (v6新增)

当连续两个镜头/标点间表情发生变化时，存在过渡融合区：

```
COART规则:
  重叠区: A的最后30-50% offset 与 B的最初20-40% onset 重叠
  区域差异: 嘴部AU过渡速度 > 眼部AU过渡速度 (~1.5×)
  优势规则: 较高arousal的情绪在模糊区域获胜
  持久性: AU1(眉抬)常跨过渡持续, AU6(颊提)比AU12(嘴角)消退慢
```

关键过渡模式:
```
微笑→中性: AU12先消退(~250ms), AU6后消退(~400ms), 眼部温暖残留 (杜兴标记)
哭泣→微笑: AU15→AU12, AU1+AU4+泪液持续可见, 呼吸从抽泣→平稳 (1-3s)
恐惧→释然: AU5最快下降(~100ms), 瞳孔缓慢收缩(~2s), 呼吸从浅快→深呼吸
愤怒→悲伤: AU4强度降, AU23→AU15, 呼吸从急促→缓慢深呼吸 (1-2s)
惊讶→喜悦: AU5降, AU6升, AU25闭→AU12扬 (300-800ms)
```

### 5.8 ANS自主神经效应 (v6新增)

高arousal情绪场景必须注入以下ANS参数:

```
ANS参数:
  PULSE: 颈动脉可见搏动carotid{0.0-0.5} 颞浅动脉temporal{0.0-0.3}
    平静0.05-0.1, 紧张0.15-0.25, 恐惧/愤怒0.3-0.45, 极度恐惧0.4-0.5
  SKIN: 脸红flush[{zones=cheeks/ears/neck: 0.0-1.0}] 脸白blanch[{zones=lips/face: 0.0-1.0}]
    愤怒=深红(cheeks:0.7,ears:0.5,neck:0.3), 尴尬=粉红(cheeks:0.4,ears:0.6), 恐惧=发白(lips:0.5,face:0.3)
  SWEAT: 出汗stage{0-5} sheen{0.0-1.0} zones=[forehead/temples/upper_lip/nose/chin]
    0=干燥, 1=微光泽, 2=明显湿润, 3=汗珠, 4=流淌, 5=如注
  TEAR: 泪液stage{0-5}
    0=正常, 1=泪河增厚, 2=眼泛泪光, 3=泪水盈眶, 4=泪珠滑落, 5=泪流满面
```

### 5.9 表情真伪诊断 (v6新增)

根据OAO时序参数判断表情真伪:

```
真诚表情指标 (genuineness ≥ 0.75):
  - onset在120-180ms范围 (不过快)
  - curve为gaussian (对称钟形)
  - apex在200-500ms (不过长)
  - AU6+AU12同时出现 (杜兴标记)
  - AU12左偏~12% (右脑情绪处理)

虚假表情指标 (genuineness ≤ 0.4):
  - onset < 100ms (太快) 或 > 300ms (太慢)
  - curve为linear (机械式)
  - apex > 600ms (停留过久=故作)
  - offset < 150ms (突然弹回=开关式)
  - AU6缺失 (无杜兴标记)
  - AU12对称 (有意控制)

genuineness计算公式:
  score = timing_score(onset,apex,offset,curve) × 0.4
        + duchenne_score(AU6,AU12) × 0.35
        + asymmetry_score(AU12_L/AU12_R) × 0.15
        + coart_score(过渡自然度) × 0.10
```

### 5.10 每镜头v6 FACS注入格式

**对话镜头 (完整v6格式):**
```
FACS v6:
  AU1={L_val/R_val} AU2={L/R} AU4={L/R} AU5={L/R} AU6={L/R} AU7={L/R}
  AU9={val} AU10={L/R} AU12={L/R} AU14={L/R} AU15={L/R} AU16={val}
  AU17={val} AU18={val} AU20={L/R} AU22={val} AU23={val} AU24={val}
  AU25={val} AU26={val} AU27={val} AU43={L/R} AU45={rate}
  ASYMM_LEVEL: {L0_SYMMETRIC/L1_SUBTLE/L2_MODERATE/L3_STRONG/L4_UNILATERAL}
  EXPR_TIMING: onset={ms}ms apex={ms}ms offset={ms}ms curve={gaussian/logistic/expDecay/linear/skewR/skewL/doublePeak/stutter}
  GENUINENESS: {0.0-1.0}
  COART: {prev_emotion}→{cur_emotion} overlap={ms}ms eye_fade={ms}/{ms} mouth_fade={ms}/{ms}
  MICRO: macro[{emotion}/I{0.x}] leakage[{emotion}/AUs/timing] suppression{0.x}
  EYES: GAZE:{state} SACC:{deg}°/{deg/s}°/s MICROSACC:{Hz}Hz HIPPUS:{mm}mm VERGENCE:{deg}° TEAR:{stage}
  PHYSIO: BLINK:{bpm}bpm type:{soft/complete/double/long/flutter} PUPIL:{mm}mm BREATH:{cpm}cpm ch{ch}%dia{dia}%
  HEAD: pitch{p}° yaw{y}° roll{r}°
  ANS: PULSE car{0.x}/tem{0.x} SKIN flush[{zones}] blanch[{zones}] SWEAT stage{0-5} TEAR stage{0-5}
  对话驱动: punct_seq="{punctuation_sequence}" → AU_activations=[{list}] + leakages=[{micro_list}]
```

**非对话镜头 (v6基线, 叠加角色静息张力):**
```
FACS v6:
  AU1=0.05(L:0.05/R:0.05) AU2=0.02(L/R) AU4=0.05(L/R) AU5=0.0(L/R) AU6=0.0(L/R) AU7=0.1(L/R)
  AU9=0.0 AU10=0.0(L/R) AU12=0.05(L/R) AU14=0.0(L/R) AU15=0.05(L/R) AU16=0.0
  AU17=0.0 AU18=0.0 AU20=0.0(L/R) AU22=0.0 AU23=0.0 AU24=0.0
  AU25=0.0 AU26=0.0 AU27=0.0 AU43=0.0(L/R) AU45=0
  ASYMM_LEVEL: L0_SYMMETRIC
  EXPR_TIMING: onset=0ms apex=0ms offset=0ms curve=linear
  GENUINENESS: N/A (baseline)
  COART: none→neutral
  MICRO: macro[neutral/I0.0] leakage[none] suppression0.0
  EYES: GAZE:FOCUS SACC:0°/0°/s MICROSACC:2Hz HIPPUS:0.15mm VERGENCE:0° TEAR:0
  PHYSIO: BLINK:18bpm type:soft PUPIL:4.0mm BREATH:14cpm ch40%dia60%
  HEAD: pitch0° yaw0° roll0°
  ANS: PULSE car0.05/tem0.0 SKIN flush[] sweat0 tear0
```

### [CHECKPOINT_5]
```
═══ [CHECKPOINT_5] ═══
步骤: Step 5/6 — 表情注入 v6
状态: ✅ 完成
产出:
  - [N]个镜头完整v6 FACS向量 (含不对称AU + OAO时序)
  - [N]个镜头泄漏检测 (有压抑情绪场景)
  - [N]个镜头共发音过渡 (相邻表情变化场景)
  - [N]个镜头ANS自主神经效应 (高arousal场景)
  - [N]个镜头生理模型 (blink/pupil/breath/head/gaze v6)
下一步: Step 6/6 — 交叉审计 + 质检
用户指令: 说 "继续" / "修改镜头X表情" / "暂停" / "退出"
═══════════════════════
```

---

## Step 6: 交叉审计 + 质检

### 6a: 5层交叉审计

对**每个镜头**逐层审计。全部5层PASS才交付。

#### Audit 1: 自一致性 (Self-Consistency) — 检测维度间矛盾

| # | 检测 | 不通过修复 |
|---|------|-----------|
| 1.1 | T-stop < T1.8 且 prompt含 "deep focus/all in focus" | prompt→"razor-thin DOF" |
| 1.2 | T-stop > T8 且 prompt含 "shallow DOF/background blur" | prompt→"deep focus" |
| 1.3 | Kelvin < 3500K 且 prompt含 "cold/cool/icy" | prompt→warm描述 |
| 1.4 | Kelvin > 5000K 且 prompt含 "warm tungsten/golden/amber cozy" | prompt→cool/daylight描述 |
| 1.5 | cameraMove=Static 且 stabilization=handheld | stab→tripod |
| 1.6 | distance 不在 shotType 物理范围 | distance→范围中值 |
| 1.7 | 焦距≤18mm 且 prompt含 "compressed/flattened" | prompt→"exaggerated perspective" |
| 1.8 | 焦距≥135mm 且 prompt含 "deep space/exaggerated" | prompt→"compressed/flattened" |
| 1.9 | clothing=silk 且 particle=rain 无湿身描述 | 添加湿身效果 |
| 1.10 | 场景时间≠Kelvin推导值 (偏差>500K) | Kelvin→时间推导值 |
| 1.11 | FACS不对称性与情绪声明矛盾: "蔑视"但AU12对称, 或"惊讶"但AU1单侧强>0.3 | 调整AU不对称至情绪默认值 |
| 1.12 | GENUINENESS评分与OAO时序矛盾: genuineness>0.8但onset<80ms或curve=linear | 调整OAO至真诚模式, 或降低genuineness |
| 1.13 | 泄漏声明存在但无micro表达式数据: suppression<0.8但leakage为空 | 根据情绪抑制特征补充泄漏AU |

#### Audit 2: 维度完整性 (Dimension Coverage)

| # | 检查 | 缺失时补全 |
|---|------|-----------|
| 2.1 | D1: kelvin + keyFillRatio | 从scene.time + mood推导 |
| 2.2 | D2: lens + tStop + iso + stabilization | 默认 35mm T2.8 ISO800 tripod |
| 2.3 | D3: 每出场角色 hair+skin+eyes+hands+clothing | 从CHAR解剖档案复制 |
| 2.4 | D4: 对话镜头 AU1/2/4/5/6/12/15/25/26 | 从标点→AU映射补全 |
| 2.5 | D5: speed + trajectory | 从动作描述推导 |
| 2.6 | D6: particleType + density | 默认 none dens=0 |
| 2.7 | D7: LUT + warmCoolBalance | 默认 Kodak_2383_D55 50% |
| 2.8 | D8: ≥1表面 rough+spec+metallic | 从场景道具补 |
| 2.9 | D9: ambientLayer | 从场景推导 |
| 2.10 | D10: grainType + grainIntensity | 默认 fine_film 2% |

#### Audit 3: 物理合理性 (Physics Plausibility)

| # | 检测 | 合理范围 |
|---|------|---------|
| 3.1 | Kelvin | 1000-20000K |
| 3.2 | T-stop | T0.7-T64 |
| 3.3 | ISO | 50-409600 |
| 3.4 | Shutter angle | 45-360° |
| 3.5 | 24fps+180° ≠ 1/48s | 须为1/48s |
| 3.6 | Pupil | 2-8mm |
| 3.7 | Blink rate | 8-35 bpm |
| 3.8 | Breathing rate | 8-30 cpm |
| 3.9 | 小空间(<10m²)光源 | ≤3 key sources |
| 3.10 | 最近对焦 | 85mm ≥85cm, 50mm ≥50cm |
| 3.11 | height vs 景别 | ECU/CU eye level, WS chest level |
| 3.12 | weightFeel > 0 | 所有物体 |
| 3.13 | FACS AU值 | 0.0-1.0, 不对称L/R差≤0.65 (任何AU) |
| 3.14 | OAO onset | 30-500ms (微表情30-100ms, 宏表情100-500ms) |
| 3.15 | OAO apex | 0-2000ms (0=闪烁, >2000=冻结) |
| 3.16 | OAO offset | 50-800ms |
| 3.17 | ANS 颈动脉搏动 | 0.02-0.5 |
| 3.18 | ANS 出汗stage | 0-5, sheen 0.0-1.0 |
| 3.19 | TEAR stage | 0-5 |
| 3.20 | SACC amplitude vs velocity | velocity ≈ 20×√amplitude + 80 (非线性关系) |

#### Audit 4: 引用完整性 (Reference Integrity)

| # | 检测 |
|---|------|
| 4.1 | 所有 CHAR_XX 在角色表中有定义 |
| 4.2 | 所有 SCENE_XX 在场景表中有定义 |
| 4.3 | 同一CHAR的 hair.color/skin.tone/eyes.irisColor 跨镜头一致 |
| 4.4 | 同一SCENE的 kelvin基准 ±500K |
| 4.5 | 角色位置从上一镜 stateAfter 承接 |
| 4.6 | 角色不出现在未关联场景 |
| 4.7 | 无 dangling ref (引用了不存在的CHAR_/SCENE_) |

#### Audit 5: 可合成性 (Synthesizability)

| # | 检测 |
|---|------|
| 5.1 | 无占位符: "TBD"/"auto"/"default"/"—" |
| 5.2 | 无省略引用: "同上"/"见上文"/"ditto" |
| 5.3 | SYNTHESIZED PROMPT 包含所有10维的关键参数 |
| 5.4 | prompt长度 ≥100词 |
| 5.5 | 无中英文混用语病 |
| 5.6 | 每个CHAR展开为具体物理描述而非ID引用 |

### 审计执行协议
```
对每镜头:
  for audit in [1,2,3,4,5]:
    result = check(shot, audit)
    if FAIL:
      auto_fix(shot, audit.failure)
      重新执行当前audit (最多3次)
      
ALL 5 PASS → shot.audit = "✅"
ANY still FAIL after 3 retries → shot.audit = "❌ [{audit_name}]" → 报告用户
```

### 6b: 一致性质检

- [ ] 角色恒定特征跨镜头不变
- [ ] 角色表情指纹跨镜头一致 (静息张力/expressivity/不对称偏侧/眨眼风格)
- [ ] 场景恒定元素跨镜头一致
- [ ] 光线渐变合理 (同场景≤3°/镜)
- [ ] 时间流逝合理
- [ ] 相邻镜头有明确过渡设计 (含表情共发音COART)
- [ ] 角色状态从上一镜stateAfter承接
- [ ] 称谓统一 (CHAR_ID/SCENE_ID)
- [ ] 每镜头10维完整
- [ ] 对话镜头有v6 FACS向量 (含不对称+OAO时序)
- [ ] 高arousal场景有ANS效应注入
- [ ] 情绪压抑场景有微表情泄漏数据
- [ ] 审计标记完整

### 审计报告模板
```
━━ 交叉审计报告 | SHOT_{id} ━━
Audit 1 自一致性:   ✅ PASS / ❌ FAIL [{items}]
Audit 2 维度完整性: ✅ PASS / ❌ FAIL [{items}]
Audit 3 物理合理性: ✅ PASS / ❌ FAIL [{items}]
Audit 4 引用完整性: ✅ PASS / ❌ FAIL [{items}]
Audit 5 可合成性:   ✅ PASS / ❌ FAIL [{items}]
→ 最终: ✅ 审计通过 → 交付 / ❌ 需修复 [{failed_audits}]
━━━━━━━━━━━━━━━━━━━━━━
```

### [CHECKPOINT_6] — 最终关卡
```
═══ [CHECKPOINT_6] ═══
步骤: Step 6/6 — 交叉审计 + 质检
状态: ✅ 完成
产出:
  - [N]个镜头审计报告
  - 全序列一致性质检报告 (含v6表情一致性)
  - [P]个镜头✅通过 / [F]个镜头❌失败
最终: ✅ 全部通过 → 等待用户说 "结束创作" 正式退出
      ❌ 有失败镜头 → 等待用户说 "修复 [镜头X]" 或 "结束创作"
用户指令: 说 "结束创作" 退出 / "修复 [镜头X]" 重新审计
═══════════════════════
```

> ⚠️ **AI 注意**: CHECKPOINT_6 是最终关卡。即使全部通过，AI 也 **不得自行宣布"完成"并退出 Skill 模式**。必须等待用户明确说 "结束创作"。AI 此时只能做两件事: (1) 等待用户指令 (2) 如果用户说"修复"则重新执行 Step 4-6。

---

## 附录: 快速命令参考

```
"开始创作" / "拆解剧本"     → 激活 Skill，开始 Step 1
"继续"                      → 进入下一步
"暂停"                      → 保存状态
"修改 [角色X/场景Y/镜头Z]"  → 返回修正
"生成镜头 N-M"              → 指定镜头范围
"极致模式" / "10维度输出"   → 确保全维度填充 (默认已启用)
"v6表情模式" / "不对称输出" → 确保v6 FACS全参数 (不对称+OAO+泄漏+ANS)
"只做审计"                  → 跳过生成，仅执行 Step 6
"表情真伪分析 SHOT_X"       → 对单个镜头做genuineness分析
"结束创作" / "退出"         → 结束 Skill 模式
```

---

## 附录: AI 工具参数速查

| 工具 | Prompt长度 | 时长 | 备注 |
|------|-----------|------|------|
| Runway Gen-3 | 200-400词 | 4-10s | motion_bucket |
| Pika Labs | 100-200词 | 2-5s | image-to-video |
| Kling | 150-300词 | 5-10s | 中文友好 |
| Sora | 300-500词 | 10-60s | 详细场景 |
| Luma Dream | 100-250词 | 2-5s | 风格迁移 |
| Jimeng | 50-150词 | 2-5s | 字节系 |
| Midjourney | 50-200词 | — | --ar --style |
| SD/FLUX | 100-300词 | — | CFG, steps |
| ComfyUI | 不限 | — | AnimateDiff |
