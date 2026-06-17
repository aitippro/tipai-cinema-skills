# 📚 参考手册: 微表情增强引擎 v6 (Micro-Expression Enhancement Engine)

> **本文件是参考手册。** ai-video-studio.md v6 已内联核心不对称AU表、OAO时序模型、微表情泄漏模式、扩展视线状态机、共发音规则、ANS效应和角色表情指纹——AI 运行时无需加载此文件。此文件保留供深度查询、独立研究和完整参数查阅使用。

---

## 架构概览

```
v6 = v5 FACS 基础 + 7 大增强模块

  v5 基线 (25+ AU, 9种情绪, 5视线状态, 3种生理模型)
    │
    ├── Module 1: AU 不对称网格 (12 AUs L/R split)
    ├── Module 2: OAO 时序动力学 (Onset-Apex-Offset 三阶段)
    ├── Module 3: 微表情分类 & 情绪泄漏
    ├── Module 4: 扩展眼动系统 (眼跳/微眼跳/辐辏/瞳孔振荡/情感泪液)
    ├── Module 5: 表情共发音 (跨表情过渡融合)
    ├── Module 6: 自主神经系统效应 (脉搏/脸红/出汗/泪膜)
    └── Module 7: 角色表情指纹 (静息张力/习惯动作/抑制模式)
```

**核心原则**: 从标签级表情 → 物理级面部生物力学，让AI生成的表情不再像机器人。

---

## Module 1: AU 不对称网格 (Asymmetry Grid)

### 1.1 不对称AU拆分

人类面部表情天然不对称。右脑（情绪处理主导）控制左侧面部，产生微妙的不对称偏差。

| AU | 名称 | 可不对称? | 不对称含义 |
|----|------|----------|-----------|
| AU1 | Inner Brow Raiser | ✅ L/R | 单侧 = 怀疑/讽刺，双侧 = 悲伤/关注 |
| AU2 | Outer Brow Raiser | ✅ L/R | 单侧 = "你确定？"，双侧 = 惊讶/恐惧 |
| AU4 | Brow Lowerer | ✅ L/R | 单侧 = 质疑/思考，双侧 = 愤怒/专注 |
| AU5 | Upper Lid Raiser | ✅ L/R | 单侧 = 警觉/狐疑，双侧 = 恐惧/惊讶 |
| AU6 | Cheek Raiser | ⚠️ 弱偏差 | 真诚笑容有 ~12% 左侧偏强 (Duchenne 标记) |
| AU7 | Lid Tightener | ✅ L/R | 单侧 = 单眼眯/怀疑，双侧 = 强光/专注 |
| AU9 | Nose Wrinkler | ❌ 通常双侧 | 厌恶几乎总是对称 |
| AU10 | Upper Lip Raiser | ✅ L/R | 单侧 = 轻蔑/冷笑 (Elvis sneer) |
| AU12 | Lip Corner Puller | ✅ L/R | **关键**: 单侧 = 蔑视，左侧偏强 = 真诚笑容 |
| AU14 | Dimpler | ✅ L/R | 酒窝常为单侧 |
| AU15 | Lip Corner Depressor | ✅ L/R | 单侧 = 苦笑/嫌弃/不以为然 |
| AU20 | Lip Stretcher | ⚠️ 弱偏差 | 恐惧-咧嘴可以有轻微不对称 |
| AU43 | Eye Closure | ✅ L/R | 单侧 = wink，双侧 = 闭眼/用力闭眼 |

### 1.2 各情绪默认不对称比

