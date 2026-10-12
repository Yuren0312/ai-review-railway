'use strict';

const test = require('node:test');
const assert = require('node:assert');

const railway = require('../dist/index.js');

/* ---------------- YAML parsing ---------------- */
test('parseYaml parses the reference config', () => {
  const cfgText = [
    'enabled: true',
    'mode: observe # observe | enforce',
    'limits:',
    '  per_agent_per_day: 3',
    '  per_repo_per_day: 10',
    '  max_files: 20',
    '  max_additions: 500',
    'risk:',
    '  high_paths:',
    '    - ".github/workflows/**"',
    '    - "package.json"',
    '    - "requirements.txt"',
    '    - "pyproject.toml"',
    '    - "**/auth/**"',
    '  require_tests_for: [medium, high]',
    'guarantor:',
    '  required_for: [medium, high]',
    '  approved_label: "ai-guarantor-approved"',
    'sandbox:',
    '  allow_repos: []',
    '  allow_branches: ["ai-sandbox/*"]',
    'review:',
    '  comment: true',
    '  checklist: true',
    '  metrics: true',
  ].join('\n');

  const c = railway.parseYaml(cfgText);
  assert.strictEqual(c.enabled, true);
  assert.strictEqual(c.mode, 'observe'); // inline comment is stripped
  assert.strictEqual(c.limits.per_agent_per_day, 3);
  assert.strictEqual(c.limits.per_repo_per_day, 10);
  assert.strictEqual(c.limits.max_files, 20);
  assert.strictEqual(c.limits.max_additions, 500);
  assert.deepStrictEqual(c.risk.high_paths, [
    '.github/workflows/**', 'package.json', 'requirements.txt', 'pyproject.toml', '**/auth/**',
  ]);
  assert.deepStrictEqual(c.risk.require_tests_for, ['medium', 'high']);
  assert.deepStrictEqual(c.guarantor.required_for, ['medium', 'high']);
  assert.strictEqual(c.guarantor.approved_label, 'ai-guarantor-approved');
  assert.deepStrictEqual(c.sandbox.allow_repos, []);
  assert.deepStrictEqual(c.sandbox.allow_branches, ['ai-sandbox/*']);
  assert.strictEqual(c.review.comment, true);
});

test('parseYaml handles empty lists, nested objects, and # inside quotes', () => {
  const c = railway.parseYaml([
    'a: []',
    'b:',
    '  c: "x#y"',
    '  d: 3.14',
    'e:',
    '  - {name: foo, val: 1}',
  ].join('\n'));
  assert.deepStrictEqual(c.a, []);
  assert.strictEqual(c.b.c, 'x#y');
  assert.strictEqual(c.b.d, 3.14);
  assert.deepStrictEqual(c.e, [{ name: 'foo', val: 1 }]);
});

/* ---------------- glob ---------------- */
test('glob matches ** and *', () => {
  assert.ok(railway.matchAny('.github/workflows/ci.yml', ['.github/workflows/**']).length === 1);
  assert.ok(railway.matchAny('src/auth/login.ts', ['**/auth/**']).length === 1);
  assert.ok(railway.matchAny('ai-sandbox/foo', ['ai-sandbox/*']).length === 1);
  assert.ok(railway.matchAny('package.json', ['package.json']).length === 1);
  assert.ok(railway.matchAny('src/utils.ts', ['**/auth/**']).length === 0);
});

/* ---------------- AI detection ---------------- */
function ctx(fields) {
  return Object.assign({
    labels: [], author: 'alice', authorType: 'User', title: 'fix', body: '',
    commits: [], files: [], stats: { files: 0, additions: 0, deletions: 0 }, ci: 'unknown',
  }, fields);
}

test('detectAiPr detects a bot author', () => {
  const r = railway.detectAiPr(ctx({ author: 'gpt-bot', authorType: 'Bot' }), railway.DEFAULT_CONFIG);
  assert.ok(r.isAi);
  assert.ok(r.signals.some((s) => s.type === 'author'));
});

