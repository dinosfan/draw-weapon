function doPost(event) {
  const settings = PropertiesService.getScriptProperties();
  const secret = settings.getProperty('EXHIBIT_ISSUES_WEBHOOK_SECRET') || '';
  const contents = event?.postData?.contents || '';
  if (!/^[a-f0-9]{64}$/.test(secret) || !contents || contents.length > 6000) return reply(false);

  let input;
  try { input = JSON.parse(contents); } catch { return reply(false); }
  if (!matches(input?.secret, secret)) return reply(false);

  const {time, screen, comment} = input;
  if (typeof time !== 'string' || !Number.isFinite(Date.parse(time)) ||
      !['start', 'workshop', 'reveal', 'battle'].includes(screen) ||
      typeof comment !== 'string' || !comment.trim() || comment.length > 800) return reply(false);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return reply(false);
  try {
    const spreadsheet = SpreadsheetApp.openById(settings.getProperty('EXHIBIT_ISSUES_SHEET_ID'));
    const sheet = spreadsheet.getSheetByName('전시 오류 제보');
    if (!sheet) return reply(false);
    // The prefix stores visitor text literally even when it begins with a formula marker.
    sheet.appendRow([new Date(time), screen, "'" + comment]);
    SpreadsheetApp.flush();
    return reply(true);
  } catch {
    return reply(false);
  } finally {
    lock.releaseLock();
  }
}

function matches(value, secret) {
  if (typeof value !== 'string' || value.length !== secret.length) return false;
  let difference = 0;
  for (let index = 0; index < secret.length; index++) {
    difference |= value.charCodeAt(index) ^ secret.charCodeAt(index);
  }
  return difference === 0;
}

function reply(saved) {
  return ContentService.createTextOutput(JSON.stringify({saved})).setMimeType(ContentService.MimeType.JSON);
}
