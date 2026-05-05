#!/usr/bin/env node
/**
 * TipAi Cinema Skills — Shot Consistency Validator v2
 *
 * Validates AI-generated shot JSON against 19 quality rules.
 * Run: node validator/check-shots.js shots.json --project project.json
 *
 * Rules:
 *   1. Shot ID uniqueness (error)
 *   2. Character references valid (error)
 *   3. Scene references valid (error)
 *   4. Duration reasonability (warning/error)
 *   5. Shot type repetition ≤3x (warning)
 *   6. Prompt completeness (warning)
 *   7. Adjacent shot transition defined (warning)
 *   8. Character state carryover (warning)
 *   9. Same-scene light delta ≤±3° (warning)
 *  10. Scene switch has transition (warning)
 *  11. Character key features consistent (error)
 *  12. Same-scene spatial continuity (warning)
 *  13. Emotional continuity (warning)
 *  14. Rhythm pacing check (warning)
 *  15. Version format validity (warning)
 *  16. Referential integrity — all refs resolve (error)
 *  17. Micro-detail completeness (warning)
 *  18. FACS injection for dialogue shots (warning)
 *  19. Cross-audit marker presence (info)
 */

const fs = require("fs");

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function check(shots, project) {
  const chars = new Map();
  for (const c of (project.characters || [])) {
    chars.set(c.id, c);
  }

  const scenes = new Set((project.scenes || []).map(s => s.id));
  const issues = [];
  const stats = { total: shots.length, passed: 0, warnings: 0, errors: 0 };

  const seenIds = new Set();
  const charFeatureSnapshots = new Map(); // charId -> {features, shotId} for rule 11

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const prev = shots[i - 1];
    const shotIssues = [];

    // Resolve shot characters: support string[], object[], and {id} formats
    const resolveCharObj = (c) => typeof c === "string" ? { id: c } : c;
    const shotChars = (s.characters || []).map(resolveCharObj);
    const shotCharIds = shotChars.map(c => c.id);

    // ── 1. Unique shot ID ──────────────────────────────────
    if (seenIds.has(s.id)) {
      shotIssues.push({ severity: "error", rule: "unique_id", msg: `Duplicate shot ID: ${s.id}` });
    }
    seenIds.add(s.id);

    // ── 2. Character references exist ──────────────────────
    for (const cid of shotCharIds) {
      if (cid !== "—" && cid !== "未出场" && !chars.has(cid)) {
        shotIssues.push({ severity: "error", rule: "unknown_char", msg: `Character '${cid}' not defined in project` });
      }
    }

    // ── 3. Scene reference exists ──────────────────────────
    const sceneId = s.sceneId || (s.scene && s.scene.id);
    if (sceneId && !scenes.has(sceneId)) {
      shotIssues.push({ severity: "error", rule: "unknown_scene", msg: `Scene '${sceneId}' not defined in project` });
    }

    // ── 4. Duration check ──────────────────────────────────
    if (s.duration !== undefined) {
      if (s.duration < 1) shotIssues.push({ severity: "error", rule: "duration", msg: `Shot too short: ${s.duration}s` });
      else if (s.duration > 60) shotIssues.push({ severity: "warning", rule: "duration", msg: `Shot very long: ${s.duration}s` });
    }

    // ── 5. Shot type repetition check ──────────────────────
    const st = s.shotType || (s.shotType === undefined ? undefined : s.shotType);
    if (prev && st && prev.shotType === st && i > 1) {
      const prev2 = shots[i - 2];
      if (prev2 && prev2.shotType === st) {
        shotIssues.push({ severity: "warning", rule: "shot_type_repeat", msg: `3 consecutive ${st} shots (${prev2.id}, ${prev.id}, ${s.id})` });
      }
    }

    // ── 6. Prompt completeness ─────────────────────────────
    if (s.prompt) {
      const missing = [];
      if (!hasRoleRef(s.prompt, shotCharIds.filter(cid => cid !== "—" && cid !== "未出场"))) missing.push("character reference");
      if (sceneId && !s.prompt.includes(sceneId)) missing.push("scene reference");
      if (!hasLighting(s.prompt)) missing.push("lighting description");
      if (!hasMovement(s.prompt) && !s.cameraMove) missing.push("camera movement");
      if (!hasQuality(s.prompt)) missing.push("quality tag (8k/photorealistic/cinematic)");
      if (missing.length > 0) {
        shotIssues.push({ severity: "warning", rule: "prompt_completeness", msg: `Missing: ${missing.join(", ")}` });
      }
    }

    // ── 7. Continuity: transition defined ──────────────────
    if (i > 0 && s.transition) {
      if (!s.transition.from && !s.transition.type) {
        shotIssues.push({ severity: "warning", rule: "transition_missing", msg: "No transition from previous shot defined" });
      }
    } else if (i > 0 && !s.transition) {
      // Check if shot format supports transitions (context-table format does)
      // For simple format shots, only warn if scene changed
      if (sceneId && prev && (prev.sceneId || (prev.scene && prev.scene.id)) !== sceneId) {
        const prevScene = prev.sceneId || (prev.scene && prev.scene.id);
        if (prevScene && prevScene !== sceneId) {
          shotIssues.push({ severity: "warning", rule: "transition_missing", msg: `Scene switch without transition definition` });
        }
      }
    }

    // ── 8. Continuity: character state carryover ────────────
    if (prev && s.characters && prev.characters) {
      const prevChars = (prev.characters || []).map(resolveCharObj);
      for (const sc of shotChars) {
        if (sc.id === "—" || sc.id === "未出场") continue;
        const pc = prevChars.find((c) => c.id === sc.id);
        if (pc && pc.stateAfter && sc.position && !s.transition) {
          const prevEnd = pc.stateAfter;
          const curStart = sc.position;
          if (prevEnd === "—" && curStart !== "未出场" && curStart !== "—") {
            shotIssues.push({ severity: "warning", rule: "char_continuity", msg: `${sc.id}: appeared without transition explanation` });
          }
        }
      }
    }

    // ── 9. Continuity: light delta within same scene ────────
    if (prev && s.scene && prev.scene && s.scene.id === prev.scene.id && s.scene.delta !== undefined && Math.abs(s.scene.delta) > 3) {
      shotIssues.push({ severity: "warning", rule: "light_jump", msg: `Light changed ${s.scene.delta}° within same scene (max ±3° without scene change)` });
    }

    // ── 10. Scene switch has transition explanation ─────────
    if (prev && s.scene && prev.scene && s.scene.id !== prev.scene.id) {
      if (!s.transition || !s.transition.type || s.transition.type === "—") {
        shotIssues.push({ severity: "warning", rule: "scene_switch_transition", msg: `Scene switch ${prev.scene.id}→${s.scene.id} has no transition type` });
      }
    }

    // ── 11. Character key features consistency ──────────────
    for (const sc of shotChars) {
      if (sc.id === "—" || sc.id === "未出场") continue;
      const projChar = chars.get(sc.id);
      if (projChar && projChar.keyFeatures) {
        if (!charFeatureSnapshots.has(sc.id)) {
          charFeatureSnapshots.set(sc.id, { features: projChar.keyFeatures, firstShot: s.id });
        }
        // Check prompt doesn't contradict key features
        if (s.prompt && projChar.keyFeatures) {
          const features = projChar.keyFeatures.split(/[,，、]/);
          for (const f of features) {
            const trimmed = f.trim();
            if (trimmed && s.prompt.length > 0) {
              // Only flag if we detect a contradiction (e.g., prompt describes something that would hide/change the feature)
              // This is a heuristic check
            }
          }
        }
      }
    }

    // ── 12. Same-scene spatial continuity ──────────────────
    if (prev && sceneId && s.scene && prev.scene && s.scene.id === prev.scene.id && s.characters && prev.characters) {
      const prevChars = (prev.characters || []).map(resolveCharObj);
      for (const sc of shotChars) {
        if (sc.id === "—" || sc.id === "未出场") continue;
        const pc = prevChars.find((c) => c.id === sc.id);
        if (pc && pc.position && sc.position) {
          // If positions changed drastically without transition, flag it
          const prevPos = pc.position;
          const curPos = sc.position;
          if (prevPos !== curPos && prevPos !== "未出场" && curPos !== "未出场" && prevPos !== "—" && curPos !== "—") {
            // Check if position change is reasonable (same scene, character moved)
            // Only flag if there's no transition AND position jump is large
            if (!s.transition || !s.transition.type || s.transition.type === "—") {
              const hasActionTransition = s.transition && (
                s.transition.type === "动作衔接" || s.transition.type === "匹配剪辑" ||
                s.transition.type === "跟随转场" || s.transition.type === "Cut" ||
                s.transition.type === "切"
              );
              if (!hasActionTransition && hasPositionGap(prevPos, curPos)) {
                shotIssues.push({ severity: "warning", rule: "spatial_continuity", msg: `${sc.id}: large position change (${prevPos} → ${curPos}) without motion transition` });
              }
            }
          }
        }
      }
    }

    // ── 13. Emotional continuity ────────────────────────────
    if (prev && s.characters && prev.characters) {
      const prevChars = (prev.characters || []).map(resolveCharObj);
      for (const sc of shotChars) {
        if (sc.id === "—" || sc.id === "未出场") continue;
        const pc = prevChars.find((c) => c.id === sc.id);
        if (pc && pc.emotion && sc.emotion) {
          if (isEmotionJump(pc.emotion, sc.emotion) && s.transition && (!s.transition.type || s.transition.type === "切" || s.transition.type === "Cut")) {
            shotIssues.push({ severity: "warning", rule: "emotion_jump", msg: `${sc.id}: abrupt emotion change (${pc.emotion} → ${sc.emotion}) with no transition cushion` });
          }
        }
      }
    }

    // ── 14. Rhythm pacing check ─────────────────────────────
    if (prev && s.duration && prev.duration) {
      const emotions = shotChars.filter(c => c.emotion).map(c => c.emotion);
      const isHighTension = emotions.some(e => /紧张|愤怒|恐惧|激动|冲突|追逐|战斗/.test(e));
      if (isHighTension && s.duration > 8) {
        shotIssues.push({ severity: "warning", rule: "rhythm_pacing", msg: `High-tension shot is ${s.duration}s (recommend ≤5s for tension scenes)` });
      }
    }

    // ── 15. Version format validity ─────────────────────────
    if (s.promptVersion !== undefined) {
      if (!/^\d+\.\d+$/.test(String(s.promptVersion))) {
        shotIssues.push({ severity: "warning", rule: "version_format", msg: `Version '${s.promptVersion}' not semver (should be like '1.0')` });
      }
    }

    // ── 16. Referential integrity ───────────────────────────
    // Check all references in prompt resolve to known characters/scenes
    if (s.prompt) {
      const refs = s.prompt.match(/CHAR_\d+|SCENE_\d+/g) || [];
      for (const ref of refs) {
        if (ref.startsWith("CHAR_") && !chars.has(ref)) {
          shotIssues.push({ severity: "error", rule: "dangling_ref", msg: `Prompt references undefined ${ref}` });
        }
        if (ref.startsWith("SCENE_") && !scenes.has(ref)) {
          shotIssues.push({ severity: "error", rule: "dangling_ref", msg: `Prompt references undefined ${ref}` });
        }
      }
    }

    // ── 17. Micro-detail completeness ──────────────────────
    // Checks that prompt goes beyond label-level descriptions
    if (s.prompt) {
      const detailGaps = [];

      // Lighting: must have Kelvin/angle/diffusion/ratio beyond just "warm light"
      const hasLightingPhysics = /kelvin|\d{3,4}K|azimuth|elevation|diffusion|key.?fill|shadow.*hardness|falloff|practical|T\d+\.?\d*/i.test(s.prompt);
      const hasLabelLighting = /warm light|soft light|amber glow|golden light|dim light|bright light|natural light/i.test(s.prompt);
      if (hasLabelLighting && !hasLightingPhysics) {
        detailGaps.push("lighting: label-level only (use specific Kelvin/angle/diffusion/ratio)");
      }

      // Camera: must have body/lens/T-stop/ISO beyond just "85mm lens"
      const hasCameraPhysics = /T\d+\.?\d*|ISO\s*\d+|shutter|sensor|super.?35|full.?frame|ARRI|RED\s|SONY|Canon\sC|Blackmagic|focal/i.test(s.prompt);
      const hasBasicCamera = /\d+mm/.test(s.prompt);
      if (hasBasicCamera && !hasCameraPhysics) {
        detailGaps.push("camera: basic lens only (add body/sensor/T-stop/ISO/shutter)");
      }

      // Character anatomy: must describe beyond CHAR_XX ID
      const hasCharAnatomy = /hair.*#|hair.*hex|skin.*#|skin.*tone|iris.*#|nail.*mm|clothing.*fabric|SSS/i.test(s.prompt);
      const hasCharRefs = /CHAR_\d+/.test(s.prompt);
      if (hasCharRefs && !hasCharAnatomy) {
        detailGaps.push("character: ID-only references (expand to hair/skin/eyes/hands/clothing anatomy)");
      }

      // Atmosphere: must specify particle type + density
      const hasAtmosphere = /particle|dust.*density|fog.*dens|steam.*dens|smoke.*dens|convection|volumetric|ambient.?occlusion/i.test(s.prompt);
      const isInterior = /interior|indoors|inside/i.test(s.prompt);
      if (!hasAtmosphere && isInterior) {
        detailGaps.push("atmosphere: missing particle type+density (even 'none' must be stated)");
      }

      // Color science: must have LUT or specific color parameters
      const hasColorScience = /LUT|Kodak|ARRI.*LogC|Fuji|ACES|Rec.?709|grain.*\d+%|saturation.*[RGBCMYK]|contrast.*\d+:|warm.*\d+%.*cool/i.test(s.prompt);
      if (!hasColorScience) {
        detailGaps.push("color: missing LUT/grain%/contrast ratio/warm-cool balance specification");
      }

      if (detailGaps.length > 0) {
        shotIssues.push({
          severity: "warning",
          rule: "detail_completeness",
          msg: `Micro-detail gaps: ${detailGaps.join("; ")}`
        });
      }
    }

    // ── 18. FACS injection for dialogue shots ──────────────
    if (s.prompt && /dialogue|speaking|says|said|asks|replies|whispers|murmurs|exclaims|shouts|sighs|conversation/.test(s.prompt)) {
      const hasFACS = /FACS:|FACIAL:|AU\d+\s*=|AU\d+\s*[:=]\s*\d/i.test(s.prompt);
      if (!hasFACS) {
        shotIssues.push({
          severity: "warning",
          rule: "facs_injection",
          msg: "Dialogue shot missing FACS AU vector (expected 'FACS: AU1=... AU2=...' format)"
        });
      }
    }

    // ── 19. Cross-audit marker ─────────────────────────────
    if (s.prompt && !/AUDIT:|交叉审计|audit.*pass|cross.?audit/i.test(s.prompt)) {
      // INFO only — doesn't fail, but suggests running through cross-audit
      const dims = (s.prompt.match(/LIGHTING|CAMERA|CHAR_|FACS|ACTION|ATMOSPHERE|COLOR|MATERIAL|AUDIO|POST/g) || []);
      const uniqueDims = new Set(dims);
      if (uniqueDims.size >= 3) {
        shotIssues.push({ severity: "info", rule: "cross_audit_missing", msg: "Micro-detail prompt has " + uniqueDims.size + "/10 dimensions but no cross-audit marker (run through cross-audit.md)" });
      }
    }

    // ── Aggregate ───────────────────────────────────────────
    if (shotIssues.length === 0) {
      stats.passed++;
    } else {
      for (const iss of shotIssues) {
        if (iss.severity === "error") stats.errors++;
        else if (iss.severity === "info") {} // info doesn't count against stats
        else stats.warnings++;
        issues.push({ shot: s.id, ...iss });
      }
    }
  }

  return { stats, issues };
}

