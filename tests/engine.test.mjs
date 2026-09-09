import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import KoreanLunarCalendar from '../dist/vendor/korean-lunar-calendar.js';
import {TERMS} from '../dist/terms.js';
import {DAY,MINUTE,STEMS,BRANCHES,analyzeBirth,normalizeBirth,chartAt,termsForYear,localInstants,offsetMinutes,tenGod,queryPeriod,daewoonSchedule,branchRelations,visibleElements,makeReport} from '../dist/engine.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url),'utf8'));
const birth={date:'1990-05-12',calendar:'solar',leap:'regular',timeMode:'exact',time:'14:35',sex:'female',city:'daegu',source:'record'};
const model=()=>analyzeBirth(birth);
const at=s=>Date.parse(s);

test('생년월일 숫자 8자리·점·슬래시 입력을 같은 날짜로 변환',()=>{
 const expected=normalizeBirth(birth);
 for(const date of ['19900512','1990.5.12','1990/05/12',' 1990-05-12 '])assert.deepEqual(normalizeBirth({...birth,date}),expected);
 assert.throws(()=>normalizeBirth({...birth,date:'900512'}));
});

test('KASI 공개 월별표: 선택한 4개 음양력 날짜',()=>{
 for(const f of fixtures.lunarOfficial.cases){const n=normalizeBirth({...birth,date:f.solar});assert.equal([n.lunar.year,String(n.lunar.month).padStart(2,'0'),String(n.lunar.day).padStart(2,'0')].join('-'),f.lunar);}
});
test('제작자 예제: 2017년 윤5월과 일진',()=>{
 const a=normalizeBirth({...birth,date:'2017-05-01',calendar:'lunar',leap:'leap'});assert.deepEqual(a.solar,{year:2017,month:6,day:24});assert.equal(chartAt(at('2017-06-24T03:00:00Z')).day.name,'임오');
});
test('지원 기간 전체 양력↔음력 왕복 및 일진 교차 대조',()=>{
 const c=new KoreanLunarCalendar(),back=new KoreanLunarCalendar();let count=0;
 for(let ms=at('1970-01-01T03:00:00Z');ms<at('2051-01-01T03:00:00Z');ms+=DAY){
  const d=new Date(ms);assert.ok(c.setSolarDate(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()));const l=c.getLunarCalendar();
  assert.ok(back.setLunarDate(l.year,l.month,l.day,l.intercalation));assert.deepEqual(back.getSolarCalendar(),c.getSolarCalendar());
  assert.equal(chartAt(ms).day.name+'일',c.getKoreanGapja().day);count++;
 }
 assert.equal(count,29585);
});
test('유효하지 않은 윤달과 음력 날짜 거절',()=>{
 assert.throws(()=>normalizeBirth({...birth,date:'2017-03-01',calendar:'lunar',leap:'leap'}));
 assert.throws(()=>normalizeBirth({...birth,date:'2017-05-40',calendar:'lunar'}));
 assert.throws(()=>normalizeBirth({...birth,calendar:'lunar',leap:'unknown'}));
});
test('음력 2월 30일은 양력 입력 검증과 독립적으로 처리',()=>{
 const c=new KoreanLunarCalendar();let found=false;
 for(let y=1970;y<2050;y++)if(c.setLunarDate(y,2,30,false)){assert.doesNotThrow(()=>normalizeBirth({...birth,date:`${y}-02-30`,calendar:'lunar'}));found=true;break;}
 assert.ok(found);
});
test('윤년·잘못된 양력 날짜·지원 범위 제한',()=>{
 assert.doesNotThrow(()=>normalizeBirth({...birth,date:'2000-02-29'}));
 for(const date of ['2001-02-29','1990-04-31','1969-12-31','2051-01-01','2026-13-01'])assert.throws(()=>normalizeBirth({...birth,date}));
});
test('USNO 2026 춘분·하지·추분·동지와 2분 이내 대조',()=>{
 for(const f of fixtures.seasonsOfficial.cases){const term=termsForYear(2026).find(t=>t.name===f.name);assert.ok(Math.abs(term.ms-at(f.utc))<=120000,`${f.name} difference ${term.ms-at(f.utc)}`);}
});
test('절기 83년 × 24개, 순서·간격·12절 구분',()=>{
 assert.equal(TERMS.length,83*24);for(let year=1969;year<=2051;year++){const ts=termsForYear(year);assert.equal(ts.length,24);assert.equal(ts.filter(t=>t.jie).length,12);}
 for(let i=1;i<TERMS.length;i++){const days=(at(TERMS[i].at)-at(TERMS[i-1].at))/DAY;assert.ok(days>14&&days<17);}
});
test('입춘 직전·직후 연주와 월주 경계',()=>{
 const t=termsForYear(2027).find(t=>t.name==='입춘').ms;
 assert.equal(chartAt(t-1).year.name,'병오');assert.equal(chartAt(t).year.name,'정미');
 assert.equal(chartAt(t-1).month.branch,1);assert.equal(chartAt(t).month.name,'임인');
});
test('입춘 외의 12절은 월주만 순차 변경',()=>{
 for(const t of termsForYear(2027).filter(t=>t.jie&&t.name!=='입춘')){
  const a=chartAt(t.ms-1),b=chartAt(t.ms);assert.equal(a.year.name,b.year.name);assert.equal((a.month.branch+1)%12,b.month.branch);assert.equal((a.month.stem+1)%10,b.month.stem);
 }
});
test('중기는 월주를 바꾸지 않음',()=>{
 for(const t of termsForYear(2027).filter(t=>!t.jie))assert.equal(chartAt(t.ms-1).month.name,chartAt(t.ms).month.name);
});
test('날짜 기준점 2000-01-07 갑자와 시간 간지',()=>{
 const c=chartAt(at('2000-01-06T15:00:00Z'));assert.equal(c.day.name,'갑자');assert.equal(c.hour.name,'갑자');assert.equal(chartAt(at('2000-01-06T16:00:00Z')).hour.name,'을축');
});
test('23:00 기준과 00:00 기준의 명시적 차이',()=>{
 const ms=at('2000-01-07T14:00:00Z');assert.equal(chartAt(ms).day.name,'갑자');assert.equal(chartAt(ms,{dayBoundary:'zi23'}).day.name,'을축');assert.equal(chartAt(ms,{dayBoundary:'zi23'}).hour.name,'병자');
});
test('1987 서머타임: 존재하지 않는 시각 거절',()=>{
 assert.equal(localInstants({year:1987,month:5,day:10},150).length,0);
 assert.throws(()=>analyzeBirth({...birth,date:'1987-05-10',time:'02:30'}),/존재하지/);
});
test('1988 서머타임 종료: 중복 시각과 명식 후보',()=>{
 const instants=localInstants({year:1988,month:10,day:9},150);assert.equal(instants.length,2);assert.equal(instants[1]-instants[0],3600000);
 const m=analyzeBirth({...birth,date:'1988-10-09',time:'02:30'});assert.ok(m.warnings.some(w=>w.includes('두 번')));assert.equal(m.exactInstant,null);assert.equal(daewoonSchedule(m),null);
});
test('서머타임 당시 시각을 표준시로 환산',()=>{
 const ms=localInstants({year:1988,month:6,day:1},840)[0];const c=chartAt(ms);assert.equal(offsetMinutes(ms),600);assert.equal(c.correctionMinutes,-60);assert.ok(c.corrected.endsWith('13:00'));
});
test('지방평균태양시 경도 보정과 시간 변경',()=>{
 const ms=at('2000-01-07T04:10:00Z');const a=chartAt(ms),b=chartAt(ms,{solarTime:'mean',longitude:127});assert.equal(b.correctionMinutes,-32);assert.notEqual(a.hour.name,b.hour.name);
});
test('범위 입력에서 시주 변화 추출',()=>{
 const m=analyzeBirth({...birth,timeMode:'range',timeStart:'12:50',timeEnd:'13:10'});assert.equal(m.candidates.length,2);assert.equal(m.common.hour,null);assert.ok(m.common.day);assert.equal(daewoonSchedule(m),null);
});
test('시간 미상은 시주를 미확정, 23시 규칙이면 일주도 비교',()=>{
 const m=analyzeBirth({...birth,timeMode:'unknown'},{dayBoundary:'zi23'});assert.equal(m.common.hour,null);assert.equal(m.common.day,null);assert.equal(daewoonSchedule(m),null);assert.ok(m.candidates.length>=13);
});
test('절입 확인 구간은 확정 억제',()=>{
 const t=termsForYear(2027).find(t=>t.name==='입춘').ms;const d=new Date(t+540*MINUTE);
 const m=analyzeBirth({...birth,date:d.toISOString().slice(0,10),time:d.toISOString().slice(11,16)});assert.equal(m.common.year,null);assert.equal(m.common.month,null);assert.equal(daewoonSchedule(m),null);
});
test('범위 순서·입력 형식·지원하지 않는 보정 거절',()=>{
 assert.throws(()=>analyzeBirth({...birth,timeMode:'range',timeStart:'23:00',timeEnd:'01:00'}));assert.throws(()=>analyzeBirth({...birth,time:'24:00'}));assert.throws(()=>analyzeBirth(birth,{solarTime:'true'}));assert.throws(()=>analyzeBirth(birth,{longitude:0}));
});
test('십성 10개와 음양 관계',()=>{
 assert.deepEqual(Array.from({length:10},(_,s)=>tenGod(0,s)),['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인']);assert.equal(tenGod(1,0),'겁재');assert.equal(tenGod(1,6),'정관');
});
test('육합·충은 대칭이고 합화·길흉을 자동 판정하지 않음',()=>{
 assert.equal(branchRelations(0,6)[0].type,'충');assert.equal(branchRelations(0,1)[0].type,'육합');for(let a=0;a<12;a++)for(let b=0;b<12;b++)assert.deepEqual(branchRelations(a,b),branchRelations(b,a));
});
test('성별 미지정이면 대운 제외',()=>{assert.equal(daewoonSchedule(analyzeBirth({...birth,sex:'unspecified'})),null);});
test('대운 순·역행과 연속 환산 경계',()=>{
 const a=daewoonSchedule(model()),b=daewoonSchedule(analyzeBirth({...birth,sex:'male'}));assert.equal(a.forward,false);assert.equal(b.forward,true);assert.equal(a.periods[0].pillar.name,'경진');assert.equal(b.periods[0].pillar.name,'임오');assert.ok(a.ageYears>=0&&a.ageYears<11);
});
test('연간 조회는 입춘 전후를 구분하고 빈틈 없이 연결',()=>{
 const r=queryPeriod(model(),{type:'year',year:2027});assert.equal(r.rows[0].chart.year.name,'병오');assert.equal(r.rows.at(-1).chart.year.name,'정미');assert.equal(r.rows[0].start,r.start);assert.equal(r.rows.at(-1).end,r.end);for(let i=1;i<r.rows.length;i++)assert.equal(r.rows[i-1].end,r.rows[i].start);
});
test('연간·월간·일간 조회의 동일 순간 간지 일치',()=>{
 const m=model(),instant=at('2027-03-15T03:00:00Z');const selections=[{type:'year',year:2027},{type:'month',year:2027,month:3},{type:'day',year:2027,date:'2027-03-15'}];
 const cs=selections.map(s=>queryPeriod(m,s).rows.find(r=>r.start<=instant&&r.end>instant).chart);for(const c of cs.slice(1)){assert.deepEqual(c.year,cs[0].year);assert.deepEqual(c.month,cs[0].month);}
});
test('대운 변경이 있는 연도의 구간을 분리',()=>{
 const m=model(),s=daewoonSchedule(m),edge=s.periods[3].start,year=new Date(edge+540*MINUTE).getUTCFullYear();const r=queryPeriod(m,{type:'year',year});assert.ok(r.rows.some(row=>row.start===edge));
});
test('일간 조회: 자시·태양시 날짜 경계를 누락하지 않음',()=>{
 const m=analyzeBirth(birth,{dayBoundary:'zi23'});const r=queryPeriod(m,{type:'day',year:2027,date:'2027-03-15'});assert.equal(r.rows.length,2);assert.notEqual(r.rows[0].target.name,r.rows[1].target.name);
 const m2=analyzeBirth(birth,{solarTime:'mean',longitude:127});assert.equal(queryPeriod(m2,{type:'day',year:2027,date:'2027-03-15'}).rows.length,2);
});
test('미확정 일간은 개인별 십성 해석 보류',()=>{
 const m=analyzeBirth({...birth,timeMode:'unknown'},{dayBoundary:'zi23'});assert.ok(queryPeriod(m,{type:'year',year:2027}).rows.every(row=>row.evidence===null));
});
test('오행 개수는 확정 기둥만 반영',()=>{const m=model();assert.equal(visibleElements(m.common).total,8);m.common.hour=null;assert.equal(visibleElements(m.common).total,6);});
test('출생 전 조회·잘못된 조회 날짜 거절',()=>{
 assert.throws(()=>queryPeriod(model(),{type:'year',year:1980}));assert.throws(()=>queryPeriod(model(),{type:'day',year:2027,date:'2027-02-30'}));assert.throws(()=>queryPeriod(model(),{type:'year',year:2051}));
});
test('같은 입력의 계산과 설명은 재현 가능',()=>{
 const a=model(),b=model();assert.deepEqual(a,b);assert.deepEqual(makeReport(a,queryPeriod(a,{type:'year',year:2027})),makeReport(b,queryPeriod(b,{type:'year',year:2027})));
});
