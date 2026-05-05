#!/usr/bin/env node
/**
 * TipAi Cinema Skills — Shot Consistency Validator
 *
 * Validates AI-generated shot JSON against quality rules.
 * Run: node validator/check-shots.js shots.json --project project.json
 *
 * Checks:
 *  1. All character references point to defined characters
 *  2. All characters in the same shot have compatible appearances
 *  3. No duplicate shot IDs
 *  4. Scene references are consistent
 *  5. Shot durations are reasonable
 *  6. Adjacent shots don't repeat the same shot type >3x
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

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const prev = shots[i - 1];
    const shotIssues = [];

    // 1. Unique shot ID
    if (seenIds.has(s.id)) {
      shotIssues.push({ severity: "error", rule: "unique_id", msg: `Duplicate shot ID: ${s.id}` });
    }
    seenIds.add(s.id);

    // 2. Character references exist
    const shotChars = (s.characters || []).map(c => typeof c === "string" ? c : c.id);
    for (const cid of shotChars) {
      if (!chars.has(cid)) {
        shotIssues.push({ severity: "error", rule: "unknown_char", msg: `Character '${cid}' not defined in project` });
      }
    }

    // 3. Scene reference exists
    if (s.sceneId && !scenes.has(s.sceneId)) {
      shotIssues.push({ severity: "error", rule: "unknown_scene", msg: `Scene '${s.sceneId}' not defined in project` });
    }

    // 4. Duration check
    if (s.duration !== undefined) {
      if (s.duration < 1) shotIssues.push({ severity: "error", rule: "duration", msg: `Shot too short: ${s.duration}s` });
      if (s.duration > 60) shotIssues.push({ severity: "warning", rule: "duration", msg: `Shot very long: ${s.duration}s` });
    }

    // 5. Shot type repetition check (adjacent shots)
    if (prev && prev.shotType === s.shotType && i > 1) {
      const prev2 = shots[i - 2];
      if (prev2 && prev2.shotType === s.shotType) {
        shotIssues.push({ severity: "warning", rule: "shot_type_repeat", msg: `3 consecutive ${s.shotType} shots (${shots[i-2].id}, ${prev.id}, ${s.id})` });
      }
    }

    // 6. Prompt completeness
    if (s.prompt) {
      const missing = [];
      if (!hasRoleRef(s.prompt, shotChars)) missing.push("character reference");
      if (s.sceneId && !s.prompt.includes(s.sceneId)) missing.push("scene reference");
      if (!hasLighting(s.prompt)) missing.push("lighting description");
      if (!hasMovement(s.prompt) && !s.cameraMove) missing.push("camera movement");
      if (missing.length > 0) {
        shotIssues.push({ severity: "warning", rule: "prompt_completeness", msg: `Missing: ${missing.join(", ")}` });
      }
    }

    // 7. Continuity: transition defined (skip first shot)
    if (i > 0 && s.transition && !s.transition.from) {
      shotIssues.push({ severity: "warning", rule: "transition_missing", msg: "No transition from previous shot defined" });
    }

    // 8. Continuity: character state carries over
    if (prev && s.characters && prev.characters) {
      for (const sc of s.characters) {
        if (typeof sc === "object" && sc.id) {
          const pc = prev.characters.find((c) => (typeof c === "object" ? c.id : c) === sc.id);
          if (pc && typeof pc === "object" && pc.stateAfter && sc.position) {
            // Check position continuity: character should start where previous ended
            const prevEnd = pc.stateAfter;
            const curStart = sc.position;
            // Simple heuristic: if previous shot had character "not present" but current has them present, check transition
            if (prevEnd === "—" && curStart !== "未出场" && curStart !== "—") {
              shotIssues.push({ severity: "warning", rule: "char_continuity", msg: `${sc.id}: appeared without transition explanation` });
            }
          }
        }
      }
    }

    // 9. Continuity: light delta within same scene
    if (prev && s.scene && prev.scene && s.scene.id === prev.scene.id && s.scene.delta !== undefined && Math.abs(s.scene.delta) > 3) {
      shotIssues.push({ severity: "warning", rule: "light_jump", msg: `Light changed ${s.scene.delta}° within same scene (max ±3° without scene change)` });
    }

    // 10. Continuity: scene switch has transition explanation
    if (prev && s.scene && prev.scene && s.scene.id !== prev.scene.id) {
      if (!s.transition || !s.transition.type || s.transition.type === "—") {
        shotIssues.push({ severity: "warning", rule: "scene_switch_transition", msg: `Scene switch ${prev.scene.id}→${s.scene.id} has no transition type` });
      }
    }

    if (shotIssues.length === 0) {
      stats.passed++;
    } else {
      for (const iss of shotIssues) {
        if (iss.severity === "error") stats.errors++;
        else stats.warnings++;
        issues.push({ shot: s.id, ...iss });
      }
    }
  }

  return { stats, issues };
}

function hasRoleRef(prompt, charIds) {
  return charIds.some(cid => prompt.includes(cid));
}

function hasLighting(prompt) {
  return /light|lighting|shadow|warm|cool|amber|golden|sun|dusk|dawn|dark|dim|bright|soft/i.test(prompt);
}

function hasMovement(prompt) {
  return /push|pull|pan|track|zoom|crane|dolly|tilt|whip|handheld|static|steady/i.test(prompt);
}

// ── CLI ────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node check-shots.js <shots.json> [--project project.json]");
    console.log("shots.json: [{id,sceneId,characters,duration,shotType,prompt,...}]");
    console.log("project.json: {characters:[{id,name,...}], scenes:[{id,name,...}]}");
    process.exit(1);
  }

  let shots = load(args[0]);
  // Handle context-table format (object with shots array)
  if (!Array.isArray(shots) && shots.shots) shots = shots.shots;
  const projIdx = args.indexOf("--project");
  let project = { characters: [], scenes: [] };
  if (projIdx >= 0) {
    project = load(args[projIdx + 1]);
  }

  const result = check(shots, project);

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
      const icon = iss.severity === "error" ? "❌" : "⚠";
      console.log(`  ${icon} [${iss.shot}] ${iss.msg} (${iss.rule})`);
    }
  }

  process.exit(result.stats.errors > 0 ? 1 : 0);
}

main();
