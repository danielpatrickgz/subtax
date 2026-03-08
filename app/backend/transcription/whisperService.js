const fs = require('fs');

async function transcribeWithWhisperAPI(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackTranscript();
  }

  const fetch = require('node-fetch');
  const FormData = require('form-data');

  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', process.env.OPENAI_WHISPER_MODEL || 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', process.env.WHISPER_LANGUAGE || 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${body}`);
  }

  const data = await response.json();
  return normalizeWhisperResponse(data);
}

function normalizeWhisperResponse(data) {
  const words = (data.words || []).map((word, index) => ({
    id: index,
    word: word.word.trim(),
    start: Number(word.start),
    end: Number(word.end)
  }));

  return {
    text: data.text || words.map((w) => w.word).join(' '),
    duration: data.duration || (words.at(-1)?.end ?? 0),
    words
  };
}

function buildFallbackTranscript() {
  return {
    text: 'This is a sample transcript generated because OPENAI_API_KEY is not configured.',
    duration: 6,
    words: [
      { id: 0, word: 'This', start: 0.0, end: 0.4 },
      { id: 1, word: 'is', start: 0.4, end: 0.6 },
      { id: 2, word: 'a', start: 0.6, end: 0.7 },
      { id: 3, word: 'sample', start: 0.7, end: 1.2 },
      { id: 4, word: 'transcript', start: 1.2, end: 1.9 },
      { id: 5, word: 'generated', start: 1.9, end: 2.5 },
      { id: 6, word: 'because', start: 2.5, end: 3.1 },
      { id: 7, word: 'OPENAI_API_KEY', start: 3.1, end: 4.0 },
      { id: 8, word: 'is', start: 4.0, end: 4.2 },
      { id: 9, word: 'not', start: 4.2, end: 4.5 },
      { id: 10, word: 'configured.', start: 4.5, end: 6.0 }
    ]
  };
}

module.exports = {
  transcribeWithWhisperAPI,
  normalizeWhisperResponse
};
