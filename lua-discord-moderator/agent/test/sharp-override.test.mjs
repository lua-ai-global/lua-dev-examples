import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

const atLeast = (v, min) => {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test('overrides pin sharp to ^0.35.4 and keep existing overrides', () => {
  assert.equal(pkg.overrides.sharp, '^0.35.4');
  assert.equal(pkg.overrides['nanoid@3'], '^3.3.18');
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.1');
});

test('no sharp in the lockfile is below 0.35.4 (0.34.5 is gone)', () => {
  const sharps = Object.entries(lock.packages).filter(([k]) => k === 'node_modules/sharp' || k.endsWith('/node_modules/sharp'));
  assert.ok(sharps.length > 0);
  for (const [, p] of sharps) {
    assert.notEqual(p.version, '0.34.5');
    assert.match(p.version, /^0\./);
    assert.ok(atLeast(p.version, '0.35.4'), p.version);
  }
});

test('@img/sharp-linux-x64 follows sharp', () => {
  const sharp = lock.packages['node_modules/sharp'];
  const plat = lock.packages['node_modules/@img/sharp-linux-x64'];
  assert.equal(plat.version, sharp.optionalDependencies['@img/sharp-linux-x64']);
  assert.notEqual(plat.version, '0.34.5');
});

test('@livekit/agents exact pin is the edge being overridden', () => {
  const agents = lock.packages['node_modules/@livekit/agents'];
  assert.equal(agents.dependencies.sharp, '0.34.5');
  assert.ok(lock.packages['node_modules/sharp'].version.startsWith('0.35.'));
});
