import KoreanLunarCalendar from './vendor/korean-lunar-calendar.js';
import { TERMS } from './terms.js';

export const VERSION = Object.freeze({engine:'0.1.1',rules:'KR-REVIEW-1',lunar:'korean-lunar-calendar 0.4.0',terms:'Astronomy Engine 2.1.19',timezone:'Asia/Seoul, tzdb 2025b subset 1970–2050',interpretation:'BASIC-RELATION-1 / 전문가 미검수'});
export const DAY=86400000, MINUTE=60000, YEAR=365.2425*DAY;
export const STEMS=['갑','을','병','정','무','기','경','신','임','계'];
export const STEM_HAN=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES=['자','축','인','묘','진','사','오','미','신','유','술','해'];
export const BRANCH_HAN=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
export const ELEMENTS=['목','화','토','금','수'];
export const HIDDEN=[[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,4,6],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]];
export const CITIES=[{id:'seoul',name:'서울',lon:126.978},{id:'busan',name:'부산',lon:129.0756},{id:'daegu',name:'대구',lon:128.6014},{id:'incheon',name:'인천',lon:126.7052},{id:'gwangju',name:'광주',lon:126.8526},{id:'daejeon',name:'대전',lon:127.3845},{id:'ulsan',name:'울산',lon:129.3114},{id:'sejong',name:'세종',lon:127.289},{id:'suwon',name:'수원',lon:127.0286},{id:'chuncheon',name:'춘천',lon:127.7298},{id:'cheongju',name:'청주',lon:127.489},{id:'jeonju',name:'전주',lon:127.148},{id:'jeju',name:'제주',lon:126.5312},{id:'custom',name:'직접 경도 입력',lon:127}];
export const DEFAULT_RULES={dayBoundary:'midnight',solarTime:'standard',longitude:126.978};
export const TERM_GUARD=30*MINUTE; // Conservative review window, not a measured error bound.
export const mod=(n,m)=>((n%m)+m)%m;
export const pad=n=>String(n).padStart(2,'0');
export const dateText=d=>`${d.year}-${pad(d.month)}-${pad(d.day)}`;
const termList=TERMS.map(t=>({...t,ms:Date.parse(t.at)}));
const jieList=termList.filter(t=>t.jie);
export function termsForYear(year){return termList.filter(t=>t.year===Number(year));}
export function parseDate(text){
 text=String(text??'').trim();
 if(/^\d{8}$/.test(text))text=text.replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
 else if(/^\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}$/.test(text)){
  const parts=text.split(/[.\/-]/);text=`${parts[0]}-${pad(Number(parts[1]))}-${pad(Number(parts[2]))}`;
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))throw Error('생년월일을 입력해 주세요. 예: 19900512 또는 1990-05-12');
 const [year,month,day]=text.split('-').map(Number);
 if(year<1970||year>2050)throw Error('현재 검토 버전은 1970–2050년을 지원합니다.');
 return {year,month,day};
}
export function parseTime(text){
 if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text??''))throw Error('출생시간을 00:00–23:59로 입력해 주세요.');
 const [h,m]=text.split(':').map(Number);return h*60+m;
}
export function normalizeBirth(input){
 const d=parseDate(input.date), c=new KoreanLunarCalendar();
 if(input.calendar==='lunar'){
  if(!['regular','leap'].includes(input.leap))throw Error('음력 생일의 평달·윤달 여부를 먼저 확인해 주세요.');
  if(!c.setLunarDate(d.year,d.month,d.day,input.leap==='leap'))throw Error('존재하지 않는 음력 날짜 또는 윤달입니다. 2050년 음력은 11월 18일까지 지원합니다.');
 }else if(input.calendar==='solar'){
  if(!c.setSolarDate(d.year,d.month,d.day))throw Error('존재하지 않는 양력 날짜입니다.');
 }else throw Error('양력 또는 음력을 선택해 주세요.');
 const solar=c.getSolarCalendar();parseDate(dateText(solar));
 return {solar,lunar:c.getLunarCalendar()};
}

