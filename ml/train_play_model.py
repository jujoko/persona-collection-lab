"""
Play Model Stage 1 학습 스크립트

인코더: klue/roberta-base (fine-tune, 768-dim)
헤드:   Skills Head  MLP (768→128→768)
        Hobbies Head MLP (768→128→768)

손실:
  cosine_loss = 1 - cosine_similarity(예측값, target)
  target = 해당 리스트 아이템들의 klue/roberta-base 임베딩 평균

학습률:
  인코더: 1e-5 (기존 언어 이해 유지)
  헤드:   1e-3 (빠르게 학습)

target 임베딩 캐시:
  최초 1회만 계산 → ml/data/{split}_targets.npy 저장
  이후 학습 시 인덱스로 바로 조회 (배치당 인코더 호출 1회로 감소)

체크포인트: ml/play_model_ckpt/ 에 에폭마다 저장
최종 가중치: ml/play_model.pt

주의: Stage 2 action 임베딩도 반드시 klue/roberta-base로 해야 함
     (MiniLM 기반 M1과 임베딩 공간이 다름 — design-play-model.md 참고)
"""

import json
import sys
import random
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel
from tqdm import tqdm

sys.stdout.reconfigure(encoding="utf-8")

# ── 설정 ──────────────────────────────────────────────────────────────
DATA_DIR      = Path("ml/data")
CKPT_DIR      = Path("ml/play_model_ckpt")
FINAL_MODEL   = Path("ml/play_model.pt")

ENCODER_NAME  = "klue/roberta-base"
EMBED_DIM     = 768
HIDDEN_DIM    = 128
BATCH_SIZE    = 64
LR_ENCODER    = 1e-5
LR_HEAD       = 1e-3
EPOCHS        = 20
MAX_LEN       = 256
SEED          = 42
PRECOMPUTE_BATCH = 512   # target 임베딩 사전 계산 배치 크기

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

torch.manual_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)
CKPT_DIR.mkdir(parents=True, exist_ok=True)

print(f"device: {DEVICE}")

# ── 인코더 로드 ───────────────────────────────────────────────────────
print(f"인코더 로드 중: {ENCODER_NAME}")
tokenizer = AutoTokenizer.from_pretrained(ENCODER_NAME)
encoder   = AutoModel.from_pretrained(ENCODER_NAME).to(DEVICE)

def mean_pool(model_output, attention_mask) -> torch.Tensor:
    token_emb = model_output.last_hidden_state        # (B, L, 768)
    mask      = attention_mask.unsqueeze(-1).float()  # (B, L, 1)
    summed    = (token_emb * mask).sum(dim=1)         # (B, 768)
    counts    = mask.sum(dim=1).clamp(min=1e-9)       # (B, 1)
    return summed / counts                             # (B, 768)

def encode_texts(texts: list, grad: bool = False) -> torch.Tensor:
    enc = tokenizer(texts, padding=True, truncation=True,
                    max_length=MAX_LEN, return_tensors="pt").to(DEVICE)
    with torch.set_grad_enabled(grad):
        out = encoder(**enc)
    return mean_pool(out, enc["attention_mask"])

# ── target 임베딩 사전 계산 ───────────────────────────────────────────
def precompute_targets(jsonl_path: Path, cache_path: Path):
    """
    JSONL의 모든 레코드에 대해 skills_emb, hobbies_emb를 미리 계산.
    결과를 (N, 2, 768) numpy array로 저장.
    캐시가 이미 있으면 건너뜀.
    """
    if cache_path.exists():
        print(f"  캐시 존재: {cache_path.name} — 건너뜀")
        return

    print(f"  target 임베딩 계산 중: {jsonl_path.name}")
    records = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))

    n = len(records)
    targets = np.zeros((n, 2, EMBED_DIM), dtype=np.float32)  # (N, 2, 768)

    # skills와 hobbies를 배치로 한꺼번에 처리
    for head_idx, key in enumerate(["skills_list", "hobbies_list"]):
        desc = f"    {'skills' if head_idx == 0 else 'hobbies'}"
        i = 0
        with tqdm(total=n, desc=desc, unit="샘플") as pbar:
            while i < n:
                batch_records = records[i:i + PRECOMPUTE_BATCH]

                # 배치 내 모든 리스트 아이템을 한꺼번에 인코딩
                # 각 샘플의 아이템 수가 달라서 per-sample 평균 처리
                for j, rec in enumerate(batch_records):
                    items = rec.get(key) or []
                    if not items:
                        continue
                    with torch.no_grad():
                        emb = encode_texts(items, grad=False)   # (M, 768)
                    targets[i + j, head_idx] = emb.mean(dim=0).cpu().numpy()

                i += len(batch_records)
                pbar.update(len(batch_records))

    np.save(cache_path, targets)
    print(f"  저장 완료: {cache_path.name}  shape={targets.shape}")

# ── Dataset ───────────────────────────────────────────────────────────
class PlayModelDataset(Dataset):
    def __init__(self, jsonl_path: Path, cache_path: Path):
        self.records = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                self.records.append(json.loads(line))

        # (N, 2, 768): targets[:, 0, :] = skills_emb, targets[:, 1, :] = hobbies_emb
        self.targets = np.load(cache_path, mmap_mode="r")

        print(f"  로드: {jsonl_path.name}  {len(self.records):,}개")

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        rec         = self.records[idx]
        skills_emb  = torch.tensor(self.targets[idx, 0], dtype=torch.float32)
        hobbies_emb = torch.tensor(self.targets[idx, 1], dtype=torch.float32)
        return {
            "text":        rec["text"],
            "skills_emb":  skills_emb,
            "hobbies_emb": hobbies_emb,
        }