| 情绪 | 关键AU不对称 | 偏侧模式 | 机制 |
|------|------------|---------|------|
| **蔑视 (Contempt)** | AU12: L=0.0 R=0.6 或反过来 | 完全单侧 | 单侧嘴角上扬 |
| **怀疑 (Skepticism)** | AU1: L=0.5 R=0.1 | 单眉挑 | 一侧眉弓抬起 |
| **真诚笑容 (Duchenne)** | AU12: L=0.75 R=0.65, AU6: L=0.65 R=0.55 | ~15% 左偏 | 右脑情绪处理→左脸强 |
| **社交假笑 (Social Smile)** | AU12: L=0.5 R=0.5, AU6=0.0 | 对称 | 有意识控制→对称 |
| **苦笑 (Wry Smile)** | AU12: L=0.25 R=0.55 | 右偏 | 矛盾情绪 |
| **不屑 (Disdain)** | AU10: L=0.15 R=0.5 | 单侧上唇提 | 单侧冷笑 |
| **悲伤 (Sadness)** | AU1: L=0.55 R=0.45, AU15: L=0.45 R=0.35 | 轻度左偏 | 右脑情绪优势 |
| **恐惧 (Fear)** | 基本对称，AU20轻微随机偏差 | 基本对称 | 交感神经→双侧激活 |
| **愤怒 (Anger)** | AU4: L=0.65 R=0.55 | 轻度左偏 | 右脑+左脑共同 |
| **惊讶 (Surprise)** | 高度对称 | 对称 | 快速神经环路 |

### 1.3 不对称强度等级

```
L0_SYMMETRIC:  L/R 差 <0.05 (完全对称)
L1_SUBTLE:     L/R 差 0.05-0.15 (微不对称，自然)
L2_MODERATE:   L/R 差 0.15-0.35 (明显不对称，如怀疑)
L3_STRONG:     L/R 差 0.35-0.60 (显著不对称，如蔑视)
L4_UNILATERAL: L/R 差 >0.60 (几乎单侧，如冷笑)
```

### 1.4 注入格式

```
FACS_ASYMM: AU1=0.45(L:0.50/R:0.40) AU4=0.60(L:0.65/R:0.55) AU12=0.70(L:0.78/R:0.62)
  asymmetry_level: L1_SUBTLE
```

---

## Module 2: OAO 时序动力学 (Onset-Apex-Offset Model)

### 2.1 三阶段模型

真实表情不是瞬时出现的。每个表情有三段时间：

```
        intensity
          1.0 ┤         ┌─ APEX ─┐
              ┤        ╱           ╲
              ┤       ╱             ╲
              ┤  ON ╱               ╲ OFF
          0.0 ┤───╱───────────────────╲────  baseline
              └───────────────────────────── time
              |←onset→|←-apex-→|←offset→|
```

| 阶段 | 范围 | 说明 |
|------|------|------|
| **Onset** (起始) | 30-500ms | 从基线到峰值的速度。越短→越突然 |
| **Apex** (峰值) | 0-2000ms | 峰值持续时间。0ms=闪烁，>500ms=宏表情 |
| **Offset** (消退) | 50-800ms | 从峰值回到基线的速度。越短→"弹回"感 |

### 2.2 过渡曲线类型

| 曲线 | 形状 | 适用场景 |
|------|------|---------|
| **gaussian** | 对称钟形 | 真诚笑容、自然表情 |
| **logistic** | S形慢起→快→慢收 | 悲伤、沉思、忧郁 |
| **expDecay** | 快起→指数衰减 | 惊讶、惊吓 |
| **linear** | 直线 | 假笑、机械式表情 |
| **doublePeak** | 双峰 | 矛盾情绪、笑中带泪 |
| **skewR** | 快起慢收 | 愤怒、厌恶 |
| **skewL** | 慢起快收 | 豁然开朗、顿悟 |
| **stutter** | 振动式 | 强忍哭泣、憋笑 |

### 2.3 诊断性时序模式

**这是区分真/假表情的关键:**

| 表情类型 | Onset | Apex | Offset | 曲线 | 真/假 |
|---------|-------|------|--------|------|------|
| 真诚杜兴笑容 | 120-180ms | 200-500ms | 250-500ms | gaussian | ✅ 真 |
| 社交假笑 | 60-100ms | 400-800ms | 100-200ms | linear | ❌ 假 |
| 礼貌微笑 | 80-120ms | 300-600ms | 150-300ms | gaussian | ⚠️ 中性 |
| 微表情泄漏 | 40-80ms | 50-100ms | 60-100ms | expDecay | 🔒 压抑的真情 |
| 轻度悲伤 | 250-400ms | 500-2000ms | 400-700ms | logistic | ✅ 真 |
| 突然惊讶 | 30-80ms | 100-200ms | 200-400ms | expDecay | ✅ 真 |
| 假装惊讶 | 80-150ms | 300-800ms | 100-200ms | linear | ❌ 假 |
| 压抑愤怒 | 50-100ms | 200-1000ms | 300-600ms | skewR | 🔒 部分压抑 |
| 爆发愤怒 | 30-60ms | 300-800ms | 200-400ms | skewR | ✅ 真 |
| 恐惧 | 40-80ms | 100-300ms | 200-400ms | expDecay | ✅ 真 |
| 厌恶 | 60-120ms | 100-300ms | 150-350ms | skewR | ✅ 真 |
| 释然 | 150-300ms | 300-800ms | 400-800ms | skewL | ✅ 真 |

