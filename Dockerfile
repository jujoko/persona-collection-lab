# Persona Collection Lab — Hugging Face Spaces / Fly.io Docker
#
# 두 서버를 함께 실행:
#   Node.js (port 7860) — 게임 서버, HF Spaces 기본 포트
#   Python  (port 8788) — ML inference (M1 + Play Model)

FROM python:3.11-slim

# ── 시스템 패키지 ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl tini \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python 의존성 ──────────────────────────────────────────────────────
COPY ml/requirements-inference.txt ./ml/
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r ml/requirements-inference.txt

ENV HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    TRANSFORMERS_JS_CACHE=/app/.cache/transformersjs \
    PORT=7860 \
    ML_PORT=8788 \
    REQUIRE_PLAY_MODEL=0 \
    REQUIRE_SUPABASE=0 \
    REQUIRE_SERVICE_ROLE=0 \
    MAX_REQUEST_BYTES=262144 \
    MAX_TEXT_LENGTH=4000 \
    API_RATE_LIMIT=60

# 공개 기반 모델은 이미지 빌드 시 캐시해 런타임 cold start와 외부 장애를 줄인다.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')" \
    && python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('klue/roberta-base'); AutoModel.from_pretrained('klue/roberta-base')"

# ── Node.js 의존성 ─────────────────────────────────────────────────────
COPY package*.json ./
RUN npm ci --omit=dev

# Node.js 임베딩 모델도 빌드 시 받아 첫 사용자 요청의 다운로드 지연을 없앤다.
RUN node --input-type=module -e "import { env, pipeline } from '@huggingface/transformers'; env.cacheDir=process.env.TRANSFORMERS_JS_CACHE; const extractor=await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'); await extractor('cache warmup', { pooling: 'mean', normalize: true });"

# ── 소스 복사 ──────────────────────────────────────────────────────────
COPY src/       ./src/
COPY public/    ./public/
COPY content/   ./content/
COPY ml/        ./ml/

# ── 포트 ──────────────────────────────────────────────────────────────
EXPOSE 7860 8788

# ── 시작 스크립트 ──────────────────────────────────────────────────────
COPY start.sh ./
RUN chmod +x start.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=5m --retries=3 \
    CMD curl --fail http://127.0.0.1:${PORT}/api/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./start.sh"]
