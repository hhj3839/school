import {blockCommand,type BlockRoom,type Command} from './engine';
export type PendingInput={seq:number;key:Command};
// Predict only my board. Attacks and other players remain server-authoritative.
export function predictInputs(room:BlockRoom,id:string,commands:PendingInput[],now:number){
 const next=structuredClone(room),player=next.players.find(p=>p.id===id);
 if(!player)return next;
 for(const command of commands)blockCommand(next,player,command.key,now);
 next.players=next.players.map(p=>p.id===id?p:structuredClone(room.players.find(q=>q.id===p.id)!));
 return next;
}
