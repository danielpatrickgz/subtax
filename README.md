# Subtax — AI Dynamic Subtitle Generator (MVP)

Subtax is a simple web application that turns uploaded videos into subtitled MP4 files.

## MVP Features

- Upload video (`.mp4`, `.mov`, `.mkv`) up to **500MB**.
- Run an AI transcription step using **OpenAI Whisper API** (fallback sample transcript when API key is missing).
- Convert transcript words into subtitle segments following subtitle readability rules:
  - Max 2 lines
  - Max 42 characters per line
  - Natural pacing and sentence splitting
- Choose subtitle presets and style options.
- Burn subtitles into video via **FFmpeg**.
- Download final H.264 MP4 output.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Minimal client app with Tailwind CSS
- **Transcription:** OpenAI Whisper API
- **Rendering:** FFmpeg with ASS subtitle overlay
- **Storage:** Temporary local filesystem

## Project Structure

```txt
/app
  /backend
    /routes
    /services
    /transcription
    /video-processing
    /storage
  /frontend
```

## API Endpoints

- `POST /api/upload` – upload a video file.
- `POST /api/transcribe` – extract audio and run transcription.
- `POST /api/generate-subtitles` – build timed subtitle segments.
- `POST /api/render-video` – burn subtitles and render final video.
- `GET /api/download/:id` – download processed output.
- `GET /api/status/:id` – fetch job progress.
- `GET /api/styles` – fetch style presets.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

```bash
cp .env.example .env
```

Set `OPENAI_API_KEY` to enable real AI transcription.

### 3) Ensure FFmpeg is installed

```bash
ffmpeg -version
```

### 4) Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5) Run tests

```bash
npm test
```


## Notes

- The app is optimized for the MVP flow first.
- If `OPENAI_API_KEY` is not set, transcription uses a fallback transcript so the full pipeline can still be tested.
- Rendered videos and temporary files are stored in `app/backend/storage`.

## Future Enhancements

- Word-by-word animated highlighting with Remotion compositions.
- Subtitle editing UI before final render.
- SRT/VTT export.
- Async queue for long-running jobs.
