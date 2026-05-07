# 📚 参考手册: 极致细节注入引擎 (Micro-Detail Injection Engine)

> **本文件是参考手册。** ai-video-studio.md v5 已内联全部10维度参数表，AI 运行时无需加载此文件。此文件保留供深度查询和独立研究使用。

---

## 核心原则

1. **零标签** — 不用 "warm light"、"soft bokeh"、"cinematic look"，全部用数值+物理量
2. **全填充** — 10 个维度每个必须至少 1 个参数被明确赋值
3. **可审计** — 所有参数值必须在定义的合理范围内，确保 cross-audit.md 能通过
4. **互一致** — 维度间参数遵循关联规则，不得产生矛盾

---

## Dimension 1: Lighting Physics (灯光物理)

### 必填参数
| 参数 | 范围 | 单位 | 推导逻辑 |
|------|------|------|---------|
| kelvin | 1000-20000 | K | 场景时间: dawn=3500±300, noon=5600±300, afternoon=4500±300, golden_hour=3800±300, sunset=3000±300, tungsten=3200, moonlight=4100±200 |
| keyAzimuth | 0-360 | deg | 0=cam-right, 90=front, 180=cam-left, 270=back |
| keyElevation | 0-90 | deg | 0=地平线, 45=经典3/4, 90=顶光 |
| diffusionType | 枚举 | — | china_silk, softbox_octa, softbox_rect, umbrella_white, umbrella_silver, fresnel, litemat, book_light, window_diffuse, bare_bulb, beauty_dish, none |
| diffusionMaterial | 枚举 | — | grid_40, grid_60, grid_80, honeycomb_10deg, honeycomb_30deg, 216_diffusion, 250_diffusion, opal_frost, none |
| keyFillRatio | 1:1 ~ 16:1 | — | 情绪推导: 1:1=flat/neutral, 2:1=beauty/soft, 3:1=standard, 4:1=dramatic, 8:1=noir, 16:1=silhouette |
| shadowHardness | 0.0-1.0 | — | 0=完全柔化, 0.3=柔影, 0.5=中性, 0.7=硬影, 1.0=刀锋影 |
| falloffRate | 0.1-1.0 | — | 小空间=1.0(快衰减), 大空间=0.1(慢衰减) |
| rimSeparation | 0-180 | deg | key与rim间的夹角 |
| practicalCount | 0-10 | 个 | 画面中可见的实际光源数量 |
| colorContrast | — | — | { warmSource_K: [2800-4500], coolSource_K: [5500-6500] } |

### 变化逻辑
```
情绪 → keyFillRatio:
  中性/日常 → 2:1~3:1
  浪漫/柔美 → 1:1~2:1 (low ratio)
  紧张/悬疑 → 4:1~8:1 (high ratio)
  恐怖/惊悚 → 8:1~16:1 (extreme ratio)

空间面积 → falloff:
  <10m² → 0.7-1.0
  10-50m² → 0.4-0.7
  50-200m² → 0.2-0.4
  >200m² → 0.1-0.2

时间 → kelvin ± 情绪偏移:
  悲伤/压抑 → kelvin - 300K (偏冷)
  温馨/幸福 → kelvin + 200K (偏暖)
  紧张/恐惧 → kelvin - 500K (冷调强化)
```

### 关联规则
- shadowHardness = 1.0 - (diffusionStopLoss / 6)。china_silk_1.5stop → hardness=0.3
- keyFillRatio > 8:1 → rimSeparation 须 ≥ 90°（否则脸全黑）
- 外景 daytime → keyFillRatio 隐含 fill 来自天空 (≈5600K)
- practicalCount > 0 → 每个 practical 提供 1/4 stop fill (隐含)

### 注入格式
```
LIGHTING: {kelvin}K key@{az}°/{el}°, {diffusionType}({diffusionMaterial}), key:fill {ratio}, rim sep {rimSep}°, shadow {shadowHardness}, falloff {falloffRate}, {practicalCount} practicals, warm{coolContrast_warm}K/cool{coolContrast_cool}K
```

