export const COLS=10,ROWS=20,DURATION=180000;
export const COLORS=['#172331','#57d8e5','#8f95ff','#ffa15a','#f4d86c','#7ddd9c','#cb91f4','#ff7e98','#748494'];
export const SHAPES=[[[0,1],[1,1],[2,1],[3,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[1,1],[2,1]]];
export type Command='left'|'right'|'rotate'|'down'|'drop';
export type Piece={kind:number;rotation:number;x:number;y:number};
export type BlockPlayer={id:string;token?:string;name:string;last:number;board:number[];piece:Piece;queue:number[];seed:number;score:number;lines:number;sent:number;pending:number;incomingAt:number;out:boolean;outAt:number;fallAt:number;seq:number;inputAt:number;attackCursor:number};
export type BlockRoom={kind:'blocks';practice?:boolean;code:string;host:string;players:BlockPlayer[];phase:'lobby'|'playing'|'result';round:number;start:number;end:number;paused:number;attack:boolean;winner:string};
export function isBlocks(value:unknown):value is BlockRoom{return !!value&&typeof value==='object'&&'kind' in value&&value.kind==='blocks';}
function random(p:BlockPlayer){p.seed=(Math.imul(p.seed,1664525)+1013904223)>>>0;return p.seed/4294967296;}
function refill(p:BlockPlayer){if(p.queue.length>=7)return;const bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(random(p)*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}p.queue.push(...bag);}
export function cells(piece:Piece){let result=SHAPES[piece.kind].map(([x,y])=>[x,y]);if(piece.kind!==3)for(let i=0;i<piece.rotation;i++){const n=piece.kind===0?3:2;result=result.map(([x,y])=>[n-y,x]);}return result.map(([x,y])=>[x+piece.x,y+piece.y]);}
export function fits(p:BlockPlayer,piece:Piece){return cells(piece).every(([x,y])=>x>=0&&x<COLS&&y<ROWS&&(y<0||!p.board[y*COLS+x]));}
function spawn(p:BlockPlayer,now:number){refill(p);p.piece={kind:p.queue.shift()!,rotation:0,x:3,y:0};refill(p);p.fallAt=now+fallSpeed(p);if(!fits(p,p.piece)){p.out=true;p.outAt=now;}}
export function makeBlockPlayer(id:string,name:string,now:number,seed:number):BlockPlayer{const p:BlockPlayer={id,name,last:now,board:Array(COLS*ROWS).fill(0),piece:{kind:0,rotation:0,x:3,y:0},queue:[],seed,score:0,lines:0,sent:0,pending:0,incomingAt:0,out:false,outAt:0,fallAt:now+850,seq:0,inputAt:0,attackCursor:0};spawn(p,now);return p;}
export function makeBlockRoom(code:string,p:BlockPlayer,attack=true):BlockRoom{return {kind:'blocks',code,host:p.id,players:[p],phase:'lobby',round:0,start:0,end:0,paused:0,attack,winner:''};}
export function fallSpeed(p:BlockPlayer){return Math.max(280,850-Math.floor(p.lines/8)*75);}
export function startBlocks(r:BlockRoom,now:number,seed:number){r.round++;r.phase='playing';r.start=now+3000;r.end=r.start+DURATION;r.paused=0;r.winner='';r.players=r.players.map(p=>({...makeBlockPlayer(p.id,p.name,r.start,seed),token:p.token,last:now}));}
export function rankings(r:BlockRoom){return [...r.players].sort((a,b)=>Number(a.out)-Number(b.out)||b.score-a.score||b.lines-a.lines||b.outAt-a.outAt);}
export function finishBlocks(r:BlockRoom,label?:string){r.phase='result';r.paused=0;const order=rankings(r),first=order[0],ties=order.filter(p=>first&&p.out===first.out&&p.score===first.score&&p.lines===first.lines&&(!p.out||p.outAt===first.outAt));r.winner=label||(r.practice?'연습을 마쳤어요':ties.length>1?'공동 우승!':first?first.name+' 승리!':'이번 판이 끝났어요');}
function settle(r:BlockRoom,p:BlockPlayer,now:number){
 const squares=cells(p.piece);if(squares.some(([,y])=>y<0)){p.out=true;p.outAt=now;return;}
 for(const [x,y] of squares)p.board[y*COLS+x]=p.piece.kind+1;
 const rows=[];let cleared=0;for(let y=0;y<ROWS;y++){const row=p.board.slice(y*COLS,(y+1)*COLS);if(row.every(Boolean))cleared++;else rows.push(...row);}p.board=[...Array(cleared*COLS).fill(0),...rows];p.lines+=cleared;p.score+=[0,100,300,500,800][cleared]||0;
 let attack=r.attack?([0,0,1,2,4][cleared]||0):0;const cancel=Math.min(attack,p.pending);p.pending-=cancel;attack-=cancel;
 if(attack){const others=r.players.filter(q=>q.id!==p.id&&!q.out);if(others.length){const target=others[p.attackCursor++%others.length];target.pending=Math.min(20,target.pending+attack);target.incomingAt=Math.max(target.incomingAt,now+1200);p.sent+=attack;}}
 if(p.pending&&now>=p.incomingAt){const n=Math.min(4,p.pending),hole=Math.floor(random(p)*COLS);if(p.board.slice(0,n*COLS).some(Boolean)){p.out=true;p.outAt=now;}p.board=p.board.slice(n*COLS);for(let i=0;i<n;i++)p.board.push(...Array.from({length:COLS},(_,x)=>x===hole?0:8));p.pending-=n;p.incomingAt=now+1200;}
 if(!p.out)spawn(p,now);
}
export function blockCommand(r:BlockRoom,p:BlockPlayer,command:Command,now:number){
 if(r.phase!=='playing'||r.paused||now<r.start||p.out)return;
 if(command==='drop'){let n=0;while(fits(p,{...p.piece,y:p.piece.y+1})){p.piece.y++;n++;}p.score+=n*2;settle(r,p,now);return;}
 if(command==='rotate'){const rotated={...p.piece,rotation:(p.piece.rotation+1)%4};for(const [dx,dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]]){const trial={...rotated,x:rotated.x+dx,y:rotated.y+dy};if(fits(p,trial)){p.piece=trial;break;}}return;}
 const trial={...p.piece,x:p.piece.x+(command==='left'?-1:command==='right'?1:0),y:p.piece.y+(command==='down'?1:0)};
 if(fits(p,trial)){p.piece=trial;if(command==='down')p.score++;}else if(command==='down')settle(r,p,now);
}
export function advanceBlocks(r:BlockRoom,now:number){
 if(r.phase!=='playing'||r.paused)return;
 const until=Math.min(now,r.end);
 // Resolve gravity chronologically for all boards, independent of which player polled.
 for(let step=0;step<1000;step++){const p=r.players.filter(q=>!q.out&&q.fallAt<=until).sort((a,b)=>a.fallAt-b.fallAt)[0];if(!p)break;const at=p.fallAt;p.fallAt=at+fallSpeed(p);if(fits(p,{...p.piece,y:p.piece.y+1}))p.piece.y++;else settle(r,p,at);}
 for(const p of r.players)if(!p.out&&now-p.last>30000){p.out=true;p.outAt=now;}
 if(now>=r.end||r.players.filter(p=>!p.out).length<=(r.practice?0:1))finishBlocks(r);
}
export function pauseBlocks(r:BlockRoom,now:number,paused:boolean){if(r.phase!=='playing')return;if(paused&&!r.paused)r.paused=now;else if(!paused&&r.paused){const delta=now-r.paused;r.end+=delta;r.start+=delta;r.players.forEach(p=>{p.fallAt+=delta;p.incomingAt+=delta;p.last=now;});r.paused=0;}}
export function publicBlocks(r:BlockRoom){return {...r,players:r.players.map(({token,...p})=>p)};}
export function boardCells(p:BlockPlayer,ghost=true){const board=[...p.board];if(p.out)return board;let landing={...p.piece};while(fits(p,{...landing,y:landing.y+1}))landing.y++;if(ghost)for(const [x,y] of cells(landing))if(y>=0&&y<ROWS&&!board[y*COLS+x])board[y*COLS+x]=-1;for(const [x,y] of cells(p.piece))if(y>=0&&y<ROWS)board[y*COLS+x]=p.piece.kind+1;return board;}

export function makeBlockPractice(name:string,now:number,seed:number){const r=makeBlockRoom('연습',makeBlockPlayer('practice',name,now,seed),false);r.practice=true;startBlocks(r,now,seed);return r;}
