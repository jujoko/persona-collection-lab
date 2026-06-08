"""
M2 Projection Layer 학습 스크립트
====================================
수집된 피드백 데이터로 latent → KV injection projection layer를 학습한다.
Qwen2.5-1.5B는 frozen 상태로 유지하고, adapter MLP + KV projection만 학습.

구조:
    latent [D] → adapter MLP [D→32] → KV projection [32→14336]
    → past_key_values → Qwen (frozen) → action_id

실행:
    python ml/train_m2.py
    python ml/train_m2.py --latent-dim 16
    python ml/train_m2.py --url http://my.app --epochs 30

출력:
    ml/m2_projection.pt   — 학습된 projection layer 가중치
"""

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModelForCausalLM

# ─── Qwen2.5-1.5B 아키텍처 상수 ───────────────────────────────────────────────
N_LAYERS    = 28
N_KV_HEADS  = 2
HEAD_DIM    = 128
HIDDEN_DIM  = 1536
ADAPTER_DIM = 32
MODEL_ID    = "Qwen/Qwen2.5-1.5B-Instruct"


# ─── Projection Layer ─────────────────────────────────────────────────────────

class LatentKVProjection(nn.Module):
    """
    latent [D] → KV prefix (past_key_values 형식)

    adapter MLP:   D → ADAPTER_DIM (tanh)
    kv_projection: ADAPTER_DIM → N_LAYERS × 2 × N_KV_HEADS × HEAD_DIM
    """

    def __init__(self, latent_dim: int):
        super().__init__()
        kv_flat_dim = N_LAYERS * 2 * N_KV_HEADS * HEAD_DIM  # 28×2×2×128 = 14336

        self.adapter = nn.Sequential(
            nn.Linear(latent_dim, ADAPTER_DIM),
            nn.Tanh(),
        )
        self.kv_proj = nn.Linear(ADAPTER_DIM, kv_flat_dim)

    def forward(self, latent: torch.Tensor):
        """
        latent: [batch, latent_dim]
        반환:   past_key_values — [(K, V), ...] × N_LAYERS
                K, V shape: [batch, N_KV_HEADS, 1, HEAD_DIM]
        """
        h = self.adapter(latent)                              # [B, ADAPTER_DIM]
        flat = self.kv_proj(h)                                # [B, 14336]
        flat = flat.view(-1, N_LAYERS, 2, N_KV_HEADS, HEAD_DIM)  # [B, 28, 2, 2, 128]

        past_kv = []
        for i in range(N_LAYERS):
            k = flat[:, i, 0, :, :].unsqueeze(2)  # [B, N_KV_HEADS, 1, HEAD_DIM]
            v = flat[:, i, 1, :, :].unsqueeze(2)
            past_kv.append((k, v))
        return past_kv


# ─── 피드백 가중치 ───────────────────────────────────────────────────────────

FEEDBACK_WEIGHT = {
    "consistent":  1.0,
    "ambiguous":   0.2,
    "wrong":      -1.0,
}

CONFIDENCE_WEIGHT = {
    "high":    1.0,
    "medium":  0.6,
    "low":     0.2,
    "unknown": 0.5,
}


# ─── 데이터 로드 ──────────────────────────────────────────────────────────────

def load_server_data(server_url: str) -> dict:
    url = server_url.rstrip("/") + "/api/export"
    print(f"[M2] 서버 데이터 로드: {url}")
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode())


def load_synthetic_data(path: str) -> list[dict]:
    """build_training_data.py가 생성한 JSONL 합성 데이터 로드."""
    rows = []
    p = Path(path)
    if not p.exists():
        return rows
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    print(f"[M2] 합성 데이터 로드: {len(rows)}개 ({path})")
    return rows


def build_examples_from_feedback(feedback_rows: list[dict], latent_dim: int) -> list[dict]:
    """
    실제 피드백 데이터 → 학습 예제.
    latent_before가 있어야 사용 가능.
    """
    examples = []
    for row in feedback_rows:
        lb  = row.get("latent_before") or row.get("raw", {}).get("latent_before")
        eid = row.get("event_id")
        act = row.get("action")
        sig = row.get("feedback_signal")
        if not (lb and eid and act and sig):
            continue
        if len(lb) != latent_dim:
            continue
        weight = FEEDBACK_WEIGHT.get(sig)
        if weight is None:
            continue
        examples.append({
            "latent":    torch.tensor(lb, dtype=torch.float32),
            "event_id":  eid,
            "action_id": act,
            "weight":    weight,
            "source":    "feedback",
        })
    return examples


