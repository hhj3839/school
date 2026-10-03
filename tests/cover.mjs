import './resolve-ts.mjs';
import assert from 'node:assert/strict';
const {MAPS,W,H,CEILING_HEIGHT,mapCover,canStand,move,moveHeight,visibleLine,makePlayer,attachToWall}=await import('../app/game.ts');
for(const {id} of MAPS){
 const all=mapCover(id);
 assert.ok(all.filter(o=>o.kind.startsWith('wall')).length>=36);
 for(const o of all){assert.ok(o.base>=0&&o.height>0&&o.base+o.height<=CEILING_HEIGHT);assert.ok(o.x>0&&o.y>0&&o.x+o.w<W&&o.y+o.h<H);}
 const o=all.find(o=>!o.kind.startsWith('wall')&&o.base>=3);
 const x=o.x+o.w/2,y=o.y+o.h/2;
 assert.ok(canStand(x,y,id,0),'walk underneath '+id);
 assert.equal(canStand(x,y,id,o.base),false,'cannot enter decoration '+id);
 const a=makePlayer('a','a',0),b=makePlayer('b','b',0);a.x=o.x-30;a.y=y;b.x=o.x+o.w+30;b.y=y;a.role='seeker';
 assert.ok(visibleLine(a,b,id),'shots pass below '+id);
 a.elevation=b.elevation=o.base-.4;
 assert.equal(visibleLine(a,b,id),false,'decoration blocks elevated shots '+id);
 const p=makePlayer('p','p',0);p.x=x;p.y=y;p.elevation=o.base-1.72;moveHeight(p,1,.3,id);assert.ok(p.elevation+1.7<=o.base,'cannot rise into underside '+id);
 p.x=o.x-30;p.y=y;p.elevation=o.base;move(p,1,0,.3,id);assert.ok(p.x<=o.x-18,'cannot move through cover '+id);
 p.x=o.x-40;p.y=y;p.elevation=o.base;assert.ok(attachToWall(p,id),'attach to raised cover '+id);assert.equal(p.elevation,o.base);
}
console.log('PASS: five themes have three wall levels, bounded air cover, passage underneath, elevated shot blocking, vertical/horizontal collision and attachment');