### 2.4 表情真伪检测 (AI可使用此表判断角色是否在说谎)

```
如果 剧本说"她笑得很开心" 但 时序参数是 {onset:70ms, apex:600ms, offset:120ms, curve:linear}
→ 判断: 假笑。角色在掩饰什么。

如果 剧本说"他看起来很平静" 但 FACS检测到:
  {AU12: L=0.08 R=0.02 onset:50ms apex:60ms offset:80ms} 微表情泄漏
→ 判断: 蔑视微表情。角色内心不屑。
```

### 2.5 注入格式

```
EXPR_TIMING: onset=145ms apex=320ms offset=380ms curve=gaussian
  genuineness_score: 0.92  (由时序参数计算，>0.75=真诚)
```

---

## Module 3: 微表情分类 & 情绪泄漏

### 3.1 三级分类

| 类别 | 持续时长 | AU激活数 | 意识控制 | 检测难度 | 示例 |
|------|---------|---------|---------|---------|------|
| **Macro-expression** (宏表情) | 500-4000ms | 完整组合 | ✅ 有意识 | 容易 | 正常情绪表达 |
| **Micro-expression** (微表情) | 40-200ms | 完整但快速 | ❌ 无意识 | 极难 | 压抑的真情泄漏 |
| **Subtle expression** (弱表情) | 500-4000ms | 部分AU | ⚠️ 半意识 | 中等 | 克制的微笑(无AU6) |

### 3.2 抑制-泄漏映射表

当一个角色试图压抑某种情绪时，微表情会在特定AU上泄漏：

| 压抑的情绪 | 泄漏AU | 典型持续时间 | 触发场景 |
|-----------|--------|------------|---------|
| 压抑悲伤 | AU1+AU4 微闪 | 60-100ms | 说到伤心事但强颜欢笑 |
| 压抑愤怒 | AU4+AU7 微闪 | 50-80ms | 被冒犯但保持礼貌 |
| 压抑喜悦 | AU6 微闪 (杜兴泄漏) | 40-80ms | 听到好消息但需保持严肃 |
| 压抑恐惧 | AU5 微闪 | 30-60ms | 表面镇定但内心恐慌 |
| 压抑厌恶 | AU9 微闪 | 40-70ms | 吃到难吃食物但保持礼貌 |
| 压抑蔑视 | AU12单侧微闪 | 40-80ms | 面对讨厌的人但保持微笑 |
| 压抑惊讶 | AU1+2+5 微闪 | 50-100ms | 已经知道消息但装惊讶 |
| 压抑紧张 | AU7+AU23+AU20 微闪 | 60-120ms | 面试/演讲前的镇定面具 |

### 3.3 双重情绪 (Simultaneous Blends)

两张情绪同时出现，各占面部不同区域：

| 双重情绪 | 上脸 (眼睛/眉) | 下脸 (嘴/鼻) | 含义 |
|---------|---------------|-------------|------|
| 悲喜交加 | AU1+AU4+AU6 (悲伤眼) | AU12 (笑容嘴) | 含泪微笑 |
| 愤怒恐惧 | AU5+AU7 (恐惧眼) | AU4+AU23 (愤怒嘴) | 愤怒之下是恐惧 |
| 鄙视同情 | AU1+AU2 (关注眉) | AU10单侧 (不屑嘴) | 我同情你但看不起你 |
| 惊喜困惑 | AU1+AU2+AU5 (惊讶) | AU4+AU17 (困惑嘴) | 又惊又疑 |
| 紧张兴奋 | AU5+AU7 (紧张眼) | AU12+AU25 (兴奋嘴) | 又紧张又期待 |

