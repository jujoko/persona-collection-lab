"""
Nemotron-Personas-Korea 기반 합성 학습 데이터 생성
====================================================
1. Nemotron-Personas-Korea에서 페르소나 샘플링
2. 각 페르소나 + 현대 사건 조합으로 judge 모델에 행동 레이블 요청
3. (persona_text, event_id, action_id) 합성 데이터 저장

이 데이터가 train_m2.py의 순환 학습 문제를 해결한다:
- 기존: M2가 만든 행동을 M2 학습에 사용 (순환)
- 신규: 외부 judge 모델이 풍부한 페르소나 텍스트를 해석 → 독립적 레이블

실행:
    python ml/build_training_data.py --n-personas 500
    python ml/build_training_data.py --n-personas 1000 --judge claude
    python ml/build_training_data.py --resume  # 이어서 생성

출력:
    ml/synthetic_training_data.jsonl  — 학습 데이터 (JSONL)
    ml/build_report.json              — 생성 통계
"""

import argparse
import json
import os
import random
import re
import sys
import time
import urllib.request
from pathlib import Path

# ─── 현대 사건 정의 ───────────────────────────────────────────────────────────
# docs/claude/design-modern-setting.md와 동기화

MODERN_EVENTS = [
    {
        "id": "ME001",
        "title": "내부 고발",
        "summary": (
            "팀장이 회계 자료를 조작해 부당이득을 취하고 있다는 증거를 우연히 발견했다. "
            "신고하면 회사가 살지만 팀장과 동료들이 위험해진다. "
            "침묵하면 부정이 계속된다."
        ),
        "actions": [
            {"id": "reports_to_authorities", "label": "감사 부서 혹은 외부 기관에 신고한다"},
            {"id": "stays_silent",           "label": "모른 척하고 넘어간다"},
            {"id": "confronts_directly",     "label": "팀장에게 직접 따진다"},
        ],
    },
    {
        "id": "ME002",
        "title": "가족의 빚",
        "summary": (
            "부모님이 사기를 당해 집을 잃을 위기다. "
            "지인이 불법 대출 브로커를 소개해준다. "
            "합법 경로로는 시간이 없고, 불법 경로는 빠르지만 전과 위험이 있다."
        ),
        "actions": [
            {"id": "refuses_illegal",   "label": "불법 경로를 거절하고 합법 방법을 찾는다"},
            {"id": "uses_illegal_loan", "label": "가족을 위해 불법 대출을 선택한다"},
            {"id": "seeks_third_way",   "label": "사회단체·법률구조 등 대안을 찾는다"},
        ],
    },
    {
        "id": "ME003",
        "title": "자원 배분",
        "summary": (
            "소규모 의료 봉사팀으로 재난 현장에 도착했다. 의약품이 부족하다. "
            "중증 노인 환자에게 쓰면 한 명을 살릴 수 있고, "
            "경증 어린이 10명에게 나누면 모두를 안정시킬 수 있다."
        ),
        "actions": [
            {"id": "saves_one_critical",        "label": "중증 환자 한 명을 우선 치료한다"},
            {"id": "distributes_to_many",       "label": "다수의 경증 환자에게 나눈다"},
            {"id": "calls_for_more_resources",  "label": "추가 지원을 요청하며 버틴다"},
        ],
    },
    {
        "id": "ME004",
        "title": "금지된 방법",
        "summary": (
            "억울하게 구속된 지인의 무죄를 증명할 증거가 회사 서버 안에 있다. "
            "해킹하면 증거를 꺼낼 수 있지만 불법이다. "
            "합법적 절차는 너무 느려 재판에 늦는다."
        ),
        "actions": [
            {"id": "hacks_the_server",       "label": "불법임을 알면서 서버에 접근한다"},
            {"id": "trusts_legal_process",   "label": "느리더라도 합법 절차를 따른다"},
            {"id": "finds_a_whistleblower",  "label": "내부 제보자를 찾아 합법적으로 꺼낸다"},
        ],
    },
    {
        "id": "ME005",
        "title": "조직의 압력",
        "summary": (
            "팀장이 허위 데이터로 보고서를 꾸미라고 지시한다. "
            "거절하면 불이익이 예상되고, 따르면 회사 전체가 잘못된 의사결정을 한다."
        ),
        "actions": [
            {"id": "obeys_order",    "label": "지시를 따르고 넘어간다"},
            {"id": "refuses_order",  "label": "거절하고 불이익을 감수한다"},
            {"id": "reports_upward", "label": "더 윗선에 문제를 알린다"},
        ],
    },
]


