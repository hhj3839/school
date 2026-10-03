import {env} from 'cloudflare:workers';
export async function authorizedTeacher(req:Request){
 const secret=(env as unknown as {TEACHER_KEY?:string}).TEACHER_KEY,key=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!secret||!key||key.length>200)return false;
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([hash(secret),hash(key)]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
}
