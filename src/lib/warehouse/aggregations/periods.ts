import type { Granularity } from "../contracts";
export function periodBounds(granularity:Granularity,at=new Date()){
  const date=new Date(Date.UTC(at.getUTCFullYear(),at.getUTCMonth(),at.getUTCDate()));
  let start:Date,end:Date;
  if(granularity==="daily"){start=date;end=date;}
  else if(granularity==="weekly"){const day=(date.getUTCDay()+6)%7;start=new Date(date);start.setUTCDate(date.getUTCDate()-day);end=new Date(start);end.setUTCDate(start.getUTCDate()+6);}
  else if(granularity==="monthly"){start=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1));end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0));}
  else if(granularity==="quarterly"){const month=Math.floor(date.getUTCMonth()/3)*3;start=new Date(Date.UTC(date.getUTCFullYear(),month,1));end=new Date(Date.UTC(date.getUTCFullYear(),month+3,0));}
  else{start=new Date(Date.UTC(date.getUTCFullYear(),0,1));end=new Date(Date.UTC(date.getUTCFullYear(),11,31));}
  return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
}
