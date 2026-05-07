# 📚 参考手册: TPEMA 文本驱动表情微动画引擎

> **本文件是参考手册。** ai-video-studio.md v5 已内联全部标点→AU映射表、25+AU参照表、情绪混合公式、生理模型和视线状态机，AI 运行时无需加载此文件。此文件保留供深度查询、JSON/CSV/XML格式导出和独立研究使用。

---

## 标点→表情映射表 (核心)

| 标点 | FACS AU 动作 | 强度 | 头部运动 | 视线 | 时长 | 曲线 |
|------|-------------|------|---------|------|------|------|
| `，` 逗号 | AU1+2 内眉微抬 | 0.3 | pitch+2° 微点头 | FOCUS | 200ms | linear |
| `、` 顿号 | AU1+2 内眉微抬 | 0.25 | 无 | FOCUS | 150ms | linear |
| `。` 句号 | AU1+2 回落 | 0.15 | pitch-2° 微收下巴 | FOCUS | 300ms | easeInOut |
| `？` 问号 | AU1+2+AU5 眉上抬+睁大眼 | 0.75 | pitch+5° yaw+3° 侧头 | EMPHASIS | 500ms | backOut |
| `！` 感叹号 | AU20+AU5+AU12 咧嘴+睁眼+嘴角上提 | 0.85 | pitch+8° 后仰回弹 | EMPHASIS | 600ms | elasticOut |
| `…` 省略号 | AU1+2 轻抬眉 | 0.4 | yaw-3° 侧头思考 | AVOID | 800ms | sineInOut |
| `；` 分号 | AU1+2+AU4 抬眉+皱眉 | 0.55 | pitch+3° yaw+2° | SCAN | 400ms | easeInOut |
| `：` 冒号 | AU1+2 眉微抬 | 0.35 | 无 | FOCUS | 250ms | linear |
| `"` 引号 | AU1+2+AU20 抬眉+咧嘴 | 0.5 | yaw±2° 左右微摆 | EMPHASIS | 350ms | easeInOut |
| `（` `）` 括号 | AU1+2 轻抬眉 | 0.2 | yaw+2° | SCAN | 200ms | linear |
| `——` 破折号 | AU1+2+AU4 抬眉+皱眉 | 0.45 | pitch+3° | FOCUS | 350ms | easeInOut |

---

## 完整 FACS AU 参照表 (25+ 动作单元)

生成 Prompt-FACS Vector 时，以下所有 AU 都须赋值(即使为0.0)：

| AU | 名称 | 典型触发 | 激活范围 | 日常基线 |
|----|------|---------|---------|---------|
| AU1 | Inner Brow Raiser | 悲伤、疑问、惊讶 | 0.0-1.0 | 0.05 |
| AU2 | Outer Brow Raiser | 惊讶、恐惧、极度关注 | 0.0-1.0 | 0.02 |
| AU4 | Brow Lowerer | 愤怒、专注、困惑、厌恶 | 0.0-1.0 | 0.05 |
| AU5 | Upper Lid Raiser | 恐惧、惊讶、警觉 | 0.0-1.0 | 0.0 |
| AU6 | Cheek Raiser | 真挚笑容(Duchenne标记) | 0.0-0.8 | 0.0 |
| AU7 | Lid Tightener | 专注、怀疑、强光下眯眼 | 0.0-0.6 | 0.1 |
| AU9 | Nose Wrinkler | 厌恶、恶心、不屑 | 0.0-0.7 | 0.0 |
| AU10 | Upper Lip Raiser | 厌恶、蔑视 | 0.0-0.6 | 0.0 |
| AU12 | Lip Corner Puller | 微笑、喜悦、满足 | 0.0-1.0 | 0.05 |
| AU14 | Dimpler | 酒窝、俏皮微笑 | 0.0-0.5 | 0.0 |
| AU15 | Lip Corner Depressor | 悲伤、失望、不悦 | 0.0-0.8 | 0.05 |
| AU16 | Lower Lip Depressor | 悲伤、轻蔑、不屑 | 0.0-0.6 | 0.0 |
| AU17 | Chin Raiser | 撅嘴、不确定、委屈 | 0.0-0.7 | 0.0 |
| AU18 | Lip Puckerer | 思考、亲吻、不屑 | 0.0-0.5 | 0.0 |
| AU20 | Lip Stretcher | 恐惧、紧张、假笑 | 0.0-0.9 | 0.0 |
| AU22 | Lip Funneler | "O"口型、惊喜 | 0.0-0.6 | 0.0 |
| AU23 | Lip Tightener | 愤怒、克制、紧张 | 0.0-0.9 | 0.0 |
| AU24 | Lip Pressor | 压抑愤怒、沉默、忍耐 | 0.0-0.8 | 0.0 |
| AU25 | Lips Part | 说话开始、惊讶、放松 | 0.0-1.0 | 0.0 |
| AU26 | Jaw Drop | 惊讶、恐惧、大笑、说话 | 0.0-1.0 | 0.0 |
| AU27 | Mouth Stretch | 极度惊讶、尖叫、打哈欠 | 0.0-1.0 | 0.0 |
| AU43 | Eye Closure | 闭眼、用力闭眼 | 0.0-1.0 | 0.0 |
| AU45 | Blink | 自发/反射眨眼 | 0/1 | 每4-6秒一次 |

