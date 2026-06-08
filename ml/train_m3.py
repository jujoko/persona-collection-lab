"""
M3 학습 스크립트
================
수집된 시뮬레이션·피드백 데이터를 분석해 잠재 공간의 구조(schema)를 발견한다.

M3의 출력 = schema (좌표계 설계)
  - 최적 차원 수 D
  - 차원 간 연결 구조 (adjacency)
  - 각 차원의 설명력 (variance)
  - 사건-차원 민감도 (event sensitivity)

M1·M2 가중치 학습은 이 스크립트의 범위가 아니다.
M1은 M3가 만든 schema 위에서 자신의 prompt_encoder를 따로 학습한다.
M2는 피드백 신호로 자신의 action_encoder를 따로 학습한다.

실행:
    python train_m3.py
    python train_m3.py --url http://my.app
    python train_m3.py --dims 4 8 16 32

출력:
    learned_schema.json  — M1·M2가 공유할 잠재 공간 구조
    m3_report.json       — 분석 상세 결과
"""

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np


# ─── 유틸 ─────────────────────────────────────────────────────────────────────

def normalize(v: np.ndarray) -> np.ndarray:
    mag = np.sqrt((v * v).sum()) or 1.0
    return np.clip(v / mag, -1, 1)


def feedback_target(signal: str) -> float:
    return {"consistent": 1.0, "ambiguous": 0.25, "wrong": -1.0}.get(signal, 0.0)


def load_data(server_url: str) -> dict:
    url = server_url.rstrip("/") + "/api/export"
    print(f"[M3] 데이터 로드: {url}")
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode())


# ─── 1단계: 최적 차원 수 탐색 ─────────────────────────────────────────────────

def behavioral_prediction_loss(feedback_rows: list[dict], dims: int) -> float | None:
    """
    dims 차원에서 행동 예측 손실을 계산한다.
    latent_before와 action_embedding을 dims 차원으로 잘라 내적 → feedback_target과 비교.
    dims가 실제 데이터 차원보다 크면 None 반환.
    """
    errors = []
    for row in feedback_rows:
        lb = row.get("latent_before") or row.get("raw", {}).get("latent_before")
        ae = row.get("action_embedding") or row.get("raw", {}).get("action_embedding")
        sig = row.get("feedback_signal")
        if not (lb and ae and sig):
            continue
        if len(lb) < dims or len(ae) < dims:
            return None
        latent = normalize(np.array(lb[:dims], dtype=float))
        action = normalize(np.array(ae[:dims], dtype=float))
        score = float(np.tanh(latent @ action))
        target = feedback_target(sig)
        errors.append((target - score) ** 2)
    return float(np.mean(errors)) if errors else None


def search_optimal_dims(feedback_rows: list[dict], candidates: list[int]) -> dict:
    print("\n[M3] 1단계: 차원 수 탐색")
    results = {}
    for dims in candidates:
        loss = behavioral_prediction_loss(feedback_rows, dims)
        if loss is None:
            results[dims] = {"skipped": True, "reason": "데이터 차원 부족"}
            print(f"  dims={dims:2d} → 건너뜀 (데이터 차원 부족)")
        else:
            results[dims] = {"loss": round(loss, 6)}
            print(f"  dims={dims:2d} → 예측 손실={loss:.5f}")
    return results


def pick_optimal_dims(search: dict, fallback: int = 8) -> int:
    valid = {d: r["loss"] for d, r in search.items() if not r.get("skipped")}
    return min(valid, key=valid.get) if valid else fallback


# ─── 2단계: 차원 간 adjacency 계산 ────────────────────────────────────────────

