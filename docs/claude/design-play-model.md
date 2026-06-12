# Play Model 설계

## 역할

페르소나 텍스트 입력 → 그 사람답게 행동 선택.

M1/M2/M3가 연구 목적(latent space 검증)이라면, Play Model은 **게임 품질 전담** 모델이다.
게임이므로 완벽한 심리 모델이 아니라 "그럴듯함"이 목표다.

---

## 왜 별도 모델인가

현재 M2(rule-based cosine similarity)의 문제:

- action embedding 값이 수동 설계 → 검증되지 않은 신호
- 페르소나 텍스트가 행동에 직접 반영되지 않음
- "이 사람다운 행동"이 나오지 않음

Play Model은 페르소나 텍스트에서 **실제 행동 속성(skills, hobbies)** 을 먼저 뽑고, 그것으로 행동을 결정한다.

---

## 구조

### Stage 1 — 텍스트 → 행동 속성 예측 (학습 필요)

```
페르소나 텍스트
    ↓
MiniLM (384-dim, frozen)
    ↓ ↓
Skills Head    Hobbies Head
(MLP)          (MLP)
    ↓               ↓
skills_emb     hobbies_emb
```

### Stage 2 — 행동 속성 → action 선택 (학습 불필요)

```
skills_emb + hobbies_emb
    ↓
각 action 설명 텍스트와 cosine similarity
    ↓
similarity 가장 높은 action_id 선택
```

게임이므로 cosine similarity 수준의 근사로 충분하다.

---

## 학습 전략

### 데이터

Nemotron-Personas-Korea의 paired 데이터를 그대로 사용한다.

```
입력:  persona 텍스트 (+ professional_persona, family_persona 등)
정답1: skills_and_expertise_list  ["문제 해결", "현장 인력 중재", ...]
정답2: hobbies_and_interests_list ["등산", "독서", "봉사활동", ...]
```

외부 judge 모델 불필요. Nemotron 자체가 레이블이다.

### 손실 함수

리스트 아이템 각각을 MiniLM으로 임베딩 → 평균 → **target 벡터**.  
모델 출력과 target 벡터 간 cosine similarity를 최대화한다.

```python
# target: 리스트 아이템 임베딩의 평균
target_emb = mean(MiniLM(item) for item in skills_list)

# loss: 1 - cosine_similarity(predicted, target)
loss = 1 - cos_sim(skills_head(persona_emb), target_emb)
```

Skills Head와 Hobbies Head를 동시에 학습한다 (multi-task).

### 하이퍼파라미터

| 항목 | 값 |
|---|---|
| 학습 데이터 | Nemotron 10,000개 |
| Batch size | 128 |
| LR | 1e-3 |
| Epochs | 20 |
| Head 구조 | Linear(384→128) + ReLU + Linear(128→384) |

Head 출력은 MiniLM과 같은 384-dim으로 맞춘다. action 설명 텍스트도 MiniLM으로 임베딩하기 때문이다.

---

## Stage 2 동작 예시

```
예측된 skills: ["문제 해결", "원칙 준수", "법적 절차 이해"]
예측된 hobbies: ["봉사활동", "독서", "커뮤니티 모임"]

ME001 (내부고발) action 후보:
  "감사 부서 혹은 외부 기관에 신고한다"  → similarity 0.81 ✅
  "모른 척하고 넘어간다"                 → similarity 0.29
  "팀장에게 직접 따진다"                 → similarity 0.53
→ reports_to_authorities 선택
```

---

## 추론 방식 비교 계획 (학습 완료 후)

두 가지 추론 방식을 모두 구현하고 속도 / 정확도 비교:

| | PyTorch | ONNX + INT8 quantization |
|---|---|---|
| 구현 파일 | `ml/inference_server.py` | `ml/inference_server_onnx.py` |
| 변환 스크립트 | — | `ml/convert_to_onnx.py` |
| CPU 추론 속도 | ~500ms | ~50~150ms (예상) |
| 정확도 | 기준 | 미세한 차이 예상 |

비교 결과에 따라 배포 서버에서 사용할 방식 결정.

---

## 파일 구성

| 파일 | 역할 |
|---|---|
| `ml/train_play_model.py` | Stage 1 학습 |
| `ml/play_model_inference.py` | Stage 1+2 추론 |
| `ml/play_model.pt` | 학습된 가중치 (생성됨) |

---

## 게임 연동

`src/server.mjs`에 `/api/play_action` 엔드포인트 추가.  
현재 rule-based M2와 병렬 운영 후 품질 검증 후 교체.

---

## 인코더 불일치 주의사항

Play Model은 `klue/roberta-base` (768-dim)을 인코더로 사용한다.
M1은 `all-MiniLM-L6-v2` (384-dim)을 인코더로 사용한다.

두 모델의 임베딩 공간이 다르기 때문에:

- Stage 2에서 action 설명 텍스트를 임베딩할 때 반드시 **klue/roberta-base**를 써야 한다
- M1의 latent vector와 Play Model의 출력 벡터는 직접 비교할 수 없다
- 나중에 두 파이프라인을 통합하거나 공유 인코더를 쓰려면 M1도 재학습 필요

현재는 Play Model(게임 품질)과 M1(latent 연구)이 독립적으로 동작하므로 문제없다.
통합이 필요해지는 시점에 인코더를 맞출 것.

---

## M1/M2/M3와의 관계

| | Play Model | M1/M2/M3 |
|---|---|---|
| 목적 | 게임 품질 | latent space 연구 |
| 학습 신호 | Nemotron skills/hobbies | Triplet Loss / 유저 피드백 |
| 행동 결정 | cosine similarity | latent → KV injection |
| 현재 상태 | 설계 완료 | M1 학습 완료, M2/M3 대기 |

두 파이프라인은 독립적으로 운영된다. Play Model이 게임 품질을 담당하고, M1/M2/M3는 연구 목적의 latent 검증을 담당한다.
