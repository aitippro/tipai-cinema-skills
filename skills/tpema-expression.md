# Skill: TPEMA 文本驱动表情微动画引擎

文本标点符号 → 面部表情(FACS AU) + 语气语速 + 头部运动 + 视线控制。

专为数字人/虚拟主播/AI Avatar 设计的文本驱动表情系统。加载此 Skill 后，处理用户输入的说话脚本时，自动分析标点并注入多模态控制指令。

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

## 视线状态机

```
FOCUS ──(！)→ EMPHASIS ──(。)→ FOCUS
FOCUS ──(？)→ EMPHASIS ──(。)→ FOCUS
FOCUS ──(…)→ AVOID ───(。)→ FOCUS
FOCUS ──(；)→ SCAN ────(。)→ FOCUS
RECALL ──(，)→ FOCUS
```

| 状态 | 描述 | 触发条件 |
|------|------|---------|
| **FOCUS** | 直视镜头 | 默认状态、逗号后 |
| **SCAN** | 扫视(左→右) | 分号、列举时、思考时 |
| **RECALL** | 回忆(眼向上看) | 括号内、引用时 |
| **AVOID** | 回避(眼向下/侧) | 省略号、犹豫 |
| **EMPHASIS** | 强调(睁大眼+直视) | 感叹号、问号、引号 |

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

### JSON (完整控制数据)
```json
{
  "tracks": [
    {
      "timestamp": 0,
      "duration": 200,
      "trigger": "，",
      "au": { "AU1": 0.3, "AU2": 0.3 },
      "headPose": { "pitch": 2, "yaw": 0, "roll": 0 },
      "gaze": "FOCUS",
      "voice": { "speed": 1.0, "volume": 0, "tone": "flat" },
      "easing": "linear"
    }
  ],
  "fps": 30,
  "totalDuration": 5000
}
```

### CSV (Excel/Blender 导入)
```csv
timestamp,duration,trigger,AU1,AU2,AU4,AU5,AU12,AU20,headPitch,headYaw,gaze,voiceSpeed,voiceVolume,voiceTone,easing
0,200,，,0.3,0.3,0,0,0,0,2,0,FOCUS,1.0,0,flat,linear
```

### FACS-XML (专业动画工具)
```xml
<facs timeline="30fps" duration="5000">
  <keyframe time="0" duration="200">
    <au code="1" value="0.3"/>
    <au code="2" value="0.3"/>
    <head pitch="2"/>
    <gaze state="FOCUS"/>
    <voice speed="1.0" volume="0" tone="flat"/>
  </keyframe>
</facs>
```

### Prompt-Text (注入到视频/图像生成提示词)
```
A highly detailed portrait. Facial expression: AU1+2 inner brow raise for gentle surprise at comma. AU12 lip corner pull for subtle smile. AU7 eyelid tightener for focused gaze. Lighting: soft natural. Camera: 85mm f/1.4. Quality: 8k, highly detailed skin texture.
```

---

## 分析用户输入

收到用户文本后：
1. 逐句扫描标点符号
2. 按标点→AU映射表生成关键帧序列
3. 计算情绪权重(正面/负面/中性)
4. 构建视线状态机转换
5. 输出用户要求的格式

## 噪声层

用 Perlin 噪声(simplex-noise 算法)为 AU 值添加微扰动:
- 噪声种子: 每个脚本唯一
- 噪声振幅: 0.03-0.08 (自然微表情范围)
- 频率: 音频采样率/30fps