### 3.4 注入格式

```
MICRO_EXPR:
  macro: {emotion: happiness, intensity: 0.7, timing: {onset:145ms apex:320ms offset:380ms}}
  leakage: [{emotion: sadness, AU: [AU1=0.35, AU4=0.25], timing: {onset:60ms apex:80ms offset:70ms}, trigger: "提到母亲"}]
  suppression_level: 0.6  (0=完全释放, 1=完全压抑)
```

---

## Module 4: 扩展眼动系统

### 4.1 眼跳模型 (Saccade Model)

```
SACCADE: amp={deg}° vel={deg/s}°/s dir={direction} lat={ms}ms
```

| 参数 | 范围 | 说明 |
|------|------|------|
| amplitude | 1-40° | 阅读=2-8°, 扫视场景=10-40°, 检查细节=1-3° |
| velocity | 30-500°/s | 与振幅呈非线性关系: v = 20×amp^0.5 + 80 |
| direction | L/R/U/D + 角度 | 如 "R15°U5°" = 右上15° |
| latency | 150-350ms | 刺激→眼跳启动的延迟 |

**注视时长与认知状态:**
| 注视时长 | 状态 | 含义 |
|---------|------|------|
| 100-150ms | 快速扫描 | 焦虑、搜索威胁、多动 |
| 200-300ms | 正常阅读/观察 | 日常状态 |
| 300-500ms | 深度专注 | 思考、欣赏、凝视 |
| 500-1000ms | 长时间注视 | 走神、呆滞、被吸引 |
| >1000ms | 凝视/呆滞 | 震惊、催眠、深度情感连接 |

### 4.2 微眼跳 (Microsaccades)

注视期间眼球并非静止，而是持续微动：

```
MICROSACC: amp=0.05-0.5° freq=1-3Hz
```

- **振幅**: 0.05-0.5° (肉眼不可见但AI视频模型可渲染)
- **频率**: 1-3次/秒
- **功能**: 防止视网膜适应(视觉消退)，增强边缘检测
- **认知负荷↑** → 微眼跳频率↓ (注视更固定)
- **疲劳/酒精** → 微眼跳频率↑ (不稳定)

### 4.3 瞳孔振荡 (Pupil Hippus)

```
HIPPUS: amp=±0.15mm freq=0.3Hz
```

- 正常生理振荡: ±0.1-0.3mm, 0.2-0.5Hz
- 强情绪唤醒时被掩盖 (arousal >0.6 → hippus消失)
- 疲劳/认知高负荷 → hippus振幅增大

### 4.4 辐辏 (Vergence)

```
VERGENCE: angle={deg}° target_dist={cm}cm
```

| 注视距离 | 辐辏角 | 适用景别 |
|---------|--------|---------|
| 无穷远 (>6m) | 0° (平行) | EWS/WS |
| 3-6m | 1-2° | WS/MS |
| 1-3m | 2-4° | MS |
| 50-100cm | 4-8° | CU |
| 20-50cm | 8-15° | ECU |
| <20cm | 15-25° | 极端特写 |

### 4.5 情感泪液 (Emotional Tearing)

```
TEAR_STAGE: {0-5} description={}
```

| 阶段 | 描述 | 视觉特征 | 触发 |
|------|------|---------|------|
| 0 | 正常泪膜 | 角膜透明，轻微反光 | 日常 |
| 1 | 泪河增厚 | 下睑缘泪河加宽，反光增强 | 轻微感动 |
| 2 | 眼泛泪光 | 角膜反光碎裂、闪烁，晶体透明度↑ | 感动/悲伤 |
| 3 | 泪水盈眶 | 下睑缘积水，液面可见但未溢出 | 悲伤/感动加深 |
| 4 | 泪珠滑落 | 单道泪痕，沿脸颊流下 | 哭泣/极度感动 |
| 5 | 泪流满面 | 多道泪痕，脸颊湿润，眼红 | 崩溃/大哭 |

### 4.6 扩展视线状态机 (8状态)