---

## Dimension 2: Camera Physics (摄影机物理)

### 必填参数
| 参数 | 范围 | 单位 | 推导逻辑 |
|------|------|------|---------|
| body | 枚举 | — | ARRI_Alexa_35, ARRI_Alexa_Mini_LF, RED_V_Raptor, RED_Komodo, SONY_Venice_2, SONY_FX6, Canon_C500_Mk2, Blackmagic_Pocket_6K, Blackmagic_URSA_12K, iPhone_16_Pro, custom |
| sensorFormat | 枚举 | — | full_frame, super_35, s35_open_gate, MFT, anamorphic_s35, 65mm, imax |
| lens | string | — | "{brand}_{model}_{focalLength}mm" 例: ARRI_MasterPrime_85mm |
| tStop | T0.7-T64 | — | 情绪推导: intimate=T1.3~T2.0, normal=T2.8~T4, objective=T5.6~T11 |
| iso | 50-409600 | — | 日外=100~400, 日内=400~1600, 夜外=1600~12800 |
| shutterAngle | 45-360 | deg | 标准=180, 少运动模糊=45~90, 多运动模糊=270~360 |
| height | 0-500 | cm | eye=160, waist=100, low=30, ground=5, high=300 |
| distance | 5-50000 | cm | ECU=5~40, CU=40~100, MS=100~500, WS=500~5000, EWS=>5000 |
| tilt | -90~+90 | deg | 0=水平, +n=仰拍, -n=俯拍 |
| filtration | list | — | [{type: ND/Pola/Diffusion/VND, strength: 0.3/0.6/0.9/1.2/1.8/2.4/3.0}] |
| stabilization | 枚举 | — | tripod, gimbal, steadicam, shoulder_rig, handheld, drone, cable_cam, dolly, crane, none |
| breathingComp | 0.0-1.0 | — | 0=无呼吸效应, 1.0=严重呼吸效应 |

### 变化逻辑
```
景别 → distance:
  ECU(特写) = 5-40cm
  CU(近景) = 40-100cm
  MS(中景) = 100-500cm
  WS(全景) = 500-5000cm
  EWS(大远景) = >5000cm

焦距 → 视角特征:
  12-18mm = ultra_wide (强烈透视畸变)
  21-28mm = wide (环境优先)
  35-50mm = normal (人眼视角)
  65-100mm = tele_portrait (面部压缩)
  135-200mm = tele_compressed (空间压缩)
  >200mm = extreme_compression

叙事意图 → tStop:
  主角孤立/亲密 → T1.3~T2.0 (浅景深，主角与背景分离)
  双人/多人对话 → T2.8~T4 (中景深，两人都在焦内)
  环境交代/客观视角 → T5.6~T11 (深景深，一切清晰)
```

### 关联规则
- f-stop(≈tStop) + 焦距 + distance → 景深:
  T1.4 + 85mm + 50cm → DOF≈0.3cm (极端浅)
  T4 + 35mm + 200cm → DOF≈120cm (适中)
  T11 + 24mm + 500cm → DOF≈∞ (全景深)
- shutterAngle=180 + fps=24 → 1/48s → 运动模糊适中
- handheld + T1.4 → 可能跑焦 → breathingComp>0.5
- gimbal + 14mm → 浮游感

### 注入格式
```
CAMERA: {body} {sensorFormat}, {lens} @ {tStop}, ISO {iso}, shutter {shutterAngle}°, {stabilization}, H{height}cm D{distance}cm T{tilt}°, breathing {breathingComp}, filter {filtration}
```

---

## Dimension 3: Character Anatomy (角色解剖)

