const byId = id => document.getElementById(id);
const form = byId('access'), status = byId('status'), date = byId('date');
let days = [], key = '';
const summary = [['visit','방문'],['played','실제 플레이'],['boss_won','보스 격파']];
const details = [['workshop','공방 진입'],['sample_play','예시 무기로 플레이'],['created_play','직접 만든 무기로 플레이'],
  ['boss_phase_two','보스 2페이즈'],['craft_started','무기 제작 시작'],['craft_ready','무기 완성'],
  ['craft_failed','무기 제작 실패'],['craft_unconfirmed','제작 결과 미확인'],['connection_failed','공방 연결 실패'],['dots_all','전용 도트 전부 완성'],
  ['dots_some','일부 도트 완성'],['dots_failed','전용 도트 불러오기 실패']];

function fill(container, items, data) {
  container.replaceChildren(...items.map(([name,label]) => {
    const item = document.createElement('div'), title = document.createElement('dt'), number = document.createElement('dd');
    title.textContent = label;
    number.textContent = new Intl.NumberFormat('ko-KR').format(data[name] || 0);
    item.append(title,number);
    return item;
  }));
}

function render() {
  const data = days.find(entry => entry.date === date.value);
  if (!data) return;
  fill(byId('summary'),summary,data);
  fill(byId('details'),details,data);
}

async function refresh() {
  status.textContent = '집계를 확인하고 있어요…';
  const buttons = [form.querySelector('button'),byId('refresh')];
  buttons.forEach(button => { button.disabled = true; });
  try {
    const response = await fetch('/api/exhibit/metrics/summary',{headers:{Authorization:'Bearer ' + key},cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || '집계에 연결하지 못했어요.');
    days = data.days;
    const previous = date.value;
    date.replaceChildren(...days.map(day => new Option(day.date,day.date)));
    if (days.some(day => day.date === previous)) date.value = previous;
    render();
    form.hidden = true;
    byId('overview').hidden = false;
    status.textContent = '방금 업데이트했어요.';
  } catch (error) { status.textContent = error.message; }
  finally { buttons.forEach(button => { button.disabled = false; }); }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  key = byId('key').value.trim();
  refresh();
});
date.addEventListener('change',render);
byId('refresh').addEventListener('click',refresh);
