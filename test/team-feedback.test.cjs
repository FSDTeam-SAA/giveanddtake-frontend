const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, imports = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const scope = { exports: {}, require: name => imports[name] ?? require(name) };
  vm.runInNewContext(outputText, scope); return scope.exports;
}
const fields = load('lib/field-policy.ts');
const text = load('lib/job-description-policy.ts');
const history = load('lib/profile-history.ts');
const credentials = load('lib/profile-credentials.ts');
const common = { '@/lib/field-policy': fields, '@/lib/utils': { cn: (...items) => items.filter(Boolean).join(' ') } };

test('shared inputs/textarea enforce limits without decorating routine labels', () => {
  const { Input } = load('components/ui/input.tsx', common);
  const { Textarea } = load('components/ui/textarea.tsx', common);
  for (const [name,max] of [['aboutUs',1400],['bio',1400],['experiences.0.jobDescription',1400],['awardsAndHonors.0.description',500],['subject',50],['message',500]]) {
    let saved;
    const element=Textarea.render({ name, value:'', onChange:e=>saved=e.target.value },null);
    assert.equal(element.props.maxLength,max,name);
    element.props.onChange({target:{value:'A'.repeat(max+500)}});
    assert.equal(saved.length,max,name);
    assert.equal(fields.fieldLabel(name),name);
  }
  assert.equal(Input.render({type:'email',name:'address',maxLength:100},null).props.maxLength,254);
  assert.equal(Input.render({name:'title'},null).props.maxLength,100);
  assert.equal(Input.render({name:'search'},null).props.maxLength,254);
});

test('create/edit profile schemas enforce About, nested description and email boundaries', () => {
  for (const [file,name] of [['create-resume-form.tsx','resumeSchema'],['update-resume-form.tsx','resumeFormSchema'],['create-company.tsx','formSchema'],['edit-company-profile.tsx','formSchema'],['create-recruiter-account.tsx','recruiterSchema']]) {
    const source=fs.readFileSync(path.join(__dirname,'../app/(website)/elevator-video-pitch/_components',file),'utf8');
    const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let initializer, urlInitializer;
    function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name)initializer=node.initializer.getText(ast);if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='urlOptional')urlInitializer=node.initializer.getText(ast);ts.forEachChild(node,visit);}visit(ast);
    const context={z:require('zod').z,MAX_URL_LEN:160,...text};
    if(urlInitializer)context.urlOptional=vm.runInNewContext(`(${urlInitializer})`,context);
    const schema=vm.runInNewContext(`(${initializer})`,context);
    const about=schema.shape.aboutUs??schema.shape.bio;
    assert.equal(about.safeParse('A'.repeat(1400)).success,true,file);
    assert.equal(about.safeParse('A'.repeat(1401)).success,false,file);
    assert.equal(about.safeParse('word '.repeat(300)).success,false,file);
    const email=schema.shape.email??schema.shape.cemail??schema.shape.emailAddress;
    const exact='a@'+'b'.repeat(63)+'.'+'c'.repeat(63)+'.'+'d'.repeat(63)+'.'+'e'.repeat(56)+'.com';
    assert.equal(exact.length,254);
    assert.equal(email.safeParse(exact).success,true,file);
    assert.equal(email.safeParse('a'+exact).success,false,file);
  }
});

test('saved credentials render consistently, including a blank first award and escaped content', () => {
  const { ProfileCredentials }=load('components/profile/profile-credentials.tsx',{
    '@/lib/profile-credentials':credentials,'@/lib/profile-history':history,
  });
  const props={certifications:['["CIPD Level 7","AWS"]'],languages:['English',' বাংলা '],awards:[{},
    {title:'Merit <script>alert(1)</script>',programeName:'Design Council',programeDate:'2024-01-01',description:'Saved description'},
    {title:'Newest award',programeDate:'2026-01-01',description:'A'.repeat(800)}]};
  const before=JSON.stringify(props);
  const html=renderToStaticMarkup(React.createElement(ProfileCredentials,props));
  for(const label of ['Awards &amp; Honours','Certifications','Languages','CIPD Level 7','AWS','বাংলা','Design Council','Saved description'])assert.ok(html.includes(label),label);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.indexOf('Newest award')<html.indexOf('Merit'));
  assert.equal(JSON.stringify(props),before,'Rendering cannot change saved data');
  assert.equal(renderToStaticMarkup(React.createElement(ProfileCredentials,{})).includes('<section'),false);
});

test('web award creation sends the persisted programme field so editing can reload it', () => {
  const file='app/(website)/elevator-video-pitch/_components/create-resume-form.tsx';
  const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;
  function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='processedAwards')expression=node.initializer.getText(ast);ts.forEachChild(node,visit);}visit(ast);
  const data={awardsAndHonors:[{title:'Merit',programName:'Design Council',description:'Description',programeDate:'2026-01-01'}]};
  const saved=vm.runInNewContext(`(${expression})`,{data,formatDateToISO:value=>value});
  assert.equal(saved[0].programeName,'Design Council');
  assert.equal(saved[0].title,'Merit');
  assert.equal(saved[0].description,'Description');
});

test('job editor guidance uses the enforced capacity and avoids a duplicate counter', () => {
  const create=fs.readFileSync(path.join(__dirname,'../components/MultiStepJobForm/job-form-steps/job-description-step.tsx'),'utf8');
  const edit=fs.readFileSync(path.join(__dirname,'../app/(website)/single-job/[id]/page.tsx'),'utf8');
  assert.doesNotMatch(create,/\/2000|Character count:/);
  assert.doesNotMatch(edit,/\/2000/);
  assert.match(edit,/descriptionCharCount\}\/\{JOB_DESCRIPTION_MAX_CHARACTERS/);
  assert.match(create,/wordCount\}\/20 minimum/);
});

test('credentials keep skills between certifications and languages with optional sections missing', () => {
  const { ProfileCredentials }=load('components/profile/profile-credentials.tsx',{
    '@/lib/profile-credentials':credentials,'@/lib/profile-history':history,
  });
  for (const certifications of [[], ['AWS']]) {
    for (const languages of [[], ['English']]) {
      const props={certifications,languages,awards:[{title:'Merit'}]};
      const before=JSON.stringify(props);
      const html=renderToStaticMarkup(React.createElement(ProfileCredentials,props,React.createElement('h3',null,'Skills')));
      const headings=[...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map(match=>match[1]);
      assert.deepEqual(headings,[...(certifications.length?['Certifications']:[]),'Skills',...(languages.length?['Languages']:[]),'Awards &amp; Honours']);
      assert.equal(JSON.stringify(props),before);
    }
  }
});
