const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { buildAssSubtitles, escapePath } = require('./assUtils');

function probeVideo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata);
    });
  });
}

function extractAudio(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

function renderVideoWithSubtitles(videoPath, outputPath, segments, style) {
  const subtitlesPath = `${outputPath}.ass`;
  const ass = buildAssSubtitles(segments, style);
  fs.writeFileSync(subtitlesPath, ass, 'utf-8');

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-movflags +faststart'])
      .videoFilters(`ass=${escapePath(subtitlesPath)}`)
      .on('end', () => resolve({ outputPath, subtitlesPath }))
      .on('error', reject)
      .save(outputPath);
  });
}

module.exports = {
  extractAudio,
  renderVideoWithSubtitles,
  probeVideo
};
