// Race-clock cycles are shared by every player and reset automatically.
export const FADING_BRIDGES=[60,588,2436].map(start=>({start,tileDepth:8,tiles:3}));
export const FADING_TILES=FADING_BRIDGES.flatMap(bridge=>Array.from({length:bridge.tiles},(_,index)=>({start:bridge.start+index*bridge.tileDepth,end:bridge.start+(index+1)*bridge.tileDepth,offset:bridge.start*.013+index*.3})));
const cycle=(time:number,offset:number,period=6)=>((time+offset)%period+period)%period;
export function fadingState(time:number,tile:typeof FADING_TILES[number]){const phase=cycle(time,tile.offset);return {solid:phase<4.8,warning:phase>=3.8&&phase<4.8};}
export const inFadingZone=(z:number)=>FADING_BRIDGES.some(b=>z>=b.start&&z<b.start+b.tileDepth*b.tiles);
export function fadingGround(z:number,time:number){const tile=FADING_TILES.find(t=>z>=t.start&&z<t.end);return tile?fadingState(time,tile).solid:false;}
export const SHUTTERS=[264,336];
export function shutterState(time:number,z:number){const phase=cycle(time,z*.017);const bottom=phase<2.5?0:phase<3.1?(phase-2.5)/.6*6:phase<5.4?6:(6-phase)/.6*6;return {bottom,warning:phase>=5&&phase<5.4};}
export const PUNCHES=[{z:474,side:-1},{z:540,side:1}];
export function punchState(time:number,z:number){const phase=cycle(time,z*.019),extension=phase<3.8?0:phase<4.2?(phase-3.8)/.4:phase<4.6?1:phase<5.2?(5.2-phase)/.6:0;return {extension,warning:phase>=2.8&&phase<3.8};}