```
FOCUS ←→ SCAN (搜寻性眼跳 2-5Hz)
FOCUS ←→ EMPHASIS (！/？/引号，瞳孔扩大，眼裂微张)
FOCUS ←→ AVOID (…/回避场景，向下+侧方 15-30°)
FOCUS ←→ RECALL (思考/回忆，上视 L或R 20-35°)
FOCUS ←→ DART (焦虑，高频小幅眼跳 4-6Hz，瞳孔扩大)
FOCUS → VACANT (走神/离解，正中无焦，瞳孔缩小)
FOCUS → PURSUIT (跟踪移动物体，平滑追随)
```

| 状态 | 眼球位置 | 瞳孔 | 扫视特征 | 触发场景 |
|------|---------|------|---------|---------|
| **FOCUS** | 正中 | 正常 | 微眼跳1-2Hz | 默认、对话 |
| **SCAN** | 水平扫视L↔R | 正常 | 眼跳2-5Hz, 10-30° | 搜寻、列举、观察环境 |
| **EMPHASIS** | 正中 | 扩大0.5-1.5mm | 微眼跳↓ | 感叹、强调、问号 |
| **AVOID** | 下+左/右 15-30° | 缩小0.3-0.8mm | 减少 | 羞愧、说谎、省思 |
| **RECALL** | 左上/右上 20-35° | 扩大0.3-0.8mm | 暂停 | 回忆、思考、(右利手=右上回忆) |
| **DART** | 小幅快速跳动 | 扩大1-2mm | 4-6Hz, 3-8° | 焦虑、恐惧、找出口 |
| **VACANT** | 正中无焦 | 缩小0.5-1mm | 微眼跳↓ | 走神、震惊、离解 |
| **PURSUIT** | 平滑追踪 | 正常 | 0眼跳, pure pursuit | 追视移动物 |

### 4.7 注入格式

```
EYES:
  GAZE: {state} | SACC: amp{deg}° vel{°/s}°/s lat{ms}ms freq{Hz}Hz
  MICROSACC: amp{deg}° freq{Hz}Hz
  HIPPUS: amp{mm}mm freq{Hz}Hz
  VERGENCE: {deg}° @{cm}cm
  TEAR: stage{0-5}
  PUPIL: {mm}mm arousal{0.x}
  BLINK: {bpm}bpm type={soft/complete/double/long/rapid_flutter}
```

---

## Module 5: 表情共发音 (Expression Coarticulation)

### 5.1 过渡重叠区

当表情A → 表情B时，两者在时间上不是断开的。有一个重叠融合区：

```
Expression A         Expression B
     |←─── offset ──→|← onset ──→|
     |               |            |
     |         overlap zone       |
     └───────→  COART  ←─────────┘
```

### 5.2 融合规则

| 规则 | 说明 |
|------|------|
| **重叠区大小** | A的最后30-50% offset 与 B的最初20-40% onset 重叠 |
| **区域差异** | 嘴部区域(AU10/12/14/15/25/26)过渡速度 > 眼部区域(AU1/2/4/5/6/7) |
| **优势规则** | 较高arousal的情绪在模糊区域获胜 |
| **持久性** | 某些AU从A持续到B——如AU1(眉抬)在短暂微笑中不消失 |

### 5.3 关键过渡模式

| 过渡 | 眼部行为 | 嘴部行为 | 生理变化 | 时长 |
|------|---------|---------|---------|------|
| **微笑→中性** | AU6消退慢于AU12(杜兴残留) | AU12 200-400ms消退 | 呼吸正常化 | 500-800ms |
| **哭泣→微笑** | AU1+AU4持续, 泪液可见 | AU15→AU12, 嘴角从下翻上 | 呼吸从抽泣到平稳 | 1-3s |
| **恐惧→释然** | AU5最快下降, 瞳孔缓慢收缩 | AU20→AU12 | 呼吸从浅快到深呼吸 | 800-1500ms |
| **愤怒→悲伤** | AU4强度下降, AU1+15上升 | AU23→AU15 | 呼吸从急促到缓慢深呼吸 | 1-2s |
| **惊讶→喜悦** | AU5下降, AU6上升 | AU25关闭→AU12上扬 | — | 300-800ms |
| **中性→厌恶** | AU4+AU7激活 | AU9+AU10激活 | — | 80-200ms |
| **专注→走神** | AU4+AU7松弛 | AU25微开 | 呼吸放缓 | 500-1500ms |

