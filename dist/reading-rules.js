import {tenGod,HIDDEN,branchRelations} from './engine.js?v=0.2.0';

// Editorial interpretations of computed traditional relationships, not validated predictions.
export const RULES_VERSION='COMPOSITE-KO-1';
export const GOD_GROUPS=Object.freeze({비견:'peer',겁재:'peer',식신:'output',상관:'output',편재:'wealth',정재:'wealth',편관:'authority',정관:'authority',편인:'resource',정인:'resource'});
const labels={year:'연주',month:'월주',day:'일주',hour:'시주'};
const scopes={year:'한 해의 큰 흐름',month:'이달의 흐름',daewoon:'장기 흐름'};
const groupTopics={
 peer:{focus:'자신의 기준과 사람 사이의 균형',areas:['money','relationships','love'],
  overview:'사람들과 뜻을 맞추면서도 자신의 판단을 잃지 않는 쪽에 초점을 두는 구성입니다. 함께할수록 편한 일과 스스로 정해야 할 일을 나누어 보면 좋겠습니다.',
  money:'공동으로 쓰는 돈과 자신의 몫을 나누는 것이 재물 풀이의 중요한 주제입니다. 다른 사람의 소비나 성과에 맞추어 움직이기보다 자신이 세운 기준을 확인해 보세요.',
  work:'독립적으로 맡는 일과 협력하는 일을 구분할수록 장점을 살펴보기 좋습니다. 자신의 역할은 분명히 하되 다른 사람의 방식을 받아들일 여지도 남겨 두세요.',
  relationships:'사람을 가까이하는 마음과 스스로 결정하고 싶은 마음을 함께 살펴보는 구성입니다. 의견 차이를 승부로 받아들이지 않으면 서로의 입장을 듣는 데 도움이 됩니다.',
  love:'관계 안에서도 각자의 시간과 선택을 존중하는 주제를 눈여겨볼 만합니다. 친밀함을 확인하려 애쓰기보다 서로 편안하게 이어갈 수 있는 거리를 이야기해 보세요.'},
 output:{focus:'표현과 실행을 통해 결과를 남기는 일',areas:['work','relationships','love'],
  overview:'생각을 말이나 행동으로 옮기는 쪽에 초점을 두는 구성입니다. 무엇을 더 준비할지 고민하는 시간과 직접 끝내 보는 시간을 함께 마련하면 좋겠습니다.',
  money:'재물에 관한 계획도 실제 사용 내역을 보며 정리하는 쪽에 무게를 둡니다. 돈을 쓸 때 얻고 싶은 효과와 사용한 뒤의 만족을 비교해 보면 반복되는 선택을 돌아보기 좋습니다.',
  work:'아이디어를 구체적인 작업으로 바꾸는 주제를 눈여겨볼 만합니다. 말로 설명한 내용과 실제 완성한 결과가 이어지도록 작은 단위로 정리해 보세요.',
  relationships:'자신의 생각을 밖으로 표현하는 주제가 함께 나타납니다. 말할 내용만큼 상대가 듣기 편한 때와 표현을 살펴보면 대화를 부드럽게 이어가는 데 도움이 됩니다.',
  love:'마음을 구체적으로 전하는 쪽에 초점을 두는 구성입니다. 큰 표현 한 번에 기대기보다는 짧은 연락이나 작은 약속처럼 계속 이어갈 수 있는 행동을 생각해 보세요.'},
 wealth:{focus:'자원의 활용과 생활의 관리',areas:['money','work'],
  overview:'시간과 비용을 실제 생활에 어떻게 쓰는지 살펴보는 구성입니다. 새로운 것을 더하기 전, 이미 가진 것의 쓰임과 유지하는 데 드는 부담을 함께 돌아보면 좋겠습니다.',
  money:'들어오는 돈을 기대하는 것과 지금 쓸 수 있는 돈을 구분하는 주제가 겹칩니다. 새로운 계획은 유지 비용까지 살펴보고 일상 지출과 분리해 정리해 보세요.',
  work:'성과를 내기 위해 필요한 시간과 자원을 구체적으로 따져 보는 쪽에 무게를 둡니다. 겉으로 보이는 결과뿐 아니라 계속 유지할 수 있는 업무 방식인지도 살펴보면 좋겠습니다.',
  relationships:'서로 도움을 주고받는 과정에서 실제 부담을 맞추는 것이 중요합니다. 비용이나 시간처럼 말하기 조심스러운 부분일수록 약속 전에 편안하게 확인해 보세요.',
  love:'애정을 표현하는 마음과 현실적인 생활 조건을 함께 살펴볼 만합니다. 선물이나 만남의 크기보다 두 사람이 무리 없이 이어갈 수 있는 방식을 찾아보면 좋겠습니다.'},
 authority:{focus:'책임의 범위와 지켜야 할 약속',areas:['work','money','love'],
  overview:'일의 기준과 책임의 범위를 분명히 하는 쪽에 초점을 두는 구성입니다. 자신에게 기대되는 것과 실제로 할 수 있는 일을 맞추면 부담을 정리하는 데 도움이 됩니다.',
  money:'책임지고 부담해야 할 비용을 정확히 확인하는 주제가 함께 나타납니다. 금액뿐 아니라 납부 시점과 맡게 되는 범위를 살펴보고 결정하는 편이 좋겠습니다.',
  work:'정해진 역할을 수행하는 일과 과도한 책임을 떠안는 일을 구분해 볼 때입니다. 완료 기준을 먼저 맞추고 중간에 달라진 요청은 일정과 함께 조정해 보세요.',
  relationships:'상대에게 바라는 기준을 말로 확인하는 데 무게를 둡니다. 서로 알고 있다고 여긴 약속도 구체적으로 나누면 기대가 어긋나는 부분을 줄일 수 있습니다.',
  love:'관계에 대한 책임감과 서로의 기대를 함께 살펴보는 구성입니다. 원하는 연락 방식이나 앞으로의 계획을 혼자 정해 놓기보다 두 사람이 합의할 시간을 가져 보세요.'},
 resource:{focus:'배움과 정리, 필요한 도움을 구하는 일',areas:['work','relationships'],
  overview:'경험을 정리하고 필요한 조언을 자신의 상황에 맞게 활용하는 쪽에 초점을 두는 구성입니다. 생각을 넓히는 과정과 실제 선택을 내리는 과정을 함께 챙겨 보면 좋겠습니다.',
  money:'자료나 도구를 갖추는 데 쓰는 비용의 목적을 살펴볼 만합니다. 도움이 된다는 이야기와 지금 자신에게 필요한지를 구분하고 활용할 시간까지 생각해 보세요.',
  work:'혼자 막힌 부분을 구체적인 질문으로 바꾸는 주제가 함께 나타납니다. 받은 답을 기록하고 다음 작업에 적용해 보면 배운 내용을 자신의 방식으로 정리하기 좋습니다.',
  relationships:'도움을 요청하고 받아들이는 태도를 돌아보는 구성입니다. 필요한 것을 구체적으로 이야기하되 최종 선택은 자신의 사정에 맞추어 정하는 편이 좋겠습니다.',
  love:'상대를 보살피는 마음과 상대의 선택을 존중하는 태도를 함께 살펴볼 만합니다. 위로가 필요한지 해결 방법을 함께 찾고 싶은지 먼저 물어보면 좋겠습니다.'}
};