### 必填参数
| 参数 | 范围 | 单位 | 说明 |
|------|------|------|------|
| hair.color | hex | #000000-#FFFFFF | 头发基色 |
| hair.length | 0-150 | cm | 0=光头 |
| hair.texture | 枚举 | — | straight, wavy, curly, coiled, kinky, mixed |
| hair.flyaway | 0.0-1.0 | — | 飞丝毛躁度 |
| hair.highlights | hex | — | 高光色 |
| skin.tone | hex | — | 肤色基准 |
| skin.texture | 枚举 | — | smooth, fine_pores, visible_pores, rough, scarred |
| skin.sssZones | list | — | [cheek, nose, ear, finger_tip, lip] |
| skin.oiliness | 0.0-1.0 | — | 0=完全哑光, 1=重度油光 |
| eyes.irisColor | hex | — | 虹膜色 |
| eyes.catchlight | 枚举 | — | window_rect, ring_light_circle, softbox_square, dot, none |
| eyes.lashDensity | 枚举 | — | sparse, medium, thick |
| hands.nailLength | 0-30 | mm | 指甲长度 |
| hands.nailPolish | hex | — | 美甲色 (空=自然) |
| hands.veinVisibility | 0.0-1.0 | — | 手背血管可见度 |
| hands.knuckleDef | 0.0-1.0 | — | 关节明显度 |
| clothing.fabric | 枚举 | — | cotton, silk, wool, linen, denim, polyester, leather, nylon, velvet, chiffon, tweed, cashmere |
| clothing.weaveVisibility | 0.0-1.0 | — | 织纹可见度 |
| clothing.drapeStiffness | 0.0-1.0 | — | 0=极软(丝绸), 1=极硬(牛仔) |
| clothing.wearPatterns | string | — | 穿着痕迹描述 |

### 情绪影响
- skin.oiliness + 0.2 in high_anxiety (紧张出汗)
- skin.sssZones 在冷光(>5600K)下减少30%
- clothing.drapeStiffness 在湿环境下降低0.3

### 注入格式
```
CHAR: {CHAR_ID}
  HAIR: #{color} {length}cm {texture} flyaway{flyaway} highlights#{highlights}
  SKIN: #{tone} {texture} SSS[{sssZones}] oil{0.x}
  EYES: iris#{irisColor} catchlight_{catchlight} lash_{lashDensity}
  HANDS: nail{mm}mm polish#{nailPolish} vein{0.x} knuckle{0.x}
  CLOTHING: {fabric} weave{weaveVisibility} drape{drapeStiffness} wear:{wearPatterns}
```

---

## Dimension 4: Facial Micro-Expression (FACS AU Grid)

### AU 定义 (25+ 动作单元)
| AU | 名称 | 范围 | 中文描述 |
|----|------|------|---------|
| AU1 | Inner Brow Raiser | 0.0-1.0 | 眉心抬 |
| AU2 | Outer Brow Raiser | 0.0-1.0 | 眉尾抬 |
| AU4 | Brow Lowerer | 0.0-1.0 | 皱眉 |
| AU5 | Upper Lid Raiser | 0.0-1.0 | 上睑提 |
| AU6 | Cheek Raiser | 0.0-1.0 | 脸颊提升 (Duchenne标记) |
| AU7 | Lid Tightener | 0.0-1.0 | 眼轮匝肌收紧 |
| AU9 | Nose Wrinkler | 0.0-1.0 | 皱鼻 |
| AU10 | Upper Lip Raiser | 0.0-1.0 | 上唇提 |
| AU12 | Lip Corner Puller | 0.0-1.0 | 嘴角上扬 |
| AU14 | Dimpler | 0.0-1.0 | 酒窝 |
| AU15 | Lip Corner Depressor | 0.0-1.0 | 嘴角下压 |
| AU16 | Lower Lip Depressor | 0.0-1.0 | 下唇下压 |
| AU17 | Chin Raiser | 0.0-1.0 | 下巴上提 |
| AU18 | Lip Puckerer | 0.0-1.0 | 撅嘴 |
| AU20 | Lip Stretcher | 0.0-1.0 | 嘴角横向拉 |
| AU22 | Lip Funneler | 0.0-1.0 | 唇漏斗 |
| AU23 | Lip Tightener | 0.0-1.0 | 唇收紧 |
| AU24 | Lip Pressor | 0.0-1.0 | 唇压 |
| AU25 | Lips Part | 0.0-1.0 | 唇分开(不见齿) |
| AU26 | Jaw Drop | 0.0-1.0 | 下颌落 |
| AU27 | Mouth Stretch | 0.0-1.0 | 嘴大张 |
| AU43 | Eye Closure | 0.0-1.0 | 闭眼 |
| AU45 | Blink | 0/1 | 眨眼 |