### 5.4 注入格式

```
COART: {prev_emotion}→{current_emotion} overlap={ms}ms
  eye_region: {prev_AUs} fade{ms}ms → {current_AUs} rise{ms}ms
  mouth_region: {prev_AUs} fade{ms}ms → {current_AUs} rise{ms}ms
  dominance: {winner_emotion}
  persist_AUs: [{persisting_AUs_from_prev}]
```

---

## Module 6: 自主神经系统效应 (ANS Effects)

### 6.1 可见脉搏 (Visible Pulse)

```
ANS_PULSE: carotid={0.0-0.5} temporal={0.0-0.3}
```

| 场景 | 颈动脉搏动 | 颞浅动脉搏动 | 心输出量 |
|------|-----------|------------|---------|
| 平静 | 0.05-0.1 | 0.0-0.03 | ~5L/min |
| 轻微运动/紧张 | 0.15-0.25 | 0.05-0.1 | ~8-10L/min |
| 恐惧/愤怒 | 0.3-0.45 | 0.15-0.25 | ~15-20L/min |
| 极度恐惧 | 0.4-0.5 | 0.2-0.3 | ~25L/min |
| 悲伤/抑郁 | 0.03-0.08 | 0.0 | ~4L/min |
| 睡眠 | 0.02-0.05 | 0.0 | ~4L/min |

### 6.2 皮肤血管反应 (Flush/Blanch)

```
ANS_SKIN: flush[{zones: intensity}] blanching[{zones: intensity}]
```

**脸红 (Flush — 血管扩张):**

| 类型 | 分布 | 颜色 | 速度 | 消退 | 触发 |
|------|------|------|------|------|------|
| 愤怒红 | 全面部/颈部/耳 | 深红偏紫 | 2-5s | 10-30min | 愤怒 |
| 尴尬粉 | 面颊/耳尖 | 粉红 | 3-8s | 2-10min | 尴尬/害羞 |
| 兴奋暖 | 面颊/上胸 | 暖粉 | 5-10s | 5-20min | 兴奋/激动 |
| 酒精红 | 全面部 | 红 | 10-30min | 数小时 | 酒精 |
| 高温红 | 全面部 | 深红 | 5-15min | 降温后 | 运动/高温 |

**脸白 (Blanch — 血管收缩):**

| 类型 | 分布 | 颜色 | 速度 | 消退 | 触发 |
|------|------|------|------|------|------|
| 恐惧白 | 全面部+唇 | 苍白 | 5-10s | 5-15min | 极度恐惧 |
| 休克白 | 全面部 | 灰白 | 10-30s | 需医疗 | 休克 |
| 寒冷白 | 鼻尖/耳/手指 | 白/蓝 | 渐进 | 回暖后 | 寒冷 |
| 恶心白 | 全面部+口周 | 灰绿 | 5-15s | 呕吐后 | 极度恶心 |

### 6.3 出汗进展模型

```
ANS_SWEAT: stage={0-5} distribution=[{zones}] sheen={0.0-1.0}
```

| 阶段 | 视觉 | 分布区域 | 触发 |
|------|------|---------|------|
| 0 | 干燥 | — | 正常 |
| 1 | 微光泽 (sheen=0.2) | 额头、上唇 | 轻微紧张/运动 |
| 2 | 明显湿润 (sheen=0.4) | 额头、上唇、太阳穴 | 中度紧张/焦虑 |
| 3 | 汗珠形成 (sheen=0.6) | 太阳穴、发际线、鼻尖 | 高度紧张/恐惧 |
| 4 | 汗珠融合流淌 (sheen=0.8) | 全脸、颈部 | 极度恐惧/剧烈运动 |
| 5 | 汗流如注 (sheen=1.0) | 全脸+身体 | 濒死恐惧/极限运动 |

### 6.4 泪膜变化 (Tear Film)

详见 Module 4.5 情感泪液阶段。补充：

