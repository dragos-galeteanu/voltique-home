#!/usr/bin/env node
/**
 * Verifies every relative link in the documentation.
 *
 * A broken link in a README is the kind of thing nobody notices until someone new follows
 * it, so this runs in CI alongside the other checks. Anchors are resolved the way GitHub
 * slugifies headings.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', '.expo', 'ios', 'android', 'dist', 'coverage']);

function markdownFiles(directory = ROOT) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];

    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** GitHub's heading slug: lower case, punctuation dropped, spaces to hyphens. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function anchorsIn(file) {
  const headings = readFileSync(file, 'utf8').match(/^#{1,6}\s+.*$/gm) ?? [];
  return new Set(headings.map((heading) => slug(heading.replace(/^#{1,6}\s+/, ''))));
}

const anchorCache = new Map();
const problems = [];

for (const file of markdownFiles()) {
  const content = readFileSync(file, 'utf8');
  const links = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);

  for (const link of links) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;

    const [target, anchor] = link.split('#');
    const resolved = resolve(dirname(file), target);

    try {
      statSync(resolved);
    } catch {
      problems.push(`${relative(ROOT, file)} -> ${link} (no such file)`);
      continue;
    }

    if (!anchor || !resolved.endsWith('.md')) continue;

    if (!anchorCache.has(resolved)) anchorCache.set(resolved, anchorsIn(resolved));
    if (!anchorCache.get(resolved).has(anchor)) {
      problems.push(`${relative(ROOT, file)} -> ${link} (no such heading)`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Broken documentation links (${problems.length}):`);
  problems.forEach((problem) => console.error(`  ${problem}`));
  process.exit(1);
}

console.log('Documentation links resolve.');