def build_examples_from_synthetic(
    synthetic_rows: list[dict],
    latent_dim: int,
    m1_encoder,          # encodeTextToLatent 역할의 함수
) -> list[dict]:
    """
    합성 데이터 → 학습 예제.
    persona_text를 MiniLM으로 임베딩 → latent로 변환.
    m1_encoder: (persona_text) -> np.ndarray [latent_dim]
    """
    examples = []
    for row in synthetic_rows:
        eid  = row.get("event_id")
        act  = row.get("action_id")
        conf = row.get("confidence", "unknown")
        text = row.get("persona_text", "")
        if not (eid and act and text):
            continue
        weight = CONFIDENCE_WEIGHT.get(conf, 0.5)
        try:
            latent = m1_encoder(text)
            if len(latent) != latent_dim:
                continue
            examples.append({
                "latent":    torch.tensor(latent, dtype=torch.float32),
                "event_id":  eid,
                "action_id": act,
                "weight":    weight,
                "source":    "synthetic",
            })
        except Exception:
            continue
    return examples


# ─── 프롬프트 구성 ────────────────────────────────────────────────────────────

# 사건 ID → 사건 요약 (engine.js EVENTS와 동기화)
EVENT_SUMMARIES = {
    "E001": "동료 한 명이 무너지는 다리 위에 남겨져 있다. 구하려면 본인도 죽을 수 있고, 버리면 동료는 죽는다.",
    "E002": "적군 장교가 동료들의 위치를 넘기면 본인과 가족은 살려주겠다고 제안한다.",
    "E003": "남은 식량은 하루치뿐이다. 아이들에게 주면 병사들이 굶고, 병사들에게 주면 아이들이 죽을 수 있다.",
    "E004": "금지된 마법을 쓰면 전쟁을 끝낼 수 있다. 그러나 사용자는 점차 인간성을 잃는다.",
    "E005": "왕은 반란군을 모두 처형하라고 명령한다. 그러나 그중에는 억울하게 끌려온 민간인도 있다.",
}

SYSTEM_PROMPT = (
    "당신은 캐릭터의 행동을 결정하는 AI입니다. "
    "반드시 아래 JSON 형식만 출력하세요. "
    '{"action_id":"...","outcome":"...","rationale":"..."}'
)


def make_prompt(event_id: str, action_id: str) -> tuple[str, str]:
    """
    (user_prompt, target_text) 반환.
    target_text: 모델이 생성해야 할 텍스트 (teacher forcing 용)
    """
    summary = EVENT_SUMMARIES.get(event_id, f"사건 {event_id}")
    user = f"사건: {summary}\n이 캐릭터가 어떤 행동을 할지 JSON으로 응답하세요."
    target = json.dumps({"action_id": action_id, "outcome": "", "rationale": ""}, ensure_ascii=False)
    return user, target


# ─── 손실 계산 ───────────────────────────────────────────────────────────────

