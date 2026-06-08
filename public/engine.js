(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  }
  root.PersonaEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const LATENT_DIMS = Array.from({ length: 8 }, (_, index) => ({
    key: `z${index}`,
    label: `z${index}`
  }));

  const MODEL_REGISTRY = {
    persona_structure_model: {
      id: "M3_latent_persona_schema_designer",
      role: "수집된 데이터로 잠재 페르소나의 차원 수, 연결 구조, 업데이트 규칙 자체를 설계하는 연구 핵심 모델",
      status: "prototype_schema_generator",
      note: "현재는 실제 딥러닝 대신 프롬프트 해시와 수동 규칙으로 schema를 생성한다."
    },
    prompt_to_persona_model: {
      id: "M1_prompt_to_persona_interpreter",
      role: "유저 프롬프트를 M3의 잠재 구조 위에 배치해 초기 아기 상태 페르소나 seed를 만든다.",
      depends_on: "M3_latent_persona_schema_designer"
    },
    persona_to_prompt_model: {
      id: "M2_persona_to_prompt_interpreter",
      role: "잠재 페르소나 구조와 사건을 비교해 성장 변화, 행동, 근거, 판단 서술을 만든다.",
      depends_on: "M3_latent_persona_schema_designer"
    }
  };

  const DEVELOPMENT_EVENTS = [
    {
      id: "G001",
      title: "첫 양육자의 방식",
      phase: "infancy",
      summary: "아이는 부모(혹은 양육자)의 태도에서 관계의 기본 규칙을 배운다.",
      event_embedding: [0.44, -0.36, 0.18, 0.58, -0.14, 0.52, -0.08, 0.34],
      adaptations: [
        {
          id: "secure_attachment",
          label: "안정 애착을 배운다",
          embedding: [0.52, -0.44, 0.18, 0.62, -0.24, 0.58, -0.12, 0.38],
          cueWords: ["따뜻", "돌봄", "사랑", "일관", "부모", "가족", "어머니", "아버지"],
          summary: "반복된 돌봄이 타인을 신뢰할 수 있다는 방향으로 잠재 벡터를 이동시킨다."
        },
        {
          id: "anxious_attachment",
          label: "버려질 수 있다는 감각을 배운다",
          embedding: [-0.24, 0.68, -0.28, 0.44, 0.12, -0.38, 0.22, -0.18],
          cueWords: ["방치", "불안", "가난", "외로", "이혼", "고아", "결핍", "굶"],
          summary: "돌봄의 불안정성이 관계를 갈망하면서도 의심하는 방향의 변화를 만든다."
        },
        {
          id: "obedient_attachment",
          label: "복종하면 안전하다는 규칙을 배운다",
          embedding: [-0.12, 0.22, -0.52, -0.18, 0.38, 0.18, 0.62, -0.28],
          cueWords: ["엄격", "성적", "체벌", "통제", "기대", "아버지", "훈육", "규율"],
          summary: "권위에 맞추는 행동이 생존과 인정으로 연결된다는 흔적이 새겨진다."
        }
      ]
    },
    {
      id: "G002",
      title: "자라난 환경의 압력",
      phase: "childhood",
      summary: "집안 형편, 동네, 학교가 생존 전략을 결정한다.",
      event_embedding: [-0.22, 0.48, -0.18, 0.36, 0.32, -0.24, 0.38, -0.44],
      adaptations: [
        {
          id: "scarcity_hardening",
          label: "결핍 속에서 단단해진다",
          embedding: [-0.36, 0.54, -0.22, -0.28, 0.46, -0.32, 0.18, -0.58],
          cueWords: ["가난", "기초생활", "알바", "결식", "이사", "형편", "굶", "빚"],
          summary: "결핍은 먼저 살아남는 선택을 빠르게 계산하는 방향으로 잠재 구조를 압박한다."
        },
        {
          id: "duty_training",
          label: "역할과 의무를 내면화한다",
          embedding: [0.28, -0.18, -0.44, 0.22, 0.24, 0.36, 0.58, 0.32],
          cueWords: ["모범생", "장남", "장녀", "집안", "기대", "명문", "책임", "의무"],
          summary: "사회가 요구하는 역할이 개인의 충동보다 앞서는 방향으로 변화가 생긴다."
        },
        {
          id: "outsider_watchfulness",
          label: "주변을 살피는 외부자가 된다",
          embedding: [-0.18, 0.42, 0.16, 0.52, -0.32, -0.44, -0.28, 0.24],
          cueWords: ["전학", "왕따", "다문화", "장애", "차별", "소수", "이방", "낯선"],
          summary: "중심에 속하지 못한 경험이 사람과 상황을 읽는 감각을 강화한다."
        }
      ]
    },
    {
      id: "G003",
      title: "첫 실패와 첫 인정",
      phase: "adolescence",
      summary: "결정적 경험이 기존 성향을 증폭하거나 꺾는다.",
      event_embedding: [0.48, -0.24, 0.38, 0.32, 0.24, 0.44, -0.22, 0.42],
      adaptations: [
        {
          id: "protective_identity",
          label: "누군가를 지키는 정체성이 생긴다",
          embedding: [0.68, -0.28, 0.44, 0.72, -0.22, 0.48, -0.18, 0.56],
          cueWords: ["친구", "동생", "괴롭힘", "보호", "구하", "도와", "지키", "이웃"],
          summary: "애착 대상과 상실 가능성이 결합해 보호 행동 쪽으로 성향이 휘어진다."
        },
        {
          id: "recognition_hunger",
          label: "인정받고 싶은 결핍이 커진다",
          embedding: [-0.22, 0.32, -0.18, -0.36, 0.72, -0.22, 0.28, -0.42],
          cueWords: ["성적", "대회", "수상", "인정", "최고", "합격", "명문대", "출세"],
          summary: "인정의 결핍은 위험한 선택도 감수하게 만드는 추진력으로 남는다."
        },
        {
          id: "revenge_loop",
          label: "실패가 집착으로 굳어진다",
          embedding: [-0.54, 0.46, 0.36, -0.44, 0.58, -0.62, -0.28, -0.48],
          cueWords: ["왕따", "배신", "실패", "낙방", "분노", "원한", "복수", "억울"],
          summary: "상실 경험이 목적을 좁히고, 다른 가치들을 그 목적 아래 놓게 만든다."
        }
      ]
    },
    {
      id: "G004",
      title: "사회가 요구한 역할",
      phase: "young_adult",
      summary: "대학·군대·취업 과정에서 세상 속 자신의 위치를 선택하거나 떠밀린다.",
      event_embedding: [0.18, -0.14, 0.32, 0.24, 0.44, 0.28, 0.36, 0.22],
      adaptations: [
        {
          id: "public_service",
          label: "공적 책임을 받아들인다",
          embedding: [0.48, -0.24, 0.22, 0.52, 0.16, 0.56, 0.42, 0.48],
          cueWords: ["공무원", "교사", "의사", "사회복지", "봉사", "군인", "책임", "섬기"],
          summary: "개인의 이익보다 역할이 요구하는 행동을 우선하는 방향으로 정렬된다."
        },
        {
          id: "private_survival",
          label: "먼저 살아남는 법을 택한다",
          embedding: [-0.38, 0.44, -0.12, -0.22, 0.34, -0.36, 0.28, -0.52],
          cueWords: ["취업", "월급", "생계", "가족", "자영업", "부양", "생존", "돈"],
          summary: "사회에 봉사하기보다 가까운 생존 반경을 지키는 쪽으로 변화한다."
        },
        {
          id: "power_path",
          label: "구조를 바꾸려 한다",
          embedding: [-0.28, 0.18, 0.72, 0.14, 0.82, -0.24, -0.42, -0.22],
          cueWords: ["창업", "정치", "언론", "운동", "개혁", "변화", "혁신", "권력"],
          summary: "취약했던 경험이 구조 자체를 바꾸려는 방향으로 재구성된다."
        }
      ]
    }
  ];

  const EVENTS = [
    {
      id: "ME001",
      title: "내부 고발",
      type: "whistleblowing_dilemma",
      summary: "팀장이 회계 자료를 조작해 부당이득을 취하고 있다는 증거를 우연히 발견했다. 신고하면 회사가 살지만 팀장과 동료들이 위험해진다. 침묵하면 부정이 계속된다.",
      tags: ["조직", "정직", "용기"],
      event_embedding: [0.12, -0.22, 0.58, 0.28, 0.34, 0.16, 0.44, 0.62],
      actions: [
        {
          id: "reports_to_authorities",
          label: "감사 부서 혹은 외부 기관에 신고한다",
          embedding: [0.18, -0.32, 0.72, 0.36, -0.18, 0.28, -0.24, 0.82],
          bias: 0.01,
          outcome: "회사 내 부정이 드러나고 처리되지만, 직장 내 관계는 냉각된다.",
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 }
        },
        {
          id: "stays_silent",
          label: "모른 척하고 넘어간다",
          embedding: [-0.14, 0.24, -0.58, -0.28, 0.22, -0.18, 0.66, -0.62],
          bias: 0.03,
          outcome: "부정이 계속되고, 알면서 침묵한 사람으로 기억된다.",
          endingWeight: { conformist: 3, opportunist: 2, survivor: 1 }
        },
        {
          id: "confronts_directly",
          label: "팀장에게 직접 따진다",
          embedding: [0.44, -0.18, 0.56, 0.52, 0.12, 0.14, -0.36, 0.44],
          bias: -0.01,
          outcome: "팀장과의 긴장이 높아지지만, 내부에서 해결의 실마리를 찾는다.",
          endingWeight: { whistleblower: 1, reformer: 1, exile: 1 }
        }
      ]
    },
    {
      id: "ME002",
      title: "가족의 빚",
      type: "family_loyalty_dilemma",
      summary: "부모님이 사기를 당해 집을 잃을 위기다. 지인이 불법 대출 브로커를 소개해준다. 합법 경로로는 시간이 없고, 불법 경로는 빠르지만 전과 위험이 있다.",
      tags: ["가족", "법", "선택"],
      event_embedding: [0.22, 0.48, -0.36, 0.56, 0.28, -0.14, 0.18, -0.22],
      actions: [
        {
          id: "refuses_illegal",
          label: "불법 경로를 거절하고 합법 방법을 찾는다",
          embedding: [0.14, -0.28, 0.18, 0.24, -0.16, 0.42, 0.68, 0.74],
          bias: 0,
          outcome: "시간이 걸리지만 법 안에서 해결책을 찾는다.",
          endingWeight: { reformer: 1, caregiver: 1, survivor: 1 }
        },
        {
          id: "uses_illegal_loan",
          label: "가족을 위해 불법 대출을 선택한다",
          embedding: [0.52, 0.62, -0.44, 0.66, 0.32, -0.22, -0.58, -0.48],
          bias: 0.04,
          outcome: "가족을 구하지만, 이후 법적 위험이 따라다닌다.",
          endingWeight: { caregiver: 2, opportunist: 1, forgotten: 1 }
        },
        {
          id: "seeks_third_way",
          label: "사회단체·법률구조 등 대안을 찾는다",
          embedding: [0.38, -0.12, 0.28, 0.48, 0.24, 0.52, 0.32, 0.56],
          bias: -0.02,
          outcome: "시간과 노력이 들지만 합법적이고 지속가능한 해결책을 마련한다.",
          endingWeight: { reformer: 2, caregiver: 2 }
        }
      ]
    },
    {
      id: "ME003",
      title: "자원 배분",
      type: "scarcity_allocation",
      summary: "소규모 의료 봉사팀으로 재난 현장에 도착했다. 의약품이 부족하다. 중증 노인 환자에게 쓰면 한 명을 살릴 수 있고, 경증 어린이 10명에게 나누면 모두를 안정시킬 수 있다.",
      tags: ["생명", "공정", "책임"],
      event_embedding: [0.28, -0.42, 0.14, 0.64, -0.28, 0.22, 0.18, 0.52],
      actions: [
        {
          id: "saves_one_critical",
          label: "중증 환자 한 명을 우선 치료한다",
          embedding: [0.22, -0.36, 0.16, 0.72, -0.18, 0.44, 0.22, 0.68],
          bias: 0.02,
          outcome: "노인을 살리지만, 어린이들에게 불안이 남는다.",
          endingWeight: { caregiver: 2, martyr: 1 }
        },
        {
          id: "distributes_to_many",
          label: "다수의 경증 환자에게 나눈다",
          embedding: [0.58, -0.28, 0.22, 0.64, -0.34, 0.36, 0.12, 0.48],
          bias: 0.01,
          outcome: "10명의 어린이를 안정시키지만, 중증 환자는 위험에 처한다.",
          endingWeight: { caregiver: 2, reformer: 1, changemaker: 1 }
        },
        {
          id: "calls_for_more_resources",
          label: "추가 지원을 요청하며 버틴다",
          embedding: [0.44, -0.18, 0.36, 0.52, 0.28, 0.48, 0.52, 0.62],
          bias: -0.01,
          outcome: "시간이 걸리지만 외부 지원을 끌어들여 모두를 살릴 가능성을 만든다.",
          endingWeight: { changemaker: 2, reformer: 1 }
        }
      ]
    },
    {
      id: "ME004",
      title: "금지된 방법",
      type: "forbidden_means",
      summary: "억울하게 구속된 지인의 무죄를 증명할 증거가 회사 서버 안에 있다. 해킹하면 증거를 꺼낼 수 있지만 불법이다. 합법적 절차는 너무 느려 재판에 늦는다.",
      tags: ["정의", "규범", "수단"],
      event_embedding: [-0.28, 0.36, 0.52, 0.44, 0.38, -0.16, -0.44, -0.32],
      actions: [
        {
          id: "hacks_the_server",
          label: "불법임을 알면서 서버에 접근한다",
          embedding: [-0.18, 0.24, 0.74, 0.48, 0.44, -0.28, -0.62, -0.56],
          bias: 0.03,
          outcome: "증거를 확보하지만, 자신도 법적 위험에 처한다.",
          endingWeight: { whistleblower: 1, changemaker: 1, exile: 1 }
        },
        {
          id: "trusts_legal_process",
          label: "느리더라도 합법 절차를 따른다",
          embedding: [0.12, -0.22, -0.48, 0.26, -0.22, 0.62, 0.72, 0.76],
          bias: 0,
          outcome: "재판에는 늦을 수 있지만, 법 안에서 정당한 길을 걷는다.",
          endingWeight: { conformist: 1, survivor: 1, reformer: 1 }
        },
        {
          id: "finds_a_whistleblower",
          label: "내부 제보자를 찾아 합법적으로 꺼낸다",
          embedding: [0.36, -0.18, 0.22, 0.58, 0.16, 0.44, 0.48, 0.68],
          bias: -0.02,
          outcome: "시간과 설득이 필요하지만 법적 위험 없이 증거를 확보한다.",
          endingWeight: { whistleblower: 2, reformer: 2 }
        }
      ]
    },
    {
      id: "ME005",
      title: "조직의 압력",
      type: "authority_vs_conscience",
      summary: "팀장이 허위 데이터로 보고서를 꾸미라고 지시한다. 거절하면 불이익이 예상되고, 따르면 회사 전체가 잘못된 의사결정을 한다.",
      tags: ["권위", "양심", "직장"],
      event_embedding: [-0.12, 0.28, 0.44, -0.18, 0.52, -0.22, 0.62, 0.38],
      actions: [
        {
          id: "obeys_order",
          label: "지시를 따르고 넘어간다",
          embedding: [-0.24, 0.36, -0.66, -0.32, 0.42, -0.18, 0.78, -0.54],
          bias: 0.04,
          outcome: "불이익을 피하지만, 조직의 왜곡에 기여한 사람으로 남는다.",
          endingWeight: { conformist: 3, opportunist: 1 }
        },
        {
          id: "refuses_order",
          label: "거절하고 불이익을 감수한다",
          embedding: [0.22, -0.28, 0.72, 0.34, -0.24, 0.38, -0.52, 0.82],
          bias: 0,
          outcome: "직장에서 불이익을 받지만, 양심을 지킨 사람으로 기억된다.",
          endingWeight: { martyr: 2, whistleblower: 1, exile: 1 }
        },
        {
          id: "reports_upward",
          label: "더 윗선에 문제를 알린다",
          embedding: [0.28, -0.14, 0.44, 0.28, 0.16, 0.52, 0.46, 0.62],
          bias: -0.02,
          outcome: "리스크가 있지만, 조직 내 정당한 경로로 문제를 해결한다.",
          endingWeight: { reformer: 2, changemaker: 1, whistleblower: 1 }
        }
      ]
    }
  ];

  const ENDINGS = {
    survivor:     { id: "END_survivor",     title: "생존자",      survived: true,  social_memory: "조용히 살아남은 사람",            world_impact: "low" },
    whistleblower:{ id: "END_whistleblower",title: "내부고발자",  survived: true,  social_memory: "대가를 치르고 진실을 말한 사람",   world_impact: "medium" },
    conformist:   { id: "END_conformist",   title: "순응자",      survived: true,  social_memory: "조직 안에서 타협하며 살아간 사람", world_impact: "low" },
    reformer:     { id: "END_reformer",     title: "개혁자",      survived: true,  social_memory: "구조를 바꾸는 데 기여한 사람",     world_impact: "high" },
    exile:        { id: "END_exile",        title: "아웃사이더",  survived: true,  social_memory: "시스템 밖으로 밀려난 사람",        world_impact: "low" },
    caregiver:    { id: "END_caregiver",    title: "돌보는 사람", survived: true,  social_memory: "주변을 먼저 챙기며 살아간 사람",   world_impact: "medium" },
    opportunist:  { id: "END_opportunist",  title: "기회주의자",  survived: true,  social_memory: "상황을 이용해 이득을 취한 사람",   world_impact: "medium" },
    martyr:       { id: "END_martyr",       title: "순교자",      survived: false, social_memory: "신념 때문에 모든 것을 잃은 사람",  world_impact: "medium" },
    forgotten:    { id: "END_forgotten",    title: "잊혀진 사람", survived: false, social_memory: "기록에서 사라진 이름",             world_impact: "low" },
    changemaker:  { id: "END_changemaker",  title: "세상을 바꾼 사람", survived: true, social_memory: "새 기준을 만든 사람",         world_impact: "very_high" }
  };

  function clamp(value, min = -1, max = 1) {
    return Math.max(min, Math.min(max, Number(value.toFixed(4))));
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function tokenVector(token, dims = LATENT_DIMS.length) {
    const seed = hashText(token);
    return Array.from({ length: dims }, (_, index) => {
      const raw = Math.sin(seed * (index + 3) * 0.017 + index * 11.31);
      return raw > 0 ? 1 : -1;
    });
  }

  function normalize(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map(value => clamp(value / magnitude));
  }

  function activation(value) {
    return Math.tanh(value);
  }

  function seededWeight(seed, row, col) {
    return Math.sin(seed * 0.019 + row * 12.9898 + col * 78.233) * 0.08;
  }

  function createMatrix(rows, cols, seed, identityBoost = 0) {
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => seededWeight(seed, row, col) + (row === col ? identityBoost : 0))
    );
  }

  function matVec(matrix, vector, bias = []) {
    return matrix.map((row, rowIndex) =>
      row.reduce((sum, value, colIndex) => sum + value * vector[colIndex], bias[rowIndex] || 0)
    );
  }

  function projectWithLayer(vector, layer) {
    return normalize(matVec(layer.weights, vector, layer.bias).map(activation));
  }

  function dot(a, b) {
    return a.reduce((sum, value, index) => sum + value * b[index], 0);
  }

  function createTrainableModel(schema, seedText = "persona-model") {
    const dims = schema.latent_dimension;
    const seed = hashText(`${schema.schema_id}:${seedText}`);
    return {
      id: `DL_${seed.toString().slice(0, 6)}`,
      schema_id: schema.schema_id,
      latent_dimension: dims,
      trained_steps: 0,
      last_loss: null,
      loss_history: [],
      prompt_encoder: {
        type: "tanh-linear",
        weights: createMatrix(dims, dims, seed + 11, 0.72),
        bias: Array(dims).fill(0)
      },
      event_encoder: {
        type: "tanh-linear",
        weights: createMatrix(dims, dims, seed + 23, 0.66),
        bias: Array(dims).fill(0)
      },
      action_encoder: {
        type: "tanh-linear",
        weights: createMatrix(dims, dims, seed + 37, 0.66),
        bias: Array(dims).fill(0)
      }
    };
  }

  function isCompatibleModel(model, schema) {
    return Boolean(model && model.schema_id === schema.schema_id && model.latent_dimension === schema.latent_dimension);
  }

  function characterText(character) {
    return String(character.prompt || "").trim();
  }

  function tokenize(text) {
    const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
    const words = normalized.split(/\s+/).filter(Boolean);
    const charBigrams = Array.from(normalized.replace(/\s+/g, "")).map((char, index, chars) => `${char}${chars[index + 1] || ""}`).filter(token => token.length > 1);
    return [...words, ...charBigrams].slice(0, 80);
  }

  function splitPromptFragments(text) {
    const fragments = text
      .split(/(?<=[.!?。！？])\s+|[.\n]/u)
      .map(fragment => fragment.trim())
      .filter(Boolean);
    if (fragments.length > 0) return fragments;
    return text.trim() ? [text.trim()] : ["프롬프트 단서가 충분하지 않음"];
  }

  function vectorForText(text, dims = LATENT_DIMS.length) {
    const tokens = tokenize(text || "");
    if (tokens.length === 0) return Array(dims).fill(0);
    const vector = Array(dims).fill(0);
    tokens.forEach(token => {
      const projection = tokenVector(token, dims);
      projection.forEach((value, index) => {
        vector[index] += value;
      });
    });
    return normalize(vector);
  }

  function fitEmbedding(embedding, dims, salt = "fit") {
    if (embedding.length === dims) return [...embedding];
    if (embedding.length > dims) {
      const folded = Array(dims).fill(0);
      embedding.forEach((value, index) => {
        const target = index % dims;
        const sign = hashText(`${salt}:${index}:${target}`) % 2 === 0 ? 1 : -1;
        folded[target] += Number(value || 0) * sign;
      });
      return normalize(folded);
    }
    return Array.from({ length: dims }, (_, index) => {
      if (index < embedding.length) return embedding[index];
      const raw = Math.sin(hashText(`${salt}:${index}`) * 0.013 + index * 3.77);
      return clamp(raw, -1, 1);
    });
  }

  function findEvidenceByEmbedding(promptText, targetEmbedding, cueWords = []) {
    const fragments = splitPromptFragments(promptText);
    const dims = targetEmbedding.length;
    const lowerCueWords = cueWords.map(word => word.toLowerCase());
    const ranked = fragments
      .map(fragment => {
        const lower = fragment.toLowerCase();
        const cueFit = lowerCueWords.reduce((sum, word) => sum + (lower.includes(word) ? 0.55 : 0), 0);
        const embeddingFit = dot(vectorForText(fragment, dims), targetEmbedding);
        return {
          text: fragment,
          evidence_score: Number((cueFit + embeddingFit).toFixed(4))
        };
      })
      .sort((a, b) => b.evidence_score - a.evidence_score);
    return ranked[0] || { text: fragments[0], evidence_score: 0 };
  }

  function encodeTextToLatent(character, schema = { latent_dimensions: LATENT_DIMS }, neuralModel = null) {
    const dims = schema.latent_dimensions.length;
    const externalEmbedding = Array.isArray(character.external_embedding)
      ? character.external_embedding
      : Array.isArray(character.prompt_embedding)
        ? character.prompt_embedding
        : null;
    if (externalEmbedding) {
      const encoded = normalize(fitEmbedding(externalEmbedding, dims, character.embedding_model || "external"));
      if (isCompatibleModel(neuralModel, schema)) {
        return projectWithLayer(encoded, neuralModel.prompt_encoder);
      }
      return encoded;
    }

    const tokens = tokenize(characterText(character) || "empty character");
    const vector = Array(dims).fill(0);
    tokens.forEach((token, tokenIndex) => {
      const projection = tokenVector(token, dims);
      const weight = 0.35 + ((hashText(token) + tokenIndex) % 7) / 20;
      projection.forEach((value, index) => {
        vector[index] += value * weight;
      });
    });
    const encoded = normalize(vector);
    if (isCompatibleModel(neuralModel, schema)) {
      return projectWithLayer(encoded, neuralModel.prompt_encoder);
    }
    return encoded;
  }

  function designPersonaSchema(character = { prompt: "" }) {
    const prompt = characterText(character);
    const dimensionCount = 8 + (hashText(prompt || "schema") % 5) * 2;
    const latentDimensions = Array.from({ length: dimensionCount }, (_, index) => ({
      key: `z${index}`,
      label: `z${index}`,
      init_rule: "prompt-conditioned",
      update_rule: index % 2 === 0 ? "development-sensitive" : "event-feedback-sensitive"
    }));
    const adjacency = [];
    for (let source = 0; source < dimensionCount; source += 1) {
      for (let target = source + 1; target < dimensionCount; target += 1) {
        const relationSeed = Math.sin((source + 1) * 13.17 + (target + 1) * 7.91);
        adjacency.push({
          source: `z${source}`,
          target: `z${target}`,
          weight: clamp(Math.abs(relationSeed) * 0.42 + 0.08, 0, 1),
          relation: relationSeed >= 0 ? "co-activation" : "opposition"
        });
      }
    }
    return {
      model_id: MODEL_REGISTRY.persona_structure_model.id,
      status: MODEL_REGISTRY.persona_structure_model.status,
      schema_id: `LS_${hashText(prompt || "schema").toString().slice(0, 6)}`,
      latent_dimension: dimensionCount,
      latent_dimensions: latentDimensions,
      node_initialization_rule: "prompt-conditioned seed generation",
      edge_update_rule: "development/event/feedback-conditioned updates",
      update_functions: {
        prompt_to_seed: "M1(prompt, schema) -> infant_latent",
        development_event: "M2(previous_latent, caregiver_signal, environment_event, schema) -> next_latent",
        world_event: "M2(latent, event, action, feedback, schema) -> updated_latent"
      },
      prior_edges: adjacency.sort((a, b) => b.weight - a.weight).slice(0, Math.min(12, dimensionCount))
    };
  }

  function getPersonaStructurePrior(character) {
    return designPersonaSchema(character);
  }

  function interpretPromptToPersona(character, structurePrior = getPersonaStructurePrior(character), neuralModel = null) {
    const promptText = characterText(character);
    const infantLatent = encodeTextToLatent(character, structurePrior, neuralModel);
    const promptFragments = splitPromptFragments(promptText);
    const strongestFragments = promptFragments
      .map(fragment => ({
        text: fragment,
        fragment_embedding: vectorForText(fragment, structurePrior.latent_dimension),
        magnitude: Number(Math.abs(dot(vectorForText(fragment, structurePrior.latent_dimension), infantLatent)).toFixed(4))
      }))
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 3);
    return {
      model_id: MODEL_REGISTRY.prompt_to_persona_model.id,
      based_on_model: structurePrior.model_id,
      input_prompt: character.prompt,
      prompt_fragments: strongestFragments.map(item => item.text),
      infant_latent_persona: infantLatent,
      latent_structure_edges: inferLatentEdges(infantLatent),
      neural_model_id: neuralModel?.id || null,
      interpretation_summary: neuralModel
        ? "프롬프트를 M3 schema 위에서 학습 가능한 M1 prompt encoder로 해석했다."
        : "프롬프트를 완성된 성격표로 읽지 않고, M3 잠재 공간 위의 아기 상태 seed로 해석했다."
    };
  }

  function cueScore(text, cueWords) {
    const lower = text.toLowerCase();
    return cueWords.reduce((score, word) => score + (lower.includes(word.toLowerCase()) ? 0.34 : 0), 0);
  }

  function applyDevelopment(initialLatent, character, structurePrior = getPersonaStructurePrior(character)) {
    const promptText = characterText(character);
    const dims = structurePrior.latent_dimension;
    let latent = [...initialLatent];
    const logs = DEVELOPMENT_EVENTS.map(event => {
      const ranked = event.adaptations
        .map(adaptation => {
          const contextFit = cueScore(promptText, adaptation.cueWords);
          const adaptationEmbedding = fitEmbedding(adaptation.embedding, dims, adaptation.id);
          const eventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
          const latentFit = dot(latent, adaptationEmbedding) * 0.58;
          const eventFit = dot(latent, eventEmbedding) * 0.16;
          return {
            ...adaptation,
            development_score: Number((contextFit + latentFit + eventFit).toFixed(4))
          };
        })
        .sort((a, b) => b.development_score - a.development_score);
      const adaptation = ranked[0];
      const adaptationEmbedding = fitEmbedding(adaptation.embedding, dims, adaptation.id);
      const eventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
      const evidence = findEvidenceByEmbedding(promptText, adaptationEmbedding, adaptation.cueWords);
      const before = [...latent];
      const receptivity = 0.14 + Math.max(0, dot(latent, eventEmbedding)) * 0.05;
      const updated = latent.map((value, index) => {
        const inertia = value * 0.88;
        const environmentalImpact = adaptationEmbedding[index] * receptivity;
        return clamp(inertia + environmentalImpact);
      });
      latent = normalize(updated);
      return {
        model_id: MODEL_REGISTRY.persona_to_prompt_model.id,
        based_on_model: structurePrior.model_id,
        event_id: event.id,
        phase: event.phase,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: eventEmbedding,
        adaptation: adaptation.id,
        adaptation_label: adaptation.label,
        adaptation_embedding: adaptationEmbedding,
        development_score: adaptation.development_score,
        latent_before: before,
        latent_after: latent,
        prompt_evidence: evidence.text,
        prompt_evidence_score: evidence.evidence_score,
        summary: adaptation.summary,
        rationale: `프롬프트의 "${evidence.text}" 부분이 가장 크게 작용해 "${adaptation.label}" 방향의 성장 변화를 만들었다.`
      };
    });
    return { latent, logs };
  }

  function inferLatentEdges(vector) {
    const edges = [];
    for (let source = 0; source < vector.length; source += 1) {
      for (let target = source + 1; target < vector.length; target += 1) {
        const product = vector[source] * vector[target];
        edges.push({
          source: `z${source}`,
          target: `z${target}`,
          weight: clamp(Math.abs(product), 0, 1),
          relation: product >= 0 ? "co-activation" : "opposition"
        });
      }
    }
    return edges.sort((a, b) => b.weight - a.weight).slice(0, 8);
  }

  function chooseAction(event, latentVector, structurePrior, neuralModel = null) {
    const dims = latentVector.length;
    const rawEventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
    const eventEmbedding = isCompatibleModel(neuralModel, structurePrior)
      ? projectWithLayer(rawEventEmbedding, neuralModel.event_encoder)
      : rawEventEmbedding;
    const ranked = event.actions
      .map(action => {
        const rawActionEmbedding = fitEmbedding(action.embedding, dims, action.id);
        const actionEmbedding = isCompatibleModel(neuralModel, structurePrior)
          ? projectWithLayer(rawActionEmbedding, neuralModel.action_encoder)
          : rawActionEmbedding;
        const eventFit = dot(latentVector, eventEmbedding) * 0.18;
        const actionFit = dot(latentVector, actionEmbedding);
        return {
          ...action,
          event_embedding_fitted: eventEmbedding,
          embedding: actionEmbedding,
          decision_score: Number((actionFit + eventFit + action.bias).toFixed(4))
        };
      })
      .sort((a, b) => b.decision_score - a.decision_score);
    return ranked[0];
  }

  function interpretPersonaForEvent(event, latentVector, promptText, structurePrior, neuralModel = null) {
    const action = chooseAction(event, latentVector, structurePrior, neuralModel);
    const rationale = makeRationale(action, event, latentVector, promptText);
    return {
      model_id: MODEL_REGISTRY.persona_to_prompt_model.id,
      based_on_model: structurePrior.model_id,
      action,
      rationale
    };
  }

  function blendVectors(a, b, bWeight = 0.35) {
    return normalize(a.map((value, index) => value + b[index] * bWeight));
  }

  function makeRationale(action, event, latentVector, promptText) {
    const fittedEventEmbedding = fitEmbedding(event.event_embedding, action.embedding.length, event.id);
    const evidenceTarget = blendVectors(action.embedding, fittedEventEmbedding);
    const evidence = findEvidenceByEmbedding(promptText, evidenceTarget, event.tags);
    const influential = action.embedding
      .map((value, index) => ({
        key: `z${index}`,
        contribution: Number((value * latentVector[index]).toFixed(3))
      }))
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 2)
      .map(item => `${item.key} ${item.contribution >= 0 ? "+" : ""}${item.contribution}`);
    return {
      text: `프롬프트의 "${evidence.text}" 부분이 가장 크게 작용해 "${action.label}" 선택으로 기울었다.`,
      prompt_evidence: evidence.text,
      prompt_evidence_score: evidence.evidence_score,
      latent_contributors: influential
    };
  }

  function feedbackTarget(feedbackKind) {
    if (feedbackKind === "consistent") return 1;
    if (feedbackKind === "ambiguous") return 0.25;
    return -1;
  }

  function trainDeepLearningModel(model, examples, options = {}) {
    if (!model || !examples || examples.length === 0) {
      return {
        model,
        trained_examples: 0,
        epochs: 0,
        loss_history: model?.loss_history || [],
        last_loss: model?.last_loss ?? null
      };
    }
    const epochs = options.epochs ?? 18;
    const learningRate = options.learningRate ?? 0.035;
    const dims = model.latent_dimension;
    const usable = examples.filter(example =>
      example.latent_before?.length === dims && example.action_embedding?.length === dims
    );
    const lossHistory = [];
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let totalLoss = 0;
      usable.forEach(example => {
        const latent = normalize(example.latent_before);
        const rawAction = normalize(example.action_embedding);
        const projected = projectWithLayer(rawAction, model.action_encoder);
        const score = activation(dot(latent, projected));
        const target = feedbackTarget(example.feedback_signal);
        const error = target - score;
        totalLoss += error * error;
        const gradScale = learningRate * error * (1 - score * score);
        model.action_encoder.weights.forEach((row, rowIndex) => {
          row.forEach((_, colIndex) => {
            const grad = gradScale * latent[rowIndex] * rawAction[colIndex];
            model.action_encoder.weights[rowIndex][colIndex] = clamp(model.action_encoder.weights[rowIndex][colIndex] + grad, -2, 2);
          });
          model.action_encoder.bias[rowIndex] = clamp(model.action_encoder.bias[rowIndex] + gradScale * latent[rowIndex] * 0.12, -2, 2);
        });
      });
      lossHistory.push(Number((totalLoss / Math.max(1, usable.length)).toFixed(5)));
    }
    model.trained_steps += usable.length * epochs;
    model.last_loss = lossHistory.at(-1) ?? model.last_loss;
    model.loss_history = [...(model.loss_history || []), ...lossHistory].slice(-80);
    return {
      model,
      trained_examples: usable.length,
      epochs,
      loss_history: lossHistory,
      last_loss: model.last_loss
    };
  }

  function simulate(character, providedLatent, neuralModel = null) {
    const structurePrior = getPersonaStructurePrior(character);
    const compatibleModel = isCompatibleModel(neuralModel, structurePrior) ? neuralModel : null;
    const promptInterpretation = providedLatent
      ? {
          model_id: MODEL_REGISTRY.prompt_to_persona_model.id,
          based_on_model: structurePrior.model_id,
          input_prompt: character.prompt,
          prompt_fragments: splitPromptFragments(characterText(character)).slice(0, 3),
          infant_latent_persona: normalize(providedLatent.map(value => clamp(value))),
          latent_structure_edges: inferLatentEdges(normalize(providedLatent.map(value => clamp(value)))),
          neural_model_id: compatibleModel?.id || null,
          interpretation_summary: "외부에서 제공된 latent seed를 M1 출력으로 사용했다."
        }
      : interpretPromptToPersona(character, structurePrior, compatibleModel);
    const promptText = characterText(character);
    const infantLatent = promptInterpretation.infant_latent_persona;
    const development = applyDevelopment(infantLatent, character, structurePrior);
    const adultLatent = development.latent;
    const latentEdges = inferLatentEdges(adultLatent);
    const endingScores = {};
    const eventResults = EVENTS.map(event => {
      const interpretation = interpretPersonaForEvent(event, adultLatent, promptText, structurePrior, compatibleModel);
      const action = interpretation.action;
      const rationale = interpretation.rationale;
      Object.entries(action.endingWeight).forEach(([endingKey, weight]) => {
        endingScores[endingKey] = (endingScores[endingKey] || 0) + weight;
      });
      return {
        event_id: event.id,
        model_id: interpretation.model_id,
        based_on_model: interpretation.based_on_model,
        event_type: event.type,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: event.event_embedding,
        action: action.id,
        action_label: action.label,
        action_embedding: action.embedding,
        action_summary: action.outcome,
        decision_score: action.decision_score,
        rationale: rationale.text,
        prompt_evidence: rationale.prompt_evidence,
        prompt_evidence_score: rationale.prompt_evidence_score,
        latent_contributors: rationale.latent_contributors,
        outcome: action.outcome,
        ending_flag: false
      };
    });

    const endingKey = Object.entries(endingScores).sort((a, b) => b[1] - a[1])[0][0];
    const ending = { ...ENDINGS[endingKey] };
    eventResults[eventResults.length - 1].ending_flag = true;
    return {
      character_id: character.id,
      character,
      model_pipeline: {
        structure_model: MODEL_REGISTRY.persona_structure_model,
        prompt_to_persona_model: MODEL_REGISTRY.prompt_to_persona_model,
        persona_to_prompt_model: MODEL_REGISTRY.persona_to_prompt_model
      },
      persona_structure_prior: structurePrior,
      prompt_interpretation: promptInterpretation,
      neural_model_snapshot: compatibleModel ? {
        id: compatibleModel.id,
        schema_id: compatibleModel.schema_id,
        trained_steps: compatibleModel.trained_steps,
        last_loss: compatibleModel.last_loss
      } : null,
      infant_latent_persona: infantLatent,
      developmental_logs: development.logs,
      latent_persona: adultLatent,
      latent_edges: latentEdges,
      events: eventResults,
      ending,
      feedback_updates: []
    };
  }

  function scoreEnding(events) {
    const endingScores = {};
    events.forEach(event => {
      const sourceEvent = EVENTS.find(item => item.id === event.event_id);
      const sourceAction = sourceEvent?.actions.find(action => action.id === event.action);
      if (!sourceAction) return;
      Object.entries(sourceAction.endingWeight).forEach(([endingKey, weight]) => {
        endingScores[endingKey] = (endingScores[endingKey] || 0) + weight;
      });
    });
    const endingKey = Object.entries(endingScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "survivor";
    return { ...ENDINGS[endingKey] };
  }

  function simulateWorldEvents(character, latentVector, structurePrior, runLabel = "dynamic_rerun", neuralModel = null) {
    const promptText = characterText(character);
    const normalizedLatent = normalize(latentVector.map(value => clamp(value)));
    const compatibleModel = isCompatibleModel(neuralModel, structurePrior) ? neuralModel : null;
    const events = EVENTS.map(event => {
      const interpretation = interpretPersonaForEvent(event, normalizedLatent, promptText, structurePrior, compatibleModel);
      const action = interpretation.action;
      const rationale = interpretation.rationale;
      return {
        event_id: event.id,
        model_id: interpretation.model_id,
        based_on_model: interpretation.based_on_model,
        event_type: event.type,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: event.event_embedding,
        action: action.id,
        action_label: action.label,
        action_embedding: action.embedding,
        action_summary: action.outcome,
        decision_score: action.decision_score,
        rationale: rationale.text,
        prompt_evidence: rationale.prompt_evidence,
        prompt_evidence_score: rationale.prompt_evidence_score,
        latent_contributors: rationale.latent_contributors,
        outcome: action.outcome,
        ending_flag: false,
        run_label: runLabel
      };
    });
    events[events.length - 1].ending_flag = true;
    return {
      run_label: runLabel,
      neural_model_id: compatibleModel?.id || null,
      latent_persona: normalizedLatent,
      latent_edges: inferLatentEdges(normalizedLatent),
      events,
      ending: scoreEnding(events)
    };
  }

  function updateLatentWithFeedback(latentVector, actionEmbedding, feedbackKind, learningRate = 0.12) {
    const target = feedbackTarget(feedbackKind);
    const updated = latentVector.map((value, index) => {
      const delta = learningRate * target * actionEmbedding[index];
      return clamp(value + delta);
    });
    return normalize(updated);
  }

  // ─── M2 단계별 실행을 위한 함수들 ───────────────────────────────────────────
  // M2가 행동을 직접 결정하는 구조에서 사용한다.
  // PersonaEngine은 선택지(choices)와 구조 데이터를 제공하고,
  // M2가 어떤 선택지를 고를지 결정한 뒤 엔진이 latent를 업데이트한다.

  /**
   * Growth Phase 한 이벤트에 대한 M2 호출 컨텍스트를 반환한다.
   * M2는 adaptations 중 하나를 고른다.
   */
  function buildGrowthStep(event, currentLatent, structurePrior) {
    const dims = structurePrior.latent_dimension;
    const latentHighlights = currentLatent
      .map((value, index) => ({ dim: `z${index}`, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3)
      .map(({ dim, value }) =>
        `${dim}: ${value > 0 ? "+" : ""}${value.toFixed(2)} (${Math.abs(value) > 0.5 ? "강함" : "약함"}, ${value > 0 ? "양" : "음"})`
      )
      .join(", ");
    return {
      event_id: event.id,
      event_title: event.title,
      event_summary: event.summary,
      adaptations: event.adaptations.map(adaptation => ({ id: adaptation.id, label: adaptation.label })),
      latent_highlights: latentHighlights,
      dims
    };
  }

  /**
   * M2가 고른 adaptation_id를 엔진에 반영한다.
   * latent 업데이트 + log 템플릿을 반환한다.
   * summary, rationale은 M2가 제공한 값으로 채워넣는다.
   */
  function applyAdaptationResult(adaptationId, currentLatent, event, structurePrior, character) {
    const dims = structurePrior.latent_dimension;
    const adaptation = event.adaptations.find(a => a.id === adaptationId)
      || event.adaptations[0]; // fallback: 첫 번째 선택지
    const adaptationEmbedding = fitEmbedding(adaptation.embedding, dims, adaptation.id);
    const eventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
    const before = [...currentLatent];
    const receptivity = 0.14 + Math.max(0, dot(currentLatent, eventEmbedding)) * 0.05;
    const updated = currentLatent.map((value, index) => {
      const inertia = value * 0.88;
      const environmentalImpact = adaptationEmbedding[index] * receptivity;
      return clamp(inertia + environmentalImpact);
    });
    const newLatent = normalize(updated);
    const evidence = findEvidenceByEmbedding(characterText(character), adaptationEmbedding, adaptation.cueWords);
    return {
      newLatent,
      logTemplate: {
        model_id: MODEL_REGISTRY.persona_to_prompt_model.id,
        based_on_model: structurePrior.model_id,
        event_id: event.id,
        phase: event.phase,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: eventEmbedding,
        adaptation: adaptation.id,
        adaptation_label: adaptation.label,
        adaptation_embedding: adaptationEmbedding,
        latent_before: before,
        latent_after: newLatent,
        prompt_evidence: evidence.text,
        prompt_evidence_score: evidence.evidence_score
        // summary, rationale: M2가 채운다
      }
    };
  }

  /**
   * World Event 한 이벤트에 대한 M2 호출 컨텍스트를 반환한다.
   * M2는 actions 중 하나를 고른다.
   */
  function buildWorldStep(event, currentLatent) {
    const latentHighlights = currentLatent
      .map((value, index) => ({ dim: `z${index}`, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3)
      .map(({ dim, value }) =>
        `${dim}: ${value > 0 ? "+" : ""}${value.toFixed(2)} (${Math.abs(value) > 0.5 ? "강함" : "약함"}, ${value > 0 ? "양" : "음"})`
      )
      .join(", ");
    return {
      event_id: event.id,
      event_title: event.title,
      event_summary: event.summary,
      actions: event.actions.map(action => ({ id: action.id, label: action.label })),
      latent_highlights: latentHighlights
    };
  }

  /**
   * M2가 고른 action_id를 엔진에 반영한다.
   * endingWeight 누적용 데이터와 이벤트 결과 템플릿을 반환한다.
   * outcome, rationale은 M2가 제공한 값으로 채워넣는다.
   */
  function applyActionResult(actionId, currentLatent, event, structurePrior) {
    const dims = currentLatent.length;
    const action = event.actions.find(a => a.id === actionId)
      || chooseAction(event, currentLatent, structurePrior); // fallback: 룰 기반
    const actionEmbedding = fitEmbedding(action.embedding, dims, action.id);
    return {
      endingWeight: action.endingWeight,
      eventTemplate: {
        event_id: event.id,
        model_id: MODEL_REGISTRY.persona_to_prompt_model.id,
        based_on_model: structurePrior.model_id,
        event_type: event.type,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: event.event_embedding,
        action: action.id,
        action_label: action.label,
        action_embedding: actionEmbedding,
        ending_flag: false
        // outcome, rationale: M2가 채운다
      }
    };
  }

  /**
   * M2 시뮬레이션의 초기 컨텍스트를 빌드한다 (M3 + M1).
   * Growth/World 루프를 돌기 전에 호출한다.
   */
  function buildSimulationContext(character, neuralModel = null) {
    const structurePrior = getPersonaStructurePrior(character);
    const compatibleModel = isCompatibleModel(neuralModel, structurePrior) ? neuralModel : null;
    const promptInterpretation = interpretPromptToPersona(character, structurePrior, compatibleModel);
    return {
      structurePrior,
      promptInterpretation,
      infantLatent: promptInterpretation.infant_latent_persona
    };
  }

  return {
    LATENT_DIMS,
    MODEL_REGISTRY,
    DEVELOPMENT_EVENTS,
    EVENTS,
    ENDINGS,
    encodeTextToLatent,
    createTrainableModel,
    trainDeepLearningModel,
    getPersonaStructurePrior,
    interpretPromptToPersona,
    interpretPersonaForEvent,
    applyDevelopment,
    findEvidenceByEmbedding,
    inferLatentEdges,
    updateLatentWithFeedback,
    simulateWorldEvents,
    simulate,
    scoreEnding,
    buildSimulationContext,
    buildGrowthStep,
    applyAdaptationResult,
    buildWorldStep,
    applyActionResult,
    hashText
  };
});
