export type Cover={x:number;y:number;w:number;h:number;base:number;height:number;color:string;kind:string};

export function coverShape(o:Cover){return ['balloon','leaves','jellyfish','planet','skull','bone','tentacle','branch','skeleton'].includes(o.kind)?'ellipsoid':o.kind==='ring'?'ring':'box';}
export function coverContains(o:Cover,x:number,y:number,z:number){
 const nx=(x-o.x-o.w/2)/(o.w/2),ny=(y-o.y-o.h/2)/(o.h/2),nz=(z-o.base-o.height/2)/(o.height/2),shape=coverShape(o);
 if(shape==='ellipsoid')return nx*nx+ny*ny+nz*nz<=1;
 if(shape==='ring'){const r=nx*nx+ny*ny;return Math.abs(nz)<=1&&r<=1&&r>=.65*.65;}
 return Math.abs(nx)<=1&&Math.abs(ny)<=1&&Math.abs(nz)<=1;
}
export function coverOverlaps(o:Cover,x:number,y:number,z:number,height:number){
 const dx=Math.max(0,Math.abs(x-o.x-o.w/2)-18)/(o.w/2),dy=Math.max(0,Math.abs(y-o.y-o.h/2)-18)/(o.h/2);
 const dz=Math.max(0,Math.abs(z+height/2-o.base-o.height/2)-height/2)/(o.height/2),shape=coverShape(o);
 if(shape==='ellipsoid')return dx*dx+dy*dy+dz*dz<1;
 if(shape==='ring'){const farX=(Math.abs(x-o.x-o.w/2)+18)/(o.w/2),farY=(Math.abs(y-o.y-o.h/2)+18)/(o.h/2);return dz<1&&dx*dx+dy*dy<1&&farX*farX+farY*farY>.65*.65;}
 return dx<1&&dy<1&&dz<1;
}

// Every visible block is also a server-side volume. Empty space under hanging
// decorations stays empty for movement and shots, including between branches.
export function createCover(theme:string,scale:number):Cover[]{
 const out:Cover[]=[];
 const colors:Record<string,string[]>={art:['#536882','#f0bd4c','#ed5353','#68875d'],amusement:['#ed5353','#f0bd4c','#569be0','#b377ce'],forest:['#3d5d42','#68875d','#78532f','#789568'],ocean:['#689399','#b377ce','#eb89ac','#3d666e'],museum:['#ad8051','#d2c1a3','#536882','#68875d']};
 const palette=colors[theme]||colors.art;
 function add(x:number,y:number,w:number,h:number,base:number,height:number,color:string,kind:string){out.push({x:x*scale,y:y*scale,w:w*scale,h:h*scale,base,height,color,kind});}
 // Three heights on all four walls, with broad simple colours to paint against.
 for(const base of [.35,3.65,7.7])for(let i=0;i<3;i++){
  const c=palette[(i+Math.round(base))%4],kind=theme==='forest'?'wall-leaves':theme==='ocean'?'wall-reef':theme==='museum'?'wall-exhibit':'wall-banner';
  for(const y of [12,1110]){add(70+i*590,y,270,14,base,2.55,c,kind);add(105+i*590,y===12?27:1105,36,5,base,2.55,palette[(i+1)%4],kind);}
  for(const x of [12,1774]){add(x,140+i*330,14,210,base,2.55,c,kind);add(x===12?27:1769,172+i*330,5,32,base,2.55,palette[(i+1)%4],kind);}
 }
 const positions=[[420,520,3],[1030,800,5.7],[1280,330,8.4],[640,180,5.7],[400,940,8.4],[1500,690,3]];
 positions.forEach(([x,y,b],i)=>{
  const c=palette[i%4];
  if(theme==='art'){
   add(x,y,180,12,b,2.4,c,'paper');add(x+72,y+14,32,6,b,2.4,palette[(i+1)%4],'paper');
   add(x+88,y+4,3,3,b+2.4,13.1-b-2.4,'#d2c1a3','cord');
   add(x+24,y+85,140,12,b+.6,1.8,palette[(i+2)%4],'paper');
  }else if(theme==='amusement'){
   for(let j=0;j<3;j++)add(x+j*55,y+(j%2)*40,60,60,b+(j%2)*.4,1.9,palette[(i+j)%4],'balloon');
   add(x+60,y+8,65,5,b-.9,.85,c,'flag');add(x+85,y+12,3,3,b+2.4,13.1-b-2.4,'#d2c1a3','cord');
  }else if(theme==='forest'){
   add(x,y,220,28,b,.35,'#78532f','branch');
   add(x-10,y-35,100,110,b+.35,1.8,c,'leaves');add(x+120,y-25,115,100,b+.35,1.8,'#68875d','leaves');
   if(i%2===0){add(x+75,y+55,95,85,b,.15,'#78532f','treehouse');add(x+75,y+120,95,15,b+.15,1.8,'#ad8051','treehouse');}
  }else if(theme==='ocean'){
   add(x,y,175,100,b+1,1.15,c,'jellyfish');
   for(let j=0;j<4;j++)add(x+10+j*40,y+25,18,24,b-.4,1.4,palette[(i+1)%4],'tentacle');
   if(i%2===0){add(x+210,y,28,80,b-2.5,4.5,'#3d666e','arch');add(x+210,y,180,80,b+2,.4,'#689399','arch');add(x+360,y,28,80,b-2.5,4.5,'#3d666e','arch');}
  }else{
   if(i%2===0){add(x,y,150,110,b,2.2,c,'planet');add(x-35,y-15,220,140,b+.85,.3,'#d2c1a3','ring');}
   else{add(x,y,240,24,b+1,.3,'#d2c1a3','skeleton');for(let j=0;j<5;j++)add(x+j*47,y-35,16,100,b,.9,'#e0d9c8','bone');add(x+230,y-8,45,44,b+.65,.8,'#d2c1a3','skull');}
   add(x+70,y+35,3,3,b+2.2,13.1-b-2.2,'#ad8051','cord');
  }
 });
 return out;
}

