'use client';
import {useEffect,useRef,useState} from 'react';
import {packPaint,unpackPaint,upgradePaint,type PackedPaint} from './paint-codec';
const KEY='hideout-artworks-v1';
type Work={paint:PackedPaint;date:string}|null;
function Thumbnail({work}:{work:Work}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,128,128);const p=work&&unpackPaint(work.paint);if(p){const pixels=upgradePaint(p);pixels.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i%128,Math.floor(i/128),1,1);});}},[work]);return <canvas ref={ref} width={128} height={128} aria-label={work?'저장한 색칠 미리보기':'빈 작품 칸'}/>;}
export function PaintGallery({paint,onLoad,disabled}:{paint:string[];onLoad:(p:string[])=>void;disabled:boolean}){
 const [works,setWorks]=useState<Work[]>([null,null,null]),[message,setMessage]=useState('');
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))setWorks(Array.from({length:3},(_,i)=>raw[i]&&unpackPaint(raw[i].paint)?{paint:packPaint(upgradePaint(unpackPaint(raw[i].paint)!)),date:typeof raw[i].date==='string'?raw[i].date:''}:null));}catch{}},[]);
 function save(next:Work[]){try{localStorage.setItem(KEY,JSON.stringify(next));setWorks(next);setMessage('이 기기에 저장했어요.');}catch{setMessage('저장 공간이 부족하거나 저장할 수 없는 기기예요.');}}
 return <details className="extra-tools artwork-gallery"><summary>내 작품 · 3칸</summary><p>이 기기에만 저장돼요. 불러온 뒤에도 자유롭게 덧칠할 수 있어요.</p>{works.map((w,i)=><div className="artwork-slot" key={i}><Thumbnail work={w}/><strong>작품 {i+1}</strong><div><button disabled={disabled} onClick={()=>save(works.map((v,j)=>i===j?{paint:packPaint(paint),date:new Date().toLocaleDateString('ko-KR')}:v))}>{w?'지금 색칠로 바꾸기':'지금 색칠 저장'}</button><button disabled={disabled||!w} onClick={()=>{const p=w&&unpackPaint(w.paint);if(p){onLoad(upgradePaint(p));setMessage('작품을 불러왔어요. 되돌리기로 이전 색칠로 돌아갈 수 있어요.');}}}>불러오기</button><button disabled={!w} onClick={()=>save(works.map((v,j)=>i===j?null:v))}>지우기</button></div></div>)}<p role="status">{message}</p></details>;
}
