import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

const VULNERABLE_SHARP = '0.34.5';
const MIN_SHARP = [0, 35, 4];

const atLeast = (version, min) => {
  const parts = version.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (parts[i] !== min[i]) return parts[i] > min[i];
  }
  return true;
};

test('package.json overrides pin sharp to ^0.35.4 and keep the existing pins', () => {
  assert.equal(pkg.overrides.sharp, '^0.35.4');
  assert.equal(pkg.overrides['undici@6'], '^6.28.0');
  assert.equal(pkg.dependencies.sharp, undefined);
});

test('lockfile node_modules/sharp is not the vulnerable 0.34.5 and is >= 0.35.4', () => {
  const sharp = lock.packages['node_modules/sharp'];
  assert.notEqual(sharp.version, VULNERABLE_SHARP);
  assert.ok(atLeast(sharp.version, MIN_SHARP), `sharp ${sharp.version} < 0.35.4`);
});

test('every resolved sharp node in the lockfile is >= 0.35.4', () => {
  const sharpNodes = Object.entries(lock.packages).filter(([path]) => /(^|\/)node_modules\/sharp$/.test(path));
  assert.ok(sharpNodes.length > 0);
  for (const [path, node] of sharpNodes) {
    assert.ok(atLeast(node.version, MIN_SHARP), `${path} is ${node.version}`);
  }
});

test('@livekit/agents stays at 1.4.8 and keeps its declared "sharp": "0.34.5" pin', () => {
  const agents = lock.packages['node_modules/@livekit/agents'];
  assert.equal(agents.version, '1.4.8');
  assert.equal(agents.dependencies.sharp, '0.34.5');
  assert.equal(lock.packages['node_modules/sharp'].version === VULNERABLE_SHARP, false);
});

test('@img/sharp-* platform packages match the sharp version they belong to', () => {
  const sharpVersion = lock.packages['node_modules/sharp'].version;
  const platform = Object.entries(lock.packages).filter(([path]) => /^node_modules\/@img\/sharp-(?!libvips)/.test(path));
  assert.ok(platform.length > 0);
  for (const [path, node] of platform) {
    assert.equal(node.version, sharpVersion, `${path} ${node.version} != sharp ${sharpVersion}`);
  }
});
