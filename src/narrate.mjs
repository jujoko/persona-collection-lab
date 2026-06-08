/**
 * M2 Decision + Narration 레이어
 *
 * INFER_ENDPOINT 환경변수가 있으면 FastAPI 서버 사용.
 * 없거나 실패하면 null 반환 → 호출부에서 엔진 fallback.
 *
 * FastAPI 서버:
 *   python inference.py        (로컬)
 *   modal deploy modal_inference.py  (배포)
 */

const INFER_ENDPOINT = process.env.INFER_ENDPOINT; // e.g. "http://localhost:8000"
const TIMEOUT_MS = 30000;

// ─── 공통 유틸 ──────────────────────────────────────────────────────────────

function latentHighlights(latentVector) {
  return latentVector
    .map((value, index) => ({ dim: `z${index}`, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3)
    .map(({ dim, value }) =>
      `${dim}: ${value > 0 ? "+" : ""}${value.toFixed(2)} (${Math.abs(value) > 0.5 ? "강함" : "약함"}, ${value > 0 ? "양" : "음"})`
    )
    .join(", ");
}

async function callInfer(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${INFER_ENDPOINT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Inference ${res.status}: ${err}`);
    }
    return await res.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// ─── Growth Phase 결정 ────────────────────────────────────────────────────────

/**
 * Growth Phase 이벤트 하나에 대해 M2에게 adaptation 결정을 요청한다.
 *
 * @param {object} payload
 *   character_prompt, latent_vector, event_title, event_summary,
 *   adaptations: [{ id, label }]
 * @returns {{ adaptation_id, adaptation_label, summary, rationale } | null}
 */
export async function generateGrowthDecision(payload) {
  if (!INFER_ENDPOINT) return null;

  const highlights = latentHighlights(payload.latent_vector ?? []);
  const adaptationList = payload.adaptations
    .map(a => `- ${a.id}: ${a.label}`)
    .join("\n");
  const validIds = payload.adaptations.map(a => a.id);

  const system = `당신은 캐릭터의 성장 과정을 결정하는 AI입니다.
주어진 캐릭터 정보, 현재 잠재 성향, 성장 사건을 바탕으로
아래 선택지 중 하나를 고르고 그 이유를 서술하세요.
반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 출력하지 마세요.
{"adaptation_id":"...","adaptation_label":"...","summary":"...","rationale":"..."}
adaptation_id는 반드시 주어진 선택지의 id 중 하나여야 합니다.`;

  const user = `캐릭터: ${payload.character_prompt}

현재 잠재 성향 (강한 순): ${highlights}

성장 사건: ${payload.event_title} — ${payload.event_summary}

선택지:
${adaptationList}

위 선택지 중 이 캐릭터에게 가장 적합한 성장 변화를 골라 JSON으로 응답하세요.
summary는 성장 변화 설명 (1~2문장), rationale은 심리적 판단 (2~3문장).`;

  try {
    const data = await callInfer("/decide", {
      system, user,
      valid_ids: validIds,
      id_field: "adaptation_id",
      max_new_tokens: 300,
      temperature: 0.7
    });
    console.log(`[M2/growth] ${data.result.adaptation_id}`);
    return data.result;
  } catch (error) {
    console.error("[M2/growth] 실패:", error?.message || error);
    return null;
  }
}

// ─── World Event 결정 ────────────────────────────────────────────────────────

/**
 * World Event 하나에 대해 M2에게 action 결정을 요청한다.
 *
 * @param {object} payload
 *   character_prompt, development_summary (string[]), latent_vector,
 *   event_title, event_summary,
 *   actions: [{ id, label }]
 * @returns {{ action_id, outcome, rationale } | null}
 */
export async function generateWorldDecision(payload) {
  if (!INFER_ENDPOINT) return null;

  const highlights = latentHighlights(payload.latent_vector ?? []);
  const devHistory = Array.isArray(payload.development_summary)
    ? payload.development_summary.join(" → ")
    : payload.development_summary ?? "";
  const actionList = payload.actions
    .map(a => `- ${a.id}: ${a.label}`)
    .join("\n");
  const validIds = payload.actions.map(a => a.id);

  const system = `당신은 캐릭터의 행동을 결정하는 AI입니다.
주어진 정보를 바탕으로 캐릭터가 어떤 행동을 선택할지 결정하고
그 결과와 심리적 이유를 서술하세요.
반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 출력하지 마세요.
{"action_id":"...","outcome":"...","rationale":"..."}
action_id는 반드시 주어진 선택지의 id 중 하나여야 합니다.`;

  const user = `캐릭터: ${payload.character_prompt}

성장 과정: ${devHistory}

현재 잠재 성향 (강한 순): ${highlights}

사건: ${payload.event_title} — ${payload.event_summary}

선택지:
${actionList}

위 선택지 중 이 캐릭터가 선택할 행동을 골라 JSON으로 응답하세요.
outcome은 행동 결과 서술 (1~2문장), rationale은 심리적 판단 (2~3문장).`;

  try {
    const data = await callInfer("/decide", {
      system, user,
      valid_ids: validIds,
      id_field: "action_id",
      max_new_tokens: 300,
      temperature: 0.7
    });
    console.log(`[M2/world] ${data.result.action_id}`);
    return data.result;
  } catch (error) {
    console.error("[M2/world] 실패:", error?.message || error);
    return null;
  }
}

// ─── 기존 /api/narrate 호환용 (유지) ─────────────────────────────────────────

export async function generateNarration(payload) {
  if (!INFER_ENDPOINT) {
    console.warn("[NARRATE] INFER_ENDPOINT 없음 — fallback 사용");
    return null;
  }

  const highlights = latentHighlights(payload.latent_vector ?? []);
  const system = `당신은 캐릭터의 내면을 서술하는 작가입니다.
주어진 캐릭터 정보와 성장 맥락, 잠재 성향 신호를 바탕으로
캐릭터가 왜 이 행동을 선택했는지 2~3문장으로 서술하세요.
서술은 3인칭으로 작성하고, 심리적 내면을 중심으로 써주세요.`;

  const user = `캐릭터: ${payload.character_prompt}
성장 과정: ${Array.isArray(payload.development_summary) ? payload.development_summary.join(" → ") : payload.development_summary}
사건: ${payload.event_title} — ${payload.event_summary}
선택한 행동: ${payload.action_label}
잠재 성향 신호: ${highlights}
이 캐릭터가 위 행동을 선택한 이유를 내면 심리 중심으로 서술하세요.`;

  try {
    const data = await callInfer("/generate", { system, user, temperature: 0.7 });
    const narration = data.narration?.trim();
    if (!narration) throw new Error("빈 응답");
    console.log("[NARRATE] 생성 완료");
    return narration;
  } catch (error) {
    console.error("[NARRATE] 실패:", error?.message || error);
    return null;
  }
}
