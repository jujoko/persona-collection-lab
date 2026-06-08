# 서버 기반 데이터 수집 구현 계획

## Context

현재 모든 데이터(캐릭터, 시뮬레이션, 피드백)가 브라우저 localStorage에만 저장된다.
연구 목적상 여러 유저의 데이터를 수집해야 하므로 서버 영속 저장소가 필요하다.

**선택 스택: Fly.io + Supabase**
- **Fly.io**: 무료 3 VM, sleep 없는 상시 운영. `fly launch` 한 번으로 배포.
- **Supabase**: Postgres DB 호스팅, 500MB 무료, 브라우저 대시보드에서 수집 데이터 SQL 조회 가능.
- 로컬 개발 시 동일한 Supabase 클라우드 DB 사용 (환경변수로 전환).
- Supabase 1주 비활성 pause 방지: server.mjs에 `/api/health` 엔드포인트 추가 후 Fly.io cron으로 주기적 ping.

---

## 변경 파일 목록

| 파일 | 변경 종류 |
|---|---|
| `package.json` | `@supabase/supabase-js` 의존성 추가 |
| `.env` | Supabase URL + anon key (gitignore에 포함) |
| `db.mjs` | 신규 — Supabase 클라이언트 초기화 + insert/select 함수 |
| `server.mjs` | API 엔드포인트 추가 (`/api/characters`, `/api/simulations`, `/api/feedback`, `/api/export`, `/api/health`) |
| `app.js` | 서버 동기화 함수 추가, 저장 시점에 호출 |
| `fly.toml` | 신규 — Fly.io 배포 설정 |

---

## 1. 의존성

```
npm install @supabase/supabase-js
```

환경변수 (`.env`, Fly.io secrets에도 동일하게 설정):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 2. db.mjs (신규)

Supabase 클라이언트 초기화와 insert/select 함수만 담당.

### Supabase 테이블 스키마 (대시보드에서 직접 생성)

**characters**
- `id` text PRIMARY KEY
- `prompt` text
- `generated_name` text
- `free_text_length` int
- `has_embedding` bool
- `raw` jsonb (전체 character 객체)
- `created_at` timestamptz DEFAULT now()

**simulations**
- `id` text PRIMARY KEY
- `character_id` text
- `ending_id` text
- `survived` bool
- `raw` jsonb (전체 simulation 객체)
- `created_at` timestamptz DEFAULT now()

**feedback**
- `id` text PRIMARY KEY
- `character_id` text
- `event_id` text
- `action` text
- `feedback_signal` text
- `raw` jsonb
- `created_at` timestamptz DEFAULT now()

### 내보낼 함수
- `insertCharacter(character)` → void
- `insertSimulation(simulation)` → void
- `insertFeedback(feedback)` → void
- `exportAll()` → `{ characters, simulations, feedback }`

---

## 3. server.mjs 추가 엔드포인트

기존 `/api/embed`는 그대로 유지. 3개 추가:

| Method | Path | 역할 |
|---|---|---|
| POST | `/api/characters` | character 저장 (중복 시 무시) |
| POST | `/api/simulations` | simulation 저장 |
| POST | `/api/feedback` | feedback 저장 |
| GET | `/api/export` | 전체 데이터 JSON 반환 |

- 모든 POST는 `Content-Type: application/json` 수신
- 저장 성공 시 `{ ok: true }` 반환
- 에러 시 `{ ok: false, error: "..." }` 반환

---

## 4. app.js 변경

### syncToServer(type, data) 추가 (비동기, fire-and-forget)

```js
async function syncToServer(type, data) {
  try {
    await fetch(`/api/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch {
    // 서버 없으면 그냥 넘어감 — localStorage는 이미 저장됨
  }
}
```

서버가 없어도 앱이 죽지 않도록 에러를 무시.

### 호출 위치 (기존 saveState() 직후)

1. **캐릭터 + 시뮬레이션 저장** (현재 line 131 부근): `syncToServer("characters", character)` + `syncToServer("simulations", simulation)`
2. **피드백 저장** (현재 line 537 부근): `syncToServer("feedback", feedbackEntry)`

localStorage는 그대로 유지 — 서버 없이 index.html 직접 열어도 동작.

---

## 5. 배포 (Fly.io)

```
fly launch        # fly.toml 생성
fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=...
fly deploy
```

`fly.toml` 핵심 설정:
- `internal_port = 8787`
- `[http_service] auto_stop_machines = false` (상시 운영)

인증은 이번 구현에서 제외 (연구용 프로토타입, 나중에 API key 헤더 추가).

---

## 검증 방법

1. Supabase 대시보드에서 테이블 3개 생성
2. `.env` 파일에 SUPABASE_URL, SUPABASE_ANON_KEY 설정
3. `npm install && npm start` 후 `http://localhost:8787` 접속
4. 샘플 캐릭터로 시뮬레이션 실행
5. Supabase 대시보드 Table Editor에서 rows 확인
6. `GET http://localhost:8787/api/export` 로 JSON 반환 확인
7. 피드백 버튼 클릭 후 feedback 테이블 확인
8. 서버 종료 상태에서 index.html 직접 열어 localStorage fallback 동작 확인
