"""
M2 Narration Inference Server
==============================
FastAPI + Transformers로 Qwen2.5-1.5B-Instruct를 로컬 GPU에서 서빙.
Node.js server.mjs → POST /generate → 서술 텍스트 반환.

실행:
    pip install -r requirements-inference.txt
    python inference.py

배포 (Modal):
    modal deploy modal_inference.py
"""

import os
import time
import logging
from contextlib import asynccontextmanager

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


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_ID, "device": DEVICE, "loaded": model is not None}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="모델 로딩 중")

    messages = [
        {"role": "system", "content": req.system},
        {"role": "user", "content": req.user},
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    inputs = tokenizer([text], return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=req.max_new_tokens,
            temperature=req.temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    # 입력 토큰 제거 → 생성된 부분만
    generated = output_ids[0][inputs["input_ids"].shape[1]:]
    narration = tokenizer.decode(generated, skip_special_tokens=True).strip()

    log.info(f"생성 완료 ({len(narration)}자)")
    return GenerateResponse(narration=narration, model=MODEL_ID, device=DEVICE)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
