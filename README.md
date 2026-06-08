# Persona Collection Lab

LLM 기반 페르소나 생성·시뮬레이션 연구를 위한 게임형 데이터 수집 프로토타입.  
연구 목적 및 배경은 [`docs/claude/persona_simulation_research_context.md`](docs/claude/persona_simulation_research_context.md)를 참고.

---

## 전체 진행도

> **48%** — 인프라 완료, 현대 배경 전환 및 ML 파이프라인 설계 완료

| 영역 | 진행 바 | % |
|---|---|---|
| 게임 루프 기반 | `██████████` | 100% |
| 임베딩 서버 | `██████████` | 100% |
| 데이터 수집 인프라 | `██████████` | 100% |
| 현대 배경 전환 | `██████████` | 100% |
| ML 파이프라인 설계 | `████████░░` | 80% |
| 합성 학습 데이터 생성 | `░░░░░░░░░░` | 0% |
| LLM 서술 연동 | `░░░░░░░░░░` | 0% |
| 캐릭터 비교 / 공유 | `░░░░░░░░░░` | 0% |
| 데이터 분석 화면 | `░░░░░░░░░░` | 0% |
| Fly.io 배포 | `██░░░░░░░░` | 20% |
| M2 KV injection 학습 | `░░░░░░░░░░` | 0% |
| M3 딥러닝 학습 | `░░░░░░░░░░` | 0% |

---

## 현재 상태 (v0.2.1)

### 구현된 것

| 구분 | 내용 |
|---|---|
| **배경** | 현대 한국 (직장·가족·사회 딜레마) |
| 성장 사건 | G001~G004 (유아기→청년기, 현대 한국 단서어) |
| 성인기 사건 | ME001~ME005 (내부고발·가족의빚·자원배분·금지된방법·조직의압력) |
| 엔딩 | 10종 (survivor/whistleblower/conformist/reformer/exile/caregiver/opportunist/martyr/forgotten/changemaker) |
| 잠재 벡터 | 8차원 latent persona (z0~z7) |
| M1 | 프롬프트 → latent seed (tanh-linear layer) |
| M2 | 페르소나 × 사건/행동 임베딩 → 행동 결정 |
| M3 | latent schema 생성 (규칙 기반 bootstrap) + `ml/train_m3.py` (schema discovery 스크립트) |
| M2 학습 설계 | KV injection (frozen Qwen2.5-1.5B + adapter MLP) — `ml/train_m2.py` |
| 합성 데이터 파이프라인 | Nemotron-Personas-Korea + judge 모델 — `ml/build_training_data.py` |
| 임베딩 서버 | Xenova/all-MiniLM-L6-v2 (Node.js, port 8787) |
| 피드백 학습 | 브라우저 내 gradient update (action encoder) |
| 재시뮬레이션 | 피드백 반영 후 같은 사건 재실행 + 비교 카드 |
| 데이터 저장 | localStorage (브라우저) + Supabase (서버) |
| 데이터 내보내기 | JSON 다운로드 + `/api/export` |
| 배포 설정 | Fly.io (`fly.toml`) |

### 아직 없는 것

- 합성 학습 데이터 실제 생성 (`build_training_data.py` 실행 필요)
- M2 KV injection 실제 학습 (`train_m2.py` 실행 필요)
- Supabase 스키마 마이그레이션 (service role key로 수동 실행 필요)
- 사건 서술의 LLM 동적 생성 (현재 규칙 기반 고정 텍스트)
- 캐릭터 비교 뷰 / 공유 기능
- 데이터 분석 화면
- M3 실제 딥러닝 학습

---

## 실행

### 서버 모드 (권장)

```bash
npm install
npm start
```

`http://localhost:8787` 접속.  
서버가 `Xenova/all-MiniLM-L6-v2`를 로드해 `/api/embed`에서 프롬프트 임베딩을 반환한다.  
첫 실행 시 모델 파일 다운로드로 시간이 걸릴 수 있다.

데이터를 Supabase에 수집하려면 `.env` 파일이 필요하다:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 서버 없이 실행

```bash
start index.html
```

프롬프트 해석은 결정적 해시 fallback을 사용한다. 데이터는 localStorage에만 저장된다.

---

## 아키텍처

```
자유 프롬프트 입력
  → (서버) all-MiniLM-L6-v2 → 384차원 임베딩
  → M1: 8차원 latent seed 생성 (아기 상태)
  → G001~G004 성장 사건 (현대 한국 맥락, latent 변화 로그)
  → ME001~ME005 성인기 사건 (현대 도덕 딜레마, 행동 결정)
  → 결과 카드 + 엔딩 (10종)
  → 유저 피드백 → action encoder gradient update
  → 재시뮬레이션 비교
  → localStorage + Supabase 저장
```

### 세 가지 모델

| 모델 | 역할 | 현재 상태 |
|---|---|---|
| M3 | latent schema 구조 설계 | 규칙 기반 bootstrap + `train_m3.py` (schema discovery) |
| M1 | 프롬프트 → latent seed | tanh-linear layer |
| M2 | 페르소나 × 사건 → 행동 | KV injection 설계 완료 (`train_m2.py`) |

