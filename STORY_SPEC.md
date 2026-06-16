# Persona Collection Lab — 스토리 설계 명세서

> 이 문서는 콘텐츠 작성자(또는 LLM)가 아크/이벤트를 추가할 때 따라야 하는 기준입니다.  
> 엔진 로직이나 임베딩 벡터 설계와는 독립적입니다.

---

## 1. 서술 원칙

### 1-1. 시점
- **2인칭 현재형**: "당신은 ～한다", "당신의 손이 ～"
- TRPG 게임마스터가 상황을 묘사하는 톤
- 독자가 주인공 자리에 들어오도록 구체적 감각 묘사 포함

### 1-2. 요약 (summary) 작성 기준
- 3~5문장. 상황 → 긴장 → 선택 앞에 선 순간
- 배경, 인물 관계, 내적 갈등을 압축해 전달
- 판단을 유도하지 않음. 어느 선택이 옳다는 암시 금지

### 1-3. 선택지 유형
갈등 딜레마만 짜지 않는다. 인생의 선택은 더 넓다.

| 유형 | 설명 | 예시 |
|---|---|---|
| **도덕 딜레마** | 옳고 그름이 충돌 | 커닝 목격 시 신고할까 |
| **방향 선택** | 정답 없는 인생 갈림길 | 이과 vs 문과, 취업 vs 대학원 |
| **우선순위** | 두 가지 모두 중요할 때 | 공부 vs 친구 시간 |
| **리스크 선택** | 안전 vs 도전 | 안정적인 회사 vs 스타트업 |
| **관계 선택** | 누구와 어떻게 지낼지 | 이 사람과 계속 사귈까 |
| **자기 표현** | 어떤 사람이 될지 | 어떤 동아리를 선택할까 |

---

## 2. 상태 플래그 시스템

각 이벤트의 선택이 **플래그**를 세팅하고, 이후 이벤트는 플래그를 보고 분기한다.  
8차원 잠재 벡터와는 별개 레이어다. 스토리 연계는 플래그로, 심리 모델링은 벡터로.

### 2-1. 전역 플래그 목록

| 플래그 키 | 가능한 값 | 세팅 시점 |
|---|---|---|
| `childhood_pattern` | `protective` / `curious` / `conformist` / `resilient` | Arc 0 |
| `academic_effort` | `high` / `medium` / `low` | Arc 1~2 |
| `first_interest` | `stem` / `humanities` / `arts` / `sports` / `none` | Arc 1 |
| `social_role` | `leader` / `loner` / `follower` / `outsider` | Arc 1~2 |
| `exam_score` | `top` / `good` / `average` / `fail` | Arc 2 |
| `major` | `medicine` / `law` / `stem` / `business` / `humanities` / `arts` / `gap_year` | Arc 2~3 |
| `university_tier` | `top` / `mid` / `low` / `none` | Arc 2~3 |
| `relationship_history` | `committed` / `casual` / `none` / `broken` | Arc 2~4 |
| `financial_status` | `wealthy` / `stable` / `struggling` / `debt` | Arc 3~6 |
| `career_start` | `major_corp` / `startup` / `public` / `freelance` / `delayed` | Arc 4 |
| `reputation` | `high` / `medium` / `low` / `tainted` | Arc 5~6 |
| `family_structure` | `married` / `single` / `divorced` / `cohabiting` | Arc 6 |
| `health` | `good` / `warning` / `chronic` | Arc 6~7 |

### 2-2. 플래그 사용 방식

**이벤트에서 플래그 조건**:
```js
requires: { exam_score: ["top", "good"] }  // 이 값일 때만 이 이벤트 등장
excludes: { university_tier: "none" }       // 이 값이면 이 이벤트 제외
```

**액션에서 플래그 세팅**:
```js
sets: { exam_score: "top", academic_effort: "high" }
```

**분기 텍스트**: summary 내에서 플래그를 참조해 문장을 다르게 쓸 수 있다:
```js
summary_variants: {
  default: "당신은 시험장에 들어선다.",
  "academic_effort:high": "수개월의 혹독한 준비 끝에, 당신은 시험장에 들어선다.",
  "academic_effort:low": "솔직히 거의 안 했다. 당신은 시험장에 들어선다."
}
```

---

## 3. 아크 구조

