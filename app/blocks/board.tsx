'use client';
import {memo,useId} from 'react';
import {boardCells,COLORS,type BlockPlayer} from './engine';
import {sameBoard} from './board-view';
export const Board=memo(function Board({player,small=false}:{player:BlockPlayer;small?:boolean}){
 const grid=useId(),board=boardCells(player,!small);
 return <svg className={'block-board '+(small?'mini-board':'')} viewBox="0 0 100 200" role="img" aria-label={player.name+'의 블록판'+(player.out?' · 경기 종료':'')}><defs><pattern id={grid} width="10" height="10" patternUnits="userSpaceOnUse"><rect x=".4" y=".4" width="9.2" height="9.2" rx="1" fill="#f5f9fb" stroke="#426377" strokeOpacity=".09" strokeWidth=".3"/></pattern></defs><rect width="100" height="200" fill="#f5f9fb"/><rect width="100" height="200" fill={'url(#'+grid+')'}/>{board.map((n,i)=>n!==0&&<g key={i}><rect x={i%10*10+.4} y={Math.floor(i/10)*10+.4} width="9.2" height="9.2" rx="1" fill={n<0?'#78a6ba':COLORS[n]} fillOpacity={n<0?.22:1} stroke={n<0?'#496c80':'#426377'} strokeOpacity={n<0?.8:.45} strokeWidth=".3"/>{n>0&&<path d={`M${i%10*10+2} ${Math.floor(i/10)*10+3}h6`} stroke="#fff" strokeOpacity=".3" strokeWidth=".6"/>}</g>)}</svg>;
},(a,b)=>a.small===b.small&&sameBoard(a.player,b.player));