### 情绪混合公式
```
喜悦(Happiness):   AU6≥0.3 + AU12≥0.3 + (AU25≥0.2 for laugh) + AU14≥0.1
悲伤(Sadness):     AU1≥0.4 + AU4≥0.3 + AU15≥0.4 + AU17≥0.2 + AU43≥0.1
愤怒(Anger):       AU4≥0.6 + AU5≥0.3 + AU7≥0.4 + AU23≥0.5 + AU24≥0.2
恐惧(Fear):        AU1≥0.5 + AU2≥0.5 + AU4≥0.3 + AU5≥0.6 + AU20≥0.3 + AU25≥0.3 + AU26≥0.5
厌恶(Disgust):     AU4≥0.3 + AU7≥0.3 + AU9≥0.5 + AU10≥0.3 + AU24≥0.1
惊讶(Surprise):    AU1≥0.4 + AU2≥0.4 + AU5≥0.5 + AU25≥0.3 + AU26≥0.6
蔑视(Contempt):    AU4≥0.2 + AU12L≥0.4 or AU12R≥0.4 (单侧不对称) + AU10≥0.1
紧张(Anxiety):     AU1+2=0.3 + AU4=0.3 + AU7=0.4 + AU20=0.2 + AU23=0.2 + AU25=0.1
释然(Relief):      AU6=0.15 + AU12=0.2 + AU43=0.3 (慢闭眼) → AU基线回归
```

---

## 生理模型

### 眨眼模型 (Blink Model)
```
基线: 15-20 blinks/min, interval ~3-5s
每次眨眼时长: 100-150ms (AU45=1)

情绪调节:
  高 arousal (愤怒/恐惧/兴奋): +8-12 bpm → 20-35 bpm
  低 arousal (悲伤/抑郁/疲劳): -5-10 bpm → 8-15 bpm
  高度集中/阅读/凝视: -10-15 bpm → 5-10 bpm
  欺骗/认知负荷: +5-8 bpm → 20-28 bpm

注入: BLINK: {bpm}bpm
```

### 瞳孔扩张模型 (Pupil Dilation)
```
公式: diameter(mm) = 2.0 + arousal × 6.0

  arousal=0.0 (完全放松): 2.0mm
  arousal=0.25 (清醒平静): 3.5mm
  arousal=0.5 (正常社交): 5.0mm
  arousal=0.75 (激动/兴奋): 6.5mm
  arousal=1.0 (极度恐惧/兴奋): 8.0mm

光照修正: 明环境 -1mm, 暗环境 +1.5mm

注入: PUPIL: {diameter}mm arousal{0.x}
```

### 呼吸模型 (Breathing Pattern)
```
基线: 12-16 cpm, 胸式:腹式=40:60

情绪调节:
  焦虑/恐惧: 20-30 cpm, 胸70%:腹30% (浅快)
  悲伤: 8-12 cpm, 胸30%:腹70% (深呼吸+叹息)
  平静/冥想: 8-10 cpm, 胸20%:腹80% (深腹式)
  惊讶: apnea 0-3s (屏息), 然后快速呼气
  说话中: 不规则, 句号处换气, cpm模糊

注入: BREATH: {cpm}cpm chest{chest%}% dia{diaph%}%
```

### 头部姿态模型 (Head Pose)
```
基线: pitch=0° yaw=0° roll=0°

情感调节:
  兴趣/好奇: yaw±3-5°, pitch+3-5° (微侧头)
  怀疑/不信任: yaw-5~-8° (后退+侧)
  赞同: pitch+3-5° (微点头) × 语句中多次
  不同意: yaw±5-8° (摇头)
  自信/权威: pitch-2-3° (微抬下巴)
  顺从/害羞: pitch+5-8° (低头)
  困惑: pitch+5° + yaw±3-5° (歪头)

注入: HEAD: pitch{°} yaw{°} roll{°}
```

---

## 视线状态机