def compute_adjacency(latent_vectors: list[np.ndarray], dims: int) -> list[dict]:
    """
    수집된 latent 벡터들에서 차원 간 피어슨 상관계수를 계산한다.
    |상관계수| > 0.3인 쌍만 edge로 포함.
    """
    if len(latent_vectors) < 2:
        return []
    mat = np.stack(latent_vectors)[:, :dims]   # (N, dims)
    # 각 열의 분산이 0이면 NaN 방지
    std = mat.std(axis=0)
    std[std == 0] = 1.0
    normed = (mat - mat.mean(axis=0)) / std
    corr = (normed.T @ normed) / len(latent_vectors)  # (dims, dims)

    edges = []
    for i in range(dims):
        for j in range(i + 1, dims):
            c = float(corr[i, j])
            if abs(c) > 0.3:
                edges.append({
                    "source": f"z{i}",
                    "target": f"z{j}",
                    "weight": round(abs(c), 4),
                    "relation": "co-activation" if c > 0 else "opposition"
                })
    return sorted(edges, key=lambda e: -e["weight"])


# ─── 3단계: 차원별 분산 (설명력) ─────────────────────────────────────────────

def compute_dimension_variance(latent_vectors: list[np.ndarray], dims: int) -> list[dict]:
    """
    각 차원이 캐릭터마다 얼마나 다른 값을 가지는지 측정.
    분산이 낮은 차원 = 모든 캐릭터가 비슷한 값 = 설명력 없음.
    """
    if not latent_vectors:
        return []
    mat = np.stack(latent_vectors)[:, :dims]
    variances = mat.var(axis=0)
    total = variances.sum() or 1.0
    result = []
    for i, var in enumerate(variances):
        result.append({
            "dim": f"z{i}",
            "variance": round(float(var), 5),
            "explained_ratio": round(float(var / total), 4),
            "low_signal": bool(var < 0.05)  # 분산이 너무 낮으면 제거 후보
        })
    return sorted(result, key=lambda x: -x["variance"])


# ─── 4단계: 사건-차원 민감도 ─────────────────────────────────────────────────

def compute_event_sensitivity(simulations: list[dict], dims: int) -> dict:
    """
    각 사건(E001~E005)이 어떤 차원을 얼마나 변화시키는지 측정.
    latent_before → latent_after 변화량을 사건별로 집계.
    """
    sensitivity: dict[str, list[np.ndarray]] = {}

    for sim in simulations:
        raw = sim.get("raw", {})
        events = raw.get("events") or []
        for event in events:
            eid = event.get("event_id")
            lb = event.get("latent_before")
            la = event.get("latent_after")
            if not (eid and lb and la):
                continue
            if len(lb) < dims or len(la) < dims:
                continue
            delta = np.abs(np.array(la[:dims]) - np.array(lb[:dims]))
            sensitivity.setdefault(eid, []).append(delta)

    result = {}
    for eid, deltas in sensitivity.items():
        mean_delta = np.stack(deltas).mean(axis=0)
        result[eid] = {
            f"z{i}": round(float(v), 5)
            for i, v in enumerate(mean_delta)
        }
    return result


# ─── 스키마 조립 ──────────────────────────────────────────────────────────────

