const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const base = 'app/(website)/elevator-video-pitch/_components/';
function loadPolicy() {
  const { outputText } = ts.transpileModule(fs.readFileSync('lib/candidate-profile-policy.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}});
  const scope = {exports:{}, URL}; vm.runInNewContext(outputText,scope); return scope.exports;
}
const policy = loadPolicy();
function schema(file, name) {
  const ast = ts.createSourceFile(file, fs.readFileSync(base+file,'utf8'), ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let source;
  function visit(n) { if(ts.isVariableDeclaration(n) && n.name.getText(ast) === name) source=n.initializer.getText(ast); ts.forEachChild(n,visit); }
  visit(ast);
  return vm.runInNewContext('('+source+')',{z:require('zod').z,MAX_URL_LEN:160,...policy});
}
for (const [file,name] of [['create-resume-form.tsx','resumeSchema'],['update-resume-form.tsx','resumeFormSchema']]) {
  test(`${file}: required skills and populated education validate before submission`, () => {
    const s=schema(file,name);
    assert.equal(s.shape.skills.safeParse([]).success,false);
    assert.equal(s.shape.skills.safeParse(['React']).success,true);
    assert.equal(s.shape.educationList.safeParse([{degree:'Bachelors',instituteName:''}]).success,false);
    assert.equal(s.shape.educationList.safeParse([{}, {instituteName:'Independent school'}]).success,true);
    if(file.startsWith('update')) assert.equal(s.shape.educationList.safeParse([{_id:'old',type:'delete'}]).success,true);
  });
  test(`${file}: all eight URL fields enforce 160 characters and matching domains`, () => {
    const s=schema(file,name);
    for(const [label,host] of [['LinkedIn','linkedin.com'],['Twitter','x.com'],['Facebook','facebook.com'],['TikTok','tiktok.com'],['Instagram','instagram.com'],['Upwork','upwork.com'],['Fiverr','fiverr.com'],['Others','example.com']]) {
      const prefix=`https://${host}/`, url=prefix+'a'.repeat(160-prefix.length);
      assert.equal(s.shape.sLink.safeParse([{label,url}]).success,true,label);
      assert.equal(s.shape.sLink.safeParse([{label,url:url+'a'}]).success,false,label);
    }
    assert.equal(s.shape.sLink.safeParse([{label:'TikTok',url:'https://linkedin.com/person'}]).success,false);
    assert.equal(s.shape.sLink.safeParse([{label:'LinkedIn',url:'https://linkedin.com.evil.test'}]).success,false);
  });
}

test('education section remains visible when a later entry has an institution and no start date', () => {
  const source=fs.readFileSync(base+'resume.tsx','utf8');
  const ast=ts.createSourceFile('resume.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let condition;
  function visit(n) {
    if(ts.isBinaryExpression(n) && n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken
      && n.left.getText(ast).includes('resume.education') && n.right.getText(ast).includes('Education')) condition=n.left.getText(ast);
    ts.forEachChild(n,visit);
  }
  visit(ast); assert.ok(condition);
  assert.equal(vm.runInNewContext(condition,{resume:{education:[{instituteName:''},{instituteName:'Visible school',startDate:''}]}}),true);
});
