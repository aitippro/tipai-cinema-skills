# Skill: 交叉审计引擎 v1.0 (Cross-Audit Engine)

提示词生成后、交付用户前的最终质检关卡。5 层独立审计，任一不通过即自动修复→重新审计，全部通过后才放行。

> **引用链**: 被 ai-video-studio.md Step 6 调用。审计标准基于 micro-detail-injection.md 的 10 维度参数网格。

---

## 审计架构

```
  生成提示词（10维度结构化数据 + 合成自然语言）
          │
          ▼
  ┌──────────────────────────────────┐
  │  Audit 1: 自一致性               │
  │  (Self-Consistency)              │
  │  维度间是否相互矛盾？              │
  └──────┬───────────────────────────┘
         │ ✅PASS / ❌FAIL→修复
         ▼
  ┌──────────────────────────────────┐
  │  Audit 2: 维度完整性             │
  │  (Dimension Coverage)            │
  │  10维度是否全部填充？              │
  └──────┬───────────────────────────┘
         │ ✅PASS / ❌FAIL→补全
         ▼
  ┌──────────────────────────────────┐
  │  Audit 3: 物理合理性             │
  │  (Physics Plausibility)          │
  │  参数值在物理世界中可能吗？        │
  └──────┬───────────────────────────┘
         │ ✅PASS / ❌FAIL→修正
         ▼
  ┌──────────────────────────────────┐
  │  Audit 4: 引用完整性             │
  │  (Reference Integrity)           │
  │  所有引用可解析？跨镜一致？        │
  └──────┬───────────────────────────┘
         │ ✅PASS / ❌FAIL→修正
         ▼
  ┌──────────────────────────────────┐
  │  Audit 5: 可合成性               │
  │  (Synthesizability)              │
  │  结构化数据→自然语言完整无遗漏？    │
  └──────┬───────────────────────────┘
         │
         ▼
  ALL 5 PASS → "✅ 交叉审计通过 → 交付用户"
```

---

## Audit 1: 自一致性 (Self-Consistency)

检测维度间的相互矛盾。

### 规则表

| # | 矛盾模式 | 检测方法 | 严重 | 自动修复 |
|---|---------|---------|------|---------|
| 1.1 | T-stop vs DOF 描述 | T<1.8 → 自然语言含 "deep focus/deep DOF/all in focus" 即矛盾 | ERROR | 将DOF描述改为 "razor-thin DOF/single plane in focus" |
| 1.2 | T-stop vs DOF 反向 | T>8 → 自然语言含 "shallow DOF/razor thin/background blur" 即矛盾 | ERROR | 将DOF描述改为 "deep focus/everything sharp" |
| 1.3 | Kelvin vs 色彩描述 | K<3500 且描述含 "cold blue/cool/icy" 即矛盾 | ERROR | 将色彩描述改为 warm 系 |
| 1.4 | Kelvin vs 色彩反向 | K>5000 且描述含 "warm tungsten/golden warm/amber cozy" 即矛盾 | ERROR | 将色彩描述改为 cool/daylight 系 |
| 1.5 | 运镜 vs 稳定方式 | cameraMove=Static 且 stabilization=handheld 即矛盾 | ERROR | stabilization→tripod |
| 1.6 | 景别 vs 距离 | distance 不在该景别物理范围内 | ERROR | distance→景别对应范围中值 |
| 1.7 | 焦距 vs 透视描述 | 14mm 且描述含 "compressed perspective/flattened" 即矛盾 | ERROR | 改为 "exaggerated perspective/deep space" |
| 1.8 | 焦距 vs 透视反向 | 200mm 且描述含 "deep space/exaggerated perspective" 即矛盾 | ERROR | 改为 "compressed perspective/flattened space" |
| 1.9 | 服装 vs 环境 | clothing.fabric="silk" 且 particleType="rain" → 应有 wetness/reflectivity 描述 | WARN | 添加 "rain-soaked silk, specularity+0.3, drape-0.3" |
| 1.10 | 时间 vs 色温 | 场景 time≠对应 kelvin 范围 (见 micro-detail-injection.md D1) | WARN | Kelvin→时间推导值 |

### 景别→距离映射
```
ECU: 5-40cm
CU: 40-100cm
MS: 100-500cm
WS: 500-5000cm
EWS: >5000cm
```