```
FOCUS ──(！)→ EMPHASIS ──(。)→ FOCUS
FOCUS ──(？)→ EMPHASIS ──(。)→ FOCUS
FOCUS ──(…)→ AVOID ───(。)→ FOCUS
FOCUS ──(；)→ SCAN ────(。)→ FOCUS
RECALL ──(，)→ FOCUS
FOCUS ──(")→ EMPHASIS ──(")→ FOCUS
AVOID ──(！)→ EMPHASIS (快速切换)
```

| 状态 | 描述 | 眼球位置 | 触发 |
|------|------|---------|------|
| **FOCUS** | 直视镜头/对方 | center | 默认、逗号后、句号后 |
| **SCAN** | 水平扫视 | L→R (200-400ms) | 分号、列举、搜寻 |
| **RECALL** | 回忆上视 | up+right or up+left | 括号、引号、思考 |
| **AVOID** | 回避视线 | down+left/right | 省略号、犹豫、羞愧 |
| **EMPHASIS** | 强调直视 | center+微睁大 | 感叹号、问号、引号 |

---

## 口型映射 (Viseme Mapping)

对话镜头中每句话需按音素生成口型序列。

| 音素组 | 示例 | 口型 (Viseme) | AU25 | AU26 | AU27 | AU18 | AU22 | 时长 |
|--------|------|--------------|------|------|------|------|------|------|
| /m/,/p/,/b/ | 妈/爸/波 | 闭嘴 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 80-120ms |
| /f/,/v/ | 发/佛 | 下唇咬合 | 0.15 | 0.0 | 0.0 | 0.0 | 0.0 | 100-150ms |
| /th/ | think/this | 舌齿 | 0.2 | 0.0 | 0.0 | 0.0 | 0.0 | 100ms |
| /t/,/d/,/n/,/l/ | 他/的/你/了 | 舌腭 | 0.1 | 0.25 | 0.0 | 0.0 | 0.0 | 80-120ms |
| /s/,/z/ | 思/字 | 咬齿微张嘴 | 0.2 | 0.0 | 0.0 | 0.0 | 0.0 | 120-180ms |
| /sh/,/zh/ | 是/日 | 噘嘴 | 0.2 | 0.0 | 0.0 | 0.2 | 0.0 | 150-200ms |
| /k/,/g/,/ng/ | 可/个/嗯 | 口开后部 | 0.35 | 0.45 | 0.0 | 0.0 | 0.0 | 100ms |
| /i/,/iy/ | 一/衣 | 咧嘴 | 0.1 | 0.05 | 0.0 | 0.0 | 0.0 | 100-200ms |
| /u/,/uw/ | 乌/屋 | 噘圆 | 0.1 | 0.0 | 0.0 | 0.3 | 0.0 | 100-200ms |
| /ah/,/aa/ | 啊/阿 | 大开 | 0.5 | 0.55 | 0.0 | 0.0 | 0.0 | 150-300ms |
| /oh/,/ao/ | 哦/奥 | 中开圆 | 0.3 | 0.25 | 0.0 | 0.1 | 0.1 | 150-250ms |
| /eh/,/ae/ | 诶/哎 | 半开 | 0.25 | 0.15 | 0.0 | 0.0 | 0.0 | 100-180ms |
| /r/,/er/ | 儿/二 | 卷舌缩唇 | 0.2 | 0.1 | 0.0 | 0.1 | 0.0 | 120-180ms |
| silence | — | 静止口型 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 不定 |

---

## 语气语速控制

| 标点组合 | 语速 | 音量 | 语调 | 说明 |
|---------|------|------|------|------|
| 短句+。。 | 0.9× | -2dB | 降调 | 陈述结束 |
| 短句+！！ | 1.2× | +3dB | 升调 | 强烈情感 |
| 短句+？？ | 1.1× | +2dB | 升调 | 疑问 |
| 连续逗号 | 1.3× | 正常 | 平调 | 列举/连贯 |
| 句号后长停顿 | 0.7× | -3dB | 降调 | 段落收束 |
| `…` 省略 | 0.5× | -4dB | 降调+飘忽 | 犹豫/思考 |
| `！`连用 | 1.5× | +5dB | 升调+颤音 | 极度激动 |
| `？`连用 | 1.3× | +3dB | 升调+上扬 | 极度疑惑 |

---

## 强度叠加公式

```
单标点总强度 = 标点基础强度 × 情绪权重
连续标点总强度 = min(1.0, sum(各标点强度) × 0.7)
AU激活值 = 总强度 × AU基础值 + Perlin噪声(种子, 时间) × 噪声振幅
```

