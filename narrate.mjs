/**
 * M2 Narration — inference.py (FastAPI) 호출 레이어
 *
 * 우선순위:
 *   1. INFER_ENDPOINT 환경변수가 있으면 해당 FastAPI 서버 사용
 *      (로컬: http://localhost:8000, Modal 배포: https://xxx.modal.run)
 *   2. 없으면 null 반환 → app.js에서 fallback(rationale) 사용
 *
 * FastAPI 서버 실행:
 *   pip install -r requirements-inference.txt
 *   python inference.py
 */

const INFER_ENDPOINT = process.env.INFER_ENDPOINT; // e.g. "http://localhost:8000"
const TIMEOUT_MS = 30000;

function buildLatentHighlights(latentVector) {
  return latentVector
    .map((value, index) => ({ dim: `z${index}`, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3)
    .map(({ dim, value }) =>
      `${dim}: ${value > 0 ? "+" : ""}${value.toFixed(2)} (${Math.abs(value) > 0.5 ? "강함" : "약함"}, ${value > 0 ? "양" : "음"})`
    )
    .join(", ");
}

function buildPrompt(payload) {
  const { character_prompt, development_summary, event_title, event_summary, action_label, latent_highlights } = payload;

  const system = `당신은 캐릭터의 내면을 서술하는 작가입니다.
주어진 캐릭터 정보와 성장 맥락, 잠재 성향 신호를 바탕으로
캐릭터가 왜 이 행동을 선택했는지 2~3문장으로 서술하세요.
캐릭터의 과거 경험과 현재 성향이 행동에 어떻게 반영됐는지 보여주세요.
서술은 3인칭으로 작성하고, 심리적 내면을 중심으로 써주세요.`;

  const user = `캐릭터: ${character_prompt}

성장 과정: ${Array.isArray(development_summary) ? development_summary.join(" → ") : development_summary}

사건: ${event_title} — ${event_summary}

선택한 행동: ${action_label}

잠재 성향 신호 (값이 클수록 해당 방향이 강함): ${latent_highlights}

이 캐릭터가 위 행동을 선택한 이유를 내면 심리 중심으로 서술하세요.`;

  return { system, user };
}

export async function generateNarration(payload) {
  if (!INFER_ENDPOINT) {
    console.warn("[NARRATE] INFER_ENDPOINT 없음 — fallback 사용");
    return null;
  }

  const latentHighlights = buildLatentHighlights(payload.latent_vector ?? []);
  const { system, user } = buildPrompt({ ...payload, latent_highlights: latentHighlights });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${INFER_ENDPOINT}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user, temperature: 0.7 }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Inference API ${response.status}: ${err}`);
    }

    const data = await response.json();
    const narration = data.narration?.trim();
    if (!narration) throw new Error("빈 응답");

    console.log("[NARRATE] 생성 완료");
    return narration;

  } catch (error) {
    clearTimeout(timeout);
    console.error("[NARRATE] 실패:", error?.message || error);
    return null;
  }
}
