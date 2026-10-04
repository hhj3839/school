import {STEP,stepRacer,type RaceRoom,type RaceInput} from './engine';

// Network arrival time must not change the time assigned to an input tick.
export function replayInputs(room:RaceRoom,id:string,commands:RaceInput[]){
 const p=room.players.find(p=>p.id===id);if(!p)return;
 for(const command of commands){p.at+=STEP;stepRacer(room,p,command,p.at);}
}
export function clockOffset(previous:number,sample:number,first:boolean){
 return first?sample:previous+Math.max(-20,Math.min(20,(sample-previous)*.15));
}
