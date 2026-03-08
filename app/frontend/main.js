const state = {
  jobId: null,
  selectedStyle: 'modern',
  styles: [],
  statusPollTimer: null
};

const videoInput = document.getElementById('videoInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const uploadProgressFill = document.getElementById('uploadProgressFill');
const pipelineSection = document.getElementById('pipelineSection');
const styleSection = document.getElementById('styleSection');
const stepList = document.getElementById('stepList');
const progressFill = document.getElementById('progressFill');
const previewBox = document.getElementById('previewBox');
const runPipelineBtn = document.getElementById('runPipelineBtn');
const presetContainer = document.getElementById('presetContainer');
const renderBtn = document.getElementById('renderBtn');
const downloadLink = document.getElementById('downloadLink');
const positionSelect = document.getElementById('positionSelect');
const highlightColor = document.getElementById('highlightColor');

uploadBtn.addEventListener('click', uploadVideo);
runPipelineBtn.addEventListener('click', runPipeline);
renderBtn.addEventListener('click', renderVideo);

(async function init() {
  try {
    const styles = await fetchJson('/api/styles');
    state.styles = styles;
    renderPresets();
  } catch (error) {
    uploadStatus.textContent = `Unable to load style presets: ${error.message}`;
  }
})();

async function uploadVideo() {
  const file = videoInput.files[0];
  if (!file) {
    uploadStatus.textContent = 'Select a video first.';
    return;
  }

  uploadStatus.textContent = 'Uploading...';
  uploadProgressFill.style.width = '0%';

  try {
    const result = await uploadWithProgress(file);
    state.jobId = result.jobId;
    uploadStatus.textContent = `Uploaded ${result.fileName} (${result.sizeMb.toFixed(1)} MB)`;
    pipelineSection.classList.remove('hidden');
    styleSection.classList.remove('hidden');
    await refreshStatus();
  } catch (error) {
    uploadStatus.textContent = error.message;
  }
}

async function runPipeline() {
  if (!state.jobId) return;

  runPipelineBtn.disabled = true;
  runPipelineBtn.textContent = 'Running...';
  startStatusPolling();

  try {
    await fetchJson('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: state.jobId })
    });

    const subtitleResult = await fetchJson('/api/generate-subtitles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: state.jobId,
        options: { maxCharsPerLine: 42, maxLines: 2 }
      })
    });

    previewBox.textContent = JSON.stringify(subtitleResult.segments.slice(0, 3), null, 2);
  } catch (error) {
    previewBox.textContent = `Pipeline failed: ${error.message}`;
  } finally {
    await refreshStatus();
    stopStatusPolling();
    runPipelineBtn.disabled = false;
    runPipelineBtn.textContent = 'Run AI Pipeline';
  }
}

async function renderVideo() {
  if (!state.jobId) return;

  renderBtn.disabled = true;
  renderBtn.textContent = 'Rendering...';
  startStatusPolling();

  try {
    const result = await fetchJson('/api/render-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: state.jobId,
        styleId: state.selectedStyle,
        customStyle: {
          position: positionSelect.value,
          highlightColor: highlightColor.value
        }
      })
    });

    downloadLink.href = result.downloadUrl;
    downloadLink.classList.remove('hidden');
  } catch (error) {
    previewBox.textContent = `Render failed: ${error.message}`;
  } finally {
    await refreshStatus();
    stopStatusPolling();
    renderBtn.disabled = false;
    renderBtn.textContent = 'Render Final Video';
  }
}

function renderPresets() {
  presetContainer.innerHTML = '';

  state.styles.forEach((style) => {
    const btn = document.createElement('button');
    btn.className = `text-left border rounded-xl p-3 transition ${state.selectedStyle === style.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`;
    btn.innerHTML = `<p class="font-semibold">${style.name}</p><p class="text-xs text-slate-400">${style.fontFamily} • ${style.position}</p>`;
    btn.addEventListener('click', () => {
      state.selectedStyle = style.id;
      renderPresets();
    });
    presetContainer.appendChild(btn);
  });
}

function startStatusPolling() {
  stopStatusPolling();
  state.statusPollTimer = setInterval(() => {
    if (!state.jobId) return;
    refreshStatus().catch(() => undefined);
  }, 1200);
}

function stopStatusPolling() {
  if (!state.statusPollTimer) return;
  clearInterval(state.statusPollTimer);
  state.statusPollTimer = null;
}

async function refreshStatus() {
  const job = await fetchJson(`/api/status/${state.jobId}`);
  progressFill.style.width = `${job.progress || 0}%`;
  stepList.innerHTML = '';

  job.steps.forEach((step) => {
    const li = document.createElement('li');
    li.className = step.done ? 'text-emerald-300' : 'text-slate-400';
    li.textContent = `${step.done ? '✓' : '•'} ${step.label}`;
    stepList.appendChild(li);
  });
}

function uploadWithProgress(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      uploadProgressFill.style.width = `${percent}%`;
    };

    xhr.onload = () => {
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch (error) {
        reject(new Error('Unexpected upload response'));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(result.error || 'Upload failed'));
        return;
      }

      uploadProgressFill.style.width = '100%';
      resolve(result);
    };

    xhr.onerror = () => reject(new Error('Upload failed due to a network error'));
    xhr.send(formData);
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
