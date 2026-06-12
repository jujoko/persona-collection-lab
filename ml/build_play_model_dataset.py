"""
Play Model 학습 데이터셋 빌드 스크립트

Nemotron-Personas-Korea 전체 → train / valid / test JSONL

각 원본 샘플에서 2개 생성:
  - full  : persona + skills + hobbies concat
  - sparse: persona 텍스트만

저장 필드: text, input_type, skills_list, hobbies_list (raw)
target 임베딩은 학습 시 DataLoader에서 계산

split: train 80% / valid 10% / test 10%

재시작 지원:
  - ml/data/play_model_checkpoint.json 에 진행 상태 저장
  - 이미 처리된 샘플은 건너뜀 (출력 파일에 append)
"""

import json
import sys
import random
from pathlib import Path

from datasets import load_dataset
from tqdm import tqdm

sys.stdout.reconfigure(encoding="utf-8")

# ── 설정 ─────────────────────────────────────────────────────────────
DATASET_NAME = "nvidia/Nemotron-Personas-Korea"
OUTPUT_DIR   = Path("ml/data")
SEED         = 42
CKPT_FILE    = OUTPUT_DIR / "play_model_checkpoint.json"

random.seed(SEED)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── 체크포인트 ─────────────────────────────────────────────────────────
def load_checkpoint() -> dict:
    if CKPT_FILE.exists():
        with open(CKPT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"split_indices": None, "done": {"train": 0, "valid": 0, "test": 0}}

def save_checkpoint(ckpt: dict):
    with open(CKPT_FILE, "w", encoding="utf-8") as f:
        json.dump(ckpt, f, ensure_ascii=False)

# ── 데이터셋 로드 ─────────────────────────────────────────────────────
print("Nemotron-Personas-Korea 로드 중...")
ds = load_dataset(DATASET_NAME, split="train", trust_remote_code=True)
print(f"전체 샘플 수: {len(ds):,}")

# ── 필터링: skills / hobbies / persona 중 하나라도 비면 제거 ─────────
print("\n필터링 중...")
valid_indices = []
for i, row in enumerate(tqdm(ds, desc="필터링", unit="샘플")):
    s = row.get("skills_and_expertise_list") or []
    h = row.get("hobbies_and_interests_list") or []
    p = (row.get("persona") or "").strip()
    if len(s) > 0 and len(h) > 0 and len(p) > 0:
        valid_indices.append(i)

n = len(valid_indices)
print(f"필터링 후: {n:,}개 ({n / len(ds) * 100:.1f}%)")

# ── split 결정 ────────────────────────────────────────────────────────
ckpt = load_checkpoint()

if ckpt["split_indices"] is None:
    print("\nsplit 계산 중...")
    random.shuffle(valid_indices)

    n_train = int(n * 0.8)
    n_valid = int(n * 0.1)

    idx_train = valid_indices[:n_train]
    idx_valid = valid_indices[n_train:n_train + n_valid]
    idx_test  = valid_indices[n_train + n_valid:]

    ckpt["split_indices"] = {
        "train": idx_train,
        "valid": idx_valid,
        "test":  idx_test,
    }
    save_checkpoint(ckpt)
    print("split 저장 완료")
else:
    print("\n기존 split 로드 (재시작)")
    idx_train = ckpt["split_indices"]["train"]
    idx_valid = ckpt["split_indices"]["valid"]
    idx_test  = ckpt["split_indices"]["test"]

print(f"\n원본 샘플 수  → train: {len(idx_train):,} / valid: {len(idx_valid):,} / test: {len(idx_test):,}")
print(f"레코드 수(×2) → train: {len(idx_train)*2:,} / valid: {len(idx_valid)*2:,} / test: {len(idx_test)*2:,}")

# ── 레코드 생성 ───────────────────────────────────────────────────────
def make_records(row: dict) -> list:
    """원본 샘플 1개 → full + sparse 레코드 2개"""
    persona      = (row.get("persona") or "").strip()
    skills_list  = row.get("skills_and_expertise_list") or []
    hobbies_list = row.get("hobbies_and_interests_list") or []

    skills_text  = ", ".join(skills_list)
    hobbies_text = ", ".join(hobbies_list)

    text_full   = f"{persona} 나의 능력은 {skills_text}이다. 취미는 {hobbies_text}이다."
    text_sparse = persona

    base = {"skills_list": skills_list, "hobbies_list": hobbies_list}
    return [
        {**base, "text": text_full,   "input_type": "full"},
        {**base, "text": text_sparse, "input_type": "sparse"},
    ]

# ── split별 처리 ──────────────────────────────────────────────────────
SPLITS = [
    ("train", idx_train, OUTPUT_DIR / "play_model_train.jsonl"),
    ("valid", idx_valid, OUTPUT_DIR / "play_model_valid.jsonl"),
    ("test",  idx_test,  OUTPUT_DIR / "play_model_test.jsonl"),
]

for split_name, indices, out_path in SPLITS:
    done      = ckpt["done"][split_name]
    remaining = indices[done:]

    if not remaining:
        print(f"\n{split_name}: 이미 완료 ({done:,}개 원본)")
        continue

    print(f"\n{split_name} 처리 중...  완료: {done:,} / 남음: {len(remaining):,}")

    mode = "a" if done > 0 else "w"
    with open(out_path, mode, encoding="utf-8") as f:
        for i, ds_idx in enumerate(tqdm(remaining, desc=split_name, unit="샘플")):
            row     = ds[ds_idx]
            records = make_records(row)
            for rec in records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

            # 500개마다 체크포인트 저장
            if (i + 1) % 500 == 0:
                ckpt["done"][split_name] = done + i + 1
                save_checkpoint(ckpt)

    ckpt["done"][split_name] = done + len(remaining)
    save_checkpoint(ckpt)
    print(f"  저장 완료: {out_path}")

# ── 최종 요약 ─────────────────────────────────────────────────────────
print("\n=== 완료 ===")
for _, _, path in SPLITS:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            lines = sum(1 for _ in f)
        size_mb = path.stat().st_size / 1024 / 1024
        print(f"  {path.name}: {lines:,}개 레코드  ({size_mb:.1f} MB)")
