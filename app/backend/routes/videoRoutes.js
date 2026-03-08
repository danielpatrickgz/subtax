const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { createJob, getJob, updateJob } = require('../services/jobStore');
const { transcribeWithWhisperAPI } = require('../transcription/whisperService');
const { generateSubtitleSegments } = require('../services/subtitleEngine');
const { extractAudio, renderVideoWithSubtitles, probeVideo } = require('../video-processing/ffmpegService');
const { stylePresets } = require('../services/stylePresets');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'storage', 'uploads');
const tempDir = path.join(__dirname, '..', 'storage', 'temp');
const outputDir = path.join(__dirname, '..', 'storage', 'outputs');
const dataDir = path.join(__dirname, '..', 'data');

[uploadDir, tempDir, outputDir, dataDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.mp4', '.mov', '.mkv'].includes(ext)) {
      return cb(new Error('Unsupported format. Use mp4, mov, or mkv.'));
    }
    cb(null, true);
  }
});

router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const metadata = await probeVideo(req.file.path).catch(() => ({}));
  const duration = Number(metadata?.format?.duration || 0);
  const sizeMb = req.file.size / (1024 * 1024);

  const job = createJob({
    fileName: req.file.originalname,
    uploadPath: req.file.path,
    duration,
    sizeMb
  });

  res.json({
    jobId: job.id,
    fileName: req.file.originalname,
    duration,
    sizeMb,
    status: job.status,
    styles: Object.values(stylePresets)
  });
});

router.post('/transcribe', async (req, res) => {
  const { jobId } = req.body;
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  try {
    updateJob(jobId, { status: 'transcribing', progress: 20 });

    const audioPath = path.join(tempDir, `${jobId}.wav`);
    await extractAudio(job.uploadPath, audioPath);

    const transcript = await transcribeWithWhisperAPI(audioPath);
    const transcriptPath = path.join(dataDir, `${jobId}-transcript.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));

    const next = updateJob(jobId, {
      status: 'transcribed',
      progress: 45,
      transcriptPath,
      transcript,
      steps: job.steps.map((step) => ({ ...step, done: step.key === 'upload' || step.key === 'transcribe' }))
    });

    res.json({ jobId, status: next.status, transcript });
  } catch (error) {
    updateJob(jobId, { status: 'failed', error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-subtitles', async (req, res) => {
  const { jobId, options } = req.body;
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!job.transcript) return res.status(400).json({ error: 'Run /transcribe first' });

  const segments = generateSubtitleSegments(job.transcript, options);
  const subtitlePath = path.join(dataDir, `${jobId}-segments.json`);
  fs.writeFileSync(subtitlePath, JSON.stringify(segments, null, 2));

  const next = updateJob(jobId, {
    status: 'segmented',
    progress: 65,
    subtitlePath,
    segments,
    steps: job.steps.map((step) => ({ ...step, done: step.key !== 'render' }))
  });

  res.json({ jobId, status: next.status, segments });
});

router.post('/render-video', async (req, res) => {
  const { jobId, styleId, customStyle } = req.body;
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!job.segments) return res.status(400).json({ error: 'Run /generate-subtitles first' });

  try {
    updateJob(jobId, { status: 'rendering', progress: 80 });

    const outputPath = path.join(outputDir, `${jobId}-subtitled.mp4`);
    const style = {
      ...(stylePresets[styleId] || stylePresets.modern),
      ...(customStyle || {})
    };

    await renderVideoWithSubtitles(job.uploadPath, outputPath, job.segments, style);

    const next = updateJob(jobId, {
      status: 'completed',
      progress: 100,
      outputPath,
      steps: job.steps.map((step) => ({ ...step, done: true }))
    });

    res.json({
      jobId,
      status: next.status,
      downloadUrl: `/api/download/${jobId}`
    });
  } catch (error) {
    updateJob(jobId, { status: 'failed', error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job || !job.outputPath) return res.status(404).json({ error: 'Rendered file not found' });
  res.download(job.outputPath, `${job.id}-subtitled.mp4`);
});

router.get('/status/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.get('/styles', (req, res) => {
  res.json(Object.values(stylePresets));
});

module.exports = { router };
