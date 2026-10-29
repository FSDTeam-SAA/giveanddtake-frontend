const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('lib/skill-input.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const scope={exports:{}};vm.runInNewContext(code,scope);const {addSkillValue,skillIdentity}=scope.exports;
test('custom skills normalize duplicates without merging punctuation or Unicode names',()=>{
 let list=[];for(const value of [' Risk   Management ','risk management','C','C++','C#','বাংলা'])list=addSkillValue(list,value).skills;
 assert.deepEqual(Array.from(list),['Risk Management','C','C++','C#','বাংলা']);
 assert.equal(skillIdentity('RISK  management'),'risk management');
});
test('skill boundaries reject overflow without losing existing chips',()=>{
 const initial=['Saved'];assert.equal(addSkillValue(initial,'A'.repeat(100)).skills[1].length,100);
 assert.equal(addSkillValue(initial,'A'.repeat(101)).skills,initial);
 const full=Array.from({length:30},(_,i)=>'Skill '+i);assert.ok(addSkillValue(full,'another').error);
 assert.equal(addSkillValue(full,' skill   0 ').skills,full);assert.equal(addSkillValue(initial,' ').skills,initial);
});
for(const file of ['create-resume-form.tsx','update-resume-form.tsx'])test(file+': actual submit handler commits pending skills before validation and stops invalid input',async()=>{
 const source=fs.readFileSync('app/(website)/elevator-video-pitch/_components/'+file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler;
 function visit(node){if(ts.isJsxAttribute(node)&&node.name.getText(ast)==='onSubmit'&&node.initializer?.expression?.getText(ast).includes('skillsInput.current'))handler=node.initializer.expression.getText(ast);ts.forEachChild(node,visit);}visit(ast);assert.ok(handler);
 const plain=ts.transpileModule('const handler='+handler,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 for(const commit of [()=>['Saved','New custom skill'],()=>null]){
  let saved,validations=0;const context={skillsInput:{current:{commit}},form:{setValue:(key,value)=>{assert.equal(key,'skills');saved=value;},handleSubmit:submit=>()=>{validations++;return submit({skills:saved});}},onSubmit:data=>{assert.deepEqual(data.skills,['Saved','New custom skill']);},onError:()=>{}};
  vm.runInNewContext(plain+';this.submit=handler;',context);context.submit({preventDefault(){}});
  assert.equal(validations,commit()===null?0:1);
 }
});
