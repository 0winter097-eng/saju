import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {BIRTH_TIME_BANDS} from '../dist/time-input.js';
import {CITIES} from '../dist/engine.js';
const root=resolve('dist');
const html=readFileSync(join(root,'index.html'),'utf8');
// Input choices must exist even before the calculation module loads.
function staticOptions(id){
 const block=html.match(new RegExp(`<select\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`))?.[1]??'';
 return [...block.matchAll(/<option value="([^"]*)"[^>]*>([^<]+)<\/option>/g)].map(([,value,label])=>({value,label}));
}
if(JSON.stringify(staticOptions('city'))!==JSON.stringify(CITIES.map(c=>({value:c.id,label:c.name}))))throw Error('Birth city choices must be in HTML and match calculation data');
if(JSON.stringify(staticOptions('query-month'))!==JSON.stringify(Array.from({length:12},(_,i)=>({value:String(i+1),label:`${i+1}월` }))))throw Error('Month choices must be available before module loading');
const timeOptions=staticOptions('birth-time-choice');
const expectedTimes=[{value:'',label:'선택해 주세요'},...BIRTH_TIME_BANDS.map(t=>({value:t.id,label:t.label})),{value:'unknown',label:'시간 모름'},{value:'exact',label:'정확한 시·분 직접 입력'},{value:'range',label:'시간 범위 직접 입력'}];
if(JSON.stringify(timeOptions)!==JSON.stringify(expectedTimes))throw Error('Birth time choices must match input ranges');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(ids.length!==new Set(ids).size)throw Error('Duplicate HTML ids');
for(const [,ref] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))if(!existsSync(resolve(root,ref.split('?')[0])))throw Error(`Missing asset ${ref}`);
for(const [,ref] of html.matchAll(/(?:for|aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g))for(const id of ref.split(' '))if(!ids.includes(id))throw Error(`Missing target ${id}`);
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(path,e.name)):[join(path,e.name)]);}
for(const file of files(root).filter(p=>p.endsWith('.js'))){
 const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);
 const code=readFileSync(file,'utf8');
 for(const [,ref] of code.matchAll(/(?:from\s*|import\()['"]([^'"]+)['"]/g))if(ref.startsWith('.')&&!existsSync(resolve(dirname(file),ref.split('?')[0])))throw Error(`Missing import ${ref}`);
}
const verification=JSON.parse(readFileSync('dist/verification.json','utf8'));
if(!verification.total||verification.passed!==verification.total)throw Error('Tests must pass before build');
for(const [p,hash] of Object.entries(verification.hashes))if(createHash('sha256').update(readFileSync(p)).digest('hex')!==hash)throw Error(`Tests are stale for ${p}. Run npm test.`);
const app=readFileSync('dist/app.js','utf8');
if(/localStorage|sessionStorage|sendBeacon|XMLHttpRequest/.test(app))throw Error('Unexpected personal-data persistence/network usage');
console.log('Validated: entrypoint, assets, HTML references, JS syntax/imports, test hashes and local-only data handling.');
