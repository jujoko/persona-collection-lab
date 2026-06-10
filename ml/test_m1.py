"""
M1 테스트: 학습된 adapter로 페르소나 텍스트 → latent 변환 확인
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer

LATENT_DIM = 8
EMBED_DIM  = 384
HIDDEN_DIM = 64

class M1Adapter(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(EMBED_DIM, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, LATENT_DIM),
            nn.Tanh(),
        )
    def forward(self, x):
        return self.net(x)

# 모델 로드
minilm = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

trained = M1Adapter()
trained.load_state_dict(torch.load("ml/m1_adapter.pt", map_location="cpu"))
trained.eval()

untrained = M1Adapter()  # random init
torch.manual_seed(42)
untrained.eval()

def to_latent(text: str, model: nn.Module) -> list:
    emb = torch.tensor(minilm.encode([text]))
    with torch.no_grad():
        latent = model(emb).squeeze().tolist()
    return [round(v, 3) for v in latent]

# ─── 테스트 케이스 ────────────────────────────────────────────────────────────

personas = [
    ("30대 간호사 (공동체 지향)",
     "박지수 씨는 서울 노원구의 대형 병원에서 일하는 34세 간호사로, 환자 곁에서 헌신적으로 돌봄을 실천하며 주변 동료와 가족을 늘 먼저 챙기는 따뜻한 성격입니다."),

    ("30대 간호사 (유사 직업)",
     "김민정 씨는 부산 해운대 병원의 32세 간호사로, 응급실에서 냉철하게 판단하며 환자 안전을 최우선으로 생각하는 꼼꼼한 성격입니다."),

    ("70대 하역직 (다른 배경)",
     "전기태 씨는 광주 서구에서 평생 하역 일을 하며 살아온 74세 가장으로, 투박한 손마디에 삶의 흔적이 배어 있는 성실한 인물입니다."),

    ("20대 스타트업 창업자",
     "이준혁 씨는 강남구의 IT 스타트업을 창업한 27세 대표로, 혁신과 변화를 추구하며 빠른 의사결정과 도전을 즐기는 야심찬 성격입니다."),

    ("50대 공무원",
     "최성호 씨는 경기도청에서 25년째 근무 중인 53세 행정직 공무원으로, 규정과 절차를 중시하고 안정적인 생활을 선호하는 성실한 인물입니다."),
]

import math
def dist(a, b):
    return round(math.sqrt(sum((x-y)**2 for x,y in zip(a,b))), 3)

def run_test(model, label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    latents = []
    for name, text in personas:
        latent = to_latent(text, model)
        latents.append(latent)
        print(f"[{name}]")
        print(f"  {latent}")

    print("\n거리 비교:")
    names = [p[0] for p in personas]
    for i in range(len(latents)):
        for j in range(i+1, len(latents)):
            d = dist(latents[i], latents[j])
            print(f"  {names[i][:14]} ↔ {names[j][:14]} : {d}")
    return latents

latents_before = run_test(untrained, "학습 전 (random init)")
latents_after  = run_test(trained,   "학습 후 (trained)")
