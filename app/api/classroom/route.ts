import { env } from 'cloudflare:workers';
import { database } from '../../../db/raw';
import { classroomState } from '../../classroom';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{return reply(await classroomState());}catch{return reply({error:'연결을 확인하고 있어요.'},503);}}
async function authorized(req:Request){
  const secret=(env as unknown as {TEACHER_KEY?:string}).TEACHER_KEY;
  const key=req.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!secret||!key||key.length>200)return false;
  const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  const [a,b]=await Promise.all([hash(secret),hash(key)]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
}
export async function POST(req:Request){try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'허용되지 않은 요청이에요.'},403);
  if(!await authorized(req))return reply({error:'선생님 비밀번호를 확인해 주세요.'},401);
  const raw=await req.text();if(raw.length>100)return reply({error:'잘못된 요청이에요.'},400);
  const {action}=JSON.parse(raw);
  if(action==='check')return reply(await classroomState());
  if(action!=='open'&&action!=='close')return reply({error:'잘못된 요청이에요.'},400);
  const db=database();
  // The switch and room invalidation commit together. Reopening never revives old rooms.
  await db.batch([
    db.prepare('UPDATE classroom SET opened=?,revision=revision+1 WHERE id=1').bind(action==='open'?1:0),
    db.prepare('UPDATE rooms SET expires=0'),
  ]);
  return reply(await classroomState());
}catch{return reply({error:'변경하지 못했어요. 다시 확인해 주세요.'},503);}}