const relationCopy={
 mixed:{overview:'맞춰 가려는 흐름과 서로 다른 방향을 점검하는 흐름이 함께 나타납니다. 잘 통하는 부분이 있더라도 일정이나 역할까지 저절로 맞는다고 보기는 어렵습니다. 함께할 부분은 이어가되 조정할 조건은 따로 이야기해 보면 좋겠습니다.',money:'공동으로 진행하기 편한 부분과 부담을 다시 맞춰야 할 부분을 나누어 볼 때입니다. 관계가 좋다는 이유로 비용 확인을 생략하지 않는 편이 좋겠습니다.',work:'협력이 필요한 부분과 기존 계획을 조정할 부분이 함께 나타납니다. 함께하는 방향에 동의하더라도 담당 범위와 일정은 구체적으로 맞춰 보세요.',relationships:'서로 통하는 점과 의견이 다른 점을 동시에 인정하는 것이 좋겠습니다. 한 번의 대화가 편안했다고 모든 생각이 같을 것으로 짐작하지 않아도 됩니다.',love:'가까워지고 싶은 마음과 생활 방식의 차이를 함께 살펴볼 만합니다. 좋은 감정은 이어가면서 불편한 부분은 작게 나누어 이야기해 보세요.'},
 충:{overview:'기존 방식과 달라지는 조건을 서로 맞춰 보는 주제가 더해집니다. 이를 곧바로 나쁜 일의 징조로 받아들이기보다, 그대로 유지할 것과 조정할 것을 확인하는 계기로 읽으면 좋겠습니다.',money:'처음 생각한 지출 계획과 실제 부담이 같은지 다시 살펴보면 좋겠습니다. 달라진 조건이 있다면 이미 세운 계획이라도 범위를 조정해 보세요.',work:'현재 방식과 새 요구가 부딪히는 부분을 점검하는 주제가 더해집니다. 곧바로 밀어붙이거나 포기하기보다 일정과 역할에서 조정 가능한 지점을 찾아보세요.',relationships:'서로의 기준이 다른 부분을 먼저 확인하는 편이 좋겠습니다. 의견이 다르다는 이유만으로 관계 전체를 판단하지 말고 구체적인 상황부터 이야기해 보세요.',love:'가까운 사이에서 생활 리듬이나 기대가 다른 부분을 살펴보는 주제가 더해집니다. 의견 차이를 마음이 식었다는 증거로 삼기보다 무엇이 불편한지 차분히 나누어 보세요.'},
 육합:{overview:'관계와 약속을 연결해 함께할 조건을 찾는 주제가 더해집니다. 서로 뜻이 맞는 부분을 살피되 실제로 감당할 시간과 역할까지 확인하면 좋겠습니다.',money:'함께 쓰거나 나누는 비용은 서로 편안한 기준을 맞춰 보세요. 호의와 정산을 별개의 이야기로 생각하면 관계와 생활의 부담을 함께 살피기 좋습니다.',work:'다른 사람과 역할을 맞추어 진행하는 주제가 더해집니다. 협력 의사를 확인한 뒤 누가 무엇을 마무리할지 구체적으로 정해 보세요.',relationships:'공통 관심사나 함께할 약속을 통해 관계를 이어가는 주제가 더해집니다. 서로 맞는 부분을 찾으면서도 어려운 부탁에는 자신의 사정을 알려 주면 좋겠습니다.',love:'서로 맞춰 갈 수 있는 부분을 찾는 데 마음을 기울이면 좋겠습니다. 가까워지는 속도보다 두 사람 모두 편안한 약속을 만드는 과정에 집중해 보세요.'},
 '같은 지지':{overview:'익숙한 주제와 기존의 생활 방식을 다시 돌아보는 흐름이 더해집니다. 반복되는 선택 가운데 계속 이어갈 것과 바꾸고 싶은 것을 나누어 보면 좋겠습니다.',money:'반복해서 나가는 돈과 습관적인 선택을 돌아볼 만합니다. 늘 해왔다는 이유로 유지하기보다 지금도 필요한지 확인해 보세요.',work:'반복되는 업무에서 같은 실수가 이어지거나 확인이 생략되는 부분이 없는지 살펴보세요. 익숙한 절차도 현재 상황에 맞게 정리하면 좋겠습니다.',relationships:'익숙한 사람과 반복해 온 대화 방식을 돌아보는 주제가 더해집니다. 상대가 알아줄 것이라 생각했던 부분을 한 번 더 설명해 보세요.',love:'익숙한 관계 방식과 표현을 돌아보면 좋겠습니다. 관계가 이어지고 있다는 사실과 충분히 마음을 전하고 있는지는 나누어 살펴볼 만합니다.'}
};
const areaKeys=['overview','money','work','relationships','love'];
const roleAreas={year:['relationships'],month:['money','work'],day:['relationships','love'],hour:['work']};
const group=god=>GOD_GROUPS[god]??null;
const validPillar=p=>p&&Number.isInteger(p.stem)&&p.stem>=0&&p.stem<10&&Number.isInteger(p.branch)&&p.branch>=0&&p.branch<12;

