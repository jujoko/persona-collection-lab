"""
Modal.com 배포용 M2 나레이션 서버
===================================
Modal은 서버리스 GPU — 요청 있을 때만 과금, idle 시 $0.
$30 무료 크레딧 제공 (https://modal.com).

배포:
    pip install modal
    modal setup            # 계정 연결
    modal deploy modal_inference.py

업데이트 (파인튜닝 후):
    # 1. 새 weights를 HuggingFace Hub에 올리고
    # 2. MODEL_ID 변경 또는 동일 ID 유지
    # 3. modal deploy modal_inference.py  ← 끝

엔드포인트 URL 확인:
    modal app list
"""

import modal

app = modal.App("persona-m2-narration")

# GPU 이미지: CUDA + transformers
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.3.0",
        "transformers>=4.40.0",
        "accelerate>=0.30.0",
        "fastapi>=0.111.0",
        "uvicorn",
        "pydantic>=2.0.0",
    )
)

MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

# 모델을 Modal 볼륨에 캐시 (재배포 시 재다운로드 안 함)
volume = modal.Volume.from_name("m2-model-cache", create_if_missing=True)
CACHE_DIR = "/model-cache"


@app.cls(
    gpu="T4",
    image=image,
    volumes={CACHE_DIR: volume},
    timeout=120,
    scaledown_window=300,  # 5분 idle 후 종료 (비용 절감)
)
class NarrationModel:
    @modal.enter()
    def load(self):
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM

        print(f"[Modal] 모델 로딩: {MODEL_ID}")
        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_ID, cache_dir=CACHE_DIR
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            device_map="auto",
            cache_dir=CACHE_DIR,
        )
        self.model.eval()
        print("[Modal] 로딩 완료")

    @modal.web_endpoint(method="GET", path="/health")
    def health(self):
        return {"ok": True, "model": MODEL_ID}

    @modal.web_endpoint(method="POST", path="/generate")
    def generate(self, req: dict):
        import torch

        system = req.get("system", "")
        user = req.get("user", "")
        temperature = float(req.get("temperature", 0.7))
        max_new_tokens = int(req.get("max_new_tokens", 250))

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self.tokenizer([text], return_tensors="pt").to("cuda")

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated = output_ids[0][inputs["input_ids"].shape[1]:]
        narration = self.tokenizer.decode(generated, skip_special_tokens=True).strip()
        return {"narration": narration, "model": MODEL_ID}