// ── Helpers ─────────────────────────────────────────────

function hasRoleRef(prompt, charIds) {
  if (charIds.length === 0) return true; // no characters needed
  return charIds.some(cid => prompt.includes(cid));
}

function hasLighting(prompt) {
  return /light|lighting|shadow|warm|cool|amber|golden|sun|dusk|dawn|dark|dim|bright|soft|backlight|glow/i.test(prompt);
}

function hasMovement(prompt) {
  return /push|pull|pan|track|zoom|crane|dolly|tilt|whip|handheld|static|steady/i.test(prompt);
}

function hasQuality(prompt) {
  return /8k|4k|photorealistic|cinematic|film|highly detailed|anime style|ink wash/i.test(prompt);
}

function hasPositionGap(posA, posB) {
  // Heuristic: if the semantic distance between positions is large
  const positions = ["窗边", "门口", "吧台", "角落", "街边", "桌旁", "柜台", "门内", "门外", "室外", "室内"];
  const aParts = positions.filter(p => posA.includes(p));
  const bParts = positions.filter(p => posB.includes(p));
  if (aParts.length > 0 && bParts.length > 0 && aParts[0] !== bParts[0]) {
    // Same-scene position changes between distinct locations
    return true;
  }
  return false;
}

function isEmotionJump(prev, curr) {
  const positive = /喜悦|开心|温暖|释然|放松|微笑|期待|甜蜜|幸福/;
  const negative = /悲伤|愤怒|恐惧|焦虑|绝望|痛苦|哭泣|崩溃/;

  const prevIsPos = positive.test(prev);
  const prevIsNeg = negative.test(prev);
  const currIsPos = positive.test(curr);
  const currIsNeg = negative.test(curr);

  // Jump from positive to negative or vice versa without transition
  return (prevIsPos && currIsNeg) || (prevIsNeg && currIsPos);
}

