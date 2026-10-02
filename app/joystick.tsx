'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';

export function HeightControls({disabled,onMove}:{disabled:boolean;onMove:(z:number)=>void}){
 const active=useRef<number|null>(null),callback=useRef(onMove);callback.current=onMove;
 const stop=()=>{active.current=null;callback.current(0);};
 useEffect(()=>{if(disabled)stop();},[disabled]);
 useEffect(()=>{window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);callback.current(0);};},[]);
 return <div className="height-controls" aria-label="높이 조절">{([[1,'▲ 올라가기'],[-1,'▼ 내려가기']] as const).map(([z,label])=><button key={z} disabled={disabled} onPointerDown={e=>{if(active.current!==null)return;e.preventDefault();active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);callback.current(z);}} onPointerUp={e=>{if(active.current===e.pointerId)stop();}} onPointerCancel={e=>{if(active.current===e.pointerId)stop();}} onLostPointerCapture={e=>{if(active.current===e.pointerId)stop();}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();callback.current(z);}}} onKeyUp={stop} onBlur={stop}>{label}</button>)}</div>;
}

export function Joystick({disabled,onMove}:{disabled:boolean;onMove:(x:number,y:number)=>void}){
 const pointer=useRef<number|null>(null),[point,setPoint]=useState({x:0,y:0}),callback=useRef(onMove);
 callback.current=onMove;
 function stop(){pointer.current=null;setPoint({x:0,y:0});callback.current(0,0);}
 useEffect(()=>{if(disabled)stop();},[disabled]);
 useEffect(()=>{const clear=()=>stop();window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);callback.current(0,0);};},[]);
 function update(e:PointerEvent<HTMLDivElement>){const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,length=Math.hypot(x,y),scale=length>42?42/length:1;setPoint({x:x*scale,y:y*scale});callback.current(length<8?0:x*scale/42,length<8?0:y*scale/42);}
 return <div className={'joystick '+(disabled?'disabled':'')} role="group" aria-label="이동 조이스틱" aria-disabled={disabled} onPointerDown={e=>{if(disabled||pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>{if(e.pointerId===pointer.current)update(e);}} onPointerUp={e=>{if(e.pointerId===pointer.current)stop();}} onPointerCancel={e=>{if(e.pointerId===pointer.current)stop();}} onLostPointerCapture={e=>{if(e.pointerId===pointer.current)stop();}}><span className="joystick-directions" aria-hidden="true">↑<br/>←　→<br/>↓</span><span className="joystick-knob" style={{transform:`translate(${point.x}px,${point.y}px)`}}/><span className="joystick-label">{disabled?'이동 잠김':'끌어서 이동'}</span></div>;
}
