/**
 * Story Content Adapter
 *
 * arc 이벤트(content/*.js) → 엔진/프론트엔드가 소비할 수 있는 형태로 변환.
 *
 * 역할:
 *  1. 플래그 requires/excludes 필터링
 *  2. innate_seed 기반 결정론적 서브셋 샘플링
 *  3. summary_variants 해석 (플래그 기반 분기 텍스트)
 *  4. 엔진 호환 이벤트 형태로 변환 (embedding 없으면 빈 배열)
 *
 * 엔진 latent 벡터와 story flags는 독립적인 레이어다.
 * 이 어댑터는 flags만 다루고, latent 벡터에는 관여하지 않는다.
 */

const { matchesFlags, FLAG_DEFAULTS } =
  (typeof require === "function")
    ? require("./flags.js")
    : globalThis.StoryFlags;

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

/**
 * 문자열 해시 (engine.js의 hashText와 동일 알고리즘)
 * @param {string} text
 * @returns {number}
 */
function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * seeded pseudo-random (0~1)
 * @param {number} seed
 * @param {number} index
 */
function seededRandom(seed, index) {
  return Math.abs(Math.sin(seed * 9301 + index * 49297 + 233720)) % 1;
}

/**
 * 가중치 샘플링. 뽑은 항목은 풀에서 제거하며 count개 반환.
 * 결정론적: seed + 풀 순서에만 의존.
 */
function weightedSample(items, count, seed) {
  if (items.length <= count) return [...items];
  const pool = items.map((item, index) => ({ item, index }));
  const chosen = [];
  let rngIndex = 0;
  while (chosen.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, entry) => sum + (entry.item.weight ?? 1), 0);
    let pick = seededRandom(seed, rngIndex++) * totalWeight;
    let found = -1;
    for (let i = 0; i < pool.length; i++) {
      pick -= pool[i].item.weight ?? 1;
      if (pick <= 0) { found = i; break; }
    }
    if (found === -1) found = pool.length - 1;
    chosen.push(pool[found].item);
    pool.splice(found, 1);
  }
  return chosen;
}

// ── 엔진 호환 형태 변환 ──────────────────────────────────────────────────────

/**
 * story action → 엔진 action 형태.
 * embedding/endingWeight/cueWords 없으면 안전한 기본값.
 */
function adaptAction(action, flags) {
  // action-level requires/excludes 체크 (플래그 조건)
  if (!matchesFlags(flags, action.requires || {}, action.excludes || {})) {
    return null; // 이 선택지는 현재 플래그에서 노출되지 않음
  }
  return {
    id: action.id,
    label: action.label,
    outcome: action.outcome,
    sets: action.sets || {},                   // 플래그 세팅 (엔진은 무시, 앱에서 처리)
    embedding: action.embedding || [],         // 없으면 빈 배열 (engine fallback)
    endingWeight: action.endingWeight || {},
    cueWords: action.cueWords || [],
    bias: action.bias ?? 0
  };
}

/**
 * story event → 엔진 호환 event 형태.
 */
function adaptEvent(event, arc, flags) {
  const actions = (event.actions || [])
    .map(action => adaptAction(action, flags))
    .filter(Boolean);

  // 선택지가 2개 미만이면 이 이벤트 제외
  if (actions.length < 2) return null;

  return {
    // 식별자
    id: event.id,
    arc: event.arc,
    chapter: `${arc.title} · ${arc.subtitle || ""}`,
    title: event.title,
    type: event.type,
    tags: event.tags || [],

    // 서술 (플래그 기반 분기)
    summary: resolvestring(event, flags),
    event_summary: resolvestring(event, flags), // engine compat alias

    // 엔진 연동 (없으면 빈값 — engine이 hash fallback 사용)
    event_embedding: event.event_embedding || [],

    // 선택지
    actions,

    // 스토리 메타 (엔진은 무시)
    story_flags: {
      requires: event.requires || {},
      excludes: event.excludes || {},
      weight: event.weight ?? 1
    },
    leads_to: event.leads_to || []
  };
}

function resolvestring(event, flags) {
  return resolveSummary(event.summary, event.summary_variants, flags);
}

/**
 * summary_variants에서 현재 플래그에 맞는 텍스트를 반환.
 * key 형식: "flagKey:value" (예: "academic_effort:high")
 */
function resolveSummary(summary, variants, flags) {
  if (!variants || typeof variants !== "object") return summary;
  for (const [key, text] of Object.entries(variants)) {
    const colonIndex = key.indexOf(":");
    if (colonIndex === -1) continue;
    const flagKey = key.slice(0, colonIndex);
    const flagValue = key.slice(colonIndex + 1);
    if (flags[flagKey] === flagValue) return text;
  }
  return summary;
}

// ── 메인 API ─────────────────────────────────────────────────────────────────


