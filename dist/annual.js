import {queryPeriod,periodBounds} from './engine.js?v=0.2.0';
import {plainReading} from './readings.js?v=0.2.0';

export const ANNUAL_VERSION='ANNUAL-MONTHS-1';

// Use the same monthly query as the standalone view; never repeat annual advice 12 times.
export function annualReading(model,year){
 const bounds=periodBounds({type:'year',year});
 if(bounds.end<=model.min)throw Error('출생 이전 기간은 운세 조회 대상에서 제외합니다.');
 const months=Array.from({length:12},(_,i)=>{
  const month=i+1,selection={type:'month',year,month};
  const calendar=periodBounds(selection);
  if(calendar.end<=model.min)return {month,label:`${month}월`,start:calendar.start,end:calendar.end,status:'before-birth',period:null,reading:null};
  const period=queryPeriod(model,selection);
  return {month,label:`${month}월`,start:calendar.start,end:calendar.end,status:'ready',period,reading:plainReading(model,period)};
 });
 return {version:ANNUAL_VERSION,year:Number(year),months};
}
