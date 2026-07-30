import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.m4a':'audio/mp4'};
const server = createServer(async (req,res) => { try { const raw = decodeURIComponent(new URL(req.url,'http://localhost').pathname); const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, ''); let path = join(root, safe); if ((await stat(path)).isDirectory()) path = join(path,'index.html'); const data = await readFile(path); res.writeHead(200,{'content-type':types[extname(path)] ?? 'application/octet-stream'}); res.end(data); } catch { res.writeHead(404); res.end('Not found'); } });
server.listen(4173,'127.0.0.1',()=>console.log('Local URL: http://127.0.0.1:4173'));
