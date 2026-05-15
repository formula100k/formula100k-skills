#!/bin/bash
# Transcribe a video file with mlx-whisper.
# Usage: transcribe.sh <video_path> [output_dir]
# Output: SRT file in output_dir (default /tmp), prints SRT path on success.

set -e

VIDEO="$1"
OUT_DIR="${2:-/tmp}"

if [ -z "$VIDEO" ]; then
  echo "Usage: transcribe.sh <video_path> [output_dir]" >&2
  exit 1
fi

if [ ! -f "$VIDEO" ]; then
  echo "Error: file not found: $VIDEO" >&2
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg not found. Install with: brew install ffmpeg" >&2
  exit 1
fi

if ! command -v uvx &> /dev/null; then
  echo "Error: uvx not found. Install with: brew install uv" >&2
  exit 1
fi

BASENAME=$(basename "$VIDEO" | sed 's/\.[^.]*$//')
AUDIO="$OUT_DIR/${BASENAME}.mp3"
SRT="$OUT_DIR/${BASENAME}.srt"

echo "[1/2] Extracting audio..." >&2
ffmpeg -i "$VIDEO" -vn -acodec mp3 -ar 16000 -ac 1 -y "$AUDIO" 2>&1 | tail -3 >&2

echo "[2/2] Transcribing with mlx-whisper (large-v3)..." >&2
uvx --from mlx-whisper mlx_whisper "$AUDIO" \
  --model mlx-community/whisper-large-v3-mlx \
  --language es \
  --output-format srt \
  --output-dir "$OUT_DIR" 2>&1 | grep -E "^\[" >&2 || true

echo "$SRT"
