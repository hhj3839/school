'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {ArrowRight,Gamepad2} from 'lucide-react';
import {ChameleonFriend} from './playground-friends';
const PlayerContext=createContext('');
export const usePlayerName=()=>useContext(PlayerContext);
export function PlayerEntry({children}:{children:ReactNode}){
 const [name,setName]=useState(''),[draft,setDraft]=useState(''),[loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const saved=sessionStorage.getItem('arcade-name')||'';setName(saved.trim().slice(0,12));}catch{}setLoaded(true);},[]);
 if(!loaded)return <main className="arcade-shell"><p>놀이방을 열고 있어요…</p></main>;
 if(!name)return <main className="arcade-shell"><header className="arcade-brand"><Gamepad2/> 꼭꼭 아지트</header><section className="arcade-entry"><div className="entry-friend"><ChameleonFriend/></div><span className="arcade-step">1 · 이름 쓰기</span><h1>반가워요!</h1><p>어떤 이름으로 함께 놀까요?</p><form onSubmit={e=>{e.preventDefault();const value=draft.trim().slice(0,12);if(!value)return;try{sessionStorage.setItem('arcade-name',value);}catch{}setName(value);}}><label htmlFor="arcade-name">내 이름이나 별명</label><input id="arcade-name" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={12} autoComplete="off" placeholder="이름을 써 주세요" required/><button className="arcade-enter" disabled={!draft.trim()}>입장하기 <ArrowRight size={24}/></button></form><small>이름은 한 번만 쓰면 돼요.</small></section></main>;
 return <PlayerContext.Provider value={name}>{children}</PlayerContext.Provider>;
}