def collate_fn(batch):
    """배치당 인코더 호출 1회 (입력 텍스트만)"""
    texts       = [b["text"]        for b in batch]
    skills_tgt  = torch.stack([b["skills_emb"]  for b in batch])
    hobbies_tgt = torch.stack([b["hobbies_emb"] for b in batch])

    input_emb = encode_texts(texts, grad=True)  # (B, 768)

    return input_emb, skills_tgt.to(DEVICE), hobbies_tgt.to(DEVICE)

# ── 모델 ──────────────────────────────────────────────────────────────
class PlayModelHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(EMBED_DIM, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, EMBED_DIM),
        )

    def forward(self, x):
        return self.net(x)

class PlayModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.skills_head  = PlayModelHead()
        self.hobbies_head = PlayModelHead()

    def forward(self, input_emb):
        return self.skills_head(input_emb), self.hobbies_head(input_emb)

def cosine_loss(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    return (1 - F.cosine_similarity(pred, target, dim=-1)).mean()

# ── 학습 루프 ─────────────────────────────────────────────────────────
def run_epoch(model, loader, optimizer, train: bool) -> float:
    model.train(train)
    encoder.train(train)
    total_loss = 0.0

    for input_emb, skills_tgt, hobbies_tgt in tqdm(
            loader, desc="train" if train else "valid", leave=False):

        skills_pred, hobbies_pred = model(input_emb)
        loss = cosine_loss(skills_pred, skills_tgt) + \
               cosine_loss(hobbies_pred, hobbies_tgt)

        if train:
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        total_loss += loss.item()

    return total_loss / len(loader)

# ── 메인 ──────────────────────────────────────────────────────────────

# 1. target 임베딩 사전 계산 (캐시 없을 때만)
print("\ntarget 임베딩 캐시 확인 중...")
precompute_targets(DATA_DIR / "play_model_train.jsonl",
                   DATA_DIR / "train_targets.npy")
precompute_targets(DATA_DIR / "play_model_valid.jsonl",
                   DATA_DIR / "valid_targets.npy")

# 2. 데이터셋 로드
print("\n데이터셋 로드 중...")
train_ds = PlayModelDataset(DATA_DIR / "play_model_train.jsonl",
                            DATA_DIR / "train_targets.npy")
valid_ds = PlayModelDataset(DATA_DIR / "play_model_valid.jsonl",
                            DATA_DIR / "valid_targets.npy")

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE,
                          shuffle=True,  collate_fn=collate_fn, num_workers=0)
valid_loader = DataLoader(valid_ds, batch_size=BATCH_SIZE,
                          shuffle=False, collate_fn=collate_fn, num_workers=0)

# 3. 모델 / 옵티마이저
model = PlayModel().to(DEVICE)

optimizer = torch.optim.Adam([
    {"params": encoder.parameters(), "lr": LR_ENCODER},
    {"params": model.parameters(),   "lr": LR_HEAD},
])
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

# 체크포인트에서 이어서 학습
start_epoch = 1
ckpt_files  = sorted(CKPT_DIR.glob("epoch_*.pt"))
if ckpt_files:
    last  = ckpt_files[-1]
    state = torch.load(last, map_location=DEVICE)
    model.load_state_dict(state["model"])
    encoder.load_state_dict(state["encoder"])
    optimizer.load_state_dict(state["optimizer"])
    scheduler.load_state_dict(state["scheduler"])
    start_epoch = state["epoch"] + 1
    print(f"체크포인트 로드: {last.name}  (epoch {state['epoch']} 완료, {start_epoch}부터 재개)")

print(f"\n학습 시작  epochs: {start_epoch}~{EPOCHS}")
print(f"batch: {BATCH_SIZE}  lr_encoder: {LR_ENCODER}  lr_head: {LR_HEAD}\n")

best_valid_loss = float("inf")

for epoch in range(start_epoch, EPOCHS + 1):
    train_loss = run_epoch(model, train_loader, optimizer, train=True)
    valid_loss = run_epoch(model, valid_loader, optimizer, train=False)
    scheduler.step()

    improved = "✅" if valid_loss < best_valid_loss else ""
    if valid_loss < best_valid_loss:
        best_valid_loss = valid_loss
        torch.save({"model": model.state_dict(),
                    "encoder": encoder.state_dict()}, FINAL_MODEL)

    print(f"epoch {epoch:02d}/{EPOCHS}  "
          f"train: {train_loss:.4f}  valid: {valid_loss:.4f}  {improved}")

    torch.save({
        "epoch":     epoch,
        "model":     model.state_dict(),
        "encoder":   encoder.state_dict(),
        "optimizer": optimizer.state_dict(),
        "scheduler": scheduler.state_dict(),
    }, CKPT_DIR / f"epoch_{epoch:02d}.pt")

print(f"\n학습 완료. 최종 모델: {FINAL_MODEL}")
print(f"best valid loss: {best_valid_loss:.4f}")
