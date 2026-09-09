// Minute-inclusive input ranges copied from the user's reference.
// These labels are not a new astronomical/timezone correction rule.
export const TIME_INPUT_VERSION='TIME-BANDS-1';
export const BIRTH_TIME_BANDS=Object.freeze([
 {id:'early-zi',label:'조자(朝子) · 00:00~01:30',start:'00:00',end:'01:30'},
 {id:'chou',label:'축(丑) · 01:31~03:30',start:'01:31',end:'03:30'},
 {id:'yin',label:'인(寅) · 03:31~05:30',start:'03:31',end:'05:30'},
 {id:'mao',label:'묘(卯) · 05:31~07:30',start:'05:31',end:'07:30'},
 {id:'chen',label:'진(辰) · 07:31~09:30',start:'07:31',end:'09:30'},
 {id:'si',label:'사(巳) · 09:31~11:30',start:'09:31',end:'11:30'},
 {id:'wu',label:'오(午) · 11:31~13:30',start:'11:31',end:'13:30'},
 {id:'wei',label:'미(未) · 13:31~15:30',start:'13:31',end:'15:30'},
 {id:'shen',label:'신(申) · 15:31~17:30',start:'15:31',end:'17:30'},
 {id:'you',label:'유(酉) · 17:31~19:30',start:'17:31',end:'19:30'},
 {id:'xu',label:'술(戌) · 19:31~21:30',start:'19:31',end:'21:30'},
 {id:'hai',label:'해(亥) · 21:31~23:30',start:'21:31',end:'23:30'},
 {id:'late-zi',label:'야자(夜子) · 23:31~24:00',start:'23:31',end:'23:59'}
].map(Object.freeze));

export function timeSelectionMode(choice){
 if(['exact','range','unknown'].includes(choice))return choice;
 return 'band';
}
export function resolveBirthTime(data){
 const {timeChoice,time,timeStart,timeEnd,timeBand,...rest}=data;
 if(!timeChoice)throw Error('태어난 시간을 선택해 주세요. 모르는 경우에는 시간 모름을 선택할 수 있습니다.');
 if(timeChoice==='unknown')return {...rest,timeMode:'unknown',source:'unknown'};
 if(timeChoice==='exact')return {...rest,timeMode:'exact',time};
 if(timeChoice==='range')return {...rest,timeMode:'range',timeStart,timeEnd};
 const band=BIRTH_TIME_BANDS.find(item=>item.id===timeChoice);
 if(!band)throw Error('태어난 시간 선택값이 올바르지 않습니다. 다시 선택해 주세요.');
 return {...rest,timeMode:'range',timeStart:band.start,timeEnd:band.end,timeBand:{...band,version:TIME_INPUT_VERSION}};
}
