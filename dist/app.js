import {resolveBirthTime,timeSelectionMode} from './time-input.js?v=0.2.1';
import {annualReading} from './annual.js?v=0.2.1';
import {plainReading,READING_CATEGORIES} from './readings.js?v=0.2.1';
import { VERSION, STEMS,STEM_HAN,BRANCHES,BRANCH_HAN,HIDDEN,ELEMENTS,CITIES,MINUTE,DAY,analyzeBirth,queryPeriod,visibleElements,tenGod,formatLocal,dateText,makeReport,periodBounds } from './engine.js?v=0.2.1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const form=$('#birth-form');let model=null,result=null,periodType='year',example=false,dirty=false;
let readingCategory='all';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceLabels={record:'출생기록',memory:'가족의 기억',unknown:'확인 불가'};
function updateFields(){
 $('#leap-field').hidden=new FormData(form).get('calendar')!=='lunar';
 const mode=timeSelectionMode($('#birth-time-choice').value);$('#time-mode').value=mode;$('#exact-time').hidden=mode!=='exact';$('#range-time').hidden=mode!=='range';
 $('#time-source').disabled=mode==='unknown';$('#longitude-field').hidden=$('#city').value!=='custom';
}
function markDirty(){example=false;if(model){dirty=true;$('#status').textContent='입력정보가 변경되었습니다. 내 사주 결과 보기를 눌러 다시 확인해 주세요.';$('#results').hidden=true;$('#empty').hidden=false;}}
form.addEventListener('input',()=>{updateFields();markDirty();});form.addEventListener('change',()=>{updateFields();markDirty();});
function selection(){return {type:periodType,year:Number($('#query-year').value),month:Number($('#query-month').value),date:$('#query-date').value};}
function readInput(){
 const data=resolveBirthTime(Object.fromEntries(new FormData(form)));
 const city=CITIES.find(c=>c.id===data.city);if(!city)throw Error('출생지역을 선택해 주세요.');
 if(data.timeMode==='unknown')data.source='unknown';
 return {data,rules:{dayBoundary:data.dayBoundary,solarTime:data.solarTime,longitude:city.id==='custom'?Number(data.longitude):city.lon}};
}
function reveal(element){
 element.focus({preventScroll:true});
 if(typeof element.scrollIntoView==='function')element.scrollIntoView({behavior:'auto',block:'start'});
}
function showError(error){
 const message=error.message??String(error);
 $('#form-error').textContent=message;$('#form-error').hidden=false;
 $('#status').textContent='결과를 표시할 수 없습니다: '+message;
 $('#results').hidden=true;$('#empty').hidden=false;
 reveal($('#form-error'));
}
async function calculate(){
 $('#form-error').hidden=true;$('#status').textContent='날짜와 시간, 절입 경계를 계산하고 있습니다…';
 const buttons=[$('#show-results'),$('#query'),$('#load-example')];buttons.forEach(b=>b.disabled=true);
 $('#show-results .button-label').textContent='결과를 준비하고 있어요…';
 $('#results').setAttribute('aria-busy','true');
 try{
  await new Promise(resolve=>setTimeout(resolve,0));
  const {data,rules}=readInput();const next=analyzeBirth(data,rules),p=queryPeriod(next,selection());
  model=next;result=p;dirty=false;$('#birth-date').value=dateText(next.normalized[data.calendar==='lunar'?'lunar':'solar']);
  activateTab($('#tab-reading'));render();reveal($('#results'));
 }
 catch(error){showError(error);}finally{buttons.forEach(b=>b.disabled=false);$('#show-results .button-label').textContent='내 사주 결과 보기';$('#results').setAttribute('aria-busy','false');}
}
form.addEventListener('submit',event=>{event.preventDefault();calculate();});$('#show-results').addEventListener('click',calculate);$('#query').addEventListener('click',calculate);
$$('[data-period]').forEach(button=>button.addEventListener('click',()=>{
 periodType=button.dataset.period;$$('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('#year-control').hidden=periodType==='day';$('#month-control').hidden=periodType!=='month';$('#day-control').hidden=periodType!=='day';
 if(model&&!dirty)refreshPeriod();
}));
function refreshPeriod(){try{const next=queryPeriod(model,selection());result=next;$('#form-error').hidden=true;activateTab($('#tab-reading'));render();}catch(error){showError(error);}}
['#query-year','#query-month','#query-date'].forEach(id=>$(id).addEventListener('change',()=>{if(model&&!dirty)refreshPeriod();}));
$('#load-example').addEventListener('click',()=>{
 form.reset();$('#birth-time-choice').value='exact';$('#birth-date').value='1990-05-12';$('#birth-time').value='14:35';$('#sex').value='female';$('#city').value='daegu';example=true;updateFields();calculate();
});
$('#reset').addEventListener('click',()=>{form.reset();readingCategory='all';$('#birth-date').value='';$('#birth-time').value='';model=null;result=null;dirty=false;example=false;$('#results').innerHTML='';$('#results').hidden=true;$('#empty').hidden=false;$('#status').textContent='입력정보와 계산 결과를 지웠습니다.';$('#form-error').hidden=true;updateFields();});
function activateTab(button){$$('[data-tab]').forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('#'+b.dataset.tab).hidden=!active;});}
$$('[data-tab]').forEach(button=>{button.addEventListener('click',()=>activateTab(button));button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=$$('[data-tab]'),index=tabs.indexOf(button);const n=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activateTab(tabs[n]);tabs[n].focus();});});
function pillarCard(key,label){
 const p=model.common[key],day=model.common.day;
 if(!p)return `<article class="pillar ${key==='day'?'day':''}"><div class="pillar-label">${label}</div><span class="han muted">?</span><span class="han muted">?</span><div class="ko">미확정</div><div class="sub">입력 범위·경계 확인</div></article>`;
 return `<article class="pillar ${key==='day'?'day':''}"><div class="pillar-label">${label}${key==='day'?' · 나':''}</div><span class="han element-${Math.floor(p.stem/2)}">${STEM_HAN[p.stem]}</span><span class="han element-${Math.floor(HIDDEN[p.branch][0]/2)}">${BRANCH_HAN[p.branch]}</span><div class="ko">${p.name}</div><div class="sub">${key==='day'?'일간':day?tenGod(day.stem,p.stem):'십성 미확정'}<br>지장간 ${HIDDEN[p.branch].map(s=>STEM_HAN[s]).join(' · ')}</div></article>`;
}
const simpleDate=(ms)=>{const d=new Date(ms+540*MINUTE);return d.toISOString().slice(0,16).replace('T',' ');};
function renderPlain(reading,{prefix='plain',showScope=true}={}){
 const segments=reading.segments.filter(s=>s.content);
 const range=s=>`${simpleDate(s.start)} ~ ${simpleDate(s.end)} 전`;
 const periodLabel=reading.title.replace(/\s*(연간|월간|일간)?\s*(운세|조회).*$/,'').trim();
 const paragraphs=items=>items.flatMap(text=>{
  const sentences=text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)??[text];
  const chunks=[];for(let i=0;i<sentences.length;i+=2)chunks.push(sentences.slice(i,i+2).join('').trim());
  return chunks.map(chunk=>`<p>${esc(chunk)}</p>`);
 }).join('');
 const bodyFor=key=>segments.length?segments.map(s=>{
  const entry=key==='overview'?s.content:s.content[key];
  const lead=key==='overview'?entry.title:entry.headline;
  const body=key==='overview'?entry.paragraphs.slice(0,-1):[...(entry.action?[entry.action]:[entry.single,entry.coupled]),...entry.paragraphs.slice(1)];
  return `<div class="narrative-part">${segments.length>1?`<p class="period-label">${esc(range(s))}</p>`:''}<p class="narrative-lead">${esc(lead)}</p><div class="narrative-copy">${paragraphs(body)}</div><aside class="reading-takeaway" aria-label="기억해 두세요"><span>기억해 두세요</span><p>${esc(entry.caution)}</p></aside></div>`;
 }).join(''):'<p>출생시간에 따라 풀이의 기준이 달라져 결과를 보류했습니다. 출생정보를 확인한 뒤 다시 조회해 주세요.</p>';
 const sections=[{key:'overview',label:'총론'},...READING_CATEGORIES];
 const articles=sections.map(({key,label})=>`<section class="narrative-section" id="${prefix}-section-${key}" aria-labelledby="${prefix}-heading-${key}" data-reading-panel="${key}" ${readingCategory==='all'||readingCategory===key?'':'hidden'}><h3 id="${prefix}-heading-${key}">${esc(periodLabel)} ${label}</h3>${bodyFor(key)}</section>`).join('');
 const filters=[{key:'all',label:'전체 보기'},...sections].map(({key,label})=>`<button type="button" aria-pressed="${key===readingCategory}" data-reading-category="${key}">${label}</button>`).join('');
 return `<section id="${prefix}-reading" class="narrative-reading" data-reading-group aria-label="총론과 분야별 운세"><div class="fortune-filters" role="group" aria-label="풀이 분야 선택">${filters}</div><div class="narrative-paper">${articles}</div>${showScope?`<p class="reading-scope">${esc(reading.scope)}<br><span>${esc(reading.status)}</span></p>`:''}</section>`;
}
function renderAppliedRules(reading){
 const names={'NATAL':'출생 구성','LAYER':'조회 연·월·대운','TARGET':'조회 지지 본기','RELATION':'출생 지지와의 관계'};
 return `<div class="applied-rules"><h4>서술형 풀이에 반영한 관계</h4>${reading.segments.filter(s=>s.content).map(s=>`<div><p class="help">${simpleDate(s.start)} ~ ${simpleDate(s.end)} 전</p><ul><li>기본 관계: ${esc(s.god)} · TG-1</li>${s.rules.map(rule=>`<li>${esc(names[rule.id.split('-')[0]]??'관계 조합')} · ${esc(rule.id)}${rule.display?` (${esc(rule.display)})`:''}</li>`).join('')}</ul></div>`).join('')||'<p>출생일 기준 미확정으로 해석을 보류했습니다.</p>'}<p class="help">본문 문장별 규칙, 계산값과 적용 기간은 결과 JSON에 포함됩니다.</p></div>`;
}
function renderAnnual(annual,reading){
 const first=annual.months.find(m=>m.status==='ready')?.month;
 return `<section id="annual-reading" aria-label="1월부터 12월까지 월별 운세"><div class="annual-heading"><span class="eyebrow">한 해를 월별로</span><h3>${annual.year}년, 월별 운세</h3><p>보고 싶은 달을 선택해 총론과 분야별 풀이를 읽어 보세요.</p></div>
 <nav class="month-navigation" aria-label="월별 결과로 이동">${annual.months.map(m=>`<button type="button" data-jump-month="${m.month}" aria-controls="annual-month-${m.month}">${m.label}</button>`).join('')}</nav>
 <div class="annual-months">${annual.months.map(m=>{
  const segments=m.reading?.segments.filter(s=>s.content)??[];
  const preview=m.status==='before-birth'?'출생 전 기간':segments.length?segments.at(-1).content.title:'출생시간 확인 후 풀이할 수 있어요';
  const body=m.reading?`${m.period.trimmed?'<p class="help">태어난 시점 이후의 풀이만 표시합니다.</p>':''}<p class="month-period-note">${m.label}의 기간별 풀이입니다. 달 안에서 풀이가 바뀌면 구간을 나눠 표시해요. 월간 조회와 같은 결과이며 시각은 한국 표준시 기준입니다.</p>${renderPlain(m.reading,{prefix:`month-${m.month}`,showScope:false})}<details class="month-evidence"><summary>${m.label} 풀이 근거 보기</summary>${renderAppliedRules(m.reading)}<ul>${m.period.rows.map(row=>`<li>${simpleDate(row.start)} ~ ${simpleDate(row.end)} 전 · ${esc(row.evidence?`${row.evidence.god} / ${row.evidence.rule} / ${row.evidence.basis}`:'출생일 기준 미확정으로 해석 보류')}</li>`).join('')}</ul></details>`:'<p class="month-unavailable">태어나기 전의 기간이어서 운세를 제공하지 않습니다.</p>';
  return `<details class="annual-month" id="annual-month-${m.month}" ${m.month===first?'open':''}><summary><span class="month-name">${m.label}</span><span class="month-preview">${esc(preview)}</span><span class="month-toggle" aria-hidden="true">펼치기</span></summary><div class="annual-month-body">${body}</div></details>`;
 }).join('')}</div><p class="reading-scope">${esc(reading.scope)}<br><span>${esc(reading.status)}</span></p></section>`;
}
function renderReference(reading){
 if(!reading.notes.length)return '';
 return `<div class="result-reference"><button type="button" id="reference-toggle" class="reference-toggle" aria-expanded="false" aria-controls="reference-content">※ 참고<span class="sr-only">: 출생정보에 따른 풀이 범위 안내</span></button><aside id="reference-content" class="reference-content" aria-labelledby="reference-title" hidden><h3 id="reference-title">참고사항</h3>${reading.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</aside></div>`;
}
function bindReference(){
 $('#results').onclick=null;$('#results').onkeydown=null;
 const wrapper=$('.result-reference');if(!wrapper)return;
 const button=$('#reference-toggle'),content=$('#reference-content');let pinned=false;
 const show=open=>{content.hidden=!open;button.setAttribute('aria-expanded',String(open));};
 const close=()=>{pinned=false;show(false);};
 wrapper.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')show(true);});
 wrapper.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&!pinned&&!wrapper.contains(document.activeElement))show(false);});
 wrapper.addEventListener('focusin',()=>show(true));
 wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))close();});
 button.addEventListener('click',()=>{pinned=!pinned;show(pinned);});
 // Bound to the persistent results container: replaced on every result render.
 $('#results').onclick=event=>{if(!wrapper.contains(event.target))close();};
 $('#results').onkeydown=event=>{if(event.key==='Escape'&&!content.hidden){event.preventDefault();close();}};
}
// Each month's filter is independent. All sections are visible on the first result.
function bindReadingTabs(){
 $$('[data-reading-group]').forEach(group=>{
  const buttons=[...group.querySelectorAll('[data-reading-category]')];
  const panels=[...group.querySelectorAll('[data-reading-panel]')];
  const activate=button=>{
   readingCategory=button.dataset.readingCategory;
   buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
   panels.forEach(panel=>panel.hidden=readingCategory!=='all'&&panel.dataset.readingPanel!==readingCategory);
  };
  buttons.forEach((button,index)=>{
   button.addEventListener('click',()=>activate(button));
   button.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    activate(buttons[next]);buttons[next].focus();
   });
  });
 });
}
let printStates=null;
window.addEventListener('beforeprint',()=>{
 if(printStates)return;
 printStates={details:$$('.annual-month,.reading-overview-details').map(element=>({element,open:element.open})),panels:$$('[data-reading-panel],#reference-content').map(element=>({element,hidden:element.hidden}))};
 printStates.details.forEach(({element})=>element.open=true);
 printStates.panels.forEach(({element})=>element.hidden=false);
});
window.addEventListener('afterprint',()=>{
 if(!printStates)return;
 printStates.details.forEach(({element,open})=>element.open=open);
 printStates.panels.forEach(({element,hidden})=>element.hidden=hidden);
 printStates=null;
});

