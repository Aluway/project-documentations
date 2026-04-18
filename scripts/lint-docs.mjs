#!/usr/bin/env node
// Docs linter — validates frontmatter and internal links across docs/**/*.md
// Zero dependencies. Run: `node scripts/lint-docs.mjs` (from repo root).
// Spec: docs/_meta/ci-linter.md

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DOCS = join(ROOT, "docs");

const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_CHAPTER = new Set(["active", "draft", "deprecated"]);
const STATUS_ADR = new Set(["proposed", "accepted", "rejected", "superseded", "deprecated"]);
const ADR_ID = /^\d{4}$/;

const errors = [];
const warnings = [];

function err(file, msg) {
  errors.push(`${relative(ROOT, file).replace(/\\/g, "/")}: ${msg}`);
}

function warn(file, msg) {
  warnings.push(`${relative(ROOT, file).replace(/\\/g, "/")}: ${msg}`);
}

// ─── File discovery ──────────────────────────────────────────────────────────

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      out.push(...(await walk(p)));
    } else if (e.name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

// ─── Minimal YAML parser (supports our frontmatter grammar only) ─────────────
// Grammar: key: value | key: (empty) followed by indented nested keys.
// Indentation is 2 spaces per level. No arrays, no multi-line strings.

function parseYaml(text) {
  const lines = text.split("\n");
  const root = {};
  const stack = [{ indent: -1, obj: root }];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    if (indent % 2 !== 0) {
      throw new Error(`bad indent (${indent}) on line: ${line}`);
    }
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;
    const trimmed = line.trim();
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(trimmed);
    if (!m) throw new Error(`bad line: ${trimmed}`);
    const [, key, rawVal] = m;

    if (rawVal === "") {
      const obj = {};
      parent[key] = obj;
      stack.push({ indent, obj });
    } else {
      let v = rawVal.trim();
      if (v === "null" || v === "~") v = null;
      else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      parent[key] = v;
    }
  }
  return root;
}

function extractFrontmatter(text) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return null;
  const body = text.replace(/^---\r?\n/, "");
  const match = /\r?\n---\r?\n/.exec(body);
  if (!match) return null;
  const raw = body.slice(0, match.index);
  const rest = body.slice(match.index + match[0].length);
  return { raw, rest };
}

// ─── Per-file validation ─────────────────────────────────────────────────────

function isChapter(file) {
  return !file.includes(`${pathSep()}decisions${pathSep()}`) || file.endsWith("AGENTS.md") || file.endsWith("README.md");
}

function isAdr(file) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  return /^docs\/decisions\/\d{4}-/.test(rel);
}

function isVariant(file) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  return /^docs\/.+\/variants\//.test(rel);
}

function pathSep() {
  return process.platform === "win32" ? "\\" : "/";
}

function validateFrontmatter(file, meta) {
  // Common required fields.
  if (!meta.version) err(file, "frontmatter: missing `version`");
  else if (!SEMVER.test(meta.version)) err(file, `frontmatter: \`version\` must be semver (got "${meta.version}")`);

  if (!meta["last-reviewed"]) err(file, "frontmatter: missing `last-reviewed`");
  else if (!ISO_DATE.test(meta["last-reviewed"])) {
    err(file, `frontmatter: \`last-reviewed\` must match YYYY-MM-DD (got "${meta["last-reviewed"]}")`);
  } else {
    const d = new Date(meta["last-reviewed"] + "T00:00:00Z");
    if (isNaN(d.valueOf())) {
      err(file, `frontmatter: \`last-reviewed\` is not a valid date (got "${meta["last-reviewed"]}")`);
    } else if (d.getTime() > Date.now() + 24 * 3600 * 1000) {
      err(file, `frontmatter: \`last-reviewed\` is in the future (got "${meta["last-reviewed"]}")`);
    } else {
      const ageMs = Date.now() - d.getTime();
      const ageDays = ageMs / (24 * 3600 * 1000);
      if (ageDays > 730) warn(file, `\`last-reviewed\` is over 24 months old (${Math.round(ageDays)} days)`);
    }
  }

  if (!meta.status) {
    err(file, "frontmatter: missing `status`");
  } else if (isAdr(file)) {
    if (!STATUS_ADR.has(meta.status)) {
      err(file, `frontmatter: \`status\` for ADR must be one of ${[...STATUS_ADR].join("|")} (got "${meta.status}")`);
    }
  } else {
    if (!STATUS_CHAPTER.has(meta.status)) {
      err(file, `frontmatter: \`status\` must be one of ${[...STATUS_CHAPTER].join("|")} (got "${meta.status}")`);
    }
  }

  // ADR-specific.
  if (isAdr(file)) {
    if (!meta.id) err(file, "frontmatter: ADR missing `id`");
    else if (!ADR_ID.test(meta.id)) err(file, `frontmatter: ADR \`id\` must be 4 digits (got "${meta.id}")`);
    else {
      const expected = relative(ROOT, file).replace(/\\/g, "/").match(/(\d{4})-/);
      if (expected && expected[1] !== meta.id) {
        err(file, `frontmatter: ADR \`id\` (${meta.id}) does not match filename prefix (${expected[1]})`);
      }
    }
    if (meta.status === "accepted" && !meta.date) err(file, "frontmatter: accepted ADR must have `date`");
    if (meta.status === "superseded" && !meta["superseded-by"]) {
      err(file, "frontmatter: superseded ADR must have `superseded-by`");
    }
  }

  // Variant-specific.
  if (isVariant(file)) {
    if (!meta.requires) err(file, "frontmatter: variant chapter must have `requires`");
    else if (!meta.requires.profile && !meta.requires.min) {
      err(file, "frontmatter: variant `requires` must have at least `profile` or `min`");
    }
  }
}

