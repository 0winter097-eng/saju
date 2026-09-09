import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBirth,queryPeriod,DAY,MINUTE} from '../dist/engine.js';
import {plainReading} from '../dist/readings.js';
import {annualReading} from '../dist/annual.js';
const birth={date:'1990-05-12',calendar:'solar',leap:'regular',timeMode:'exact',time:'14:35',sex:'female',city:'daegu',source:'record'};

test('연간 12개월은 단독 월간 조회의 기간·간지·풀이·근거와 같음',()=>{
 const model=analyzeBirth(birth);
 for(const year of [2027,2028,2050]){
  const annual=annualReading(model,year);
  assert.deepEqual(annual.months.map(m=>m.month),Array.from({length:12},(_,i)=>i+1));
  for(const [i,m] of annual.months.entries()){
   const standalone=queryPeriod(model,{type:'month',year,month:i+1});
   assert.deepEqual(m.period,standalone);assert.deepEqual(m.reading,plainReading(model,standalone));
   assert.equal(m.start,standalone.start);assert.equal(m.end,standalone.end);
   if(i)assert.equal(annual.months[i-1].end,m.start);
  }
  assert.equal(annual.months[1].end-annual.months[1].start,(year===2028?29:28)*DAY);
  assert.equal(annual.months.at(-1).end,Date.UTC(year+1,0,1)-540*MINUTE);
  assert.ok(new Set(annual.months.flatMap(m=>m.reading.segments.map(s=>s.god))).size>2);
 }
});

test('출생 연도는 출생 전 월도 자리를 유지하되 풀이를 만들지 않음',()=>{
 const model=analyzeBirth(birth),annual=annualReading(model,1990);
 assert.equal(annual.months.length,12);
 for(const m of annual.months.slice(0,4)){assert.equal(m.status,'before-birth');assert.equal(m.period,null);assert.equal(m.reading,null);}
 assert.equal(annual.months[4].period.start,model.min);assert.equal(annual.months[4].period.trimmed,true);
 assert.throws(()=>annualReading(model,1989),/출생 이전/);
 assert.throws(()=>annualReading(model,2051),/1970/);
});

test('월별 보기는 출생시간이 미확정이면 모든 달에서 개인별 풀이를 보류',()=>{
 const model=analyzeBirth({...birth,timeMode:'unknown'},{dayBoundary:'zi23'});
 assert.equal(model.common.day,null);
 const annual=annualReading(model,2027);
 assert.equal(annual.months.length,12);
 for(const m of annual.months){
  assert.equal(m.status,'ready');assert.ok(m.reading.segments.every(s=>s.content===null));
  assert.equal(m.period.schedule,null);
 }
});
