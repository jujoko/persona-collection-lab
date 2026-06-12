"""
Play Model 추론 스크립트

Stage 1: 텍스트 → klue/roberta-base (fine-tuned) → skills_emb + hobbies_emb
Stage 2: (skills_emb + hobbies_emb) vs action 설명 텍스트 cosine similarity → action_id

사용법:
  from ml.play_model_inference import PlayModelInference

  model = PlayModelInference()
  action_id = model.predict(
      persona_text="...",
      event_id="ME001",
      action_candidates=["reports_to_authorities", "stays_silent", "confronts_directly"]
  )

주의: action 설명 임베딩도 klue/roberta-base 사용 (MiniLM과 공간 다름)
"""

import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from transformers import AutoTokenizer, AutoModel

sys.stdout.reconfigure(encoding="utf-8")

# ── action 설명 텍스트 (한국어, klue/roberta-base 임베딩용) ───────────
ACTION_DESCRIPTIONS = {
    "reports_to_authorities": "감사 부서 혹은 외부 기관에 신고한다",
    "stays_silent":           "모른 척하고 넘어간다",
    "confronts_directly":     "팀장에게 직접 따진다",
    "refuses_illegal":        "불법 경로를 거절하고 합법 방법을 찾는다",
    "uses_illegal_loan":      "가족을 위해 불법 대출을 선택한다",
    "seeks_third_way":        "사회단체·법률구조 등 대안을 찾는다",
    "saves_one_critical":     "중증 환자 한 명을 우선 치료한다",
    "distributes_to_many":    "다수의 경증 환자에게 나눈다",
    "calls_for_more_resources": "추가 지원을 요청하며 버틴다",
    "hacks_the_server":       "불법임을 알면서 서버에 접근한다",
    "trusts_legal_process":   "느리더라도 합법 절차를 따른다",
    "finds_a_whistleblower":  "내부 제보자를 찾아 합법적으로 꺼낸다",
    "obeys_order":            "지시를 따르고 넘어간다",
    "refuses_order":          "거절하고 불이익을 감수한다",
    "reports_upward":         "더 윗선에 문제를 알린다",
}

# ── 모델 구조 (train_play_model.py와 동일해야 함) ─────────────────────
EMBED_DIM  = 768
HIDDEN_DIM = 128
MAX_LEN    = 256
ENCODER_NAME = "klue/roberta-base"
MODEL_PATH   = Path("ml/play_model.pt")

class PlayModelHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(EMBED_DIM, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, EMBED_DIM),
        )

    def forward(self, x):
        return self.net(x)

class PlayModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.skills_head  = PlayModelHead()
        self.hobbies_head = PlayModelHead()

    def forward(self, input_emb):
        return self.skills_head(input_emb), self.hobbies_head(input_emb)

