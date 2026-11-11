// Return stable categories instead of exposing a provider's raw response.
function classify(payload, status) {
  const detail = JSON.stringify(payload);
  if (status === 402 || /insufficient[_ -]?(?:credit|balance|quota)|credit(?:s)? (?:exhausted|depleted)|out of credits|credit limit|잔액.{0,12}부족|크레딧.{0,12}(?:부족|소진)/i.test(detail)) return 'credits';
  if (/error code:\s*1010|region|country|geo.?block|ip address|ip (?:is )?(?:blocked|denied|not allowed)/i.test(detail)) return 'network';
  if (status === 401 || /expired|revoked|invalid.?token|invalid.?api.?key|api.?key.?invalid|invalid.?key|authentication|unauthori[sz]ed|만료|유효하지/i.test(detail)) return 'credential';
  if (/model.{0,60}(?:permission|access|restricted|disabled|denied|not enabled|not available)|permission.{0,25}model|모델.{0,12}권한/i.test(detail)) return 'model';
  return 'access';
}

const messages = {
  credits: 'ChatKHU 크레딧이 부족해 그림을 분석할 수 없어. 그림은 그대로 남아 있어.',
  network: 'ChatKHU가 게임 서버의 접속을 허용하지 않아. 그림은 그대로 남아 있어.',
  credential: 'ChatKHU가 게임 서버의 API 키를 거절했어. 그림은 그대로 남아 있어.',
  model: 'ChatKHU에서 현재 그림 분석 모델을 사용할 권한이 없어. 그림은 그대로 남아 있어.',
  access: 'ChatKHU가 그림 분석 요청을 거절했어. 그림은 그대로 남아 있어.',
};

function message(reason) {
  return messages[reason] || messages.access;
}

module.exports = { classify, message };
