import {STEP,INPUT_LIMIT,stepRacer,type RaceRoom,type RaceInput} from './engine';

// Prediction mutates only this racer and may append a finisher. Other racers
// and historical finishers are immutable here; avoid cloning all 20 at 20 Hz.
export function predictionRoom(room:RaceRoom,id:string){
 return {...room,players:room.players.map(p=>p.id===id?{...p}:p),finishers:room.finishers?.slice()};
}

// A full network queue must retain a button tap until an input slot is available.
export function queueRaceInput(commands:RaceInput[],input:{x:number;z:number;jump:boolean},seq:number){
 if(commands.length>=INPUT_LIMIT)return null;
 const command={seq,...input};commands.push(command);input.jump=false;return command;
}

// Network arrival time must not change the time assigned to an input tick.
export function replayInputs(room:RaceRoom,id:string,commands:RaceInput[]){
 const p=room.players.find(p=>p.id===id);if(!p)return;
 for(const command of commands){p.at+=STEP;stepRacer(room,p,command,p.at);}
}
export function clockOffset(previous:number,sample:number,first:boolean){
 return first?sample:previous+Math.max(-20,Math.min(20,(sample-previous)*.15));
}
