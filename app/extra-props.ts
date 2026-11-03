import type {MapId,MapObstacle} from './game';

// Shared planning coordinates. Keep the central spawn lane (y=650..740,
// x=380..1000) and broad crossings free. Low/detail parts share render/collision.
export function extraProps(theme:MapId):MapObstacle[]{
 const add=(x:number,y:number,w:number,h:number,height:number,kind:string,color:string)=>({x,y,w,h,height,kind,color});
 const sets:Record<MapId,MapObstacle[]>={
  art:[add(440,340,160,100,1.15,'worktable','#ad8051'),add(1050,800,170,70,2.8,'screen','#536882'),add(340,1020,130,65,1.2,'books','#436966'),add(1640,270,90,110,3.4,'painting','#923f37'),add(1220,660,130,80,1.15,'worktable','#dbba79'),add(780,220,120,60,2.8,'screen','#68875d')],
  amusement:[add(440,340,160,110,3.8,'archway','#b377ce'),add(1050,780,170,120,3.6,'shelter','#ed7891'),add(330,1030,120,60,1.15,'worktable','#f0bd4c'),add(1660,250,90,100,2.2,'gift','#70b65b'),add(1230,650,150,80,2.4,'blocks','#569be0'),add(820,210,100,70,2.8,'screen','#ed5353')],
  forest:[add(420,340,160,100,3.8,'shelter','#ad8051'),add(1050,780,160,110,3.8,'archway','#78532f'),add(330,1030,120,60,1.15,'worktable','#ad8051'),add(1640,270,100,110,4.5,'shelter','#68875d'),add(1230,650,160,65,.85,'log','#78532f'),add(790,220,100,75,1.3,'rock','#89938a')],
  ocean:[add(440,330,160,110,4.2,'archway','#689399'),add(1050,780,170,110,3.2,'shelter','#456c79'),add(340,1030,120,60,1.4,'chest','#dbba79'),add(1640,270,100,110,3.5,'coral','#eb89ac'),add(1220,650,120,80,2,'chest','#ad8051'),add(800,220,100,75,2.4,'reef','#426882')],
  museum:[add(440,330,160,110,4.2,'archway','#d8cdb6'),add(1050,780,170,90,3.2,'screen','#923f37'),add(330,1030,120,60,1.5,'exhibit','#dbba79'),add(1640,270,100,110,4.5,'column','#d8cdb6'),add(1220,650,140,80,2.8,'vase','#689399'),add(810,220,110,75,2.5,'exhibit','#456c79')]
 };
 return sets[theme];
}
