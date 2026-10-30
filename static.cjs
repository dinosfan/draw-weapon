const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.gif':'image/gif', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav' };

function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return false; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/start.html' : pathname));
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !types[path.extname(file)]) return false;
  try {
    if (!fs.statSync(file).isFile()) return false;
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] + (/^text\//.test(types[path.extname(file)]) ? '; charset=utf-8' : ''), 'Content-Length': body.length, 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
    return true;
  } catch { return false; }
}
module.exports = { serveStatic };
