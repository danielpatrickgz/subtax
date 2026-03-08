function buildAssSubtitles(segments, style) {
  const alignment = style.position === 'center' ? 5 : 2;
  const fontColor = assColor(style.fontColor);
  const outlineColor = assColor(style.outlineColor);
  const backColor = assColor(style.backgroundColor === 'transparent' ? '#00000000' : style.backgroundColor);

  const header = `[Script Info]
Title: Subtax subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily || 'Arial'},64,${fontColor},${assColor(style.highlightColor)},${outlineColor},${backColor},1,0,0,0,100,100,0,0,1,3,0,${alignment},40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const events = segments.map((segment) => {
    const lineText = segment.lines.join('\\N').replace(/,/g, '\\,');
    return `Dialogue: 0,${toAssTime(segment.start)},${toAssTime(segment.end)},Default,,0,0,0,,${lineText}`;
  });

  return `${header}\n${events.join('\n')}\n`;
}

function toAssTime(seconds) {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  let cs = Math.round((total - Math.floor(total)) * 100);
  let sec = s;
  let min = m;
  let hour = h;

  if (cs === 100) {
    cs = 0;
    sec += 1;
    if (sec === 60) {
      sec = 0;
      min += 1;
      if (min === 60) {
        min = 0;
        hour += 1;
      }
    }
  }

  return `${hour}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function assColor(hex = '#FFFFFF') {
  const cleaned = hex.replace('#', '');

  if (cleaned.length === 8) {
    const r = cleaned.slice(0, 2);
    const g = cleaned.slice(2, 4);
    const b = cleaned.slice(4, 6);
    const a = cleaned.slice(6, 8);
    const assAlpha = (255 - parseInt(a, 16)).toString(16).padStart(2, '0').toUpperCase();
    return `&H${assAlpha}${b}${g}${r}`;
  }

  const r = cleaned.slice(0, 2);
  const g = cleaned.slice(2, 4);
  const b = cleaned.slice(4, 6);
  return `&H00${b}${g}${r}`;
}

function escapePath(filePath) {
  return filePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/,/g, '\\,');
}

module.exports = {
  buildAssSubtitles,
  toAssTime,
  assColor,
  escapePath
};
