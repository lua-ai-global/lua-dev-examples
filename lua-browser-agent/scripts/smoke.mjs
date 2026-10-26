import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const results = [];

function record(step, state, note) {
  results.push({ step, state, note });
  const mark = state === 'pass' ? 'PASS' : state === 'skip' ? 'SKIP' : 'FAIL';
  console.log(`${mark}  ${step}${note ? ` — ${note}` : ''}`);
}

function run(step, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status === 0) return record(step, 'pass', `${command} ${args.join(' ')}`);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n');
  record(step, 'fail', `${command} ${args.join(' ')} exited ${result.status}\n${output}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

try {
  const version = readJson('node_modules/lua-cli/package.json').version;
  record('lua-cli installed', 'pass', `version ${version}`);
} catch {
  record('lua-cli installed', 'fail', 'run npm install first');
}

run('types check', 'npx', ['tsc', '--noEmit']);
run('lua compile', 'npx', ['lua', 'compile']);

try {
  const counts = {};
  for (const primitive of readJson('dist-v2/manifest.json').primitives) {
    counts[primitive.kind] = (counts[primitive.kind] ?? 0) + 1;
  }
  const expected = { agent: 1, skill: 1, tool: 8, job: 1, browser: 3 };
  const wrong = Object.entries(expected).filter(([kind, n]) => counts[kind] !== n);
  if (wrong.length === 0) {
    record('compiled primitives', 'pass', Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', '));
  } else {
    record('compiled primitives', 'fail', wrong.map(([kind, n]) => `${kind}: wanted ${n}, got ${counts[kind] ?? 0}`).join('; '));
  }
} catch {
  record('compiled primitives', 'fail', 'dist-v2/manifest.json is missing — lua compile did not finish');
}

const bound = !readFileSync(join(root, 'lua.skill.yaml'), 'utf8').includes('YOUR_AGENT_ID');
if (bound) {
  run('agent reachable', 'npx', ['lua', 'browsers']);
} else {
  record('agent bound', 'skip', 'lua.skill.yaml still says YOUR_AGENT_ID — run lua init --agent-id <id>');
  record('agent reachable', 'skip', 'needs a bound agent and lua auth configure');
}

const failed = results.filter((result) => result.state === 'fail');
console.log(
  `\n${results.filter((r) => r.state === 'pass').length} passed, ${failed.length} failed, ${results.filter((r) => r.state === 'skip').length} skipped`
);
process.exit(failed.length === 0 ? 0 : 1);
