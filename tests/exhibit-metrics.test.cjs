const assert = require('node:assert/strict');
const {Readable} = require('node:stream');
const test = require('node:test');
const {createMetrics} = require('../server/exhibit-metrics.cjs');

test('the opening time excludes earlier events and hides earlier days from the operator', async () => {
  const startAt = '2026-11-19T00:30:00+09:00';
  let clock = Date.parse(startAt) - 1;
  const stored = [{date:'2026-11-19',visit:0}, {date:'2026-11-18',visit:4}];
  const key = 'test-operator';
  const metrics = createMetrics({startAt, now:() => clock, accessKey:key,
    url:'https://script.google.com/macros/s/metrics-test/exec', secret:'a'.repeat(64),
    fetchImpl:async (_url,{body}) => {
      const {action} = JSON.parse(body);
      if (action === 'metrics_summary') return Response.json({days:stored});
      stored[0].visit++;
      return Response.json({saved:true});
    },
  });
  const sendVisit = () => metrics.collect(Readable.from([Buffer.from(JSON.stringify({
    event:'visit', visitor:'f'.repeat(32),
  }))]),null,(status,data) => [status,data]);
  const summary = () => metrics.dashboard({headers:{authorization:'Bearer ' + key}},null,(status,data) => {
    assert.equal(status,200);
    return data.days.map(day => day.visit);
  });

  assert.deepEqual(await sendVisit(),[202,{saved:false}]);
  assert.deepEqual(await summary(),[0,0]);
  assert.equal(stored[1].visit,4);
  clock++;
  assert.deepEqual(await sendVisit(),[200,{saved:true}]);
  assert.deepEqual(await summary(),[1,0]);
});