# ─── 페르소나 로드 ────────────────────────────────────────────────────────────

def load_nemotron_personas(n: int, seed: int = 42) -> list[dict]:
    """
    HuggingFace datasets로 Nemotron-Personas-Korea 로드.
    datasets 라이브러리 없으면 안내 출력 후 종료.
    """
    try:
        from datasets import load_dataset
    except ImportError:
        print("[오류] datasets 라이브러리가 없습니다.")
        print("  pip install datasets")
        sys.exit(1)

    print(f"[DATA] Nemotron-Personas-Korea 로딩 중... ({n}개 샘플)")
    ds = load_dataset("nvidia/Nemotron-Personas-Korea", split="train", streaming=True)

    rng = random.Random(seed)
    personas = []
    buffer = []

    for row in ds:
        buffer.append(row)
        if len(buffer) >= n * 5:
            break

    sample = rng.sample(buffer, min(n, len(buffer)))
    for row in sample:
        # persona 필드 우선, 없으면 여러 필드 합성
        text = row.get("persona") or " ".join(filter(None, [
            row.get("professional_persona", ""),
            row.get("family_persona", ""),
            row.get("hobbies_and_interests", ""),
        ]))
        if text.strip():
            personas.append({
                "id":   row.get("id", str(len(personas))),
                "text": text.strip(),
                "age":  row.get("age"),
                "sex":  row.get("sex"),
                "occupation": row.get("occupation"),
            })

    print(f"[DATA] {len(personas)}개 페르소나 로드 완료")
    return personas


# ─── Judge 모델 ───────────────────────────────────────────────────────────────

JUDGE_SYSTEM = """당신은 사람의 성격과 가치관을 분석하는 심리 전문가입니다.
주어진 인물 정보를 읽고, 이 사람이 아래 상황에서 어떤 선택을 할지 판단하세요.
반드시 아래 JSON 형식만 출력하세요. 다른 말은 하지 마세요.
{"action_id":"...","confidence":"high|medium|low","reason":"..."}
action_id는 반드시 주어진 선택지 ID 중 하나여야 합니다."""


def make_judge_prompt(persona_text: str, event: dict) -> str:
    action_list = "\n".join(
        f"- {a['id']}: {a['label']}" for a in event["actions"]
    )
    return (
        f"인물 정보:\n{persona_text}\n\n"
        f"상황: {event['title']}\n{event['summary']}\n\n"
        f"선택지:\n{action_list}\n\n"
        f"이 인물이 어떤 선택을 할지 JSON으로 응답하세요."
    )


def extract_json(text: str) -> dict | None:
    block = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if block:
        try:
            return json.loads(block.group(1))
        except json.JSONDecodeError:
            pass
    start, end = text.find("{"), text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


