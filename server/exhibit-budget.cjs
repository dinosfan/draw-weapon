const fs = require('node:fs');
const path = require('node:path');

function createBudget({ file, limit }) {
  let providerCreditsExhausted = false;
  const capacity = Number.isSafeInteger(limit) && limit >= 0 ? limit : 40;

  function used() {
    try {
      const count = JSON.parse(fs.readFileSync(file, 'utf8')).used;
      if (!Number.isSafeInteger(count) || count < 0) throw Error('Invalid exhibit budget');
      return count;
    } catch (error) {
      if (error.code === 'ENOENT') return 0;
      throw error;
    }
  }

  function availability() {
    try {
      const remaining = Math.max(0, capacity - used());
      const code = providerCreditsExhausted ? 'EXHIBIT_CREDITS' : remaining === 0 ? 'EXHIBIT_LIMIT' : null;
      return {available:code === null, remaining, limit:capacity, ...(code ? {code} : {})};
    } catch {
      return {available:false, remaining:0, limit:capacity, code:'EXHIBIT_UNAVAILABLE'};
    }
  }

  function reserve() {
    const state = availability();
    if (!state.available) {
      const messages = {
        EXHIBIT_CREDITS:'전시 제작용 AI 크레딧이 부족해. 예시 무기로 보스전에 도전할 수 있어.',
        EXHIBIT_LIMIT:'전시의 실시간 제작 횟수가 모두 소진됐어. 예시 무기로 보스전에 도전할 수 있어.',
        EXHIBIT_UNAVAILABLE:'지금은 실시간 제작을 열 수 없어. 예시 무기로 보스전에 도전할 수 있어.',
      };
      throw Object.assign(Error(messages[state.code]), {status:state.code === 'EXHIBIT_UNAVAILABLE' ? 503 : 429, code:state.code});
    }
    try {
      fs.mkdirSync(path.dirname(file), {recursive:true});
      // Reserve before dispatching the paid request. Failed or interrupted
      // requests can still be charged by the provider, so don't release them.
      const temporary = file + '.next';
      fs.writeFileSync(temporary, JSON.stringify({used:capacity - state.remaining + 1}) + '\n', {flush:true});
      fs.renameSync(temporary, file);
    } catch {
      throw Object.assign(Error('전시 제작 기록을 저장할 수 없어. 예시 무기로 보스전에 도전할 수 있어.'), {status:503, code:'EXHIBIT_UNAVAILABLE'});
    }
  }

  return {availability, reserve, creditDenied:() => { providerCreditsExhausted = true; }};
}

module.exports = {createBudget};
