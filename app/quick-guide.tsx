'use client';
export function QuickGuide({step,steps,onSkip}:{step:number|null;steps:readonly string[];onSkip:()=>void}){
 if(step===null)return null;
 return <aside className="quick-guide" aria-label="짧은 조작 연습"><div role="status"><small>20초 조작 연습 · {Math.min(step+1,steps.length)}/{steps.length}</small><strong>{steps[step]||"조작 연습 완료"}</strong></div><button onClick={onSkip}>{step>=steps.length?"연습 종료":'건너뛰기'}</button></aside>;
}
