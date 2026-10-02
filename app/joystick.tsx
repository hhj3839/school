'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';

export function HeightControls({disabled,onMove,onStep}:{disabled:boolean;onMove:(z:number)=>void;onStep:(z:number)=>void}){
 const active=useRef<number|null>(null),direction=useRef(0),held=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),callback=useRef({onMove,onStep});callback.current={onMove,onStep};
 function stop(tap=false){const wasActive=active.current!==null,z=direction.current,long=held.current;active.current=null;held.current=false;if(timer.current!==null)clearTimeout(timer.current);timer.current=null;callback.current.onMove(0);if(tap&&wasActive&&!long)callback.current.onStep(z);}
 function start(id:number,z:number){if(disabled||active.current!==null)return;active.current=id;direction.current=z;held.current=false;timer.current=setTimeout(()=>{held.current=true;callback.current.onMove(z);},250);}
 useEffect(()=>{if(disabled)stop();},[disabled]);
 useEffect(()=>{const cancel=()=>stop();window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);return()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);stop();};},[]);
 return <div className="height-controls" aria-label="높이 조절">{([[1,'▲ 올라가기'],[-1,'▼ 내려가기']] as const).map(([z,label])=><button key={z} disabled={disabled} onPointerDown={e=>{if(active.current!==null)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);start(e.pointerId,z);}} onPointerUp={e=>{if(active.current===e.pointerId)stop(true);}} onPointerCancel={e=>{if(active.current===e.pointerId)stop();}} onLostPointerCapture={e=>{if(active.current===e.pointerId)stop();}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)start(-1,z);}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')stop(true);}} onBlur={()=>stop()}>{label}</button>)}<small>톡: 조금 · 꾹: 계속</small></div>;
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