### 焦距→透视映射
```
12-18mm: exaggerated perspective, deep space, strong foreground emphasis
21-28mm: wide perspective, environmental context, moderate depth
35-50mm: natural human-eye perspective
65-100mm: compressed, flattering facial, background separation
135-200mm: highly compressed, flattened space, distant feel
>200mm: extreme compression, surveillance/observational
```

---

## Audit 2: 维度完整性 (Dimension Coverage)

确保 10 个维度无遗漏。

### 规则表

| # | 规则 | 条件 | 严重 |
|---|------|------|------|
| 2.1 | D1: LIGHTING 至少包含 kelvin+keyFillRatio | 所有镜头 | ERROR |
| 2.2 | D2: CAMERA 至少包含 lens+tStop+iso+stabilization | 所有镜头 | ERROR |
| 2.3 | D3: CHARACTER 每个出场角色有 hair+skin+eyes+hands+clothing | 有角色出场 | WARN |
| 2.4 | D4: FACS 至少包含 AU1/2/4/5/6/12/15/25/26 的值 | 对话镜头 | WARN |
| 2.5 | D5: ACTION 至少包含 speed+trajectory | 有动作的镜头 | WARN |
| 2.6 | D6: ATMOSPHERE 至少包含 particleType+density | 所有镜头 | WARN |
| 2.7 | D7: COLOR 至少包含 LUT+warmCoolBalance | 所有镜头 | WARN |
| 2.8 | D8: MATERIAL 至少对主表面有 rough+spec+metallic | 有物体交互 | WARN |
| 2.9 | D9: AUDIO 至少包含 ambientLayer | 对话镜头 | WARN |
| 2.10 | D10: POST 至少包含 grainType+grainIntensity | 所有镜头 | WARN |

### 未填充维度的自动补全策略
```
D1 缺失 → 从 scene.time 推导 kelvin，从 mood 推导 keyFillRatio
D2 缺失 → 从 shotType 推导 distance，默认 body=ARRI_Alexa_35 lens=35mm T2.8 ISO=800
D6 缺失 → particleType=none density=0
D7 缺失 → LUT=Kodak_2383_D55 grain=2%
D10 缺失 → grainType=fine_film grainIntensity=2%
```

---

## Audit 3: 物理合理性 (Physics Plausibility)

参数值必须在物理世界允许范围内。

### 规则表

| # | 规则 | 合理范围 | 严重 |
|---|------|---------|------|
| 3.1 | Kelvin | 1000-20000K | ERROR |
| 3.2 | T-stop | T0.7-T64 | ERROR |
| 3.3 | ISO | 50-409600 | ERROR |
| 3.4 | Shutter angle | 45-360° | ERROR |
| 3.5 | 24fps + 180° shutter ≠ 1/1000s | 1/48s | WARN |
| 3.6 | Pupil dilation | 2-8mm | ERROR |
| 3.7 | Blink rate | 8-35 bpm | ERROR |
| 3.8 | Breathing rate | 8-30 cpm | ERROR |
| 3.9 | 光源数量 vs 空间 | <10m²空间 ≤3 key sources | WARN |
| 3.10 | 焦距 vs 最近对焦 | 85mm lens min focus ≈85cm | WARN |
| 3.11 | 角色高度 vs 镜头高度 | height(cm) vs 景别合理性 | WARN |
| 3.12 | 重力 | 所有物体重量感 > 0 且运动方向最终向地面 | INFO |

---

## Audit 4: 引用完整性 (Reference Integrity)

所有引用可解析，跨镜头数据一致。

### 规则表

| # | 规则 | 检测方法 | 严重 |
|---|------|---------|------|
| 4.1 | CHAR_XX 在 project 中有定义 | 遍历 project.characters | ERROR |
| 4.2 | SCENE_XX 在 project 中有定义 | 遍历 project.scenes | ERROR |
| 4.3 | CHAR_XX 解剖数据跨镜头一致 | hair.color/skin.tone/eyes.irisColor 全镜头对比 | ERROR |
| 4.4 | SCENE_XX 光照基准一致 | 同一场景的 kelvin 基准 ±500K | WARN |
| 4.5 | 角色位置从上一镜 stateAfter 承接 | 当前 pos == 上一镜 stateAfter | WARN |
| 4.6 | CHAR_XX 不在未出场场景中出现 | 角色关联场景检查 | INFO |
| 4.7 | 无破碎引用 (dangling ref) | prompt中出现的所有 CHAR_/SCENE_ 可解析 | ERROR |

