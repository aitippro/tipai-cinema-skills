# Skill: AI 视频创作工作室 v5

剧本→AI视频。自包含，单文件加载即用。

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
Step 2: 角色锁定        → 角色解剖档案 + 场景锁定 + 上下文表初始化
Step 3: 镜头拆解        → 镜头序列表 (含景别/运镜/过渡设计/上下文承接)
Step 4: 逐镜生成        → 每镜头完整10维数据 + 合成英文prompt
Step 5: 表情注入        → 每镜头FACS向量 + 生理模型
Step 6: 交叉审计        → 5层审计 + 19条质检 → ✅交付 / ❌修复→重审
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

### 2.3 场景锁定
```
[SCENE_01] 场景名 v1.0
恒定: [地点] | [建筑特征] | [色彩基调] — 全片不变
可变: [时间] | [光线角度] | [天气] | [人物位置]
光线基准: [kelvin值]K — 所有该场景镜头在此基准±500K内
```

### 2.4 上下文表初始化
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
  - [N]个角色解剖档案 (含微细节)
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

### D4: FACS 表情 (详见 Step 5)

本步骤先注入基线值，Step 5 做完整的对话驱动注入。

非对话镜头FACS基线:
```
FACS: AU1=0.05 AU2=0.02 AU4=0.05 AU5=0.0 AU6=0.0 AU7=0.1 AU9=0.0 AU10=0.0 AU12=0.05 AU14=0.0 AU15=0.05 AU16=0.0 AU17=0.0 AU18=0.0 AU20=0.0 AU22=0.0 AU23=0.0 AU24=0.0 AU25=0.0 AU26=0.0 AU27=0.0 AU43=0.0 AU45=0
  BLINK: 18bpm | PUPIL: 4.0mm | BREATH: 14cpm chest40%dia60%
  HEAD: p0° y0° r0° | GAZE: FOCUS
```

对话镜头：先在此注入基线，Step 5 中按标点→AU映射覆盖。

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

## Step 5: 表情注入 (FACS Vector Injection)

对**每个镜头**注入完整的 Prompt-FACS Vector。对话镜头按标点驱动，非对话镜头注入基线。

### 5.1 标点→AU映射

| 标点 | 关键AU | 强度 | 头部 | 视线 | 语速 |
|------|--------|------|------|------|------|
| ， | AU1+2 | 0.30 | pitch+2° | FOCUS | 1.0x |
| 、 | AU1+2 | 0.25 | — | FOCUS | 1.0x |
| 。 | AU1+2 | 0.15 | pitch-2° | FOCUS | 0.9x |
| ？ | AU1+2+5 | 0.75 | pitch+5° yaw+3° | EMPHASIS | 1.1x |
| ！ | AU20+5+12 | 0.85 | pitch+8° | EMPHASIS | 1.2x |
| … | AU1+2 | 0.40 | yaw-3° | AVOID | 0.5x |
| ； | AU1+2+4 | 0.55 | pitch+3° yaw+2° | SCAN | 1.0x |
| ： | AU1+2 | 0.35 | — | FOCUS | 1.0x |
| "" | AU1+2+20 | 0.50 | yaw±2° | EMPHASIS | 1.0x |
| —— | AU1+2+4 | 0.45 | pitch+3° | FOCUS | 1.0x |

### 5.2 完整25+ AU参照

| AU | 名称 | 范围 | 日常基线 | 触发条件 |
|----|------|------|---------|---------|
| AU1 | Inner Brow Raiser | 0-1 | 0.05 | 悲伤/疑问/惊讶 |
| AU2 | Outer Brow Raiser | 0-1 | 0.02 | 惊讶/恐惧 |
| AU4 | Brow Lowerer | 0-1 | 0.05 | 愤怒/专注/困惑 |
| AU5 | Upper Lid Raiser | 0-1 | 0.0 | 恐惧/惊讶 |
| AU6 | Cheek Raiser | 0-0.8 | 0.0 | Duchenne笑容标记 |
| AU7 | Lid Tightener | 0-0.6 | 0.1 | 专注/怀疑 |
| AU9 | Nose Wrinkler | 0-0.7 | 0.0 | 厌恶 |
| AU10 | Upper Lip Raiser | 0-0.6 | 0.0 | 厌恶/蔑视 |
| AU12 | Lip Corner Puller | 0-1 | 0.05 | 微笑/喜悦 |
| AU14 | Dimpler | 0-0.5 | 0.0 | 酒窝/俏皮 |
| AU15 | Lip Corner Depressor | 0-0.8 | 0.05 | 悲伤/失望 |
| AU16 | Lower Lip Depressor | 0-0.6 | 0.0 | 悲伤/不屑 |
| AU17 | Chin Raiser | 0-0.7 | 0.0 | 不确定/委屈 |
| AU18 | Lip Puckerer | 0-0.5 | 0.0 | 思考/亲吻 |
| AU20 | Lip Stretcher | 0-0.9 | 0.0 | 恐惧/紧张/假笑 |
| AU22 | Lip Funneler | 0-0.6 | 0.0 | "O"口型/惊喜 |
| AU23 | Lip Tightener | 0-0.9 | 0.0 | 愤怒/克制 |
| AU24 | Lip Pressor | 0-0.8 | 0.0 | 压抑/忍耐 |
| AU25 | Lips Part | 0-1 | 0.0 | 说话/惊讶 |
| AU26 | Jaw Drop | 0-1 | 0.0 | 惊讶/大笑 |
| AU27 | Mouth Stretch | 0-1 | 0.0 | 极度惊讶/尖叫 |
| AU43 | Eye Closure | 0-1 | 0.0 | 闭眼/用力闭眼 |
| AU45 | Blink | 0/1 | — | 每4-6秒一次 |

