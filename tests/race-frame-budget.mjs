import './resolve-ts.mjs';
import assert from 'node:assert/strict';
import {FrameBudget} from '../app/race/frame-budget.ts';

function window(budget,start,gap,work,ratio){
 let result;
 for(let now=start;now<=start+1200;now+=gap)result=budget.sample(now,gap,work,ratio,.7)||result;
 return result;
}
const stalled=new FrameBudget();stalled.reset(1000);
let result=stalled.sample(4000,3000,2,.7,.7);
assert.equal(result.ratio,.7,'a throttled browser must not blur the game');
assert.equal(result.stalls,1);assert.equal(result.cpuMs,2);
const costly=new FrameBudget();costly.reset(4000);
result=window(costly,4050,50,30,.7);
assert.ok(result.ratio<.7,'sustained expensive rendering reduces resolution');
const gpuBound=new FrameBudget();gpuBound.reset(4000);
result=window(gpuBound,4050,50,2,.7);
assert.ok(result.ratio<.7,'asynchronous GPU pressure still reduces resolution');
const recovered=new FrameBudget();recovered.reset(8000);
result=window(recovered,8000+1000/30,1000/30,3,.4);
assert.ok(result.ratio>.4,'a recovered renderer can regain detail');
const limited=new FrameBudget();limited.reset(12000);
result=window(limited,12000+1000/30,1000/30,3,.7);
assert.equal(result.ratio,.7,'respect the low-power resolution ceiling');
console.log('PASS: scheduling gaps, expensive frames, quality recovery and ceiling');
