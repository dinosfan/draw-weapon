(() => {
  const production = 'https://draw-weapon-khu-2026.onrender.com';
  const direct = 'https://node.taila8bbe3.ts.net';
  const url = new URL(location.href);
  const params = url.searchParams;
  if (params.has('presentation') || ![production,direct].includes(url.origin)) return;
  if (!url.pathname.endsWith('/exhibit.html') && params.get('mode') !== 'exhibit') return;

  const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
  const storageKey = 'draw-weapon:exhibit:visitor';
  const valid = id => typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
  const carried = /^#exhibit-visitor=([a-f0-9]{32})$/.exec(url.hash)?.[1];
  let visitor = carried;
  try {
    const previous = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!visitor && previous?.date === today && valid(previous.id)) visitor = previous.id;
  } catch {}
  visitor ||= Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,'0')).join('');
  try { localStorage.setItem(storageKey, JSON.stringify({date:today,id:visitor})); } catch {}
  if (carried) history.replaceState(history.state, '', url.pathname + url.search);

  const sent = new Set();
  function mark(event) {
    if (sent.has(event)) return;
    sent.add(event);
    fetch(production + '/api/exhibit/metrics/event',{
      method:'POST', body:JSON.stringify({event,visitor}), keepalive:true, credentials:'omit',
      signal:AbortSignal.timeout(15000),
    }).then(response => { if (!response.ok) sent.delete(event); }).catch(() => sent.delete(event));
  }
  function carry(destination) {
    const target = new URL(destination, location.href);
    if (target.origin !== url.origin) target.hash = 'exhibit-visitor=' + visitor;
    return target.href;
  }
  window.ExhibitMetrics = {mark,carry};
  if (url.pathname.endsWith('/start.html')) mark('visit');
})();
