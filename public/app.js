const form = document.querySelector("#characterForm");
const submitBtn = document.querySelector("#submitBtn");
const resultList = document.querySelector("#resultList");
const emptyState = document.querySelector("#emptyState");
const latentBars = document.querySelector("#traitBars");
const datasetPreview = document.querySelector("#datasetPreview");
const adminModelPanel = document.querySelector("#adminModelPanel");
const characterCount = document.querySelector("#characterCount");
const logCount = document.querySelector("#logCount");
const activeCharacterBadge = document.querySelector("#activeCharacterBadge");
const modeTabs = document.querySelectorAll("[data-view-target]");
const canvas = document.querySelector("#networkCanvas");
const ctx = canvas.getContext("2d");

const STORAGE_KEY = "persona-collection-lab-v4";
const state = loadState();
const DEFAULT_PROMPT = "서울 외곽의 형편이 어려운 가정에서 자랐다. 아버지는 성적과 규율에 엄격했고 어머니는 형편이 더 어려운 이웃을 자주 도왔다. 어린 시절에는 가족에게 짐이 될까 불안해했으며, 지금은 안정적인 직장을 원하지만 부당한 일을 보면 외면하지 못한다.";
const DEFAULT_NAME_POOL = [
  "민준", "서연", "도윤", "하은", "지호", "수아", "현우", "유진", "준서", "서윤",
  "시우", "지아", "하준", "나윤", "도현", "예린", "은우", "채원", "건우", "다은",
  "우진", "소윤", "지훈", "예준", "유나", "서진", "하린", "태윤", "가온", "이안",
  "로운", "라온", "유준", "아린", "시온", "다온", "재윤", "서우", "연우", "해린",
  "주원", "지유", "은서", "현서", "윤재", "지민", "수빈", "예은", "민서", "하율",
  "태준", "나은", "서하", "도하", "유빈", "정우", "채윤", "다현", "현준", "지안"
];

const samples = [
  {
    prompt: DEFAULT_PROMPT
  },
  {
    prompt: "경제적으로 여유 있는 전문직 가정에서 자랐다. 부모는 사랑을 표현했지만 성취와 체면을 더 중요하게 여겼다. 어릴 때부터 코딩과 토론 교육을 받았고 실패하면 인정받지 못할까 두려워한다. 지금은 기술 창업으로 사회 문제를 해결하고 싶지만 성공에 대한 집착도 강하다."
  },
  {
    prompt: "지방 산업도시의 노동자 가정에서 자랐다. 공장 폐업으로 부모가 오랫동안 생계 불안을 겪었고, 어린 시절 부당하게 해고된 이웃들이 외면받는 모습을 보았다. 권위와 대기업을 쉽게 믿지 않으며, 지금은 노동 상담과 지역 활동을 통해 약자를 보호하려 한다."
  }
];

const OUTCOME_TAG_LABELS = {
  whistleblower: "고발",
  reformer: "개혁",
  martyr: "희생",
  conformist: "순응",
  opportunist: "기회주의",
  survivor: "생존",
  exile: "고립",
  caregiver: "보호",
  forgotten: "후퇴",
  changemaker: "변화"
};

const VECTOR_TAGS = [
  { index: 0, positive: "보호 본능", negative: "거리두기" },
  { index: 1, positive: "불안 반응", negative: "안정 추구" },
  { index: 2, positive: "구조 변화", negative: "규칙 회피" },
  { index: 3, positive: "관계 개입", negative: "감정 차단" },
  { index: 4, positive: "인정 욕구", negative: "체면 회피" },
  { index: 5, positive: "공적 책임", negative: "사적 생존" },
  { index: 6, positive: "의무/절차", negative: "권위 불신" },
  { index: 7, positive: "윤리 판단", negative: "위험 회피" }
];

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { characters: [], simulations: [], feedback: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { characters: [], simulations: [], feedback: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderDataset();
}

async function callDecide(type, payload) {
  try {
    const response = await fetch("/api/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload })
    });
    const data = await response.json();
    if (data.ok && data.result) return data.result;
  } catch {
    // 서버 없거나 실패 → null 반환, 호출부에서 엔진 fallback
  }
  return null;
}