### 情绪混合公式
```
喜悦(happiness):   AU6≥0.3 + AU12≥0.3 (+ AU25=0.2 for laugh)
悲伤(sadness):     AU1≥0.4 + AU4≥0.3 + AU15≥0.4 (+ AU17≥0.2)
愤怒(anger):       AU4≥0.6 + AU5≥0.4 + AU7≥0.4 + AU23≥0.5
恐惧(fear):        AU1≥0.5 + AU2≥0.5 + AU4≥0.3 + AU5≥0.6 + AU25≥0.3 + AU26≥0.5
厌恶(disgust):     AU4≥0.3 + AU7≥0.3 + AU9≥0.5 + AU10≥0.3
惊讶(surprise):    AU1≥0.4 + AU2≥0.4 + AU5≥0.5 + AU25≥0.3 + AU26≥0.6
轻蔑(contempt):    AU4≥0.2 + AU12L≥0.4 or AU12R≥0.4 (单侧不对称)
```

### 生理模型
```
Blink Rate: 基线18bpm, 情绪调节±10, 范围8-35bpm
Pupil Dilatation: 2-8mm, 由 arousal [0.0-1.0] 线性映射: 2 + arousal × 6
Breathing: 基线14cpm, 焦虑 +10, 悲伤 -4, 恐惧 apnea 0-3s
Gaze: FOCUS=直视, SCAN=扫视L→R, AVOID=回避, EMPHASIS=强调, RECALL=回忆(上视)
HeadPose: pitch[-30°~+30°], yaw[-45°~+45°], roll[-15°~+15°]
```

### 注入格式
```
FACS: AU1={n} AU2={n} AU4={n} AU5={n} AU6={n} AU7={n} AU9={n} AU10={n} AU12={n} AU14={n} AU15={n} AU16={n} AU17={n} AU18={n} AU20={n} AU22={n} AU23={n} AU24={n} AU25={n} AU26={n} AU27={n} AU43={n} AU45={n}
  BLINK: {n}bpm | PUPIL: {n}mm | BREATH: {n}cpm chest{n}%dia{n}%
  HEAD: pitch{n}° yaw{n}° roll{n}° | GAZE: {FOCUS/SCAN/AVOID/EMPHASIS/RECALL}
```

---

## Dimension 5: Action Micro-Movement (动作微运动)

### 必填参数
| 参数 | 范围 | 单位 |
|------|------|------|
| speed | 0.01-500 | cm/s |
| trajectory | 枚举 | linear, arc, s_curve, figure8, random_walk, bezier, oscillate, parabolic |
| cycleFreq | 0.1-20 | Hz |
| amplitude | 0.01-200 | cm |
| accelCurve | 枚举 | linear, ease_in, ease_out, ease_in_out, bounce, elastic, exponential |
| weightFeel | 枚举 | featherlight(0.0), light(0.25), neutral(0.5), heavy(0.75), massive(1.0) |
| secondaryMotion | 0.0-1.0 | — |
| contactGripPressure | 0.0-1.0 | — |
| contactDeformation | 0-5 | mm |

