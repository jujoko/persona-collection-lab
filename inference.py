"""
M2 Decision + Narration Inference Server
==========================================
FastAPI + Transformers로 Qwen2.5-1.5B-Instruct를 로컬 GPU에서 서빙.

엔드포인트:
  POST /decide   — 행동 결정 + 서술 (JSON 출력 강제)
  POST /generate — 자유 텍스트 생성 (기존 호환용)
  GET  /health   — 서버 상태

실행:
    pip install -r requirements-inference.txt
    python inference.py

배포 (Modal):
    modal deploy modal_inference.py
"""

import json
import os
import re
import time
import logging
from contextlib import asynccontextmanager
from typing import List

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

logging.basicConfig(level=logging.INFO, format="[INFER] %(message)s")
log = logging.getLogger(__name__)

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "250"))
PORT = int(os.getenv("INFER_PORT", "8000"))

tokenizer = None
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global tokenizer, model
    log.info(f"모델 로딩: {MODEL_ID} ({DEVICE})")
    t0 = time.time()
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto",
    )
    model.eval()
    log.info(f"로딩 완료 ({time.time() - t0:.1f}s)")
    yield
    log.info("서버 종료")


app = FastAPI(title="M2 Narration Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    system: str
    user: str
    max_new_tokens: int = MAX_NEW_TOKENS
    temperature: float = 0.7


class GenerateResponse(BaseModel):
    narration: str
    model: str
    device: str


class DecideRequest(BaseModel):
    system: str
    user: str
    valid_ids: List[str]          # 유효한 action_id / adaptation_id 목록
    id_field: str = "action_id"   # 응답 JSON에서 검증할 필드 이름
    max_new_tokens: int = 300
    temperature: float = 0.7


class DecideResponse(BaseModel):
    result: dict   # M2가 생성한 JSON (action_id/adaptation_id + 서술 필드들)
    raw: str       # 디버그용 원본 텍스트
    model: str


def _run_model(system: str, user: str, max_new_tokens: int, temperature: float) -> str:
    """공통 모델 실행 로직."""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="모델 로딩 중")
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    generated = output_ids[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


def _extract_json(text: str) -> dict | None:
    """텍스트에서 JSON 블록을 추출한다. 실패 시 None 반환."""
    # ```json ... ``` 블록 우선
    block = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if block:
        try:
            return json.loads(block.group(1))
        except json.JSONDecodeError:
            pass
    # 중괄호 범위 직접 탐색
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_ID, "device": DEVICE, "loaded": model is not None}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """자유 텍스트 생성 — 기존 /api/narrate 호환용."""
    narration = _run_model(req.system, req.user, req.max_new_tokens, req.temperature)
    log.info(f"[generate] 완료 ({len(narration)}자)")
    return GenerateResponse(narration=narration, model=MODEL_ID, device=DEVICE)


@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    """
    행동 결정 엔드포인트.
    M2가 valid_ids 중 하나를 id_field로 선택하고 서술 텍스트를 JSON으로 반환한다.
    id_field가 valid_ids에 없으면 400 에러 (Node.js에서 fallback 처리).
    """
    raw = _run_model(req.system, req.user, req.max_new_tokens, req.temperature)
    log.info(f"[decide] 원본: {raw[:120]}...")

    result = _extract_json(raw)
    if result is None:
        log.warning("[decide] JSON 파싱 실패")
        raise HTTPException(status_code=422, detail=f"JSON 파싱 실패: {raw[:200]}")

    chosen_id = result.get(req.id_field)
    if chosen_id not in req.valid_ids:
        log.warning(f"[decide] 유효하지 않은 id: {chosen_id!r} (valid: {req.valid_ids})")
        raise HTTPException(
            status_code=422,
            detail=f"id '{chosen_id}'이 valid_ids에 없음"
        )

    log.info(f"[decide] 선택: {chosen_id}")
    return DecideResponse(result=result, raw=raw, model=MODEL_ID)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
