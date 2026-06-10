# M2 현황 및 학습 계획

## 역할

latent persona vector와 사건을 받아 행동을 결정한다.

```
latent (8-dim) + event → action_id
```

---

## 현재 상태: rule-based (cosine similarity)

`public/engine.js`에서 latent vector와 각 action의 embedding을 cosine similarity로 비교해 가장 가까운 행동을 선택한다.

```javascript
// 각 행동에 수동으로 설정된 embedding
{ id: "reports_to_authorities", embedding: [0.18, -0.32, 0.72, ...] }
{ id: "stays_silent",           embedding: [-0.14, 0.24, -0.58, ...] }
```

---

## 문제: action embedding의 정당성

action embedding 값은 수동으로 설계됐다. "내부고발은 자율성(z2)이 높을 것"이라는 직관으로 설정한 값이라, 실제 페르소나 행동과 얼마나 일치하는지 검증되지 않았다.

이 값으로 KV injection M2를 학습시키면 "검증되지 않은 설계를 모방하는 것"에 불과하다.

---

## 설계된 구조: KV Injection

```
latent [D]
    ↓
adapter MLP [D → 32]        ← D가 바뀌면 이것만 재학습
    ↓
KV projection [32 → 14336]  ← 28레이어 × 2(K,V) × 2(kv_heads) × 128(head_dim)
    ↓
past_key_values
    ↓
Qwen2.5-1.5B (frozen)
    ↓
action_id (JSON)
```

왜 KV injection인가: embedding prepend와 달리 KV prefix는 모든 28개 레이어에서 attention을 통해 latent 신호가 지속적으로 작용한다.

---

## 학습 보류 이유

올바른 학습 신호가 없다:

| 방법 | 문제 |
|---|---|
| rule-based M2 distillation | 검증되지 않은 수동 embedding을 모방하는 것 |
| Nemotron + Qwen judge | Qwen이 페르소나 텍스트보다 사건 문구에 과반응하는 편향 |
| 유저 피드백 | ✅ 올바른 신호 — 배포 전엔 없음 |

---

## 올바른 학습 순서

```
1. 배포 → 유저가 게임 플레이
2. 피드백 수집: "이 캐릭터답다(consistent) / 아니다(wrong)"
3. M3로 latent schema 분석 → 어떤 차원이 행동 차이를 설명하는지 발견
4. action embedding 데이터 기반으로 재설정
5. (latent, event, action, feedback) 쌍으로 KV injection 학습
```

---

## 학습 신호 설계 (배포 후)

```python
# feedback = "consistent" → 이 행동이 이 latent에 맞음
loss = -weight * log P(action_id | event, latent_kv_prefix)

# weight
CONFIDENCE_WEIGHT = {"consistent": 1.0, "ambiguous": 0.4, "wrong": -1.0}
```

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `public/engine.js` | rule-based M2 (현재 동작 중) |
| `ml/train_m2.py` | KV injection 학습 스크립트 (대기 중) |
| `ml/inference.py` | Qwen 로컬 추론 서버 |
| `docs/claude/design-m2-kv-injection.md` | KV injection 아키텍처 상세 |
