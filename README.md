<div align="center">

<img src="https://raw.githubusercontent.com/aitippro/TipAi/main/public/logo.png" width="80" />

# 🎬 TipAi Cinema Skills

**AI Video Creation Skill Suite**

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-7-blue?style=flat-square)](skills/)
[![Validator](https://img.shields.io/badge/Validator-20_rules-green?style=flat-square)](validator/check-shots.js)
[![CI](https://img.shields.io/badge/CI-validate-blue?style=flat-square)](.github/workflows/test.yml)

Derived from [TipAi](https://github.com/aitippro/TipAi) desktop TPEMA engine · Agent-loadable · Zero dependencies

[中文文档](README_CN.md)

</div>

---

## 🧠 Architecture (v5 — Self-Contained)

```
  User pastes script + says "Start Creating"
         │
         ▼
  skills/ai-video-studio.md  ← 🎯 Single self-contained file (load this one)
         │
         ├── Step 1-2: Script Analysis + Character Lock-in (all templates inline)
         ├── Step 3:   Shot Breakdown (shot sizes / camera moves / transitions inline)
         ├── Step 4:   Per-Shot Generation (10-dimension parameter grid inline)
         ├── Step 5:   Expression Injection (25+ AU + physiology models inline)
         └── Step 6:   Cross-Audit (5-layer audit + 20 quality checks inline)
               │
               ▼
         ✅ Audit passed → deliver / ❌ Auto-fix → re-audit
               │
               ▼
         validator/check-shots.js  (code-layer additional validation)
```

**v5 Core Principle**: Load one file, get everything needed at runtime. No external references.  
**Skill** = Runtime instructions for AI, with mandatory checkpoints, no skipping allowed  
**Validator** = Real executable code that verifies output consistency  
**📚 Reference Manuals** = Sub-skill files preserved for deep reference, not needed at AI runtime

---

## 🔬 Extreme Detail Mode (v5 default)

**Standard vs Extreme — same shot SHOT_001 prompt comparison:**

```
Standard:  "ECU of hands around cup. Warm amber light, soft bokeh. Static." (15 words)

Extreme:   "ECU. LIGHTING: 4200K key@45°/30° china_silk(grid_60), key:fill 3:1,
           rim sep 45°, shadow 0.3. CAMERA: ARRI_Alexa_35 S35, UltraPrime_85mm @ T1.4,
           ISO 800, shutter 180°, tripod, H130cm D40cm. CHAR: HAIR #1a1a1a 25cm
           straight flyaway0.2; SKIN #f5f0e8 fine_pores SSS[cheek,nose,ear];
           EYES iris#4a2810 ct_window_rect lash_medium; HANDS nail2mm #c48a7c.
           FACS: AU1=0.05 AU2=0.02 AU4=0.05... (23 values). ACTION: thumbTrace
           0.3cm/s arc, steamWobble 0.8Hz. ATMOSPHERE: steam+dust dens0.15
           rising-swirling, vol0.6. COLOR: Kodak2383 LUT, grain2.5%, sat
           R1.05 G0.95 B0.90. POST: fine_grain 2.5%, halation0.1, CA0.3px.
           ✅ Cross-audit passed → DELIVER" (140+ words, all 10 dimensions filled)
```

**Information density: 50x improvement. All descriptions upgraded from label-level to physics-level.**

### 10 Dimensions

| Dimension | Parameter Examples |
|-----------|-------------------|
| D1 Lighting Physics | 4200K, 45°/30°, china_silk, 3:1, shadow 0.3 |
| D2 Camera Physics | ARRI Alexa 35, 85mm @ T1.4, ISO 800, 180° |
| D3 Character Anatomy | Hair/skin/eyes/hands/clothing hex values + physics params |
| D4 FACS Expression | 23 AU × intensity + blink/pupil/breathing/head pose |
| D5 Micro-Movement | Speed cm/s, trajectory, frequency Hz, amplitude cm, weight feel |
| D6 Atmosphere | Particle type+density, convection, volumetric intensity |
| D7 Color Science | LUT, grain%, saturation curves, contrast, warm/cool balance |
| D8 Material Properties | Roughness/specularity/SSS/fresnel/metallic |
| D9 Audio-Visual Sync | Sound source position, reverb, viseme sequence, ambient |
| D10 Post-Production | Grain type+%, halation, CA, vignette, gate weave |

### 5-Layer Cross-Audit

```
Generate → Audit1(Self-Consistency) → Audit2(Dimension Coverage) → Audit3(Physics Plausibility)
         → Audit4(Reference Integrity) → Audit5(Synthesizability) → ✅Deliver / ❌Fix→Re-audit
```

---

## 🎯 Core Skill (v5 Self-Contained)

📂 **[ai-video-studio.md](skills/ai-video-studio.md)** — **Load this one file, that's it.**

```
Script Analysis → Character Lock-in → Shot Breakdown → Per-Shot 10-Dim Generation → FACS Injection → 5-Layer Cross-Audit
```

### v5 Features

| Feature | Description |
|---------|-------------|
| 🔒 User-Controlled Entry/Exit | AI never auto-activates. User says "Start Creating" to enter, "End Creation" to exit |
| 📋 6 Mandatory Checkpoints | Each step outputs `[CHECKPOINT_N]`, user confirms before next step |
| 🚫 Anti-Laziness Rules | No abbreviations, no skipping, no placeholders, no partial completion |
| 📦 Fully Self-Contained | 10-dim params, AU tables, audit rules — all inline in one file |
| 🔄 Cross-Turn State Tracking | Progress state block output each turn, AI never loses track |

### Built-in Capabilities (all inline, no other files needed)

| Module | Description |
|--------|-------------|
| 🔍 Script Analysis | Extract characters (appearance/personality/traits), scenes (lighting/tone/time), emotional arc |
| 🔒 Character Lock-in | Invariant traits (≥3) across shots + micro-anatomy profile (hair/skin/eyes/hands/clothing) |
| 📋 Context Table | Cross-shot state tracking: position → emotion → lighting → timeline → transition continuity |
| ✂️ Shot Breakdown | 5 shot sizes + 7 camera moves + 7 transition types + 5 breakdown rules |
| 🔬 10-Dimension Generation | D1-D10 full physics-level parameter injection |
| 😊 Expression Injection | Punctuation → 25+ AU mapping + emotion formulas + physiology (blink/pupil/breath/head/gaze) |
| ✅ 5-Layer Cross-Audit | Self-consistency → Dimension coverage → Physics plausibility → Reference integrity → Synthesizability |

---

## 🛡️ Validator

```bash
node validator/check-shots.js examples/context-table.json --project examples/project.json

# Options:
#   --json      JSON format output
#   --verbose   Show rule descriptions + passed shots
```

```
  Quality Report
  ══════════════
  Total shots: 4
  ✅ Passed: 4
  ⚠ Warnings: 0
  ❌ Errors: 0
  Pass rate: 100%
```

### 20 Rules

| # | Rule | Severity |
|---|------|----------|
| 1 | Shot ID uniqueness | Error |
| 2 | Character reference validity | Error |
| 3 | Scene reference validity | Error |
| 4 | Duration reasonability | Warning/Error |
| 5 | Shot type repetition ≤3 | Warning |
| 6 | Prompt element completeness | Warning |
| 7 | Adjacent shot transition defined | Warning |
| 8 | Character state continuity | Warning |
| 9 | Same-scene light delta ≤±3° | Warning |
| 10 | Scene switch transition | Warning |
| 11 | Character key features + anatomy cross-shot consistency | Error |
| 12 | Same-scene spatial continuity | Warning |
| 13 | Emotional continuity | Warning |
| 14 | Rhythm pacing (tension scenes) | Warning |
| 15 | Version format (semver) | Warning |
| 16 | Referential integrity (dangling refs) | Error |
| 17 | Micro-detail completeness (non-label-level) | Warning |
| 18 | FACS AU vector injection for dialogue shots | Warning |
| 19 | Cross-audit marker presence | Info |
| 20 | 10-dimension full coverage check | Warning |

---

## 📖 Usage

### Scenario: User pastes a story, wants to create an AI short film

**Step 1: Load Skill**

Copy the contents of `skills/ai-video-studio.md` to your AI agent, or tell it:

> "Load the skill at https://github.com/aitippro/tipai-cinema-skills/blob/main/skills/ai-video-studio.md"

**Step 2: Say the trigger word and paste script**

```
Start Creating. Analyze this script:

She pushed open the wooden cafe door, the brass bell chiming softly.
Afternoon sunlight streamed in diagonally, gilding every table gold.
She scanned the room — the corner seat was still empty,
the one where they'd first met.

She took a deep breath and walked toward the corner.
Her fingertips brushed the tabletops along the way, as if touching memories.
As she sat down, her eyes glistened,
but a faint smile tugged at the corner of her lips.

Outside, a figure stopped in his tracks.
His fingers hovered above the brass bell, unable to push.
```

**Step 3: AI executes the 6-step workflow**

The AI follows the Skill instructions step by step:

| Step | What the AI does | Output |
|------|-----------------|--------|
| 1. Script Analysis | Extract characters, scenes, emotional arc | Character table + Scene table |
| 2. Character Lock-in | Build character anatomy profiles | `[CHAR_01]` locked description |
| 3. Shot Breakdown | Segment into shot sequence | Numbered shot list |
| 4. Prompt Generation | Output AI video prompt per shot | English prompt (10-dim format) |
| 5. Expression Injection | Inject punctuation → AU mapping for dialogue shots | FACS expression data |
| 6. Cross-Audit | Cross-check characters/scenes/lighting | Audit report |

**Step 4: Confirm each checkpoint**

At each `[CHECKPOINT_N]`, the AI pauses and waits. You say:
- `"Continue"` — advance to next step
- `"Modify [item]"` — go back and fix
- `"Pause"` — save state
- `"End Creation"` — exit

**Step 5: Validate output (optional)**

Save the AI-generated JSON as `my-shots.json` and run:

```bash
node validator/check-shots.js my-shots.json --project my-project.json
```

---

## 🚀 Quick Start

```bash
git clone git@github.com:aitippro/tipai-cinema-skills.git
```

1. Load `skills/ai-video-studio.md` into your AI agent
2. Say **"Start Creating"** and paste your script
3. The AI executes the 6-step workflow with `[CHECKPOINT_N]` at each step
4. Say **"Continue"** to advance, **"Pause"** to save state, **"End Creation"** to exit
5. Optional: Run `node validator/check-shots.js` to validate output quality

---

## 📂 Directory

```
tipai-cinema-skills/
├── skills/
│   ├── ai-video-studio.md          ← 🎯 Main Skill v5 — self-contained, load this one
│   ├── micro-detail-injection.md   ← 📚 Reference: 10-dimension parameter engine
│   ├── cross-audit.md              ← 📚 Reference: 5-layer cross-audit
│   ├── director-storyboard.md      ← 📚 Reference: storyboard engine
│   ├── multimodal-prompt.md        ← 📚 Reference: multimodal prompt (text-to-image + image-to-text)
│   ├── prompt-lifecycle.md         ← 📚 Reference: lifecycle & unified schema
│   └── tpema-expression.md         ← 📚 Reference: TPEMA expression engine
├── validator/
│   └── check-shots.js              ← 🛡️ 20 quality rules (code-layer)
├── .github/workflows/
│   └── test.yml                    ← 🤖 CI auto-validation
├── examples/
│   ├── project.json                ← Sample project (2 characters, 2 scenes)
│   ├── shots-example.json          ← Standard mode sample shots
│   ├── context-table.json          ← Context table sample (with transitions/states)
│   └── extreme-shot.json           ← Extreme detail single shot sample
├── README.md                       ← 📖 English documentation (this file)
├── README_CN.md                    ← 📖 中文文档
└── LICENSE
```

---

## 📜 Origin

Extracted and refined from the **TipAi v1.0** desktop application core engine:

> TipAi is a local-first, full-stack AI prompt engineering desktop tool
> React 19 · Electron 41 · Rust NAPI-RS · AES-256-GCM
> [github.com/aitippro/TipAi](https://github.com/aitippro/TipAi)

---

<div align="center">
<sub>MIT License · TipAi Team © 2026</sub>
</div>
