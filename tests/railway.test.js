'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const railway = require('../dist/index.js');

/* ---------------- YAML 解析 ---------------- */
test('parseYaml 解析任务给定配置', () => {
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
  assert.strictEqual(c.mode, 'observe'); // 注释被剥离
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

test('parseYaml 处理空列表、嵌套对象、引号内的 #', () => {
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
test('glob 匹配 ** 与 *', () => {
  assert.ok(railway.matchAny('.github/workflows/ci.yml', ['.github/workflows/**']).length === 1);
  assert.ok(railway.matchAny('src/auth/login.ts', ['**/auth/**']).length === 1);
  assert.ok(railway.matchAny('ai-sandbox/foo', ['ai-sandbox/*']).length === 1);
  assert.ok(railway.matchAny('package.json', ['package.json']).length === 1);
  assert.ok(railway.matchAny('src/utils.ts', ['**/auth/**']).length === 0);
});

/* ---------------- AI 识别 ---------------- */
function ctx(fields) {
  return Object.assign({
    labels: [], author: 'alice', authorType: 'User', title: 'fix', body: '',
    commits: [], files: [], stats: { files: 0, additions: 0, deletions: 0 }, ci: 'unknown',
  }, fields);
}

test('detectAiPr 通过作者 bot 识别', () => {
  const r = railway.detectAiPr(ctx({ author: 'gpt-bot', authorType: 'Bot' }), railway.DEFAULT_CONFIG);
  assert.ok(r.isAi);
  assert.ok(r.signals.some((s) => s.type === 'author'));
});

test('detectAiPr 通过 label 与 trailer 识别', () => {
  const r = railway.detectAiPr(ctx({
    labels: ['ai-generated'],
    commits: [{ message: 'Generated-by: claude-3\n\nfix something' }],
  }), railway.DEFAULT_CONFIG);
  assert.ok(r.isAi);
  assert.ok(r.signals.some((s) => s.type === 'label'));
  assert.ok(r.signals.some((s) => s.type === 'trailer'));
  assert.strictEqual(r.agent, 'claude-3');
});

test('detectAiPr 普通人工 PR 不误报', () => {
  const r = railway.detectAiPr(ctx({ author: 'alice' }), railway.DEFAULT_CONFIG);
  assert.strictEqual(r.isAi, false);
});

/* ---------------- 风险分级 ---------------- */
test('classifyRisk 命中 high_paths 判 high', () => {
  const c = ctx({
    files: [{ filename: '.github/workflows/ci.yml', additions: 1, deletions: 1 }],
    stats: { files: 1, additions: 1, deletions: 1 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'high');
});

test('classifyRisk 依赖变更判 high', () => {
  const c = ctx({
    files: [{ filename: 'requirements.txt', additions: 1, deletions: 1 }],
    stats: { files: 1, additions: 1, deletions: 1 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'high');
});

test('classifyRisk 大 diff 判 medium', () => {
  const c = ctx({
    files: Array.from({ length: 30 }, (_, i) => ({ filename: `src/f${i}.ts`, additions: 10, deletions: 0 })),
    stats: { files: 30, additions: 300, deletions: 0 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'medium');
});

test('classifyRisk 小改动判 low', () => {
  const c = ctx({
    files: [{ filename: 'README.md', additions: 2, deletions: 0 }],
    stats: { files: 1, additions: 2, deletions: 0 },
  });
  const r = railway.classifyRisk(c, railway.DEFAULT_CONFIG, { isAi: false });
  assert.strictEqual(r.level, 'low');
});

/* ---------------- 评论构建 ---------------- */
test('buildComment 包含全部关键段落', () => {
  const c = ctx({
    number: 42, title: 'auto: add feature', author: 'bot-01', authorType: 'Bot',
    files: [{ filename: 'src/a.ts', additions: 5, deletions: 0 }],
    stats: { files: 1, additions: 5, deletions: 0 }, ci: 'success',
  });
  const ai = { isAi: true, signals: [{ type: 'author', detail: 'bot' }], agent: 'bot-01' };
  const risk = { level: 'medium', reasons: ['x'], hasTests: false };
  const rate = { exceeded: false, reasons: [], counts: {} };
  const guarantor = { required: true, satisfied: false, evidence: '未绑定' };
  const sandbox = { allowed: true, problems: [], note: '' };
  const body = railway.buildComment(c, railway.DEFAULT_CONFIG, ai, risk, rate, guarantor, sandbox, 'observe');
  for (const kw of ['变更摘要', '识别结果', '风险分级', '影响面', '测试证据', '回滚方案', '建议审查顺序', '阻断项', '人类担保人状态']) {
    assert.ok(body.includes(kw), '应包含段落：' + kw);
  }
});

/* ---------------- 沙盒 ---------------- */
test('sandboxCheck 分支白名单', () => {
  const c = ctx({ headRef: 'ai-sandbox/x', baseRef: 'main', repoFull: 'o/r' });
  const cfg = JSON.parse(JSON.stringify(railway.DEFAULT_CONFIG));
  const ok = railway.sandboxCheck(c, cfg);
  assert.strictEqual(ok.allowed, true);
  const c2 = ctx({ headRef: 'feature/x', baseRef: 'main', repoFull: 'o/r' });
  const ng = railway.sandboxCheck(c2, cfg);
  assert.strictEqual(ng.allowed, true); // 未 enforce 时仅提示，不阻断
  assert.ok(ng.problems.length === 1);
});

console.log('\n✅ 全部纯函数测试通过\n');
