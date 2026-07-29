export type HistoricalPoint={period:string;value:number};
export type ForecastResult={estimate:number;lowerBound:number;upperBound:number;sampleSize:number;method:"linear_trend_v1";disclaimer:string};
export const forecastDisclaimer="Estimate based on historical data. It is not a guarantee of future results.";
export function linearForecast(points:HistoricalPoint[]):ForecastResult|null{
  const valid=points.filter(point=>Number.isFinite(point.value));
  if(valid.length<3)return null;
  const n=valid.length,xMean=(n-1)/2,yMean=valid.reduce((sum,item)=>sum+item.value,0)/n;
  let numerator=0,denominator=0;for(let index=0;index<n;index++){numerator+=(index-xMean)*(valid[index].value-yMean);denominator+=(index-xMean)**2;}
  const slope=denominator?numerator/denominator:0,intercept=yMean-slope*xMean,estimate=Math.max(0,intercept+slope*n);
  const residual=Math.sqrt(valid.reduce((sum,item,index)=>sum+(item.value-(intercept+slope*index))**2,0)/n);
  return {estimate:Number(estimate.toFixed(4)),lowerBound:Number(Math.max(0,estimate-1.96*residual).toFixed(4)),upperBound:Number((estimate+1.96*residual).toFixed(4)),sampleSize:n,method:"linear_trend_v1",disclaimer:forecastDisclaimer};
}
