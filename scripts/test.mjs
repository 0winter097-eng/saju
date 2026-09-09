import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const r=spawnSync(process.execPath,['--test','--test-reporter=tap','tests/engine.test.mjs','tests/readings.test.mjs','tests/annual.test.mjs'],{encoding:'utf8'});
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');
if(r.status!==0)process.exit(r.status||1);
const passed=Number(r.stdout.match(/^# pass (\d+)/m)?.[1]),total=Number(r.stdout.match(/^# tests (\d+)/m)?.[1]);
if(!total||passed!==total)throw Error('Incomplete test run');
const sources=['dist/engine.js','dist/terms.js','dist/vendor/korean-lunar-calendar.js','tests/fixtures.json','tests/engine.test.mjs','dist/readings.js','tests/readings.test.mjs','dist/annual.js','tests/annual.test.mjs'];
const hashes=Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
writeFileSync('dist/verification.json',JSON.stringify({date:new Date().toISOString().slice(0,10),passed,total,hashes,groups:[
 {name:'공식 공개 자료의 선택 사례 대조',description:'KASI 음양력 날짜 4건, USNO 2026년 분·지점 4건을 대조했습니다. 절기 시각은 2분 이내 기준이며 전체 12절의 정확도 보증이 아닙니다.'},
 {name:'지원 기간의 회귀·상호 대조',description:'1970–2050년 29,585일 음양력 왕복과 일진을 변환 라이브러리와 교차 대조했습니다. 같은 기반 자료의 왕복 검증은 독립적인 공식 인증이 아닙니다.'},
 {name:'시간 경계·불확실성과 대운',description:'입춘·12절·중기, 자정·23시, 경도 보정, 서머타임 누락·중복, 시간 미상, 대운 순역행과 구간 변경을 검사했습니다.'},
 {name:'쉬운 설명의 기간·근거 보존',description:'열 가지 기본 관계의 분야별 설명·주의사항, 관계 상태별 애정 설명, 구간·계산 근거 보존과 미확정 해석 보류를 검사했습니다.'},
 {name:'연간 화면의 12개월 대조',description:'연간 조회의 각 달을 단독 월간 조회와 대조하고, 윤년·연말·출생 전 기간·출생시간 미확정 처리를 확인했습니다.'},
 {name:'기간 조회와 해석 재현성',description:'연간·월간·일간의 동일 시점 간지 일치, 미확정 해석 보류, 입력 오류, 결정적인 결과 재현성을 검사했습니다.'}
]},null,2));