---

## Audit 5: 可合成性 (Synthesizability)

结构化数据必须能完整合成为自然语言，无占位符、无省略。

### 规则表

| # | 规则 | 严重 |
|---|------|------|
| 5.1 | 无 "TBD" / "auto" / "default" / "—" 占位符 | ERROR |
| 5.2 | 无 "见上文" / "同上" / "see above" / "ditto" | ERROR |
| 5.3 | 自然语言逐项对比结构化数据无遗漏 | ERROR |
| 5.4 | 合成 prompt 长度 ≥ 100 词（确保信息密度） | WARN |
| 5.5 | 无中英文混用语病 | WARN |
| 5.6 | 每个 CHAR_XX 展开为具体物理描述而非 ID 引用 | WARN |

### 合成prompt→结构化数据 反向核对清单
```
□ lighting: kelvin + keyAngle + diffusion + ratio + shadow + falloff
□ camera: body + sensor + lens + tStop + iso + shutter + height + distance
□ character: hair hex/length/texture + skin hex/texture/SSS + eyes hex/catchlight + hands + clothing
□ facs: ≥9 AU values + blink + pupil + breathing + head + gaze
□ action: speed + trajectory + cycle + amplitude + weight
□ atmosphere: particle + density + convection + volumetric
□ color: LUT + grain + saturation + contrast + harmony + balance
□ material: ≥1 surface with rough + spec + metallic
□ post: grain + halation + CA + distortion + vignette
□ 以上全部在合成 prompt 的自然语言中有对应表述
```

---

## 审计执行协议

### 单镜头审计
```
对每个镜头执行:
  for audit in [1, 2, 3, 4, 5]:
    result = audit.check(shot)
    if result.failed:
      if result.severity == ERROR:
        shot = audit.auto_fix(shot, result)
        重新执行当前 audit
      else:  # WARN
        记录警告，继续下一 audit
  
  if 所有 audit 通过 (允许 WARN):
    shot.auditResult = "✅ 交叉审计通过"
    shot.auditTrail = [audit1_pass, audit2_pass, audit3_pass, audit4_pass, audit5_pass]
    return shot
```

### 全序列审计
```
对全部镜头序列额外检查:
  - 跨镜角色位置连贯性 (来自 Audit 4.5)
  - 同场景 kelvin 一致性 (来自 Audit 4.4)
  - 同场景 atmosphere 一致性 (来自 Audit 4 — 场景级参数)
  - 角色解剖数据全局一致性 (来自 Audit 4.3)
```

---

## 审计报告输出格式

```
━━ 交叉审计报告 | SHOT_{id} ━━

Audit 1 自一致性    ✅ PASS (0 errors, 0 warns)
Audit 2 维度完整性  ✅ PASS (10/10 dimensions filled)
Audit 3 物理合理性  ✅ PASS (all params in valid ranges)
Audit 4 引用完整性  ✅ PASS (all references resolved)
Audit 5 可合成性    ✅ PASS (112 words, all params synthesized)

→ 最终决策: ✅ 审计通过 → 交付用户
```

```
━━ 交叉审计报告 | SHOT_{id} ━━

Audit 1 自一致性    ❌ FAIL (1 error)
  → [1.5] 运镜=Static 但 stabilization=handheld → 已自动修复: stabilization→tripod
Audit 2 维度完整性  ⚠ WARN (1 warn)
  → [2.8] D8:MATERIAL 未填充 → 已自动补全: 桌面 roughness=0.7 spec=0.02 metallic=0.0
Audit 3 物理合理性  ✅ PASS
Audit 4 引用完整性  ✅ PASS
Audit 5 可合成性    ✅ PASS

→ 最终决策: ✅ 自动修复后审计通过 → 交付用户
```

---

## 快速命令

"审计 SHOT_XXX" | "全序列审计" | "只看 AUDIT_1" | "修复并重新审计" | "导出审计报告"
