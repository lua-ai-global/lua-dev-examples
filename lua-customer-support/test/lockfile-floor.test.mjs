import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const parse = (v) => v.split('.').map((n) => parseInt(n, 10));
const cmp = (a, b) => {
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
};

const floors = {
  browserslist: '4.28.7',
  'baseline-browser-mapping': '2.11.0',
  'js-yaml': '4.3.2',
  sharp: '0.35.4',
};

for (const [name, floor] of Object.entries(floors)) {
  test(`${name} resolves at or above ${floor}`, () => {
    const entries = Object.entries(lock.packages).filter(
      ([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`),
    );
    assert.ok(entries.length > 0, `${name} missing from lockfile`);
    for (const [path, entry] of entries) {
      assert.ok(cmp(entry.version, floor) >= 0, `${name} ${entry.version} < ${floor} (${path})`);
    }
  });
}

test('js-yaml stays on 4.x', () => {
  const v = lock.packages['node_modules/js-yaml'].version;
  assert.ok(cmp(v, '5.0.0') < 0, `js-yaml ${v} is not < 5`);
});

test('overrides pin js-yaml@4 and sharp', () => {
  assert.equal(pkg.overrides['js-yaml@4'], '^4.3.2');
  assert.equal(pkg.overrides.sharp, '0.35.4');
});

test('lua-cli has not drifted', () => {
  assert.equal(lock.packages['node_modules/lua-cli'].version, '3.39.4');
});
