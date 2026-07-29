export const warehouseRetentionPolicy={factsMonths:84,metricSnapshotsMonths:120,refreshRunsMonths:24,aiRunsMonths:36};
export function retentionCutoff(months:number,at=new Date()){const value=new Date(at);value.setUTCMonth(value.getUTCMonth()-months);return value;}