### M2 KV Injection 구조

```
latent [D]  →  adapter MLP [D→32]  →  KV projection [32→14336]
  →  past_key_values (28레이어 × 2 × 2 × 128)
  →  Qwen2.5-1.5B (frozen)  →  action_id
```

adapter + KV projection 만 학습 (~459K 파라미터), Qwen은 동결.  
상세: [`docs/claude/design-m2-kv-injection.md`](docs/claude/design-m2-kv-injection.md)

### 합성 학습 데이터 파이프라인

순환 학습 문제(M2가 만든 데이터로 M2를 학습) 해결을 위해 외부 데이터 사용:

```
Nemotron-Personas-Korea (1M 한국인 페르소나)
  →  judge 모델 (Qwen 로컬 or Claude API)
  →  (persona, event_id, action_id) 레이블 생성
  →  synthetic_training_data.jsonl
  →  train_m2.py 학습 입력
```

---

## 데이터 수집 구조

브라우저 → Node 서버 → Supabase Postgres

| 테이블 | 저장 내용 |
|---|---|
| `characters` | 캐릭터 프롬프트, latent seed, 임베딩 여부 |
| `simulations` | 성장 로그, 사건별 행동, 엔딩 |
| `feedback` | 사건별 피드백 신호, latent 변화 전후 |

전체 데이터 조회: `GET /api/export`

---

## 최근 업데이트

### 2026-06-08
- **현대 한국 배경 전환** — 중세 판타지 사건(E001~E005) → 현대 도덕 딜레마(ME001~ME005)
  - 내부고발 / 가족의빚 / 자원배분 / 금지된방법 / 조직의압력
- **엔딩 10종 교체** — whistleblower / reformer / caregiver / changemaker 등 현대 맥락
- **성장 사건 단서어 교체** — 기사·왕국 → 학교·취업·가족 등 현대 한국 키워드
- **ML 파이프라인 완성**
  - `ml/build_training_data.py` — Nemotron-Personas-Korea + judge 모델로 합성 데이터 생성
  - `ml/train_m2.py` — KV injection 학습 스크립트 (frozen Qwen2.5-1.5B)
  - `ml/train_m3.py` — latent schema discovery (차원 수, 상관, 분산, 사건 민감도)
- **디렉토리 재구조화** — `public/` / `src/` / `test/` / `ml/` / `docs/claude/` / `docs/codex/`
- **Supabase 스키마 확장** — prompt_embedding / latent_seed / infant_latent / final_latent 컬럼 추가 설계

### 2026-05-20
- Supabase 연동 — 캐릭터/시뮬레이션/피드백 서버 영속 저장
- `/api/characters`, `/api/simulations`, `/api/feedback`, `/api/export`, `/api/health` 엔드포인트 추가
- `db.mjs` 추가 — Supabase 클라이언트 및 insert/export 함수
- `fly.toml` 추가 — Fly.io 상시 운영 배포 설정
- `--env-file=.env` 플래그로 dotenv 없이 환경변수 로드
- GitHub 리포지토리 개설: https://github.com/jujoko/persona-collection-lab

---

## 앞으로 할 것

### 단기 (합성 데이터 + 학습)

#### Supabase 마이그레이션 실행
`docs/claude/supabase_migration.sql`을 Supabase SQL Editor(service role 필요)에서 실행.  
prompt_embedding / latent_seed / infant_latent / final_latent 컬럼이 추가된다.

#### 합성 학습 데이터 생성
```bash
pip install datasets
python ml/build_training_data.py --n-personas 500 --judge claude
```
`ml/synthetic_training_data.jsonl` 생성 후 `train_m2.py` 학습 가능.

#### M2 KV injection 첫 학습
```bash
python ml/train_m2.py --data ml/synthetic_training_data.jsonl
```
학습된 projection layer(`ml/m2_projection.pt`)를 `inference.py`에서 로드해 M2 서술 개선 여부 확인.

### 단기 (콘텐츠 + 플레이 동기)

#### 사건 확장
현재 5개 현대 사건(ME001~ME005)은 반복 플레이 시 금방 익숙해진다.  
다양한 캐릭터 간 행동 차이를 수집하려면 사건 수와 유형이 늘어야 한다.

- 사건 10~15개로 확장 (직장 외 가족·사회·정치 영역 추가)
- 사건 유형 다양화: 관계 갈등, 정체성 위기, 권력 유혹 등
- 사건 태그 기반 분류 (triggered_traits 기반 필터링)

#### LLM 서술 연동
현재 행동 결과 텍스트가 고정 문자열이라 캐릭터마다 동일하게 출력된다. LLM으로 캐릭터의 latent vector를 반영한 동적 서술을 생성하면 플레이 동기가 크게 높아진다.

- Anthropic API 연동 (`claude-haiku` 또는 `claude-sonnet`)
- latent persona + 사건 맥락 → 행동 서술 동적 생성
- 프롬프트 캐싱으로 비용 절감
- 서버가 없을 때는 기존 고정 텍스트 fallback 유지

#### 엔딩 서술 강화
엔딩이 수집 동기의 핵심인데 현재 텍스트가 단조롭다.