def judge_with_qwen(persona_text: str, event: dict, endpoint: str) -> dict | None:
    """로컬 Qwen inference 서버 (ml/inference.py) 사용."""
    valid_ids = [a["id"] for a in event["actions"]]
    payload = json.dumps({
        "system":    JUDGE_SYSTEM,
        "user":      make_judge_prompt(persona_text, event),
        "valid_ids": valid_ids,
        "id_field":  "action_id",
        "max_new_tokens": 200,
        "temperature":    0.4,
    }).encode()
    req = urllib.request.Request(
        f"{endpoint}/decide",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
            return data.get("result")
    except Exception as e:
        print(f"  [Qwen 오류] {e}")
        return None


def judge_with_claude(persona_text: str, event: dict, api_key: str) -> dict | None:
    """Anthropic Claude API 사용 (claude-haiku-3)."""
    valid_ids = [a["id"] for a in event["actions"]]
    payload = json.dumps({
        "model": "claude-haiku-4-5",
        "max_tokens": 200,
        "system": JUDGE_SYSTEM,
        "messages": [{"role": "user", "content": make_judge_prompt(persona_text, event)}],
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type":      "application/json",
            "x-api-key":         api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data   = json.loads(resp.read().decode())
            text   = data["content"][0]["text"]
            result = extract_json(text)
            if result and result.get("action_id") in valid_ids:
                return result
            return None
    except Exception as e:
        print(f"  [Claude 오류] {e}")
        return None


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="합성 학습 데이터 생성")
    parser.add_argument("--n-personas",  type=int, default=200,
                        help="사용할 페르소나 수 (기본: 200)")
    parser.add_argument("--judge",       choices=["qwen", "claude"], default="qwen",
                        help="judge 모델 선택 (기본: qwen)")
    parser.add_argument("--qwen-url",    default="http://localhost:8000",
                        help="Qwen inference 서버 URL")
    parser.add_argument("--anthropic-key", default=os.getenv("ANTHROPIC_API_KEY", ""),
                        help="Anthropic API 키")
    parser.add_argument("--events",      nargs="+",
                        default=[e["id"] for e in MODERN_EVENTS],
                        help="사용할 사건 ID (기본: 전체)")
    parser.add_argument("--resume",      action="store_true",
                        help="기존 파일 이어서 생성")
    parser.add_argument("--out",         default="ml/synthetic_training_data.jsonl")
    parser.add_argument("--seed",        type=int, default=42)
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # judge 선택
    if args.judge == "claude" and not args.anthropic_key:
        print("[오류] claude 사용 시 --anthropic-key 또는 ANTHROPIC_API_KEY 환경변수 필요")
        sys.exit(1)

    def call_judge(persona_text, event):
        if args.judge == "claude":
            return judge_with_claude(persona_text, event, args.anthropic_key)
        return judge_with_qwen(persona_text, event, args.qwen_url)

    # 이어쓰기 처리
    done_keys = set()
    if args.resume and out_path.exists():
        with out_path.open(encoding="utf-8") as f:
            for line in f:
                row = json.loads(line)
                done_keys.add((row["persona_id"], row["event_id"]))
        print(f"[RESUME] 기존 {len(done_keys)}개 건너뜀")

    # 사건 필터
    events = [e for e in MODERN_EVENTS if e["id"] in args.events]

    # 페르소나 로드
    personas = load_nemotron_personas(args.n_personas, seed=args.seed)

    # 생성
    total   = len(personas) * len(events)
    success = 0
    fail    = 0

    with out_path.open("a" if args.resume else "w", encoding="utf-8") as f:
        for i, persona in enumerate(personas):
            for event in events:
                key = (persona["id"], event["id"])
                if key in done_keys:
                    continue

                result = call_judge(persona["text"], event)
                if result and result.get("action_id") in {a["id"] for a in event["actions"]}:
                    row = {
                        "persona_id":   persona["id"],
                        "persona_text": persona["text"],
                        "persona_meta": {
                            "age": persona.get("age"),
                            "sex": persona.get("sex"),
                            "occupation": persona.get("occupation"),
                        },
                        "event_id":   event["id"],
                        "event_title": event["title"],
                        "action_id":  result["action_id"],
                        "confidence": result.get("confidence", "unknown"),
                        "reason":     result.get("reason", ""),
                        "source":     f"nemotron_judge_{args.judge}",
                    }
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    f.flush()
                    success += 1
                else:
                    fail += 1

                done = success + fail
                if done % 20 == 0:
                    print(f"  [{done}/{total}] 성공 {success} / 실패 {fail}")

                time.sleep(0.1)  # API rate limit 방지

    print(f"\n[완료] 총 {success}개 생성 / {fail}개 실패")
    print(f"  → {out_path}")

    report = {
        "n_personas": len(personas),
        "n_events":   len(events),
        "total":      total,
        "success":    success,
        "fail":       fail,
        "judge":      args.judge,
        "out":        str(out_path),
    }
    Path("ml/build_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
