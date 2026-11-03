import assert from 'node:assert/strict';
import {readBrowserStorage,readGameSession,readRoomInvite} from '../app/browser-storage.ts';

assert.equal(readBrowserStorage('name'),null);
assert.equal(readGameSession('session'),null);
assert.equal(readRoomInvite(),'');

const session=new Map(),local=new Map();
globalThis.window={
  sessionStorage:{getItem:key=>session.get(key)??null},
  localStorage:{getItem:key=>local.get(key)??null},
  location:{search:'?room=ab23cd'},
};
try{
  local.set('name','local');session.set('name','session');
  assert.equal(readBrowserStorage('name'),'local');
  assert.equal(readBrowserStorage('name',true),'session');
  assert.equal(readRoomInvite(),'AB23CD');
  for(const value of ['{','null','{}',JSON.stringify({code:'ABC234',id:'p',token:''}),JSON.stringify({code:'bad',id:'p',token:'test-token'}),JSON.stringify({code:'ABC234',token:'test-token'})]){
    session.set('session',value);assert.equal(readGameSession('session'),null);
  }
  const saved={code:'ABC234',id:'p',token:'test-token'};
  session.set('session',JSON.stringify(saved));assert.deepEqual(readGameSession('session'),saved);
  window.sessionStorage.getItem=()=>{throw new Error('Storage denied');};
  assert.equal(readGameSession('session'),null);
  assert.equal(readBrowserStorage('name',true),null);
}finally{delete globalThis.window;}
console.log('PASS: server-safe reads, storage isolation, invite normalization, session validation and denied storage');