### 아크 진행 원칙
- **8개 아크**, 인생 순서대로
- 각 아크에는 **이벤트 풀** 존재 (6~10개)
- 한 플레이에서 아크당 **2~3개** 노출 (플래그 조건 + innate_seed 기반 샘플링)
- 아크 시작 전 **챕터 카드** 표시 (배경 설명 1~2문장)

### 아크 목록

| 아크 | 배경 | 핵심 플래그 생성 | 핵심 플래그 소비 |
|---|---|---|---|
| **Arc 0** · 초등학교 | 7~12세 | `childhood_pattern`, `first_interest` | — |
| **Arc 1** · 중학교 | 13~15세 | `social_role`, `academic_effort` | `childhood_pattern` |
| **Arc 2** · 고등학교 | 16~18세 | `exam_score`, `major`, `relationship_history` | `academic_effort`, `social_role` |
| **Arc 3** · 대학교 | 19~23세 | `university_tier`, `financial_status` | `exam_score`, `major` |
| **Arc 4** · 취업 준비 | 23~27세 | `career_start` | `university_tier`, `major`, `financial_status` |
| **Arc 5** · 사회초년생 | 25~30세 | `reputation`, `career_trajectory` | `career_start`, `relationship_history` |
| **Arc 6** · 30대 | 30~38세 | `family_structure`, `health` | `reputation`, `financial_status` |
| **Arc 7** · 중년 | 38~50세 | — | 모든 플래그 수렴 |

---

## 4. 이벤트 데이터 스키마

```js
{
  // ── 식별자 ─────────────────────────────────────────────
  id: "E201",                    // ArcNumber + 순번. E0xx~E7xx
  arc: "arc2",                   // 소속 아크
  title: "수능 전날 밤",           // 짧은 제목 (카드 헤더용)
  type: "direction_choice",      // 이벤트 유형 (아래 목록 참고)
  tags: ["시험", "선택", "압박"],  // 검색/필터용

  // ── 분기 조건 ───────────────────────────────────────────
  requires: {},                  // 이 이벤트가 등장하기 위한 플래그 조건
  excludes: {},                  // 이 이벤트를 막는 플래그 조건
  weight: 1.0,                   // 샘플링 가중치 (높을수록 자주 등장)

  // ── 서술 ────────────────────────────────────────────────
  chapter_intro: "수능을 3주 앞두고 있다.", // 아크 첫 이벤트에만 씀
  summary: "당신은 책상 앞에 앉아 있다...", // 2인칭 현재형, 3~5문장
  summary_variants: {            // 선택적. 플래그에 따른 summary 분기
    "academic_effort:high": "수개월간 매달린 끝에...",
    "academic_effort:low": "솔직히 준비가 부족했다..."
  },

  // ── 선택지 ──────────────────────────────────────────────
  actions: [
    {
      id: "action_id",           // snake_case, 이벤트 내 유일
      label: "새벽까지 취약 과목을 판다",  // 버튼에 표시되는 짧은 텍스트
      description: "...",        // 선택지 부연 설명 (선택적)
      outcome: "...",            // 선택 후 결과 서술 (2~3문장, 2인칭)
      sets: {                    // 이 선택이 세팅하는 플래그
        exam_score: "top",
        academic_effort: "high"
      },
      // 엔진 연동 (선택적, 없어도 됨)
      embedding: [...],          // 8차원 벡터 (심리 방향)
      endingWeight: {}           // 엔딩 가중치
    }
  ],

  // ── 후속 이벤트 힌트 ─────────────────────────────────────
  leads_to: ["E202", "E203"],    // 이 이벤트 후 다음 아크에서 연관될 이벤트 id (선택적)
}
```

### 이벤트 type 목록
- `moral_dilemma` — 옳고 그름이 충돌
- `direction_choice` — 인생 방향 선택 (정답 없음)
- `priority_choice` — 두 가치 중 하나
- `risk_choice` — 안전 vs 도전
- `relationship_choice` — 관계 선택
- `identity_choice` — 어떤 사람이 될지
- `crisis_response` — 예상치 못한 위기 대응
- `opportunity_choice` — 기회를 잡을지 말지

---

## 5. 아크별 이벤트 작성 가이드

### Arc 0 · 초등학교 (E0xx)
- **톤**: 순수하고 감각적. 아이의 눈높이로
- **목표**: `childhood_pattern`, `first_interest` 플래그 세팅
- **주의**: 도덕 딜레마만 넣지 말 것. "어떤 놀이를 좋아하나", "어떤 과목이 재미있나" 같은 정체성 이벤트 포함
- **예시 이벤트 방향**:
  - 첫 시험 (학업 방향 첫 인상)
  - 친구 관계 첫 갈등
  - 좋아하는 것 발견 (미술, 수학, 체육, 책...)
  - 가정 환경의 첫 충격

