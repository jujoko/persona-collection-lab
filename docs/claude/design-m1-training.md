# M1 설계 및 학습

## 역할

유저가 입력한 자유 텍스트 프롬프트를 8차원 latent persona vector로 변환한다.

```
자유 텍스트 → MiniLM (384-dim) → adapter MLP → latent (8-dim)
```

---

## 아키텍처

| 레이어 | 입력 | 출력 | 학습 여부 |
|---|---|---|---|
| MiniLM (all-MiniLM-L6-v2) | 텍스트 | 384-dim | ❌ frozen |
| Linear(384→64) + ReLU | 384-dim | 64-dim | ✅ |
| Linear(64→8) + Tanh | 64-dim | 8-dim | ✅ |

파라미터 수: ~25K (매우 가벼움)  
출력 범위: [-1, 1] (Tanh)

---

## 학습 방식: Triplet Loss (Metric Learning)

### 왜 Triplet Loss인가

정답 latent 값이 없다. 아는 것은 "이 두 페르소나가 저 페르소나보다 더 비슷하다"는 상대적 관계뿐이므로, 절대값이 아닌 상대적 거리를 학습 신호로 쓰는 Triplet Loss를 사용한다.

### 손실 함수

```
L = max(0, d(anchor, positive) - d(anchor, negative) + margin)
```

- anchor와 positive의 거리가 anchor와 negative의 거리보다 margin 이상 작아지면 loss = 0
- 그렇지 않으면 차이만큼 penalty

### Triplet 구성

Nemotron-Personas-Korea의 구조화된 필드로 유사도를 계산한다:

| 필드 | 유사 조건 |
|---|---|
| age | 차이 < 10세 |
| sex | 동일 |
| education_level | 동일 |
| family_type | 동일 |
| marital_status | 동일 |

- positive pair: 필드 유사도 ≥ 0.6 (5개 중 3개 이상 일치)
- negative pair: 필드 유사도 ≤ 0.2 (5개 중 1개 이하 일치)

---

## 학습 데이터

- 출처: Nemotron-Personas-Korea (nvidia/Nemotron-Personas-Korea)
- 사용량: 5,000개 페르소나 (전체 100만 중 샘플)
- Triplet 수: 50,000개

---

## 학습 결과

| | 학습 전 | 학습 후 |
|---|---|---|
| latent 거리 범위 | 0.008~0.019 (near-zero 밀집) | 0.4~2.1 (공간 분산) |
| 유사 페르소나 거리 | 0.008 | 0.5~0.9 |
| 이질 페르소나 거리 | 0.017 | 1.4~2.1 |

학습 후 인구통계 유사 페르소나끼리 latent 공간에서 더 가깝게 배치됨.

---

## 가중치 파일

- 경로: `ml/m1_adapter.pt`
- 로드 방법:
  ```python
  adapter = M1Adapter()
  adapter.load_state_dict(torch.load("ml/m1_adapter.pt"))
  ```

---

## 한계 및 다음 단계

### 현재 한계

"인구통계 유사 = 행동 유사"라는 가정에 기반한다. 이 가정이 틀릴 수 있다 — 같은 나이, 같은 직업이라도 사람마다 다른 선택을 한다.

### 다음 단계

1. **서버 연동**: `server.mjs`에서 `m1_adapter.pt`를 로드해 실제 프롬프트 → latent 변환에 사용
2. **배포 후 fine-tune**: 실제 유저 피드백 ("이 캐릭터답다/아니다") 데이터로 Triplet을 재구성해 재학습
   - 같은 사건에서 같은 선택 → positive pair
   - 같은 사건에서 다른 선택 → negative pair
   - 이게 인구통계 기반보다 훨씬 직접적인 신호

### 관련 스크립트

| 파일 | 역할 |
|---|---|
| `ml/train_m1.py` | 학습 |
| `ml/test_m1.py` | 학습 전/후 거리 비교 테스트 |
| `ml/m1_adapter.pt` | 학습된 가중치 |