async function syncToServer(type, data) {
  try {
    await fetch(`/api/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch {
    // 서버 없으면 무시 — localStorage에는 이미 저장됨
  }
}

function ensureNeuralModel(character) {
  const schema = PersonaEngine.getPersonaStructurePrior(character);
  if (!state.neural_model || state.neural_model.schema_id !== schema.schema_id) {
    state.neural_model = PersonaEngine.createTrainableModel(schema, character.id);
  }
  return state.neural_model;
}

function makeCharacterId(character) {
  const base = `${character.prompt}|${Date.now()}`;
  return `C${String(PersonaEngine.hashText(base)).slice(0, 6)}`;
}

function normalizeNameInput(raw) {
  return String(raw || "").trim();
}

function isValidCharacterName(name) {
  return /^[가-힣A-Za-z0-9]{2,10}$/.test(name);
}

function makeGeneratedName(prompt, id, requestedName = "") {
  const directName = normalizeNameInput(requestedName);
  if (directName && isValidCharacterName(directName)) return directName;
  const index = PersonaEngine.hashText(`${prompt}|${id}|name`) % DEFAULT_NAME_POOL.length;
  return DEFAULT_NAME_POOL[index];
}

const AVATAR_PALETTES = [
  { bg: "#dfeee8", skin: "#f0c6a4", hair: "#2f241f", cloth: "#2f6f5e", ring: "#6ba58f" },
  { bg: "#efe4d2", skin: "#d9a77f", hair: "#3b2b24", cloth: "#7b4f34", ring: "#bb8b2f" },
  { bg: "#e8e2f1", skin: "#e6b998", hair: "#1f2633", cloth: "#5d4c83", ring: "#8975b7" },
  { bg: "#f0e0df", skin: "#f2c9ad", hair: "#4b2d2a", cloth: "#9f3447", ring: "#c86f7a" },
  { bg: "#e5edf5", skin: "#c98f70", hair: "#191919", cloth: "#385d7a", ring: "#7398b7" },
  { bg: "#f4ead7", skin: "#f4d0b7", hair: "#6b442f", cloth: "#5f6f42", ring: "#9aaa65" }
];

function pickFrom(list, seed, salt) {
  return list[PersonaEngine.hashText(`${seed}:${salt}`) % list.length];
}

function renderAvatar(simulation, size = "large") {
  const character = simulation.character || {};
  const latent = simulation.latent_persona || simulation.infant_latent_persona || [];
  const identitySeed = `${character.id || "character"}|${character.generated_name || character.name || ""}|${character.innate_seed || ""}`;
  const palette = pickFrom(AVATAR_PALETTES, identitySeed, "palette");
  const avatarId = `${String(character.id || "avatar").replace(/[^A-Za-z0-9_-]/g, "")}-${size}`;
  const hairStyle = PersonaEngine.hashText(`${identitySeed}:hair`) % 4;
  const faceWidth = 23 + (PersonaEngine.hashText(`${identitySeed}:face-width`) % 8);
  const faceHeight = 29 + (PersonaEngine.hashText(`${identitySeed}:face-height`) % 7);
  const eyeGap = 8 + (PersonaEngine.hashText(`${identitySeed}:eye-gap`) % 5);
  const eyeY = 46 + (PersonaEngine.hashText(`${identitySeed}:eye-y`) % 4);
  const mouthMood = Math.max(-1, Math.min(1, (latent[0] || 0) - (latent[1] || 0) + (latent[5] || 0) * 0.4));
  const mouthCurve = Number((54 + mouthMood * 4).toFixed(2));
  const browTilt = Number((((latent[4] || 0) - (latent[6] || 0)) * 3).toFixed(2));
  const ringWidth = Number((2.5 + Math.min(4, Math.abs(latent[5] || 0) * 6)).toFixed(2));
  const patternOffset = PersonaEngine.hashText(`${identitySeed}:pattern`) % 24;
  const hairPaths = [
    `<path d="M29 42c1-19 14-27 31-24 15 3 24 14 20 31-8-9-18-13-30-13-9 0-15 2-21 6Z" fill="${palette.hair}"/>`,
    `<path d="M26 45c2-21 18-30 34-26 13 3 22 13 20 30-7-6-13-9-22-11-13-3-22 0-32 7Z" fill="${palette.hair}"/>`,
    `<path d="M31 38c5-17 19-24 34-18 11 4 17 15 15 29-8-10-18-15-30-15-8 0-14 1-19 4Z" fill="${palette.hair}"/>`,
    `<path d="M25 49c0-23 15-33 33-30 18 3 26 17 23 36-7-12-18-17-33-17-10 0-17 4-23 11Z" fill="${palette.hair}"/>`
  ];

  return `
    <div class="persona-avatar persona-avatar-${size}" aria-label="${character.generated_name || "캐릭터"} 아바타" role="img">
      <svg viewBox="0 0 100 118" focusable="false">
        <defs>
          <clipPath id="avatarClip-${avatarId}">
            <rect x="4" y="4" width="92" height="110" rx="22"></rect>
          </clipPath>
        </defs>
        <rect x="4" y="4" width="92" height="110" rx="22" fill="${palette.bg}"></rect>
        <g clip-path="url(#avatarClip-${avatarId})">
          <path d="M${12 + patternOffset} 10 L${-22 + patternOffset} 120" stroke="${palette.ring}" stroke-opacity="0.24" stroke-width="8"/>
          <path d="M${46 + patternOffset} 0 L${12 + patternOffset} 122" stroke="#fffaf1" stroke-opacity="0.32" stroke-width="5"/>
          <path d="M0 99 C22 86 78 86 100 99 L100 118 L0 118 Z" fill="${palette.cloth}"/>
          <path d="M38 78 C42 85 58 85 62 78 L65 103 L35 103 Z" fill="${palette.skin}"/>
          ${hairPaths[hairStyle]}
          <ellipse cx="50" cy="51" rx="${faceWidth}" ry="${faceHeight}" fill="${palette.skin}"/>
          <path d="M${50 - eyeGap - 5} ${eyeY - browTilt} L${50 - eyeGap + 5} ${eyeY - 1 + browTilt}" stroke="${palette.hair}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M${50 + eyeGap - 5} ${eyeY - 1 - browTilt} L${50 + eyeGap + 5} ${eyeY + browTilt}" stroke="${palette.hair}" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="${50 - eyeGap}" cy="${eyeY + 5}" r="2.3" fill="#221f1c"/>
          <circle cx="${50 + eyeGap}" cy="${eyeY + 5}" r="2.3" fill="#221f1c"/>
          <path d="M50 52 C47 58 48 62 53 63" fill="none" stroke="#7c5948" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M42 ${mouthCurve} C47 ${mouthCurve + 3} 54 ${mouthCurve + 3} 59 ${mouthCurve}" fill="none" stroke="#6e3f3d" stroke-width="2.1" stroke-linecap="round"/>
        </g>
        <rect x="4" y="4" width="92" height="110" rx="22" fill="none" stroke="${palette.ring}" stroke-width="${ringWidth}"/>
      </svg>
    </div>
  `;
}

function renderPrimaryResultLayout(simulation, developmentCards, dynamicRuns, ending) {
  return `
    <div class="result-section-title primary-section-title">
      <p class="eyebrow">Step 3 · Now Playing</p>
      <h3>먼저 이 카드만 읽고, 캐릭터의 선택을 맞혀보세요</h3>
    </div>
    ${renderPredictionPanel(simulation)}
    ${renderPersonaBrief(simulation)}
    ${renderRevealedEvents(simulation)}
    ${renderGameSummary(simulation)}
    <details class="analysis-drawer">
      <summary>
        <span>
          <b>성장 과정과 모델 근거 보기</b>
          <small>플레이에는 필수가 아니고, 캐릭터가 어떻게 만들어졌는지 확인하는 보조 정보입니다.</small>
        </span>
      </summary>
      <div class="drawer-content">
        <div class="result-section-title">
          <p class="eyebrow">Growth Phase</p>
          <h3>어릴 때부터 현재까지 누적된 성격 변화</h3>
        </div>
        ${developmentCards}
      </div>
    </details>
    ${simulation.gameplay.completed ? `
      <article class="result-card dynamic-control-card">
        <div>
          <div class="result-meta">
            <span>Dynamic</span>
            <span>Feedback Loop</span>
          </div>
          <strong>피드백 반영 후 다시 시뮬레이션</strong>
        </div>
        <p>피드백으로 바뀐 현재 잠재 구조를 사용해 같은 캐릭터의 후속 경로를 다시 실행합니다.</p>
        <button type="button" class="primary-action" data-rerun-character-id="${simulation.character_id}">현재 페르소나로 다시 실행</button>
      </article>
    ` : ""}
    ${dynamicRuns}
    ${renderEndingScreen(simulation, ending)}
  `;
}

function embeddingEndpoints() {
  const endpoints = [];
  if (location.protocol.startsWith("http")) {
    endpoints.push(`${location.origin}/api/embed`);
  }
  endpoints.push("http://localhost:8787/api/embed");
  return [...new Set(endpoints)];
}

async function fetchPromptEmbedding(prompt) {
  for (const endpoint of embeddingEndpoints()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const payload = await response.json();
      if (Array.isArray(payload.embedding) && payload.embedding.length > 0) {
        return payload;
      }
    } catch {
      clearTimeout(timeout);
    }
  }
  return null;
}

function getFormCharacter() {
  const requestedName = normalizeNameInput(document.querySelector("#nameInput")?.value);
  const character = {
    prompt: document.querySelector("#promptInput").value.trim(),
    requested_name: requestedName || null
  };
  character.id = makeCharacterId(character);
  character.innate_seed = `INNATE_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  character.generated_name = makeGeneratedName(character.prompt, character.id, requestedName);
  character.name = character.generated_name;
  character.birth_state = "infant";
  character.free_text_length = character.prompt.length;
  return character;
}

function seededPick(list, seed, salt) {
  return list[PersonaEngine.hashText(`${seed}:${salt}`) % list.length];
}

function createBirthPrologue(character, promptInterpretation = {}) {
  const seed = `${character.innate_seed || character.id || "birth"}|${character.prompt || ""}`;
  const prompt = String(character.prompt || "");
  const hasStrict = /엄격|규율|성적|기대|압박|통제/.test(prompt);
  const hasWarm = /따뜻|사랑|돌봄|다정|안정|믿/.test(prompt);
  const hasPoor = /가난|부족|빠듯|공장|일용|생계|빚/.test(prompt);
  const hasRich = /부유|넉넉|전문직|사교육|유학|강남/.test(prompt);

  const wealth = hasPoor
    ? { key: "scarce", label: "빠듯한 집", bias: [-0.08, 0.08, -0.02, -0.04, 0.04, -0.02, 0.03, -0.05] }
    : hasRich
      ? { key: "comfortable", label: "여유 있는 집", bias: [0.02, -0.02, 0.03, 0.01, 0.08, 0.02, 0.04, 0.02] }
      : seededPick([
        { key: "modest", label: "빠듯하지만 무너지지 않는 집", bias: [-0.02, 0.03, 0, 0.02, 0.02, 0.02, 0.04, 0] },
        { key: "middle", label: "평범한 중산층의 집", bias: [0.02, -0.02, 0.01, 0.03, 0.02, 0.02, 0.02, 0.02] },
        { key: "unstable", label: "수입이 자주 흔들리는 집", bias: [-0.05, 0.08, -0.01, -0.02, 0.04, -0.02, 0.03, -0.04] }
      ], seed, "wealth");

  const parentStyle = hasStrict
    ? { key: "achievement_pressure", label: "성취 압박형 부모", bias: [-0.03, 0.06, -0.05, -0.02, 0.1, 0.01, 0.08, -0.02] }
    : hasWarm
      ? { key: "warm_but_worried", label: "다정하지만 걱정이 많은 부모", bias: [0.08, -0.04, 0.01, 0.08, -0.01, 0.03, 0.02, 0.04] }
      : seededPick([
        { key: "quiet_distance", label: "말수가 적고 거리가 있는 부모", bias: [-0.02, 0.04, 0.02, -0.05, 0.02, -0.02, 0.02, -0.01] },
        { key: "face_saving", label: "체면을 중요하게 여기는 부모", bias: [-0.02, 0.04, -0.02, -0.02, 0.08, 0.01, 0.07, -0.01] },
        { key: "protective", label: "자주 감싸주지만 걱정이 많은 부모", bias: [0.07, 0.02, -0.01, 0.07, -0.02, 0.02, 0.02, 0.02] }
      ], seed, "parent");

  const homeMood = seededPick([
    { key: "quiet_tension", label: "조용하지만 긴장된 집", bias: [-0.02, 0.06, -0.01, -0.02, 0.03, -0.01, 0.04, -0.02] },
    { key: "busy_house", label: "늘 바쁘고 말이 끊기는 집", bias: [-0.03, 0.04, 0.02, -0.03, 0.02, -0.02, 0.02, -0.01] },
    { key: "warm_noise", label: "시끄럽지만 온기가 있는 집", bias: [0.06, -0.02, 0.01, 0.08, 0, 0.02, 0.01, 0.03] },
    { key: "polite_silence", label: "예의는 있지만 속마음을 숨기는 집", bias: [-0.01, 0.04, 0.01, -0.02, 0.05, 0.01, 0.05, 0] }
  ], seed, "home");

  const luck = seededPick([
    { key: "good_teacher", label: "좋은 담임을 만남", bias: [0.04, -0.03, 0.03, 0.05, 0.02, 0.04, 0.01, 0.05] },
    { key: "early_friend", label: "처음으로 편을 들어준 친구가 생김", bias: [0.06, -0.02, 0, 0.07, 0.01, 0.02, -0.01, 0.04] },
    { key: "small_prize", label: "작은 상을 받고 인정받음", bias: [0.02, -0.01, 0.02, 0.01, 0.08, 0.01, 0.02, 0.02] },
    { key: "quiet_talent", label: "혼자 잘하는 일을 발견함", bias: [0.01, -0.01, 0.04, 0, 0.06, 0.02, 0, 0.03] }
  ], seed, "luck");

  const misfortune = seededPick([
    { key: "frequent_move", label: "이사를 자주 다님", bias: [-0.03, 0.06, 0.02, -0.04, 0.02, -0.01, -0.02, -0.02] },
    { key: "parent_layoff", label: "집안 수입이 한 번 크게 흔들림", bias: [-0.04, 0.07, -0.01, -0.03, 0.03, -0.02, 0.04, -0.04] },
    { key: "lonely_class", label: "반에서 오래 겉돎", bias: [-0.04, 0.05, 0.02, -0.05, 0.03, -0.02, -0.03, -0.01] },
    { key: "unfair_blame", label: "억울한 일로 혼난 기억이 남음", bias: [-0.02, 0.05, 0.05, -0.02, 0.03, 0.02, -0.03, 0.04] }
  ], seed, "misfortune");

  const bias = wealth.bias.map((_, index) => Number((
    wealth.bias[index] + parentStyle.bias[index] + homeMood.bias[index] + luck.bias[index] + misfortune.bias[index]
  ).toFixed(4)));

  const name = character.generated_name || "이 아이";
  const topicName = `${name}${particle(name, "은", "는")}`;
  const subjectName = `${name}${particle(name, "이", "가")}`;
  const luckScene = {
    good_teacher: "어느 해에는 아이의 말을 끝까지 들어주는 담임을 만났다",
    early_friend: "처음으로 자기 편을 들어주는 친구가 생겼다",
    small_prize: "작은 상장을 받은 날, 어른들이 드물게 환하게 웃어주었다",
    quiet_talent: "혼자 몰두할 수 있는 재능 하나를 발견했다"
  }[luck.key] || luck.label;
  const misfortuneScene = {
    frequent_move: "몇 번의 이사 때문에 익숙해질 만하면 다시 낯선 곳에 놓였다",
    parent_layoff: "집안 수입이 한 번 크게 흔들리며 어른들의 한숨이 늘었다",
    lonely_class: "한동안 반에서 자연스럽게 섞이지 못하고 겉돌았다",
    unfair_blame: "하지 않은 일로 혼난 기억이 오래 남았다"
  }[misfortune.key] || misfortune.label;
  const fragments = promptInterpretation.prompt_fragments || [];
  const promptEcho = fragments[0] ? `입력된 페르소나에서 특히 "${fragments[0]}"라는 흔적이 이 배경과 맞물린다.` : "";
  const paragraphs = [
    `${topicName} ${wealth.label}에서 태어났다. 집에는 ${homeMood.label} 특유의 공기가 있었고, 어른들의 말투는 아이가 세상을 읽는 첫 문장이 되었다.`,
    `부모는 ${parentStyle.label}에 가까웠다. 그래서 ${topicName} 사랑받는 법보다 먼저, 어떤 표정을 지어야 안전한지와 언제 조용히 있어야 하는지를 배웠다.`,
    `하지만 시작 조건이 전부 불운했던 것은 아니다. ${luckScene}. 그 작은 장면은 오래 남아, 아이가 무너질 때마다 희미하게 돌아오는 손잡이가 된다.`,
    `반대로 ${misfortuneScene}. 이 일은 ${subjectName} 세상이 늘 공정하게 설명되지는 않는다는 감각을 갖게 했다. ${promptEcho}`
  ].filter(Boolean);

  return {
    title: `${name}의 프롤로그`,
    subtitle: "태어난 환경과 우연히 주어진 조건",
    variables: { wealth, parentStyle, homeMood, luck, misfortune },
    latent_bias: bias,
    paragraphs
  };
}

function applyBirthLatentBias(latent, prologue) {
  const bias = prologue?.latent_bias || [];
  return latent.map((value, index) => {
    const next = value + (bias[index] || 0);
    return Math.max(-1, Math.min(1, Number(next.toFixed(4))));
  });
}

function hasFinalConsonant(text) {
  const char = String(text || "").trim().at(-1);
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function particle(text, withFinal, withoutFinal) {
  return hasFinalConsonant(text) ? withFinal : withoutFinal;
}

async function runSimulation(character) {
  submitBtn.disabled = true;
  const originalSubmitText = submitBtn.textContent;

  try {
    // ── 임베딩 ──────────────────────────────────────────────────────────────
    submitBtn.textContent = "임베딩 모델 실행 중";
    const embeddingPayload = await fetchPromptEmbedding(character.prompt);
    if (embeddingPayload) {
      character.external_embedding = embeddingPayload.embedding;
      character.embedding_model = embeddingPayload.model;
      character.embedding_provider = embeddingPayload.provider;
      character.embedding_dimensions = embeddingPayload.dimensions;
    } else {
      character.embedding_model = "local-hash-fallback";
      character.embedding_provider = "browser deterministic fallback";
    }

    const neuralModel = ensureNeuralModel(character);

    // ── M2 결정 모드 시도 ────────────────────────────────────────────────────
    submitBtn.textContent = "M2 시뮬레이션 실행 중";
    const simulation = await runSimulationWithM2(character, neuralModel);

    simulation.baseline_events = simulation.events.map(event => ({ ...event }));
    character.latent_seed = simulation.infant_latent_persona;
    state.characters.push(character);
    state.simulations.push(simulation);
    saveState();
    syncToServer("characters", character);
    syncToServer("simulations", simulation);
    renderSimulation(simulation);
  } finally {
    submitBtn.textContent = originalSubmitText;
    submitBtn.disabled = false;
  }
}

async function runSimulationWithM2(character, neuralModel) {
  // M3 + M1: 잠재 공간 구조 및 초기 벡터 계산
  const { structurePrior, promptInterpretation, infantLatent } =
    PersonaEngine.buildSimulationContext(character, neuralModel);

  const birthPrologue = createBirthPrologue(character, promptInterpretation);
  let latent = applyBirthLatentBias([...infantLatent], birthPrologue);
  const developmentalLogs = [];
  const innateDevelopmentProfile = promptInterpretation.innate_development_profile;
  const developmentLabels = [
    `출생 배경: ${birthPrologue.variables.wealth.label}`,
    `부모 성향: ${birthPrologue.variables.parentStyle.label}`,
    `초기 행운: ${birthPrologue.variables.luck.label}`,
    `초기 불운: ${birthPrologue.variables.misfortune.label}`
  ]; // Growth 결과 레이블 (World 프롬프트용)

  // ── Growth Phase ────────────────────────────────────────────────────────────
  for (const event of PersonaEngine.DEVELOPMENT_EVENTS) {
    const { newLatent, logTemplate } = PersonaEngine.blendDevelopmentSignals(
      event, latent, character, structurePrior, innateDevelopmentProfile
    );
    latent = newLatent;

    developmentalLogs.push(logTemplate);
    developmentLabels.push(logTemplate.signal_mix?.slice(0, 3).map(signal => signal.label).join(" / ") || logTemplate.adaptation_label);
  }

  const latentEdges = PersonaEngine.inferLatentEdges(latent);
  const endingScores = {};

  // ── World Events ─────────────────────────────────────────────────────────────
  // 스토리 어댑터가 로드됐으면 아크 이벤트 사용, 아니면 엔진 기본 이벤트 사용
  const availableArcs = (typeof STORY_ARCS !== "undefined")
    ? STORY_ARCS
    : [
      typeof ARC0_ELEMENTARY !== "undefined" ? ARC0_ELEMENTARY : null,
      typeof ARC2_HIGHSCHOOL !== "undefined" ? ARC2_HIGHSCHOOL : null
    ].filter(Boolean);

  const useStoryArcs = typeof StoryAdapter !== "undefined" && availableArcs.length > 0;
  const storyRun = useStoryArcs
    ? StoryAdapter.createRun(availableArcs, { innateSeed: character.innate_seed })
    : null;
  const worldEvents = useStoryArcs ? null : PersonaEngine.EVENTS;

  const eventResults = [];
  let routeProbability = 1;
  while (true) {
    const event = useStoryArcs
      ? storyRun.nextEvent()
      : worldEvents[eventResults.length];
    if (!event) break;

    const step = PersonaEngine.buildWorldStep(event, latent);

    const m2 = await callDecide("world", {
      character_prompt: character.prompt,
      development_summary: developmentLabels,
      latent_vector: latent,
      event_title: step.event_title,
      event_summary: step.event_summary,
      actions: step.actions
    });

    const actionId = m2?.action_id ?? null;
    const { endingWeight, eventTemplate } = PersonaEngine.applyActionResult(
      actionId, latent, event, structurePrior
    );
    latent = eventTemplate.latent_after || latent;
    routeProbability *= eventTemplate.action_probability || 1;

    // 스토리 플래그 업데이트 (어댑터 이벤트에만 해당)
    if (useStoryArcs) {
      const chosenAction = event.actions?.find(a => a.id === eventTemplate.action);
      storyRun.applyAction(chosenAction);
    }

    Object.entries(endingWeight).forEach(([key, w]) => {
      endingScores[key] = (endingScores[key] || 0) + w;
    });

    eventResults.push({
      ...eventTemplate,
      source_actions: event.actions || [],
      source_tags: event.tags || [],
      route_probability: Number(routeProbability.toPrecision(6)),
      route_rarity: routeRarity(routeProbability),
      outcome: m2?.outcome ?? event.actions.find(a => a.id === eventTemplate.action)?.outcome ?? "",
      rationale: m2?.rationale ?? `"${eventTemplate.action_label}" 선택.`,
      prompt_evidence: "",
      latent_contributors: []
    });
  }

  if (eventResults.length > 0) {
    eventResults[eventResults.length - 1].ending_flag = true;
  }
  const endingKey = Object.entries(endingScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "survivor";
  const ending = { ...PersonaEngine.ENDINGS[endingKey] };
  const personaCard = PersonaEngine.summarizePersona(character, {
    prompt_interpretation: promptInterpretation,
    developmental_logs: developmentalLogs,
    latent_persona: latent
  });

  return {
    character_id: character.id,
    character,
    model_pipeline: {
      structure_model: PersonaEngine.MODEL_REGISTRY.persona_structure_model,
      prompt_to_persona_model: PersonaEngine.MODEL_REGISTRY.prompt_to_persona_model,
      persona_to_prompt_model: PersonaEngine.MODEL_REGISTRY.persona_to_prompt_model
    },
    persona_structure_prior: structurePrior,
    prompt_interpretation: promptInterpretation,
    infant_latent_persona: infantLatent,
    birth_prologue: birthPrologue,
    developmental_logs: developmentalLogs,
    persona_card: personaCard,
    latent_persona: latent,
    latent_edges: latentEdges,
    events: eventResults,
    ending,
    story_flags: useStoryArcs ? storyRun.getFlags() : {},
    feedback_updates: []
  };
}

function renderSimulation(simulation) {
  emptyState.style.display = "none";
  ensureGameplayState(simulation);
  activeCharacterBadge.textContent = simulation.character.generated_name;
  renderLatentBars(simulation.latent_persona, simulation.persona_structure_prior.latent_dimensions);
  drawNetwork(simulation.latent_persona, simulation.latent_edges, simulation.persona_structure_prior.latent_dimensions);

  const developmentCards = simulation.developmental_logs.map(log => `
    <article class="result-card development-card">
      <div class="card-title-row">
        <div class="result-meta">
          <span>${log.event_id}</span>
          <span>${log.phase}</span>
        </div>
        <strong>${log.event_title}</strong>
      </div>
      <div class="growth-flow">
        <section>
          <span class="flow-label">부모·환경 입력</span>
          <p>${log.event_summary}</p>
        </section>
        <section>
          <span class="flow-label">선택된 성장 변화</span>
          <p><b>${log.adaptation_label}</b></p>
          ${renderSignalMix(log)}
          <p>${log.summary}</p>
        </section>
        <section>
          <span class="flow-label">프롬프트에서 잡은 부분</span>
          <blockquote>${log.prompt_evidence}</blockquote>
        </section>
        <section>
          <span class="flow-label">상호작용 판단</span>
          <p>${log.rationale}</p>
        </section>
      </div>
    </article>
  `).join("");

  const modelCard = `
    <article class="result-card model-card">
      <div>
        <div class="result-meta">
          <span>M3</span>
          <span>M1</span>
          <span>M2</span>
        </div>
        <strong>모델 파이프라인</strong>
      </div>
      <p><b>프롬프트 임베딩:</b> ${simulation.character.embedding_model || "local-hash-fallback"} (${simulation.character.embedding_dimensions || simulation.persona_structure_prior.latent_dimension}차원 입력)</p>
      <p><b>M3:</b> ${simulation.model_pipeline.structure_model.role}</p>
      <p><b>생성 schema:</b> ${simulation.persona_structure_prior.schema_id}, ${simulation.persona_structure_prior.latent_dimension}차원</p>
      <p><b>딥러닝 모델:</b> ${state.neural_model?.id || "없음"} / steps ${state.neural_model?.trained_steps || 0} / loss ${state.neural_model?.last_loss ?? "미학습"}</p>
      <p><b>M1:</b> ${simulation.model_pipeline.prompt_to_persona_model.role}</p>
      <p><b>M2:</b> ${simulation.model_pipeline.persona_to_prompt_model.role}</p>
      <p><b>M1 근거 조각:</b> ${simulation.prompt_interpretation.prompt_fragments.map(fragment => `"${fragment}"`).join(", ")}</p>
      <button type="button" data-train-model-for="${simulation.character_id}">피드백 로그로 모델 학습</button>
    </article>
  `;

  const ending = simulation.ending;
  const dynamicRuns = simulation.dynamic_runs?.map(run => renderDynamicRun(simulation, run)).join("") || "";
  if (adminModelPanel) {
    adminModelPanel.innerHTML = modelCard;
  }

  resultList.innerHTML = `
    ${renderPersonaBrief(simulation)}
    <div class="result-section-title">
      <p class="eyebrow">Growth Phase</p>
      <h3>아기에서 성인 직전까지의 성격 변화</h3>
    </div>
    ${developmentCards}
    <div class="result-section-title">
      <p class="eyebrow">Prediction Campaign</p>
      <h3>연속 사건에서 캐릭터의 선택을 예측하세요</h3>
    </div>
    ${renderPredictionPanel(simulation)}
    ${renderRevealedEvents(simulation)}
    ${renderGameSummary(simulation)}
    ${simulation.gameplay.completed ? `
      <article class="result-card dynamic-control-card">
        <div>
          <div class="result-meta">
            <span>Dynamic</span>
            <span>Feedback Loop</span>
          </div>
          <strong>학습 반영 후 재시뮬레이션</strong>
        </div>
        <p>피드백으로 바뀐 현재 잠재 구조를 사용해 성장 이후의 성인기 사건만 다시 실행합니다. 이전 행동과 달라진 지점이 비교 로그로 남습니다.</p>
        <button type="button" class="primary-action" data-rerun-character-id="${simulation.character_id}">현재 페르소나로 다시 실행</button>
      </article>
    ` : ""}
    ${dynamicRuns}
    ${renderEndingScreen(simulation, ending)}
  `;
  resultList.innerHTML = renderPrimaryResultLayout(simulation, developmentCards, dynamicRuns, ending);
}

function renderSignalMix(log) {
  if (!Array.isArray(log.signal_mix) || log.signal_mix.length === 0) return "";
  return `
    <div class="signal-mix">
      ${log.signal_mix.slice(0, 3).map(signal => `
        <span>${signal.label} ${Math.round(signal.weight * 100)}%</span>
      `).join("")}
    </div>
  `;
}

function renderPersonaBrief(simulation) {
  const card = simulation.persona_card;
  if (!card) return "";
  const list = items => (items || []).map(item => `<li>${item}</li>`).join("");
  const growth = (card.growth_summary || []).map(item => `
    <li>
      <span>${item.event_id}</span>
      <b>${item.adaptation_label}</b>
    </li>
  `).join("");
  return `
    <article class="persona-brief-card">
      <div class="persona-brief-head">
        <div class="persona-brief-identity">
          ${renderAvatar(simulation)}
          <div>
            <p class="eyebrow">페르소나 카드</p>
            <h3>${card.title}</h3>
          </div>
        </div>
        <p>${card.one_line}</p>
      </div>
      <div class="brief-grid">
        <section>
          <span class="flow-label">핵심 성향</span>
          <ul>${list(card.core_traits)}</ul>
        </section>
        <section>
          <span class="flow-label">욕망</span>
          <ul>${list(card.desires)}</ul>
        </section>
        <section>
          <span class="flow-label">두려움</span>
          <ul>${list(card.fears)}</ul>
        </section>
        <section>
          <span class="flow-label">예측 힌트</span>
          <ul>${list(card.prediction_hints)}</ul>
        </section>
      </div>
      <div class="brief-footer">
        <div>
          <span class="flow-label">위험 신호</span>
          <ul>${list(card.risk_signals)}</ul>
        </div>
        <div>
          <span class="flow-label">성장 마커</span>
          <ul class="growth-marker-list">${growth}</ul>
        </div>
      </div>
    </article>
  `;
}

function ensureGameplayState(simulation) {
  const existing = simulation.gameplay || {};
  const predictions = Array.isArray(existing.predictions) ? existing.predictions : [];
  const currentIndex = Math.min(Number(existing.currentIndex || 0), simulation.events.length);
  simulation.gameplay = {
    currentIndex,
    predictions,
    prologue_seen: Boolean(existing.prologue_seen),
    score: predictions.reduce((sum, item) => sum + (item.points || 0), 0),
    streak: computeCurrentStreak(predictions),
    completed: currentIndex >= simulation.events.length
  };
}

function computeCurrentStreak(predictions) {
  let streak = 0;
  for (let index = predictions.length - 1; index >= 0; index -= 1) {
    if (!predictions[index].correct) break;
    streak += 1;
  }
  return streak;
}

function sourceEventFor(simulation, eventId) {
  const eventLog = simulation?.events?.find(event => event.event_id === eventId);
  if (eventLog?.source_actions?.length) {
    return {
      id: eventLog.event_id,
      title: eventLog.event_title,
      summary: eventLog.event_summary,
      actions: eventLog.source_actions
    };
  }
  return PersonaEngine.EVENTS.find(event => event.id === eventId);
}

function predictionFor(simulation, eventId) {
  return simulation.gameplay.predictions.find(item => item.event_id === eventId);
}

function routeRarity(probability) {
  if (probability <= 0.00001) return "mythic";
  if (probability <= 0.0001) return "legendary";
  if (probability <= 0.001) return "rare";
  if (probability <= 0.01) return "uncommon";
  return "common";
}

function rarityLabel(rarity) {
  return {
    common: "흔한 루트",
    uncommon: "드문 루트",
    rare: "희귀 루트",
    legendary: "전설 루트",
    mythic: "신화 루트"
  }[rarity] || "루트";
}

function actionReading(action, simulation, currentEvent = null) {
  const latent = simulation.latent_persona || [];
  const embedding = action.embedding || [];
  const probability = currentEvent?.action_distribution?.find(item => item.id === action.id)?.probability ?? null;
  const alignment = embedding.reduce((sum, value, index) => sum + value * (latent[index] || 0), 0) / Math.max(1, embedding.length);
  const outcomeTags = Object.entries(action.endingWeight || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => OUTCOME_TAG_LABELS[key] || key);
  const vectorTags = embedding
    .map((value, index) => ({
      label: value >= 0 ? VECTOR_TAGS[index]?.positive : VECTOR_TAGS[index]?.negative,
      strength: Math.abs(value * (latent[index] || 0))
    }))
    .filter(item => item.label)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map(item => item.label);
  const tags = [...new Set([...outcomeTags, ...vectorTags])].slice(0, 4);
  const fitLabel = alignment >= 0.1
    ? "현재 페르소나와 잘 맞는 선택"
    : alignment <= -0.1
      ? "현재 페르소나와 충돌하는 선택"
      : "상황에 따라 흔들릴 수 있는 선택";
  const hint = simulation.persona_card?.prediction_hints?.[0] || "성장 과정에서 반복된 압박을 기준으로 비교해 보세요.";
  return {
    tags,
    fitLabel,
    probability,
    hint: `${fitLabel}. ${hint}`
  };
}

function renderPredictionPanel(simulation) {
  const total = simulation.events.length;
  const gameplay = simulation.gameplay;
  const current = simulation.events[gameplay.currentIndex];
  if (!current) {
    return `
      <article class="prediction-card completed">
        <div>
          <p class="eyebrow">Campaign Complete</p>
          <h3>모든 사건을 통과했습니다</h3>
        </div>
        <p>${simulation.character.generated_name}의 선택을 ${gameplay.predictions.filter(item => item.correct).length}/${total}개 맞혔습니다.</p>
      </article>
    `;
  }

  const sourceEvent = sourceEventFor(simulation, current.event_id);
  const prediction = predictionFor(simulation, current.event_id);
  const progress = Math.round((gameplay.currentIndex / total) * 100);
  const visibleActionIds = Array.isArray(current.visible_action_ids) && current.visible_action_ids.length > 0
    ? current.visible_action_ids
    : (sourceEvent?.actions || []).map(action => action.id);
  const choices = (sourceEvent?.actions || [])
    .filter(action => visibleActionIds.includes(action.id))
    .map(action => {
    const selected = prediction?.guessed_action === action.id;
    const actual = current.action === action.id;
    const reading = actionReading(action, simulation, current);
    const revealedClass = prediction
      ? actual ? "actual" : selected ? "missed" : ""
      : "";
    return `
      <button
        type="button"
        class="choice-button ${selected ? "selected" : ""} ${revealedClass}"
        data-predict-character-id="${simulation.character_id}"
        data-event-id="${current.event_id}"
        data-action-id="${action.id}"
        ${prediction ? "disabled" : ""}
      >
        <b>${action.label}</b>
        <div class="choice-tags">
          ${reading.tags.map(tag => `<span>${tag}</span>`).join("")}
        </div>
        <small>${reading.hint}</small>
        <span>${action.outcome}</span>
      </button>
    `;
  }).join("");

  return `
    <article class="prediction-card" data-current-event="${current.event_id}">
      <div class="prediction-scoreboard">
        <div>
          <p class="eyebrow">${current.chapter || "World Event"}</p>
          <h3>${current.event_id}. ${current.event_title}</h3>
        </div>
        <div class="score-pills">
          <span>점수 ${gameplay.score}</span>
          <span>연속 ${gameplay.streak}</span>
          <span>${gameplay.currentIndex + 1}/${total}</span>
        </div>
      </div>
      <div class="progress-track" aria-label="사건 진행도">
        <div style="width:${progress}%"></div>
      </div>
      <p class="event-summary">${current.event_summary}</p>
      <div class="choice-grid">
        ${choices}
      </div>
      ${prediction ? `
        <div class="prediction-reveal ${prediction.correct ? "correct" : "wrong"}">
          <strong>${prediction.correct ? "예측 성공" : "예측 실패"}</strong>
          <p>실제 선택: <b>${current.action_label}</b></p>
          <p class="route-probability">이번에 열린 경로: ${rarityLabel(current.route_rarity)}</p>
          <p>${current.outcome}</p>
          <blockquote>${current.rationale}</blockquote>
          <button type="button" class="primary-action" data-next-event-for="${simulation.character_id}">
            ${gameplay.currentIndex + 1 >= total ? "최종 엔딩 보기" : "다음 사건으로"}
          </button>
        </div>
      ` : `
        <p class="prediction-hint">캐릭터가 어떤 선택을 할지 먼저 맞혀보세요. 정답은 잠재 페르소나와 사건 임베딩으로 결정됩니다.</p>
      `}
    </article>
  `;
}

function renderRevealedEvents(simulation) {
  const revealed = simulation.events.slice(0, simulation.gameplay.currentIndex);
  if (revealed.length === 0) return "";
  return revealed.map(event => {
    const prediction = predictionFor(simulation, event.event_id);
    return `
      <article class="result-card revealed-event-card" data-event-id="${event.event_id}">
        <div class="card-title-row">
          <div class="result-meta">
            <span>${event.chapter || "World Event"}</span>
            <span>${event.event_id}</span>
            <span>${prediction?.correct ? "예측 성공" : "예측 실패"}</span>
          </div>
          <strong>${event.event_title}</strong>
        </div>
        <div class="event-flow">
          <section>
            <span class="flow-label">사건 압력</span>
            <p>${event.event_summary}</p>
          </section>
          <section>
            <span class="flow-label">페르소나 반응</span>
            <p><b>${event.action_label}</b></p>
            <p class="route-probability">이번에 열린 경로: ${rarityLabel(event.route_rarity)}</p>
            <p>${event.outcome}</p>
          </section>
          <section>
            <span class="flow-label">프롬프트 근거</span>
            <blockquote>${event.prompt_evidence}</blockquote>
          </section>
        </div>
        <div class="feedback-row">
          <button type="button" data-feedback="consistent" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">완전 캐릭터다</button>
          <button type="button" data-feedback="ambiguous" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">조금 애매함</button>
          <button type="button" data-feedback="wrong" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">전혀 아님</button>
        </div>
      </article>
    `;
  }).reverse().join("");
}

function renderGameSummary(simulation) {
  if (!simulation.gameplay.completed) return "";
  const total = simulation.events.length;
  const correct = simulation.gameplay.predictions.filter(item => item.correct).length;
  const accuracy = Math.round((correct / Math.max(1, total)) * 100);
  const finalRoute = simulation.events.at(-1);
  const rows = simulation.gameplay.predictions.map(item => {
    const event = simulation.events.find(candidate => candidate.event_id === item.event_id);
    const guessed = sourceEventFor(simulation, item.event_id)?.actions.find(action => action.id === item.guessed_action);
    return `
      <div class="score-row ${item.correct ? "correct" : "wrong"}">
        <span>${item.event_id}</span>
        <p>${event?.event_title || item.event_id}: ${guessed?.label || "-"} → ${event?.action_label || "-"}</p>
        <b>${item.points}점</b>
      </div>
    `;
  }).join("");
  return `
    <article class="result-card score-summary-card">
      <div class="prediction-scoreboard">
        <div>
          <p class="eyebrow">Insight Score</p>
          <strong>캐릭터 이해도 ${accuracy}%</strong>
        </div>
        <div class="score-pills">
          <span>${correct}/${total} 적중</span>
          <span>${simulation.gameplay.score}점</span>
          <span>${rarityLabel(finalRoute?.route_rarity)}</span>
        </div>
      </div>
      ${rows}
    </article>
  `;
}

function renderPredictionPanelClean(simulation) {
  const total = simulation.events.length;
  const gameplay = simulation.gameplay;
  const current = simulation.events[gameplay.currentIndex];
  if (!current) {
    return `
      <article class="prediction-card completed">
        <div>
          <p class="eyebrow">Campaign Complete</p>
          <h3>모든 사건을 통과했습니다</h3>
        </div>
        <p>${simulation.character.generated_name}의 선택을 ${gameplay.predictions.filter(item => item.correct).length}/${total}개 맞혔습니다.</p>
      </article>
    `;
  }

  const sourceEvent = sourceEventFor(simulation, current.event_id);
  const prediction = predictionFor(simulation, current.event_id);
  const progress = Math.round((gameplay.currentIndex / Math.max(1, total)) * 100);
  const visibleActionIds = Array.isArray(current.visible_action_ids) && current.visible_action_ids.length > 0
    ? current.visible_action_ids
    : (sourceEvent?.actions || []).map(action => action.id);
  const choices = (sourceEvent?.actions || [])
    .filter(action => visibleActionIds.includes(action.id))
    .map(action => {
      const selected = prediction?.guessed_action === action.id;
      const actual = current.action === action.id;
      const reading = actionReading(action, simulation, current);
      const revealedClass = prediction
        ? actual ? "actual" : selected ? "missed" : ""
        : "";
      return `
        <button
          type="button"
          class="choice-button ${selected ? "selected" : ""} ${revealedClass}"
          data-predict-character-id="${simulation.character_id}"
          data-event-id="${current.event_id}"
          data-action-id="${action.id}"
          ${prediction ? "disabled" : ""}
        >
          <b>${action.label}</b>
          <div class="choice-tags">
            ${reading.tags.map(tag => `<span>${tag}</span>`).join("")}
          </div>
          <small>${reading.hint}</small>
          <span>${action.outcome}</span>
        </button>
      `;
    }).join("");

  return `
    <article class="prediction-card" data-current-event="${current.event_id}">
      <div class="prediction-scoreboard">
        <div>
          <p class="eyebrow">${current.chapter || "World Event"}</p>
          <h3>${current.event_id}. ${current.event_title}</h3>
        </div>
        <div class="score-pills">
          <span>점수 ${gameplay.score}</span>
          <span>연속 ${gameplay.streak}</span>
          <span>${gameplay.currentIndex + 1}/${total}</span>
        </div>
      </div>
      <div class="progress-track" aria-label="사건 진행도">
        <div style="width:${progress}%"></div>
      </div>
      <p class="event-summary">${current.event_summary}</p>
      <div class="choice-grid">
        ${choices}
      </div>
      ${prediction ? `
        <div class="prediction-reveal ${prediction.correct ? "correct" : "wrong"}">
          <strong>${prediction.correct ? "예측 성공" : "예측 실패"}</strong>
          <p>실제 선택: <b>${current.action_label}</b></p>
          <p class="route-probability">이번에 열린 경로: ${rarityLabel(current.route_rarity)}</p>
          <p>${current.outcome}</p>
          <blockquote>${current.rationale}</blockquote>
          <button type="button" class="primary-action" data-next-event-for="${simulation.character_id}">
            ${gameplay.currentIndex + 1 >= total ? "최종 엔딩 보기" : "다음 사건으로"}
          </button>
        </div>
      ` : `
        <p class="prediction-hint">선택지는 정답이 아니라 예측입니다. “내가 고르고 싶은 것”보다 “이 캐릭터라면 고를 것”을 눌러보세요.</p>
      `}
    </article>
  `;
}

function renderRevealedEventsClean(simulation) {
  const revealed = simulation.events.slice(0, simulation.gameplay.currentIndex);
  if (revealed.length === 0) return "";
  return revealed.map(event => {
    const prediction = predictionFor(simulation, event.event_id);
    return `
      <article class="result-card revealed-event-card" data-event-id="${event.event_id}">
        <div class="card-title-row">
          <div class="result-meta">
            <span>${event.chapter || "World Event"}</span>
            <span>${event.event_id}</span>
            <span>${prediction?.correct ? "예측 성공" : "예측 실패"}</span>
          </div>
          <strong>${event.event_title}</strong>
        </div>
        <div class="event-flow">
          <section>
            <span class="flow-label">사건</span>
            <p>${event.event_summary}</p>
          </section>
          <section>
            <span class="flow-label">캐릭터 반응</span>
            <p><b>${event.action_label}</b></p>
            <p class="route-probability">이번에 열린 경로: ${rarityLabel(event.route_rarity)}</p>
            <p>${event.outcome}</p>
          </section>
          <section>
            <span class="flow-label">근거</span>
            <blockquote>${event.prompt_evidence}</blockquote>
          </section>
        </div>
        <div class="feedback-row">
          <button type="button" data-feedback="consistent" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">완전 캐릭터답다</button>
          <button type="button" data-feedback="ambiguous" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">조금 애매함</button>
          <button type="button" data-feedback="wrong" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">전혀 아님</button>
        </div>
      </article>
    `;
  }).reverse().join("");
}

function renderGameSummaryClean(simulation) {
  if (!simulation.gameplay.completed) return "";
  const total = simulation.events.length;
  const correct = simulation.gameplay.predictions.filter(item => item.correct).length;
  const accuracy = Math.round((correct / Math.max(1, total)) * 100);
  const finalRoute = simulation.events.at(-1);
  const rows = simulation.gameplay.predictions.map(item => {
    const event = simulation.events.find(candidate => candidate.event_id === item.event_id);
    const guessed = sourceEventFor(simulation, item.event_id)?.actions.find(action => action.id === item.guessed_action);
    return `
      <div class="score-row ${item.correct ? "correct" : "wrong"}">
        <span>${item.event_id}</span>
        <p>${event?.event_title || item.event_id}: ${guessed?.label || "-"} → ${event?.action_label || "-"}</p>
        <b>${item.points}점</b>
      </div>
    `;
  }).join("");
  return `
    <article class="result-card score-summary-card">
      <div class="prediction-scoreboard">
        <div>
          <p class="eyebrow">Insight Score</p>
          <strong>캐릭터 이해도 ${accuracy}%</strong>
        </div>
        <div class="score-pills">
          <span>${correct}/${total} 적중</span>
          <span>${simulation.gameplay.score}점</span>
          <span>${rarityLabel(finalRoute?.route_rarity)}</span>
        </div>
      </div>
      ${rows}
    </article>
  `;
}

renderPredictionPanel = renderPredictionPanelClean;
renderRevealedEvents = renderRevealedEventsClean;
renderGameSummary = renderGameSummaryClean;
rarityLabel = function cleanRarityLabel(rarity) {
  return {
    common: "흔한 루트",
    uncommon: "드문 루트",
    rare: "희귀 루트",
    legendary: "전설 루트",
    mythic: "신화 루트"
  }[rarity] || "루트";
};
actionReading = function cleanActionReading(action, simulation, currentEvent = null) {
  const latent = simulation.latent_persona || [];
  const embedding = action.embedding || [];
  const alignment = embedding.reduce((sum, value, index) => sum + value * (latent[index] || 0), 0) / Math.max(1, embedding.length);
  const probability = currentEvent?.action_distribution?.find(item => item.id === action.id)?.probability ?? null;
  const fitLabel = alignment >= 0.1
    ? "현재 성향과 잘 맞는 선택"
    : alignment <= -0.1
      ? "현재 성향과 충돌하는 선택"
      : "상황에 따라 흔들릴 수 있는 선택";
  const tags = [
    probability == null ? null : `예상 ${Math.round(probability * 100)}%`,
    alignment >= 0.1 ? "성향 일치" : alignment <= -0.1 ? "성향 충돌" : "중립"
  ].filter(Boolean);
  return {
    tags,
    fitLabel,
    probability,
    hint: fitLabel
  };
};

function renderBirthProloguePanel(simulation) {
  const prologue = simulation.birth_prologue;
  if (!prologue) return "";
  const variableChips = [
    prologue.variables.wealth.label,
    prologue.variables.parentStyle.label,
    prologue.variables.homeMood.label,
    prologue.variables.luck.label,
    prologue.variables.misfortune.label
  ];
  return `
    <article class="prologue-card">
      <div class="prologue-head">
        <div>
          <p class="eyebrow">Prologue · 이번 생의 시작 조건</p>
          <h3>${prologue.title}</h3>
          <p>${prologue.subtitle}</p>
        </div>
        ${renderAvatar(simulation, "small")}
      </div>
      <div class="prologue-story">
        ${prologue.paragraphs.map(text => `<p>${text}</p>`).join("")}
      </div>
      <div class="prologue-chips">
        ${variableChips.map(label => `<span>${label}</span>`).join("")}
      </div>
      <button type="button" class="primary-action" data-start-events-for="${simulation.character_id}">
        프롤로그를 넘기고 첫 사건 보기
      </button>
    </article>
  `;
}

function renderCharacterDrawer(simulation) {
  return `
    <details class="character-drawer">
      <summary>
        <span>
          <b>캐릭터창</b>
          <small>현재 페르소나 요약과 예측 힌트를 보고 싶을 때만 열어보세요.</small>
        </span>
      </summary>
      <div class="drawer-content">
        ${renderPersonaBrief(simulation)}
      </div>
    </details>
  `;
}

renderPrimaryResultLayout = function prologueFirstResultLayout(simulation, developmentCards, dynamicRuns, ending) {
  const showPrologue = simulation.birth_prologue && !simulation.gameplay.prologue_seen;
  return `
    ${showPrologue ? `
      <div class="result-section-title primary-section-title">
        <p class="eyebrow">Step 2 · Prologue</p>
        <h3>먼저 이 사람이 어떤 시작 조건을 타고났는지 읽어보세요</h3>
      </div>
      ${renderBirthProloguePanel(simulation)}
    ` : `
      <div class="result-section-title primary-section-title">
        <p class="eyebrow">Step 3 · 현재 사건</p>
        <h3>이제 이 캐릭터가 다음 장면에서 어떤 선택을 할지 예측하세요</h3>
        <p class="section-help">현재 사건은 캐릭터가 살아가며 마주치는 장면입니다. 선택지는 플레이어의 선택이 아니라, “이 사람이라면 무엇을 할까?”를 맞히는 예측입니다.</p>
      </div>
      ${renderPredictionPanel(simulation)}
    `}
    ${renderCharacterDrawer(simulation)}
    ${!showPrologue ? renderRevealedEvents(simulation) : ""}
    ${!showPrologue ? renderGameSummary(simulation) : ""}
    ${simulation.gameplay.completed ? `
      <article class="result-card dynamic-control-card">
        <div>
          <div class="result-meta">
            <span>Dynamic</span>
            <span>Feedback Loop</span>
          </div>
          <strong>피드백 반영 후 다시 시뮬레이션</strong>
        </div>
        <p>피드백으로 바뀐 현재 잠재 구조를 사용해 같은 캐릭터의 후속 경로를 다시 실행합니다.</p>
        <button type="button" class="primary-action" data-rerun-character-id="${simulation.character_id}">현재 페르소나로 다시 실행</button>
      </article>
    ` : ""}
    ${dynamicRuns}
    ${renderEndingScreen(simulation, ending)}
  `;
};

function collectMemories(simulation) {
  return simulation.events.flatMap(event => {
    const sourceEvent = PersonaEngine.EVENTS.find(e => e.id === event.event_id);
    if (!sourceEvent) return [];
    const sourceAction = sourceEvent.actions.find(a => a.id === event.action);
    if (!sourceAction?.memory) return [];
    return [{ eventId: event.event_id, title: event.event_title, memory: sourceAction.memory }];
  });
}

function renderEndingScreen(simulation, ending) {
  if (!simulation.gameplay.completed) return "";
  const memories = collectMemories(simulation);
  const impactLabel = { low: "소", medium: "중", high: "대", very_high: "매우 큼" }[ending.world_impact] ?? ending.world_impact;
  const memoryCards = memories.map(m => `
    <div class="memory-card">
      <span class="memory-event-id">${m.title}</span>
      <p>${m.memory}</p>
    </div>
  `).join("");
  return `
    <div class="ending-screen">
      <div class="ending-memories-section">
        ${memories.length > 0 ? `
          <p class="eyebrow">이 삶의 기억들</p>
          <div class="memory-cards">${memoryCards}</div>
        ` : ""}
      </div>
      <article class="ending-card">
        <div class="ending-copy">
          ${renderAvatar(simulation, "small")}
          <div>
            <p class="eyebrow">Ending · ${ending.id}</p>
            <h2>${simulation.character.generated_name}</h2>
            <h3 class="ending-title-scene">${ending.title}</h3>
            <p class="ending-scene">${ending.scene}</p>
            <p class="ending-meta">${ending.survived ? "생존" : "사망"} · 사회적 파장 ${impactLabel}</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function renderDynamicRun(simulation, run) {
  const originalById = Object.fromEntries(simulation.baseline_events.map(event => [event.event_id, event]));
  const changeRows = run.events.map(event => {
    const original = originalById[event.event_id];
    const changed = original?.action !== event.action;
    return `
      <div class="change-row ${changed ? "changed" : ""}">
        <span>${event.event_id}</span>
        <p><b>${original?.action_label || "-"}</b> → <b>${event.action_label}</b></p>
        <small>${changed ? "변화 발생" : "유지"}</small>
      </div>
    `;
  }).join("");
  return `
    <article class="result-card dynamic-run-card">
      <div>
        <div class="result-meta">
          <span>${run.run_label}</span>
          <span>${run.ending.title}</span>
        </div>
        <strong>재시뮬레이션 비교</strong>
      </div>
      ${changeRows}
    </article>
  `;
}

function renderLatentBars(vector = [], dimensions = PersonaEngine.LATENT_DIMS) {
  latentBars.innerHTML = dimensions.map((dim, index) => {
    const value = vector[index] ?? 0;
    const percentage = Math.round(((value + 1) / 2) * 100);
    return `
      <div class="trait-row">
        <span>${dim.label}</span>
        <div class="bar-track latent-track">
          <div class="zero-line"></div>
          <div class="bar-fill latent-fill" style="left:${value < 0 ? percentage : 50}%;width:${Math.abs(percentage - 50)}%"></div>
        </div>
        <b>${value.toFixed(2)}</b>
      </div>
    `;
  }).join("");
}

function drawNetwork(vector = Array(PersonaEngine.LATENT_DIMS.length).fill(0), edges = [], dimensions = PersonaEngine.LATENT_DIMS) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#292521";
  ctx.fillRect(0, 0, width, height);

  const nodes = dimensions.map((dim, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    return {
      key: dim.key,
      label: dim.label,
      x: width / 2 + Math.cos(angle) * 150,
      y: height / 2 + Math.sin(angle) * 88,
      value: vector[index] ?? 0
    };
  });
  const byKey = Object.fromEntries(nodes.map(node => [node.key, node]));

  edges.forEach(edge => {
    const source = byKey[edge.source];
    const target = byKey[edge.target];
    if (!source || !target) return;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = edge.relation === "opposition"
      ? `rgba(184, 77, 91, ${0.25 + edge.weight * 0.6})`
      : `rgba(100, 163, 145, ${0.25 + edge.weight * 0.6})`;
    ctx.lineWidth = 1 + edge.weight * 5;
    ctx.stroke();
  });

  nodes.forEach(node => {
    const radius = 15 + Math.abs(node.value) * 16;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = node.value >= 0 ? "#bb8b2f" : "#6ea392";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,250,241,0.72)";
    ctx.stroke();
    ctx.fillStyle = "#fffaf1";
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.label, node.x, node.y + 4);
  });
}

function findSimulation(characterId) {
  return state.simulations.find(simulation => simulation.character_id === characterId);
}

function renderDataset() {
  characterCount.textContent = `${state.characters.length}명`;
  logCount.textContent = `${state.simulations.reduce((sum, sim) => sum + sim.events.length, 0)}건`;
  const latest = state.simulations.at(-1);
  const compact = {
    characters: state.characters.slice(-3),
    latest_model_pipeline: latest?.model_pipeline ?? null,
    latest_embedding_model: latest?.character ? {
      model: latest.character.embedding_model,
      provider: latest.character.embedding_provider,
      dimensions: latest.character.embedding_dimensions || null
    } : null,
    current_neural_model: state.neural_model ? {
      id: state.neural_model.id,
      schema_id: state.neural_model.schema_id,
      trained_steps: state.neural_model.trained_steps,
      last_loss: state.neural_model.last_loss,
      loss_history: state.neural_model.loss_history
    } : null,
    latest_persona_structure_prior: latest?.persona_structure_prior ?? null,
    latest_prompt_interpretation: latest?.prompt_interpretation ? {
      model_id: latest.prompt_interpretation.model_id,
      based_on_model: latest.prompt_interpretation.based_on_model,
      prompt_fragments: latest.prompt_interpretation.prompt_fragments,
      interpretation_summary: latest.prompt_interpretation.interpretation_summary
    } : null,
    latest_infant_latent_persona: latest?.infant_latent_persona ?? null,
    latest_developmental_logs: latest?.developmental_logs?.map(log => ({
      event_id: log.event_id,
      phase: log.phase,
      adaptation: log.adaptation,
      prompt_evidence: log.prompt_evidence,
      latent_before: log.latent_before,
      latent_after: log.latent_after
    })) ?? [],
    latest_latent_persona: latest?.latent_persona ?? null,
    latest_latent_edges: latest?.latent_edges ?? [],
    latest_dynamic_runs: latest?.dynamic_runs ?? [],
    latest_gameplay: latest?.gameplay ?? null,
    behavior_logs: state.simulations.flatMap(sim => sim.events.map(event => ({
      character_id: sim.character_id,
      event_id: event.event_id,
      event_embedding: event.event_embedding,
      action: event.action,
      prompt_evidence: event.prompt_evidence,
      latent_contributors: event.latent_contributors,
      action_embedding: event.action_embedding,
      outcome: event.outcome,
      ending_flag: event.ending_flag
    }))).slice(-10),
    feedback_updates: state.feedback.slice(-10)
  };
  datasetPreview.textContent = JSON.stringify(compact, null, 2);
}

function fillSample() {
  const sample = samples[state.characters.length % samples.length];
  document.querySelector("#promptInput").value = sample.prompt;
  const nameInput = document.querySelector("#nameInput");
  if (nameInput) nameInput.value = "";
}

function ensureDefaultPrompt() {
  const input = document.querySelector("#promptInput");
  if (input && !input.value.trim()) {
    input.value = DEFAULT_PROMPT;
  }
}

function compareRecent() {
  const recent = state.simulations.slice(-3);
  if (recent.length < 2) {
    alert("비교하려면 캐릭터를 2명 이상 시뮬레이션하세요.");
    return;
  }
  const rows = recent.map(sim => {
    const vector = sim.latent_persona.map(value => value.toFixed(2)).join(", ");
    const actions = sim.events.map(event => `${event.event_id}:${event.action_label}`).join("\n");
    const growth = sim.developmental_logs.map(log => `${log.event_id}:${log.adaptation_label}`).join("\n");
    return `${sim.character.generated_name} / ${sim.ending.title}\nz=[${vector}]\n${growth}\n${actions}`;
  });
  alert(rows.join("\n\n"));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "persona_collection_latent_dataset.json";
  link.click();
  URL.revokeObjectURL(url);
}

function showView(targetId) {
  document.querySelectorAll(".view-section").forEach(section => {
    const active = section.id === targetId;
    section.classList.toggle("active", active);
    section.hidden = !active;
  });
  modeTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.viewTarget === targetId);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const character = getFormCharacter();
  if (!character.prompt) {
    document.querySelector("#promptInput").focus();
    return;
  }
  if (character.requested_name && !isValidCharacterName(character.requested_name)) {
    const nameInput = document.querySelector("#nameInput");
    nameInput.setCustomValidity("이름은 한글/영문/숫자만 사용해 2~10자, 띄어쓰기 없이 입력해주세요.");
    nameInput.reportValidity();
    nameInput.setCustomValidity("");
    return;
  }
  await runSimulation(character);
});

resultList.addEventListener("click", event => {
  const startEventsButton = event.target.closest("[data-start-events-for]");
  if (startEventsButton) {
    const simulation = findSimulation(startEventsButton.dataset.startEventsFor);
    if (!simulation) return;
    ensureGameplayState(simulation);
    simulation.gameplay.prologue_seen = true;
    renderSimulation(simulation);
    saveState();
    return;
  }

  const predictionButton = event.target.closest("[data-predict-character-id]");
  if (predictionButton) {
    const simulation = findSimulation(predictionButton.dataset.predictCharacterId);
    if (!simulation) return;
    ensureGameplayState(simulation);
    const eventLog = simulation.events[simulation.gameplay.currentIndex];
    if (!eventLog || eventLog.event_id !== predictionButton.dataset.eventId) return;
    if (predictionFor(simulation, eventLog.event_id)) return;
    const correct = eventLog.action === predictionButton.dataset.actionId;
    const streakBefore = computeCurrentStreak(simulation.gameplay.predictions);
    const points = correct ? 10 + Math.min(streakBefore, 5) * 2 : 0;
    simulation.gameplay.predictions.push({
      event_id: eventLog.event_id,
      guessed_action: predictionButton.dataset.actionId,
      actual_action: eventLog.action,
      correct,
      points,
      created_at: new Date().toISOString()
    });
    ensureGameplayState(simulation);
    renderSimulation(simulation);
    saveState();
    return;
  }

  const nextButton = event.target.closest("[data-next-event-for]");
  if (nextButton) {
    const simulation = findSimulation(nextButton.dataset.nextEventFor);
    if (!simulation) return;
    ensureGameplayState(simulation);
    simulation.gameplay.currentIndex = Math.min(simulation.gameplay.currentIndex + 1, simulation.events.length);
    simulation.gameplay.completed = simulation.gameplay.currentIndex >= simulation.events.length;
    renderSimulation(simulation);
    saveState();
    return;
  }

  const rerunButton = event.target.closest("[data-rerun-character-id]");
  if (rerunButton) {
    const simulation = findSimulation(rerunButton.dataset.rerunCharacterId);
    if (!simulation) return;
    simulation.baseline_events = simulation.baseline_events || simulation.events.map(item => ({ ...item }));
    const runNumber = (simulation.dynamic_runs?.length || 0) + 1;
    const dynamicRun = PersonaEngine.simulateWorldEvents(
      simulation.character,
      simulation.latent_persona,
      simulation.persona_structure_prior,
      `rerun_${runNumber}`,
      state.neural_model
    );
    simulation.dynamic_runs = [...(simulation.dynamic_runs || []), dynamicRun];
    simulation.events = dynamicRun.events;
    simulation.ending = dynamicRun.ending;
    simulation.latent_edges = dynamicRun.latent_edges;
    renderSimulation(simulation);
    saveState();
    return;
  }

  const button = event.target.closest("[data-feedback]");
  if (!button) return;
  const simulation = findSimulation(button.dataset.characterId);
  const eventLog = simulation?.events.find(item => item.event_id === button.dataset.eventId);
  if (!simulation || !eventLog) return;

  const before = [...simulation.latent_persona];
  const after = PersonaEngine.updateLatentWithFeedback(
    simulation.latent_persona,
    eventLog.action_embedding,
    button.dataset.feedback
  );
  simulation.latent_persona = after;
  simulation.latent_edges = PersonaEngine.inferLatentEdges(after);

  const feedback = {
    character_id: button.dataset.characterId,
    event_id: button.dataset.eventId,
    action: eventLog.action,
    feedback_signal: button.dataset.feedback,
    latent_before: before,
    latent_after: after,
    action_embedding: eventLog.action_embedding,
    created_at: new Date().toISOString()
  };
  simulation.feedback_updates.push(feedback);
  simulation.pending_dynamic_update = true;
  state.feedback.push(feedback);
  button.textContent = "학습 반영됨";
  button.disabled = true;
  renderLatentBars(after, simulation.persona_structure_prior.latent_dimensions);
  drawNetwork(after, simulation.latent_edges, simulation.persona_structure_prior.latent_dimensions);
  saveState();
  syncToServer("feedback", feedback);
});

document.addEventListener("click", event => {
  const trainButton = event.target.closest("[data-train-model-for]");
  if (!trainButton) return;
  const simulation = findSimulation(trainButton.dataset.trainModelFor);
  if (!simulation) return;
  if (!state.neural_model || state.neural_model.schema_id !== simulation.persona_structure_prior.schema_id) {
    state.neural_model = PersonaEngine.createTrainableModel(simulation.persona_structure_prior, simulation.character_id);
  }
  const examples = state.feedback.filter(item =>
    item.action_embedding && item.latent_before && item.character_id === simulation.character_id
  );
  const result = PersonaEngine.trainDeepLearningModel(state.neural_model, examples, {
    epochs: 24,
    learningRate: 0.035
  });
  state.neural_model = result.model;
  simulation.training_runs = [...(simulation.training_runs || []), {
    trained_examples: result.trained_examples,
    epochs: result.epochs,
    last_loss: result.last_loss,
    loss_history: result.loss_history,
    created_at: new Date().toISOString()
  }];
  renderSimulation(simulation);
  saveState();
});

document.querySelector("#loadSampleBtn").addEventListener("click", fillSample);
document.querySelector("#compareBtn").addEventListener("click", compareRecent);
document.querySelector("#exportBtn").addEventListener("click", exportJson);
modeTabs.forEach(tab => {
  tab.addEventListener("click", () => showView(tab.dataset.viewTarget));
});
document.querySelector("#resetBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state.characters = [];
  state.simulations = [];
  state.feedback = [];
  resultList.innerHTML = "";
  if (adminModelPanel) adminModelPanel.innerHTML = "";
  emptyState.style.display = "grid";
  activeCharacterBadge.textContent = "대기 중";
  latentBars.innerHTML = "";
  ensureDefaultPrompt();
  drawNetwork();
  renderDataset();
});

ensureDefaultPrompt();
drawNetwork();
renderDataset();