/**
 * 아크 배열과 캐릭터 정보를 받아 한 플레이의 이벤트 목록을 생성.
 *
 * @param {object[]} arcs - content/*.js의 ARC 객체 배열 (arc.order 순으로 정렬됨)
 * @param {object} options
 * @param {object}  options.flags      - 현재 캐릭터의 스토리 플래그 상태
 * @param {string}  options.innateSeed - 캐릭터 고유 시드 (결정론적 샘플링용)
 * @returns {object[]} 엔진 호환 이벤트 배열
 */
function buildRunEvents(arcs, { flags = {}, innateSeed = "default" } = {}) {
  const mergedFlags = { ...FLAG_DEFAULTS, ...flags };
  const runEvents = [];

  const sortedArcs = [...arcs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (const arc of sortedArcs) {
    const eligible = (arc.events || []).filter(event =>
      matchesFlags(mergedFlags, event.requires || {}, event.excludes || {})
    );

    const arcSeed = hashText(`${innateSeed}:${arc.id}`);
    const sampled = weightedSample(eligible, arc.events_per_run ?? 2, arcSeed);

    for (const event of sampled) {
      const adapted = adaptEvent(event, arc, mergedFlags);
      if (adapted) {
        runEvents.push(adapted);
        // 이 이벤트의 첫 번째 선택지 sets를 즉시 플래그에 반영하지 않음.
        // 플래그 업데이트는 플레이어가 실제로 선택했을 때 앱 레이어에서 처리.
      }
    }
  }

  return runEvents;
}

function sortedArcs(arcs) {
  return [...arcs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function eligibleAdaptedEvents(arc, flags, usedEventIds) {
  return (arc.events || [])
    .filter(event => !usedEventIds.has(event.id))
    .filter(event => matchesFlags(flags, event.requires || {}, event.excludes || {}))
    .map(event => adaptEvent(event, arc, flags))
    .filter(Boolean);
}

/**
 * 런 중 선택 결과가 다음 사건 후보에 즉시 반영되는 stepper API.
 */
function createRun(arcs, { flags = {}, innateSeed = "default" } = {}) {
  const state = {
    arcs: sortedArcs(arcs),
    flags: { ...FLAG_DEFAULTS, ...flags },
    innateSeed,
    arcIndex: 0,
    arcEventCounts: {},
    usedEventIds: new Set(),
    history: []
  };

  function getFlags() {
    return { ...state.flags };
  }

  function getState() {
    return {
      arcs: state.arcs.map(arc => arc.id),
      flags: getFlags(),
      arcIndex: state.arcIndex,
      arcEventCounts: { ...state.arcEventCounts },
      usedEventIds: [...state.usedEventIds],
      history: state.history.map(item => ({
        ...item,
        flags_before: { ...item.flags_before },
        flags_after: { ...item.flags_after }
      }))
    };
  }

  function nextEvent() {
    while (state.arcIndex < state.arcs.length) {
      const arc = state.arcs[state.arcIndex];
      const count = state.arcEventCounts[arc.id] || 0;
      const limit = arc.events_per_run ?? 2;

      if (count >= limit) {
        state.arcIndex += 1;
        continue;
      }

      const eligible = eligibleAdaptedEvents(arc, state.flags, state.usedEventIds);
      if (eligible.length === 0) {
        state.arcIndex += 1;
        continue;
      }

      const seed = hashText(`${state.innateSeed}:${arc.id}:${count}:${JSON.stringify(state.flags)}`);
      const [event] = weightedSample(eligible, 1, seed);
      state.usedEventIds.add(event.id);
      state.arcEventCounts[arc.id] = count + 1;
      return event;
    }

    return null;
  }

  function applyAction(action) {
    const before = getFlags();
    state.flags = applyActionFlags(state.flags, action);
    state.history.push({
      action_id: action?.id ?? null,
      sets: action?.sets || {},
      flags_before: before,
      flags_after: getFlags()
    });
    return getFlags();
  }

  return {
    nextEvent,
    applyAction,
    getFlags,
    getState
  };
}

/**
 * 플레이어가 액션을 선택했을 때 플래그 상태를 업데이트.
 *
 * @param {object} currentFlags
 * @param {object} action - adaptEvent가 반환한 action (sets 포함)
 * @returns {object} 새 플래그 상태 (immutable — 원본 수정 안 함)
 */
function applyActionFlags(currentFlags, action) {
  if (!action?.sets || Object.keys(action.sets).length === 0) return currentFlags;
  return { ...currentFlags, ...action.sets };
}

/**
 * 플래그 기본값 반환.
 */
function defaultFlags() {
  return { ...FLAG_DEFAULTS };
}

const _StoryAdapter = {
  createRun,
  buildRunEvents,
  applyActionFlags,
  defaultFlags,
  // 테스트용 내부 함수
  _resolveString: resolveSummary,
  _weightedSample: weightedSample,
  _adaptEvent: adaptEvent,
  _eligibleAdaptedEvents: eligibleAdaptedEvents
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = _StoryAdapter;
} else {
  globalThis.StoryAdapter = _StoryAdapter;
}