export function natalProfile(model){
 const day=model.common.day;
 if(!validPillar(day))return {tokens:[],counts:{},dominant:null,knownPillars:[],missingPillars:Object.keys(labels)};
 const tokens=[];
 for(const [position,p] of Object.entries(model.common)){
  if(!validPillar(p))continue;
  // The day stem is the reference; do not count it as automatic peer evidence.
  if(position!=='day')tokens.push({position,part:'stem',stem:p.stem,god:tenGod(day.stem,p.stem)});
  tokens.push({position,part:'branch-main',stem:HIDDEN[p.branch][0],god:tenGod(day.stem,HIDDEN[p.branch][0])});
 }
 const counts=Object.fromEntries(Object.keys(groupTopics).map(key=>[key,tokens.filter(t=>group(t.god)===key).length]));
 const max=Math.max(...Object.values(counts)),leaders=Object.keys(counts).filter(key=>counts[key]===max);
 // Editorial threshold: unique plurality of at least two observed tokens, not strength or luck.
 const dominant=max>=2&&leaders.length===1?leaders[0]:null;
 return {tokens,counts,dominant,knownPillars:Object.keys(labels).filter(k=>validPillar(model.common[k])),missingPillars:Object.keys(labels).filter(k=>!validPillar(model.common[k])),method:'확정 기둥의 천간(일간 제외)·지지 본기 각 1개. 신강약·용신 판정 아님.'};
}

