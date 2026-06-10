import sys
sys.stdout.reconfigure(encoding='utf-8')
from datasets import load_dataset

ds = load_dataset("nvidia/Nemotron-Personas-Korea", split="train", streaming=True)

samples = []
for row in ds:
    samples.append(row)
    if len(samples) >= 3:
        break

# 필드 목록
print("=== 필드 목록 ===")
for key in samples[0].keys():
    print(f"  {key}")

print("\n=== 샘플 3개 ===")
for i, s in enumerate(samples):
    print(f"\n--- 페르소나 {i+1} ---")
    for key, val in s.items():
        if val:
            print(f"  {key}: {val}")
