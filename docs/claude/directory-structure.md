# 디렉토리 구조

## 전체 구조

```
root/
├── public/          브라우저에서 직접 로드하는 정적 파일
├── src/             Node.js 서버 소스
├── test/            테스트
├── ml/              Python ML 스크립트
├── docs/            문서
│   ├── claude/      Claude Code 생성 문서
│   └── codex/       Codex 생성 문서
├── package.json
├── fly.toml         Fly.io 배포 설정
└── .env             환경변수 (git 제외)
```

## public/

서버가 `http://localhost:8787`에서 정적으로 서빙하는 파일들.
브라우저가 직접 로드한다.

| 파일 | 역할 |
|---|---|
| `index.html` | 앱 진입점 |
| `styles.css` | 스타일시트 |
| `engine.js` | 페르소나 엔진 (M1·M2·M3 로직, UMD 모듈) |
| `app.js` | UI 이벤트·시뮬레이션 흐름 제어 |

## src/

Node.js 서버 소스. `npm start`로 진입점인 `server.mjs`가 실행된다.

| 파일 | 역할 |
|---|---|
| `server.mjs` | HTTP 서버, API 라우팅, 임베딩 서빙 |
| `db.mjs` | Supabase 클라이언트, insert/export 함수 |
| `narrate.mjs` | M2 LLM 추론 서버 클라이언트 |

## test/

| 파일 | 역할 |
|---|---|
| `engine.test.js` | `public/engine.js` 단위 테스트 |

실행: `npm test`

## ml/

Python ML 스크립트. Node.js 서버와 독립적으로 실행된다.

| 파일 | 역할 |
|---|---|
| `train_m3.py` | M3 schema 발견 — 차원 탐색, adjacency, 사건 민감도 |
| `inference.py` | M2 LLM 추론 서버 (로컬 FastAPI + Qwen2.5) |
| `modal_inference.py` | M2 LLM 추론 서버 (Modal.com 서버리스 GPU 배포) |
| `requirements-inference.txt` | inference.py 의존성 |
| `requirements-m3.txt` | train_m3.py 의존성 |

실행:
```bash
pip install -r ml/requirements-m3.txt
python ml/train_m3.py

pip install -r ml/requirements-inference.txt
python ml/inference.py
```