### 推导逻辑
```
角色体型 → weightFeel:
  瘦削(<50kg) → 0.0-0.3
  标准(50-80kg) → 0.3-0.6
  魁梧(>80kg) → 0.6-1.0

情绪 → 运动特征:
  紧张 → speed+30%, amplitude-50%, cycleFreq+50%, 微颤
  放松 → speed-20%, amplitude+20%, cycleFreq-30%
  愤怒 → speed+50%, accelCurve=exponential, secondaryMotion+0.3
```

### 注入格式
```
ACTION: speed{cm/s}cm/s, {trajectory} trajectory, {Hz}Hz cycle, {cm}cm amp, {accelCurve} ease, weight {weightFeel}, 2nd_motion {0.x}, grip{0.x} def{mm}mm
```

---

## Dimension 6: Atmosphere & Environment (大气环境)

### 必填参数
| 参数 | 范围 | 单位 | 说明 |
|------|------|------|------|
| particleType | 枚举 | — | dust, fog, haze, smoke, steam, rain, snow, ash, pollen, none |
| particleDensity | 0.0-1.0 | — | 0=完全透明, 0.05=细微可见, 0.3=明显雾, 0.7=浓雾/smoke |
| particleSize | 1-500 | μm | 1=fine dust, 10=pollen, 50=rain, 200=snow |
| convection | 枚举 | — | still, rising, swirling, crosswind_left, crosswind_right, turbulent, thermal |
| humidityEffect | 枚举 | — | none, heat_shimmer(地面热浪), mist_breath(呼出白气), lens_fog, condensation |
| volumetricIntensity | 0.0-1.0 | — | 体光(丁达尔效应)强度 |
| ambientOcclusion | 0.0-1.0 | — | AO强度 |

### 场景推导
```
场景类型 → particleType:
  咖啡馆 → steam + dust
  街道日 → dust (low)
  街道夜 → fog (variable)
  雨天外 → rain
  森林 → pollen + dust + mist
  室内 → none (or steam if kitchen/bath)
  战场 → smoke + ash + dust (high)

场景面积 → volumetricIntensity:
  <10m² → 0.1-0.3
  10-100m² → 0.3-0.6
  >100m² → 0.6-1.0
```

### 注入格式
```
ATMOSPHERE: {particleType} density{0.x} size{μm}μm, {convection}, humidity:{humidityEffect}, volumetric{0.x}, AO{0.x}
```

---

## Dimension 7: Color Science (色彩科学)

### 必填参数
| 参数 | 范围 | 说明 |
|------|------|------|
| keyColors | [{role, hex}] | primary, secondary, accent, background |
| LUT | 枚举 | Kodak_2383_D55, Kodak_2383_D60, Kodak_2393, ARRI_LogC_to_Rec709, Fuji_3510, Fuji_3513, ACES_1.3, Bleach_Bypass, CrossProcess, TealOrange, custom |
| saturation | {r:0-2, g:0-2, b:0-2} | 1.0=标准, <1=欠饱和, >1=过饱和 |
| contrastRatio | 10:1-1000:1 | 低对比=10:1~50:1, 标准=100:1~300:1, 高对比=>500:1 |
| blackPoint | 0-10 | IRE |
| whitePoint | 90-100 | IRE |
| colorHarmony | 枚举 | complementary, analogous, triadic, split_complementary, monochromatic, tetradic, custom |
| warmCoolBalance | 0-100 | % warm; 0=全冷调, 50=中性, 100=全暖调 |
| grainIntensity | 0-15 | % |

### 场景推导
```
风格 → LUT:
  日系清新 → Fuji_3510
  电影写实 → Kodak_2383_D55
  赛博朋克 → TealOrange or CrossProcess
  战争/灰暗 → Bleach_Bypass
  纪录片 → Rec709

情绪 → warmCoolBalance:
  温馨 → 60-80
  中性 → 40-60
  冷峻 → 20-40
  恐怖 → 10-30
```