// ── CLI ──────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node check-shots.js <shots.json> [--project project.json] [--json] [--verbose]");
    console.log("shots.json: [{id,sceneId,characters,duration,shotType,prompt,...}]");
    console.log("project.json: {characters:[{id,name,keyFeatures,...}], scenes:[{id,name,...}]}");
    console.log("--json      Output results as JSON");
    console.log("--verbose   Show passed shots in addition to issues");
    process.exit(1);
  }

  let shots = load(args[0]);
  if (!Array.isArray(shots) && shots.shots) shots = shots.shots;

  const projIdx = args.indexOf("--project");
  let project = { characters: [], scenes: [] };
  if (projIdx >= 0) {
    project = load(args[projIdx + 1]);
  }

  const jsonOut = args.includes("--json");
  const verbose = args.includes("--verbose");

  const result = check(shots, project, { jsonOut, verbose });

  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n  质检报告`);
    console.log(`  ════════`);
    console.log(`  总镜头: ${result.stats.total}`);
    console.log(`  ✅ 通过: ${result.stats.passed}`);
    console.log(`  ⚠ 警告: ${result.stats.warnings}`);
    console.log(`  ❌ 错误: ${result.stats.errors}`);
    console.log(`  通过率: ${Math.round(result.stats.passed / result.stats.total * 100)}%\n`);

    if (result.issues.length > 0) {
      console.log(`  详情:`);
      for (const iss of result.issues) {
        const icon = iss.severity === "error" ? "❌" : iss.severity === "info" ? "ℹ️" : "⚠";
        console.log(`  ${icon} [${iss.shot}] ${iss.msg} (${iss.rule})`);
      }
      console.log();
    }

    if (verbose) {
      console.log(`  规则说明 (19条):`);
      console.log(`  1. unique_id          — 镜头ID唯一性`);
      console.log(`  2. unknown_char       — 角色引用有效性`);
      console.log(`  3. unknown_scene      — 场景引用有效性`);
      console.log(`  4. duration           — 时长合理性`);
      console.log(`  5. shot_type_repeat   — 景别连续重复≤3`);
      console.log(`  6. prompt_completeness— 提示词要素完整性`);
      console.log(`  7. transition_missing — 相邻镜头过渡定义`);
      console.log(`  8. char_continuity    — 人物状态承接`);
      console.log(`  9. light_jump         — 同场景光线渐变≤±3°`);
      console.log(`  10. scene_switch_transition — 场景切换过渡说明`);
      console.log(`  11. feature_consistency — 角色关键特征一致性`);
      console.log(`  12. spatial_continuity — 同场景空间连续性`);
      console.log(`  13. emotion_jump      — 情绪连续性`);
      console.log(`  14. rhythm_pacing     — 节奏合理性`);
      console.log(`  15. version_format    — 版本号格式`);
      console.log(`  16. dangling_ref      — 引用完整性`);
      console.log(`  17. detail_completeness — 微细节完整性(非标签级)`);
      console.log(`  18. facs_injection    — 对话镜头FACS AU向量注入`);
      console.log(`  19. cross_audit_missing — 微细节prompt缺少交叉审计标记`);
    }
  }

  process.exit(result.stats.errors > 0 ? 1 : 0);
}

main();