- **基础泪液**: 维持角膜湿润，不可见
- **反射泪液**: 切洋葱、风沙 → 快速产生，大量
- **情感泪液**: 悲伤/感动/极度喜悦 → 化学组成与反射泪液不同(含更多蛋白质)
- **假哭**: 无泪或少量反射泪(用力挤眼)，无情感泪液化学成分

### 6.5 注入格式

```
ANS:
  PULSE: carotid{0.x} temporal{0.x} hr{bpm}bpm
  SKIN: flush[cheeks={0.x}/ears={0.x}/neck={0.x}] blanch[lips={0.x}/face={0.x}]
  SWEAT: stage{0-5} sheen{0.x} zones=[forehead/temples/upper_lip/nose/chin]
  TEAR: stage{0-5}
```

---

## Module 7: 角色表情指纹 (Character Expression Fingerprint)

### 7.1 为什么需要指纹

每个真人的表情习惯都不同。两个角色在同一种情绪下应表现出不同的面部特征。这需要在 Step 2 (角色锁定) 中定义并全片保持。

### 7.2 指纹模板

```
[CHAR_XX] Expression Fingerprint v1.0 (全片不变):

  静息张力 (Resting Face Tension):
    AU1=0.03 AU2=0.01 AU4=0.08 AU5=0.0 AU6=0.0 AU7=0.05
    AU9=0.0 AU10=0.0 AU12=0.03 AU14=0.0 AU15=0.02 AU16=0.0
    AU17=0.0 AU18=0.0 AU20=0.0 AU23=0.0 AU24=0.0 AU25=0.0
    (这些值在 Step 4 D4 基线中叠加到所有非对话镜头)

  表情幅度 (Expressivity): 0.65
    (0=完全面瘫/flat affect, 0.3=内向克制, 0.5=正常, 0.7=外向, 1.0=极度夸张)
    所有情绪AU值 = 标准值 × expressivity

  全局不对称偏侧 (Global Asymmetry Bias):
    {bias: L, magnitude: 0.06}  (此角色天生左脸略强，所有表情AU12_L = AU12_R × 1.06)

  AU级不对称偏侧:
    AU12: {bias: L, magnitude: 0.08}  (微笑左偏8%)
    AU1:  {bias: R, magnitude: 0.04}  (挑眉右偏4%)

  眨眼风格 (Blink Style):
    rate: 17bpm
    type_ratio: {soft: 0.7, complete: 0.2, double: 0.05, long: 0.03, flutter: 0.02}
    (soft=轻柔半眨, complete=完全闭眼, double=双连眨, long=长闭>300ms, flutter=快速扇动)

  习惯动作 (Habitual Mannerisms):
    - {trigger: "思考时",  AU: [AU1+2=0.2, AU18=0.15], gaze: RECALL, head: yaw-5°, dur: 800-1200ms}
    - {trigger: "尴尬时",  AU: [AU12_L:0.35 AU12_R:0.28 AU43:0.2], head: pitch+5° yaw-3°, gaze: AVOID, dur: 600ms}
    - {trigger: "说话强调", AU: [AU1+2=0.3], head: pitch+3° nod, dur: 300ms}
    - {trigger: "聆听时",  AU: [AU7=0.15], head: pitch+2° slow_nod, gaze: FOCUS}

  情绪抑制特征 (Emotion Suppression Profile):
    anger:    {suppressibility: low, leak_AUs: [AU4, AU7, AU23]}
    sadness:  {suppressibility: medium, leak_AUs: [AU1, AU15], eye_leak: true}
    fear:     {suppressibility: low, leak_AUs: [AU5, AU20], micro_flash: true}
    happiness:{suppressibility: high, leak_AUs: [AU6], micro_flash: true}
    disgust:  {suppressibility: medium, leak_AUs: [AU9]}
    contempt: {suppressibility: medium, leak_AUs: [AU12_unilateral]}
    surprise: {suppressibility: high, leak_AUs: [AU5]}
    anxiety:  {suppressibility: low, leak_AUs: [AU7, AU20, DART_gaze]}

  角色原型参考 (Archetype Reference):
    (AI可使用以下关键词理解角色表情风格)
    type: "内敛克制型" / "外向奔放型" / "冷面幽默型" / "易读透明型"
    baseline_affect: "warm_resting" / "neutral_resting" / "cold_resting" / "sad_resting"
```

