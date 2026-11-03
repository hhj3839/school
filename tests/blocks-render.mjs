import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {makeBlockPlayer,boardCells}=await import('../app/blocks/engine.ts');
const {sameBoard}=await import('../app/blocks/board-view.ts');
const p=makeBlockPlayer('a','A',10000,1);
for(let i=0;i<1000;i++){const next={...structuredClone(p),seq:i,last:10000+i,score:i};assert.equal(sameBoard(p,next),true,'clock/ack/score updates must not repaint the board');}
for(const change of [q=>q.piece.x++,q=>q.piece.rotation++,q=>q.piece.y++,q=>q.board[190]=8,q=>q.out=true,q=>q.name='B']){const q=structuredClone(p);change(q);assert.equal(sameBoard(p,q),false,'visible changes always repaint');}
const groupsBefore=200*4,groupsAfter=[true,false,false,false].reduce((count,ghost)=>count+boardCells(p,ghost).filter(Boolean).length,0);assert.equal(groupsAfter,20);assert.ok(groupsAfter<groupsBefore*.05);console.log(JSON.stringify({test:'opening board groups (my board and 3 peers)',groupsBefore,groupsAfter,unrelatedUpdatesSkipped:1000}));
