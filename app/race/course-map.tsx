import {COURSE_MAP,coursePoint,COURSE_LENGTH} from './course';
const minX=Math.min(...COURSE_MAP.map(p=>p.x)),maxX=Math.max(...COURSE_MAP.map(p=>p.x)),maxZ=Math.max(...COURSE_MAP.map(p=>p.z));
const scale=Math.min(114/(maxX-minX),78/maxZ);
const project=(p:{x:number;z:number})=>({x:123-(p.x-minX)*scale,y:87-p.z*scale});
const points=COURSE_MAP.map(p=>{const q=project(p);return `${q.x},${q.y}`;}).join(' ');
export function CourseMap({x,z}:{x:number;z:number}){const p=project(coursePoint(x,Math.max(0,Math.min(COURSE_LENGTH,z)))),end=project(COURSE_MAP[COURSE_MAP.length-1]);return <aside className="race-course-map" aria-label="세 개의 커브가 있는 코스 지도"><span>코스 지도 · ● 나</span><svg viewBox="0 0 138 98" role="img" aria-label="현재 위치"><polyline points={points} fill="none" stroke="#e6c9a0" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/><polyline points={points} fill="none" stroke="#fff8e6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><rect x={end.x-4} y={end.y-4} width="8" height="8" rx="1" fill="#d87591"/><circle cx={p.x} cy={p.y} r="5" fill="#287f75" stroke="white" strokeWidth="2"/></svg></aside>;}
