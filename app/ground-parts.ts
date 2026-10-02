import type {Cover,SolidShape} from './cover-layout';
type Layout={x:number;y:number;w:number;h:number;height:number;kind:string;color:string};

// Normalized local parts are shared by server collision and client rendering.
// Dimensions are relative to each layout footprint; heights remain in metres.
export function groundParts(o:Layout):Cover[]{
 const out:Cover[]=[],c=o.color;
 function part(x:number,z:number,w:number,d:number,b:number,h:number,color=c,shape:SolidShape='box'){
  out.push({x:o.x+x*o.w,y:o.y+z*o.h,w:w*o.w,h:d*o.h,base:b*o.height,height:h*o.height,color,shape,kind:o.kind});
 }
 if(o.kind==='tree'||o.kind==='plant'){
  part(.34,.34,.32,.32,0,.72,'#78532f','cylinder');
  part(0,.02,1,.96,.45,.55,c,'ellipsoid');part(.1,.1,.8,.8,.28,.44,'#68875d','ellipsoid');
  if(o.kind==='plant')part(.18,.18,.64,.64,0,.28,'#ad6246','cylinder');
 }else if(o.kind==='tent'){
  // A solid canvas A-frame, with a contrasting triangular doorway on its face.
  part(0,0,1,1,0,1,c,'prism');part(.32,.999,.36,.008,0,.55,'#263f37','prism');
  part(.48,0,.04,1,.96,.04,'#f2eee2');
 }else if(o.kind==='coral'){
  part(.16,.14,.68,.7,0,.22,'#d2c1a3','ellipsoid');
  part(.44,.34,.14,.28,.1,.8,c,'cylinder');
  for(let i=0;i<4;i++){const x=.04+i*.24;part(x,.16+(i%2)*.25,.16,.28,.14,.45+(i%2)*.24,i%2?c:'#eb89ac','cylinder');part(x-.01,.14+(i%2)*.25,.18,.32,.56+(i%2)*.24,.16,i%2?c:'#eb89ac','ellipsoid');}
  part(.09,.3,.8,.18,.32,.11,c,'ellipsoid');part(.46,.1,.15,.75,.56,.12,c,'ellipsoid');
 }else if(o.kind==='rock'||o.kind==='reef'){
  part(0,.06,.75,.9,0,.72,c,'ellipsoid');part(.32,0,.68,.7,.2,.8,c,'ellipsoid');part(.03,.35,.5,.62,.2,.45,'#89938a','ellipsoid');
 }else if(o.kind==='kelp'){
  for(let i=0;i<3;i++){const x=.1+i*.3;part(x,.4,.07,.12,0,.8,'#276956','cylinder');for(let j=0;j<4;j++)part(x-.08,.22+(j%2)*.15,.24,.42,.13+j*.19,.3,j%2?'#68875d':c,'ellipsoid');}
 }else if(o.kind==='log'){
  part(0,.03,1,.94,0,1,'#78532f','ellipsoid');part(.01,.18,.02,.64,.14,.72,'#d2c1a3','ellipsoid');part(.97,.18,.02,.64,.14,.72,'#d2c1a3','ellipsoid');
 }else if(o.kind==='ship'){
  part(0,.04,1,.92,0,.42,'#78532f','hull');part(.03,.08,.94,.84,.4,.055,'#ad8051');
  part(.57,.25,.25,.5,.45,.26,'#ad8051');part(.59,.24,.06,.015,.52,.12,'#3d666e');
  part(.42,.43,.025,.045,.44,.56,'#5c422d','cylinder');
  part(.14,.44,.56,.03,.58,.35,'#e0d9c8','prism');
  for(let i=0;i<4;i++)part(.15+i*.18,.95,.08,.035,.2,.12,'#d2c1a3','ellipsoid');
 }else if(o.kind==='chest'){
  part(.04,.04,.92,.92,0,.57,'#78532f');part(.04,.04,.92,.92,.38,.62,'#ad8051','ellipsoid');
  for(const x of [.17,.76])part(x,0,.07,1,0,.68,'#f0bd4c');part(.44,.98,.12,.02,.35,.2,'#f0bd4c');
 }else if(o.kind==='column'){
  part(0,0,1,1,0,.08,'#ab9976');part(.2,.2,.6,.6,.08,.84,c,'cylinder');part(0,0,1,1,.92,.08,'#ab9976');
 }else if(o.kind==='vase'){
  part(.06,.06,.88,.88,0,.18,'#d2c1a3');
  part(.2,.16,.6,.68,.18,.58,c,'ellipsoid');part(.39,.35,.22,.3,.65,.28,c,'cylinder');part(.32,.28,.36,.44,.91,.09,'#e0d9c8','cylinder');
 }else if(o.kind==='fossil'){
  part(.04,.04,.92,.92,0,.13,'#ab8051');
  for(const x of [.28,.68])part(x,.42,.025,.06,.13,.43,'#536882','cylinder');
  part(.12,.37,.73,.23,.55,.12,'#e0d9c8','ellipsoid');
  for(let i=0;i<5;i++){part(.16+i*.12,.18,.045,.62,.28,.39,'#d2c1a3','ellipsoid');}
  part(.72,.27,.25,.43,.6,.23,'#e0d9c8','ellipsoid');part(.07,.4,.16,.16,.4,.22,'#e0d9c8','ellipsoid');
  for(const x of [.2,.55])for(const z of [.22,.65])part(x,z,.06,.07,.13,.36,'#e0d9c8','cylinder');
 }else if(o.kind==='exhibit'){
  part(.08,.08,.84,.84,0,.35,'#d2c1a3');part(.2,.2,.6,.6,.35,.12,'#ad8051');
  part(.38,.32,.24,.36,.47,.26,c,'cylinder');part(.3,.22,.4,.56,.7,.3,'#f0bd4c','ellipsoid');
 }else if(o.kind==='wheel'){
  part(.12,.1,.76,.8,0,.12,'#ad8051');part(.43,.35,.14,.3,.12,.46,c,'cylinder');
  part(.02,.43,.96,.14,.22,.76,'#f0bd4c','wheelRing');
  // Eight separate gondolas leave real gaps around the rim.
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=.5+Math.cos(a)*.4,z=.6+Math.sin(a)*.33;part(x-.06,.36,.12,.28,z-.06,.12,['#ed5353','#569be0','#70b65b','#b377ce'][i%4]);}
  part(.43,.37,.14,.27,.52,.14,c,'ellipsoid');
 }else if(o.kind==='carousel'){
  part(.02,.02,.96,.96,0,.12,'#f0bd4c','cylinder');part(.46,.46,.08,.08,.12,.65,'#ad8051','cylinder');
  part(0,0,1,1,.74,.26,c,'prism');
  for(const [x,z] of [[.2,.25],[.64,.25],[.2,.65],[.64,.65]]){part(x+.06,z,.018,.025,.12,.63,'#f0bd4c','cylinder');part(x,z-.04,.19,.15,.32,.11,'#f2eee2','ellipsoid');part(x+.13,z-.04,.06,.1,.4,.13,'#f2eee2','ellipsoid');}
 }else if(o.kind==='booth'){
  part(0,0,1,1,0,.4,c);part(0,0,1,.13,.4,.38,c);
  for(const x of [.02,.92])part(x,.85,.06,.06,.4,.36,'#ad8051');
  part(0,0,1,1,.76,.24,c,'prism');part(0,.88,1,.12,.38,.05,'#f2eee2');
 }else if(o.kind==='painting'){
  part(.08,.35,.84,.3,0,.15,'#ab8051');part(.12,.35,.76,.15,.15,.84,'#78532f');part(.17,.5,.66,.025,.22,.69,'#e0d9c8');
  for(let i=0;i<4;i++)part(.21+i*.14,.529,.11,.012,.3,.28+(i%2)*.19,['#436966','#dbba79','#923f37'][i%3]);
 }else if(o.kind==='books'){
  for(let i=0;i<5;i++)part(i%2*.03,0,.94,1,i*.2,.19,['#436966','#dbba79','#923f37'][i%3]);
 }else{
  part(0,0,1,1,0,1,c);
  if(o.kind==='gift'){part(.43,-.005,.14,1.01,0,1,'#f2eee2');part(0,.43,1,.14,0,1.005,'#f2eee2');}
  if(o.kind==='blocks')for(let i=1;i<4;i++)part(0,1,.99,.006,i/4,.025,'#f2eee2');
 }
 return out;
}
