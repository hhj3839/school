'use client';
export function QuickGuide({step,steps,onSkip}:{step:number|null;steps:readonly string[];onSkip:()=>void}){
 if(step===null)return null;
 return <aside className="quick-guide" aria-label="짧은 조작 연습"><div role="status"><small>20초 조작 연습 · {Math.min(step+1,steps.length)}/{steps.length}</small><strong>{steps[step]||'모두 해냈어요!'}</strong></div><button onClick={onSkip}>{step>=steps.length?'이제 놀기':'건너뛰기'}</button></aside>;
}
