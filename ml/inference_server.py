"""
ML Inference Server (Python, port 8788)

Node.js server.mjs가 이 서버로 프록시한다.

엔드포인트:
  POST /persona      — 페르소나 텍스트 → M1 latent vector (8-dim)
  POST /play_action  — 페르소나 텍스트 + action 후보 → action_id

실행:
  .venv/Scripts/python ml/inference_server.py
"""

import json
import sys
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer

sys.stdout.reconfigure(encoding="utf-8")

PORT = 8788
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

M1_MODEL_PATH   = Path("ml/m1_adapter.pt")
PLAY_MODEL_PATH = Path("ml/play_model.pt")

# ── M1 구조 ───────────────────────────────────────────────────────────
M1_EMBED_DIM  = 384
M1_HIDDEN_DIM = 64
M1_LATENT_DIM = 8
M1_MINILM     = "sentence-transformers/all-MiniLM-L6-v2"

class M1Adapter(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(M1_EMBED_DIM, M1_HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(M1_HIDDEN_DIM, M1_LATENT_DIM),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.net(x)

# ── Play Model 구조 ───────────────────────────────────────────────────
PM_EMBED_DIM  = 768
PM_HIDDEN_DIM = 128
PM_ENCODER    = "klue/roberta-base"
PM_MAX_LEN    = 256

class PlayModelHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(PM_EMBED_DIM, PM_HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(PM_HIDDEN_DIM, PM_EMBED_DIM),
        )

    def forward(self, x):
        return self.net(x)

class PlayModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.skills_head  = PlayModelHead()
        self.hobbies_head = PlayModelHead()

    def forward(self, x):
        return self.skills_head(x), self.hobbies_head(x)

# ── action 설명 텍스트 ────────────────────────────────────────────────
ACTION_DESCRIPTIONS = {
    "reports_to_authorities":   "감사 부서 혹은 외부 기관에 신고한다",
    "stays_silent":             "모른 척하고 넘어간다",
    "confronts_directly":       "팀장에게 직접 따진다",
    "refuses_illegal":          "불법 경로를 거절하고 합법 방법을 찾는다",
    "uses_illegal_loan":        "가족을 위해 불법 대출을 선택한다",
    "seeks_third_way":          "사회단체·법률구조 등 대안을 찾는다",
    "saves_one_critical":       "중증 환자 한 명을 우선 치료한다",
    "distributes_to_many":      "다수의 경증 환자에게 나눈다",
    "calls_for_more_resources": "추가 지원을 요청하며 버틴다",
    "hacks_the_server":         "불법임을 알면서 서버에 접근한다",
    "trusts_legal_process":     "느리더라도 합법 절차를 따른다",
    "finds_a_whistleblower":    "내부 제보자를 찾아 합법적으로 꺼낸다",
    "obeys_order":              "지시를 따르고 넘어간다",
    "refuses_order":            "거절하고 불이익을 감수한다",
    "reports_upward":           "더 윗선에 문제를 알린다",
}

# ── 모델 로드 ─────────────────────────────────────────────────────────
print(f"device: {DEVICE}")

# M1
print("M1 로드 중...")
m1_minilm   = SentenceTransformer(M1_MINILM, device=DEVICE)
m1_adapter  = M1Adapter().to(DEVICE)
m1_adapter.load_state_dict(torch.load(M1_MODEL_PATH, map_location=DEVICE))
m1_adapter.eval()
print(f"  M1 완료: {M1_MODEL_PATH}")

# Play Model (없으면 건너뜀)
pm_available = PLAY_MODEL_PATH.exists()
pm_tokenizer = None
pm_encoder   = None
pm_model     = None
pm_action_cache = {}

if pm_available:
    print("Play Model 로드 중...")
    pm_tokenizer = AutoTokenizer.from_pretrained(PM_ENCODER)
    pm_encoder   = AutoModel.from_pretrained(PM_ENCODER).to(DEVICE)
    pm_model     = PlayModel().to(DEVICE)
    state = torch.load(PLAY_MODEL_PATH, map_location=DEVICE)
    pm_encoder.load_state_dict(state["encoder"])
    pm_model.load_state_dict(state["model"])
    pm_encoder.eval()
    pm_model.eval()
    print(f"  Play Model 완료: {PLAY_MODEL_PATH}")
else:
    print(f"  Play Model 없음 ({PLAY_MODEL_PATH}) — /play_action 비활성")

# ── 추론 함수 ─────────────────────────────────────────────────────────
def m1_encode(text: str) -> list:
    """텍스트 → 8-dim latent vector"""
    with torch.no_grad():
        emb = torch.tensor(
            m1_minilm.encode([text]), dtype=torch.float32
        ).to(DEVICE)
        latent = m1_adapter(emb)[0]
    return latent.cpu().tolist()

def pm_encode_text(text: str) -> torch.Tensor:
    """텍스트 → (768,) tensor"""
    enc = pm_tokenizer(text, padding=True, truncation=True,
                       max_length=PM_MAX_LEN, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = pm_encoder(**enc)
    token_emb = out.last_hidden_state
    mask = enc["attention_mask"].unsqueeze(-1).float()
    return (token_emb * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)  # (1, 768)

def pm_get_action_emb(action_id: str) -> torch.Tensor:
    """action 설명 임베딩 (캐시)"""
    if action_id not in pm_action_cache:
        desc = ACTION_DESCRIPTIONS.get(action_id, action_id)
        pm_action_cache[action_id] = pm_encode_text(desc)[0]
    return pm_action_cache[action_id]

def play_action(text: str, candidates: list) -> dict:
    """텍스트 + action 후보 → action_id + scores"""
    input_emb = pm_encode_text(text)  # (1, 768)
    with torch.no_grad():
        skills_emb, hobbies_emb = pm_model(input_emb)
    persona_emb = (skills_emb + hobbies_emb) / 2  # (1, 768)

    scores = {}
    for action_id in candidates:
        action_emb = pm_get_action_emb(action_id).unsqueeze(0)
        scores[action_id] = round(
            F.cosine_similarity(persona_emb, action_emb, dim=-1).item(), 4
        )

    best = max(scores, key=scores.get)
    return {"action_id": best, "scores": scores}

# ── HTTP 핸들러 ───────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[inference] {self.address_string()} {format % args}")

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        try:
            body = self.read_json()

            if self.path == "/persona":
                text = str(body.get("text", "")).strip()
                if not text:
                    self.send_json(400, {"error": "text is required"})
                    return
                latent = m1_encode(text)
                self.send_json(200, {"ok": True, "latent": latent})

            elif self.path == "/play_action":
                if not pm_available:
                    self.send_json(503, {"error": "Play Model 아직 학습 전"})
                    return
                text       = str(body.get("text", "")).strip()
                candidates = body.get("candidates", [])
                if not text or not candidates:
                    self.send_json(400, {"error": "text and candidates are required"})
                    return
                result = play_action(text, candidates)
                self.send_json(200, {"ok": True, **result})

            else:
                self.send_json(404, {"error": "not found"})

        except Exception as e:
            traceback.print_exc()
            self.send_json(500, {"error": str(e)})

# ── 실행 ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"\nML inference server running at http://localhost:{PORT}")
    print(f"  POST /persona      — M1 latent vector")
    print(f"  POST /play_action  — Play Model action 선택 ({'활성' if pm_available else '비활성 — play_model.pt 없음'})")
    server.serve_forever()