def build_schema(dims: int, adjacency: list[dict],
                 dim_variance: list[dict], event_sensitivity: dict) -> dict:
    low_signal_dims = [d["dim"] for d in dim_variance if d["low_signal"]]
    latent_dimensions = [
        {
            "key": f"z{i}",
            "label": f"z{i}",
            "variance": next((d["variance"] for d in dim_variance if d["dim"] == f"z{i}"), None),
            "explained_ratio": next((d["explained_ratio"] for d in dim_variance if d["dim"] == f"z{i}"), None),
            "low_signal": f"z{i}" in low_signal_dims,
            "init_rule": "prompt-conditioned",
            "update_rule": "event-feedback-sensitive"
        }
        for i in range(dims)
    ]
    return {
        "model_id": "M3_latent_persona_schema_designer",
        "schema_id": f"M3_learned_{int(time.time())}",
        "status": "learned",
        "latent_dimension": dims,
        "latent_dimensions": latent_dimensions,
        "adjacency": adjacency,
        "event_sensitivity": event_sensitivity,
        "low_signal_dims": low_signal_dims,
        "learned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": (
            f"분산이 낮아 설명력이 약한 차원: {low_signal_dims}"
            if low_signal_dims else
            "모든 차원이 유효한 분산을 가짐"
        )
    }


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="M3 학습 스크립트 — 잠재 공간 구조 발견")
    parser.add_argument("--url", default="http://localhost:8787")
    parser.add_argument("--dims", nargs="+", type=int, default=[4, 8, 16, 32])
    parser.add_argument("--out", default="learned_schema.json")
    args = parser.parse_args()

    # ── 데이터 로드 ──────────────────────────────────────────────────────────
    try:
        data = load_data(args.url)
    except Exception as e:
        print(f"[오류] 데이터 로드 실패: {e}\n  서버 실행 확인: npm start")
        sys.exit(1)

    characters = data.get("characters", [])
    simulations = data.get("simulations", [])
    feedback_rows = data.get("feedback", [])
    print(f"[M3] 캐릭터 {len(characters)}개 / 시뮬레이션 {len(simulations)}개 / 피드백 {len(feedback_rows)}개")

    if len(feedback_rows) < 2:
        print("[경고] 피드백이 너무 적습니다. 데이터를 더 수집한 후 실행하세요.")

    # ── 1. 최적 차원 탐색 ────────────────────────────────────────────────────
    dim_search = search_optimal_dims(feedback_rows, args.dims)
    optimal_dims = pick_optimal_dims(dim_search, fallback=8)
    print(f"[M3] 선택 차원: {optimal_dims}")

    # ── 2. latent 벡터 수집 ──────────────────────────────────────────────────
    latent_vectors = []
    for sim in simulations:
        v = sim.get("final_latent") or sim.get("raw", {}).get("latent_persona")
        if v and len(v) >= optimal_dims:
            latent_vectors.append(np.array(v[:optimal_dims], dtype=float))
    for c in characters:
        v = c.get("latent_seed") or c.get("raw", {}).get("infant_latent_persona")
        if v and len(v) >= optimal_dims:
            latent_vectors.append(np.array(v[:optimal_dims], dtype=float))
    print(f"\n[M3] 2단계: 차원 상관관계 분석 ({len(latent_vectors)}개 벡터)")

    # ── 3. 각 분석 실행 ──────────────────────────────────────────────────────
    adjacency = compute_adjacency(latent_vectors, optimal_dims)
    print(f"  adjacency edge {len(adjacency)}개 발견")

    dim_variance = compute_dimension_variance(latent_vectors, optimal_dims)
    low_signal = [d["dim"] for d in dim_variance if d["low_signal"]]
    print(f"\n[M3] 3단계: 차원 분산 분석")
    for d in dim_variance:
        flag = " ← 설명력 낮음" if d["low_signal"] else ""
        print(f"  {d['dim']}: variance={d['variance']:.5f}  ({d['explained_ratio']*100:.1f}%){flag}")

    print(f"\n[M3] 4단계: 사건-차원 민감도 분석")
    event_sensitivity = compute_event_sensitivity(simulations, optimal_dims)
    for eid, sens in event_sensitivity.items():
        top_dim = max(sens, key=sens.get)
        print(f"  {eid}: 가장 민감한 차원 = {top_dim} ({sens[top_dim]:.5f})")

    # ── 4. 스키마 출력 ───────────────────────────────────────────────────────
    schema = build_schema(optimal_dims, adjacency, dim_variance, event_sensitivity)

    report = {
        "learned_at": schema["learned_at"],
        "n_characters": len(characters),
        "n_simulations": len(simulations),
        "n_feedback": len(feedback_rows),
        "n_latent_vectors": len(latent_vectors),
        "optimal_dims": optimal_dims,
        "dimension_search": dim_search,
        "dimension_variance": dim_variance,
    }

    Path(args.out).write_text(
        json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    Path("m3_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n[M3] 완료")
    print(f"  스키마  → {args.out}")
    print(f"  리포트  → m3_report.json")
    if low_signal:
        print(f"  [권고] 설명력 낮은 차원 {low_signal} — 데이터 증가 후 차원 축소 고려")


if __name__ == "__main__":
    main()
