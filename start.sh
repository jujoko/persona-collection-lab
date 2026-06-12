#!/bin/bash
# Persona Collection Lab 시작 스크립트
# Node.js + Python ML inference 서버를 함께 실행

set -e

echo "=== Persona Collection Lab 시작 ==="

# ── 모델 파일 다운로드 (없을 때만) ────────────────────────────────────
# HF Hub에 모델 파일을 올려두고 여기서 받아옴
# HF_MODEL_REPO: jujoko/persona-collection-lab-models (예시)
if [ -n "$HF_MODEL_REPO" ]; then
    echo "[모델] HF Hub에서 다운로드 중: $HF_MODEL_REPO"
    python - <<EOF
from huggingface_hub import hf_hub_download
import os

repo = os.environ["HF_MODEL_REPO"]
files = ["m1_adapter.pt", "play_model.pt"]
os.makedirs("ml", exist_ok=True)

for f in files:
    dest = f"ml/{f}"
    if not os.path.exists(dest):
        print(f"  다운로드: {f}")
        path = hf_hub_download(repo_id=repo, filename=f)
        import shutil
        shutil.copy(path, dest)
    else:
        print(f"  이미 있음: {f}")
EOF
else
    echo "[모델] HF_MODEL_REPO 미설정 — 로컬 파일 사용"
fi

# ── Python ML inference 서버 (백그라운드) ─────────────────────────────
echo "[ML] inference_server.py 시작 중..."
python ml/inference_server.py &
ML_PID=$!

sleep 5
echo "[ML] PID $ML_PID — http://localhost:8788"

# ── Node.js 게임 서버 (포그라운드, HF Spaces port 7860) ───────────────
echo "[Node] server.mjs 시작 중..."
PORT=7860 ML_SERVER=http://localhost:8788 node src/server.mjs

# Node.js 종료 시 ML 서버도 종료
kill $ML_PID 2>/dev/null || true
