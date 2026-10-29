// Real shared create/edit skills controls, real form schemas and submit handlers.
// Profile persistence is localStorage in this fixture; no production writes.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const ts = require('typescript');
const esbuild = require(process.env.ESBUILD_MODULE || 'esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const web = path.resolve(__dirname, '../..'), output = process.env.SKILLS_ARTIFACTS || path.resolve(web, '../artifacts');
const base = 'http://127.0.0.1:3033';

function actualForm(file, declarationName) {
  const source = fs.readFileSync(path.join(web, 'app/(website)/elevator-video-pitch/_components', file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler, skills;
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onSubmit' && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isArrowFunction(node.initializer.expression)) {
      const expression = node.initializer.expression.getText(ast);
      if (expression.includes('skillsInput.current?.commit()')) handler = expression;
    }
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === declarationName) {
      function findRule(child) {
        if (ts.isPropertyAssignment(child) && child.name.getText(ast) === 'skills') skills = child.initializer.getText(ast);
        ts.forEachChild(child, findRule);
      }
      ts.forEachChild(node.initializer, findRule);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(handler && skills, 'Actual form commit handler and skills rule must be found: ' + file);
  return { handler, skills };
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const create = actualForm('create-resume-form.tsx', 'resumeSchema');
  const edit = actualForm('update-resume-form.tsx', 'resumeFormSchema');
  const bundle = await esbuild.build({ stdin: { resolveDir: web, loader: 'tsx', contents: `
import React,{useEffect,useRef,useState} from 'react';import {createRoot} from 'react-dom/client';
import {useForm} from 'react-hook-form';import {zodResolver} from '@hookform/resolvers/zod';import {z} from 'zod';
import {Form,FormField,FormItem} from './components/ui/form';
import {SkillsSelector as Create} from './app/(website)/elevator-video-pitch/_components/skills-selector';
import {SkillsSelector as Edit} from './app/(website)/elevator-video-pitch/_components/update-resume/skills-selector';
function Fixture(){
 const params=new URLSearchParams(location.search),mode=location.pathname.includes('edit')?'edit':'create';
 const key='skills-fixture-'+mode+'-'+(params.get('case')||'default');
 const defaults=JSON.parse(localStorage.getItem(key)||'null')||(params.get('seed')==='30'?Array.from({length:30},(_,i)=>'Skill '+i):[]);
 const [selectedSkills,setSelectedSkills]=useState(defaults),[saved,setSaved]=useState(''),[invalid,setInvalid]=useState('');
 const skillsInput=useRef(null), form=useForm({defaultValues:{skills:defaults},resolver:zodResolver(z.object({skills:mode==='create'?(${create.skills}):(${edit.skills})}))});
 useEffect(()=>form.setValue('skills',selectedSkills),[selectedSkills]);
 const onSubmit=data=>{localStorage.setItem(key,JSON.stringify(data.skills));setSaved(JSON.stringify(data.skills));setInvalid('');};
 const onError=()=>setInvalid('Please check the skills.');
 const handler=mode==='create'?(${create.handler}):(${edit.handler});
 const Control=mode==='create'?Create:Edit;
 return <main className="mx-auto max-w-3xl space-y-4 p-4"><h1>{mode==='create'?'Create':'Edit'} skills fixture</h1><Form {...form}><form onSubmit={handler} className="space-y-4"><FormField control={form.control} name="skills" render={({field})=><FormItem><Control ref={skillsInput} selectedSkills={selectedSkills} onSkillsChange={values=>{setSelectedSkills(values);field.onChange(values);}} error={form.formState.errors.skills?.message}/></FormItem>}/><button type="submit">Save profile fixture</button></form></Form><output data-saved>{saved}</output>{invalid&&<p role="alert">{invalid}</p>}</main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_BASE_URL': '"/api/v1"' }, plugins: [{ name: 'alias', setup(build) {
    build.onResolve({ filter: /^@\// }, args => { const file = path.join(web, args.path.slice(2)); return { path: ['.tsx', '.ts', '.js'].map(ext => file + ext).find(fs.existsSync) || file }; });
  } }] });
  const cssDir = path.join(web, '.next/static/css');
  const css = fs.readdirSync(cssDir, { recursive: true }).filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join(cssDir, file), 'utf8')).join('\n');
  assert.ok(css, 'Run production build before browser verification');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, base);
    if (url.pathname === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle.outputFiles[0].text); }
    if (url.pathname === '/api/v1/skill') {
      const referer = new URL(req.headers.referer || base);
      const scenario = referer.searchParams.get('scenario');
      res.setHeader('Content-Type', 'application/json');
      if (scenario === 'failure') { res.statusCode = 503; return res.end(JSON.stringify({ success: false })); }
      const reply = () => res.end(JSON.stringify({ success: true, data: scenario === 'empty' ? [] : [{ name: 'Risk' }, { name: ' risk ' }, { name: 'C++' }, { name: 'C#' }, { name: 'Inactive suggestion', active: false }] }));
      if (scenario === 'loading') return setTimeout(reply, 1000);
      return reply();
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  await new Promise(resolve => server.listen(3033, '127.0.0.1', resolve));
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const input = () => page.getByLabel('Search Skills', { exact: true });
  const save = () => page.getByRole('button', { name: 'Save profile fixture', exact: true }).click();
  async function saved(expected) { await page.waitForFunction(value => document.querySelector('[data-saved]').textContent === JSON.stringify(value), expected); }
  try {
    for (const mode of ['create', 'edit']) {
      await page.goto(`${base}/${mode}?case=roundtrip`);
      await input().fill('  Novel   Risk skill  '); await save(); await saved(['Novel Risk skill']);
      await page.reload(); await page.getByRole('button', { name: 'Remove Novel Risk skill', exact: true }).waitFor();
      await input().fill('novel risk SKILL'); await input().press('Enter'); await save(); await saved(['Novel Risk skill']);
      await page.getByRole('button', { name: 'Remove Novel Risk skill', exact: true }).click();
      await input().fill('Risk'); const riskChoice = page.getByRole('button', { name: /^risk$/i }); const canonicalRisk = await riskChoice.innerText(); await riskChoice.click();
      await input().fill('C'); await page.getByRole('button', { name: 'Add “C”', exact: true }).click();
      await input().fill('C++'); await input().press('Enter');
      await input().fill('C#'); await save(); await saved([canonicalRisk, 'C', 'C++', 'C#']);
      await page.reload(); for (const name of [canonicalRisk, 'C', 'C++', 'C#']) await page.getByRole('button', { name: 'Remove ' + name, exact: true }).waitFor();
      console.log('PASS ' + mode + ' real form submit commits pending input; reload/edit/removal and punctuation/case duplicate rules');
      for (const scenario of ['loading', 'failure', 'empty']) {
        await page.goto(`${base}/${mode}?case=${scenario}&scenario=${scenario}`);
        if (scenario === 'loading') await page.getByText('Loading suggestions. You can also type a skill.', { exact: true }).waitFor();
        if (scenario === 'failure') await page.getByText('Suggestions are unavailable. You can still add your own skills.', { exact: true }).waitFor();
        await input().fill('Custom ' + scenario); await save(); await saved(['Custom ' + scenario]);
      }
      console.log('PASS ' + mode + ' manual entry through loading, failure and empty suggestions');
      await page.goto(`${base}/${mode}?case=limits&seed=30`);
      assert.equal(await page.getByRole('button', { name: /^Remove Skill / }).count(), 30);
      await input().fill('Thirty first skill'); await save(); await page.getByText('You can add at most 30 skills.', { exact: true }).waitFor();
      assert.equal(await input().inputValue(), 'Thirty first skill'); assert.equal(await input().evaluate(element => element === document.activeElement), true);
      assert.equal(await page.locator('[data-saved]').innerText(), '');
      await page.getByRole('button', { name: 'Remove Skill 0', exact: true }).click(); await save();
      await saved([...Array.from({ length: 29 }, (_, i) => 'Skill ' + (i + 1)), 'Thirty first skill']);
      await page.goto(`${base}/${mode}?case=length`); await input().fill('A'.repeat(101)); assert.equal((await input().inputValue()).length, 100); await save(); await saved(['A'.repeat(100)]);
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await input().fill('বাংলা ' + 'X'.repeat(94));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, mode + ' overflow ' + width);
        await page.screenshot({ path: path.join(output, `skills-search-web-${mode}-${width}.png`), fullPage: true });
      }
      assert.equal(await page.getByText(/characters max/).count(), 0);
      console.log('PASS ' + mode + ' 30/31 skills, 100-character cap, focused validation and responsive long-name layout');
    }
    assert.deepEqual(errors, []);
    console.log('PASS zero browser page errors; all persistence isolated in fixture localStorage');
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'skills-search-web-browser-failure.png'), fullPage: true }); console.error('URL', page.url(), 'Errors', errors); console.error(await page.locator('body').innerText()); throw error;
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