# ── 추론 클래스 ───────────────────────────────────────────────────────
class PlayModelInference:
    def __init__(self, model_path: Path = MODEL_PATH, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        print(f"PlayModel 로드 중... ({self.device})")
        self.tokenizer = AutoTokenizer.from_pretrained(ENCODER_NAME)
        self.encoder   = AutoModel.from_pretrained(ENCODER_NAME).to(self.device)
        self.model     = PlayModel().to(self.device)

        state = torch.load(model_path, map_location=self.device)
        self.encoder.load_state_dict(state["encoder"])
        self.model.load_state_dict(state["model"])

        self.encoder.eval()
        self.model.eval()

        # action 설명 임베딩 캐시 (최초 1회 계산)
        self._action_emb_cache: dict[str, torch.Tensor] = {}
        print("완료")

    def _encode(self, texts: list) -> torch.Tensor:
        """텍스트 리스트 → (N, 768) tensor"""
        enc = self.tokenizer(texts, padding=True, truncation=True,
                             max_length=MAX_LEN, return_tensors="pt").to(self.device)
        with torch.no_grad():
            out = self.encoder(**enc)
        token_emb = out.last_hidden_state
        mask      = enc["attention_mask"].unsqueeze(-1).float()
        return (token_emb * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)

    def _get_action_emb(self, action_id: str) -> torch.Tensor:
        """action 설명 텍스트 임베딩 (캐시)"""
        if action_id not in self._action_emb_cache:
            desc = ACTION_DESCRIPTIONS.get(action_id, action_id)
            self._action_emb_cache[action_id] = self._encode([desc])[0]
        return self._action_emb_cache[action_id]

    def predict(self,
                persona_text: str,
                action_candidates: list[str]) -> str:
        """
        페르소나 텍스트 → 가장 어울리는 action_id 반환

        Args:
            persona_text:      유저 입력 텍스트
            action_candidates: 이번 이벤트의 action_id 목록

        Returns:
            action_id (str)
        """
        # Stage 1: 텍스트 → skills_emb + hobbies_emb
        input_emb = self._encode([persona_text])            # (1, 768)
        with torch.no_grad():
            skills_emb, hobbies_emb = self.model(input_emb)  # (1, 768) each

        # 두 임베딩을 평균해서 대표 벡터로
        persona_emb = (skills_emb + hobbies_emb) / 2        # (1, 768)

        # Stage 2: action 설명과 cosine similarity 비교
        scores = {}
        for action_id in action_candidates:
            action_emb = self._get_action_emb(action_id).unsqueeze(0)  # (1, 768)
            sim = F.cosine_similarity(persona_emb, action_emb, dim=-1).item()
            scores[action_id] = sim

        best = max(scores, key=scores.get)
        return best

    def predict_with_scores(self,
                            persona_text: str,
                            action_candidates: list[str]) -> dict:
        """
        predict()와 동일하지만 모든 action의 similarity score도 반환

        Returns:
            {"action_id": str, "scores": {action_id: float}}
        """
        input_emb = self._encode([persona_text])
        with torch.no_grad():
            skills_emb, hobbies_emb = self.model(input_emb)
        persona_emb = (skills_emb + hobbies_emb) / 2

        scores = {}
        for action_id in action_candidates:
            action_emb = self._get_action_emb(action_id).unsqueeze(0)
            scores[action_id] = round(
                F.cosine_similarity(persona_emb, action_emb, dim=-1).item(), 4
            )

        best = max(scores, key=scores.get)
        return {"action_id": best, "scores": scores}


# ── 간단 테스트 ───────────────────────────────────────────────────────
if __name__ == "__main__":
    if not MODEL_PATH.exists():
        print(f"모델 파일 없음: {MODEL_PATH}")
        print("먼저 train_play_model.py로 학습을 완료하세요.")
        exit(1)

    infer = PlayModelInference()

    # 테스트 케이스
    test_cases = [
        {
            "text": "저는 10년차 회계사입니다. 숫자 분석과 법률 검토를 잘 하고, 원칙을 중시합니다. 주말엔 법률 서적을 읽거나 커뮤니티 봉사를 합니다.",
            "candidates": ["reports_to_authorities", "stays_silent", "confronts_directly"],
            "event": "ME001 내부고발"
        },
        {
            "text": "저는 프리랜서 디자이너입니다. 창의적인 문제 해결을 즐기고 새로운 방법을 찾는 것을 좋아합니다. 취미는 해킹 챌린지와 오픈소스 기여입니다.",
            "candidates": ["hacks_the_server", "trusts_legal_process", "finds_a_whistleblower"],
            "event": "ME004 금지된 방법"
        },
        {
            "text": "저는 조용히 살고 싶은 평범한 직장인입니다. 눈에 띄는 걸 싫어하고 안정적인 생활을 중시합니다. 퇴근 후엔 넷플릭스 보는 걸 좋아합니다.",
            "candidates": ["obeys_order", "refuses_order", "reports_upward"],
            "event": "ME005 조직의 압력"
        },
    ]

    print("\n=== 추론 테스트 ===\n")
    for tc in test_cases:
        result = infer.predict_with_scores(tc["text"], tc["candidates"])
        print(f"[{tc['event']}]")
        print(f"  입력: {tc['text'][:40]}...")
        print(f"  선택: {result['action_id']}")
        print(f"  점수: {result['scores']}")
        print()