def compute_loss(
    model, tokenizer, projection: LatentKVProjection,
    examples: list[dict], device: str
) -> torch.Tensor:
    """
    전체 배치 손실 = weighted cross-entropy on action_id tokens
    """
    total_loss = torch.tensor(0.0, device=device, requires_grad=True)
    count = 0

    for ex in examples:
        latent = ex["latent"].unsqueeze(0).to(device)   # [1, D]
        weight = ex["weight"]

        user_text, target_text = make_prompt(ex["event_id"], ex["action_id"])

        # KV prefix 생성
        past_kv = projection(latent)

        # 프롬프트 토크나이징
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_text},
        ]
        prompt_text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        prompt_ids = tokenizer(prompt_text, return_tensors="pt").input_ids.to(device)

        # target 토크나이징 (생성해야 할 텍스트)
        target_ids = tokenizer(target_text, return_tensors="pt").input_ids.to(device)

        # teacher forcing: prompt + target을 붙여서 forward
        # KV prefix가 past_key_values로 선행 컨텍스트 역할
        input_ids  = torch.cat([prompt_ids, target_ids], dim=1)
        labels     = torch.cat([
            torch.full_like(prompt_ids, -100),   # prompt 부분은 loss 계산 제외
            target_ids
        ], dim=1)

        with torch.no_grad() if weight == 0 else torch.enable_grad():
            out = model(
                input_ids=input_ids,
                past_key_values=past_kv,
                use_cache=False,
            )

        # cross-entropy: target 토큰들의 log probability
        logits = out.logits[:, prompt_ids.shape[1] - 1 : -1, :]  # [1, target_len, vocab]
        flat_logits = logits.reshape(-1, logits.shape[-1])
        flat_labels = target_ids.reshape(-1)

        ce = nn.functional.cross_entropy(flat_logits, flat_labels)
        total_loss = total_loss + weight * ce
        count += 1

    return total_loss / max(count, 1)


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="M2 KV Projection 학습")
    parser.add_argument("--url",        default="http://localhost:8787",
                        help="게임 서버 URL (실제 피드백 데이터 로드)")
    parser.add_argument("--synthetic",  default="ml/synthetic_training_data.jsonl",
                        help="합성 학습 데이터 경로 (build_training_data.py 출력)")
    parser.add_argument("--latent-dim", type=int, default=8,
                        help="latent 차원 수 (M3 schema의 latent_dimension)")
    parser.add_argument("--epochs",     type=int, default=20)
    parser.add_argument("--lr",         type=float, default=3e-4)
    parser.add_argument("--min-samples",type=int, default=5)
    parser.add_argument("--out",        default="ml/m2_projection.pt")
    args = parser.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[M2] device: {device}  latent_dim: {args.latent_dim}")

    # ── 1. 데이터 로드 ──────────────────────────────────────────────────────

    # 1-A. 실제 피드백 데이터 (게임 서버)
    feedback_examples = []
    try:
        data = load_server_data(args.url)
        feedback_examples = build_examples_from_feedback(
            data.get("feedback", []), args.latent_dim
        )
        print(f"[M2] 피드백 예제: {len(feedback_examples)}개")
    except Exception as e:
        print(f"[경고] 서버 데이터 로드 실패 ({e}) — 합성 데이터만 사용")

    # 1-B. 합성 데이터 (Nemotron judge)
    synthetic_rows = load_synthetic_data(args.synthetic)
    synthetic_examples = []
    if synthetic_rows:
        # MiniLM 임베딩 → latent 변환 (간단한 해시 fallback)
        import numpy as np

        def simple_m1(text: str) -> list[float]:
            """M1 fallback: 텍스트 해시 기반 초기화 (MiniLM 서버 없을 때)."""
            h = 2166136261
            for c in text[:200]:
                h ^= ord(c)
                h = (h * 16777619) & 0xFFFFFFFF
            import math
            return [math.tanh(math.sin(h * (i + 3) * 0.017 + i * 11.31))
                    for i in range(args.latent_dim)]

        synthetic_examples = build_examples_from_synthetic(
            synthetic_rows, args.latent_dim, simple_m1
        )
        print(f"[M2] 합성 예제: {len(synthetic_examples)}개")

    examples = feedback_examples + synthetic_examples
    print(f"[M2] 전체 학습 예제: {len(examples)}개 "
          f"(피드백 {len(feedback_examples)} + 합성 {len(synthetic_examples)})")

    if len(examples) < args.min_samples:
        print(f"[M2] 데이터 부족 (최소 {args.min_samples}개 필요) — 피드백을 더 수집하세요")
        sys.exit(0)

    # ── 2. 모델 로드 (Qwen frozen) ──────────────────────────────────────────
    print(f"[M2] Qwen 로딩: {MODEL_ID}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto",
    )
    model.eval()
    for param in model.parameters():
        param.requires_grad = False
    print("[M2] Qwen frozen 완료")

    # ── 3. Projection layer 초기화 ──────────────────────────────────────────
    projection = LatentKVProjection(args.latent_dim).to(device)
    optimizer  = torch.optim.Adam(projection.parameters(), lr=args.lr)

    # ── 4. 학습 루프 ────────────────────────────────────────────────────────
    print(f"[M2] 학습 시작 (epochs={args.epochs})")
    loss_history = []

    for epoch in range(args.epochs):
        optimizer.zero_grad()
        loss = compute_loss(model, tokenizer, projection, examples, device)
        loss.backward()
        nn.utils.clip_grad_norm_(projection.parameters(), max_norm=1.0)
        optimizer.step()

        loss_val = loss.item()
        loss_history.append(round(loss_val, 5))
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  epoch {epoch+1:3d}/{args.epochs}  loss={loss_val:.5f}")

    # ── 5. 저장 ─────────────────────────────────────────────────────────────
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "latent_dim":    args.latent_dim,
        "state_dict":    projection.state_dict(),
        "loss_history":  loss_history,
        "final_loss":    loss_history[-1],
        "model_id":      MODEL_ID,
        "architecture": {
            "adapter_dim":  ADAPTER_DIM,
            "n_layers":     N_LAYERS,
            "n_kv_heads":   N_KV_HEADS,
            "head_dim":     HEAD_DIM,
        },
    }, out_path)

    print(f"\n[M2] 완료")
    print(f"  가중치 → {out_path}")
    print(f"  최종 손실: {loss_history[-1]:.5f}")


if __name__ == "__main__":
    main()
