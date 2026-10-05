import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression for BAC-2125 (lockfile-only security bump of js-yaml and
// browserslist). Dependency-free: runs with `node --test 'test/**/*.test.mjs'` and is not
// part of the tsc build (tsconfig `include` is `src` only).
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const pkg = read('../package.json');
const lock = read('../package-lock.json');

const atLeast = (v, min) => {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test('package.json keeps js-yaml ^4.3.1 and the js-yaml@4 override unchanged', () => {
  assert.equal(pkg.dependencies['js-yaml'], '^4.3.1');
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.1');
  assert.equal(pkg.overrides.browserslist, undefined, 'no new browserslist override expected');
});

test('lockfile node_modules/js-yaml is >= 4.3.2, not 4.3.1', () => {
  const { version } = lock.packages['node_modules/js-yaml'];
  assert.notEqual(version, '4.3.1');
  assert.ok(atLeast(version, '4.3.2'), `js-yaml resolved to ${version}`);
});

test('lockfile node_modules/browserslist is >= 4.28.7, not 4.28.4', () => {
  const { version } = lock.packages['node_modules/browserslist'];
  assert.notEqual(version, '4.28.4');
  assert.ok(atLeast(version, '4.28.7'), `browserslist resolved to ${version}`);
});

test('no js-yaml 3.x or other vulnerable js-yaml copy remains anywhere in the lockfile', () => {
  const copies = Object.entries(lock.packages).filter(([k]) => /(^|\/)node_modules\/js-yaml$/.test(k));
  assert.ok(copies.length >= 1, 'expected at least one js-yaml entry');
  for (const [key, { version }] of copies) {
    assert.ok(!version.startsWith('3.'), `${key} is js-yaml 3.x (${version})`);
    assert.ok(atLeast(version, '4.3.2'), `${key} resolved to ${version}`);
  }
});

test('sharp is untouched by this change (node_modules/sharp stays 0.34.5 until #95 lands)', () => {
  assert.equal(lock.packages['node_modules/sharp'].version, '0.34.5');
});
