# M2 행동 결정 설계

## 핵심 원칙

M2는 "텍스트를 나중에 덮어씌우는 모델"이 아니라
**latent vector × event → 행동 결정 + 서술** 을 담당하는 판단 모델이다.

기존 코드에서 PersonaEngine(룰 기반 JS)이 행동을 결정하고
M2가 사후에 텍스트만 교체하던 구조를 바꾼다.

---

## 역할 분담

| 담당 | PersonaEngine (유지) | M2 (변경) |
|---|---|---|
| **입력** | character prompt, latent vector | latent vector + event + choices |
| **담당** | 이벤트 목록, 선택지 정의, embedding, ending 가중치 | 어떤 선택지를 고를지 + 서술 텍스트 |
| **출력** | 구조 데이터 (id, embedding, endingWeight) | action_id + 서술 필드들 |

PersonaEngine이 제공하는 선택지(actions / adaptations)에서
M2가 하나를 고르고, 해당 embedding은 엔진이 latent 업데이트에 사용한다.

---

## M2 입출력 스펙

### World Events (성인기 사건)

```
입력:
  - character_prompt
  - development_history: ["복종하면 안전하다", "공적 책임을 받아들인다", ...]
  - latent_highlights: "z2: +0.72 (강함,양), z0: +0.61 (강함,양), ..."
  - event_title, event_summary
  - actions: [{ id, label }, ...]

출력 JSON:
  {
    "action_id": "returns_to_save_friend",
    "outcome": "그는 쓰러지는 목재 사이를 뚫고...",
    "rationale": "복종과 인정 사이에서 자란 그에게..."
  }
```

**action_id는 반드시 actions[] 중 하나의 id여야 한다.**
유효하지 않으면 서버가 엔진 fallback으로 처리한다.

### Growth Phase (성장기 사건)

```
입력:
  - character_prompt
  - current_latent_highlights
  - event_title, event_summary
  - adaptations: [{ id, label }, ...]

출력 JSON:
  {
    "adaptation_id": "anxious_attachment",
    "adaptation_label": "버려질 수 있다는 감각을 배운다",
    "summary": "어린 손길은 때로 따뜻했지만...",
    "rationale": "전쟁통에 태어나 늘 불안했던..."
  }
```

---

## 실행 흐름

```
runSimulationWithM2(character)
  │
  ├─ PersonaEngine: M3 schema + M1 latent seed 계산
  │
  ├─ Growth Phase (G001~G004) 순차 처리:
  │    for each event:
  │      PersonaEngine.buildGrowthStep(event, latent)  → choices 목록
  │      POST /api/decide { type:"growth", ... }       → M2 판단
  │      PersonaEngine.applyAdaptationResult(id, latent) → 새 latent 계산
  │      renderGrowthCard(m2Result + engineData)
  │
  ├─ World Events (E001~E005) 순차 처리:
  │    for each event:
  │      PersonaEngine.buildWorldStep(event, latent)   → choices 목록
  │      POST /api/decide { type:"world", ... }        → M2 판단
  │      PersonaEngine.applyActionResult(id, event)    → embedding + endingWeight
  │      renderEventCard(m2Result + engineData)
  │
  └─ PersonaEngine.scoreEnding(events) → 최종 엔딩 결정
```

---

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `engine.js` | `buildGrowthStep()`, `applyAdaptationResult()`, `buildWorldStep()`, `applyActionResult()` 추가 (기존 simulate() 유지) |
| `narrate.mjs` | `generateGrowthDecision()`, `generateWorldDecision()` 추가 |
| `inference.py` | `/decide` 엔드포인트 추가 (JSON 강제 파싱 + action_id 검증) |
| `server.mjs` | `POST /api/decide` 추가 |
| `app.js` | `runSimulationWithM2()` 추가, M2 없을 때 기존 `runSimulation()` fallback |

---

## Fallback 전략

M2 서버 없음 / 응답 실패 / action_id 유효하지 않음
→ PersonaEngine 룰 기반 결정 사용 (기존 동작 유지)

이렇게 하면 inference.py 없이도 앱이 동작한다.
