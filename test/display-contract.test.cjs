const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const fixtures = require('./fixtures/display-contract.json');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const scope = { exports: {} }; vm.runInNewContext(code, scope); return scope.exports;
}
const candidate = load('lib/candidate-display.ts');
const job = load('lib/job-card-display.ts');
test('shared salutation fixtures hide standalone values and retain careers and deliberately typed names', () => {
  for (const row of fixtures.headlines) assert.equal(candidate.candidateHeadline(row.value), row.expected, JSON.stringify(row.value));
  for (const row of fixtures.names) assert.equal(candidate.candidateName(row.firstName, row.lastName), row.expected);
});
test('shared job metadata fixtures retain zero, resolve legacy counts and reject invented values', () => {
  for (const row of fixtures.counts) assert.equal(job.applicantCount(...row.values), row.expected, JSON.stringify(row.values));
  assert.equal(job.applicantLabel(0), '0 applicants'); assert.equal(job.applicantLabel(1), '1 applicant');
  assert.equal(job.applicantLabel(2), '2 applicants'); assert.equal(job.applicantLabel(null), null);
  for (const row of fixtures.locations) assert.equal(job.locationTypeLabel(row.value), row.expected);
  for (const row of fixtures.employment) assert.equal(job.employmentTypeLabel(row.value), row.expected);
});
test('job dates match the shared contract in UTC and Dhaka, including midnight and invalid-date fallbacks', () => {
  for (const [tz, expectedKey] of [['UTC', 'utc'], ['Asia/Dhaka', 'dhaka']]) {
    const script = `const fs=require('fs'),vm=require('vm'),ts=require('typescript');const scope={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/job-card-display.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,scope);process.stdout.write(JSON.stringify(require('./test/fixtures/display-contract.json').dates.map(row=>scope.exports.jobCardDate(...row.values))));`;
    const output = execFileSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, TZ: tz }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), fixtures.dates.map(row => row[expectedKey]));
  }
});
