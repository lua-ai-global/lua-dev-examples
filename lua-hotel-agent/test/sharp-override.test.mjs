import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const pkg = read('../package.json');
const lock = read('../package-lock.json');

const atLeast = (v, min) => {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test('package.json overrides sharp to ^0.35.4', () => {
  assert.equal(pkg.overrides.sharp, '^0.35.4');
});

test('lockfile node_modules/sharp version is >= 0.35.4, not 0.34.5', () => {
  const { version } = lock.packages['node_modules/sharp'];
  assert.notEqual(version, '0.34.5');
  assert.ok(atLeast(version, '0.35.4'), `sharp resolved to ${version}`);
});
