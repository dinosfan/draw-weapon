const fixedHost = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ts\.net$/i;

function fixedEntryTarget(origin, requestUrl, {hostPoster = false} = {}) {
  if (!fixedHost.test(origin || '')) return null;
  const { pathname, searchParams } = requestUrl;

  if (pathname === '/exhibit.html') {
    if (hostPoster) return null;
    const workshop = searchParams.get('screen') === 'workshop' ? '?screen=workshop' : '';
    return origin + '/exhibit.html' + workshop;
  }

  if (['/', '/index.html', '/start.html'].includes(pathname)) {
    const exhibit = searchParams.get('mode') === 'exhibit' ? '?mode=exhibit' : '';
    if (hostPoster && exhibit) return null;
    return origin + '/start.html' + exhibit;
  }

  return null;
}

module.exports = { fixedEntryTarget };
