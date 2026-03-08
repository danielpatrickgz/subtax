const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSubtitleSegments } = require('../app/backend/services/subtitleEngine');

test('subtitle engine creates segments with max two lines and 42 char lines', () => {
  const transcript = {
    words: [
      { word: 'This', start: 0, end: 0.2 },
      { word: 'is', start: 0.2, end: 0.3 },
      { word: 'a', start: 0.3, end: 0.4 },
      { word: 'long', start: 0.4, end: 0.7 },
      { word: 'subtitle', start: 0.7, end: 1.0 },
      { word: 'line', start: 1.0, end: 1.2 },
      { word: 'that', start: 1.2, end: 1.4 },
      { word: 'should', start: 1.4, end: 1.6 },
      { word: 'split', start: 1.6, end: 1.8 },
      { word: 'naturally.', start: 1.8, end: 2.1 }
    ]
  };

  const segments = generateSubtitleSegments(transcript, { maxCharsPerLine: 42, maxLines: 2 });

  assert.ok(segments.length >= 1);
  segments.forEach((segment) => {
    assert.ok(segment.lines.length <= 2);
    segment.lines.forEach((line) => assert.ok(line.length <= 42));
    assert.ok(segment.end >= segment.start);
  });
});

