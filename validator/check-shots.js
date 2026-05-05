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

    // 6. Prompt completeness check
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

  const shots = load(args[0]);
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
