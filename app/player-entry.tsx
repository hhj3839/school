'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
import {ArrowRight,Gamepad2} from 'lucide-react';
import {readBrowserStorage} from './browser-storage';
const PlayerContext=createContext('');
export const usePlayerName=()=>useContext(PlayerContext);
export function PlayerEntry({children}:{children:ReactNode}){
 const [name,setName]=useState(()=>(readBrowserStorage('arcade-name',true)||'').trim().slice(0,12)),[draft,setDraft]=useState('');


 if(!name)return <main className="arcade-shell"><header className="arcade-brand"><Gamepad2/> 꼭꼭 아지트</header><section className="arcade-entry"><div className="entry-friend"><Gamepad2 size={64}/></div><span className="arcade-step">1 · 이름 쓰기</span><h1>참가자 등록</h1><p>이름 또는 별명 입력</p><form onSubmit={e=>{e.preventDefault();const value=draft.trim().slice(0,12);if(!value)return;try{sessionStorage.setItem('arcade-name',value);}catch{}setName(value);}}><label htmlFor="arcade-name">내 이름이나 별명</label><input id="arcade-name" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={12} autoComplete="off" placeholder="이름 입력" required/><button className="arcade-enter" disabled={!draft.trim()}>입장 <ArrowRight size={24}/></button></form><small>이름 유지</small></section></main>;
 return <PlayerContext.Provider value={name}>{children}</PlayerContext.Provider>;
}
