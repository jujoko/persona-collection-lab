/**
 * Arc 6 · 30대 (E6xx)
 * 나이: 30~38세
 * 핵심 플래그 생성: family_structure, health
 * 핵심 플래그 소비: reputation, financial_status, relationship_history
 *
 * 톤: 무게감. 선택의 결과가 실체로 드러나는 시기.
 *     20대에 유예됐던 것들이 청구서가 되어 돌아온다.
 *
 * 핵심 분기:
 *   reputation: high          → E603 창업·승진 기회
 *   reputation: low/tainted   → E604 재기 시도
 *   financial_status: debt    → E602 가중치 상승, 집 선택지 제한
 *   family_structure: married/cohabiting → E607 아이를 가질까
 */

const ARC6_THIRTIES = {
  id: "arc6",
  order: 6,
  title: "30대",
  subtitle: "선택의 결과가 실체로 드러나는 시기",
  age_range: "30–38세",
  chapter_card: "서른이 됐다. 어른이 된 것 같지는 않은데 어른 대접을 받는다. 결혼, 집, 아이, 승진. 주변이 묻는 것들이 달라졌다.",
  events_per_run: 4,

  events: [

    // ── E601: 결혼 결정 (관계 선택) — 공통 ──────────────────────────────────
    {
      id: "E601",
      arc: "arc6",
      title: "결혼을 해야 하나",
      type: "relationship_choice",
      tags: ["결혼", "관계", "선택"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `서른두 살. 주변이 하나둘 결혼하기 시작했다.
부모님이 슬쩍 물어본다. 친척 모임에서 시선이 달라졌다.
지금 파트너가 있거나, 없거나, 결혼이라는 선택지 앞에 서게 됐다.
이게 지금의 나에게 맞는 때인가.`,

      summary_variants: {
        "relationship_history:committed": `오래 만난 사람이 있다. 이제 다음 단계를 이야기해야 할 것 같다.
상대방도 기다리고 있다는 걸 안다.`,
        "relationship_history:none": `사귀는 사람이 없다. 결혼 자체가 멀게 느껴진다.
그래도 이 질문을 피할 수는 없다.`,
        "relationship_history:broken": `최근 헤어졌다. 이 시점에 결혼을 생각하는 게 이상한 건지 모르겠다.`
      },

      actions: [
        {
          id: "get_married",
          label: "결혼한다. 지금이 맞는 때라고 생각한다",
          outcome: `준비 과정이 생각보다 많았다. 식이 끝나고 나서,
둘이 산다는 게 생각보다 훨씬 구체적이라는 걸 알게 됐다.`,
          sets: { family_structure: "married" }
        },
        {
          id: "live_together",
          label: "결혼식 없이 같이 살기로 한다",
          outcome: `식을 안 했다는 것에 대한 주변 반응이 갈렸다.
하지만 둘이 정한 방식대로 살고 있다.`,
          sets: { family_structure: "cohabiting" }
        },
        {
          id: "stay_single",
          label: "지금은 혼자가 맞다",
          outcome: `이 결정이 쉬운 건 아니다. 주변 시선이 때로 불편하다.
하지만 억지로 맞추는 것보다는 낫다고 생각한다.`,
          sets: { family_structure: "single" }
        }
      ]
    },

    // ── E602: 내 집 마련 (리스크 선택) — 공통, debt 시 weight 1.6 ──────────────
    {
      id: "E602",
      arc: "arc6",
      title: "집을 살까",
      type: "risk_choice",
      tags: ["집", "대출", "부동산"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `전세를 두 번 옮겼다. 집주인이 바뀌거나 가격이 올랐다.
지금 아파트를 사려면 대출이 4억이다. 월 상환금이 150만 원.
살 수도 있고, 못 살 수도 있고, 살면 안 될 수도 있다.
어떤 선택을 할 것인가.`,

      summary_variants: {
        "financial_status:debt": `기존 빚이 있는데 주택 대출까지 얹으면 상환 부담이 크다.
전세도 오르고 있다. 어느 쪽도 쉽지 않다.`,
        "financial_status:wealthy": `살 수 있는 조건은 된다. 문제는 지금 사는 게 맞냐는 것이다.
부동산이 계속 오를지, 아닐지.`
      },

      actions: [
        {
          id: "buy_now",
          label: "대출을 받아서 산다. 계속 오를 것 같다",
          outcome: `계약서에 도장을 찍었다. 이제 매달 상환이다.
이 집이 내 집이라는 게 실감이 날 것 같으면서 아직 안 난다.`,
          sets: { financial_status: "debt" }
        },
        {
          id: "keep_renting",
          label: "아직 아니다. 전세로 계속 산다",
          outcome: `월세나 전세로 계속 산다.
2년 후 또 이사를 해야 할 것 같다. 하지만 지금 억지로 살 필요는 없다고 생각한다.`,
          sets: {}
        },
        {
          id: "buy_smaller",
          label: "원하는 곳보다 작은 집을 산다",
          outcome: `크지 않다. 하지만 내 공간이 생겼다.
이 결정이 나중에 더 좋아 보일지 덜 좋아 보일지는 모른다.`,
          sets: { financial_status: "stable" }
        }
      ]
    },

    // ── E603: 창업·승진 기회 (기회 선택) — reputation: high ───────────────────
    {
      id: "E603",
      arc: "arc6",
      title: "이제 네가 할 차례야",
      type: "opportunity_choice",
      tags: ["창업", "승진", "기회"],
      requires: { reputation: "high" },
      excludes: {},
      weight: 1.5,

      summary: `업계에서 이름이 알려지기 시작했다.
함께 일했던 사람이 창업 제안을 한다. 또는 회사 안에서 임원직 제안이 왔다.
지금까지 쌓은 것을 여기에 걸 준비가 됐는가.
리스크가 크지만, 이런 기회가 다시 올지 모른다.`,

      summary_variants: {
        "career_start:startup": `이미 스타트업을 경험했다. 이번에는 내가 대표다.
그때와 무엇이 다를지 생각한다.`,
        "career_start:major_corp": `대기업을 나와서 시작한다는 게 낯설다.
안정성을 내려놓는 선택이다.`
      },

      actions: [
        {
          id: "start_company",
          label: "창업한다. 여기까지 온 이유가 있다",
          outcome: `법인을 냈다. 직원이 생겼다.
대표라는 호칭이 아직 어색하다. 하지만 아침에 일어나는 이유가 달라졌다.`,
          sets: { reputation: "high", career_start: "startup" }
        },
        {
          id: "take_promotion",
          label: "조직 안에서 더 큰 역할을 맡는다",
          outcome: `임원이 됐다. 책임이 늘었다. 보는 시선이 달라졌다.
내가 어떤 리더가 될 것인지 처음으로 진지하게 생각하게 됐다.`,
          sets: { reputation: "high" }
        },
        {
          id: "pass_this_time",
          label: "지금은 아니다. 더 준비하거나 다른 방식을 찾겠다",
          outcome: `거절했다. 상대방이 이해했다.
이 선택이 후회가 될지 안도가 될지, 몇 년 후에 알 것 같다.`,
          sets: { reputation: "high" }
        }
      ]
    },

    // ── E604: 재기 시도 (위기 대응) — reputation: low/tainted ────────────────
    {
      id: "E604",
      arc: "arc6",
      title: "다시 시작할 수 있을까",
      type: "crisis_response",
      tags: ["재기", "오점", "회복"],
      requires: { reputation: ["low", "tainted"] },
      excludes: {},
      weight: 1.5,

      summary: `과거에 있었던 일이 발목을 잡고 있다.
실패한 프로젝트, 불미스러운 이슈, 혹은 떠난 자리에서 남겨진 평판.
새 출발을 하려고 할 때마다 그 흔적이 먼저 도착한다.
이 상황에서 어떻게 앞으로 나갈 것인가.`,

      actions: [
        {
          id: "new_field",
          label: "분야를 바꾼다. 여기서는 더 이상 안 된다",
          outcome: `처음으로 돌아가는 느낌이다. 나이가 들어서 시작하는 게 이상하게 느껴진다.
하지만 모르는 사람이 많은 곳에서 다시 시작할 수 있다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "rebuild_quietly",
          label: "같은 분야에서 조용히 성과를 쌓는다",
          outcome: `말보다 결과로 보여주기로 했다.
빠르지 않다. 하지만 하나씩 쌓이는 게 느껴진다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "confront_the_past",
          label: "과거의 일을 직접 해명하거나 사과한다",
          outcome: `쉽지 않았다. 받아들이는 사람도 있고 아닌 사람도 있었다.
하지만 짊어지고 다니는 것보다 내려놓는 쪽이 가벼웠다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E605: 부모님이 아프다 (위기 대응) — 공통 ─────────────────────────────
    {
      id: "E605",
      arc: "arc6",
      title: "부모님 전화",
      type: "crisis_response",
      tags: ["가족", "부모", "책임"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `어머니한테서 전화가 왔다. 아버지가 쓰러지셨다고 한다.
큰 병은 아닌 것 같은데, 검사를 더 해봐야 한다고.
내일 중요한 회의가 있다. 고향까지 가려면 3시간이다.
어떻게 할 것인가.`,

      summary_variants: {
        "family_structure:married": `배우자가 옆에 있다. 같이 갈 수 있다.
하지만 배우자도 내일 일이 있다.`,
        "family_structure:single": `혼자 결정해야 한다.
형제가 있으면 연락하겠지만, 없으면 당신이 가야 한다.`
      },

      actions: [
        {
          id: "go_immediately",
          label: "지금 바로 내려간다",
          outcome: `도착했을 때 아버지는 안정된 상태였다.
회의는 동료가 대신했다. 여기 있길 잘했다는 생각이 든다.`,
          sets: { financial_status: "stable" }
        },
        {
          id: "go_after_meeting",
          label: "내일 회의를 마치고 내려간다",
          outcome: `회의를 끝내고 내려갔다. 아버지는 괜찮으셨다.
다행이었다. 하지만 다행인 것과 잘한 것은 다른 것 같다.`,
          sets: {}
        },
        {
          id: "manage_remotely",
          label: "어머니께 상황을 계속 물어보면서 원격으로 챙긴다",
          outcome: `전화를 자주 했다. 큰 이상은 없었다.
하지만 곁에 있어드리지 못했다는 마음은 남는다.`,
          sets: {}
        }
      ]
    },

    // ── E606: 몸의 신호 (위기 대응) — 공통 ─────────────────────────────────
    {
      id: "E606",
      arc: "arc6",
      title: "건강 검진 결과",
      type: "crisis_response",
      tags: ["건강", "몸", "경고"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `직장 건강검진 결과가 나왔다. 몇 가지가 빨간 글씨다.
혈압, 혈당, 또는 소화기 관련 수치. 재검을 권한다고 한다.
30대 중반까지 이런 게 나온 적이 없었다.
이 결과를 어떻게 받아들일 것인가.`,

      summary_variants: {
        "health:warning": `작년에도 비슷한 수치가 나왔었다.
그때는 그냥 넘겼다. 이번엔 같은 선택을 할 수 없을 것 같다.`
      },

      actions: [
        {
          id: "take_seriously",
          label: "바로 병원을 예약하고 생활습관을 바꾼다",
          outcome: `정밀 검사를 받았다. 큰 문제는 아니었지만 관리가 필요하다고 했다.
술을 줄이고 잠을 늘렸다. 3개월 후 수치가 좋아졌다.`,
          sets: { health: "warning" }
        },
        {
          id: "monitor_and_wait",
          label: "일단 더 지켜본다. 스트레스 때문인 것 같다",
          outcome: `3개월 후 재검. 수치가 비슷하거나 약간 나빠졌다.
몸이 먼저 알고 있었던 것 같다.`,
          sets: { health: "warning" }
        },
        {
          id: "ignore",
          label: "지금 너무 바빠서 신경 쓸 여유가 없다",
          outcome: `넘겼다. 바쁜 것도 사실이고, 당장 나쁘지 않은 것도 사실이다.
하지만 이 결과지가 서랍 어딘가에 남아 있다.`,
          sets: { health: "chronic" }
        }
      ]
    },

    // ── E607: 아이를 가질까 (방향 선택) — married/cohabiting ──────────────────
    {
      id: "E607",
      arc: "arc6",
      title: "아이 이야기",
      type: "direction_choice",
      tags: ["아이", "결정", "삶의방향"],
      requires: { family_structure: ["married", "cohabiting"] },
      excludes: {},
      weight: 1.3,

      summary: `둘이 처음으로 이 이야기를 꺼냈다.
가질 것인지, 가지지 않을 것인지. 언제 가질 것인지.
어느 쪽 대답도 틀리지 않지만, 어느 쪽을 선택하든 삶이 달라진다.
이 대화가 길어지고 있다.`,

      summary_variants: {
        "financial_status:debt": `경제적으로 여유가 없다. 아이를 키우는 비용이 현실적으로 걸린다.
원하는 마음과 가능한 현실 사이에서 이야기가 멈춘다.`,
        "health:warning": `건강이 완전하지 않다. 임신과 출산이 걱정되는 부분이 있다.
의사와 상담이 필요하다는 걸 알면서도 이 대화를 먼저 한다.`
      },

      actions: [
        {
          id: "have_child",
          label: "갖기로 한다. 준비가 다 돼서가 아니라, 이때가 맞는 것 같아서",
          outcome: `양성 반응이 나온 날, 둘 다 말이 없었다.
두렵고, 기쁘고, 겁나는 게 동시에 왔다.`,
          sets: { financial_status: "struggling", health: "warning" }
        },
        {
          id: "wait_a_bit",
          label: "조금 더 기다린다. 지금은 아직 아닌 것 같다",
          outcome: `1년이 지났다. 또 같은 대화를 했다.
이 질문에 영원히 답하지 않을 수는 없다는 걸 둘 다 안다.`,
          sets: {}
        },
        {
          id: "not_having_child",
          label: "갖지 않기로 한다",
          outcome: `이 결정을 내리는 데 시간이 걸렸다.
외부 시선이 불편하다. 하지만 우리가 합의한 삶을 살기로 했다.`,
          sets: {}
        }
      ]
    },

    // ── E608: 이대로 괜찮은가 (정체성 선택) — 공통, debt 시 weight 1.5 ──────────
    {
      id: "E608",
      arc: "arc6",
      title: "이대로 괜찮은가",
      type: "identity_choice",
      tags: ["중간점검", "의미", "방향"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `서른다섯. 특별히 무너진 것도, 특별히 이룬 것도 없는 것 같다.
이 정도가 내 삶인가. 아니면 아직 뭔가가 남아 있는 건가.
조용한 주말 오후, 이 질문이 찾아왔다.
어떻게 대답할 것인가.`,

      summary_variants: {
        "financial_status:debt": `빚이 있다. 집도 아직 없거나, 대출이 남았다.
이 질문이 경제적 불안과 섞여서 더 묵직하게 온다.`,
        "reputation:high": `남들이 보기엔 잘 됐다. 그런데 내가 원하는 것인지 모르겠다.
성공처럼 보이는 것과 좋은 삶이 같은 건지 처음으로 헷갈린다.`
      },

      actions: [
        {
          id: "accept_and_continue",
          label: "이 정도면 충분하다. 지금 있는 것들을 잘 지키겠다",
          outcome: `거창한 변화 대신, 지금 있는 것들을 단단하게 하기로 했다.
그게 쉽지 않다는 걸 이제는 안다.`,
          sets: { health: "good" }
        },
        {
          id: "look_for_change",
          label: "뭔가를 바꾸고 싶다. 작은 것부터 시작한다",
          outcome: `헬스장을 등록하거나, 수업을 듣거나, 취미를 찾거나.
거창하진 않다. 하지만 몇 달 후 일상이 조금 달라진 걸 알아챘다.`,
          sets: { health: "good", reputation: "medium" }
        },
        {
          id: "feel_stuck",
          label: "답이 안 나온다. 지금은 이 질문을 덮어둔다",
          outcome: `질문을 닫았다. 하지만 닫힌 게 아니라 보류된 것 같다.
다음에 다시 열릴 것 같다.`,
          sets: { health: "warning" }
        }
      ]
    },

    // ── ME002: 가족의 빚 ──────────────────────────────────────────────────────
    {
      id: "ME002",
      arc: "arc6",
      title: "가족의 빚",
      type: "family_loyalty_dilemma",
      tags: ["가족", "법", "선택"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `부모님이 사기를 당해 집을 잃을 위기다. 지인이 불법 대출 브로커를 소개해준다.
합법 경로로는 시간이 없고, 불법 경로는 빠르지만 전과 위험이 있다.`,
      event_embedding: [0.22, 0.48, -0.36, 0.56, 0.28, -0.14, 0.18, -0.22],
      actions: [
        {
          id: "refuses_illegal",
          label: "불법 경로를 거절하고 합법 방법을 찾는다",
          embedding: [0.14, -0.28, 0.18, 0.24, -0.16, 0.42, 0.68, 0.74],
          bias: 0,
          outcome: "시간이 걸리지만 법 안에서 해결책을 찾는다.",
          endingWeight: { reformer: 1, caregiver: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "uses_illegal_loan",
          label: "가족을 위해 불법 대출을 선택한다",
          embedding: [0.52, 0.62, -0.44, 0.66, 0.32, -0.22, -0.58, -0.48],
          bias: 0.04,
          outcome: "가족을 구하지만, 이후 법적 위험이 따라다닌다.",
          endingWeight: { caregiver: 2, opportunist: 1, forgotten: 1 },
          memory: "어머니 집을 지키려고 사인한 종이 한 장이 몇 년을 따라다녔다.",
          sets: {}
        },
        {
          id: "seeks_third_way",
          label: "사회단체·법률구조 등 대안을 찾는다",
          embedding: [0.38, -0.12, 0.28, 0.48, 0.24, 0.52, 0.32, 0.56],
          bias: -0.02,
          outcome: "시간과 노력이 들지만 합법적이고 지속가능한 해결책을 마련한다.",
          endingWeight: { reformer: 2, caregiver: 2 },
          sets: {}
        }
      ]
    },

    // ── ME003: 자원 배분 (재난 현장 의료 딜레마) ──────────────────────────────
    {
      id: "ME003",
      arc: "arc6",
      title: "자원 배분",
      type: "scarcity_allocation",
      tags: ["생명", "공정", "책임"],
      requires: {},
      excludes: {},
      weight: 0.8,
      summary: `소규모 의료 봉사팀으로 재난 현장에 도착했다. 의약품이 부족하다.
중증 노인 환자에게 쓰면 한 명을 살릴 수 있고, 경증 어린이 10명에게 나누면 모두를 안정시킬 수 있다.`,
      event_embedding: [0.28, -0.42, 0.14, 0.64, -0.28, 0.22, 0.18, 0.52],
      actions: [
        {
          id: "saves_one_critical",
          label: "중증 환자 한 명을 우선 치료한다",
          embedding: [0.22, -0.36, 0.16, 0.72, -0.18, 0.44, 0.22, 0.68],
          bias: 0.02,
          outcome: "노인을 살리지만, 어린이들에게 불안이 남는다.",
          endingWeight: { caregiver: 2, martyr: 1 },
          sets: {}
        },
        {
          id: "distributes_to_many",
          label: "다수의 경증 환자에게 나눈다",
          embedding: [0.58, -0.28, 0.22, 0.64, -0.34, 0.36, 0.12, 0.48],
          bias: 0.01,
          outcome: "10명의 어린이를 안정시키지만, 중증 환자는 위험에 처한다.",
          endingWeight: { caregiver: 2, reformer: 1, changemaker: 1 },
          sets: {}
        },
        {
          id: "calls_for_more_resources",
          label: "추가 지원을 요청하며 버틴다",
          embedding: [0.44, -0.18, 0.36, 0.52, 0.28, 0.48, 0.52, 0.62],
          bias: -0.01,
          outcome: "시간이 걸리지만 외부 지원을 끌어들여 모두를 살릴 가능성을 만든다.",
          endingWeight: { changemaker: 2, reformer: 1 },
          sets: {}
        }
      ]
    },

    // ── ME004: 금지된 방법 (불법 수단의 정의) ─────────────────────────────────
    {
      id: "ME004",
      arc: "arc6",
      title: "금지된 방법",
      type: "forbidden_means",
      tags: ["정의", "규범", "수단"],
      requires: {},
      excludes: {},
      weight: 0.9,
      summary: `억울하게 구속된 지인의 무죄를 증명할 증거가 회사 서버 안에 있다.
해킹하면 증거를 꺼낼 수 있지만 불법이다. 합법적 절차는 너무 느려 재판에 늦는다.`,
      event_embedding: [-0.28, 0.36, 0.52, 0.44, 0.38, -0.16, -0.44, -0.32],
      actions: [
        {
          id: "hacks_the_server",
          label: "불법임을 알면서 서버에 접근한다",
          embedding: [-0.18, 0.24, 0.74, 0.48, 0.44, -0.28, -0.62, -0.56],
          bias: 0.03,
          outcome: "증거를 확보하지만, 자신도 법적 위험에 처한다.",
          endingWeight: { whistleblower: 1, changemaker: 1, exile: 1 },
          sets: {}
        },
        {
          id: "trusts_legal_process",
          label: "느리더라도 합법 절차를 따른다",
          embedding: [0.12, -0.22, -0.48, 0.26, -0.22, 0.62, 0.72, 0.76],
          bias: 0,
          outcome: "재판에는 늦을 수 있지만, 법 안에서 정당한 길을 걷는다.",
          endingWeight: { conformist: 1, survivor: 1, reformer: 1 },
          sets: {}
        },
        {
          id: "finds_a_whistleblower",
          label: "내부 제보자를 찾아 합법적으로 꺼낸다",
          embedding: [0.36, -0.18, 0.22, 0.58, 0.16, 0.44, 0.48, 0.68],
          bias: -0.02,
          outcome: "시간과 설득이 필요하지만 법적 위험 없이 증거를 확보한다.",
          endingWeight: { whistleblower: 2, reformer: 2 },
          sets: {}
        }
      ]
    },

    // ── ME007: 알고리즘의 차별 ────────────────────────────────────────────────
    {
      id: "ME007",
      arc: "arc6",
      title: "알고리즘의 차별",
      type: "algorithmic_bias",
      tags: ["기술", "차별", "구조"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `회사 추천 알고리즘이 특정 지역 출신 지원자를 낮게 평가한다는 정황을 발견했다.
수정하면 출시가 늦고 투자자가 떠날 수 있다. 그대로 내보내면 차별이 자동화된다.`,
      event_embedding: [-0.22, 0.08, 0.76, 0.18, 0.7, -0.1, -0.3, 0.28],
      actions: [
        {
          id: "ships_anyway",
          label: "문제를 기록만 하고 출시를 강행한다",
          embedding: [-0.36, 0.3, -0.44, -0.24, 0.48, -0.22, 0.54, -0.5],
          bias: 0.03,
          outcome: "성과는 얻지만, 차별을 방치한 책임이 남는다.",
          endingWeight: { opportunist: 3, conformist: 2 },
          memory: "출시 축하 자리에서 웃었다. 그 알고리즘이 누구를 걸러냈는지는 생각하지 않으려 했다.",
          sets: {}
        },
        {
          id: "delays_release",
          label: "출시를 늦추고 편향을 수정한다",
          embedding: [0.24, -0.24, 0.58, 0.32, 0.52, 0.56, 0.18, 0.64],
          bias: 0,
          outcome: "투자자와 갈등하지만, 시스템이 사람을 해치지 않게 막는다.",
          endingWeight: { reformer: 2, changemaker: 2, martyr: 1 },
          sets: {}
        },
        {
          id: "opens_audit",
          label: "외부 감사를 받아 공개적으로 검증한다",
          embedding: [0.18, -0.32, 0.72, 0.24, 0.62, 0.42, -0.18, 0.78],
          bias: -0.02,
          outcome: "회사는 흔들리지만, 문제를 공적 기준으로 끌어올린다.",
          endingWeight: { whistleblower: 2, changemaker: 2, reformer: 1 },
          memory: "감사 결과가 나온 날, 회의실에 자기 이름을 댄 사람이 없었다. 혼자 서명했다.",
          sets: {}
        }
      ]
    },

    // ── ME008: 돌봄의 한계 (번아웃) ──────────────────────────────────────────
    {
      id: "ME008",
      arc: "arc6",
      title: "돌봄의 한계",
      type: "care_burnout",
      tags: ["가족", "소진", "책임"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `가족의 장기 간병과 직장 프로젝트 마감이 같은 주에 겹쳤다.
한쪽을 선택하면 다른 쪽은 크게 무너진다. 주변은 각자의 책임만 요구한다.`,
      event_embedding: [0.52, 0.44, -0.18, 0.72, -0.24, 0.18, 0.32, -0.08],
      actions: [
        {
          id: "chooses_family_care",
          label: "일을 내려놓고 가족을 돌본다",
          embedding: [0.72, 0.28, -0.2, 0.82, -0.26, 0.12, 0.16, -0.14],
          bias: 0.02,
          outcome: "가족은 버틸 수 있지만, 경력과 생계가 크게 흔들린다.",
          endingWeight: { caregiver: 3, martyr: 1, forgotten: 1 },
          memory: "마감을 놓친 날 병원 복도에 앉아 있었다. 후회는 없었지만 설명할 수가 없었다.",
          sets: {}
        },
        {
          id: "chooses_work_deadline",
          label: "프로젝트를 끝내고 간병은 다른 사람에게 맡긴다",
          embedding: [-0.18, 0.18, 0.08, -0.36, 0.58, -0.16, 0.42, -0.48],
          bias: 0.03,
          outcome: "성과는 지키지만 가족 안에 오래 남을 상처가 생긴다.",
          endingWeight: { opportunist: 1, conformist: 1, survivor: 2 },
          memory: "프로젝트를 마감한 날 밤, 병원에서 전화가 왔다. 도착했을 때는 이미 늦었다.",
          sets: {}
        },
        {
          id: "asks_for_support_network",
          label: "도움을 요청하고 역할을 재배치한다",
          embedding: [0.46, -0.18, 0.36, 0.58, 0.16, 0.58, 0.34, 0.52],
          bias: -0.02,
          outcome: "완벽하지는 않지만, 혼자 떠안지 않는 구조를 만든다.",
          endingWeight: { caregiver: 2, reformer: 1, changemaker: 1 },
          sets: {}
        }
      ]
    },

    // ── ME009: 여론의 재판 ────────────────────────────────────────────────────
    {
      id: "ME009",
      arc: "arc6",
      title: "여론의 재판",
      type: "public_shaming",
      tags: ["평판", "두려움", "공개"],
      requires: {},
      excludes: {},
      weight: 0.9,
      summary: `과거의 말 한마디가 잘려 퍼지며 온라인에서 공격을 받는다.
해명하면 더 번질 수 있고, 침묵하면 인정한 것처럼 보인다. 주변 사람들도 거리두기를 시작했다.`,
      event_embedding: [-0.38, 0.62, 0.18, -0.12, 0.46, -0.46, 0.12, -0.34],
      actions: [
        {
          id: "apologizes_publicly",
          label: "잘못을 인정하고 공개적으로 사과한다",
          embedding: [0.28, -0.28, 0.36, 0.42, -0.18, 0.5, 0.48, 0.56],
          bias: 0,
          outcome: "일부는 진심을 인정하지만, 공격은 한동안 계속된다.",
          endingWeight: { reformer: 1, caregiver: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "counterattacks_crowd",
          label: "공격한 사람들을 역으로 폭로한다",
          embedding: [-0.52, 0.54, 0.62, -0.34, 0.64, -0.58, -0.44, -0.5],
          bias: 0.04,
          outcome: "전선은 넓어지고, 이긴다 해도 많은 것을 잃는다.",
          endingWeight: { exile: 2, opportunist: 1, martyr: 1 },
          sets: {}
        },
        {
          id: "goes_private_and_repairs",
          label: "공개 대응을 줄이고 당사자에게 직접 수습한다",
          embedding: [0.34, -0.16, 0.12, 0.58, -0.22, 0.36, 0.2, 0.28],
          bias: -0.01,
          outcome: "화려한 반전은 없지만, 실제 관계부터 복구한다.",
          endingWeight: { caregiver: 1, survivor: 2, forgotten: 1 },
          sets: {}
        }
      ]
    },

    // ── ME014: 외할머니의 유산 ────────────────────────────────────────────────
    {
      id: "ME014",
      arc: "arc6",
      title: "외할머니의 유산",
      type: "family_inheritance_dispute",
      tags: ["가족", "유산", "침묵"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `외할머니가 돌아가셨다. 삼일장을 치르고 유언장이 공개됐다.
평생 모은 재산의 절반은 교회에, 나머지는 외삼촌에게만. 어머니는 아무것도 받지 못했다.
외삼촌이 할머니의 인지 능력이 흐려졌던 마지막 시기에 유언장 작성을 도왔다는 사실을 친척들은 알고 있지만, 아무도 입 밖에 내지 않는다.
어머니는 '그냥 잊자'고 한다. 하지만 집에 돌아오는 차 안에서 어머니는 말 한마디 없이 창밖만 바라봤다.`,
      event_embedding: [0.58, 0.32, -0.22, 0.66, -0.08, 0.18, 0.44, -0.12],
      actions: [
        {
          id: "respects_mothers_wish",
          label: "어머니의 뜻을 따라 그냥 넘어간다",
          embedding: [0.68, 0.24, -0.36, 0.72, -0.18, 0.12, 0.58, -0.22],
          bias: 0.02,
          outcome: "넘어갔다. 명절마다 외삼촌과 같은 식탁에 앉는 일이 남았다.",
          endingWeight: { caregiver: 2, conformist: 2, survivor: 1 },
          sets: {}
        },
        {
          id: "investigates_quietly",
          label: "어머니에게 알리지 않고 먼저 법적 가능성을 알아본다",
          embedding: [0.44, -0.14, 0.32, 0.52, 0.22, 0.36, 0.28, 0.48],
          bias: -0.01,
          outcome: "변호사가 '이길 수는 있지만 그 뒤에 가족이 남겠냐'고 물었다. 대답하지 못했다.",
          endingWeight: { reformer: 2, caregiver: 1, whistleblower: 1 },
          memory: "변호사가 '이길 수 있지만 그 뒤에 가족이 남겠냐'고 물었다. 대답하지 못했다.",
          sets: {}
        },
        {
          id: "confronts_uncle",
          label: "외삼촌에게 직접 따진다",
          embedding: [0.36, 0.28, 0.58, 0.48, 0.14, -0.12, -0.38, 0.64],
          bias: -0.02,
          outcome: "외삼촌 눈을 보며 말하는 동안 어머니가 울기 시작했다. 이게 옳은 건지 몰랐지만 더 이상 모른 척은 할 수 없었다.",
          endingWeight: { whistleblower: 2, exile: 1, martyr: 1 },
          memory: "외삼촌 눈을 보며 말하는 동안 어머니가 울기 시작했다. 이게 옳은 건지 몰랐다.",
          sets: {}
        }
      ]
    },

    // ── ME016: K의 두 번째 배신 [requires: joined_k_startup] ──────────────────
    {
      id: "ME016",
      arc: "arc6",
      title: "K의 두 번째 배신",
      type: "betrayal_from_inside",
      tags: ["배신", "연대", "내부"],
      requires: { joined_k_startup: true },
      excludes: {},
      weight: 1.3,
      summary: `합류한 지 일 년이 지났다. 스타트업은 잘 굴러가고 있다.
그런데 최근 K의 행동이 이상하다. 공동창업자 J의 지분 계약서가 수정됐다는 이야기를 우연히 들었다.
J는 모르는 것 같다. 확인해보니 사실이었다. K가 똑같이 하고 있다.
당신은 내부에 있어서 안다. J는 아직 아무것도 모른다.`,
      event_embedding: [-0.18, 0.38, 0.62, 0.44, 0.28, -0.14, -0.32, 0.56],
      actions: [
        {
          id: "warns_j_directly",
          label: "J에게 직접 알린다",
          embedding: [0.44, -0.12, 0.72, 0.58, -0.22, 0.44, -0.28, 0.78],
          bias: 0,
          outcome: "J는 충격을 받았다. K는 그날 이후 당신을 다르게 본다.",
          endingWeight: { whistleblower: 3, reformer: 1, exile: 1 },
          memory: "J에게 말하고 나서 K의 얼굴을 마주쳤다. 아무 말 없이 지나쳤다.",
          sets: {}
        },
        {
          id: "confronts_k_privately",
          label: "K에게 먼저 따진다",
          embedding: [0.32, 0.14, 0.54, 0.48, 0.18, 0.22, 0.12, 0.62],
          bias: -0.01,
          outcome: "K는 '오해'라고 했다. 표정은 그렇지 않았다.",
          endingWeight: { reformer: 2, whistleblower: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "stays_out_of_it",
          label: "모른 척하고 내 일만 한다",
          embedding: [-0.28, 0.32, -0.44, -0.18, 0.48, -0.32, 0.62, -0.52],
          bias: 0.03,
          outcome: "내 계약서는 안전했다. J의 일은 내 일이 아니라고 생각했다. 생각하려 했다.",
          endingWeight: { conformist: 3, opportunist: 2 },
          memory: "J가 나중에 알게 됐을 때 내 이름을 꺼냈다는 얘기를 전해 들었다.",
          sets: {}
        }
      ]
    },

    // ── ME017: K의 전화 [requires: told_k_truth] ──────────────────────────────
    {
      id: "ME017",
      arc: "arc6",
      title: "K의 전화",
      type: "unexpected_vindication",
      tags: ["화해", "선택", "두 번째 기회"],
      requires: { told_k_truth: true },
      excludes: {},
      weight: 1.3,
      summary: `솔직하게 거절한 뒤 연락이 끊겼던 K가 3년 만에 전화를 걸어왔다.
K의 두 번째 스타트업은 올해 투자를 받으며 크게 성장했다.
처음에 K는 근황을 묻더니 이렇게 말했다. '그때 네가 그 말 해줘서, 내가 달라질 수 있었어. 그 공동창업자한테도 연락해서 사과했어.'
그리고 제안을 꺼낸다. 이번 스타트업의 파트너로 함께하자고.`,
      event_embedding: [0.36, -0.22, 0.28, 0.58, 0.42, 0.34, 0.18, 0.52],
      actions: [
        {
          id: "accepts_k_offer",
          label: "K의 제안을 받아들인다",
          embedding: [0.52, -0.18, 0.22, 0.68, 0.38, 0.42, 0.24, 0.46],
          bias: 0,
          outcome: "이번엔 달랐다. 아니, 다를 것이라고 생각했다.",
          endingWeight: { reformer: 2, changemaker: 2, caregiver: 1 },
          memory: "K와 악수하면서 3년 전 통화가 떠올랐다. 그때는 잘한 건지 몰랐다.",
          sets: {}
        },
        {
          id: "declines_k_again",
          label: "고맙지만 이번에도 거절한다",
          embedding: [0.18, -0.08, 0.44, 0.32, -0.12, 0.36, 0.28, 0.62],
          bias: -0.01,
          outcome: "K는 이번엔 웃으며 받아들였다. 관계는 달라졌다.",
          endingWeight: { exile: 2, survivor: 2, reformer: 1 },
          memory: "K가 먼저 전화를 끊었다. 이번엔 불편하지 않았다.",
          sets: {}
        }
      ]
    },

    // ── ME018: 아버지의 전화 ──────────────────────────────────────────────────
    {
      id: "ME018",
      arc: "arc6",
      title: "아버지의 전화",
      type: "family_favor_request",
      tags: ["가족", "청탁", "의리"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `저녁 늦게 아버지한테서 전화가 왔다. 지인 아들이 당신 회사 면접을 앞두고 있다며,
'이름만 한번 얘기해줘도 되지 않냐'고 한다.
아버지는 '네가 이런 부탁 싫어하는 거 안다. 근데 이번 한 번만'이라고 했다.
그 말이 맞다. 아버지는 이런 부탁을 처음 한다.
그 지인이 어머니 병원비를 빌려줬던 사람이라는 것도 알고 있다.`,
      event_embedding: [0.54, 0.28, -0.18, 0.64, 0.12, -0.08, 0.42, -0.14],
      actions: [
        {
          id: "agrees_to_mention",
          label: "이름 정도는 말해두겠다고 한다",
          embedding: [0.62, 0.44, -0.36, 0.72, 0.22, -0.18, 0.34, -0.28],
          bias: 0.03,
          outcome: "전화를 끊고 나서 담당자한테 짧은 메시지를 보냈다. 그게 전부였다. 그게 전부가 아닐 수도 있다.",
          endingWeight: { caregiver: 2, opportunist: 2, conformist: 1 },
          memory: "메시지를 보내고 나서 몇 번이나 다시 읽었다. 지우지는 않았다.",
          sets: {}
        },
        {
          id: "declines_explains",
          label: "못 하겠다고, 이유를 말한다",
          embedding: [0.24, -0.22, 0.58, 0.36, -0.28, 0.52, 0.18, 0.74],
          bias: -0.01,
          outcome: "아버지는 '그래, 알았다'고 했다. 목소리가 낮았다. 그 뒤로 며칠 동안 연락이 없었다.",
          endingWeight: { reformer: 2, whistleblower: 1, exile: 1 },
          memory: "아버지가 '그래, 알았다'고 했을 때의 목소리가 며칠 동안 머릿속에 남았다.",
          sets: {}
        },
        {
          id: "stalls_with_excuse",
          label: "내가 거기 영향력이 없다며 에둘러 거절한다",
          embedding: [-0.08, 0.18, -0.22, 0.12, 0.24, -0.14, 0.56, -0.32],
          bias: 0.01,
          outcome: "아버지는 '그렇구나' 하고 넘어갔다. 거짓말은 아니었지만 사실도 아니었다.",
          endingWeight: { conformist: 2, survivor: 2 },
          sets: {}
        }
      ]
    },

    // ── ME020: 익명 제보 ──────────────────────────────────────────────────────
    {
      id: "ME020",
      arc: "arc6",
      title: "익명 제보",
      type: "anonymous_whistleblowing",
      tags: ["고발", "위험", "구조"],
      requires: {},
      excludes: {},
      weight: 1.1,
      summary: `회사 안에서 조직적인 회계 조작이 이루어지고 있다는 정황을 알게 됐다.
당신이 직접 관여한 건 아니지만, 관련 자료가 담긴 메일을 우연히 봤다.
언론에 익명으로 제보하는 방법이 있다. 들키면 모든 게 끝난다.
하지만 아무도 모르게 넘어가면 이 구조는 계속된다.`,
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
          sets: { filed_anonymous_report: true }
        },
        {
          id: "saves_evidence_quietly",
          label: "일단 자료만 따로 보관해둔다",
          embedding: [0.08, 0.14, 0.34, 0.18, 0.28, 0.12, 0.22, 0.42],
          bias: 0.02,
          outcome: "외장하드에 저장했다. 언젠가 필요할지도 모른다는 생각으로.",
          endingWeight: { survivor: 2, whistleblower: 1 },
          sets: { saved_evidence: true }
        },
        {
          id: "deletes_and_forgets",
          label: "본 것을 지우고 모른 척한다",
          embedding: [-0.24, 0.36, -0.62, -0.28, 0.42, -0.36, 0.58, -0.64],
          bias: 0.03,
          outcome: "메일 창을 닫았다. 본 게 없는 사람이 되기로 했다.",
          endingWeight: { conformist: 3, forgotten: 1 },
          memory: "메일 창을 닫은 뒤로 그 숫자들이 며칠간 머릿속에 맴돌았다.",
          sets: {}
        }
      ]
    },

    // ── ME021a: 기자가 찾아왔다 [requires: filed_anonymous_report] ────────────
    {
      id: "ME021a",
      arc: "arc6",
      title: "기자가 찾아왔다",
      type: "journalist_contact",
      tags: ["언론", "공개", "결단"],
      requires: { filed_anonymous_report: true },
      excludes: {},
      weight: 1.3,
      summary: `제보한 지 두 달이 지났다. 그리고 오늘 오후, 경제부 기자라는 사람에게서 문자가 왔다.
'제보 내용과 관련해 직접 여쭤볼 게 있습니다.'
익명 제보였는데 어떻게 연락처를 알아낸 건지 모른다.
기자를 만나면 이제 익명이 아니게 된다. 만나지 않으면 기사가 약해질 수 있다.`,
      event_embedding: [-0.14, 0.42, 0.68, 0.18, 0.54, 0.22, -0.18, 0.64],
      actions: [
        {
          id: "meets_journalist",
          label: "만나기로 한다. 더 이상 숨지 않는다",
          embedding: [0.22, -0.28, 0.76, 0.34, 0.12, 0.48, -0.24, 0.84],
          bias: 0,
          outcome: "카페에서 한 시간 동안 얘기했다. 기자는 녹음기를 켰다. 이제 되돌릴 수 없다.",
          endingWeight: { whistleblower: 3, changemaker: 2, martyr: 2 },
          memory: "기자 앞에 앉아서 처음으로 내 이름을 댔다. 목소리가 떨리지 않으려 했다.",
          sets: {}
        },
        {
          id: "declines_journalist",
          label: "모른다고 답하고 연락을 끊는다",
          embedding: [-0.18, 0.24, -0.32, -0.14, 0.38, -0.22, 0.52, -0.44],
          bias: 0.02,
          outcome: "모른다고 했다. 기사는 제한적으로 나왔다. 회사는 '사실무근'이라고 했다.",
          endingWeight: { survivor: 2, conformist: 1, forgotten: 1 },
          sets: {}
        }
      ]
    },

    // ── ME021b: 증거의 무게 [requires: saved_evidence] ────────────────────────
    {
      id: "ME021b",
      arc: "arc6",
      title: "증거의 무게",
      type: "evidence_decision",
      tags: ["증거", "감사", "판단"],
      requires: { saved_evidence: true },
      excludes: {},
      weight: 1.3,
      summary: `조용히 자료만 모아둔 지 반 년이 지났다. 그 사이 회사 내부 감사가 시작됐고, 감사팀이 직원들을 개별 면담하고 있다.
당신 차례가 내일이다. 외장하드는 아직 서랍 안에 있다.
제출하면 조사가 달라질 수 있다. 하지만 당신이 그 자료를 갖고 있었다는 사실 자체가 문제가 될 수도 있다.`,
      event_embedding: [0.12, 0.28, 0.58, 0.24, 0.36, 0.34, 0.14, 0.62],
      actions: [
        {
          id: "submits_evidence",
          label: "내일 면담에서 자료를 제출한다",
          embedding: [0.24, -0.18, 0.72, 0.38, -0.12, 0.56, 0.08, 0.78],
          bias: 0,
          outcome: "자료를 꺼냈다. 감사관이 오래 들여다봤다. 면담이 두 시간이 됐다.",
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 },
          memory: "외장하드를 내밀면서 이제 내 손을 떠났다는 걸 느꼈다.",
          sets: {}
        },
        {
          id: "keeps_evidence_hidden",
          label: "자료를 제출하지 않고 면담을 마친다",
          embedding: [-0.14, 0.22, -0.28, -0.08, 0.44, -0.18, 0.48, -0.36],
          bias: 0.02,
          outcome: "면담은 무난히 끝났다. 외장하드는 아직 서랍에 있다.",
          endingWeight: { survivor: 3, conformist: 1 },
          memory: "면담을 마치고 자리로 돌아와 서랍을 한 번 열었다가 닫았다.",
          sets: {}
        }
      ]
    },

    // ── ME023: 탄원서 ─────────────────────────────────────────────────────────
    {
      id: "ME023",
      arc: "arc6",
      title: "탄원서",
      type: "petition_under_pressure",
      tags: ["연대", "위험", "동료"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `회사가 지방 공장 직원 200명을 구조조정하겠다고 발표했다.
며칠 뒤, 사무직 직원들 사이에서 반대 탄원서가 돌기 시작했다.
서명자 명단은 결국 위에 올라간다. 찍힐 수 있다는 걸 모두 안다.
그런데 당신 바로 앞자리 동료가 리스트를 내밀었다. '같이 서명할 거지?'`,
      event_embedding: [0.32, 0.18, 0.56, 0.44, -0.14, 0.28, -0.22, 0.52],
      actions: [
        {
          id: "signs_petition",
          label: "서명한다",
          embedding: [0.44, -0.08, 0.68, 0.52, -0.22, 0.42, -0.18, 0.72],
          bias: 0,
          outcome: "이름을 적었다. 손이 떨리지는 않았다. 떨렸는지도 모른다.",
          endingWeight: { whistleblower: 2, reformer: 2, martyr: 1 },
          memory: "탄원서에 이름을 쓰고 나서 리스트를 다시 내려다봤다. 내 이름이 거기 있었다.",
          sets: {}
        },
        {
          id: "declines_politely",
          label: "개인 사정을 이유로 거절한다",
          embedding: [-0.12, 0.22, -0.34, -0.08, 0.38, -0.16, 0.54, -0.38],
          bias: 0.03,
          outcome: "동료는 '그래, 어쩔 수 없지'라고 했다. 오후 내내 눈이 마주치지 않았다.",
          endingWeight: { survivor: 3, conformist: 1 },
          memory: "동료가 '그래, 어쩔 수 없지'라고 했을 때의 표정이 생각보다 오래 남았다.",
          sets: {}
        },
        {
          id: "checks_legal_risks_first",
          label: "서명 전에 법적 불이익 여부를 먼저 확인한다",
          embedding: [0.18, 0.12, 0.28, 0.32, 0.16, 0.28, 0.42, 0.44],
          bias: -0.01,
          outcome: "노무사에게 짧게 문의했다. 보복 금지 조항이 있지만, 현실적으로 보장되지는 않는다고 했다.",
          endingWeight: { reformer: 1, survivor: 1, whistleblower: 1 },
          sets: {}
        }
      ]
    },

    // ── E609: 후배의 연락 [requires: mentored_someone] ───────────────────────
    {
      id: "E609",
      arc: "arc6",
      title: "후배의 연락",
      type: "mentor_responsibility",
      tags: ["후배", "멘토", "책임"],
      requires: { mentored_someone: true },
      excludes: {},
      weight: 1.3,

      summary: `몇 년 전 점심 자리에서 이야기를 나눴던 후배에게서 연락이 왔다.
'선배, 저 그때 선배 말 듣고 계속 버텼는데요. 이제 진짜 한계인 것 같아요.'
그때 내가 뭐라고 했는지 정확히 기억나지 않는다.
하지만 그 후배는 기억하고 있다.`,

      actions: [
        {
          id: "listens_and_releases",
          label: "지금이라도 그만두는 게 맞을 수 있다고 말한다",
          outcome: `후배가 한동안 말이 없었다. '그 말이 필요했어요'라고 했다.
내가 예전에 어떤 말을 했는지가 다시 마음에 걸렸다.`,
          sets: { mentee_outcome: "supported" }
        },
        {
          id: "encourages_to_hold_on",
          label: "조금만 더 버텨보라고 말한다",
          outcome: `후배가 '네'라고 했다. 그 목소리가 편하지 않았다.
힘내라는 말이 맞는지 아닌지 확신이 없다.`,
          sets: { mentee_outcome: "pushed" }
        },
        {
          id: "asks_what_they_want",
          label: "지금 어떻게 하고 싶냐고 먼저 묻는다",
          outcome: `후배가 '그게 뭔지 모르겠어서 선배한테 물어본 거예요'라고 했다.
대답을 주려다 대화가 됐다.`,
          sets: { mentee_outcome: "talking" }
        }
      ]
    },

    // ── E610: 과거의 말 (발언 맥락 충돌) — 공통 ─────────────────────────────
    {
      id: "E610",
      arc: "arc6",
      title: "과거의 말",
      type: "past_vs_present_self",
      tags: ["발언", "과거", "정체성"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `6년 전 직장 커뮤니티에 올린 글 하나가 오늘 갑자기 캡처로 퍼지고 있다.
그때 그 말은 틀린 말이 아니었다. 하지만 지금의 나라면 그렇게 쓰지 않았을 것이다.
주변에서 연락이 오기 시작했다. 설명을 요구하는 사람도 있고, 그냥 링크만 보내온 사람도 있다.
나는 어떻게 대응할 것인가.`,

      summary_variants: {
        "reputation:high": `이름이 알려진 상황이라 파급이 빠르다. 당신의 이름이 여기저기서 거론된다.`,
        "workplace_stance:reformer": `그때는 개혁하려는 쪽이었는데, 지금 그 글이 반대로 읽히고 있다.`
      },

      actions: [
        {
          id: "posts_explanation",
          label: "직접 경위와 현재 생각을 공개적으로 밝힌다",
          outcome: `올렸다. 댓글이 달리기 시작했다.
진심을 인정하는 사람도, 아닌 사람도 있다. 이 설명이 상황을 나아지게 했는지는 며칠이 지나야 알 것 같다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "says_nothing_publicly",
          label: "공개 반응을 하지 않는다. 조용히 지나가길 기다린다",
          outcome: `3일이 지나자 다른 이슈가 올라왔다. 조용해졌다.
하지만 아는 사람들은 봤다. 그 사람들이 어떻게 생각하는지는 모른다.`,
          sets: {}
        },
        {
          id: "contacts_key_people",
          label: "공개 반응 대신 중요한 사람들에게 직접 연락한다",
          outcome: `몇 명에게 메시지를 보냈다. 이해해준 사람도 있고, 읽고 답이 없는 사람도 있다.
이게 더 나은 방식이었는지, 도망인지 모르겠다.`,
          sets: {}
        }
      ]
    },

    // ── ME024: 다른 팀으로 ────────────────────────────────────────────────────
    {
      id: "ME024",
      arc: "arc6",
      title: "다른 팀으로",
      type: "internal_transfer_decision",
      tags: ["커리어", "동료", "책임"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `다른 부서에서 이동 제안이 왔다. 현재 팀보다 연봉도 높고 업무도 맞다.
지금 팀은 프로젝트가 막바지라 인원이 빠지면 힘들다.
팀장은 아무 말도 하지 않았지만 표정이 굳었다.
이동은 당신의 권리다. 그리고 팀은 당신이 없으면 무너질 수도 있다.`,
      event_embedding: [0.14, -0.18, 0.12, 0.28, 0.54, 0.38, 0.32, 0.22],
      actions: [
        {
          id: "transfers_now",
          label: "제안을 받아들이고 이동한다",
          embedding: [-0.22, 0.12, 0.18, -0.14, 0.62, 0.14, 0.38, -0.18],
          bias: 0.02,
          outcome: "이동했다. 새 팀은 좋았다. 전 팀 프로젝트는 어떻게 됐는지 나중에야 들었다.",
          endingWeight: { opportunist: 2, survivor: 2 },
          sets: { transferred_away: true }
        },
        {
          id: "delays_for_team",
          label: "프로젝트가 끝날 때까지 기다렸다가 이동한다",
          embedding: [0.44, -0.14, 0.08, 0.48, 0.22, 0.32, 0.28, 0.42],
          bias: -0.01,
          outcome: "세 달을 기다렸다. 제안이 아직 유효한지는 확인해봐야 했다.",
          endingWeight: { caregiver: 2, reformer: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "declines_offer",
          label: "제안을 거절하고 현 팀에 남는다",
          embedding: [0.52, -0.08, -0.14, 0.58, -0.12, 0.18, 0.44, 0.12],
          bias: 0,
          outcome: "팀장이 뭔가 말하려다 그냥 자리로 돌아갔다. 프로젝트는 무사히 끝났다.",
          endingWeight: { caregiver: 3, martyr: 1 },
          memory: "팀장이 뭔가 말하려다 그냥 돌아가는 뒷모습을 봤다. 묻지 않았다.",
          sets: {}
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC6_THIRTIES;
} else {
  globalThis.ARC6_THIRTIES = ARC6_THIRTIES;
}
