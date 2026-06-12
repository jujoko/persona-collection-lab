# Persona Collection Lab — Hugging Face Spaces Docker
#
# 두 서버를 함께 실행:
#   Node.js (port 7860) — 게임 서버, HF Spaces 기본 포트
#   Python  (port 8788) — ML inference (M1 + Play Model)

FROM python:3.11-slim

# ── 시스템 패키지 ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python 의존성 ──────────────────────────────────────────────────────
COPY ml/requirements-inference.txt ./ml/
RUN pip install --no-cache-dir -r ml/requirements-inference.txt

# ── Node.js 의존성 ─────────────────────────────────────────────────────
COPY package*.json ./
RUN npm ci --omit=dev

# ── 소스 복사 ──────────────────────────────────────────────────────────
COPY src/       ./src/
COPY public/    ./public/
COPY ml/        ./ml/

# ── 포트 ──────────────────────────────────────────────────────────────
EXPOSE 7860 8788

# ── 시작 스크립트 ──────────────────────────────────────────────────────
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
