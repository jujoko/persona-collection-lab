"""
M1 학습: 페르소나 텍스트 → latent vector
=========================================
Nemotron-Personas-Korea의 구조화된 필드로 페르소나 유사도를 정의하고
Triplet Loss로 adapter MLP를 학습한다.

가정: 인구통계/직업/가족 필드가 비슷한 사람은 행동도 비슷할 가능성이 높다.

구조:
    텍스트 → MiniLM (384-dim, frozen) → adapter MLP (384→64→8) → latent

실행:
    python ml/train_m1.py
    python ml/train_m1.py --n-personas 10000 --epochs 20
"""

import argparse
import random
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# ─── 설정 ─────────────────────────────────────────────────────────────────────

LATENT_DIM  = 8
EMBED_DIM   = 384
HIDDEN_DIM  = 64
MARGIN      = 0.5   # triplet margin
BATCH_SIZE  = 128
LR          = 1e-3
POS_THRESH  = 0.6   # 필드 유사도 >= 0.6 → positive pair
NEG_THRESH  = 0.2   # 필드 유사도 <= 0.2 → negative pair


# ─── 필드 유사도 ──────────────────────────────────────────────────────────────

def field_similarity(a: dict, b: dict) -> float:
    score, total = 0, 0

    if a.get("age") and b.get("age"):
        score += 1 if abs(a["age"] - b["age"]) < 10 else 0
        total += 1

    if a.get("sex") and b.get("sex"):
        score += 1 if a["sex"] == b["sex"] else 0
        total += 1

    if a.get("education_level") and b.get("education_level"):
        score += 1 if a["education_level"] == b["education_level"] else 0
        total += 1

    if a.get("family_type") and b.get("family_type"):
        score += 1 if a["family_type"] == b["family_type"] else 0
        total += 1

    if a.get("marital_status") and b.get("marital_status"):
        score += 1 if a["marital_status"] == b["marital_status"] else 0
        total += 1

    return score / total if total > 0 else 0.0


# ─── 데이터 로드 ──────────────────────────────────────────────────────────────

def load_personas(n: int, seed: int = 42) -> list[dict]:
    try:
        from datasets import load_dataset
    except ImportError:
        print("[오류] pip install datasets")
        raise

    print(f"[DATA] Nemotron-Personas-Korea 로딩 중... ({n}개)")
    ds = load_dataset("nvidia/Nemotron-Personas-Korea", split="train", streaming=True)

    rng = random.Random(seed)
    buffer = []
    for row in ds:
        buffer.append(row)
        if len(buffer) >= n * 3:
            break

    sample = rng.sample(buffer, min(n, len(buffer)))
    personas = []
    for row in sample:
        text = row.get("persona") or " ".join(filter(None, [
            row.get("professional_persona", ""),
            row.get("family_persona", ""),
        ]))
        if text.strip():
            personas.append({
                "text":            text.strip(),
                "age":             row.get("age"),
                "sex":             row.get("sex"),
                "education_level": row.get("education_level"),
                "family_type":     row.get("family_type"),
                "marital_status":  row.get("marital_status"),
                "occupation":      row.get("occupation"),
            })

    print(f"[DATA] {len(personas)}개 로드 완료")
    return personas


# ─── Triplet 데이터셋 ─────────────────────────────────────────────────────────

class TripletDataset(Dataset):
    def __init__(self, personas: list[dict], embeddings: torch.Tensor, n_triplets: int = 50000):
        self.embeddings = embeddings
        self.triplets   = []

        print("[TRIPLET] 유사도 계산 및 triplet 생성 중...")
        n = len(personas)
        rng = random.Random(42)
        attempts = 0

        while len(self.triplets) < n_triplets and attempts < n_triplets * 10:
            attempts += 1
            anchor_idx = rng.randint(0, n - 1)
            pos_idx    = rng.randint(0, n - 1)
            neg_idx    = rng.randint(0, n - 1)

            if pos_idx == anchor_idx or neg_idx == anchor_idx:
                continue

            sim_pos = field_similarity(personas[anchor_idx], personas[pos_idx])
            sim_neg = field_similarity(personas[anchor_idx], personas[neg_idx])

            if sim_pos >= POS_THRESH and sim_neg <= NEG_THRESH:
                self.triplets.append((anchor_idx, pos_idx, neg_idx))

        print(f"[TRIPLET] {len(self.triplets)}개 생성 완료")

    def __len__(self):
        return len(self.triplets)

    def __getitem__(self, idx):
        a, p, n = self.triplets[idx]
        return self.embeddings[a], self.embeddings[p], self.embeddings[n]


# ─── M1 모델 ─────────────────────────────────────────────────────────────────

class M1Adapter(nn.Module):
    def __init__(self, embed_dim: int = EMBED_DIM, latent_dim: int = LATENT_DIM):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(embed_dim, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, latent_dim),
            nn.Tanh(),   # latent를 [-1, 1]로 정규화
        )

    def forward(self, x):
        return self.net(x)


# ─── MiniLM 임베딩 ────────────────────────────────────────────────────────────

def compute_embeddings(texts: list[str], batch_size: int = 256) -> torch.Tensor:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("[오류] pip install sentence-transformers")
        raise

    print("[EMBED] MiniLM 임베딩 계산 중...")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        emb   = model.encode(batch, convert_to_tensor=True, show_progress_bar=False)
        all_embeddings.append(emb.cpu())
        if (i // batch_size) % 5 == 0:
            print(f"  {i + len(batch)}/{len(texts)}")

    embeddings = torch.cat(all_embeddings, dim=0)
    print(f"[EMBED] 완료: {embeddings.shape}")
    return embeddings


# ─── 학습 ─────────────────────────────────────────────────────────────────────

def train(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[TRAIN] device: {device}")

    # 1. 데이터 로드
    personas = load_personas(args.n_personas, seed=args.seed)

    # 2. 임베딩 계산 (MiniLM, frozen)
    texts      = [p["text"] for p in personas]
    embeddings = compute_embeddings(texts)

    # 3. Triplet 데이터셋
    dataset    = TripletDataset(personas, embeddings, n_triplets=args.n_triplets)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    # 4. 모델 / 옵티마이저
    model     = M1Adapter().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.TripletMarginLoss(margin=MARGIN)

    # 5. 학습 루프
    print(f"\n[TRAIN] {args.epochs}에폭 학습 시작")
    for epoch in range(1, args.epochs + 1):
        total_loss = 0.0
        for anchor, pos, neg in dataloader:
            anchor, pos, neg = anchor.to(device), pos.to(device), neg.to(device)

            la = model(anchor)
            lp = model(pos)
            ln = model(neg)

            loss = criterion(la, lp, ln)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg = total_loss / len(dataloader)
        print(f"  epoch {epoch:3d}/{args.epochs}  loss={avg:.4f}")

    # 6. 저장
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out)
    print(f"\n[DONE] 저장 완료: {out}")


# ─── 메인 ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n-personas",  type=int, default=5000)
    parser.add_argument("--n-triplets",  type=int, default=50000)
    parser.add_argument("--epochs",      type=int, default=15)
    parser.add_argument("--seed",        type=int, default=42)
    parser.add_argument("--out",         default="ml/m1_adapter.pt")
    args = parser.parse_args()
    train(args)
