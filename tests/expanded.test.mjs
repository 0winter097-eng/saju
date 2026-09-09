import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBirth,queryPeriod,chartAt,MINUTE,DAY} from '../dist/engine.js';
import {plainReading} from '../dist/readings.js';
import {natalProfile,readingContext,composeReading} from '../dist/reading-rules.js';
import {BIRTH_TIME_BANDS,resolveBirthTime} from '../dist/time-input.js';
const birth={date:'1990-05-12',calendar:'solar',timeMode:'exact',time:'14:35',sex:'female',city:'daegu',source:'record'};
const lookup=(model,date)=>plainReading(model,queryPeriod(model,{type:'day',year:Number(date.slice(0,4)),date}));

test('시간대 13개가 하루 1440분을 중복·누락 없이 포함하고 다음 날로 넘어가지 않음',()=>{
 const covered=[];
 for(const band of BIRTH_TIME_BANDS){
  const data=resolveBirthTime({...birth,timeChoice:band.id}),model=analyzeBirth(data);
  assert.equal(data.timeMode,'range');assert.equal(model.exactInstant,null);
  assert.equal(model.normalized.solar.day,12);
  const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  for(let i=minutes(band.start);i<=minutes(band.end);i++)covered.push(i);
  assert.equal(model.min,Date.UTC(1990,4,12)+minutes(band.start)*MINUTE-540*MINUTE);
  assert.equal(model.max,Date.UTC(1990,4,12)+minutes(band.end)*MINUTE-540*MINUTE+59999);
 }
 assert.deepEqual(covered,Array.from({length:1440},(_,i)=>i));
 assert.equal(BIRTH_TIME_BANDS.at(-1).end,'23:59');
});

test('선택 미완료는 거절하고 시간 모름·정확 시각·직접 범위 전환은 이전 값을 재사용하지 않음',()=>{
 assert.throws(()=>resolveBirthTime({...birth,timeChoice:''}),/선택/);
 assert.throws(()=>resolveBirthTime({...birth,timeChoice:'invalid'}),/올바르지/);
 const unknown=resolveBirthTime({...birth,timeChoice:'unknown',timeStart:'02:00',timeEnd:'03:00'});
 assert.equal(unknown.source,'unknown');assert.equal(unknown.time,undefined);assert.equal(unknown.timeStart,undefined);
 const exact=resolveBirthTime({...birth,timeChoice:'exact',timeStart:'02:00',timeEnd:'03:00',timeBand:{id:'chou'}});
 assert.equal(exact.timeBand,undefined);assert.equal(exact.time,'14:35');assert.equal(exact.timeStart,undefined);assert.equal(exact.timeMode,'exact');
 const range=resolveBirthTime({...birth,timeChoice:'range',timeStart:'10:10',timeEnd:'10:40'});
 assert.equal(range.time,undefined);assert.equal(range.timeStart,'10:10');assert.equal(range.timeMode,'range');
});

test('시간대 명칭으로 시주를 강제하지 않고 표준시·경도 보정·23시 경계를 비교',()=>{
 const data=resolveBirthTime({...birth,timeChoice:'early-zi'});
 const standard=analyzeBirth(data);
 assert.equal(standard.common.hour,null);
 assert.ok(new Set(standard.candidates.map(c=>c.chart.hour.branch)).size===2);
 const late=resolveBirthTime({...birth,timeChoice:'late-zi'});
 const midnight=analyzeBirth(late),zi=analyzeBirth(late,{dayBoundary:'zi23'});
 assert.notEqual(midnight.common.day.name,zi.common.day.name);
 const mean=analyzeBirth(data,{solarTime:'mean',longitude:126.978});
 assert.equal(mean.common.day,null); // Early minutes can belong to the preceding corrected date.
 assert.ok(lookup(mean,'2026-09-09').segments.every(s=>s.content===null));
});

test('시간대 범위에 포함된 서머타임 누락·중복 시각을 기존 엔진으로 처리',()=>{
 const gap=analyzeBirth(resolveBirthTime({...birth,date:'1987-05-10',timeChoice:'chou'}));
 assert.ok(gap.warnings.some(w=>w.includes('존재하지 않는')));
 const fold=analyzeBirth(resolveBirthTime({...birth,date:'1988-10-09',timeChoice:'chou'}));
 assert.ok(fold.warnings.some(w=>w.includes('두 번')));
 assert.equal(fold.exactInstant,null);
});

test('같은 조회 십성이어도 지지·배경 기간이 다르면 문장이 달라지며 재조회는 동일',()=>{
 const model=analyzeBirth(birth),a=lookup(model,'2026-09-09'),b=lookup(model,'2026-09-19');
 assert.equal(a.segments[0].god,b.segments[0].god);
 assert.notDeepEqual(a.segments[0].content,b.segments[0].content);
 assert.deepEqual(lookup(model,'2026-09-09'),a);
});