### 7.3 角色原型预设

| 原型 | Expressivity | 眨眼率 | 静息脸 | 习惯 | 抑制力 |
|------|-------------|--------|--------|------|--------|
| **内敛克制型** | 0.3-0.5 | 12-15 | neutral/cold | 少动作 | 高(情绪易泄漏眼区) |
| **外向奔放型** | 0.7-0.9 | 20-25 | warm | 多动作/大表情 | 低(情绪写脸上) |
| **冷面幽默型** | 0.4-0.6 | 14-16 | cold | 单侧AU12(暗笑) | 极高(微表情极少) |
| **易读透明型** | 0.5-0.7 | 16-20 | warm | 自然 | 低(每情绪都可见) |
| **焦虑紧张型** | 0.5-0.7 | 20-30 | 微紧张 | DART视线+AU7 | 低(ANS泄漏严重) |
| **权威掌控型** | 0.3-0.5 | 12-15 | cold | pitch-2° 微抬下巴 | 极高 |
| **天真烂漫型** | 0.8-1.0 | 18-22 | warm | 眨眼多+大笑 | 极低 |
| **忧郁沉思型** | 0.3-0.5 | 10-14 | sad | 慢眨眼+AVOID多 | 低(眼睛出卖一切) |

---

## v6 完整注入格式 (Per-Shot)

```
━━ SHOT_{id} [{duration}s | {shotType} | {cameraMove} | ← {prev_id}] ━━

[... D1-D3 unchanged from v5 ...]

FACS v6:
  AU1={L_val/R_val} AU2={L/R} AU4={L/R} AU5={L/R} AU6={L/R} AU7={L/R}
  AU9={val} AU10={L/R} AU12={L/R} AU14={L/R} AU15={L/R} AU16={val}
  AU17={val} AU18={val} AU20={L/R} AU22={val} AU23={val} AU24={val}
  AU25={val} AU26={val} AU27={val} AU43={L/R} AU45={rate}
  ASYMM_LEVEL: {L0-L4}
  EXPR_TIMING: onset={ms} apex={ms} offset={ms} curve={type}
  GENUINENESS: {0.0-1.0}
  COART: {prev}→{cur} overlap={ms} eye_fade={ms}/{ms} mouth_fade={ms}/{ms}
  MICRO: macro[{emotion}/I{0.x}] leakage[{emotion}/AUs/timing] suppression{0.x}
  EYES: GAZE:{state} SACC:{deg}°/{°/s}°/s MICROSACC:{Hz}Hz HIPPUS:{mm}mm VERGENCE:{deg}° TEAR:{stage}
  PHYSIO: BLINK:{bpm}bpm type:{type} PUPIL:{mm}mm BREATH:{cpm}cpm ch{ch}%dia{diaph}%
  HEAD: pitch{p}° yaw{y}° roll{r}°
  ANS: PULSE car{0.x}/tem{0.x} SKIN flush[{zones}] sweat{stage} tear{stage}

[... D5-D10 unchanged from v5 ...]
```

---

## 快速命令

```
"注入微表情引擎" | "v6 FACS" | "不对称表情" | "OAO时序" | "检测真假表情"
"微表情泄漏" | "角色表情指纹" | "ANS效应" | "共发音过渡" | "扩展眼动"
"表达真伪分析 SHOT_XX" | "角色表情一致性审计"
```

---

## 参考文献

- Ekman, P. & Friesen, W.V. (1978). Facial Action Coding System (FACS)
- Ekman, P. (2003). Emotions Revealed — micro-expression discovery
- Porter, S. & ten Brinke, L. (2008). Reading between the lies — leakage patterns
- Dimberg, U. et al. (2000). Unconscious facial reactions to emotional facial expressions — asymmetry research
- Hess, E.H. & Polt, J.M. (1964). Pupil size in relation to mental activity — pupillometry
- Duchenne, G.B. (1862). The Mechanism of Human Facial Expression
- Darwin, C. (1872). The Expression of the Emotions in Man and Animals