- 엔딩별 고유 서술 강화
- 캐릭터 latent 값이 반영된 엔딩 분기 추가
- 엔딩 이미지 또는 아이콘 추가

---

### 중기 (비교 + 재방문)

#### 캐릭터 비교 뷰
같은 사건에서 서로 다른 캐릭터가 어떻게 다르게 행동했는지 보여주는 화면.  
이것이 연구의 핵심 인사이트 창구이기도 하다.

- 사건별 캐릭터 행동 비교 카드
- latent vector 차이 시각화
- "이 사건에서 가장 다른 선택을 한 두 캐릭터" 자동 추출

#### 캐릭터 공유 / 복제
- 엔딩 결과 공유 링크 생성
- 캐릭터 복제 후 성향 일부 변경해 재실험
- "이 캐릭터의 용기를 낮추면 엔딩이 바뀔까?" 실험 루프

#### 재플레이 유도
- 엔딩 도감 (수집한 엔딩 / 전체 엔딩 목록)
- "아직 보지 못한 엔딩" 힌트
- 최근 캐릭터 히스토리 카드

---

### 중기 (데이터 분석)

#### 관리자 분석 화면
현재 관리자 화면은 raw JSON만 보여준다. 연구 인사이트를 직접 확인할 수 있는 시각화가 필요하다.

- 사건별 행동 분포 차트 (ME001에서 캐릭터들이 얼마나 다르게 행동했는가)
- latent vector 군집 시각화 (비슷한 성향의 캐릭터 묶음)
- 피드백 신호 분포 (consistent / ambiguous / wrong 비율)
- 엔딩 분포 차트

#### 데이터 품질 지표
- 같은 캐릭터 ID의 시뮬레이션 중복 감지
- 피드백 없는 시뮬레이션 비율
- 임베딩 서버 사용 비율 vs fallback 비율

---

### 장기 (모델 학습)

#### Fly.io 배포
- `fly launch` + `fly secrets set` 으로 배포
- 배포 후 `/api/health` 엔드포인트로 Supabase 비활성 방지 ping 설정
- 공개 URL로 다른 사람도 플레이 가능하게

#### M3 실제 딥러닝 학습
현재 M3는 규칙 기반 bootstrap이다. 데이터가 충분히 쌓이면 실제 학습 모델로 교체한다.

- 수집된 캐릭터-사건-행동-피드백 데이터로 latent schema 자동 설계
- 8차원 고정 → 데이터 기반 최적 차원 수 탐색 (8/16/32/64차원 비교)
- latent 노드 간 연결 구조 자동 추정

#### 대조학습
같은 사건에서 서로 다른 캐릭터의 행동 차이를 학습 신호로 사용.

- 행동이 다른 캐릭터 쌍 자동 추출
- contrastive loss로 latent space 정렬

#### 선호학습
유저 피드백을 보상 신호로 사용.

- "완전 캐릭터다" vs "전혀 아님" 쌍 비교
- preference model 학습
- 피드백 반영 후 재시뮬레이션 결과와 원본 비교 자동 평가

#### 역모델링
행동 로그만 보고 latent persona를 역산.

- 시뮬레이션 결과에서 persona vector 복원
- 유저가 직접 입력한 프롬프트 없이도 행동 패턴으로 캐릭터 추정

---

## 디렉토리 구조

```
root/
├── public/          # 브라우저 정적 파일 (index.html, engine.js, app.js, styles.css)
├── src/             # Node 서버 (server.mjs, db.mjs, narrate.mjs)
├── test/            # 단위 테스트 (engine.test.js)
├── ml/              # ML 파이프라인
│   ├── build_training_data.py   # Nemotron → 합성 학습 데이터
│   ├── train_m2.py              # M2 KV injection 학습
│   ├── train_m3.py              # M3 latent schema discovery
│   ├── inference.py             # Qwen 로컬 추론 서버
│   └── requirements-*.txt
├── docs/
│   ├── claude/      # Claude Code가 작성한 설계 문서
│   └── codex/       # (예정) Codex 작성 문서
├── package.json
├── fly.toml
└── .env
```

---

## 테스트 포인트

- 샘플 버튼으로 캐릭터 채운 뒤 자동 시뮬레이션 실행
- 성장 로그 G001(양육자의 방식)~G004(사회가 요구한 역할) 순서대로 생성 확인
- 사건 카드가 ME001~ME005 (현대 한국 딜레마)로 출력되는지 확인
- 서로 다른 캐릭터 2명 이상 실행 후 Supabase 대시보드에서 행 확인
- `GET http://localhost:8787/api/export` 로 수집 데이터 JSON 확인
- 사건 카드의 피드백 버튼 클릭 후 latent vector 변화 및 feedback 테이블 확인
- `피드백 로그로 모델 학습` 버튼으로 loss 변화 확인
- `현재 페르소나로 다시 실행` 버튼으로 행동 변화 비교 확인
- 서버 종료 상태에서 `index.html` 직접 열어 localStorage fallback 동작 확인
- `node test/engine.test.js` 로 엔진 단위 테스트 통과 확인
