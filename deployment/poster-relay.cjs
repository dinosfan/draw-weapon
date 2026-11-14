const {Readable, Transform} = require('node:stream');
const {pipeline} = require('node:stream/promises');
const {serveStatic} = require('../static.cjs');

const tailscaleOrigin = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ts\.net\/?$/i;
const imageRoute = /^\/assets\/vfx\/generated\/[a-f0-9]{64}\.png$/;
const pollRoute = /^\/api\/ai\/(?:analyze-jobs|effects\/jobs)\/[a-f0-9]{32}$/;
const submitRoutes = new Map([
  ['/api/ai/analyze-jobs', 1_450_000],
  ['/api/ai/effects', 1_500_000],
]);
const offline = {available:false, remaining:0, limit:0, code:'EXHIBIT_OFFLINE'};
const offlineError = {code:offline.code, error:'실시간 제작 서버에 연결할 수 없어요. 예시 무기로 보스전에 도전할 수 있어요.'};
const oversized = {error:'이미지 입력 용량을 초과했어요.'};
const jsonType = /^application\/json(?:\s*;|$)/i;
const pngType = /^image\/png(?:\s*;|$)/i;
const maxImageBytes = 12 * 1024 * 1024;
const maxJobReplyBytes = 2 * 1024 * 1024;
const maxAvailabilityBytes = 16_384;

function cookieForUpstream(req) {
  const match = /(?:^|;\s*)dw_exhibit=([a-f0-9]{48})(?:;|$)/.exec(req.headers.cookie || '');
  return match ? 'dw_exhibit=' + match[1] : null;
}

function replyCookie(headers) {
  for (const cookie of headers.getSetCookie()) {
    const match = /^dw_exhibit=([a-f0-9]{48})(?:;|$)/.exec(cookie);
    if (match) return 'dw_exhibit=' + match[1] + '; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600';
  }
  return null;
}

function contentTooLarge(headers, maxBytes) {
  const length = typeof headers.get === 'function' ? headers.get('content-length') : headers['content-length'];
  return length !== null && Number(length) > maxBytes;
}

function boundedStream(maxBytes) {
  let bytes = 0;
  return new Transform({
    transform(chunk, _encoding, next) {
      bytes += chunk.length;
      if (bytes > maxBytes) next(Error('Upstream response exceeds limit'));
      else next(null, chunk);
    },
  });
}

async function readAvailability(response) {
  let bytes = 0;
  const parts = [];
  for await (const chunk of response.body) {
    bytes += chunk.byteLength;
    if (bytes > maxAvailabilityBytes) throw Error('Invalid availability response');
    parts.push(chunk);
  }
  const info = JSON.parse(Buffer.concat(parts).toString('utf8'));
  const {available, remaining, limit, code} = info;
  if (typeof available !== 'boolean' || !Number.isSafeInteger(remaining) || !Number.isSafeInteger(limit) ||
      remaining < 0 || limit < remaining) throw Error('Invalid availability response');
  const codes = ['EXHIBIT_LIMIT', 'EXHIBIT_CREDITS', 'EXHIBIT_UNAVAILABLE'];
  return {available, remaining, limit, ...(!available ? {code:codes.includes(code) ? code : 'EXHIBIT_UNAVAILABLE'} : {})};
}

function createPosterRelay({origin, fetchImpl = fetch, serveLocal = serveStatic} = {}) {
  if (origin && !tailscaleOrigin.test(origin)) throw Error('Poster relay origin must be an HTTPS Tailscale Funnel origin');
  const base = origin?.replace(/\/$/, '');

  return async function posterRelay(req, res, url, json) {
    const pathname = url.pathname;
    const method = req.method;
    const availability = method === 'GET' && pathname === '/api/exhibit/availability';
    const image = (method === 'GET' || method === 'HEAD') && imageRoute.test(pathname);
    const exhibit = req.headers['x-draw-weapon-mode'] === 'exhibit';
    const uploadLimit = exhibit && method === 'POST' ? submitRoutes.get(pathname) : undefined;
    const poll = exhibit && method === 'GET' && pollRoute.test(pathname);
    if (!availability && !image && !uploadLimit && !poll) return false;
    if (image && serveLocal(req, res)) return true;

    function sendFailure() {
      if (res.destroyed) return;
      if (res.headersSent) return res.destroy();
      if (availability) return json(200, offline);
      if (image) return json(404, {error:'도트 파일을 찾을 수 없어요.'});
      return json(503, offlineError);
    }
    if (!base) {
      if (uploadLimit) req.resume();
      sendFailure();
      return true;
    }

    if (uploadLimit) {
      if (contentTooLarge(req.headers, uploadLimit)) {
        req.resume();
        json(413, oversized);
        return true;
      }
      if (!jsonType.test(req.headers['content-type'] || '')) {
        req.resume();
        json(415, {error:'JSON 입력을 보내 주세요.'});
        return true;
      }
    }

    const abort = new AbortController();
    const cancel = () => { if (!res.writableEnded) abort.abort(); };
    res.once('close', cancel);
    const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(availability ? 3_000 : 12_000)]);
    let uploadOversized = false;
    async function* upload() {
      let bytes = 0;
      for await (const chunk of req.iterator({destroyOnReturn:false})) {
        bytes += chunk.length;
        if (bytes > uploadLimit) {
          uploadOversized = true;
          req.resume();
          throw Error('Upload exceeds limit');
        }
        yield chunk;
      }
    }

    try {
      const headers = new Headers({Accept:image ? 'image/png' : 'application/json'});
      if (uploadLimit || poll) {
        headers.set('X-Draw-Weapon-Mode', 'exhibit');
        const cookie = cookieForUpstream(req);
        if (cookie) headers.set('Cookie', cookie);
      }
      if (uploadLimit) headers.set('Content-Type', 'application/json');
      const response = await fetchImpl(base + pathname, {
        method, headers, redirect:'manual', signal,
        ...(uploadLimit ? {body:upload(), duplex:'half'} : {}),
      });
      const validStatus = image || availability ? response.status === 200 :
        response.ok || (response.status >= 400 && response.status < 600);
      const type = response.headers.get('content-type') || '';
      const maxBytes = image ? maxImageBytes : availability ? maxAvailabilityBytes : maxJobReplyBytes;
      if (!validStatus || !(image ? pngType : jsonType).test(type) || contentTooLarge(response.headers, maxBytes)) {
        await response.body?.cancel();
        sendFailure();
        return true;
      }
      if (availability) {
        json(200, await readAvailability(response));
        return true;
      }
      const outgoing = {'Content-Type':image ? 'image/png' : 'application/json; charset=utf-8', 'Cache-Control':'no-store'};
      const cookie = !image && replyCookie(response.headers);
      if (cookie) outgoing['Set-Cookie'] = cookie;
      res.writeHead(response.status, outgoing);
      if (method === 'HEAD' || !response.body) res.end();
      else await pipeline(Readable.fromWeb(response.body), boundedStream(maxBytes), res, {signal});
    } catch {
      if (uploadLimit) req.resume();
      if (uploadOversized && !res.headersSent && !res.destroyed) json(413, oversized);
      else sendFailure();
    } finally {
      res.removeListener('close', cancel);
    }
    return true;
  };
}

module.exports = {createPosterRelay};
