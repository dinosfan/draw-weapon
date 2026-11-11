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
        resolve(new Response(body, {status:meta.status, headers:meta.headers}));
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

module.exports = {request,rayId};