情绪权重根据文本情感分析得分自动调整:
- 正面情绪(>0.5): 权重 1.0-1.2
- 负面情绪(< -0.5): 权重 0.8-1.0 (抑制过度夸张)
- 中性: 权重 1.0

---

## 输出格式

### 格式 A: Prompt-FACS Vector (注入视频提示词)

**这是注入 micro-detail-injection.md Dimension 4 的标准格式。每镜头必输出。**

```
FACS: AU1={n} AU2={n} AU4={n} AU5={n} AU6={n} AU7={n} AU9={n} AU10={n} AU12={n} AU14={n} AU15={n} AU16={n} AU17={n} AU18={n} AU20={n} AU22={n} AU23={n} AU24={n} AU25={n} AU26={n} AU27={n} AU43={n} AU45={n}
  BLINK: {n}bpm | PUPIL: {n}mm arousal{0.x} | BREATH: {n}cpm chest{n}%dia{n}%
  HEAD: pitch{n}° yaw{n}° roll{n}° | GAZE: {FOCUS/SCAN/AVOID/EMPHASIS/RECALL}
  VISEME: [{time_ms}:{phoneme}:{AU25}:{AU26}:{AU27}]...
```

### 格式 B: JSON (完整控制数据)
```json
{
  "tracks": [
    {
      "timestamp": 0,
      "duration": 200,
      "trigger": "，",
      "au": { "AU1": 0.3, "AU2": 0.3, "AU4": 0.0, "AU5": 0.0, "AU6": 0.0, "AU7": 0.1, "AU9": 0.0, "AU10": 0.0, "AU12": 0.05, "AU14": 0.0, "AU15": 0.05, "AU16": 0.0, "AU17": 0.0, "AU18": 0.0, "AU20": 0.0, "AU22": 0.0, "AU23": 0.0, "AU24": 0.0, "AU25": 0.0, "AU26": 0.0, "AU27": 0.0, "AU43": 0.0, "AU45": 0 },
      "headPose": { "pitch": 2, "yaw": 0, "roll": 0 },
      "gaze": "FOCUS",
      "voice": { "speed": 1.0, "volume": 0, "tone": "flat" },
      "physiology": { "blink": 18, "pupil_mm": 4.2, "breath_cpm": 14, "chest_ratio": 40, "diaph_ratio": 60 },
      "easing": "linear"
    }
  ],
  "fps": 30,
  "totalDuration": 5000
}
```

### 格式 C: CSV (Excel/Blender 导入)
```csv
timestamp,duration,trigger,AU1,AU2,AU4,AU5,AU6,AU7,AU9,AU10,AU12,AU14,AU15,AU16,AU17,AU18,AU20,AU22,AU23,AU24,AU25,AU26,AU27,AU43,AU45,headPitch,headYaw,gaze,blink,pupil_mm,breath_cpm,chest_ratio,diaph_ratio,easing
0,200,，,0.3,0.3,0,0,0,0.1,0,0,0.05,0,0.05,0,0,0,0,0,0,0,0,0,0,0,0,2,0,FOCUS,18,4.2,14,40,60,linear
```

### 格式 D: FACS-XML (专业动画工具)
```xml
<facs timeline="30fps" duration="5000">
  <keyframe time="0" duration="200">
    <au code="1" value="0.3"/>
    <au code="2" value="0.3"/>
    <head pitch="2" yaw="0" roll="0"/>
    <gaze state="FOCUS"/>
    <physiology blink="18" pupil="4.2" breath="14" chest="40" diaph="60"/>
    <voice speed="1.0" volume="0" tone="flat"/>
    <easing curve="linear"/>
  </keyframe>
</facs>
```

---

## 噪声层

用 Perlin 噪声(simplex-noise 算法)为 AU 值添加微扰动:
- 噪声种子: 每个脚本唯一
- 噪声振幅: 0.03-0.08 (自然微表情范围)
- 频率: 30fps / 每帧独立采样

应用于: AU1, AU2, AU6, AU12, AU15, AU17, headPose(pitch/yaw/roll), pupil

---

## 分析用户输入

收到用户文本后：
1. 逐句扫描标点符号
2. 按标点→AU映射表生成关键帧序列
3. 计算情绪权重(正面/负面/中性)
4. 注入生理模型 (blink/pupil/breathing)
5. 构建视线状态机转换
6. 对话文本 → viseme序列
7. 输出 Prompt-FACS Vector (格式A) + 用户要求的额外格式 (B/C/D)

## 快速命令

"生成FACS向量" | "分析这段对话的表情" | "导出viseme序列" | "注入生理模型" | "输出Prompt-FACS格式"
