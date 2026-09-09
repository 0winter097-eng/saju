import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBirth,queryPeriod,interpretation,termsForYear,makeReport} from '../dist/engine.js';
import {plainReading,READING_VERSION,READING_CATEGORIES} from '../dist/readings.js';
const birth={date:'1990-05-12',calendar:'solar',leap:'regular',timeMode:'exact',time:'14:35',sex:'female',city:'daegu',source:'record'};

test('쉬운 풀이가 원본 계산을 바꾸지 않고 연·월·일 전체 구간 및 근거를 보존',()=>{
 const model=analyzeBirth(birth);
 for(const selection of [{type:'year',year:2027},{type:'month',year:2026,month:9},{type:'day',year:2027,date:'2027-05-10'}]){
  const period=queryPeriod(model,selection),before=JSON.stringify(makeReport(model,period));
  const reading=plainReading(model,period);
  assert.equal(reading.title,period.title);assert.equal(reading.version,READING_VERSION);
  assert.equal(reading.segments[0].start,period.start);assert.equal(reading.segments.at(-1).end,period.end);
  assert.deepEqual(reading.segments.flatMap(s=>s.sourceRows),period.rows.map((_,i)=>i));
  for(const [index,s] of reading.segments.entries()){
   if(index)assert.equal(reading.segments[index-1].end,s.start);
   for(const i of s.sourceRows)assert.equal(s.god,period.rows[i].evidence.god);
   assert.ok(s.content.summary&&s.content.work&&s.content.money&&s.content.relationships&&s.content.love&&s.content.caution);
   assert.equal(s.content.paragraphs[0],s.content.summary);
   assert.equal(s.content.paragraphs.at(-1),s.content.caution);
   for(const {key} of READING_CATEGORIES){
    const entry=s.content[key],expected=[entry.headline,...(entry.action?[entry.action]:[entry.single,entry.coupled]),entry.caution].join(' ');
    assert.equal(entry.paragraphs[0],expected,'서술형 문단에 핵심·행동·주의사항과 관계별 조건이 모두 보존되어야 함');
   }
  }
  assert.equal(JSON.stringify(makeReport(model,period)),before);
  assert.deepEqual(plainReading(model,period),reading);
 }
});

test('연간 설명은 입춘 전후를 구분하고 절기마다 같은 설명을 반복하지 않음',()=>{
 const model=analyzeBirth(birth),period=queryPeriod(model,{type:'year',year:2027});
 const reading=plainReading(model,period),ipchun=termsForYear(2027).find(t=>t.name==='입춘').ms;
 assert.equal(reading.segments.length,2);
 assert.equal(reading.segments[0].end,ipchun);assert.equal(reading.segments[1].start,ipchun);
 assert.notEqual(reading.segments[0].god,reading.segments[1].god);
});

test('출생일 기준이 미확정이면 쉬운 설명도 보류하며 잘못된 근거가 들어와도 추정하지 않음',()=>{
 const model=analyzeBirth({...birth,timeMode:'unknown'},{dayBoundary:'zi23'});
 assert.equal(model.common.day,null);
 const period=queryPeriod(model,{type:'year',year:2027});
 period.rows.forEach(row=>row.evidence={god:'정관'});
 const reading=plainReading(model,period);
 assert.ok(reading.segments.every(s=>s.content===null&&s.god===null));
 assert.match(reading.notes.join(' '),/시간 범위를 좁혀/);
});

test('열 가지 기본 관계에 서로 다른 생활 설명이 연결되며 전문용어를 본문에 노출하지 않음',()=>{
 const model=analyzeBirth(birth),titles=new Set(),gods=new Set();
 for(let stem=0;stem<10;stem++){
  const evidence=interpretation(model.common.day,{stem});
  const period={title:'예시 기간',rows:[{start:0,end:1,evidence}],schedule:null};
  const s=plainReading(model,period).segments[0];
  assert.equal(s.god,evidence.god);gods.add(s.god);titles.add(s.content.title);
  assert.doesNotMatch(JSON.stringify(s.content),/일간|천간|십성|지장간|신강|용신|[\u3400-\u9fff]/);
 }
 assert.equal(gods.size,10);assert.equal(titles.size,10);
});

test('성별 미지정은 기본 풀이를 막지 않으며 출생 전 구간을 설명에 추가하지 않음',()=>{
 const model=analyzeBirth({...birth,sex:'unspecified'});
 const period=queryPeriod(model,{type:'year',year:1990}),reading=plainReading(model,period);
 assert.equal(period.trimmed,true);assert.equal(reading.segments[0].start,model.min);
 assert.ok(reading.segments.every(s=>s.content));
 assert.match(reading.notes.join(' '),/성별을 선택하지 않아/);
 assert.equal(period.schedule,null);
});


test('네 분야를 제공하며 애정은 관계 상태를 단정하지 않음',()=>{
 assert.deepEqual(READING_CATEGORIES.map(c=>c.label),['재물운','직장운','대인관계운','애정운']);
 for(const input of [birth,{...birth,date:'2000-01-07',sex:'male'},{...birth,timeMode:'unknown'}]){
  const model=analyzeBirth(input),reading=plainReading(model,queryPeriod(model,{type:'year',year:2027}));
  assert.equal(Object.hasOwn(reading,'health'),false);
  for(const s of reading.segments.filter(s=>s.content)){
   for(const key of ['money','work','relationships'])assert.ok(s.content[key].headline&&s.content[key].action&&s.content[key].caution);
   assert.ok(s.content.love.single&&s.content.love.coupled&&s.content.love.caution);
  }
 }
});

test('내려받은 설명을 수정해도 다른 조회의 문장을 바꾸지 않음',()=>{
 const model=analyzeBirth(birth),period=queryPeriod(model,{type:'year',year:2027});
 const original=plainReading(model,period),changed=plainReading(model,period);
 changed.segments[0].content.money.headline='수정';
 changed.segments[0].content.money.paragraphs[0]='수정';
 changed.segments[0].content.paragraphs.push('수정');
 assert.deepEqual(plainReading(model,period),original);
});
