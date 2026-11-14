const fixedHost = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ts\.net$/i;

function fixedEntryTarget(origin, requestUrl, {hostPoster = false} = {}) {
  if (!fixedHost.test(origin || '')) return null;
  const { pathname, searchParams } = requestUrl;

  if (pathname === '/exhibit.html') {
    const presentation = searchParams.get('presentation') === 'f-ma';
    if (hostPoster && !presentation) return null;
    const workshop = searchParams.get('screen') === 'workshop' ? '?screen=workshop' : '';
    return origin + '/exhibit.html' + workshop + (hostPoster && presentation ? (workshop ? '&' : '?') + 'presentation=f-ma' : '');
  }

  if (['/', '/index.html', '/start.html'].includes(pathname)) {
    const exhibit = searchParams.get('mode') === 'exhibit' ? '?mode=exhibit' : '';
    const presentation = exhibit && searchParams.get('presentation') === 'f-ma';
    if (hostPoster && exhibit && !presentation) return null;
    return origin + '/start.html' + exhibit + (hostPoster && presentation ? '&presentation=f-ma' : '');
  }

  return null;
}

module.exports = { fixedEntryTarget };