### 注入格式
```
COLOR: LUT_{LUT}, grain{grainIntensity}%, sat R{saturation.r} G{saturation.g} B{saturation.b}, contrast{contrastRatio}:1, BP{blackPoint}IRE WP{whitePoint}IRE, {colorHarmony}, {warmCoolBalance}%warm
  KEY: pri=#{primary_hex} sec=#{secondary_hex} acc=#{accent_hex} bg=#{background_hex}
```

---

## Dimension 8: Material Properties (材质属性)

### 必填参数（按表面类型分别描述）
| 参数 | 范围 | 说明 |
|------|------|------|
| roughness | 0.0-1.0 | 0=镜面反射, 0.5=半哑光, 1.0=完全漫反射 |
| specularity | 0.0-1.0 | 0=无镜面反射, 1.0=完美镜面 |
| sss | 0.0-1.0 | 次表面散射强度 (皮肤/蜡/大理石) |
| fresnel | 0.0-1.0 | 菲涅尔效应强度 |
| anisotropy | 0.0-1.0 | 各向异性 (拉丝金属) |
| clearcoat | 0.0-1.0 | 清漆层 (车漆/指甲油) |
| metallic | 0.0-1.0 | 0=电介质, 1=纯金属 |
| bumpIntensity | 0.0-1.0 | 凹凸贴图强度 |
| textureScale | — | 纹理物理尺寸(如"皮革纹 2mm/cycle") |

### 常见材质预设
```
人体皮肤: rough=0.4 spec=0.05 sss=0.4 fresnel=0.3 metallic=0.0
陶瓷杯: rough=0.1 spec=0.8 sss=0.05 fresnel=0.5 metallic=0.0 clearcoat=0.3
木桌: rough=0.7 spec=0.02 sss=0.0 fresnel=0.1 metallic=0.0 bump=0.4
玻璃窗: rough=0.01 spec=0.95 sss=0.0 fresnel=0.9 metallic=0.0
不锈钢: rough=0.05 spec=0.9 sss=0.0 fresnel=0.8 metallic=1.0 anisotropy=0.3
丝绸: rough=0.15 spec=0.6 sss=0.1 fresnel=0.6 metallic=0.0 anisotropy=0.4
水: rough=0.02 spec=0.95 sss=0.1 fresnel=0.95 metallic=0.0
```

### 注入格式
```
MATERIAL: [{surface_name}] rough{0.x} spec{0.x} sss{0.x} fresnel{0.x} anisot{0.x} clear{0.x} metal{0.x} bump{0.x}
```

---

## Dimension 9: Audio-Visual Sync (视听同步)

### 必填参数
| 参数 | 范围 | 说明 |
|------|------|------|
| soundSourcePos | {x,y,z} cm | 相对摄影机的位置 |
| reverbType | 枚举 | room, hall, cathedral, plate, spring, digital, outdoor_natural, anechoic, none |
| reverbDecay | 50-5000 | ms |
| foleyPoints | [{time_ms, action, sync_object}] | 拟音同步点 |
| visemeSeq | [{time_ms, phoneme, AU25, AU26, AU27}] | 口型序列 |
| ambientLayer | string | 环境音描述 |

### 推导
```
场景空间 → reverbType + decay:
  小房间(<20m²) → room, 200-500ms
  中型空间(20-100m²) → hall, 500-1500ms
  大空间(>100m²) → cathedral, 1500-3000ms
  户外 → outdoor_natural, 50-200ms

对话文本 → visemeSeq (逐音素):
  见 tpema-expression.md viseme映射表
```

### 注入格式
```
AUDIO: src[{x},{y},{z}]cm, reverb_{reverbType} {decay}ms, {n} foley syncs, viseme:[{viseme_seq}], ambient:"{ambientLayer}"
```

---

## Dimension 10: Post-Production (后期处理)

