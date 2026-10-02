import assert from 'node:assert/strict';
import {groundParts} from '../app/ground-parts.ts';
import {coverContains,coverOverlaps} from '../app/cover-layout.ts';
import {MAPS,mapGround,W,H,CEILING_HEIGHT} from '../app/game.ts';
const prop=kind=>groundParts({x:0,y:0,w:400,h:400,height:8,color:'#abcdef',kind});
const inside=(parts,x,y,z)=>parts.some(p=>coverContains(p,x,y,z));
const tent=prop('tent');assert.ok(inside(tent,200,200,6));assert.equal(inside(tent,20,200,6),false,'sloping roof leaves upper corners empty');
assert.equal(tent.some(p=>coverOverlaps(p,20,200,6,.7)),false);
const tree=prop('tree');assert.ok(inside(tree,200,200,1));assert.equal(inside(tree,20,20,1),false,'walk around actual trunk');
const coral=prop('coral');assert.ok(inside(coral,204,192,4));assert.equal(inside(coral,120,340,4),false,'branch gaps are empty');
const wheel=prop('wheel').find(p=>p.shape==='wheelRing');const cx=wheel.x+wheel.w/2,cy=wheel.y+wheel.h/2,cz=wheel.base+wheel.height/2;
assert.equal(coverContains(wheel,cx,cy,cz),false);assert.ok(coverContains(wheel,cx+wheel.w*.45,cy,cz));
assert.equal(coverOverlaps(wheel,cx,cy,cz-.35,.7),false,'body fits through ring opening');
const ship=prop('ship');assert.ok(inside(ship,200,200,1));assert.equal(inside(ship,10,10,6),false,'ship bounding box is not solid');
for(const {id} of MAPS){for(const p of mapGround(id)){assert.ok(p.w>0&&p.h>0&&p.height>0);assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=W&&p.y+p.h<=H);assert.ok(p.base>=0&&p.base+p.height<=CEILING_HEIGHT);}}
console.log('PASS: sloping tent, trunk clearance, coral gaps, wheel opening, ship silhouette, all ground parts within world bounds');
