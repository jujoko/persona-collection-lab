# M2 KV Injection 설계

## 문제 정의

현재 M2는 latent vector를 텍스트로 변환해서 Qwen에 넘긴다.
이 방식은 Qwen이 숫자 텍스트를 힌트로 읽는 것이라 latent 공간이 실제로
행동 예측에 기여하는지 검증할 수 없다.

## 새 구조

```
latent [D]               D는 M3가 결정 (가변)
    ↓
adapter MLP [D → 32]     D가 바뀌면 이것만 재학습
    ↓
KV projection            각 레이어의 K, V 쌍 생성
[32 → n_layers × 2 × n_kv_heads × head_dim]
    ↓
past_key_values          Qwen 각 레이어에 직접 주입
    ↓
Qwen2.5-1.5B (frozen)    latent를 조건으로 행동 결정
    ↓
action_id (JSON)
```

## Qwen2.5-1.5B 파라미터

| 항목 | 값 |
|---|---|
| hidden_size | 1536 |
| num_hidden_layers | 28 |
| num_attention_heads | 12 |
| num_key_value_heads | 2 (GQA) |
| head_dim | 128 |

KV projection 출력 크기: `28 × 2 × 2 × 128 = 14,336`

## 학습 대상

| 구성 요소 | 파라미터 수 | 학습 여부 |
|---|---|---|
| adapter MLP (D→32) | D×32 + 32 ≈ 수백개 | ✅ 학습 |
| KV projection (32→14336) | 32×14336 ≈ 459K | ✅ 학습 |
| Qwen2.5-1.5B | 1.5B | ❌ frozen |

## 학습 방식

수집된 `(latent_before, event_id, action_id, feedback_signal)` 데이터 사용.

**손실 함수:**
- latent → KV prefix 생성
- Qwen에 KV prefix + 사건 프롬프트 입력
- Qwen이 올바른 action_id를 출력할 log probability 계산
- feedback_signal로 가중치 부여:
  - `consistent` → 이 행동이 옳음, log prob 최대화
  - `wrong`       → 이 행동이 틀림, log prob 최소화
  - `ambiguous`   → 약한 신호, 작은 gradient

```
loss = -weight × log P(action_id | event, latent_kv_prefix)
```

## 학습 후 검증

projection layer만으로 행동 예측이 잘 된다
→ latent 공간이 행동을 조건화하는 유효한 표현 공간

아무리 학습해도 잘 안 된다
→ latent 공간 문제 → M3 재설계 필요

## 파일

| 파일 | 역할 |
|---|---|
| `ml/train_m2.py` | projection layer 학습 |
| `ml/m2_projection.pt` | 학습된 가중치 (생성됨) |
| `ml/inference.py` | 학습된 가중치를 로드해 추론 |