### Arc 1 · 중학교 (E1xx)
- **톤**: 정체성 탐색. 집단 속 자기 위치를 찾는 혼란
- **목표**: `social_role`, `academic_effort` 세팅
- **주의**: 또래 관계, 첫 연애 감정, 어른에 대한 반항 포함
- **Arc 0 연계**: `childhood_pattern: protective` → 왕따 피해자를 도우려는 충동 이벤트 우선 노출

### Arc 2 · 고등학교 (E2xx)
- **톤**: 긴장감. 선택이 미래를 결정한다는 압박
- **목표**: `exam_score`, `major` 세팅
- **핵심 분기**:
  - `academic_effort: high` → 수능 고득점 이벤트 접근 가능
  - `academic_effort: low` → 재수/취업계 이벤트 접근
  - `first_interest: arts` → 예술고 전학 / 실기 준비 이벤트 접근
- **중요**: 수능 점수는 이후 Arc 3~4에서 대학, 취업 선택지 폭을 결정

### Arc 3 · 대학교 (E3xx)
- **톤**: 자유와 방황. 처음으로 스스로 선택하는 삶
- **목표**: `university_tier`, `financial_status` 세팅
- **핵심 분기**:
  - `exam_score: top` → 의대/법대/상위권 대학 전용 이벤트 접근
  - `exam_score: fail` → 재수 생활 / 전문대 / 취업 준비 이벤트로 분기
  - `major: arts` → 실기, 오디션, 작품 전시 이벤트
- **재수 경로**: Arc 2에서 `exam_score: fail` 시 Arc 3 대신 **Arc 2.5 · 재수** 미니아크 진입 가능

### Arc 4 · 취업 준비 (E4xx)
- **톤**: 현실 충격. 스펙과 자존감 사이
- **목표**: `career_start` 세팅
- **핵심 분기**:
  - `university_tier: top` → 대기업/전문직 전용 이벤트 접근
  - `university_tier: none` → 자격증/기술직/창업 경로
  - `financial_status: struggling` → 알바 병행, 부모님 압박 이벤트 강화
  - `major: medicine` → 전공의 시험, 병원 선택 이벤트로 완전 분기

### Arc 5 · 사회초년생 (E5xx)
- **톤**: 조직 안에서의 첫 마찰. 이상과 현실의 충돌
- **목표**: `reputation` 세팅
- **핵심 분기**:
  - `career_start: major_corp` → 대기업 특유의 위계/야근/정치 이벤트
  - `career_start: startup` → 빠른 성장 vs 불안정 이벤트
  - `career_start: public` → 공직 특유의 보수성/안정성 이벤트
  - `relationship_history: committed` → 직장-연애 양립 이벤트

### Arc 6 · 30대 (E6xx)
- **톤**: 무게감. 선택의 결과가 실체로 드러나는 시기
- **목표**: `family_structure`, `health` 세팅
- **핵심 분기**:
  - `reputation: high` → 이직 제안 / 창업 기회 이벤트
  - `reputation: tainted` → 재기 / 업계 변경 이벤트
  - `financial_status: debt` → 내 집 마련 불가 / 파산 위기 이벤트

### Arc 7 · 중년 (E7xx)
- **톤**: 성찰. 빠르지 않고 무겁고 조용한 톤
- **목표**: 플래그 소비 → 엔딩 수렴
- **핵심**: 지금까지의 플래그 조합이 어떤 삶의 모습으로 귀결되는지 보여줌

---

## 6. 연계 이벤트 예시 (설계 패턴)

### 패턴 A: 점수 분기
```
E202 (수능 당일 선택)
  action: "밤샘 공부를 선택한다" → sets: { exam_score: "top" }
  action: "일찍 자고 컨디션 관리" → sets: { exam_score: "good" }
  action: "포기하고 딴생각" → sets: { exam_score: "average" }
      ↓
E301 (대학 입학)
  requires: { exam_score: "top" } → "서울대 법대 첫날"
  requires: { exam_score: "good" } → "지방 국립대 신입생"
  requires: { exam_score: "average" } → "전문대 or 재수 결정"
```

