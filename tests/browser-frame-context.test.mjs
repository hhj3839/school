import assert from 'node:assert/strict';
import {test} from 'node:test';
import {frameContext,frameCase} from './browser-frame-context.mjs';
const tab={id:1,windowId:2,active:true},window={id:2,focused:true,state:'normal'};
test('Chrome context, not document focus emulation, determines foreground comparison',()=>{
 assert.equal(frameContext({...tab,active:false},window).foregroundComparable,false);
 assert.equal(frameContext(tab,{...window,state:'minimized'}).foregroundComparable,false);
 assert.equal(frameContext(tab,{...window,focused:false}).foregroundComparable,true);
 assert.throws(()=>frameContext(tab,{...window,id:3}));
});
test('reject invalid/mixed conditions instead of reporting a misleading FPS pass',()=>{
 const context=frameContext(tab,window),samples=[{fps:30,width:1024,height:768}];
 assert.equal(frameCase(context,context,samples).minFps,30);
 assert.throws(()=>frameCase(context,frameContext({...tab,active:false},window),samples));
 assert.throws(()=>frameCase(context,context,[...samples,{fps:30,width:768,height:1024}]));
 assert.throws(()=>frameCase(context,context,[]));
});
