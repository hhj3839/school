const backend = 'https://kkokkkok-hideout.hhj3839.chatgpt.site';
const endpoints = new Set(['room', 'blocks', 'race', 'classroom']);

// Keep browser traffic same-origin while retaining the existing server's
// origin checks, player tokens, teacher authentication and rate limits.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'https://localhost');
  const endpoint = url.searchParams.get('endpoint');
  if (!endpoints.has(endpoint)) return res.status(404).json({error:'없는 게임 경로예요.'});
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  const origin = req.headers.origin;
  const host = req.headers.host;
  if ((origin && origin !== `https://${host}`) || (req.method === 'POST' && endpoint === 'classroom' && !origin)) {
    return res.status(403).json({error:'허용되지 않은 요청이에요.'});
  }
  url.searchParams.delete('endpoint');
  const headers = {'Content-Type':'application/json', 'Origin':backend};
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  const body = req.method === 'POST' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})) : undefined;
  if (body && Buffer.byteLength(body) > 1_000_000) return res.status(413).end();
  try {
    const response = await fetch(`${backend}/api/${endpoint}?${url.searchParams}`, {
      method:req.method, headers, body, redirect:'error', signal:AbortSignal.timeout(15000),
    });
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.status(response.status).send(await response.text());
  } catch {
    return res.status(502).json({error:'게임 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'});
  }
}
