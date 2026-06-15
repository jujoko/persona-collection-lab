"""Play Model의 행동 선택 방향성과 편향을 점검하는 고정 벤치마크."""

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

from play_model_inference import PlayModelInference


CASES = [
    ("ME001", "원칙과 공익을 중시하는 감사 담당자. 부정을 보면 공식 절차로 신고한다.",
     ["reports_to_authorities", "stays_silent", "confronts_directly"], "reports_to_authorities"),
    ("ME001", "갈등과 위험을 극도로 피하고 직장을 잃지 않는 것이 가장 중요하다.",
     ["reports_to_authorities", "stays_silent", "confronts_directly"], "stays_silent"),
    ("ME001", "불의를 보면 당사자에게 즉시 따지는 직설적이고 충동적인 팀원이다.",
     ["reports_to_authorities", "stays_silent", "confronts_directly"], "confronts_directly"),
    ("ME002", "법과 원칙을 지키며 시간이 걸려도 불법에는 손대지 않는다.",
     ["refuses_illegal", "uses_illegal_loan", "seeks_third_way"], "refuses_illegal"),
    ("ME002", "가족을 위해서라면 법적 위험도 감수하는 헌신적인 사람이다.",
     ["refuses_illegal", "uses_illegal_loan", "seeks_third_way"], "uses_illegal_loan"),
    ("ME002", "사회복지와 법률 구조 제도를 잘 알고 합법적인 대안을 끝까지 찾는다.",
     ["refuses_illegal", "uses_illegal_loan", "seeks_third_way"], "seeks_third_way"),
    ("ME003", "응급의학 경험이 많고 가장 위중한 환자를 우선하는 의료인이다.",
     ["saves_one_critical", "distributes_to_many", "calls_for_more_resources"], "saves_one_critical"),
    ("ME003", "한 사람보다 더 많은 사람에게 혜택이 돌아가는 결정을 선호한다.",
     ["saves_one_critical", "distributes_to_many", "calls_for_more_resources"], "distributes_to_many"),
    ("ME003", "자원이 부족하면 포기하지 않고 기관과 주변에 추가 지원을 요청한다.",
     ["saves_one_critical", "distributes_to_many", "calls_for_more_resources"], "calls_for_more_resources"),
    ("ME004", "목적을 위해 규칙을 깨는 해킹 실력자이며 위험을 즐긴다.",
     ["hacks_the_server", "trusts_legal_process", "finds_a_whistleblower"], "hacks_the_server"),
    ("ME004", "느리더라도 법원과 공식 수사 절차를 신뢰하는 법률가다.",
     ["hacks_the_server", "trusts_legal_process", "finds_a_whistleblower"], "trusts_legal_process"),
    ("ME004", "내부 관계를 활용해 제보자를 보호하고 합법적으로 증거를 확보한다.",
     ["hacks_the_server", "trusts_legal_process", "finds_a_whistleblower"], "finds_a_whistleblower"),
    ("ME005", "조직의 지시를 따르고 안정적인 평가와 승진을 우선한다.",
     ["obeys_order", "refuses_order", "reports_upward"], "obeys_order"),
    ("ME005", "부당한 명령은 불이익을 받아도 단호히 거절하는 독립적인 사람이다.",
     ["obeys_order", "refuses_order", "reports_upward"], "refuses_order"),
    ("ME005", "문제를 공식 보고 체계로 올려 조직 내부에서 바로잡으려 한다.",
     ["obeys_order", "refuses_order", "reports_upward"], "reports_upward"),
]


def run_benchmark(device=None):
    inference = PlayModelInference(device=device)
    rows = []
    selections = Counter()
    event_correct = defaultdict(int)
    event_total = Counter()

    for event_id, text, candidates, expected in CASES:
        result = inference.predict_with_scores(text, candidates)
        ranked = sorted(result["scores"].items(), key=lambda item: item[1], reverse=True)
        predicted = result["action_id"]
        margin = round(ranked[0][1] - ranked[1][1], 4)
        correct = predicted == expected
        rows.append({
            "event_id": event_id,
            "text": text,
            "expected": expected,
            "predicted": predicted,
            "correct": correct,
            "margin": margin,
            "scores": result["scores"],
        })
        selections[predicted] += 1
        event_total[event_id] += 1
        event_correct[event_id] += int(correct)

    correct_count = sum(row["correct"] for row in rows)
    return {
        "summary": {
            "cases": len(rows),
            "correct": correct_count,
            "accuracy": round(correct_count / len(rows), 4),
            "average_margin": round(sum(row["margin"] for row in rows) / len(rows), 4),
            "low_margin_cases": sum(row["margin"] < 0.05 for row in rows),
        },
        "accuracy_by_event": {
            event_id: round(event_correct[event_id] / total, 4)
            for event_id, total in sorted(event_total.items())
        },
        "selection_counts": dict(sorted(selections.items())),
        "cases": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", choices=["cpu", "cuda"], default=None)
    parser.add_argument("--output", type=Path,
                        default=Path("ml/play_model_benchmark.json"))
    args = parser.parse_args()

    report = run_benchmark(args.device)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print("accuracy_by_event:", report["accuracy_by_event"])
    print(f"saved: {args.output}")


if __name__ == "__main__":
    main()
