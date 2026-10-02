import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('저장소를 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');return env.DB;}