### 5.3 情绪混合公式
```
喜悦:   AU6≥0.3 + AU12≥0.3 + AU25≥0.2(laugh) + AU14≥0.1
悲伤:   AU1≥0.4 + AU4≥0.3 + AU15≥0.4 + AU17≥0.2 + AU43≥0.1
愤怒:   AU4≥0.6 + AU5≥0.3 + AU7≥0.4 + AU23≥0.5 + AU24≥0.2
恐惧:   AU1≥0.5 + AU2≥0.5 + AU4≥0.3 + AU5≥0.6 + AU20≥0.3 + AU25≥0.3 + AU26≥0.5
厌恶:   AU4≥0.3 + AU7≥0.3 + AU9≥0.5 + AU10≥0.3
惊讶:   AU1≥0.4 + AU2≥0.4 + AU5≥0.5 + AU25≥0.3 + AU26≥0.6
蔑视:   AU4≥0.2 + AU12单侧≥0.4 + AU10≥0.1
紧张:   AU1+2=0.3 + AU4=0.3 + AU7=0.4 + AU20=0.2 + AU23=0.2
释然:   AU6=0.15 + AU12=0.2 + AU43=0.3(慢闭眼)→基线回归
```

### 5.4 生理模型

眨眼:
```
基线 15-20 bpm (每3-5s一次), 每次100-150ms
高arousal(愤怒/恐惧/兴奋): +8-12 bpm → 20-35 bpm
低arousal(悲伤/疲劳): -5-10 bpm → 8-15 bpm
高度集中/阅读: -10-15 bpm → 5-10 bpm
```

瞳孔:
```
diameter(mm) = 2.0 + arousal × 6.0
arousal=0.0→2.0mm, 0.25→3.5mm, 0.5→5.0mm, 0.75→6.5mm, 1.0→8.0mm
明环境-1mm, 暗环境+1.5mm
```

呼吸:
```
基线 12-16 cpm, 胸40%:腹60%
焦虑: 20-30 cpm, 胸70%:腹30% (浅快)
悲伤: 8-12 cpm, 胸30%:腹70% (深呼吸)
惊讶: 屏息0-3s后快速呼气
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

### 5.5 视线状态机
```
FOCUS ←→ SCAN (列举/搜寻时)
FOCUS ←→ EMPHASIS (！/？/引号时)
FOCUS ←→ AVOID (…/羞愧时)
RECALL (回忆/思考时上视)
```

| 状态 | 眼球位置 | 触发 |
|------|---------|------|
| FOCUS | 居中 | 默认/逗号后/句号后 |
| SCAN | L→R 200-400ms | 分号/列举 |
| EMPHASIS | 居中+微睁大 | ！/？/" |
| AVOID | down+left/right | …/犹豫/羞愧 |
| RECALL | up+right/left | 思考/回忆 |

### 5.6 每镜头FACS注入格式

对话镜头:
```
FACS: AU1={} AU2={} AU4={} AU5={} AU6={} AU7={} AU9={} AU10={} AU12={} AU14={} AU15={} AU16={} AU17={} AU18={} AU20={} AU22={} AU23={} AU24={} AU25={} AU26={} AU27={} AU43={} AU45={}
  BLINK: {bpm}bpm | PUPIL: {mm}mm | BREATH: {cpm}cpm chest{chest}%dia{diaph}%
  HEAD: p{pitch}° y{yaw}° r{roll}° | GAZE: {state}
  对话驱动: 标点序列="{punctuation_sequence}" → AU激活=[{au_activations}]
```

非对话镜头 (基线):
```
FACS: AU1=0.05 AU2=0.02 AU4=0.05 AU5=0.0 AU6=0.0 AU7=0.1 AU9=0.0 AU10=0.0 AU12=0.05 AU14=0.0 AU15=0.05 AU16=0.0 AU17=0.0 AU18=0.0 AU20=0.0 AU22=0.0 AU23=0.0 AU24=0.0 AU25=0.0 AU26=0.0 AU27=0.0 AU43=0.0 AU45=0
  BLINK: 18bpm | PUPIL: 4.0mm | BREATH: 14cpm chest40%dia60%
  HEAD: p0° y0° r0° | GAZE: FOCUS
```

### [CHECKPOINT_5]
```
═══ [CHECKPOINT_5] ═══
步骤: Step 5/6 — 表情注入
状态: ✅ 完成
产出:
  - [N]个镜头完整FACS向量 (对话镜头含标点驱动AU)
  - [N]个镜头生理模型 (blink/pupil/breath/head/gaze)
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
- [ ] 场景恒定元素跨镜头一致
- [ ] 光线渐变合理 (同场景≤3°/镜)
- [ ] 时间流逝合理
- [ ] 相邻镜头有明确过渡设计
- [ ] 角色状态从上一镜stateAfter承接
- [ ] 称谓统一 (CHAR_ID/SCENE_ID)
- [ ] 每镜头10维完整
- [ ] 对话镜头有FACS向量
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
  - 全序列一致性质检报告
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
"只做审计"                  → 跳过生成，仅执行 Step 6
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