// ─── Link validation ─────────────────────────────────────────────────────────

const MD_LINK = /\[(?:[^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

async function checkLinks(file, body) {
  if (!body) return;
  const dir = dirname(file);
  // Strip fenced and inline code — links inside code are illustrative, not navigational.
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "");
  for (const match of stripped.matchAll(MD_LINK)) {
    const raw = match[1];
    if (!raw) continue;
    if (/^(https?:|mailto:|tel:|#)/.test(raw)) continue;
    const [pathPart] = raw.split("#");
    if (!pathPart) continue; // pure anchor
    const target = resolve(dir, pathPart);
    if (!existsSync(target)) {
      err(file, `broken link: ${raw} → ${relative(ROOT, target).replace(/\\/g, "/")}`);
      continue;
    }
    try {
      const st = await stat(target);
      if (st.isDirectory()) {
        // Directory links are OK (e.g., [./templates/]).
        continue;
      }
    } catch {
      err(file, `broken link: ${raw}`);
    }
  }
}

// ─── Cross-file consistency checks ───────────────────────────────────────────

async function checkAdrIndex(entries) {
  const readme = entries.find((e) => relative(ROOT, e.file).replace(/\\/g, "/") === "docs/decisions/README.md");
  if (!readme) return;
  const body = readme.body ?? "";
  const adrs = entries.filter((e) => isAdr(e.file));
  for (const adr of adrs) {
    const fname = relative(ROOT, adr.file).replace(/\\/g, "/").split("/").pop();
    if (!body.includes(fname)) {
      err(readme.file, `ADR not linked in Index: ${fname}`);
    }
  }
}

async function checkSupersedes(entries) {
  const adrs = entries.filter((e) => isAdr(e.file) && e.meta);
  const byId = new Map();
  for (const e of adrs) if (e.meta.id) byId.set(e.meta.id, e);

  for (const e of adrs) {
    const sup = e.meta.supersedes;
    if (sup && sup !== "null" && sup !== null) {
      const other = byId.get(sup);
      if (!other) err(e.file, `supersedes: ADR ${sup} not found`);
      else if (other.meta["superseded-by"] !== e.meta.id) {
        err(other.file, `supersedes inconsistency: this ADR should have \`superseded-by: ${e.meta.id}\``);
      }
    }
    const by = e.meta["superseded-by"];
    if (by && by !== "null" && by !== null) {
      const other = byId.get(by);
      if (!other) err(e.file, `superseded-by: ADR ${by} not found`);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const files = await walk(DOCS);
  const rootAgents = join(ROOT, "AGENTS.md");
  if (existsSync(rootAgents)) files.unshift(rootAgents);

  const entries = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const fm = extractFrontmatter(text);
    if (!fm) {
      err(file, "missing frontmatter");
      entries.push({ file, meta: null, body: text });
      continue;
    }
    let meta = null;
    try {
      meta = parseYaml(fm.raw);
    } catch (e) {
      err(file, `frontmatter YAML parse error: ${e.message}`);
      entries.push({ file, meta: null, body: fm.rest });
      continue;
    }
    validateFrontmatter(file, meta);
    entries.push({ file, meta, body: fm.rest });
  }

  for (const { file, body } of entries) await checkLinks(file, body);
  await checkAdrIndex(entries);
  await checkSupersedes(entries);

  const header = `Checked ${entries.length} file(s).`;
  if (warnings.length) {
    console.warn(`\n⚠  ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn("   " + w);
  }
  if (errors.length) {
    console.error(`\n✗  ${errors.length} error(s):`);
    for (const e of errors) console.error("   " + e);
    console.error(`\n${header} Failed.`);
    process.exit(1);
  } else {
    console.log(`\n✓  ${header} Passed.`);
  }
}

main().catch((e) => {
  console.error("Linter crashed:", e);
  process.exit(2);
});