export function readingContext(model,row,type,profile=natalProfile(model)){
 const day=model.common.day;
 if(!validPillar(day)||!validPillar(row.target))return null;
 const layers=[];
 const add=(scope,p)=>{if(validPillar(p)){const god=tenGod(day.stem,p.stem);layers.push({scope,pillar:{stem:p.stem,branch:p.branch,name:p.name},god,group:group(god)});}};
 // Never interpret an arbitrary midpoint day as a whole month or year.
 if(type==='month'||type==='day')add('year',row.chart?.year);
 if(type==='day')add('month',row.chart?.month);
 if(row.active)add('daewoon',row.active.pillar);
 const relations=[];
 for(const position of Object.keys(labels)){
  const p=model.common[position];if(!validPillar(p))continue;
  for(const hit of branchRelations(p.branch,row.target.branch))relations.push({position,natalBranch:p.branch,targetBranch:row.target.branch,type:hit.type,ruleId:hit.id});
 }
 const hiddenStem=HIDDEN[row.target.branch][0],hiddenGod=tenGod(day.stem,hiddenStem);
 return {primary:{god:tenGod(day.stem,row.target.stem),group:group(tenGod(day.stem,row.target.stem)),pillar:{stem:row.target.stem,branch:row.target.branch}},profile,layers,hidden:{stem:hiddenStem,god:hiddenGod,group:group(hiddenGod)},relations};
}
function relationType(hits){
 const types=new Set(hits.map(h=>h.type));
 if(types.has('충')&&types.has('육합'))return 'mixed';
 return ['충','육합','같은 지지'].find(t=>types.has(t))??null;
}

