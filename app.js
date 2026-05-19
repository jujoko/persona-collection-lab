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

const STORAGE_KEY = "persona-collection-lab-v3";
const state = loadState();
const DEFAULT_PROMPT = "전쟁 중 태어난 아이. 아버지는 엄격한 기사였고 어머니는 굶주린 이웃을 몰래 도왔다. 어린 시절에는 자주 버려질까 두려워했고, 커서는 왕국의 기사로 인정받고 싶어 한다. 겁이 많지만 친구를 버리지 못한다.";

const samples = [
  {
    prompt: "전쟁 중 태어난 아이. 아버지는 엄격한 기사였고 어머니는 굶주린 이웃을 몰래 도왔다. 어린 시절에는 자주 버려질까 두려워했고, 커서는 왕국의 기사로 인정받고 싶어 한다. 겁이 많지만 친구를 버리지 못한다."
  },
  {
    prompt: "귀족 가문에서 태어난 아이. 부모는 아이를 사랑했지만 가문의 명예와 성취를 더 중시했다. 어릴 때부터 마법과 정치 교육을 받았고, 인정받지 못하면 버려질 수 있다는 압박을 느꼈다. 커서는 금지된 힘으로 전쟁을 끝내고 싶어 한다."
  },
  {
    prompt: "기근이 심한 마을에서 태어난 아이. 부모는 반란군에게 식량을 빼앗겼고 왕국은 마을을 버렸다. 어린 시절 억울하게 끌려간 민간인을 본 뒤 권위를 믿지 않게 되었다. 약자를 보호하고 새 질서를 세우려는 반란군 지휘관으로 자란다."
  }
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

function makeGeneratedName(prompt, id) {
  const explicitName = prompt.match(/(?:이름은|이름:)\s*([가-힣A-Za-z0-9_-]{2,12})/)?.[1];
  if (explicitName) return explicitName;
  return `인물 ${id.slice(1)}`;
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
  const character = {
    prompt: document.querySelector("#promptInput").value.trim()
  };
  character.id = makeCharacterId(character);
  character.generated_name = makeGeneratedName(character.prompt, character.id);
  character.name = character.generated_name;
  character.birth_state = "infant";
  character.free_text_length = character.prompt.length;
  return character;
}

async function runSimulation(character) {
  submitBtn.disabled = true;
  const originalSubmitText = submitBtn.textContent;
  submitBtn.textContent = "문장 임베딩 모델 실행 중";
  try {
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
    const simulation = PersonaEngine.simulate(character, null, neuralModel);
    simulation.baseline_events = simulation.events.map(event => ({ ...event }));
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

function renderSimulation(simulation) {
  emptyState.style.display = "none";
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

  const eventCards = simulation.events.map(event => `
    <article class="result-card" data-event-id="${event.event_id}">
      <div class="card-title-row">
        <div class="result-meta">
          <span>${event.event_id}</span>
          <span>${event.event_type}</span>
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
          <p>${event.outcome}</p>
        </section>
        <section>
          <span class="flow-label">프롬프트 근거</span>
          <blockquote>${event.prompt_evidence}</blockquote>
        </section>
        <section>
          <span class="flow-label">판단</span>
          <p>${event.rationale}</p>
        </section>
      </div>
      <div class="feedback-row">
        <button type="button" data-feedback="consistent" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">완전 캐릭터다</button>
        <button type="button" data-feedback="ambiguous" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">조금 애매함</button>
        <button type="button" data-feedback="wrong" data-character-id="${simulation.character_id}" data-event-id="${event.event_id}">전혀 아님</button>
      </div>
    </article>
  `).join("");

  const ending = simulation.ending;
  const dynamicRuns = simulation.dynamic_runs?.map(run => renderDynamicRun(simulation, run)).join("") || "";
  if (adminModelPanel) {
    adminModelPanel.innerHTML = modelCard;
  }

  resultList.innerHTML = `
    <div class="result-section-title">
      <p class="eyebrow">Growth Phase</p>
      <h3>아기에서 성인 직전까지의 성격 변화</h3>
    </div>
    ${developmentCards}
    <div class="result-section-title">
      <p class="eyebrow">World Events</p>
      <h3>현재 페르소나가 사건과 만났을 때</h3>
    </div>
    ${eventCards}
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
    ${dynamicRuns}
    <article class="ending-card">
      <div>
        <p class="eyebrow">Ending</p>
        <h2>${simulation.character.generated_name}: ${ending.title}</h2>
        <p>${ending.social_memory}. 세계 영향도는 ${ending.world_impact}, 생존 여부는 ${ending.survived ? "생존" : "사망"}입니다.</p>
      </div>
      <div class="ending-badge">${ending.id}</div>
    </article>
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
  await runSimulation(character);
});

resultList.addEventListener("click", event => {
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
