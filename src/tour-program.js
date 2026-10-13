import {floors,spaces} from './data.js';
export const tourStops=[
 {view:'corner',light:'day',hold:4500},
 {view:'aerial',light:'day',hold:3500},
 ...floors.filter(f=>f.id===1||f.id>=4).flatMap(f=>[
  {floor:f.id,unit:'hall',light:'day',hold:2800},
  ...spaces(f).map(s=>({floor:f.id,unit:s.id,light:'day',hold:s.id==='auditorium'?6000:4000}))
 ]),
 {view:'corner',light:'sunset',hold:10000},
 {view:'aerial',light:'sunset',hold:7000},
 {view:'corner',light:'night',hold:6500}
];
