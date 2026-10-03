// Guard test for BAC-1790 / BAC-921: every package-lock.json in this repo must
// resolve baseline-browser-mapping at or above the first non-vulnerable release.
//
// Run from the repo root with:  node --test scripts/baseline-browser-mapping.test.mjs
//
// The floor is pinned here on purpose so that no package.json or lockfile can
// lower it. Dependency-free: node:test, node:fs, node:path only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = 'baseline-browser-mapping';
const PACKAGE_KEY = `node_modules/${PACKAGE_NAME}`;
export const MIN_SAFE = [2, 11, 0];

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'lost+found']);

export function parseVersion(version) {
  const segments = String(version).split('.').map((s) => Number.parseInt(s, 10));
  assert.ok(
    segments.length >= 3 && segments.every((n) => Number.isInteger(n) && n >= 0),
    `unparseable version "${version}"`,
  );
  return segments;
}

// Numeric per-segment comparison: returns true when `version` >= `min`.
export function isAtLeast(version, min = MIN_SAFE) {
  const parsed = parseVersion(version);
  for (let i = 0; i < Math.max(parsed.length, min.length); i += 1) {
    const a = parsed[i] ?? 0;
    const b = min[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
}

export function findLockfiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) walk(full);
      else if (name === 'package-lock.json') found.push(full);
    }
  };
  walk(root);
  return found.sort();
}

// Returns every resolved baseline-browser-mapping version in a lockfile
// (top-level and nested node_modules entries alike).
export function resolvedVersions(lockfilePath) {
  const lock = JSON.parse(readFileSync(lockfilePath, 'utf8'));
  const packages = lock.packages ?? {};
  return Object.entries(packages)
    .filter(([key]) => key === PACKAGE_KEY || key.endsWith(`/${PACKAGE_KEY}`))
    .map(([key, entry]) => ({ key, version: entry.version }));
}

const lockfiles = findLockfiles(REPO_ROOT);

test('at least one package-lock.json is discovered (empty evidence is not a pass)', () => {
  assert.ok(lockfiles.length > 0, `no package-lock.json found under ${REPO_ROOT}`);
});

test(`every lockfile resolves ${PACKAGE_NAME} >= ${MIN_SAFE.join('.')}`, () => {
  assert.ok(lockfiles.length > 0, 'no lockfiles to check');
  for (const lockfile of lockfiles) {
    const rel = relative(REPO_ROOT, lockfile);
    for (const { key, version } of resolvedVersions(lockfile)) {
      assert.ok(
        isAtLeast(version),
        `${rel}: ${PACKAGE_NAME} ${version} is below ${MIN_SAFE.join('.')} (entry ${key})`,
      );
    }
  }
});

test('isAtLeast compares versions numerically per segment', () => {
  assert.equal(isAtLeast('2.9.0'), false, '2.9.0 sorts after 2.11.0 as a string but is below it');
  assert.equal(isAtLeast('2.10.38'), false, '2.10.38 is the vulnerable version in four lockfiles');
  assert.equal(isAtLeast('2.10.32'), false, '2.10.32 is the vulnerable version in lua-shopping-assistant');
  assert.equal(isAtLeast('2.11.0'), true, '2.11.0 is the exact floor');
  assert.equal(isAtLeast('2.11.21'), true, '2.11.21 is the target version');
});
