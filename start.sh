#!/bin/bash
# Persona Collection Lab 시작 스크립트
# Node.js + Python ML inference 서버를 함께 실행

set -euo pipefail

PORT="${PORT:-7860}"
ML_PORT="${ML_PORT:-8788}"
ML_SERVER="${ML_SERVER:-http://127.0.0.1:${ML_PORT}}"
REQUIRE_PLAY_MODEL="${REQUIRE_PLAY_MODEL:-1}"
ML_PID=""
NODE_PID=""

shutdown() {
    echo "[종료] 프로세스 정리 중..."
    [ -n "$NODE_PID" ] && kill "$NODE_PID" 2>/dev/null || true
    [ -n "$ML_PID" ] && kill "$ML_PID" 2>/dev/null || true
    wait 2>/dev/null || true
}
trap shutdown EXIT INT TERM

echo "=== Persona Collection Lab 시작 ==="

# ── 모델 파일 다운로드 (없을 때만) ────────────────────────────────────
# HF Hub에 모델 파일을 올려두고 여기서 받아옴
# HF_MODEL_REPO: jujoko/persona-collection-lab-models (예시)
if [ -n "${HF_MODEL_REPO:-}" ]; then
    echo "[모델] HF Hub에서 다운로드 중: $HF_MODEL_REPO"
    python - <<EOF
from huggingface_hub import hf_hub_download
import os

import shutil
from huggingface_hub.errors import RemoteEntryNotFoundError

repo = os.environ["HF_MODEL_REPO"]
revision = os.getenv("HF_MODEL_REVISION", "main")
files = ["m1_adapter.pt", "play_model.pt"]
os.makedirs("ml", exist_ok=True)

for f in files:
    dest = f"ml/{f}"
    if not os.path.exists(dest):
        try:
            print(f"  다운로드: {f}")
            path = hf_hub_download(repo_id=repo, filename=f, revision=revision)
            shutil.copy(path, dest)
        except RemoteEntryNotFoundError:
            print(f"  건너뜀: {f} (아직 없음)")
    else:
        print(f"  이미 있음: {f}")
EOF
else
    echo "[모델] HF_MODEL_REPO 미설정 — 로컬 파일 사용"
fi

if [ ! -f ml/m1_adapter.pt ]; then
    echo "[오류] ml/m1_adapter.pt가 없습니다. HF_MODEL_REPO를 설정하세요." >&2
    exit 1
fi
if [ "$REQUIRE_PLAY_MODEL" = "1" ] && [ ! -f ml/play_model.pt ]; then
    echo "[오류] ml/play_model.pt가 없습니다. HF_MODEL_REPO를 설정하세요." >&2
    exit 1
fi

# ── Python ML inference 서버 (백그라운드) ─────────────────────────────
echo "[ML] inference_server.py 시작 중..."
ML_PORT="$ML_PORT" python -u ml/inference_server.py &
ML_PID=$!

echo "[ML] 준비 대기 중: $ML_SERVER/health"
for attempt in $(seq 1 180); do
    if ! kill -0 "$ML_PID" 2>/dev/null; then
        echo "[오류] ML 서버가 준비 전에 종료되었습니다." >&2
        wait "$ML_PID"
        exit 1
    fi
    if curl --fail --silent --max-time 2 "$ML_SERVER/health" >/dev/null; then
        echo "[ML] 준비 완료 (시도 ${attempt}/180)"
        break
    fi
    if [ "$attempt" -eq 180 ]; then
        echo "[오류] ML 서버가 3분 안에 준비되지 않았습니다." >&2
        exit 1
    fi
    sleep 1
done

# ── Node.js 게임 서버 (포그라운드, HF Spaces port 7860) ───────────────
echo "[Node] server.mjs 시작 중..."
PORT="$PORT" ML_SERVER="$ML_SERVER" node src/server.mjs &
NODE_PID=$!

# 어느 한 서버라도 종료되면 컨테이너를 실패 처리해 플랫폼이 재시작하게 한다.
wait -n "$ML_PID" "$NODE_PID"
exit $?