export function composeReading(base,context){
 const content=JSON.parse(JSON.stringify(base));
 if(!context)return {content,rules:[],paragraphEvidence:{overview:[],money:[],work:[],relationships:[],love:[]}};
 const {profile,primary,layers,hidden,relations}=context;
 const additions=Object.fromEntries(areaKeys.map(key=>[key,[]]));
 const evidence=Object.fromEntries(areaKeys.map(key=>[key,[]]));
 const rules=[];
 const add=(id,areas,texts,basis,priority)=>{
  rules.push({id,areas,basis,priority});
  for(const area of areas){const text=typeof texts==='string'?texts:texts[area];if(text){additions[area].push(text);evidence[area].push({ruleId:id,text});}}
 };
 if(profile.dominant){
  const topic=groupTopics[profile.dominant];
  const intro=profile.missingPillars.length?'확인 가능한 출생정보만 함께 보면, ':'출생정보를 함께 보면, ';
  const texts=Object.fromEntries(areaKeys.map(key=>[key,(key==='overview'?intro:'')+topic[key]]));
  add('NATAL-GROUP-'+profile.dominant,areaKeys,texts,{counts:profile.counts,knownPillars:profile.knownPillars,missingPillars:profile.missingPillars,tokens:profile.tokens},50);
  if(profile.dominant===primary.group){
   add('NATAL-PERIOD-REPEAT',['overview'],'출생정보에서 눈여겨본 주제가 이번 기간에도 겹칩니다. 익숙한 방식을 살려 진행하되, 같은 방식만 고집해 선택의 폭을 좁히고 있지는 않은지 돌아보면 좋겠습니다.',{natalGroup:profile.dominant,periodGroup:primary.group},40);
  }else{
   add('NATAL-PERIOD-SHIFT',['overview'],`평소 살펴볼 주제인 ${topic.focus}에 더해, 이번에는 ${groupTopics[primary.group].focus}도 함께 챙기면 좋겠습니다. 한쪽에만 힘을 쏟기보다 두 과제를 나누어 생각해 보세요.`,{natalGroup:profile.dominant,periodGroup:primary.group},40);
  }
 }
 for(const layer of layers){
  const topic=groupTopics[layer.group],same=layer.group===primary.group;
  const overview=same?`${scopes[layer.scope]}에서도 ${topic.focus}에 관한 주제가 이어집니다. 당장의 선택이 이전에 세운 방향과 맞는지 함께 돌아보면 좋겠습니다.`:`${scopes[layer.scope]}에는 ${topic.focus}에 관한 주제도 나타납니다. 눈앞의 일과 더 길게 가져갈 방향을 나누어 살펴보세요.`;
  // Same group needs only one explanation; all matched layers still remain in evidence.
  const already=rules.some(r=>r.id.startsWith('LAYER-')&&r.basis.group===layer.group);
  if(already){rules.push({id:'LAYER-'+layer.scope,areas:[],basis:layer,priority:30,display:'같은 주제의 문장 중복 생략'});continue;}
  const texts={overview};
  for(const area of topic.areas)texts[area]=`${scopes[layer.scope]}까지 함께 보면 ${topic.focus}도 고려할 부분입니다.`;
  add('LAYER-'+layer.scope,['overview',...topic.areas],texts,layer,30);
 }
 if(hidden.group!==primary.group){
  const topic=groupTopics[hidden.group];
  add('TARGET-BRANCH-MAIN',['overview',...topic.areas],Object.fromEntries(['overview',...topic.areas].map(area=>[area,area==='overview'?`겉으로 드러나는 주제와 함께 ${topic.focus}도 살펴볼 만합니다. 실행 과정에서 놓치기 쉬운 부분을 보완하는 관점으로 읽어 보세요.`:`실제 행동으로 옮길 때는 ${topic.focus}까지 살피는 편이 좋겠습니다.`])),hidden,20);
 }
 for(const area of areaKeys){
  const hits=area==='overview'?relations:relations.filter(hit=>roleAreas[hit.position].includes(area));
  const type=relationType(hits);if(!type)continue;
  add('RELATION-'+area+'-'+type,[area],relationCopy[type][area],hits,60);
 }
 const reference={ruleId:'TG-1',god:primary.god};
 const unique=items=>[...new Set(items)];
 // Plain prose: base interpretation, personal context, then actionable context. No random variants.
 content.paragraphs=[content.summary,...unique(additions.overview),content.caution];
 const paragraphEvidence={overview:[{text:content.summary,rules:[reference]},...evidence.overview.map(e=>({text:e.text,rules:[{ruleId:e.ruleId}]})),{text:content.caution,rules:[reference]}]};
 for(const area of areaKeys.filter(key=>key!=='overview')){
  const entry=content[area];
  entry.paragraphs=[...entry.paragraphs,...unique(additions[area])];
  paragraphEvidence[area]=[{text:entry.paragraphs[0],rules:[reference]},...evidence[area].map(e=>({text:e.text,rules:[{ruleId:e.ruleId}]}))];
 }
 return {content,rules,paragraphEvidence};
}