### 패턴 B: 관심사 연계
```
E005 (초등학교 — 좋아하는 과목 선택)
  action: "수학 시간이 제일 좋다" → sets: { first_interest: "stem" }
  action: "그림 그리는 시간" → sets: { first_interest: "arts" }
      ↓
E208 (고등학교 — 자퇴 유혹)
  only shown if first_interest: "arts"
  → "음악 하는 친구가 학교 그만두고 같이 밴드 하자고 한다"
```

### 패턴 C: 관계 누적
```
E204 (고등학교 — 연인과 이별)
  action: "수능 끝나고도 계속 만난다" → sets: { relationship_history: "committed" }
      ↓
E507 (사회초년생 — 번아웃)
  summary_variant "relationship_history:committed":
    "당신 곁에는 오래된 연인이 있다. 그 사람에게도 미안하다는 생각이 든다."
```

---

## 7. 아크별 작성 분량 기준

| 아크 | 이벤트 풀 | 우선 작성 | 연계 깊이 |
|---|---|---|---|
| Arc 0 | 8개 | 6개 | 낮음 (플래그 생성 주) |
| Arc 1 | 8개 | 6개 | 낮음~중간 |
| Arc 2 | 10개 | 8개 | 높음 (exam_score 분기 핵심) |
| Arc 2.5 | 4개 | 4개 | 중간 (재수 미니아크) |
| Arc 3 | 10개 | 8개 | 높음 |
| Arc 4 | 8개 | 6개 | 중간 |
| Arc 5 | 10개 | 8개 | 높음 |
| Arc 6 | 8개 | 6개 | 높음 |
| Arc 7 | 6개 | 5개 | 높음 (수렴) |

---

## 8. 콘텐츠 작성 순서 (권장)

1. **Arc 2 먼저** — `exam_score` 플래그가 가장 많은 하류 이벤트를 결정하므로 우선 설계
2. **Arc 0, 1** — 플래그 생성 이벤트. 비교적 단순
3. **Arc 3, 4** — Arc 2 플래그 소비. Arc 2 완료 후
4. **Arc 5, 6** — 직장/30대. 기존 10개 이벤트를 정리/이관
5. **Arc 7** — 마지막. 전체 플래그 조합 테스트 후 작성
6. **Arc 2.5** — 재수 미니아크. Arc 2~3 사이 삽입

---

## 9. 금지 사항

- 선택지에 정답 암시 금지 (label이나 outcome에서 "현명한 선택" 같은 표현 없이)
- 모든 이벤트를 도덕 딜레마로 만들지 말 것
- 8차원 embedding에 의미를 억지로 맞추지 말 것 (embedding은 보조, 스토리가 주)
- 한 이벤트에 선택지 4개 이상 금지 (2~3개 권장)
- outcome이 지나치게 단정적이면 안 됨 ("당신은 성공했다" → "당신은 성공 가능성을 높였다")

---

## 10. 파일 구조

```
public/
  content.js          ← 전체 이벤트 데이터 (ARC별로 섹션 구분)

content/              ← 작업용 초안 (게임에 직접 로드 안 됨)
  arc0_elementary.js
  arc1_middle.js
  arc2_highschool.js
  arc2_5_repeat.js    ← 재수 미니아크
  arc3_university.js
  arc4_job_hunt.js
  arc5_early_career.js
  arc6_thirties.js
  arc7_midlife.js
  flags.js            ← 전역 플래그 정의 및 기본값
```

각 아크 파일을 독립적으로 작성하고 검토한 뒤 `content.js`에 병합한다.

---

*최종 수정: 2026-06-16*

---

## 11. Schema Calibration (2026-06-16)

- Draft content files under `content/` must be valid CommonJS modules. Each arc exports one arc object, and `flags.js` exports `FLAG_DEFINITIONS`, `FLAG_DEFAULTS`, and `matchesFlags`.
- Events and actions may both use `requires` / `excludes`. Event-level conditions decide whether the event can appear; action-level conditions decide whether a specific action can appear inside an otherwise available event.
- `sets` accepts `null` as a clear/unset operation for nullable flags, for example `{ university_tier: null }`.
- Event actions allow 2-4 choices. Three is still the default target, but four choices are allowed for high-branching scenes; the runtime may later surface only a subset to create replay variation.
- Current flag definitions do not include `career_trajectory`; Arc 5 should use `reputation` and concrete career flags until that flag is intentionally introduced.
- Run `node test/story-content.test.mjs` before merging new story arcs. `npm test` includes this validator.