### 必填参数
| 参数 | 范围 | 说明 |
|------|------|------|
| grainType | 枚举 | fine_film, coarse_film, digital_noise_fine, digital_noise_coarse, bleach_bypass, none |
| grainIntensity | 0-15 | % |
| halation | 0.0-1.0 | 光晕（胶片特有） |
| chromaticAberration | 0-5 | px |
| lensDistortion | -5% ~ +5% | 负=桶形, 正=枕形 |
| vignette | 0.0-1.0 | 暗角强度 |
| gateWeave | 0-2 | px 片门抖动 |
| anamorphicSqueeze | 1.0, 1.33, 1.8, 2.0 | x |

### ISO → grain 映射
```
ISO 100-200 → grain 0-1%
ISO 400-800 → grain 1-3%
ISO 1600-3200 → grain 3-7%
ISO 6400+ → grain 7-15%
```

### 注入格式
```
POST: grain_{grainType} {grainIntensity}%, halation{0.x}, CA{CAPx}px, distortion{lensDistortion}%, vignette{0.x}, gate{gateWeave}px, squeeze{anamorphicSqueeze}x
```

---

## 全维度注入模板 (最终合成)

```
━━ SHOT_{id} [{duration}s | {shotType} | {cameraMove} | ← {prev_shot_id}] ━━

LIGHTING: {kelvin}K key@{az}°/{el}° {diffusionType}({diffusionMaterial}), key:fill {ratio}, rim sep {sep}°, shadow {hardness}, falloff {falloff}, {practical} practicals

CAMERA: {body} {sensorFormat}, {lens} @ {tStop}, ISO {iso}, shutter {angle}°, {stabilization}, H{height}cm D{distance}cm T{tilt}°

CHAR_{id}: HAIR #{hairColor} {length}cm {texture} fly{flyaway}; SKIN #{skinTone} {texture} SSS[{zones}] oil{oiliness}; EYES iris#{irisColor} ct_{catchlight} lash_{density}; HANDS nail{nail}mm #{polish}; CLOTHING {fabric} wea{weave} dra{stiffness}

FACS: AU1={} AU2={} AU4={} AU5={} AU6={} AU7={} AU9={} AU10={} AU12={} AU14={} AU15={} AU16={} AU17={} AU18={} AU20={} AU22={} AU23={} AU24={} AU25={} AU26={} AU27={} AU43={} AU45={}
  BLINK: {bpm}bpm PUPIL: {mm}mm BREATH: {cpm}cpm ch{chest}%dia{diaph}% | HEAD: p{pitch}° y{yaw}° r{roll}° | GAZE: {state}

ACTION: speed{speed}cm/s, {trajectory}, {freq}Hz, {amp}cm amp, {accel}, weight {weight}, 2nd_mot {sec}, grip{grip} def{def}mm

ATMOSPHERE: {particle} dens{density} size{size}μm, {convection}, humidity:{humidity}, vol{volumetric} AO{ao}

COLOR: LUT_{lut}, grain{grain}%, sat R{satR} G{satG} B{satB}, contrast{contrast}:1, BP{bp}IRE WP{wp}IRE, {harmony}, {warm}%warm

MATERIAL: [{key_surfaces with roughness/spec/sss/fresnel/anisot/clear/metal/bump}]

AUDIO: src[{x},{y},{z}]cm, reverb_{reverbType} {decay}ms, viseme:[{visemes}], ambient:"{ambient}"

POST: grain_{grainType} {grainIntensity}%, halation{halation}, CA{ca}px, distort{distortion}%, vignette{vignette}, gate{gateWeave}px, squeeze{squeeze}x

SYNTHESIZED PROMPT:
"[将所有维度合成为连贯的英文自然语言，100-400词，适合目标AI视频工具直接使用]"

AUDIT RESULT:
[交叉审计: ✅自一致性 ✅维度完整 ✅物理合理 ✅引用完整 ✅可合成 → 交付]
```

---

## 快速命令

"注入全维度" | "极致模式" | "物理级细节" | "10维度输出" | "生成微细节块" | "导出FACS向量" | "材质预设查询 [表面名]"
