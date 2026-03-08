const test = require('node:test');
const assert = require('node:assert/strict');
const assUtils = require('../app/backend/video-processing/assUtils');

test('ass color conversion supports rgba hex and opaque hex', () => {
  assert.equal(assUtils.assColor('#FFFFFF'), '&H00FFFFFF');
  assert.equal(assUtils.assColor('#00000080'), '&H7F000000');
});

test('ass subtitle builder includes dialogue lines', () => {
  const ass = assUtils.buildAssSubtitles(
    [{ start: 0, end: 1.2, lines: ['hello world'] }],
    { fontFamily: 'Arial', fontColor: '#FFFFFF', highlightColor: '#FFD60A', outlineColor: '#000000', backgroundColor: '#00000080', position: 'bottom' }
  );

  assert.ok(ass.includes('[Events]'));
  assert.ok(ass.includes('Dialogue: 0,0:00:00.00,0:00:01.20'));
});
