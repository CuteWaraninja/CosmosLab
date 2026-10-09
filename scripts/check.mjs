import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const html=read('index.html');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
for(const [,attrs,body] of scripts){
  const src=attrs.match(/src=["']([^"']+)["']/i)?.[1];
  if(src){assert(!/^https?:/.test(src),'Runtime scripts must remain local');assert(existsSync(resolve(root,src)),`Missing ${src}`);new vm.Script(read(src),{filename:src});}
  else new vm.Script(body,{filename:'index.html inline script'});
}
for(const file of readdirSync(root).filter(f=>f.endsWith('.js')))new vm.Script(read(file),{filename:file});
const context=vm.createContext({});
vm.runInContext(read('worlds.js')+';globalThis.result={worlds,extraQuestions}',context);
const {worlds,extraQuestions}=context.result;
assert.equal(Object.keys(worlds).length,13);
assert.equal(extraQuestions.length,30);
for(const [topic,q,answers,index,why,source] of extraQuestions){assert(topic&&q&&why&&source);assert(Array.isArray(answers)&&Number.isInteger(index)&&index>=0&&index<answers.length);}
vm.runInContext(read('environment.js')+';globalThis.env=environments',context);
assert.equal(context.env.earth.cover,71);
for(const [id,e] of Object.entries(context.env)){assert(e.cover>=0&&e.cover<=100);if(id!=='earth')assert.equal(e.cover,0);assert(e.clarity>=0);}
for(const file of ['README.md','AI_DISCLOSURE.md','THIRD_PARTY_NOTICES.md','LICENSE'])assert(existsSync(resolve(root,file)));
assert(read('README.md').includes('纯 AI 提示词项目的第一次落地尝试'));
console.log(`PASS: ${scripts.length} script tags, 13 worlds, 30 added questions, environment defaults and required documents.`);
