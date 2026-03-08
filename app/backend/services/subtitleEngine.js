function generateSubtitleSegments(transcript, options = {}) {
  const maxCharsPerLine = options.maxCharsPerLine || 42;
  const maxLines = options.maxLines || 2;
  const maxChars = maxCharsPerLine * maxLines;
  const maxDuration = options.maxDuration || 4.5;

  const words = transcript.words || [];
  if (!words.length) return [];

  const segments = [];
  let current = [];

  words.forEach((wordObj, index) => {
    const token = wordObj.word;
    const candidateText = [...current, wordObj].map((w) => w.word).join(' ');
    const shouldBreakByLength = candidateText.length > maxChars;
    const shouldBreakByPunctuation = /[.!?]$/.test(current.at(-1)?.word || '');
    const shouldBreakByDuration = current.length > 0 && (wordObj.end - current[0].start > maxDuration);

    if (current.length && (shouldBreakByLength || shouldBreakByPunctuation || shouldBreakByDuration)) {
      segments.push(toSegment(current, maxCharsPerLine));
      current = [];
    }

    current.push(wordObj);

    if (index === words.length - 1 && current.length) {
      segments.push(toSegment(current, maxCharsPerLine));
    }
  });

  return segments;
}

function toSegment(words, maxCharsPerLine) {
  const text = words.map((w) => w.word).join(' ');
  const lines = splitIntoTwoLines(text, maxCharsPerLine);

  return {
    start: words[0].start,
    end: words[words.length - 1].end,
    text,
    lines,
    words
  };
}

function splitIntoTwoLines(text, maxCharsPerLine) {
  if (text.length <= maxCharsPerLine) return [text];

  const words = text.split(' ');
  const midpoint = Math.ceil(words.length / 2);
  let line1 = words.slice(0, midpoint).join(' ');
  let line2 = words.slice(midpoint).join(' ');

  if (line1.length > maxCharsPerLine) {
    const overflow = line1.split(' ');
    while (line1.length > maxCharsPerLine && overflow.length > 1) {
      const moved = overflow.pop();
      line1 = overflow.join(' ');
      line2 = `${moved} ${line2}`.trim();
    }
  }

  return [line1, line2].filter(Boolean);
}

module.exports = {
  generateSubtitleSegments
};