// Frozen Korea transitions from IANA tzdb 2025b. No OS/browser timezone dependency.
const dst=[['1987-05-09T17:00:00Z','1987-10-10T17:00:00Z'],['1988-05-07T17:00:00Z','1988-10-08T17:00:00Z']].map(pair=>pair.map(Date.parse));
export function offsetMinutes(ms){return dst.some(([a,b])=>ms>=a&&ms<b)?600:540;}
export function localParts(ms){
 const d=new Date(ms+offsetMinutes(ms)*MINUTE);
 return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};
}
export function formatLocal(ms,withTime=true){const p=localParts(ms);return dateText(p)+(withTime?` ${pad(p.hour)}:${pad(p.minute)}`:'');}
export function localInstants(d,minute){
 const wall=Date.UTC(d.year,d.month-1,d.day)+minute*MINUTE;
 return [540,600].map(o=>wall-o*MINUTE).filter(ms=>ms+offsetMinutes(ms)*MINUTE===wall).sort((a,b)=>a-b);
}
function precedingJie(ms){
 let lo=0,hi=jieList.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(jieList[mid].ms<=ms)lo=mid+1;else hi=mid;}
 if(!lo||lo>=jieList.length)throw Error('절기 데이터 범위를 벗어났습니다.');
 return {previous:jieList[lo-1],next:jieList[lo]};
}
export function pillar(stem,branch){return {stem:mod(stem,10),branch:mod(branch,12),name:STEMS[mod(stem,10)]+BRANCHES[mod(branch,12)],han:STEM_HAN[mod(stem,10)]+BRANCH_HAN[mod(branch,12)]};}
export function cyclePillar(n){return pillar(n,n);}
export function cycleIndex(p){for(let n=0;n<60;n++)if(n%10===p.stem&&n%12===p.branch)return n;throw Error('유효하지 않은 간지 조합입니다.');}
export function validateRules(raw={}){
 const r={...DEFAULT_RULES,...raw};
 if(!['midnight','zi23'].includes(r.dayBoundary))throw Error('지원하지 않는 일주 경계 기준입니다.');
 if(!['standard','mean'].includes(r.solarTime))throw Error('진태양시 등 미검증 시간 보정은 현재 지원하지 않습니다.');
 r.longitude=Number(r.longitude);
 if(!Number.isFinite(r.longitude)||r.longitude<124||r.longitude>132)throw Error('국내 경도 범위(동경 124–132°)를 입력해 주세요.');
 return r;
}
export function chartAt(ms,rawRules={}){
 const rules=validateRules(rawRules),{previous,next}=precedingJie(ms);
 const y=new Date(ms+9*3600000).getUTCFullYear();
 const lichun=termList.find(t=>t.year===y&&t.name==='입춘');
 const sajuYear=ms<lichun.ms?y-1:y;
 const yp=cyclePillar(sajuYear-4);
 const monthIndex=mod(Math.round((previous.longitude-315)/30),12);
 const mp=pillar((yp.stem%5)*2+2+monthIndex,2+monthIndex);
 // DST is undone before day/hour calculation. Mean solar time uses longitude only.
 const shift=rules.solarTime==='mean'?rules.longitude*4:540;
 const corrected=new Date(ms+shift*MINUTE);
 let dayNumber=Math.floor(corrected.getTime()/DAY);
 const minute=corrected.getUTCHours()*60+corrected.getUTCMinutes()+corrected.getUTCSeconds()/60;
 if(rules.dayBoundary==='zi23'&&minute>=1380)dayNumber++;
 // 2000-01-07 Gregorian = 甲子 day. Also checked against KLC day-cycle table.
 const dp=cyclePillar(dayNumber-Math.floor(Date.UTC(2000,0,7)/DAY));
 const hourBranch=Math.floor((minute+60)/120)%12;
 const hp=pillar((dp.stem%5)*2+hourBranch,hourBranch);
 return {year:yp,month:mp,day:dp,hour:hp,sajuYear,previousTerm:previous,nextTerm:next,corrected:corrected.toISOString().slice(0,16).replace('T',' '),offset:offsetMinutes(ms),correctionMinutes:shift-offsetMinutes(ms),ms};
}
export function tenGod(dayStem,targetStem){
 const from=Math.floor(dayStem/2),to=Math.floor(targetStem/2),same=dayStem%2===targetStem%2;
 const diff=mod(to-from,5);
 return [['비견','겁재'],['식신','상관'],['편재','정재'],['편관','정관'],['편인','정인']][diff][same?0:1];
}
export function branchRelations(a,b){
 const hits=[];
 if(mod(a-b,12)===6)hits.push({type:'충',id:'REL-CHUNG-1',text:'두 지지가 충 관계입니다. 이 관계만으로 사건의 발생이나 길흉을 확정하지 않습니다.'});
 if([[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]].some(([x,y])=>(a===x&&b===y)||(a===y&&b===x)))hits.push({type:'육합',id:'REL-HAP-1',text:'두 지지가 육합 관계입니다. 합화 성립이나 유리함을 자동 판정하지 않습니다.'});
 if(a===b)hits.push({type:'같은 지지',id:'REL-REPEAT-1',text:'같은 지지가 반복됩니다. 반복 여부만 표시하며 길흉 점수로 환산하지 않습니다.'});
 return hits;
}
export function analyzeBirth(input,rawRules={}){
 const rules=validateRules(rawRules),normalized=normalizeBirth(input),d=normalized.solar;
 if(!['exact','range','unknown'].includes(input.timeMode))throw Error('출생시간의 확실성을 선택해 주세요.');
 if(!['male','female','unspecified'].includes(input.sex))throw Error('대운 계산용 성별을 선택해 주세요.');
 const start=input.timeMode==='unknown'?0:parseTime(input.timeMode==='range'?input.timeStart:input.time);
 const end=input.timeMode==='unknown'?1439:input.timeMode==='range'?parseTime(input.timeEnd):start;
 if(end<start)throw Error('시간 범위는 같은 날짜 안에서 시작보다 종료가 늦어야 합니다. 자정을 넘으면 날짜별로 비교해 주세요.');
 const samples=new Set();let gaps=0,fold=false;
 for(let minute=start;minute<=end;minute++){
  const inst=localInstants(d,minute);if(!inst.length)gaps++;if(inst.length>1)fold=true;
  inst.forEach(ms=>{samples.add(ms);samples.add(ms+59999);});
 }
 if(!samples.size)throw Error('당시 서머타임 시작으로 존재하지 않았던 현지 시각입니다. 출생기록을 확인해 주세요.');
 const sorted=[...samples].sort((a,b)=>a-b),min=sorted[0],max=sorted.at(-1);
 const near=jieList.filter(t=>t.ms>=min-TERM_GUARD&&t.ms<=max+TERM_GUARD);
 // Include both sides if a term falls inside an entered minute.
 near.filter(t=>t.ms>=min&&t.ms<=max).forEach(t=>{samples.add(t.ms-1);samples.add(t.ms);});
 const groups=new Map();
 for(const ms of [...samples].sort((a,b)=>a-b)){
  const chart=chartAt(ms,rules),key=['year','month','day','hour'].map(k=>chart[k].name).join('/');
  if(!groups.has(key))groups.set(key,{chart,first:ms,last:ms});else groups.get(key).last=ms;
 }
 const candidates=[...groups.values()];
 const common={};
 for(const key of ['year','month','day','hour']){
  common[key]=candidates.every(v=>v.chart[key].name===candidates[0].chart[key].name)?candidates[0].chart[key]:null;
 }
 if(input.timeMode==='unknown')common.hour=null;
 const warnings=[];
 if(near.length){
  warnings.push('절입 계산 시각 전후 30분의 확인 구간과 겹칩니다. 공식 역서 대조 전 연주·월주와 대운을 확정하지 않습니다.');
  common.month=null;if(near.some(t=>t.name==='입춘'))common.year=null;
 }
 if(gaps)warnings.push('입력 범위에 서머타임으로 존재하지 않는 시각이 포함되어 해당 시각을 제외했습니다.');
 if(fold)warnings.push('서머타임 종료로 같은 시각이 두 번 존재합니다. 두 경우를 모두 비교했습니다.');
 if(input.timeMode==='range')warnings.push('입력 범위 내 분 단위와 각 분의 끝을 비교했습니다. 범위 밖의 출생 가능성은 반영하지 않습니다.');
 if(input.timeMode==='unknown')warnings.push('출생시간 미상: 시주와 대운 시작 시점을 확정하지 않습니다.');
 if(rules.solarTime==='mean')warnings.push('지방평균태양시 적용: 경도만 보정합니다. 진태양시가 아니며 도시 선택 경도는 중심부의 근삿값입니다.');
 if(input.sex==='unspecified')warnings.push('대운 계산용 성별 미지정: 순·역행과 대운을 표시하지 않습니다.');
 const exactInstant=input.timeMode==='exact'&&!fold&&near.length===0?localInstants(d,start)[0]:null;
 return {input:{...input},normalized,rules,candidates,common,warnings,nearTerms:near,min,max,exactInstant,versions:VERSION};
}
export function daewoonSchedule(model){
 if(model.exactInstant===null||model.input.sex==='unspecified')return null;
 const ms=model.exactInstant,chart=chartAt(ms,model.rules),yang=chart.year.stem%2===0;
 const forward=(model.input.sex==='male')===yang;
 const term=forward?chart.nextTerm:chart.previousTerm;
 const deltaDays=Math.abs(term.ms-ms)/DAY;
 const ageYears=deltaDays/3;
 const start=ms+ageYears*YEAR;
 const n=cycleIndex(chart.month);
 return {forward,term,deltaDays,ageYears,start,conversion:'3일=1년 / 1년=365.2425일 연속 환산(검토 기준)',periods:Array.from({length:10},(_,i)=>({index:i+1,pillar:cyclePillar(n+(forward?1:-1)*(i+1)),start:start+i*10*YEAR,end:start+(i+1)*10*YEAR,startAge:ageYears+i*10}))};
}
function validSolar(d){const c=new KoreanLunarCalendar();if(!c.setSolarDate(d.year,d.month,d.day))throw Error('조회 날짜가 올바르지 않습니다.');return d;}
export function periodBounds(selection){
 const type=selection.type;if(!['year','month','day'].includes(type))throw Error('조회 유형을 선택해 주세요.');
 const year=Number(selection.year),month=Number(selection.month??1);
 if(!Number.isInteger(year)||year<1970||year>2050)throw Error('조회 연도는 1970–2050년 사이여야 합니다.');
 if(!Number.isInteger(month)||month<1||month>12)throw Error('조회 월을 확인해 주세요.');
 let a,b,title;
 if(type==='year'){a=Date.UTC(year,0,1)-540*MINUTE;b=Date.UTC(year+1,0,1)-540*MINUTE;title=`${year}년 연간 운세`;}
 if(type==='month'){a=Date.UTC(year,month-1,1)-540*MINUTE;b=Date.UTC(year,month,1)-540*MINUTE;title=`${year}년 ${month}월 월간 운세`;}
 if(type==='day'){
  const d=validSolar(parseDate(selection.date));a=Date.UTC(d.year,d.month-1,d.day)-540*MINUTE;b=a+DAY;title=`${dateText(d)} 일간 운세`;
 }
 return {type,start:a,end:b,title};
}
const themes={
 '비견':{label:'자기 기준 · 동료',body:'일간과 같은 오행·음양의 천간입니다. 자기 기준과 동료 관계를 살펴보는 전통적 해석 항목입니다.',prompt:'함께할 일과 스스로 결정할 일을 구분해 보세요.'},
 '겁재':{label:'협업 · 자원 배분',body:'일간과 같은 오행이면서 음양이 다른 천간입니다. 경쟁·협업과 자원 배분을 살펴보는 해석 항목입니다.',prompt:'공동 업무의 역할과 비용 분담을 명확히 해 보세요.'},
 '식신':{label:'표현 · 꾸준한 실행',body:'일간이 생하는 오행이며 음양이 같습니다. 표현과 생산 활동을 살펴보는 해석 항목입니다.',prompt:'작게라도 꾸준히 완성할 수 있는 일을 정해 보세요.'},
 '상관':{label:'표현 · 방식의 점검',body:'일간이 생하는 오행이며 음양이 다릅니다. 표현 방식과 기존 규칙의 관계를 살펴보는 항목입니다.',prompt:'새로운 제안이 상대에게 어떻게 전달될지 점검해 보세요.'},
 '편재':{label:'외부 활동 · 자원',body:'일간이 극하는 오행이며 음양이 같습니다. 외부 활동과 자원 활용을 살펴보는 항목입니다.',prompt:'새로운 기회에 필요한 시간과 자원을 먼저 적어 보세요.'},
 '정재':{label:'관리 · 지속 가능성',body:'일간이 극하는 오행이며 음양이 다릅니다. 관리와 지속성을 살펴보는 항목입니다.',prompt:'반복되는 지출과 일정, 유지할 수 있는 계획을 점검해 보세요.'},
 '편관':{label:'과제 · 대응',body:'일간을 극하는 오행이며 음양이 같습니다. 과제와 대응 방식을 살펴보는 항목입니다.',prompt:'부담되는 일의 우선순위와 도움받을 부분을 나눠 보세요.'},
 '정관':{label:'책임 · 기준',body:'일간을 극하는 오행이며 음양이 다릅니다. 책임과 규칙을 살펴보는 항목입니다.',prompt:'맡은 역할과 지켜야 할 기준을 구체적으로 확인해 보세요.'},
 '편인':{label:'탐색 · 관점 전환',body:'일간을 생하는 오행이며 음양이 같습니다. 탐색과 관점 전환을 살펴보는 항목입니다.',prompt:'익숙한 문제를 다른 방식으로 이해해 보세요.'},
 '정인':{label:'학습 · 정리',body:'일간을 생하는 오행이며 음양이 다릅니다. 학습과 지원을 살펴보는 항목입니다.',prompt:'배운 것을 정리하고 필요한 조언을 구해 보세요.'}
};
export function interpretation(dayPillar,targetPillar){
 if(!dayPillar)return null;
 const god=tenGod(dayPillar.stem,targetPillar.stem);
 return {god,...themes[god],rule:'TG-1',basis:`일간 ${STEM_HAN[dayPillar.stem]}(${STEMS[dayPillar.stem]}) ↔ 조회 천간 ${STEM_HAN[targetPillar.stem]}(${STEMS[targetPillar.stem]})`,status:'전문가 검수 전 기본 관계 설명'};
}
export function queryPeriod(model,selection){
 const period=periodBounds(selection);
 if(period.end<=model.min)throw Error('출생 이전 기간은 운세 조회 대상에서 제외합니다.');
 const start=Math.max(period.start,model.min),end=period.end;
 const schedule=daewoonSchedule(model);
 const cuts=new Set([start,end]);
 const terms=jieList.filter(t=>t.ms>=start&&t.ms<end);
 terms.forEach(t=>cuts.add(t.ms));
 schedule?.periods.forEach(p=>{if(p.start>start&&p.start<end)cuts.add(p.start);});
 if(period.type==='day'){
  // Include a date rollover for the selected day/hour convention; lookup period stays KST.
  const shift=model.rules.solarTime==='mean'?model.rules.longitude*4:540;
  const boundary=model.rules.dayBoundary==='zi23'?1380:0;
  for(let day=Math.floor(start/DAY)-1;day<=Math.floor(end/DAY)+1;day++){
   const at=day*DAY+(boundary-shift)*MINUTE;if(at>start&&at<end)cuts.add(at);
  }
 }
 const points=[...cuts].sort((a,b)=>a-b);
 const rows=points.slice(0,-1).map((a,i)=>{
  const b=points[i+1],ms=(a+b)/2,c=chartAt(ms,model.rules),active=schedule?.periods.find(p=>ms>=p.start&&ms<p.end)??null;
  const target=period.type==='year'?c.year:period.type==='month'?c.month:c.day;
  const evidence=interpretation(model.common.day,target);
  const relations=model.common.day?branchRelations(model.common.day.branch,target.branch):[];
  return {start:a,end:b,chart:c,target,active,evidence,relations,daewoonEvidence:active?interpretation(model.common.day,active.pillar):null};
 });
 return {...period,start,end,trimmed:start!==period.start,rows,terms,schedule,lookupTimezone:'KST (UTC+09:00) 고정, 출생지 이동 미반영'};
}
export function visibleElements(common){
 const counts=[0,0,0,0,0];let total=0;
 for(const p of Object.values(common)){if(!p)continue;counts[Math.floor(p.stem/2)]++;counts[Math.floor(HIDDEN[p.branch][0]/2)]++;total+=2;}
 return {counts,total,method:'표면 천간 + 지지 본기 각 1개. 지장간 가중치·계절·신강약 미반영.'};
}
export function makeReport(model,result){return {schema:'saju-report/1',versions:VERSION,input:model.input,normalized:model.normalized,rules:model.rules,common:model.common,candidates:model.candidates,warnings:model.warnings,period:result,interpretationStatus:'전문가 미검수. 기초 십성·육합·충 관계 설명만 제공하며 용신·격국·길흉·사건 예측은 확정하지 않음',sources:['https://github.com/usingsky/korean_lunar_calendar_js','https://github.com/cosinekitty/astronomy','https://data.iana.org/time-zones/tzdb-2025b/asia']};}
