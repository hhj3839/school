// Browser QA must pair page metrics with Chrome's actual tab/window state.
// Automation can report document.visible/hasFocus while the tab is inactive.
export function frameContext(tab,window){
 if(!tab||!window||tab.windowId!==window.id)throw new Error('Missing or mismatched browser context');
 const state=window.state==='minimized'?'minimized-window':!tab.active?'inactive-tab':window.focused?'active-focused':'active-unfocused';
 return {state,foregroundComparable:tab.active&&window.state!=='minimized',tabId:tab.id,windowId:window.id,windowFocused:window.focused,windowState:window.state};
}

export function frameCase(before,after,samples){
 if(before.tabId!==after.tabId||before.windowId!==after.windowId||before.state!==after.state)throw new Error('Browser context changed during measurement');
 if(!samples.length)throw new Error('No frame samples');
 const fps=samples.map(s=>Number(s.fps));if(fps.some(n=>!Number.isFinite(n)))throw new Error('Invalid FPS');
 const dimensions=new Set(samples.map(s=>`${s.width}x${s.height}`));if(dimensions.size!==1)throw new Error('Mixed viewport sizes');
 return {context:before,viewport:[...dimensions][0],samples:fps.length,minFps:Math.min(...fps),maxFps:Math.max(...fps),foregroundComparable:before.foregroundComparable};
}
