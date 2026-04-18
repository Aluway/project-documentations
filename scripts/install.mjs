#!/usr/bin/env node
// Zero-dep installer for the documentation template.
//
// Usage (from target project root):
//
//   # Bootstrap a new project (empty target):
//   mkdir my-new-project && cd my-new-project && git init -b main
//   npx github:Aluway/project-documentations
//
//   # Or add the template into an existing project:
//   cd my-existing-project
//   npx github:Aluway/project-documentations
//
// What it does:
//   - Copies docs/, scripts/, .github/, and template root files into the
//     target directory.
//   - Files that already exist in the target are SKIPPED by default —
//     existing work is never overwritten.
//   - package.json is SMART-MERGED: template fields are added, existing
//     values always win, scripts are unioned.
//   - Prints a summary with counts and the list of skipped files, so
//     you can manually merge those if you want template content.
//
// Flags:
//   --force         Overwrite existing files (DESTRUCTIVE — use with care).
//   --dry-run       Show what would happen without writing anything.
//   --target=PATH   Install into PATH instead of process.cwd().

import { readFile, writeFile, readdir, mkdir, stat, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Setup ───────────────────────────────────────────────────────────────────

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolve(SCRIPT_DIR, "..");

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const targetArg = args.find((a) => a.startsWith("--target="));
const target = resolve(
  targetArg ? targetArg.slice("--target=".length) : process.cwd()
);

if (target === TEMPLATE_ROOT) {
  console.error("✗ Refusing to install template into itself.");
  console.error("  Run this from the target project root, or pass --target=PATH.");
  process.exit(2);
}

// ─── Manifest: what to copy and how ──────────────────────────────────────────

// Copy-if-absent: copy when target file does not exist. Do not overwrite
// unless --force is passed.
const COPY_IF_ABSENT = [
  "docs",
  "scripts/lint-docs.mjs",
  "scripts/install.mjs",
  ".github/workflows/docs-lint.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/feature_request.md",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ".env.example",
  ".gitattributes",
];

// Smart-merge: a custom strategy per file. Never overwrite blindly.
const SMART_MERGE = new Set(["package.json"]);

// Never auto-touched even if absent — too project-specific. User picks from
// the template manually if they want our versions.
const NEVER_AUTO = new Set(["README.md", "CHANGELOG.md", "LICENSE", ".gitignore"]);

// Only these npm scripts from the template are propagated to downstream
// projects. `install:template` is template-author plumbing and must not leak.
const DOWNSTREAM_SCRIPTS = ["lint", "lint:docs"];

// ─── Stats ───────────────────────────────────────────────────────────────────

const results = { copied: [], merged: [], skipped: [], info: [] };

const log = {
  copy: (p) => results.copied.push(relative(target, p).replace(/\\/g, "/")),
  merge: (p) => results.merged.push(relative(target, p).replace(/\\/g, "/")),
  skip: (p, reason) =>
    results.skipped.push({
      path: relative(target, p).replace(/\\/g, "/"),
      reason,
    }),
  info: (msg) => results.info.push(msg),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function copyFileSafe(srcAbs, dstAbs) {
  if (existsSync(dstAbs) && !force) {
    log.skip(dstAbs, "exists");
    return;
  }
  if (dryRun) {
    log.copy(dstAbs);
    return;
  }
  await mkdir(dirname(dstAbs), { recursive: true });
  await copyFile(srcAbs, dstAbs);
  log.copy(dstAbs);
}

async function copyItem(item) {
  const srcAbs = join(TEMPLATE_ROOT, item);
  if (!existsSync(srcAbs)) {
    log.info(`template item missing: ${item} — skipped`);
    return;
  }
  const st = await stat(srcAbs);
  if (st.isDirectory()) {
    const files = await walk(srcAbs);
    for (const f of files) {
      const rel = relative(TEMPLATE_ROOT, f);
      await copyFileSafe(f, join(target, rel));
    }
  } else {
    await copyFileSafe(srcAbs, join(target, item));
  }
}

function mergePackageJson(templatePkg, existingPkg) {
  // Existing values always win. Template contributes ONLY scripts and engines
  // — everything else (private, type, license, keywords, author, repository,
  // files, bin, description, version, name) is project-specific and MUST NOT
  // be imposed on an existing package.json.
  const merged = { ...existingPkg };

  // Scripts: add `lint` / `lint:docs` only. Existing values always win;
  // template-specific scripts (like `install:template`) are never propagated.
  const contributed = {};
  for (const key of DOWNSTREAM_SCRIPTS) {
    if (templatePkg.scripts?.[key]) contributed[key] = templatePkg.scripts[key];
  }
  if (Object.keys(contributed).length > 0) {
    merged.scripts = { ...contributed, ...(existingPkg.scripts ?? {}) };
  }

  // engines.node: linter needs Node 20+. Add it only if the user hasn't pinned
  // `node` themselves. Other `engines` fields (npm, pnpm, …) are preserved
  // as-is — we only contribute the `node` key.
  if (!existingPkg.engines?.node && templatePkg.engines?.node) {
    merged.engines = {
      ...(existingPkg.engines ?? {}),
      node: templatePkg.engines.node,
    };
  }

  return merged;
}

async function smartMergePackageJson() {
  const srcAbs = join(TEMPLATE_ROOT, "package.json");
  const dstAbs = join(target, "package.json");

  const templatePkg = JSON.parse(await readFile(srcAbs, "utf8"));

  if (!existsSync(dstAbs)) {
    // No existing package.json — emit a minimal stub. Only carry over what
    // downstream projects actually need (engines.node + lint scripts); all
    // template-author metadata (repository, bin, install:template, files,
    // keywords, author, bugs, homepage) stays out.
    const freshScripts = {};
    for (const key of DOWNSTREAM_SCRIPTS) {
      if (templatePkg.scripts?.[key]) freshScripts[key] = templatePkg.scripts[key];
    }
    const fresh = {
      name: "<your-project-name>",
      version: "0.1.0",
      description: "<your project description>",
      private: templatePkg.private ?? true,
      type: templatePkg.type,
      license: templatePkg.license,
      scripts: freshScripts,
      engines: templatePkg.engines?.node
        ? { node: templatePkg.engines.node }
        : undefined,
    };
    // Drop keys we left undefined so the emitted JSON stays clean.
    for (const k of Object.keys(fresh)) if (fresh[k] === undefined) delete fresh[k];

    if (dryRun) {
      log.merge(dstAbs);
      return;
    }
    await writeFile(dstAbs, JSON.stringify(fresh, null, 2) + "\n");
    log.merge(dstAbs);
    log.info(
      "package.json: created from template stub — fill in name, description, repository."
    );
    return;
  }

  const existingPkg = JSON.parse(await readFile(dstAbs, "utf8"));
  const merged = mergePackageJson(templatePkg, existingPkg);

  if (dryRun) {
    log.merge(dstAbs);
    return;
  }
  await writeFile(dstAbs, JSON.stringify(merged, null, 2) + "\n");
  log.merge(dstAbs);
  log.info(
    "package.json: smart-merged — only `scripts` (lint, lint:docs) and `engines.node` added; all other fields untouched."
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log(`Documentation template installer`);
  console.log(`  source:  ${TEMPLATE_ROOT}`);
  console.log(`  target:  ${target}`);
  if (dryRun) console.log("  mode:    dry-run (no files will be written)");
  if (force) console.log("  mode:    force (existing files will be OVERWRITTEN)");
  console.log("");

  // 1. Copy-if-absent items.
  for (const item of COPY_IF_ABSENT) {
    await copyItem(item);
  }

  // 2. Smart-merge package.json.
  await smartMergePackageJson();

  // 3. Emit a one-line reminder about NEVER_AUTO files.
  for (const f of NEVER_AUTO) {
    const abs = join(target, f);
    if (!existsSync(abs)) {
      log.info(
        `${f}: not present in target — review template's version at ${relative(
          target,
          join(TEMPLATE_ROOT, f)
        ).replace(/\\/g, "/")} and decide whether to copy.`
      );
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log(`Copied:   ${results.copied.length}`);
  console.log(`Merged:   ${results.merged.length}`);
  console.log(`Skipped:  ${results.skipped.length}  (existing — pass --force to overwrite)`);
  console.log("");

  if (results.skipped.length) {
    console.log("Skipped files (already in your project):");
    for (const s of results.skipped.slice(0, 20)) {
      console.log(`  • ${s.path}`);
    }
    if (results.skipped.length > 20) {
      console.log(`  …and ${results.skipped.length - 20} more`);
    }
    console.log("");
  }

  if (results.info.length) {
    console.log("Notes:");
    for (const m of results.info) console.log(`  • ${m}`);
    console.log("");
  }

  console.log("Next steps:");
  console.log("  1. Read docs/onboarding/01-first-fork.md for the day-one checklist.");
  console.log("  2. Fill docs/code-style/PROFILE.md with your actual stack.");
  console.log("  3. Run: npm run lint   (validates documentation integrity)");
  console.log("");
}

main().catch((e) => {
  console.error("");
  console.error("✗ Installer crashed:", e.message);
  console.error(e.stack);
  process.exit(1);
});
