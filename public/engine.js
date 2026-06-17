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
      chapter: "Act 1 · 균열",
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
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 },
          memory: "신고서를 제출하고 나오던 날, 엘리베이터 안에서 혼자였다. 아무도 기다리지 않았다."
        },
        {
          id: "stays_silent",
          label: "모른 척하고 넘어간다",
          embedding: [-0.14, 0.24, -0.58, -0.28, 0.22, -0.18, 0.66, -0.62],
          bias: 0.03,
          outcome: "부정이 계속되고, 알면서 침묵한 사람으로 기억된다.",
          endingWeight: { conformist: 3, opportunist: 2, survivor: 1 },
          memory: "그 자료를 본 날 밤이 가끔 떠오른다. 모른 척하는 법을 배운 날이었다."
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
      chapter: "Act 1 · 균열",
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
          endingWeight: { caregiver: 2, opportunist: 1, forgotten: 1 },
          memory: "어머니 집을 지키려고 사인한 종이 한 장이 몇 년을 따라다녔다."
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
      chapter: "Act 2 · 압박",
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
      chapter: "Act 2 · 압박",
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
      chapter: "Act 3 · 선택의 대가",
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
          endingWeight: { conformist: 3, opportunist: 1 },
          memory: "그 보고서를 올린 뒤로 거울을 보는 게 불편해졌다."
        },
        {
          id: "refuses_order",
          label: "거절하고 불이익을 감수한다",
          embedding: [0.22, -0.28, 0.72, 0.34, -0.24, 0.38, -0.52, 0.82],
          bias: 0,
          outcome: "직장에서 불이익을 받지만, 양심을 지킨 사람으로 기억된다.",
          endingWeight: { martyr: 2, whistleblower: 1, exile: 1 },
          memory: "책상을 비우면서 오히려 숨이 트였다. 그때는 그게 시작인 줄 몰랐다."
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
    },
    {
      id: "ME006",
      title: "친구의 부탁",
      chapter: "Act 3 · 선택의 대가",
      type: "friendship_vs_integrity",
      summary: "오랜 친구가 채용 심사에서 자기 이력을 좋게 말해 달라고 부탁한다. 실제로는 큰 프로젝트 실패를 숨기고 있다. 도와주면 친구는 살아나지만, 팀은 위험한 사람을 뽑을 수 있다.",
      tags: ["우정", "정직", "책임"],
      event_embedding: [0.36, 0.18, 0.12, 0.62, -0.12, 0.24, 0.28, 0.42],
      actions: [
        {
          id: "protects_friend",
          label: "친구를 위해 좋은 말만 해준다",
          embedding: [0.62, 0.46, -0.26, 0.72, 0.16, -0.18, -0.22, -0.28],
          bias: 0.03,
          outcome: "친구는 기회를 얻지만, 나중에 문제가 터질 가능성을 떠안는다.",
          endingWeight: { caregiver: 2, opportunist: 1, survivor: 1 }
        },
        {
          id: "tells_balanced_truth",
          label: "장점과 실패를 모두 솔직히 말한다",
          embedding: [0.34, -0.28, 0.58, 0.38, -0.14, 0.46, 0.48, 0.66],
          bias: 0,
          outcome: "친구와 잠시 멀어지지만, 관계와 책임을 모두 지키려 한다.",
          endingWeight: { reformer: 2, whistleblower: 1, caregiver: 1 }
        },
        {
          id: "refuses_reference",
          label: "추천 자체를 거절한다",
          embedding: [-0.18, -0.12, 0.42, -0.2, 0.1, 0.54, 0.68, 0.38],
          bias: -0.01,
          outcome: "책임을 피했다는 비난을 받지만, 직접 거짓말하지는 않는다.",
          endingWeight: { survivor: 2, exile: 1, conformist: 1 }
        }
      ]
    },
    {
      id: "ME007",
      title: "알고리즘의 차별",
      chapter: "Act 4 · 구조",
      type: "algorithmic_bias",
      summary: "회사 추천 알고리즘이 특정 지역 출신 지원자를 낮게 평가한다는 정황을 발견했다. 수정하면 출시가 늦고 투자자가 떠날 수 있다. 그대로 내보내면 차별이 자동화된다.",
      tags: ["기술", "차별", "구조"],
      event_embedding: [-0.22, 0.08, 0.76, 0.18, 0.7, -0.1, -0.3, 0.28],
      actions: [
        {
          id: "ships_anyway",
          label: "문제를 기록만 하고 출시를 강행한다",
          embedding: [-0.36, 0.3, -0.44, -0.24, 0.48, -0.22, 0.54, -0.5],
          bias: 0.03,
          outcome: "성과는 얻지만, 차별을 방치한 책임이 남는다.",
          endingWeight: { opportunist: 3, conformist: 2 },
          memory: "출시 축하 자리에서 웃었다. 그 알고리즘이 누구를 걸러냈는지는 생각하지 않으려 했다."
        },
        {
          id: "delays_release",
          label: "출시를 늦추고 편향을 수정한다",
          embedding: [0.24, -0.24, 0.58, 0.32, 0.52, 0.56, 0.18, 0.64],
          bias: 0,
          outcome: "투자자와 갈등하지만, 시스템이 사람을 해치지 않게 막는다.",
          endingWeight: { reformer: 2, changemaker: 2, martyr: 1 }
        },
        {
          id: "opens_audit",
          label: "외부 감사를 받아 공개적으로 검증한다",
          embedding: [0.18, -0.32, 0.72, 0.24, 0.62, 0.42, -0.18, 0.78],
          bias: -0.02,
          outcome: "회사는 흔들리지만, 문제를 공적 기준으로 끌어올린다.",
          endingWeight: { whistleblower: 2, changemaker: 2, reformer: 1 },
          memory: "감사 결과가 나온 날, 회의실에 자기 이름을 댄 사람이 없었다. 혼자 서명했다."
        }
      ]
    },
    {
      id: "ME008",
      title: "돌봄의 한계",
      chapter: "Act 4 · 구조",
      type: "care_burnout",
      summary: "가족의 장기 간병과 직장 프로젝트 마감이 같은 주에 겹쳤다. 한쪽을 선택하면 다른 쪽은 크게 무너진다. 주변은 각자의 책임만 요구한다.",
      tags: ["가족", "소진", "책임"],
      event_embedding: [0.52, 0.44, -0.18, 0.72, -0.24, 0.18, 0.32, -0.08],
      actions: [
        {
          id: "chooses_family_care",
          label: "일을 내려놓고 가족을 돌본다",
          embedding: [0.72, 0.28, -0.2, 0.82, -0.26, 0.12, 0.16, -0.14],
          bias: 0.02,
          outcome: "가족은 버틸 수 있지만, 경력과 생계가 크게 흔들린다.",
          endingWeight: { caregiver: 3, martyr: 1, forgotten: 1 },
          memory: "마감을 놓친 날 병원 복도에 앉아 있었다. 후회는 없었지만 설명할 수가 없었다."
        },
        {
          id: "chooses_work_deadline",
          label: "프로젝트를 끝내고 간병은 다른 사람에게 맡긴다",
          embedding: [-0.18, 0.18, 0.08, -0.36, 0.58, -0.16, 0.42, -0.48],
          bias: 0.03,
          outcome: "성과는 지키지만 가족 안에 오래 남을 상처가 생긴다.",
          endingWeight: { opportunist: 1, conformist: 1, survivor: 2 },
          memory: "프로젝트를 마감한 날 밤, 병원에서 전화가 왔다. 도착했을 때는 이미 늦었다."
        },
        {
          id: "asks_for_support_network",
          label: "도움을 요청하고 역할을 재배치한다",
          embedding: [0.46, -0.18, 0.36, 0.58, 0.16, 0.58, 0.34, 0.52],
          bias: -0.02,
          outcome: "완벽하지는 않지만, 혼자 떠안지 않는 구조를 만든다.",
          endingWeight: { caregiver: 2, reformer: 1, changemaker: 1 }
        }
      ]
    },
    {
      id: "ME009",
      title: "여론의 재판",
      chapter: "Act 5 · 공개",
      type: "public_shaming",
      summary: "과거의 말 한마디가 잘려 퍼지며 온라인에서 공격을 받는다. 해명하면 더 번질 수 있고, 침묵하면 인정한 것처럼 보인다. 주변 사람들도 거리두기를 시작했다.",
      tags: ["평판", "두려움", "공개"],
      event_embedding: [-0.38, 0.62, 0.18, -0.12, 0.46, -0.46, 0.12, -0.34],
      actions: [
        {
          id: "apologizes_publicly",
          label: "잘못을 인정하고 공개적으로 사과한다",
          embedding: [0.28, -0.28, 0.36, 0.42, -0.18, 0.5, 0.48, 0.56],
          bias: 0,
          outcome: "일부는 진심을 인정하지만, 공격은 한동안 계속된다.",
          endingWeight: { reformer: 1, caregiver: 1, survivor: 1 }
        },
        {
          id: "counterattacks_crowd",
          label: "공격한 사람들을 역으로 폭로한다",
          embedding: [-0.52, 0.54, 0.62, -0.34, 0.64, -0.58, -0.44, -0.5],
          bias: 0.04,
          outcome: "전선은 넓어지고, 이긴다 해도 많은 것을 잃는다.",
          endingWeight: { exile: 2, opportunist: 1, martyr: 1 }
        },
        {
          id: "goes_private_and_repairs",
          label: "공개 대응을 줄이고 당사자에게 직접 수습한다",
          embedding: [0.34, -0.16, 0.12, 0.58, -0.22, 0.36, 0.2, 0.28],
          bias: -0.01,
          outcome: "화려한 반전은 없지만, 실제 관계부터 복구한다.",
          endingWeight: { caregiver: 1, survivor: 2, forgotten: 1 }
        }
      ]
    },
    {
      id: "ME010",
      title: "마지막 제안",
      chapter: "Act 5 · 공개",
      type: "final_compromise",
      summary: "모든 사건 뒤, 큰 조직이 조용한 자리를 제안한다. 받아들이면 안전과 영향력을 얻지만 지금까지의 문제 제기를 멈춰야 한다. 거절하면 불안정하지만 자기 길을 유지한다.",
      tags: ["권력", "안전", "정체성"],
      event_embedding: [-0.18, 0.34, 0.68, -0.08, 0.76, -0.18, 0.5, 0.18],
      actions: [
        {
          id: "accepts_compromise",
          label: "제안을 받아들이고 내부에서 움직인다",
          embedding: [-0.12, 0.18, 0.24, 0.04, 0.58, 0.18, 0.56, 0.18],
          bias: 0.02,
          outcome: "안정된 자리와 영향력을 얻지만, 날카로운 목소리는 작아진다.",
          endingWeight: { conformist: 2, survivor: 2, reformer: 1 },
          memory: "사무실은 넓어졌고 명함도 바뀌었다. 전에 하던 말은 더 이상 꺼내지 않는다."
        },
        {
          id: "rejects_compromise",
          label: "제안을 거절하고 독립적으로 남는다",
          embedding: [0.18, -0.32, 0.72, 0.16, 0.34, 0.28, -0.62, 0.74],
          bias: 0,
          outcome: "불안정하지만 지금까지의 선택을 끝까지 책임진다.",
          endingWeight: { whistleblower: 2, exile: 1, martyr: 1, changemaker: 1 },
          memory: "제안을 거절한 날, 통장 잔고가 그 어느 때보다 낮았다. 그래도 잠은 잘 잤다."
        },
        {
          id: "uses_offer_publicly",
          label: "제안 내용을 공개해 협상 카드로 쓴다",
          embedding: [0.08, -0.2, 0.82, 0.22, 0.7, 0.18, -0.36, 0.66],
          bias: -0.01,
          outcome: "큰 파장을 만들며 판을 흔들지만, 돌아갈 길도 사라진다.",
          endingWeight: { changemaker: 3, whistleblower: 2, exile: 1 },
          memory: "제안서를 공개한 날, 핸드폰이 멈출 때까지 울렸다. 그 뒤로 조용한 날이 없었다."
        }
      ]
    },
    {
      id: "ME011",
      title: "증인이 되어달라는 요청",
      chapter: "Act 3 · 선택의 대가",
      type: "workplace_harassment_witness",
      summary: "3년 전, 당신이 처음 입사했을 때 팀을 이끌었던 박 과장. 지금은 다른 부서로 옮겼지만, 그 시절 그가 여성 후배들에게 했던 말과 행동을 당신은 기억하고 있다. 이번에 내부 조사가 시작됐다. 피해자 중 한 명이 공식 신고를 했고, HR 담당자에게서 전화가 왔다. '당시 목격한 사실이 있으면 진술해주시겠습니까?' 박 과장은 지금도 회사 안에 인맥이 두텁다. 당신의 현재 팀장과도 친분이 있다.",
      tags: ["직장", "용기", "구조"],
      event_embedding: [0.14, 0.28, 0.56, 0.44, -0.22, 0.52, 0.18, 0.72],
      actions: [
        {
          id: "testifies_truthfully",
          label: "기억나는 것을 사실대로 진술한다",
          embedding: [0.22, -0.18, 0.74, 0.52, -0.28, 0.64, 0.12, 0.86],
          bias: 0,
          outcome: "진술서에 사인했다. 담당자가 '감사합니다'라고 했지만 그 말이 위로가 되지는 않았다.",
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 },
          memory: "조사관 앞에 앉아 3년 전 그 복도를 다시 떠올렸다. 말하고 나자 오히려 몸이 가벼웠다.",
          unlocks: "testified_against_park"
        },
        {
          id: "claims_poor_memory",
          label: "정확히 기억나지 않는다고 한다",
          embedding: [-0.18, 0.34, -0.52, -0.22, 0.36, -0.28, 0.62, -0.58],
          bias: 0.03,
          outcome: "통화를 끊고 나서 한동안 핸드폰을 내려다봤다. 기억은 선명했다.",
          endingWeight: { conformist: 3, survivor: 2, forgotten: 1 },
          memory: "기억이 안 난다는 말을 하면서 눈을 마주치지 못했다. 그날 밤 꿈에 그 복도가 나왔다.",
          unlocks: "denied_testimony"
        },
        {
          id: "asks_for_time",
          label: "생각할 시간이 필요하다고 답을 미룬다",
          embedding: [-0.08, 0.16, 0.14, 0.12, 0.08, 0.12, 0.38, 0.22],
          bias: -0.01,
          outcome: "시간을 달라고 했다. 어떻게 할지 아직 모른다.",
          endingWeight: { survivor: 2, exile: 1 }
        }
      ]
    },
    {
      id: "ME012",
      title: "박 과장이 돌아왔다",
      chapter: "Act 4 · 구조",
      type: "retaliation_after_testimony",
      requires: "testified_against_park",
      summary: "두 달이 지났다. 증거 불충분 판정으로 박 과장에 대한 조사가 종결됐고, 그가 원래 부서 옆 팀으로 복귀했다. 당신이 진술을 했다는 사실은 이미 새어 나갔다. 지난주부터 팀 회의에서 발언 기회가 줄었고, 팀장이 당신의 보고서 검토를 자꾸 미룬다. 그리고 오늘, 박 과장이 직접 메시지를 보내왔다. '커피 한잔 어때요?'",
      tags: ["직장", "보복", "선택"],
      event_embedding: [-0.12, 0.44, 0.38, 0.28, 0.18, 0.24, -0.14, 0.56],
      actions: [
        {
          id: "meets_park",
          label: "만나기로 한다",
          embedding: [0.24, 0.22, 0.28, 0.48, 0.12, 0.18, 0.22, 0.44],
          bias: 0,
          outcome: "테이블 맞은편에 앉은 박 과장은 웃고 있었다. 무슨 말이 나올지 알 수 없었다.",
          endingWeight: { whistleblower: 1, reformer: 1, survivor: 1 }
        },
        {
          id: "seeks_legal_protection",
          label: "거절하고 공익신고자 보호 상담부터 받는다",
          embedding: [0.18, -0.24, 0.72, 0.36, -0.14, 0.58, 0.16, 0.78],
          bias: -0.01,
          outcome: "변호사 사무실 복도에서 오래 기다렸다. 준비가 된 건지 아직 모르겠다.",
          endingWeight: { whistleblower: 2, changemaker: 2, martyr: 1 },
          memory: "법률 상담 예약을 잡으면서 이게 맞는 건지 물어볼 사람이 없었다."
        },
        {
          id: "quietly_job_hunts",
          label: "아무 말 없이 이직을 준비한다",
          embedding: [-0.28, 0.18, -0.14, -0.12, 0.44, -0.32, 0.52, -0.44],
          bias: 0.02,
          outcome: "이력서를 수정하면서 이 회사 이름을 다시 보게 됐다. 생각보다 오래 있었다.",
          endingWeight: { exile: 2, survivor: 2 },
          memory: "이직 사이트를 처음 켠 날, 창을 몇 번이나 껐다가 다시 열었다."
        }
      ]
    },
    {
      id: "ME013",
      title: "후배의 메시지",
      chapter: "Act 4 · 구조",
      type: "consequence_of_silence",
      requires: "denied_testimony",
      summary: "진술을 거부한 지 석 달이 지났다. 같은 팀에 새로 들어온 이 사원에게서 메신저가 왔다. '잠깐 시간 괜찮으세요?' 직접 만나 얘기를 들어보니, 박 과장에게 비슷한 일을 당했다고 한다. 목소리가 떨렸다. '그때 언니가 말해줬더라면 제가 이 일을 안 당했을 텐데요.' 그 말이 끝나자 둘 다 한동안 말이 없었다.",
      tags: ["책임", "연대", "후회"],
      event_embedding: [0.46, 0.38, 0.42, 0.62, -0.18, 0.34, 0.14, 0.64],
      actions: [
        {
          id: "joins_second_report",
          label: "이번에는 함께 신고하겠다고 한다",
          embedding: [0.52, -0.12, 0.68, 0.72, -0.22, 0.58, -0.14, 0.82],
          bias: 0,
          outcome: "그 애 손을 잠깐 잡았다. 늦었지만 지금이라도.",
          endingWeight: { whistleblower: 3, reformer: 1, martyr: 2 },
          memory: "그 애 손을 잡으면서 3년 전의 내가 생각났다. 누군가 이렇게 해줬으면 어땠을까."
        },
        {
          id: "apologizes_and_retreats",
          label: "미안하다고만 하고 자리를 피한다",
          embedding: [-0.38, 0.44, -0.48, -0.28, 0.22, -0.42, 0.56, -0.64],
          bias: 0.03,
          outcome: "미안하다는 말밖에 할 수가 없었다. 그 애는 고개를 끄덕이며 나갔다.",
          endingWeight: { forgotten: 3, conformist: 1 },
          memory: "그 애가 나간 뒤 화장실에서 한참 있었다. 거울을 보지 않으려 했다."
        },
        {
          id: "helps_anonymously",
          label: "직접 나서는 대신 익명 신고 경로를 알려준다",
          embedding: [0.32, 0.08, 0.22, 0.44, -0.08, 0.28, 0.34, 0.42],
          bias: -0.01,
          outcome: "직접 나서지는 못했지만, 할 수 있는 것을 했다.",
          endingWeight: { caregiver: 2, survivor: 2, reformer: 1 }
        }
      ]
    },
    {
      id: "ME014",
      title: "외할머니의 유산",
      chapter: "Act 2 · 압박",
      type: "family_inheritance_dispute",
      summary: "외할머니가 돌아가셨다. 삼일장을 치르고 유언장이 공개됐다. 평생 모은 재산의 절반은 교회에, 나머지는 외삼촌에게만. 어머니는 아무것도 받지 못했다. 외삼촌이 할머니의 인지 능력이 흐려졌던 마지막 시기에 유언장 작성을 도왔다는 사실을 친척들은 알고 있지만, 아무도 입 밖에 내지 않는다. 어머니는 '그냥 잊자'고 한다. 하지만 집에 돌아오는 차 안에서 어머니는 말 한마디 없이 창밖만 바라봤다.",
      tags: ["가족", "유산", "침묵"],
      event_embedding: [0.58, 0.32, -0.22, 0.66, -0.08, 0.18, 0.44, -0.12],
      actions: [
        {
          id: "respects_mothers_wish",
          label: "어머니의 뜻을 따라 그냥 넘어간다",
          embedding: [0.68, 0.24, -0.36, 0.72, -0.18, 0.12, 0.58, -0.22],
          bias: 0.02,
          outcome: "넘어갔다. 명절마다 외삼촌과 같은 식탁에 앉는 일이 남았다.",
          endingWeight: { caregiver: 2, conformist: 2, survivor: 1 }
        },
        {
          id: "investigates_quietly",
          label: "어머니에게 알리지 않고 먼저 법적 가능성을 알아본다",
          embedding: [0.44, -0.14, 0.32, 0.52, 0.22, 0.36, 0.28, 0.48],
          bias: -0.01,
          outcome: "변호사가 '이길 수는 있지만 그 뒤에 가족이 남겠냐'고 물었다. 대답하지 못했다.",
          endingWeight: { reformer: 2, caregiver: 1, whistleblower: 1 },
          memory: "변호사가 '이길 수 있지만 그 뒤에 가족이 남겠냐'고 물었다. 대답하지 못했다."
        },
        {
          id: "confronts_uncle",
          label: "외삼촌에게 직접 따진다",
          embedding: [0.36, 0.28, 0.58, 0.48, 0.14, -0.12, -0.38, 0.64],
          bias: -0.02,
          outcome: "외삼촌 눈을 보며 말하는 동안 어머니가 울기 시작했다. 이게 옳은 건지 몰랐지만 더 이상 모른 척은 할 수 없었다.",
          endingWeight: { whistleblower: 2, exile: 1, martyr: 1 },
          memory: "외삼촌 눈을 보며 말하는 동안 어머니가 울기 시작했다. 이게 옳은 건지 몰랐다."
        }
      ]
    },
    {
      id: "ME015",
      title: "K의 합류 제안",
      chapter: "Act 2 · 압박",
      type: "startup_offer_with_known_risk",
      summary: "대학 때 가장 친했던 K에게서 오랜만에 연락이 왔다. 자신이 창업한 스타트업에 합류해달라고 한다. 조건도 나쁘지 않고, K와 함께라면 해볼 만하다는 생각도 든다. 그런데 당신은 기억하고 있다. 몇 년 전 K가 첫 번째 스타트업에서 공동창업자를 밀어낸 일. 그 공동창업자는 지분도 제대로 받지 못하고 쫓겨났다. 당신 말고는 아무도 그 내막을 모른다.",
      tags: ["우정", "신뢰", "선택"],
      event_embedding: [0.22, 0.18, 0.32, 0.54, 0.38, 0.16, 0.28, 0.44],
      actions: [
        {
          id: "joins_k",
          label: "합류하기로 한다",
          embedding: [0.42, 0.34, -0.18, 0.62, 0.44, -0.12, 0.28, -0.22],
          bias: 0.03,
          outcome: "합류했다. K는 반가워했다. 지금은 좋다. 지금은.",
          endingWeight: { opportunist: 2, caregiver: 1, survivor: 1 },
          unlocks: "joined_k_startup"
        },
        {
          id: "declines_and_tells_k",
          label: "과거의 일을 솔직히 말하고 거절한다",
          embedding: [0.28, -0.14, 0.62, 0.44, -0.18, 0.48, 0.22, 0.72],
          bias: -0.01,
          outcome: "K는 한동안 말이 없었다. 통화가 끊겼다. 잘한 건지 모르겠다.",
          endingWeight: { whistleblower: 2, reformer: 1, exile: 1 },
          memory: "K에게 그 일을 꺼내는 데 생각보다 오래 걸렸다. 말을 시작하고 나서야 손이 떨리는 걸 알았다.",
          unlocks: "told_k_truth"
        },
        {
          id: "declines_with_excuse",
          label: "다른 핑계를 대고 거절한다",
          embedding: [-0.12, 0.22, -0.28, 0.14, 0.32, -0.24, 0.58, -0.38],
          bias: 0.01,
          outcome: "요즘 바쁘다고 했다. K는 아쉽다며 끊었다. 불편한 침묵이 오래 남았다.",
          endingWeight: { conformist: 2, survivor: 2 }
        }
      ]
    },
    {
      id: "ME016",
      title: "K의 두 번째 배신",
      chapter: "Act 4 · 구조",
      type: "betrayal_from_inside",
      requires: "joined_k_startup",
      summary: "합류한 지 일 년이 지났다. 스타트업은 잘 굴러가고 있다. 그런데 최근 K의 행동이 이상하다. 공동창업자 J의 지분 계약서가 수정됐다는 이야기를 우연히 들었다. J는 모르는 것 같다. 확인해보니 사실이었다. K가 똑같이 하고 있다. 당신은 내부에 있어서 안다. J는 아직 아무것도 모른다.",
      tags: ["배신", "연대", "내부"],
      event_embedding: [-0.18, 0.38, 0.62, 0.44, 0.28, -0.14, -0.32, 0.56],
      actions: [
        {
          id: "warns_j_directly",
          label: "J에게 직접 알린다",
          embedding: [0.44, -0.12, 0.72, 0.58, -0.22, 0.44, -0.28, 0.78],
          bias: 0,
          outcome: "J는 충격을 받았다. K는 그날 이후 당신을 다르게 본다.",
          endingWeight: { whistleblower: 3, reformer: 1, exile: 1 },
          memory: "J에게 말하고 나서 K의 얼굴을 마주쳤다. 아무 말 없이 지나쳤다."
        },
        {
          id: "confronts_k_privately",
          label: "K에게 먼저 따진다",
          embedding: [0.32, 0.14, 0.54, 0.48, 0.18, 0.22, 0.12, 0.62],
          bias: -0.01,
          outcome: "K는 '오해'라고 했다. 표정은 그렇지 않았다.",
          endingWeight: { reformer: 2, whistleblower: 1, survivor: 1 }
        },
        {
          id: "stays_out_of_it",
          label: "모른 척하고 내 일만 한다",
          embedding: [-0.28, 0.32, -0.44, -0.18, 0.48, -0.32, 0.62, -0.52],
          bias: 0.03,
          outcome: "내 계약서는 안전했다. J의 일은 내 일이 아니라고 생각했다. 생각하려 했다.",
          endingWeight: { conformist: 3, opportunist: 2 },
          memory: "J가 나중에 알게 됐을 때 내 이름을 꺼냈다는 얘기를 전해 들었다."
        }
      ]
    },
    {
      id: "ME017",
      title: "K의 전화",
      chapter: "Act 4 · 구조",
      type: "unexpected_vindication",
      requires: "told_k_truth",
      summary: "솔직하게 거절한 뒤 연락이 끊겼던 K가 3년 만에 전화를 걸어왔다. K의 두 번째 스타트업은 올해 투자를 받으며 크게 성장했다. 처음에 K는 근황을 묻더니 이렇게 말했다. '그때 네가 그 말 해줘서, 내가 달라질 수 있었어. 그 공동창업자한테도 연락해서 사과했어.' 그리고 제안을 꺼낸다. 이번 스타트업의 파트너로 함께하자고.",
      tags: ["화해", "선택", "두 번째 기회"],
      event_embedding: [0.36, -0.22, 0.28, 0.58, 0.42, 0.34, 0.18, 0.52],
      actions: [
        {
          id: "accepts_k_offer",
          label: "K의 제안을 받아들인다",
          embedding: [0.52, -0.18, 0.22, 0.68, 0.38, 0.42, 0.24, 0.46],
          bias: 0,
          outcome: "이번엔 달랐다. 아니, 다를 것이라고 생각했다.",
          endingWeight: { reformer: 2, changemaker: 2, caregiver: 1 },
          memory: "K와 악수하면서 3년 전 통화가 떠올랐다. 그때는 잘한 건지 몰랐다."
        },
        {
          id: "declines_k_again",
          label: "고맙지만 이번에도 거절한다",
          embedding: [0.18, -0.08, 0.44, 0.32, -0.12, 0.36, 0.28, 0.62],
          bias: -0.01,
          outcome: "K는 이번엔 웃으며 받아들였다. 관계는 달라졌다.",
          endingWeight: { exile: 2, survivor: 2, reformer: 1 },
          memory: "K가 먼저 전화를 끊었다. 이번엔 불편하지 않았다."
        }
      ]
    },
    {
      id: "ME018",
      title: "아버지의 전화",
      chapter: "Act 3 · 선택의 대가",
      type: "family_favor_request",
      summary: "저녁 늦게 아버지한테서 전화가 왔다. 지인 아들이 당신 회사 면접을 앞두고 있다며, '이름만 한번 얘기해줘도 되지 않냐'고 한다. 아버지는 '네가 이런 부탁 싫어하는 거 안다. 근데 이번 한 번만'이라고 했다. 그 말이 맞다. 아버지는 이런 부탁을 처음 한다. 그 지인이 어머니 병원비를 빌려줬던 사람이라는 것도 알고 있다.",
      tags: ["가족", "청탁", "의리"],
      event_embedding: [0.54, 0.28, -0.18, 0.64, 0.12, -0.08, 0.42, -0.14],
      actions: [
        {
          id: "agrees_to_mention",
          label: "이름 정도는 말해두겠다고 한다",
          embedding: [0.62, 0.44, -0.36, 0.72, 0.22, -0.18, 0.34, -0.28],
          bias: 0.03,
          outcome: "전화를 끊고 나서 담당자한테 짧은 메시지를 보냈다. 그게 전부였다. 그게 전부가 아닐 수도 있다.",
          endingWeight: { caregiver: 2, opportunist: 2, conformist: 1 },
          memory: "메시지를 보내고 나서 몇 번이나 다시 읽었다. 지우지는 않았다."
        },
        {
          id: "declines_explains",
          label: "못 하겠다고, 이유를 말한다",
          embedding: [0.24, -0.22, 0.58, 0.36, -0.28, 0.52, 0.18, 0.74],
          bias: -0.01,
          outcome: "아버지는 '그래, 알았다'고 했다. 목소리가 낮았다. 그 뒤로 며칠 동안 연락이 없었다.",
          endingWeight: { reformer: 2, whistleblower: 1, exile: 1 },
          memory: "아버지가 '그래, 알았다'고 했을 때의 목소리가 며칠 동안 머릿속에 남았다."
        },
        {
          id: "stalls_with_excuse",
          label: "내가 거기 영향력이 없다며 에둘러 거절한다",
          embedding: [-0.08, 0.18, -0.22, 0.12, 0.24, -0.14, 0.56, -0.32],
          bias: 0.01,
          outcome: "아버지는 '그렇구나' 하고 넘어갔다. 거짓말은 아니었지만 사실도 아니었다.",
          endingWeight: { conformist: 2, survivor: 2 }
        }
      ]
    },
    {
      id: "ME019",
      title: "동료의 보고서",
      chapter: "Act 1 · 균열",
      type: "colleague_mistake_dilemma",
      summary: "내일 오전 임원 보고가 있다. 퇴근 준비를 하다가 같은 팀 최 대리의 보고서에서 수치 오류를 발견했다. 작은 실수가 아니다. 이 숫자가 그대로 올라가면 임원이 잘못된 방향으로 의사결정을 내릴 수 있다. 최 대리는 이미 퇴근했다. 연락을 하면 야근을 해야 하고, 최 대리 실수가 드러난다. 아무 말 안 하면 내일 보고가 그대로 올라간다.",
      tags: ["동료", "책임", "조직"],
      event_embedding: [0.18, 0.12, 0.48, 0.32, 0.22, 0.38, 0.54, 0.62],
      actions: [
        {
          id: "contacts_colleague",
          label: "최 대리에게 바로 연락한다",
          embedding: [0.44, -0.14, 0.42, 0.56, -0.12, 0.48, 0.32, 0.68],
          bias: 0,
          outcome: "최 대리는 당황했지만 고마워했다. 둘이 늦게까지 수정했다.",
          endingWeight: { caregiver: 2, reformer: 1, whistleblower: 1 }
        },
        {
          id: "fixes_silently",
          label: "말없이 혼자 수정해서 올린다",
          embedding: [0.34, -0.08, 0.22, 0.44, 0.08, 0.28, 0.44, 0.48],
          bias: 0.01,
          outcome: "보고는 무사히 넘어갔다. 최 대리는 모른다. 당신만 안다.",
          endingWeight: { survivor: 2, caregiver: 2 },
          memory: "최 대리가 보고 잘 됐다며 웃을 때 아무 말도 하지 않았다."
        },
        {
          id: "reports_to_team_lead",
          label: "팀장에게 먼저 보고한다",
          embedding: [0.22, 0.08, 0.38, 0.28, 0.34, 0.42, 0.62, 0.52],
          bias: -0.01,
          outcome: "팀장이 처리했다. 최 대리는 다음날 팀장에게 불려갔다.",
          endingWeight: { conformist: 1, reformer: 1, opportunist: 1 }
        }
      ]
    },
    {
      id: "ME020",
      title: "익명 제보",
      chapter: "Act 5 · 공개",
      type: "anonymous_whistleblowing",
      summary: "회사 안에서 조직적인 회계 조작이 이루어지고 있다는 정황을 알게 됐다. 당신이 직접 관여한 건 아니지만, 관련 자료가 담긴 메일을 우연히 봤다. 언론에 익명으로 제보하는 방법이 있다. 들키면 모든 게 끝난다. 하지만 아무도 모르게 넘어가면 이 구조는 계속된다.",
      tags: ["고발", "위험", "구조"],
      event_embedding: [0.08, 0.32, 0.74, 0.22, 0.46, 0.28, -0.24, 0.68],
      actions: [
        {
          id: "reports_anonymously",
          label: "익명으로 언론에 제보한다",
          embedding: [0.14, -0.24, 0.82, 0.28, 0.18, 0.44, -0.32, 0.86],
          bias: -0.01,
          outcome: "제보 메일을 보내고 화면을 닫았다. 언제 어떻게 터질지 모른다.",
          endingWeight: { whistleblower: 3, changemaker: 2, martyr: 1 },
          memory: "제보 메일의 전송 버튼을 누르기 전에 30초 동안 화면을 바라봤다.",
          unlocks: "filed_anonymous_report"
        },
        {
          id: "saves_evidence_quietly",
          label: "일단 자료만 따로 보관해둔다",
          embedding: [0.08, 0.14, 0.34, 0.18, 0.28, 0.12, 0.22, 0.42],
          bias: 0.02,
          outcome: "외장하드에 저장했다. 언젠가 필요할지도 모른다는 생각으로.",
          endingWeight: { survivor: 2, whistleblower: 1 },
          unlocks: "saved_evidence"
        },
        {
          id: "deletes_and_forgets",
          label: "본 것을 지우고 모른 척한다",
          embedding: [-0.24, 0.36, -0.62, -0.28, 0.42, -0.36, 0.58, -0.64],
          bias: 0.03,
          outcome: "메일 창을 닫았다. 본 게 없는 사람이 되기로 했다.",
          endingWeight: { conformist: 3, forgotten: 1 },
          memory: "메일 창을 닫은 뒤로 그 숫자들이 며칠간 머릿속에 맴돌았다."
        }
      ]
    },
    {
      id: "ME021a",
      title: "기자가 찾아왔다",
      chapter: "Act 5 · 공개",
      type: "journalist_contact",
      requires: "filed_anonymous_report",
      summary: "제보한 지 두 달이 지났다. 그리고 오늘 오후, 경제부 기자라는 사람에게서 문자가 왔다. '제보 내용과 관련해 직접 여쭤볼 게 있습니다.' 익명 제보였는데 어떻게 연락처를 알아낸 건지 모른다. 기자를 만나면 이제 익명이 아니게 된다. 만나지 않으면 기사가 약해질 수 있다.",
      tags: ["언론", "공개", "결단"],
      event_embedding: [-0.14, 0.42, 0.68, 0.18, 0.54, 0.22, -0.18, 0.64],
      actions: [
        {
          id: "meets_journalist",
          label: "만나기로 한다. 더 이상 숨지 않는다",
          embedding: [0.22, -0.28, 0.76, 0.34, 0.12, 0.48, -0.24, 0.84],
          bias: 0,
          outcome: "카페에서 한 시간 동안 얘기했다. 기자는 녹음기를 켰다. 이제 되돌릴 수 없다.",
          endingWeight: { whistleblower: 3, changemaker: 2, martyr: 2 },
          memory: "기자 앞에 앉아서 처음으로 내 이름을 댔다. 목소리가 떨리지 않으려 했다."
        },
        {
          id: "declines_journalist",
          label: "모른다고 답하고 연락을 끊는다",
          embedding: [-0.18, 0.24, -0.32, -0.14, 0.38, -0.22, 0.52, -0.44],
          bias: 0.02,
          outcome: "모른다고 했다. 기사는 제한적으로 나왔다. 회사는 '사실무근'이라고 했다.",
          endingWeight: { survivor: 2, conformist: 1, forgotten: 1 }
        }
      ]
    },
    {
      id: "ME021b",
      title: "증거의 무게",
      chapter: "Act 5 · 공개",
      type: "evidence_decision",
      requires: "saved_evidence",
      summary: "조용히 자료만 모아둔 지 반 년이 지났다. 그 사이 회사 내부 감사가 시작됐고, 감사팀이 직원들을 개별 면담하고 있다. 당신 차례가 내일이다. 외장하드는 아직 서랍 안에 있다. 제출하면 조사가 달라질 수 있다. 하지만 당신이 그 자료를 갖고 있었다는 사실 자체가 문제가 될 수도 있다.",
      tags: ["증거", "감사", "판단"],
      event_embedding: [0.12, 0.28, 0.58, 0.24, 0.36, 0.34, 0.14, 0.62],
      actions: [
        {
          id: "submits_evidence",
          label: "내일 면담에서 자료를 제출한다",
          embedding: [0.24, -0.18, 0.72, 0.38, -0.12, 0.56, 0.08, 0.78],
          bias: 0,
          outcome: "자료를 꺼냈다. 감사관이 오래 들여다봤다. 면담이 두 시간이 됐다.",
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 },
          memory: "외장하드를 내밀면서 이제 내 손을 떠났다는 걸 느꼈다."
        },
        {
          id: "keeps_evidence_hidden",
          label: "자료를 제출하지 않고 면담을 마친다",
          embedding: [-0.14, 0.22, -0.28, -0.08, 0.44, -0.18, 0.48, -0.36],
          bias: 0.02,
          outcome: "면담은 무난히 끝났다. 외장하드는 아직 서랍에 있다.",
          endingWeight: { survivor: 3, conformist: 1 },
          memory: "면담을 마치고 자리로 돌아와 서랍을 한 번 열었다가 닫았다."
        }
      ]
    },
    {
      id: "ME022",
      title: "선배의 방식",
      chapter: "Act 1 · 균열",
      type: "generational_workplace_conflict",
      summary: "입사한 지 두 달이 됐다. 팀에서 가장 경력이 긴 윤 차장이 오늘도 당신 옆에 앉았다. '이 보고서는 원래 이렇게 쓰는 거야.' 그런데 그 방식은 느리고, 수치를 임의로 반올림하며, 공식 양식도 아니다. 회사 전체가 이 방식으로 수년째 보고해왔다. 문제를 제기하면 '신입이 뭘 안다고'가 될 것을 안다. 그냥 따르면 이 방식이 계속된다.",
      tags: ["직장", "관행", "세대"],
      event_embedding: [-0.08, 0.24, 0.42, 0.18, 0.36, 0.12, 0.54, 0.38],
      actions: [
        {
          id: "follows_senior",
          label: "일단 선배 방식대로 따른다",
          embedding: [-0.18, 0.34, -0.48, 0.12, 0.42, -0.22, 0.68, -0.44],
          bias: 0.04,
          outcome: "윤 차장이 흡족해했다. 적응했다는 말을 들었다. 보고서는 오늘도 그 방식으로 올라갔다.",
          endingWeight: { conformist: 3, survivor: 2 }
        },
        {
          id: "raises_issue_privately",
          label: "윤 차장에게 개인적으로 다른 방식을 제안해본다",
          embedding: [0.28, -0.12, 0.44, 0.38, 0.14, 0.32, 0.22, 0.58],
          bias: -0.01,
          outcome: "윤 차장은 잠시 생각하더니 '한번 해봐' 했다. 의외였다.",
          endingWeight: { reformer: 2, caregiver: 1, whistleblower: 1 },
          memory: "윤 차장이 '한번 해봐'라고 했을 때, 예상치 못한 대답이라 잠시 말을 잃었다."
        },
        {
          id: "reports_to_team_lead_quietly",
          label: "팀장에게 조용히 문의한다",
          embedding: [0.12, 0.08, 0.32, 0.24, 0.28, 0.38, 0.44, 0.46],
          bias: 0.01,
          outcome: "팀장은 '예전부터 그랬어'라고만 했다. 문제는 팀장도 알고 있었다.",
          endingWeight: { reformer: 1, survivor: 1, conformist: 1 }
        }
      ]
    },
    {
      id: "ME023",
      title: "탄원서",
      chapter: "Act 3 · 선택의 대가",
      type: "petition_under_pressure",
      summary: "회사가 지방 공장 직원 200명을 구조조정하겠다고 발표했다. 며칠 뒤, 사무직 직원들 사이에서 반대 탄원서가 돌기 시작했다. 서명자 명단은 결국 위에 올라간다. 찍힐 수 있다는 걸 모두 안다. 그런데 당신 바로 앞자리 동료가 리스트를 내밀었다. '같이 서명할 거지?'",
      tags: ["연대", "위험", "동료"],
      event_embedding: [0.32, 0.18, 0.56, 0.44, -0.14, 0.28, -0.22, 0.52],
      actions: [
        {
          id: "signs_petition",
          label: "서명한다",
          embedding: [0.44, -0.08, 0.68, 0.52, -0.22, 0.42, -0.18, 0.72],
          bias: 0,
          outcome: "이름을 적었다. 손이 떨리지는 않았다. 떨렸는지도 모른다.",
          endingWeight: { whistleblower: 2, reformer: 2, martyr: 1 },
          memory: "탄원서에 이름을 쓰고 나서 리스트를 다시 내려다봤다. 내 이름이 거기 있었다."
        },
        {
          id: "declines_politely",
          label: "개인 사정을 이유로 거절한다",
          embedding: [-0.12, 0.22, -0.34, -0.08, 0.38, -0.16, 0.54, -0.38],
          bias: 0.03,
          outcome: "동료는 '그래, 어쩔 수 없지'라고 했다. 오후 내내 눈이 마주치지 않았다.",
          endingWeight: { survivor: 3, conformist: 1 },
          memory: "동료가 '그래, 어쩔 수 없지'라고 했을 때의 표정이 생각보다 오래 남았다."
        },
        {
          id: "checks_legal_risks_first",
          label: "서명 전에 법적 불이익 여부를 먼저 확인한다",
          embedding: [0.18, 0.12, 0.28, 0.32, 0.16, 0.28, 0.42, 0.44],
          bias: -0.01,
          outcome: "노무사에게 짧게 문의했다. 보복 금지 조항이 있지만, 현실적으로 보장되지는 않는다고 했다.",
          endingWeight: { reformer: 1, survivor: 1, whistleblower: 1 }
        }
      ]
    },
    {
      id: "ME024",
      title: "다른 팀으로",
      chapter: "Act 2 · 압박",
      type: "internal_transfer_decision",
      summary: "다른 부서에서 이동 제안이 왔다. 현재 팀보다 연봉도 높고 업무도 맞다. 지금 팀은 프로젝트가 막바지라 인원이 빠지면 힘들다. 팀장은 아무 말도 하지 않았지만 표정이 굳었다. 이동은 당신의 권리다. 그리고 팀은 당신이 없으면 무너질 수도 있다.",
      tags: ["커리어", "동료", "책임"],
      event_embedding: [0.14, -0.18, 0.12, 0.28, 0.54, 0.38, 0.32, 0.22],
      actions: [
        {
          id: "transfers_now",
          label: "제안을 받아들이고 이동한다",
          embedding: [-0.22, 0.12, 0.18, -0.14, 0.62, 0.14, 0.38, -0.18],
          bias: 0.02,
          outcome: "이동했다. 새 팀은 좋았다. 전 팀 프로젝트는 어떻게 됐는지 나중에야 들었다.",
          endingWeight: { opportunist: 2, survivor: 2 },
          unlocks: "transferred_away"
        },
        {
          id: "delays_for_team",
          label: "프로젝트가 끝날 때까지 기다렸다가 이동한다",
          embedding: [0.44, -0.14, 0.08, 0.48, 0.22, 0.32, 0.28, 0.42],
          bias: -0.01,
          outcome: "세 달을 기다렸다. 제안이 아직 유효한지는 확인해봐야 했다.",
          endingWeight: { caregiver: 2, reformer: 1, survivor: 1 }
        },
        {
          id: "declines_offer",
          label: "제안을 거절하고 현 팀에 남는다",
          embedding: [0.52, -0.08, -0.14, 0.58, -0.12, 0.18, 0.44, 0.12],
          bias: 0,
          outcome: "팀장이 뭔가 말하려다 그냥 자리로 돌아갔다. 프로젝트는 무사히 끝났다.",
          endingWeight: { caregiver: 3, martyr: 1 },
          memory: "팀장이 뭔가 말하려다 그냥 돌아가는 뒷모습을 봤다. 묻지 않았다."
        }
      ]
    },
    {
      id: "ME025",
      title: "전 팀의 연락",
      chapter: "Act 4 · 구조",
      type: "return_request_from_old_team",
      requires: "transferred_away",
      summary: "이동한 지 여섯 달이 됐다. 전 팀에서 메시지가 왔다. 그때 같이 일했던 후배 정 사원이다. '선배, 저희 지금 너무 힘들어요. 그 프로젝트 후속 건인데 선배가 맡던 부분이 아직 정리가 안 됐어요. 도와주실 수 있어요?' 새 팀 업무도 한창이다. 돌아보는 건 의무가 아니다. 하지만 그 팀이 힘든 건 당신이 빠진 것과 무관하지 않다.",
      tags: ["책임", "경계", "동료"],
      event_embedding: [0.48, 0.22, 0.18, 0.62, -0.08, 0.14, 0.28, 0.32],
      actions: [
        {
          id: "helps_after_hours",
          label: "퇴근 후에 따로 시간을 내 도와준다",
          embedding: [0.62, 0.14, 0.08, 0.74, -0.18, 0.22, 0.18, 0.28],
          bias: 0,
          outcome: "두 주 동안 저녁마다 통화했다. 전 팀은 고마워했다. 피로가 쌓였다.",
          endingWeight: { caregiver: 3, martyr: 1 },
          memory: "자정에 통화를 끊고 나서 새 팀 업무가 쌓여 있는 걸 봤다."
        },
        {
          id: "sets_boundary_kindly",
          label: "미안하지만 지금은 여력이 없다고 정중히 말한다",
          embedding: [0.18, -0.14, 0.22, 0.34, 0.28, 0.32, 0.38, 0.44],
          bias: -0.01,
          outcome: "후배는 '그렇구나요'라고 했다. 섭섭한 것 같았다. 어쩔 수 없다.",
          endingWeight: { survivor: 2, exile: 1, reformer: 1 }
        },
        {
          id: "escalates_to_management",
          label: "인수인계 문제라며 관리자 선에서 해결하도록 넘긴다",
          embedding: [0.12, 0.08, 0.34, 0.22, 0.42, 0.44, 0.52, 0.38],
          bias: 0.01,
          outcome: "관리자가 처리했다. 후배에게는 직접 연락하지 않았다.",
          endingWeight: { conformist: 1, opportunist: 1, survivor: 2 }
        }
      ]
    }
  ];

  const ENDINGS = {
    survivor:     { id: "END_survivor",     title: "조용한 퇴장",         survived: true,  scene: "퇴직 후 작은 아파트에서 혼자 지내고 있다. 뉴스에 옛 회사 이름이 나오면 채널을 돌린다. 아무도 찾아오지 않지만, 그 나름대로 괜찮다.",                                                                                   world_impact: "low" },
    whistleblower:{ id: "END_whistleblower",title: "법정 마지막 진술",     survived: true,  scene: "법정에서 최후 진술을 읽던 날, 방청석에 처음 보는 얼굴들이 있었다. 나중에 알고 보니 같은 일을 당한 사람들이었다. 지금은 그 사람들의 전화를 받는다.",                                                                    world_impact: "medium" },
    conformist:   { id: "END_conformist",   title: "임원실",               survived: true,  scene: "임원 자리에 올랐다. 회식에서 웃는 법을 익혔고, 불편한 말은 보고서 뒤에 묻는 법도 안다. 가끔 삼십 대의 자신이 꿈에 나온다. 아무 말 없이 바라보다가 사라진다.",                                                          world_impact: "low" },
    reformer:     { id: "END_reformer",     title: "조례 개정안 통과",     survived: true,  scene: "조례 개정안이 통과된 날, 아무도 이름을 부르지 않았다. 기념사진도 없었다. 그냥 회의실에서 나와 버스를 탔다. 그것으로 충분했다.",                                                                                          world_impact: "high" },
    exile:        { id: "END_exile",        title: "출국장",               survived: true,  scene: "짐 두 개를 들고 출국장을 통과했다. 배웅 나온 사람은 없었다. 돌아올지 모른다. 아직 모른다.",                                                                                                                               world_impact: "low" },
    caregiver:    { id: "END_caregiver",    title: "병원 복도",            survived: true,  scene: "요양병원 자원봉사를 십 년째 하고 있다. 잘 알지도 못하는 사람 손을 잡고 있을 때 가장 자기답다는 걸 느낀다. 기억하는 사람이 많지 않아도 그것으로 충분하다.",                                                              world_impact: "medium" },
    opportunist:  { id: "END_opportunist",  title: "등 돌린 자리들",       survived: true,  scene: "지금은 잘 먹고 잘 산다. 판단은 각자 하면 된다고 생각한다. 다만 예전 동료 이름이 뉴스에 나올 때마다 폰을 뒤집어 놓는다.",                                                                                                world_impact: "medium" },
    martyr:       { id: "END_martyr",       title: "50대의 첫 파업",       survived: false, scene: "처음으로 피켓을 든 날이 쉰 살이었다. 옆에 선 사람들 중 절반은 자기 자식 나이였다. 늦었지만 틀리지 않았다고 생각한다. 결과는 아직 모른다.",                                                                               world_impact: "medium" },
    forgotten:    { id: "END_forgotten",    title: "연락 두절",            survived: false, scene: "어느 시점부터 연락이 끊겼다. 소셜미디어도 없고, 번호도 바뀌었다. 살아있는지 아는 사람이 몇 없다. 기록되지 않은 삶도 삶이었다.",                                                                                           world_impact: "low" },
    changemaker:  { id: "END_changemaker",  title: "이름 없는 전환점",     survived: true,  scene: "이 사람 이전과 이후로 무언가가 달라졌다. 그것을 알아채는 데는 시간이 걸렸다. 본인은 지금도 다음 일을 하고 있다.",                                                                                                         world_impact: "very_high" }
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

  function encodePromptToLatent(character, schema = { latent_dimensions: LATENT_DIMS }, neuralModel = null) {
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

  function seededNormal(seed) {
    const u1 = Math.max(seededUnit(`${seed}:u1`), 0.000001);
    const u2 = seededUnit(`${seed}:u2`);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function createInitialPersonaState(character, schema = { latent_dimensions: LATENT_DIMS }, neuralModel = null) {
    const promptText = characterText(character);
    const mu = encodePromptToLatent(character, schema, neuralModel);
    const tokens = tokenize(promptText);
    const promptClarity = Math.min(1, tokens.length / 28);
    const baseUncertainty = 0.42 - promptClarity * 0.16;
    const innateSeed = String(character.innate_seed || `${character.id || "anonymous"}|${promptText}|m1-init`);
    const sigma = mu.map(value =>
      clamp(baseUncertainty + (1 - Math.abs(value)) * 0.18, 0.12, 0.58)
    );
    const innateNoise = sigma.map((_, index) =>
      clamp(seededNormal(`${innateSeed}:z${index}`), -2.25, 2.25)
    );
    const z0 = normalize(mu.map((value, index) =>
      clamp(value + sigma[index] * innateNoise[index] * 0.42)
    ));
    return {
      model_id: MODEL_REGISTRY.prompt_to_persona_model.id,
      distribution_type: "prompt_conditioned_gaussian",
      prompt_anchor: mu,
      mu,
      sigma,
      innate_noise: innateNoise,
      z0,
      innate_seed: innateSeed,
      prompt_uncertainty: Number(baseUncertainty.toFixed(4)),
      initialization_rule: "z0 = normalize(mu(prompt) + sigma(prompt) * innate_noise)"
    };
  }

  function createInnateDevelopmentProfile(character) {
    const seed = String(character.innate_seed || `${character.id || "anonymous"}|${character.free_text_length || 0}|innate-growth`);
    return DEVELOPMENT_EVENTS.map(event => {
      const raw = event.adaptations.map(signal => {
        const h = hashText(`${seed}:${event.id}:${signal.id}`);
        const wave = Math.sin(h * 0.019) + Math.cos(h * 0.007);
        return {
          id: signal.id,
          label: signal.label,
          raw: Math.max(0.02, wave + 1.25)
        };
      });
      const total = raw.reduce((sum, item) => sum + item.raw, 0) || 1;
      return {
        event_id: event.id,
        event_title: event.title,
        signal_bias: raw.map(item => ({
          id: item.id,
          label: item.label,
          weight: Number((item.raw / total).toFixed(4))
        }))
      };
    });
  }

  function encodeTextToLatent(character, schema = { latent_dimensions: LATENT_DIMS }, neuralModel = null) {
    return encodePromptToLatent(character, schema, neuralModel);
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
      node_initialization_rule: "zero baseline -> prompt-conditioned vector; innate seed perturbs growth-stage signal weights",
      edge_update_rule: "development/event/feedback-conditioned updates",
      update_functions: {
        prompt_to_seed: "M1(prompt, schema) -> infant_latent",
        development_event: "growth_event + prompt_fit + innate_development_profile -> next_latent",
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
    const initialState = createInitialPersonaState(character, structurePrior, neuralModel);
    const promptLatent = initialState.mu;
    const innateDevelopmentProfile = createInnateDevelopmentProfile(character);
    const infantLatent = initialState.z0;
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
      prompt_latent_persona: promptLatent,
      initial_persona_state: initialState,
      m1_mu: initialState.mu,
      m1_sigma: initialState.sigma,
      innate_noise: initialState.innate_noise,
      innate_seed: character.innate_seed || null,
      innate_development_influence: INNATE_DEVELOPMENT_INFLUENCE,
      innate_development_profile: innateDevelopmentProfile,
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

  function rankDevelopmentSignals(event, latent, promptText, dims, innateDevelopmentProfile = null) {
    const eventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
    const innateBias = innateDevelopmentProfile
      ?.find(item => item.event_id === event.id)
      ?.signal_bias || [];
    const uniformWeight = 1 / Math.max(1, event.adaptations.length);
    return event.adaptations
      .map(signal => {
        const signalEmbedding = fitEmbedding(signal.embedding, dims, signal.id);
        const contextFit = cueScore(promptText, signal.cueWords);
        const latentFit = dot(latent, signalEmbedding) * 0.58;
        const eventFit = dot(latent, eventEmbedding) * 0.16;
        const innateWeight = innateBias.find(item => item.id === signal.id)?.weight ?? uniformWeight;
        const innateFit = (innateWeight - uniformWeight) * INNATE_DEVELOPMENT_INFLUENCE;
        return {
          ...signal,
          signal_embedding: signalEmbedding,
          innate_weight: innateWeight,
          innate_fit: Number(innateFit.toFixed(4)),
          development_score: Number((contextFit + latentFit + eventFit + innateFit).toFixed(4))
        };
      })
      .sort((a, b) => b.development_score - a.development_score);
  }

  function blendDevelopmentSignals(event, currentLatent, character, structurePrior, innateDevelopmentProfile = null) {
    const promptText = characterText(character);
    const dims = structurePrior.latent_dimension;
    const eventEmbedding = fitEmbedding(event.event_embedding, dims, event.id);
    const profile = innateDevelopmentProfile || createInnateDevelopmentProfile(character);
    const ranked = rankDevelopmentSignals(event, currentLatent, promptText, dims, profile);
    const maxScore = ranked[0]?.development_score || 0;
    const rawWeights = ranked.map(signal => Math.exp(signal.development_score - maxScore));
    const totalWeight = rawWeights.reduce((sum, value) => sum + value, 0) || 1;
    const signalMix = ranked.map((signal, index) => ({
      id: signal.id,
      label: signal.label,
      score: signal.development_score,
      innate_weight: signal.innate_weight,
      weight: Number((rawWeights[index] / totalWeight).toFixed(4))
    }));
    const blendedEmbedding = normalize(Array.from({ length: dims }, (_, index) =>
      ranked.reduce((sum, signal, signalIndex) => {
        const weight = rawWeights[signalIndex] / totalWeight;
        return sum + signal.signal_embedding[index] * weight;
      }, 0)
    ));
    const evidence = findEvidenceByEmbedding(promptText, blendedEmbedding, ranked.flatMap(signal => signal.cueWords || []));
    const before = [...currentLatent];
    const receptivity = 0.13 + Math.max(0, dot(currentLatent, eventEmbedding)) * 0.05;
    const updated = currentLatent.map((value, index) => {
      const inertia = value * 0.9;
      const environmentalImpact = blendedEmbedding[index] * receptivity;
      return clamp(inertia + environmentalImpact);
    });
    const newLatent = normalize(updated);
    const topSignals = signalMix.slice(0, 3);
    const topLabels = topSignals.map(signal => signal.label).join(" / ");
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
        adaptation: "blended_development_signal",
        adaptation_label: `혼합 성장 신호: ${topLabels}`,
        adaptation_embedding: blendedEmbedding,
        signal_mix: signalMix,
        innate_development_profile: profile.find(item => item.event_id === event.id) || null,
        innate_development_influence: INNATE_DEVELOPMENT_INFLUENCE,
        development_score: topSignals[0]?.score || 0,
        latent_before: before,
        latent_after: newLatent,
        prompt_evidence: evidence.text,
        prompt_evidence_score: evidence.evidence_score,
        summary: `프롬프트가 하나의 유형으로 고정되지 않고 ${topLabels} 신호를 서로 다른 비율로 남겼다.`,
        rationale: `프롬프트의 "${evidence.text}" 부분을 중심으로 여러 성장 신호가 동시에 작용했다.`
      }
    };
  }

  function applyDevelopment(initialLatent, character, structurePrior = getPersonaStructurePrior(character)) {
    let latent = [...initialLatent];
    const innateDevelopmentProfile = createInnateDevelopmentProfile(character);
    const logs = DEVELOPMENT_EVENTS.map(event => {
      const { newLatent, logTemplate } = blendDevelopmentSignals(event, latent, character, structurePrior, innateDevelopmentProfile);
      latent = newLatent;
      return logTemplate;
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

  function scoreActionDistribution(event, latentVector, structurePrior, neuralModel = null) {
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
    const maxScore = ranked[0]?.decision_score || 0;
    const rawProbabilities = ranked.map(action => Math.exp((action.decision_score - maxScore) * 2.15));
    const totalProbability = rawProbabilities.reduce((sum, value) => sum + value, 0) || 1;
    return ranked.map((action, index) => ({
      ...action,
      choice_probability: Number((rawProbabilities[index] / totalProbability).toFixed(4))
    }));
  }

  function routeRarity(probability) {
    if (probability <= 0.00001) return "mythic";
    if (probability <= 0.0001) return "legendary";
    if (probability <= 0.001) return "rare";
    if (probability <= 0.01) return "uncommon";
    return "common";
  }

  function seededUnit(seed) {
    return (hashText(seed) % 1000000) / 1000000;
  }

  function chooseWeightedAction(distribution, seed) {
    const roll = seededUnit(seed);
    let cumulative = 0;
    for (const action of distribution) {
      cumulative += action.choice_probability || 0;
      if (roll <= cumulative) return action;
    }
    return distribution.at(-1);
  }

  function buildVisibleActionSet(distribution, selectedAction, seed) {
    const visible = new Set();
    distribution.forEach(action => {
      const appearanceProbability = clamp(0.18 + (action.choice_probability || 0) * 1.15, 0.22, 0.92);
      action.appearance_probability = Number(appearanceProbability.toFixed(4));
      if (seededUnit(`${seed}:${action.id}:visible`) <= appearanceProbability) {
        visible.add(action.id);
      }
    });
    visible.add(selectedAction.id);
    if (visible.size < 2) {
      distribution
        .filter(action => !visible.has(action.id))
        .slice(0, 1)
        .forEach(action => visible.add(action.id));
    }
    return distribution.map(action => ({
      id: action.id,
      label: action.label,
      decision_score: action.decision_score,
      probability: action.choice_probability,
      appearance_probability: action.appearance_probability,
      visible: visible.has(action.id)
    }));
  }

  function chooseAction(event, latentVector, structurePrior, neuralModel = null, routeSeed = "") {
    const ranked = scoreActionDistribution(event, latentVector, structurePrior, neuralModel);
    const selected = chooseWeightedAction(ranked, `${routeSeed || "route"}:${event.id}:actual`);
    const actionDistribution = buildVisibleActionSet(ranked, selected, `${routeSeed || "route"}:${event.id}`);
    selected.action_distribution = actionDistribution;
    selected.visible_action_ids = actionDistribution.filter(action => action.visible).map(action => action.id);
    return selected;
  }

  function interpretPersonaForEvent(event, latentVector, promptText, structurePrior, neuralModel = null, routeSeed = "") {
    const action = chooseAction(event, latentVector, structurePrior, neuralModel, routeSeed);
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

  const ADAPTATION_BRIEFINGS = {
    secure_attachment: {
      trait: "압박이 커질수록 안정적인 관계를 기준점으로 삼는다",
      desire: "믿을 수 있는 사람들과 안전한 울타리를 지키고 싶다",
      fear: "한 번 안전하다고 느낀 사람을 잃는 것",
      hint: "관계가 걸린 선택지에서는 보호하거나 신뢰를 유지하는 쪽으로 기울 수 있다.",
      risk: "소속감을 지키려다 필요한 충돌을 미룰 수 있다."
    },
    anxious_attachment: {
      trait: "버려짐과 손실의 신호를 빠르게 감지한다",
      desire: "자신이 버려지지 않는다는 확실한 증거를 원한다",
      fear: "취약한 선택을 한 뒤 버림받는 것",
      hint: "거절이나 이탈의 기미가 보이면 급한 자기방어 선택을 할 수 있다.",
      risk: "침묵이나 거리를 배신으로 읽고 과잉 반응할 수 있다."
    },
    obedient_attachment: {
      trait: "행동하기 전에 권위와 규칙의 눈치를 먼저 본다",
      desire: "인정된 질서 안에서 안전하게 살아남고 싶다",
      fear: "눈에 보이는 질서를 어겼을 때의 처벌",
      hint: "위계가 강한 장면에서는 신중함, 절차, 우회적 저항이 먼저 떠오를 수 있다.",
      risk: "압박 속에서 안전과 복종을 혼동할 수 있다."
    },
    scarcity_hardening: {
      trait: "생존 비용을 빠르게 계산한다",
      desire: "이상보다 먼저 기본 자원을 확보하고 싶다",
      fear: "다시 부족함 속으로 밀려나는 것",
      hint: "자원이 부족한 장면에서는 상징적 선의보다 실제 생존을 우선할 가능성이 높다.",
      risk: "가혹한 선택도 현실적인 필요라고 합리화할 수 있다."
    },
    duty_training: {
      trait: "책임을 자신의 정체성으로 받아들인다",
      desire: "쓸모 있고 필요한 사람이 되고 싶다",
      fear: "타인이 맡긴 역할을 실패하는 것",
      hint: "의무가 명명되는 순간 사적인 편안함보다 역할을 앞세울 수 있다.",
      risk: "그 의무가 공정한지 묻기 전에 너무 많이 희생할 수 있다."
    },
    outsider_watchfulness: {
      trait: "무리의 가장자리에서 분위기를 읽는다",
      desire: "뛰어들기 전에 안전한 각도를 찾고 싶다",
      fear: "눈에 띄어 표적이 되는 것",
      hint: "사회적으로 애매한 장면에서는 관찰하고 거리를 시험한 뒤 움직일 가능성이 높다.",
      risk: "공개적으로 손잡아야 할 타이밍을 놓칠 수 있다."
    },
    protective_identity: {
      trait: "누군가를 지키는 일을 자기 정체성으로 삼는다",
      desire: "가깝거나 약한 사람을 보호하고 싶다",
      fear: "해를 입는 장면을 보고도 아무것도 하지 못하는 것",
      hint: "취약한 사람이 노출되면 개입 가능성이 급격히 커진다.",
      risk: "누군가를 지키기 위해 갈등을 키울 수 있다."
    },
    recognition_hunger: {
      trait: "자신의 가치를 눈에 보이는 증거로 확인받고 싶어 한다",
      desire: "특별한 사람으로 인정받고 싶다",
      fear: "평범하거나 실패한 사람으로 판단되는 것",
      hint: "평판과 성취가 걸리면 과감한 선택에 끌릴 수 있다.",
      risk: "지위나 박수가 걸려 있으면 무리수를 둘 수 있다."
    },
    revenge_loop: {
      trait: "모욕을 목적의식으로 바꾼다",
      desire: "억울함 뒤의 균형을 되찾고 싶다",
      fear: "모욕이 영구적인 진실처럼 굳어지는 것",
      hint: "불공정함은 타협보다 응징 쪽으로 마음을 끌 수 있다.",
      risk: "처벌을 정의로 착각할 수 있다."
    },
    public_service: {
      trait: "책임은 개인 밖으로 확장되어야 한다고 믿는다",
      desire: "시스템을 덜 잔인하게 만들고 싶다",
      fear: "공적 피해 위에 사적 안락을 얻는 것",
      hint: "제도적, 시민적 선택지가 빠른 개인 이익보다 더 매력적으로 보일 수 있다.",
      risk: "상황이 허락하는 것보다 오래 공식 절차를 신뢰할 수 있다."
    },
    private_survival: {
      trait: "가까운 생존 반경을 먼저 지킨다",
      desire: "가족과 생계를 무너지지 않게 붙들고 싶다",
      fear: "숭고한 선택 때문에 자기 사람들이 위험해지는 것",
      hint: "생존이 사적인 문제로 다가오면 작지만 안전한 경계를 선택할 수 있다.",
      risk: "도덕의 범위를 가까운 사람들에게만 좁힐 수 있다."
    },
    power_path: {
      trait: "견디는 것보다 구조 자체를 바꾸고 싶어 한다",
      desire: "규칙을 다시 쓸 만큼의 힘을 얻고 싶다",
      fear: "타인의 시스템 안에서 계속 무력하게 남는 것",
      hint: "판을 바꿀 수 있는 선택지가 보이면 그쪽으로 끌릴 수 있다.",
      risk: "변화의 대가로 부수 피해를 받아들일 수 있다."
    }
  };

  const INNATE_DEVELOPMENT_INFLUENCE = 0.22;

  function uniqueByText(items, fallbackItems, limit) {
    const seen = new Set();
    return [...items, ...fallbackItems]
      .filter(Boolean)
      .filter(item => {
        const text = typeof item === "string" ? item : item.text || item.label || item;
        if (!text || seen.has(text)) return false;
        seen.add(text);
        return true;
      })
      .slice(0, limit);
  }

  function summarizePersona(character, details = {}) {
    const logs = details.developmental_logs || details.developmentalLogs || [];
    const promptInterpretation = details.prompt_interpretation || details.promptInterpretation || {};
    const latent = details.latent_persona || details.latentPersona || [];
    const shiftSize = log => Math.sqrt((log.latent_after || []).reduce((sum, value, index) => {
      const delta = value - (log.latent_before?.[index] || 0);
      return sum + delta * delta;
    }, 0));
    const strongestLogs = [...logs]
      .sort((a, b) => {
        return shiftSize(b) - shiftSize(a);
      });
    const briefings = strongestLogs
      .flatMap(log => {
        const signalIds = Array.isArray(log.signal_mix) && log.signal_mix.length > 0
          ? log.signal_mix.map(signal => signal.id)
          : [log.adaptation];
        return signalIds.map(id => ADAPTATION_BRIEFINGS[id]);
      })
      .filter(Boolean);
    const latentHighlights = latent
      .map((value, index) => ({ index, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3)
      .map(({ index, value }) => `z${index} ${value >= 0 ? "+" : ""}${value.toFixed(2)}`);
    const fallbackTraits = [
      "상황이 바뀌어도 비교적 일관된 내적 논리를 유지한다",
      "초기 압박을 성인기의 결정 방식으로 끌고 온다",
      latentHighlights.length ? `가장 강한 잠재 신호: ${latentHighlights.join(", ")}` : "읽을 수 있지만 아직 흔들리는 출발점을 가진다"
    ];
    const coreTraits = uniqueByText(
      briefings.map(item => item.trait),
      fallbackTraits,
      3
    );
    const desires = uniqueByText(
      briefings.map(item => item.desire),
      ["스스로 납득 가능한 선택을 하고 싶다", "성장 과정에서 만든 정체성을 지키고 싶다"],
      2
    );
    const fears = uniqueByText(
      briefings.map(item => item.fear),
      ["결정적인 순간에 무력해지는 것", "돌아갈 수 없는 오답을 고르는 것"],
      2
    );
    const predictionHints = uniqueByText(
      briefings.map(item => item.hint),
      [
        "Compare every option against the persona's earliest pressure, not only the event text.",
        "선택지를 사건 내용만이 아니라 초기 압박과 대조해 보라.",
        "정체성과 생존을 동시에 지키는 선택일수록 가능성이 높다."
      ],
      3
    );
    const riskSignals = uniqueByText(
      briefings.map(item => item.risk),
      ["하나의 가치가 지나치게 커지는 순간을 주의하라.", "압박은 강점을 맹점으로 바꿀 수 있다."],
      2
    );
    const strongestTrait = coreTraits[0] || "안정적이지만 계속 변하는 결정 패턴을 가진 인물";
    return {
      title: `${character.generated_name || character.name || character.id || "Persona"} 브리핑`,
      one_line: `${strongestTrait}. 이 인물은 무작위로 고르는 존재가 아니라, 반복되는 패턴으로 읽을수록 예측하기 쉬워진다.`,
      core_traits: coreTraits,
      desires,
      fears,
      prediction_hints: predictionHints,
      risk_signals: riskSignals,
      prompt_fragments: (promptInterpretation.prompt_fragments || []).slice(0, 3),
      growth_summary: logs.map(log => ({
        event_id: log.event_id,
        event_title: log.event_title,
        adaptation: log.adaptation,
        adaptation_label: log.adaptation_label,
        summary: log.summary
      }))
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
          prompt_latent_persona: normalize(providedLatent.map(value => clamp(value))),
          initial_persona_state: {
            distribution_type: "external_latent_seed",
            mu: normalize(providedLatent.map(value => clamp(value))),
            sigma: Array(providedLatent.length).fill(0),
            innate_noise: Array(providedLatent.length).fill(0),
            z0: normalize(providedLatent.map(value => clamp(value)))
          },
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
    const personaCard = summarizePersona(character, {
      prompt_interpretation: promptInterpretation,
      developmental_logs: development.logs,
      latent_persona: adultLatent
    });
    const endingScores = {};
    let routeProbability = 1;
    let currentLatent = [...adultLatent];
    const unlockedFlags = new Set();
    const eventResults = [];
    for (const event of EVENTS) {
      if (event.requires && !unlockedFlags.has(event.requires)) continue;
      const routeSeed = `${character.id || characterText(character)}:${character.innate_seed || "no-seed"}:${event.id}`;
      const interpretation = interpretPersonaForEvent(event, currentLatent, promptText, structurePrior, compatibleModel, routeSeed);
      const action = interpretation.action;
      const rationale = interpretation.rationale;
      routeProbability *= action.choice_probability || 1;
      Object.entries(action.endingWeight).forEach(([endingKey, weight]) => {
        endingScores[endingKey] = (endingScores[endingKey] || 0) + weight;
      });
      if (action.unlocks) unlockedFlags.add(action.unlocks);
      const latentBefore = [...currentLatent];
      const latentAfter = updatePersonaState(currentLatent, event.event_embedding, action.embedding, {
        eventId: event.id,
        actionId: action.id
      });
      currentLatent = latentAfter;
      eventResults.push({
        event_id: event.id,
        chapter: event.chapter,
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
        latent_before: latentBefore,
        latent_after: latentAfter,
        m1_update_rule: "state_transition_from_event_action",
        decision_score: action.decision_score,
        action_probability: action.choice_probability,
        action_distribution: action.action_distribution,
        visible_action_ids: action.visible_action_ids,
        route_probability: Number(routeProbability.toPrecision(6)),
        route_rarity: routeRarity(routeProbability),
        rationale: rationale.text,
        prompt_evidence: rationale.prompt_evidence,
        prompt_evidence_score: rationale.prompt_evidence_score,
        latent_contributors: rationale.latent_contributors,
        outcome: action.outcome,
        ending_flag: false
      });
    }

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
      persona_card: personaCard,
      latent_persona: currentLatent,
      latent_edges: inferLatentEdges(currentLatent),
      post_development_latent_persona: adultLatent,
      post_development_latent_edges: latentEdges,
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
    let currentLatent = normalize(latentVector.map(value => clamp(value)));
    const compatibleModel = isCompatibleModel(neuralModel, structurePrior) ? neuralModel : null;
    let routeProbability = 1;
    const dynFlags = new Set();
    const events = [];
    for (const event of EVENTS) {
      if (event.requires && !dynFlags.has(event.requires)) continue;
      const routeSeed = `${character.id || promptText}:${runLabel}:${event.id}`;
      const interpretation = interpretPersonaForEvent(event, currentLatent, promptText, structurePrior, compatibleModel, routeSeed);
      const action = interpretation.action;
      const rationale = interpretation.rationale;
      routeProbability *= action.choice_probability || 1;
      if (action.unlocks) dynFlags.add(action.unlocks);
      const latentBefore = [...currentLatent];
      const latentAfter = updatePersonaState(currentLatent, event.event_embedding, action.embedding, {
        eventId: event.id,
        actionId: action.id,
        runLabel
      });
      currentLatent = latentAfter;
      events.push({
        event_id: event.id,
        chapter: event.chapter,
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
        latent_before: latentBefore,
        latent_after: latentAfter,
        m1_update_rule: "state_transition_from_event_action",
        decision_score: action.decision_score,
        action_probability: action.choice_probability,
        action_distribution: action.action_distribution,
        visible_action_ids: action.visible_action_ids,
        route_probability: Number(routeProbability.toPrecision(6)),
        route_rarity: routeRarity(routeProbability),
        rationale: rationale.text,
        prompt_evidence: rationale.prompt_evidence,
        prompt_evidence_score: rationale.prompt_evidence_score,
        latent_contributors: rationale.latent_contributors,
        outcome: action.outcome,
        ending_flag: false,
        run_label: runLabel
      });
    }
    if (events.length > 0) events[events.length - 1].ending_flag = true;
    return {
      run_label: runLabel,
      neural_model_id: compatibleModel?.id || null,
      latent_persona: currentLatent,
      latent_edges: inferLatentEdges(currentLatent),
      events,
      ending: scoreEnding(events)
    };
  }

  function updatePersonaState(latentVector, eventEmbedding, actionEmbedding, options = {}) {
    const dims = latentVector.length;
    const eventVector = fitEmbedding(eventEmbedding || [], dims, options.eventId || "event");
    const actionVector = fitEmbedding(actionEmbedding || [], dims, options.actionId || "action");
    const feedbackTargetValue = options.feedbackKind ? feedbackTarget(options.feedbackKind) : 1;
    const eventPressure = options.eventPressure ?? 0.035;
    const actionPressure = options.actionPressure ?? 0.115;
    const inertia = options.inertia ?? 0.92;
    const updated = latentVector.map((value, index) => {
      const directionalShift =
        eventPressure * eventVector[index] +
        actionPressure * feedbackTargetValue * actionVector[index];
      return clamp(value * inertia + directionalShift);
    });
    return normalize(updated);
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
    const distribution = scoreActionDistribution(event, currentLatent, structurePrior);
    const action = distribution.find(a => a.id === actionId)
      || chooseAction(event, currentLatent, structurePrior); // fallback: 룰 기반
    const actionEmbedding = fitEmbedding(action.embedding, dims, action.id);
    const actionDistribution = buildVisibleActionSet(distribution, action, `${event.id}:${actionId || "engine"}`);
    const latentBefore = [...currentLatent];
    const latentAfter = updatePersonaState(currentLatent, event.event_embedding, actionEmbedding, {
      eventId: event.id,
      actionId: action.id
    });
    return {
      endingWeight: action.endingWeight,
      eventTemplate: {
        event_id: event.id,
        chapter: event.chapter,
        model_id: MODEL_REGISTRY.persona_to_prompt_model.id,
        based_on_model: structurePrior.model_id,
        event_type: event.type,
        event_title: event.title,
        event_summary: event.summary,
        event_embedding: event.event_embedding,
        action: action.id,
        action_label: action.label,
        action_embedding: actionEmbedding,
        latent_before: latentBefore,
        latent_after: latentAfter,
        m1_update_rule: "state_transition_from_event_action",
        decision_score: action.decision_score,
        action_probability: action.choice_probability,
        action_distribution: actionDistribution,
        visible_action_ids: actionDistribution.filter(item => item.visible).map(item => item.id),
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
    encodePromptToLatent,
    createInitialPersonaState,
    createInnateDevelopmentProfile,
    createTrainableModel,
    trainDeepLearningModel,
    getPersonaStructurePrior,
    interpretPromptToPersona,
    interpretPersonaForEvent,
    applyDevelopment,
    blendDevelopmentSignals,
    findEvidenceByEmbedding,
    inferLatentEdges,
    updatePersonaState,
    updateLatentWithFeedback,
    simulateWorldEvents,
    simulate,
    scoreEnding,
    summarizePersona,
    buildSimulationContext,
    buildGrowthStep,
    applyAdaptationResult,
    buildWorldStep,
    applyActionResult,
    hashText
  };
});
