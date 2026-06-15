"""
도메인 기반 Stratified Sampling 스크립트

전체 train JSONL에서 균등하게 샘플링해
play_model_train_sampled_{size}.jsonl 생성

샘플링 전략:
  skills_list 키워드로 도메인 분류 (10개 도메인)
  각 도메인에서 균등하게 샘플링 → 다양한 skills 공간 커버
  full / sparse 비율 50:50 유지

도메인:
  IT/기술, 의료/보건, 교육/연구, 경영/사무, 예술/창작
  법률/행정, 서비스/요식, 건설/제조, 농업/환경, 기타

실행:
  python ml/sample_dataset.py --size 100000
  python ml/sample_dataset.py --size 500000
"""

import json
import sys
import random
import argparse
from pathlib import Path
from collections import defaultdict

from tqdm import tqdm

sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = Path("ml/data")
SEED     = 42

# ── 도메인 키워드 ──────────────────────────────────────────────────────
DOMAIN_KEYWORDS = {
    "IT/기술":   ["프로그래밍", "개발", "소프트웨어", "데이터", "네트워크", "보안",
                  "AI", "머신러닝", "클라우드", "시스템", "코딩", "알고리즘",
                  "Python", "Java", "IT", "컴퓨터", "디지털"],
    "의료/보건": ["의료", "간호", "약학", "보건", "환자", "진료", "치료",
                  "수술", "건강", "재활", "의약", "임상", "병원", "의사", "간호사"],
    "교육/연구": ["교육", "교사", "강의", "연구", "학습", "훈련", "지도",
                  "분석", "논문", "학문", "교수", "강사", "멘토링", "커리큘럼"],
    "경영/사무": ["경영", "관리", "기획", "마케팅", "영업", "회계", "재무",
                  "인사", "전략", "비즈니스", "프로젝트", "협상", "리더십", "조직"],
    "예술/창작": ["디자인", "그래픽", "영상", "음악", "글쓰기", "사진",
                  "미술", "창작", "콘텐츠", "편집", "UX", "UI", "브랜딩"],
    "법률/행정": ["법률", "법무", "행정", "규정", "계약", "컴플라이언스",
                  "정책", "규제", "감사", "법원", "변호사", "공무원"],
    "서비스/요식": ["고객", "서비스", "요리", "식품", "운영", "유통",
                    "물류", "커뮤니케이션", "상담", "판매", "소매", "음식"],
    "건설/제조": ["건축", "설계", "제조", "생산", "품질", "설비", "기계",
                  "전기", "토목", "시공", "엔지니어링", "안전관리"],
    "농업/환경": ["농업", "환경", "생태", "자연", "식물", "동물", "수산",
                  "임업", "지속가능", "탄소", "기후", "에너지"],
}

def classify_domain(skills_list: list) -> str:
    """skills_list 키워드로 도메인 분류"""
    skills_text = " ".join(skills_list)
    scores = defaultdict(int)
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in skills_text:
                scores[domain] += 1
    if scores:
        return max(scores, key=scores.get)
    return "기타"

# ── 로드 및 도메인 분류 ───────────────────────────────────────────────
def sample_records(records: list, sample_size: int, seed: int = SEED) -> list:
    """full/sparse 비율과 full 도메인 균형을 유지해 레코드를 샘플링한다."""
    if sample_size <= 0:
        raise ValueError("sample_size는 1 이상이어야 합니다")
    if sample_size > len(records):
        raise ValueError(
            f"요청한 샘플 {sample_size:,}개가 전체 레코드 {len(records):,}개보다 많습니다"
        )

    rng = random.Random(seed)
    full_records   = [r for r in records if r["input_type"] == "full"]
    sparse_records = [r for r in records if r["input_type"] == "sparse"]

    target_full = min(sample_size // 2, len(full_records))
    target_sparse = min(sample_size - target_full, len(sparse_records))

    # 한쪽 유형이 부족하면 다른 유형으로 목표 수를 채운다.
    remaining_slots = sample_size - target_full - target_sparse
    if remaining_slots:
        extra_full = min(remaining_slots, len(full_records) - target_full)
        target_full += extra_full
        remaining_slots -= extra_full
    if remaining_slots:
        target_sparse += min(remaining_slots, len(sparse_records) - target_sparse)

    domain_buckets = defaultdict(list)
    for rec in full_records:
        domain = classify_domain(rec.get("skills_list", []))
        domain_buckets[domain].append(rec)

    sampled_full = []
    if target_full and domain_buckets:
        per_domain = target_full // len(domain_buckets)
        for bucket in domain_buckets.values():
            sampled_full.extend(rng.sample(bucket, min(per_domain, len(bucket))))

        if len(sampled_full) < target_full:
            selected_ids = {id(record) for record in sampled_full}
            remaining = [record for record in full_records if id(record) not in selected_ids]
            sampled_full.extend(
                rng.sample(remaining, target_full - len(sampled_full))
            )

    sampled_sparse = rng.sample(sparse_records, target_sparse)
    sampled = sampled_full + sampled_sparse
    rng.shuffle(sampled)

    if len(sampled) != sample_size:
        raise RuntimeError(
            f"샘플 수 불일치: 요청 {sample_size:,}개, 생성 {len(sampled):,}개"
        )
    return sampled


def main(sample_size: int, seed: int = SEED):
    train_path  = DATA_DIR / "play_model_train.jsonl"
    output_path = DATA_DIR / f"play_model_train_sampled_{sample_size}.jsonl"

    if not train_path.exists():
        print(f"파일 없음: {train_path}")
        print("먼저 build_play_model_dataset.py를 실행하세요.")
        return

    print(f"전체 데이터 로드 중: {train_path}")
    records = []
    with open(train_path, "r", encoding="utf-8") as f:
        for line in tqdm(f, desc="로드", unit="줄"):
            records.append(json.loads(line))

    print(f"총 {len(records):,}개 로드 완료")

    full_records = [r for r in records if r["input_type"] == "full"]
    sparse_records = [r for r in records if r["input_type"] == "sparse"]

    print(f"  full: {len(full_records):,} / sparse: {len(sparse_records):,}")

    # full 레코드를 도메인별로 분류
    print("\n도메인 분류 중...")
    domain_buckets = defaultdict(list)
    for rec in tqdm(full_records, desc="분류", unit="레코드"):
        domain = classify_domain(rec.get("skills_list", []))
        domain_buckets[domain].append(rec)

    print("\n도메인 분포:")
    for domain, bucket in sorted(domain_buckets.items(), key=lambda x: -len(x[1])):
        print(f"  {domain:12s}: {len(bucket):,}")

    sampled = sample_records(records, sample_size, seed)
    sampled_full = [r for r in sampled if r["input_type"] == "full"]
    sampled_sparse = [r for r in sampled if r["input_type"] == "sparse"]

    print(f"\n샘플링 결과: {len(sampled):,}개 "
          f"(full {len(sampled_full):,} / sparse {len(sampled_sparse):,})")

    # 저장
    with open(output_path, "w", encoding="utf-8") as f:
        for rec in tqdm(sampled, desc="저장", unit="줄"):
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"\n저장 완료: {output_path}  ({size_mb:.1f} MB)")
    print(f"이제 train_play_model.py 실행 (SAMPLE_SIZE={sample_size})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", type=int, default=100_000,
                        help="샘플 크기 (기본: 100000)")
    parser.add_argument("--seed", type=int, default=SEED,
                        help="랜덤 시드 (기본: 42)")
    args = parser.parse_args()
    main(args.size, args.seed)
