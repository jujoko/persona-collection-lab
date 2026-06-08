# M2 서술 생성 구현 계획

## Context

`persona_simulation_research_context.md` 4.3절에 따르면 M2의 역할은 단순한 행동 선택이 아니다.

```
페르소나 구조 + 사건 구조
→ 행동
→ 근거와 판단 서술
→ 변화된 페르소나 구조
```

현재 구현은 행동 선택(latent × action embedding 점수)만 하고, 서술은 규칙 기반 고정 텍스트로 때우고 있다.
이것을 latent persona를 반영한 동적 서술로 교체한다.

**설계 원칙:**
- 서술 생성은 표현 레이어다. 행동 선택(latent 기반)과 분리한다.
- `generateNarration()` 함수 하나로 추상화해서 모델이 바뀌어도 코드 수정 없이 교체 가능하게 한다.
- 지금: Hugging Face Inference API (소형 오픈소스 모델)
- 나중: 수집 데이터로 fine-tune한 커스텀 M2 모델로 교체

---

## 변경 파일 목록

| 파일 | 변경 종류 |
|---|---|
| `.env` | `HF_API_TOKEN` 추가 |
| `narrate.mjs` | 신규 — `generateNarration()` 추상화 레이어 |
| `server.mjs` | `POST /api/narrate` 엔드포인트 추가 |
| `app.js` | 시뮬레이션 후 `/api/narrate` 호출, 서술 교체 |

`engine.js`는 수정하지 않는다. 행동 선택 로직은 그대로 유지.

---

## 1. 모델 선택

**초기 모델: `Qwen/Qwen2.5-1.5B-Instruct`**

선택 이유:
- Apache 2.0 라이선스 (상업적 사용 및 fine-tune 자유)
- 1.5B 파라미터로 HF 무료 티어에서 추론 가능
- 한국어 지원
- 나중에 같은 Qwen 계열의 더 큰 모델 또는 fine-tuned 버전으로 교체 용이

모델 교체 시 `narrate.mjs`의 `MODEL_ID` 상수 하나만 바꾸면 된다.

---

## 2. narrate.mjs (신규)

서술 생성 추상화 레이어. HF API 호출과 프롬프트 구성을 담당.

```
HF_API_TOKEN = process.env.HF_API_TOKEN
MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
HF_ENDPOINT = `https://api-inference.huggingface.co/models/${MODEL_ID}`
```

### generateNarration(payload) → string

**입력 (payload):**
```json
{
  "character_prompt": "겁이 많지만 친구를 버리지 못하는 기사...",
  "development_summary": ["안정 애착을 배운다", "역할과 의무를 내면화한다"],
  "event_title": "무너지는 다리",
  "event_summary": "동료 한 명이 무너지는 다리 위에 남겨져 있다...",
  "action_label": "되돌아가 동료를 구한다",
  "latent_highlights": ["z2: +0.71 (높음)", "z4: -0.38 (낮음)"]
}
```

latent vector 원시값(0.21, -0.58...)을 그대로 LLM에 넘기는 건 의미가 없다.
대신 상위/하위 차원을 추출해서 "z2가 높다 / z4가 낮다" 형태로 변환해 컨텍스트로 제공한다.
이 해석 레이블은 데이터가 쌓이면 실제 의미로 교체할 수 있다.

**LLM 프롬프트 구조:**
```
[시스템]
당신은 캐릭터의 내면을 서술하는 작가입니다.
주어진 캐릭터 정보와 잠재 성향 신호를 바탕으로,
캐릭터가 왜 이 행동을 선택했는지 2~3문장으로 서술하세요.
과거 성장 맥락과 현재 성향을 반영해야 합니다.

[유저]
캐릭터: {character_prompt}
성장 과정: {development_summary}
사건: {event_title} — {event_summary}
선택한 행동: {action_label}
잠재 성향 신호: {latent_highlights}

이 캐릭터가 이 행동을 선택한 이유를 서술하세요.
```

**출력:** 서술 텍스트 string

**fallback:** HF API 호출 실패 시 기존 engine.js의 규칙 기반 rationale을 그대로 반환.

---

## 3. server.mjs 추가 엔드포인트

**POST /api/narrate**

```
입력: { character_prompt, development_summary, event_title, event_summary, action_label, latent_vector }
처리: latent_vector → latent_highlights 변환 → generateNarration() 호출
출력: { ok: true, narration: "..." }
실패: { ok: false, error: "...", fallback: true }
```

latent_highlights 변환 로직 (server.mjs 내부):
- 8차원 중 절댓값 상위 2개 추출
- 양수면 "높음", 음수면 "낮음" 레이블 부여
- 나중에 데이터 기반으로 차원별 의미 레이블로 교체 가능한 구조로 작성

---

## 4. app.js 변경

시뮬레이션 완료 후, 각 사건 카드를 렌더링하기 전에 `/api/narrate` 호출.

**흐름:**
```
PersonaEngine.simulate() 완료 (행동 선택 완료)
→ 각 event에 대해 POST /api/narrate 호출 (비동기, 병렬)
→ 응답 받으면 카드의 rationale 텍스트 교체
→ 실패 시 기존 rule-based rationale 유지
```

사용자 경험:
- 시뮬레이션 카드가 먼저 rule-based 텍스트로 즉시 렌더링
- LLM 응답 오면 텍스트가 동적으로 교체 (로딩 스피너 표시)
- 서버 없을 때는 기존 텍스트 그대로

---

## 5. 환경변수

`.env`에 추가:
```
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

HF 토큰은 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 에서 발급.
Read 권한 토큰으로 충분.

---

## 6. 나중에 커스텀 M2로 교체할 때

1. fine-tuned 모델을 HF에 업로드
2. `narrate.mjs`의 `MODEL_ID`를 커스텀 모델로 변경
3. 프롬프트 구조를 fine-tune 입력 형식에 맞게 수정
4. 나머지 코드는 수정 없음

---

## 검증 방법

1. `.env`에 `HF_API_TOKEN` 추가 후 서버 재시작
2. 샘플 캐릭터로 시뮬레이션 실행
3. 사건 카드 rationale이 캐릭터마다 다른 텍스트로 나오는지 확인
4. 같은 사건 + 다른 두 캐릭터 비교 시 서술이 다른지 확인
5. 서버 종료 후 index.html 직접 열어 fallback 동작 확인
6. 서버 로그에서 `[NARRATE]` 성공/실패 로그 확인
