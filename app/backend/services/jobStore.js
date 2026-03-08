const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

function createJob(payload = {}) {
  const id = uuidv4();
  jobs.set(id, {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'uploaded',
    progress: 5,
    steps: [
      { key: 'upload', label: 'Video uploaded', done: true },
      { key: 'transcribe', label: 'Transcribing audio', done: false },
      { key: 'segment', label: 'Generating subtitle segments', done: false },
      { key: 'render', label: 'Rendering final video', done: false }
    ],
    ...payload
  });

  return jobs.get(id);
}

function updateJob(id, partial) {
  const current = jobs.get(id);
  if (!current) return null;

  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString()
  };

  jobs.set(id, next);
  return next;
}

function getJob(id) {
  return jobs.get(id);
}

module.exports = {
  createJob,
  updateJob,
  getJob
};