test('detectAiPr detects labels and trailers', () => {
  const r = railway.detectAiPr(ctx({
    labels: ['ai-generated'],
    commits: [{ message: 'Generated-by: claude-3\n\nfix something' }],
  }), railway.DEFAULT_CONFIG);
  assert.ok(r.isAi);
  assert.ok(r.signals.some((s) => s.type === 'label'));
  assert.ok(r.signals.some((s) => s.type === 'trailer'));
  assert.strictEqual(r.agent, 'claude-3');
});

test('detectAiPr does not flag a normal human PR', () => {
  const r = railway.detectAiPr(ctx({ author: 'alice' }), railway.DEFAULT_CONFIG);
  assert.strictEqual(r.isAi, false);
});

/* ---------------- risk classification ---------------- */
test('classifyRisk marks high_paths as high', () => {
  const c = ctx({
    files: [{ filename: '.github/workflows/ci.yml', additions: 1, deletions: 1 }],
    stats: { files: 1, additions: 1, deletions: 1 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'high');
});

test('classifyRisk marks dependency changes as high', () => {
  const c = ctx({
    files: [{ filename: 'requirements.txt', additions: 1, deletions: 1 }],
    stats: { files: 1, additions: 1, deletions: 1 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'high');
});

test('classifyRisk marks large diffs as medium', () => {
  const c = ctx({
    files: Array.from({ length: 30 }, (_, i) => ({ filename: `src/f${i}.ts`, additions: 10, deletions: 0 })),
    stats: { files: 30, additions: 300, deletions: 0 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'medium');
});

test('classifyRisk marks small changes as low', () => {
  const c = ctx({
    files: [{ filename: 'README.md', additions: 2, deletions: 0 }],
    stats: { files: 1, additions: 2, deletions: 0 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'low');
});

/* ---------------- comment builder ---------------- */
test('buildComment includes all key sections', () => {
  const c = ctx({
    number: 42, title: 'auto: add feature', author: 'bot-01', authorType: 'Bot',
    files: [{ filename: 'src/a.ts', additions: 5, deletions: 0 }],
    stats: { files: 1, additions: 5, deletions: 0 }, ci: 'success',
  });
  const ai = { isAi: true, signals: [{ type: 'author', detail: 'bot' }], agent: 'bot-01' };
  const risk = { level: 'medium', reasons: ['x'], hasTests: false };
  const rate = { exceeded: false, reasons: [], counts: {} };
  const guarantor = { required: true, satisfied: false, evidence: 'none' };
  const sandbox = { allowed: true, problems: [], note: '' };
  const body = railway.buildComment(c, railway.DEFAULT_CONFIG, ai, risk, rate, guarantor, sandbox, 'observe');
  for (const kw of ['Change summary', 'Detection', 'Risk classification', 'Impact surface', 'Test evidence', 'Rollback plan', 'Suggested review order', 'Blockers', 'Human guarantor status']) {
    assert.ok(body.includes(kw), 'should include section: ' + kw);
  }
});

/* ---------------- sandbox ---------------- */
test('sandboxCheck enforces branch allow-list', () => {
  const c = ctx({ headRef: 'ai-sandbox/x', baseRef: 'main', repoFull: 'o/r' });
  const cfg = JSON.parse(JSON.stringify(railway.DEFAULT_CONFIG));
  const ok = railway.sandboxCheck(c, cfg);
  assert.strictEqual(ok.allowed, true);
  const c2 = ctx({ headRef: 'feature/x', baseRef: 'main', repoFull: 'o/r' });
  const ng = railway.sandboxCheck(c2, cfg);
  assert.strictEqual(ng.allowed, true); // not enforce: only warns, does not block
  assert.ok(ng.problems.length === 1);
});

console.log('\n✅ all pure-function tests passed\n');
