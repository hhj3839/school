// Entry/game components mount after ClassroomGate's browser-side status check.
// Keep reads guarded as these helpers are also safe to import on the server.
export function readBrowserStorage(key:string,session=false):string|null {
  if(typeof window==='undefined')return null;
  try{return (session?window.sessionStorage:window.localStorage).getItem(key);}catch{return null;}
}

export function readRoomInvite():string {
  if(typeof window==='undefined')return '';
  return (new URLSearchParams(window.location.search).get('room')||'').toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);
}

export function readGameSession(key:string):{code:string;id:string;token:string}|null {
  try{
    const value=JSON.parse(readBrowserStorage(key,true)||'null');
    return value&&typeof value.id==='string'&&typeof value.token==='string'&&value.token&&typeof value.code==='string'&&/^[A-Z2-9]{6}$/.test(value.code)?value:null;
  }catch{return null;}
}
