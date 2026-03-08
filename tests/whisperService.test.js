const test = require('node:test');
const assert = require('node:assert/strict');
const { transcribeWithWhisperAPI } = require('../app/backend/transcription/whisperService');

test('whisper service returns fallback transcript when API key is missing', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const transcript = await transcribeWithWhisperAPI(__filename);

  assert.ok(transcript.text.includes('sample transcript'));
  assert.ok(Array.isArray(transcript.words));
  assert.ok(transcript.words.length > 0);

  if (original) process.env.OPENAI_API_KEY = original;
});