test('같은 일간의 다른 출생 구성을 반영하며 미확정 기둥을 빈 오행으로 추정하지 않음',()=>{
 const a=analyzeBirth(birth),b=analyzeBirth({...birth,date:'1990-07-11'});
 assert.equal(a.common.day.stem,b.common.day.stem);
 assert.notDeepEqual(natalProfile(a),natalProfile(b));
 assert.notDeepEqual(lookup(a,'2026-09-09').segments[0].content,lookup(b,'2026-09-09').segments[0].content);
 const unknown=analyzeBirth({...birth,timeMode:'unknown'}),profile=natalProfile(unknown);
 assert.ok(profile.missingPillars.includes('hour'));
 assert.ok(profile.tokens.every(t=>t.position!=='hour'));
 assert.ok(profile.tokens.every(t=>!(t.position==='day'&&t.part==='stem')));
 for(const segment of lookup(unknown,'2026-09-09').segments){
  assert.ok(segment.context.relations.every(hit=>hit.position!=='hour'));
  assert.ok(segment.context.layers.every(layer=>layer.scope!=='daewoon'));
 }
});

test('월·연간은 구간 대표 일진을 전체 기간에 적용하지 않고 일간만 연·월 배경을 사용',()=>{
 const model=analyzeBirth(birth);
 for(const type of ['year','month','day']){
  const reading=plainReading(model,queryPeriod(model,{type,year:2026,month:9,date:'2026-09-09'}));
  for(const s of reading.segments){
   const scopes=s.context.layers.map(l=>l.scope);
   assert.equal(scopes.includes('year'),type!=='year');
   assert.equal(scopes.includes('month'),type==='day');
   assert.ok(!scopes.includes('day'));
  }
 }
});

test('합과 충이 함께 있으면 한쪽으로 길흉을 덮어쓰지 않고 복합 문장으로 표현',()=>{
 const model=analyzeBirth(birth);
 const synthetic={...model,common:{year:{stem:1,branch:1},month:{stem:2,branch:6},day:{stem:0,branch:2},hour:null}};
 const row={target:{stem:0,branch:0},chart:{},active:null};
 const context=readingContext(synthetic,row,'year');
 const base=lookup(model,'2026-09-09').segments[0].content;
 const composed=composeReading(base,context);
 assert.ok(composed.rules.some(r=>r.id==='RELATION-overview-mixed'));
 assert.ok(composed.rules.find(r=>r.id==='RELATION-overview-mixed').basis.some(r=>r.type==='충'));
 assert.ok(composed.rules.find(r=>r.id==='RELATION-overview-mixed').basis.some(r=>r.type==='육합'));
 assert.ok(composed.content.paragraphs.some(p=>p.includes('함께 나타납니다')));
});

test('대운 변경에서 본문·근거 구간을 분리하고 날짜와 문장별 근거를 보존',()=>{
 const model=analyzeBirth(birth),r=queryPeriod(model,{type:'year',year:2026});
 const cut=(r.start+r.end)/2,chart=chartAt(cut),target=chart.year;
 const common={target,chart,evidence:{god:'비견'},relations:[]};
 // Use actual primary evidence; synthetic schedule isolates the mid-period transition.
 const source=r.rows[0].evidence;
 const rows=[{...common,start:r.start,end:cut,evidence:source,active:{pillar:{stem:0,branch:0}}},{...common,start:cut,end:r.end,evidence:source,active:{pillar:{stem:2,branch:2}}}];
 const reading=plainReading(model,{...r,rows});
 assert.equal(reading.segments.length,2);
 assert.equal(reading.segments[0].end,reading.segments[1].start);
 assert.notDeepEqual(reading.segments[0].context.layers,reading.segments[1].context.layers);
 for(const s of lookup(model,'2026-09-09').segments){
  assert.equal(s.evidencePeriod.start,s.start);assert.equal(s.evidencePeriod.end,s.end);
  assert.deepEqual(s.evidencePeriod.sourceRows,s.sourceRows);
  for(const key of ['overview','money','work','relationships','love']){
   const paragraphs=key==='overview'?s.content.paragraphs:s.content[key].paragraphs;
   assert.deepEqual(s.paragraphEvidence[key].map(p=>p.text),paragraphs);
   for(const p of s.paragraphEvidence[key])for(const rule of p.rules)assert.ok(rule.ruleId==='TG-1'||s.rules.some(r=>r.id===rule.ruleId));
  }
 }
});
