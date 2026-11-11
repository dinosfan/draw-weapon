const path = require('node:path');
const {execFile} = require('node:child_process');

function request(url, options = {}) {
  if (!url.startsWith('https://factchat-cloud.mindlogic.ai/v1/gateway/')) return fetch(url, options);
  options.signal?.throwIfAborted();
  const input = JSON.stringify({
    url,
    method:options.method || 'GET',
    headers:Object.fromEntries(new Headers(options.headers)),
    body:options.body ?? null,
  });
  return new Promise((resolve, reject) => {
    const child = execFile(process.env.PYTHON_BIN || 'python3', [
      path.join(__dirname, 'chatkhu-request.py'),
    ], {
      encoding:'buffer', maxBuffer:25 * 1024 * 1024, signal:options.signal,
      timeout:180000, windowsHide:true,
    }, (error, stdout) => {
      if (error) {
        reject(options.signal?.aborted ? options.signal.reason : error.code === 28 || error.killed
          ? new DOMException('ChatKHU request timed out', 'TimeoutError')
          : new TypeError('Could not contact ChatKHU'));
        return;
      }
      try {
        const end = stdout.indexOf(10);
        const meta = JSON.parse(stdout.subarray(0, end).toString('utf8'));
        const body = [204, 205, 304].includes(meta.status) ? null : stdout.subarray(end + 1);
        const response = new Response(body, {status:meta.status, headers:meta.headers});
        if (meta.status === 403 && options.method === 'POST') {
          reportDenial(url, response.clone()).catch(() => {});
        }
        resolve(response);
      } catch {
        reject(new TypeError('Invalid ChatKHU response'));
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

function rayId(response) {
  const value = response.headers?.get?.('cf-ray');
  return /^[0-9a-f]{8,32}(?:-[A-Z]{3})?$/i.test(value || '') ? value : undefined;
}

async function responseSummary(response) {
  const raw = await response.text();
  let json;
  try { json = JSON.parse(raw); } catch {}
  const code = json?.detail?.code ?? json?.error?.code;
  const apiCode = /^[0-9]{1,6}$/.test(String(code)) ? Number(code) : undefined;
  const edge = raw.match(/error code:\s*(1\d{3})\b/i)?.[1];
  return {
    status: response.status,
    format: json ? 'json' : response.headers.get('content-type')?.includes('html') ? 'html' : 'text',
    apiCode,
    edgeCode: edge ? Number(edge) : undefined,
    ray: rayId(response),
  };
}

async function reportDenial(url, response) {
  console.warn(JSON.stringify({
    event: 'chatkhu-gateway-denial',
    route: new URL(url).pathname,
    ...await responseSummary(response),
  }));
}

async function checkGateway({key, analysisModel, imageModel}) {
  if (!key) {
    console.warn(JSON.stringify({event: 'chatkhu-gateway-check', configured: false}));
    return;
  }
  const models = 'https://factchat-cloud.mindlogic.ai/v1/gateway/models/';
  const headers = {Authorization: 'Bearer ' + key, 'User-Agent': 'DrawWeapon/1.0'};
  await Promise.all([['requests', request], ['node', fetch]].map(async ([transport, send]) => {
    try {
      const response = await send(models, {headers, signal: AbortSignal.timeout(12000)});
      const summary = await responseSummary(response.clone());
      const data = response.ok ? await response.json() : null;
      const ids = Array.isArray(data?.data) ? data.data.map(model => model.id) : [];
      console.info(JSON.stringify({
        event: 'chatkhu-gateway-check',
        transport,
        ...summary,
        ...(response.ok ? {analysisAvailable: ids.includes(analysisModel), imageAvailable: ids.includes(imageModel)} : {}),
      }));
    } catch (error) {
      console.warn(JSON.stringify({event: 'chatkhu-gateway-check', transport, error: error.name}));
    }
  }));
}

module.exports = {request,rayId,checkGateway};
