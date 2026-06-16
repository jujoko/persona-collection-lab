# 2026-06-16 배포 및 저장 운영 기록

## 요약

2026-06-16 기준 `persona-collection-lab`는 Hugging Face Docker Space에 배포되었고, 모델 로드와 Supabase 저장까지 검증되었다.

- Space: https://jujoko-persona-collection-lab.hf.space/
- Hugging Face Space repo: `jujoko/persona-collection-lab`
- Hugging Face model repo: `jujoko/persona-collection-lab-models`
- GitHub repo: `jujoko/persona-collection-lab`
- 배포 커밋: `1fa7bd1`

## 완료된 것

### GitHub / Space 배포

- `codex/deployment-game-foundation` 브랜치가 `main`에 merge됨.
- Hugging Face Space가 `main` 최신 커밋을 빌드하고 `RUNNING` 상태가 됨.
- 배포 HTML에서 `예측 캠페인` 문구가 반영됨.
- `/api/health`, `/api/embed`, `/api/persona` 스모크 테스트 통과.

### 모델 저장소

`jujoko/persona-collection-lab-models`에 아래 파일이 존재한다.

- `m1_adapter.pt`
- `play_model.pt`

`play_model.pt` 업로드는 기존 read/fine-grained token으로 403이 발생했으나, write token으로 재로그인 후 성공했다.

### 런타임 환경변수

Space에는 아래 환경변수가 필요하다.

```text
HF_MODEL_REPO=jujoko/persona-collection-lab-models
HF_TOKEN=<Hugging Face write token>
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
REQUIRE_SUPABASE=1
REQUIRE_SERVICE_ROLE=1
REQUIRE_PLAY_MODEL=0
```

검증된 health 핵심 값:

```json
{
  "ok": true,
  "ml": {
    "m1_available": true,
    "play_model_available": true
  },
  "supabase_configured": true,
  "supabase_required": true,
  "supabase_privileged": true,
  "service_role_required": true
}
```

## Supabase 저장 복구 기록

### 증상

처음에는 `/api/health`에서 `supabase_configured: true`였지만 `supabase_privileged: false`였다. 이는 서버가 `SUPABASE_SERVICE_ROLE_KEY` 없이 anon key로 붙고 있다는 뜻이다.

`SUPABASE_SERVICE_ROLE_KEY`, `REQUIRE_SUPABASE=1`, `REQUIRE_SERVICE_ROLE=1`을 Space에 추가한 뒤 health는 정상화되었지만, 저장 API는 여전히 500을 반환했다.

### 원인

Space 로그에서 아래 에러가 확인되었다.

```text
[DB] /api/characters error: permission denied for table characters
[DB] /api/simulations error: permission denied for table simulations
[DB] /api/feedback error: permission denied for table feedback
```

RLS와 권한 revoke 이후 `service_role`에 대한 명시적 table grant가 빠져 있었다.

### 해결

Supabase SQL Editor에서 아래 SQL을 실행했다.

```sql
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE characters TO service_role;
GRANT ALL ON TABLE simulations TO service_role;
GRANT ALL ON TABLE feedback TO service_role;
```

또한 `docs/claude/supabase_migration.sql`은 최초 환경에서도 안전하게 실행되도록 보강되었다.

- `CREATE TABLE IF NOT EXISTS`로 기본 테이블 보장
- `raw`, `prompt`, `character_id`, `feedback_signal` 등 서버 코드가 사용하는 컬럼 보장
- `service_role` grant 포함

### 최종 검증

아래 API가 모두 `{ "ok": true }`를 반환했다.

- `POST /api/characters`
- `POST /api/simulations`
- `POST /api/feedback`

Space 로그에서도 성공이 확인되었다.

```text
[DB] /api/characters ok
[DB] /api/simulations ok
[DB] /api/feedback ok
```

## 현재 저장 구조

플레이 데이터는 두 곳에 저장된다.

- 브라우저 `localStorage`: 즉시 저장, 같은 브라우저 재방문용
- Supabase: 서버 API를 통한 운영 수집 데이터

브라우저는 Supabase에 직접 쓰지 않는다. 공개 앱에서 anon insert를 열어두면 데이터 오염 위험이 있으므로, 서버만 `SUPABASE_SERVICE_ROLE_KEY`로 저장한다.

## 게임 업데이트

이번 배포에는 예측 캠페인 게임 루프도 포함되었다.

- 성인기 사건이 ME001~ME010으로 확장됨.
- 사건은 Act 1~5 흐름의 연속 캠페인으로 구성됨.
- 유저가 매 사건마다 캐릭터의 행동을 예측함.
- 실제 선택 공개 후 점수와 연속 적중이 계산됨.
- 모든 사건 완료 후 캐릭터 이해도와 엔딩이 표시됨.

## 다음 작업

### 1. 실제 플레이 데이터 수집

목표:

- 최소 50명 플레이
- 피드백 500개 이상
- 캐릭터/시뮬레이션/피드백 테이블 row 증가 확인

### 2. 엔딩 리포트 강화

현재 최종 보상은 아직 약하다. 다음 개선이 우선이다.

- 캐릭터 핵심 성향 3개 요약
- 가장 예측이 많이 빗나간 사건
- 선택 궤적 타임라인
- 엔딩별 장문 서사
- “유저가 본 캐릭터 vs 모델이 본 캐릭터” 비교

### 3. 관리자 분석 화면

Supabase 데이터가 쌓이면 raw JSON 대신 분석 화면이 필요하다.

- 사건별 선택 분포
- 엔딩 분포
- 피드백 신호 분포
- latent vector 군집
- 피드백 없는 시뮬레이션 비율

### 4. 모델 학습 재개

실제 피드백이 쌓인 뒤 아래 순서로 진행한다.

1. M3 schema discovery
2. action embedding 재설계
3. M2 KV injection 학습
4. LLM 동적 서술 연동
