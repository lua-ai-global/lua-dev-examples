// BAC-2133 regression: sharp must resolve to >=0.35.4 in this subproject.
// @livekit/agents@1.8.0 pins `"sharp": "0.35.3"` exactly, so the only way
// to move off sharp@0.35.3 without touching dependency ranges is the scoped
// override `"@livekit/agents": {"sharp": "0.35.4"}` in package.json.
// Runs with the Node built-in runner: `node --test test/*.test.mjs` (no extra deps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectDir = join(here, '..');
const repoRoot = join(projectDir, '..');

const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(projectDir, 'package-lock.json'), 'utf8'));

const MIN_SHARP = '0.35.4';
const VULNERABLE_SHARP = 'sharp@0.35.3';

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  assert.ok(m, `not a semver: ${v}`);
  return m.slice(1).map(Number);
}
function gte(a, b) {
  const [x, y] = [parseSemver(a), parseSemver(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return true;
}

test('package.json declares the scoped override "@livekit/agents": {"sharp": "0.35.4"}', () => {
  assert.deepEqual(pkg.overrides, { '@livekit/agents': { sharp: '0.35.4' } });
  assert.equal(pkg.dependencies?.sharp, undefined, 'sharp must not become a direct dependency');
});

test('@livekit/agents@1.8.0 still declares the exact "sharp": "0.35.3" pin that forces the override', () => {
  const agents = lock.packages['node_modules/@livekit/agents'];
  assert.ok(agents, '@livekit/agents missing from lockfile');
  assert.equal(agents.version, '1.8.0');
  assert.equal(agents.dependencies.sharp, '0.35.3');
});

test(`lockfile resolves sharp to >=${MIN_SHARP}, not ${VULNERABLE_SHARP}`, () => {
  const sharp = lock.packages['node_modules/sharp'];
  assert.ok(sharp, 'node_modules/sharp missing from lockfile');
  assert.notEqual(`sharp@${sharp.version}`, VULNERABLE_SHARP);
  assert.ok(gte(sharp.version, MIN_SHARP), `sharp@${sharp.version} < ${MIN_SHARP}`);
  assert.equal(sharp.resolved, `https://registry.npmjs.org/sharp/-/sharp-${sharp.version}.tgz`);
  assert.match(sharp.integrity ?? '', /^sha512-/);
});

test('every @img/sharp-* binary in the lockfile matches the resolved sharp version', () => {
  const sharpVersion = lock.packages['node_modules/sharp'].version;
  const binaries = Object.entries(lock.packages).filter(
    ([p]) => p.startsWith('node_modules/@img/sharp-') && !p.includes('sharp-libvips-'),
  );
  assert.ok(binaries.length > 0, 'no @img/sharp-* entries found');
  for (const [path, entry] of binaries) {
    assert.equal(entry.version, sharpVersion, `${path} is at ${entry.version}`);
    assert.match(entry.resolved ?? '', /^https:\/\/registry\.npmjs\.org\//, `${path} resolved off-registry`);
    assert.match(entry.integrity ?? '', /^sha512-/, `${path} has no integrity`);
  }
});

test('@img/sharp-libvips-* entries satisfy the exact versions sharp declares', () => {
  const sharp = lock.packages['node_modules/sharp'];
  for (const [name, range] of Object.entries(sharp.optionalDependencies ?? {})) {
    if (!name.startsWith('@img/sharp-libvips-')) continue;
    const entry = lock.packages[`node_modules/${name}`];
    assert.ok(entry, `${name} missing from lockfile`);
    assert.equal(entry.version, range, `${name} is ${entry.version}, sharp wants ${range}`);
  }
});

test(`npm ls sharp reports >=${MIN_SHARP} on every path with no invalid entries`, () => {
  const out = execFileSync('npm', ['ls', 'sharp', '--package-lock-only', '--json'], {
    cwd: projectDir,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  const tree = JSON.parse(out);
  assert.equal(tree.problems, undefined, `npm ls sharp problems: ${JSON.stringify(tree.problems)}`);
  const found = [];
  (function walk(node, path) {
    for (const [name, dep] of Object.entries(node.dependencies ?? {})) {
      const p = `${path} > ${name}@${dep.version}`;
      if (name === 'sharp') found.push({ p, version: dep.version, invalid: dep.invalid });
      if (name === '@livekit/agents') {
        assert.equal(dep.version, '1.8.0', p);
        assert.equal(dep.overridden, true, `${p} should be overridden`);
      }
      walk(dep, p);
    }
  })(tree, tree.name);
  assert.ok(found.length > 0, 'npm ls sharp found no sharp');
  for (const s of found) {
    assert.equal(s.invalid, undefined, `${s.p} is invalid`);
    assert.ok(gte(s.version, MIN_SHARP), `${s.p} < ${MIN_SHARP}`);
  }
});

test('changelog.d/BAC-2133.md exists and follows the one-line format of changelog.d/BAC-768.md', () => {
  const reference = join(repoRoot, 'changelog.d', 'BAC-768.md');
  const fragment = join(repoRoot, 'changelog.d', 'BAC-2133.md');
  assert.ok(existsSync(reference), 'reference fragment changelog.d/BAC-768.md missing');
  assert.ok(existsSync(fragment), 'changelog.d/BAC-2133.md missing');
  const refLines = readFileSync(reference, 'utf8').trim().split('\n');
  const lines = readFileSync(fragment, 'utf8').trim().split('\n');
  assert.equal(refLines.length, 1);
  assert.equal(lines.length, 1, 'fragment must be a single line');
  assert.match(refLines[0], /^lua-shopping-assistant: .*sharp.*0\.35\.4/);
  assert.match(lines[0], /^lua-whatsapp-flow-otp: .*sharp.*0\.35\.4/);
});