function render(){
 $('#status').textContent=example?'가상 예시입니다. 실제 출생정보가 아닙니다.':'계산이 완료되었습니다. 입력정보는 자동 저장하지 않습니다.';
 $('#empty').hidden=true;$('#results').hidden=false;
 const m=model,r=result,city=CITIES.find(c=>c.id===m.input.city),e=visibleElements(m.common);
 const gods=[...new Map(r.rows.filter(row=>row.evidence).map(row=>[row.evidence.god,row.evidence])).values()];
 const daewoon=r.schedule;
 const reading=plainReading(m,r);
 const annual=r.type==='year'?annualReading(m,Number(simpleDate(r.start).slice(0,4))):null;
 const activeList=[...new Map(r.rows.filter(row=>row.active).map(row=>[row.active.index,row.active])).values()];
 const count=m.candidates.length;
 const scheduleContent=daewoon?`<span class="big-value">${activeList.length?activeList.map(p=>p.pillar.han).join(' / '):'시작 전'}<small>${daewoon.forward?'순행':'역행'}</small></span><p>첫 대운 약 ${daewoon.ageYears.toFixed(2)}세 · ${simpleDate(daewoon.start).slice(0,10)} 시작<br>절입까지 ${daewoon.deltaDays.toFixed(3)}일을 환산한 검토값입니다.</p>`:'<span class="big-value">미확정</span><p>출생시각과 대운 계산용 성별을 확인해야 합니다. 시간 범위·미상·중복 시각·절입 확인 구간에서는 확정하지 않습니다.</p>';
 const subtitle=`양력 ${dateText(m.normalized.solar)} · ${esc(city?.name??'국내')} · ${m.input.timeBand?esc(m.input.timeBand.label):m.input.timeMode==='unknown'?'시간 미상':m.input.timeMode==='range'?`${esc(m.input.timeStart)}–${esc(m.input.timeEnd)}`:esc(m.input.time)}`;
 const uncertainty=m.warnings.length?`<div class="notice"><strong>결과를 읽기 전에 확인하세요</strong><ul>${m.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:'';
 const rows=r.rows.map(row=>`<div class="timeline-row"><div><time>${simpleDate(row.start)}</time><time class="interval-end">~ ${simpleDate(row.end)}</time></div><div><span class="han-small">${row.target.han}</span><span class="row-sub">${row.target.name} · ${row.evidence?.god??'십성 미확정'}</span></div><div>${esc(row.evidence?.label??'일간을 먼저 확인해 주세요')}<span class="row-sub">연주 ${row.chart.year.name} · 월주 ${row.chart.month.name}${r.type==='day'?` · 일주 ${row.chart.day.name}`:''}</span>${row.relations.length?`<span class="tag">일지와 ${row.relations.map(x=>x.type).join(' · ')}</span>`:''}</div><div>${row.active?row.active.pillar.han:daewoon?'시작 전':'미확정'}<span class="row-sub">${row.daewoonEvidence?.god??'대운'}</span></div></div>`).join('');
 const cards=gods.length?gods.map(ev=>`<article class="reading-card"><span class="badge review">${ev.god} · 검수 전</span><h4>${ev.label}</h4><p>${ev.body}</p><div class="reflection">생각해 볼 질문<br>${ev.prompt}</div><div class="evidence">근거 ${ev.rule} · ${ev.basis}</div></article>`).join(''):'<div class="notice">일간이 미확정되어 개인별 십성 해석을 보류합니다. 아래 후보 비교에서 달라지는 기둥을 확인해 주세요.</div>';
 $('#results').innerHTML=`
 <div class="result-heading"><div><h2>${esc(r.title)}</h2><p>${subtitle}</p></div><div class="result-heading-tools">${example?'<span class="example-tag">가상 예시</span>':`<span class="badge ${count>1||m.nearTerms.length?'review':''}">${count>1?'출생시간 확인 필요':m.nearTerms.length?'출생시각 확인 필요':'쉬운 설명'}</span>`}${renderReference(reading)}</div></div>
 ${annual?renderAnnual(annual,reading):renderPlain(reading)}
 <details id="calculation-details" class="detail-box calculation-details"><summary>상세 계산 보기 <span>사주팔자 · 오행 · 풀이 근거</span></summary><div class="calculation-content">
 <article class="profile-card"><div class="profile-card-header"><h3>사주팔자 <span class="version">四柱八字</span></h3><small>음력 ${dateText(m.normalized.lunar)}<br>${m.normalized.lunar.intercalation?'윤달':'평달'} · ${esc(sourceLabels[m.input.source]??'확인 불가')}</small></div><div class="pillars">${pillarCard('year','연주')}${pillarCard('month','월주')}${pillarCard('day','일주')}${pillarCard('hour','시주')}</div><p class="profile-card-note">${m.rules.dayBoundary==='midnight'?'00:00':'23:00'} 일주 경계 · ${m.rules.solarTime==='standard'?'표준시':'지방평균태양시'} · 연·월주는 절입 기준</p></article>
 ${uncertainty}
 ${renderAppliedRules(reading)}
 <div class="summary-grid"><article class="card"><span class="card-kicker">확정 가능한 기둥의 표면 구성</span><h3>오행 구성 <span class="label-meta">총 ${e.total}글자</span></h3><div class="element-bars">${e.counts.map((n,i)=>`<div class="element-item element-${i}"><strong>${n}</strong><div class="element-bar" style="height:${n/Math.max(...e.counts,1)*65}px;background:var(--${['wood','fire','earth','metal','water'][i]})"></div><span>${ELEMENTS[i]}</span></div>`).join('')}</div><p>단순 개수이며 오행의 강약·좋고 나쁨을 뜻하지 않습니다.</p></article><article class="card"><span class="card-kicker">조회 기간에 해당하는 대운</span><h3>대운 흐름 <span class="badge review">환산 기준 검토</span></h3>${scheduleContent}</article></div>
 <section class="timeline-section"><div class="section-title"><h3>${r.type==='year'?'한 해의 구간별 흐름':r.type==='month'?'선택한 달의 구간별 흐름':'선택한 날의 구간별 흐름'}</h3><span class="small-label">${r.rows.length}개 구간</span></div><p class="section-caption">한국 표준시 기준 · 구간 시작 포함 / 끝 제외 · 절입과 대운 변경 시 분리${r.trimmed?' · 출생 이후부터 표시':''}</p><div class="timeline-list"><div class="timeline-row head"><div>적용 기간</div><div>${r.type==='year'?'세운':r.type==='month'?'월운':'일운'}</div><div>일간과의 관계</div><div>대운</div></div>${rows}</div><p class="help">경계는 천문 계산값이며 시·분으로 줄여 표시합니다. 초 단위 원값은 결과 파일에서 확인할 수 있습니다.</p></section>
 <section><div class="section-title"><h3>근거와 함께 읽는 기본 풀이</h3><span class="badge review">전문가 미검수</span></div><p class="section-caption">기간별 천간의 기초 관계 설명입니다. 원국 전체를 종합한 길흉 판단이나 사건 예측이 아닙니다.</p><div class="reading-cards">${cards}</div></section>
 <details class="detail-box" ${count>1?'open':''}><summary>출생시간 후보 비교 · ${count}개 계산 조합</summary><p class="help">아래는 계산 엔진의 후보값입니다. 절입 확인 구간에서는 공식 역서 확인 전 확정값으로 사용하지 마세요. 표시 시간은 해당 조합의 첫·마지막 표본이며 연속 유효 구간을 보증하지 않습니다.</p><div class="table-scroll"><table><thead><tr><th>출생 시각 표본 범위</th><th>연주</th><th>월주</th><th>일주</th><th>시주</th></tr></thead><tbody>${m.candidates.map(v=>`<tr><td>${formatLocal(v.first)} ~ ${formatLocal(v.last)}<br>UTC${v.chart.offset===600?'+10':'+09'}</td>${['year','month','day','hour'].map(k=>`<td>${v.chart[k].han} ${v.chart[k].name}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
 <details class="detail-box"><summary>계산 근거와 버전 확인</summary><dl class="key-values"><dt>엔진 / 규칙</dt><dd>${VERSION.engine} / ${VERSION.rules}</dd><dt>시간대 자료</dt><dd>${VERSION.timezone}</dd><dt>음력 변환</dt><dd>${VERSION.lunar}</dd><dt>절기 계산</dt><dd>${VERSION.terms} · 공식 자료 전체 대조 전</dd><dt>출생 시각 보정</dt><dd>${m.candidates[0].chart.correctionMinutes.toFixed(3)}분 · ${esc(m.candidates[0].chart.corrected)} (첫 후보)</dd><dt>오행 집계</dt><dd>${e.method}</dd><dt>대운 산식</dt><dd>${daewoon?esc(daewoon.conversion):'입력 불확실 또는 미지정으로 보류'}</dd><dt>해석 규칙</dt><dd>${VERSION.interpretation}<br>문장 ${esc(reading.version)} · 확장 ${esc(reading.rulesVersion)}</dd></dl><div class="table-scroll"><table><thead><tr><th>조회 기간의 절입</th><th>한국 표준시 (계산값)</th><th>황경</th></tr></thead><tbody>${r.terms.map(t=>`<tr><td>${t.name}</td><td>${simpleDate(t.ms)}</td><td>${t.longitude}°</td></tr>`).join('')||'<tr><td colspan="3">기간 내 절입 없음</td></tr>'}</tbody></table></div></details>
 </div></details>
 <div class="actions-row"><button id="download" type="button" class="secondary">결과·근거 JSON 내려받기</button><button id="print" type="button" class="secondary">인쇄</button><p class="help">내려받는 파일에는 입력한 출생정보가 포함됩니다.</p></div>`;
 bindReadingTabs();
 bindReference();
 $$('[data-jump-month]').forEach(button=>button.addEventListener('click',()=>{const month=$('#annual-month-'+button.dataset.jumpMonth);month.open=true;reveal(month.querySelector('summary'));}));
 $('#download').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...makeReport(model,result),plainReading:reading,...(annual?{annualReading:annual}:{})},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`saju-result-${selection().type}-${selection().type==='day'?selection().date:selection().year}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('#print').addEventListener('click',()=>window.print());
}
async function renderVerification(){
 try{const response=await fetch('./verification.json');if(!response.ok)throw Error('verification unavailable');const data=await response.json();$('#test-summary').innerHTML=`<div class="metric-grid"><div class="metric"><strong>${Number(data.passed)} / ${Number(data.total)}</strong><span>자동 테스트 통과 · ${esc(data.date)}</span></div><div class="metric"><strong>미완료</strong><span>전문가 해석 검수</span></div><div class="metric"><strong>미측정</strong><span>미래 예측 적중률</span></div></div>${data.groups.map(g=>`<article class="test-group"><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p></article>`).join('')}<p class="help">자동 테스트 수는 서로 독립적인 공식 정답의 개수가 아닙니다. 상호 대조·불변식·오류 처리 검증을 포함합니다.</p>`;}
 catch{$('#test-summary').innerHTML='<div class="notice">자동 검증 보고서를 불러오지 못했습니다. 검증 완료로 표시하지 않습니다.</div>';}
}
updateFields();renderVerification();
['#show-results','#query','#load-example'].forEach(id=>$(id).disabled=false);
$('#startup-status').hidden=true;
