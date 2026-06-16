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
  events_per_run: 3,

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
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC6_THIRTIES;
} else {
  globalThis.ARC6_THIRTIES = ARC6_THIRTIES;
}
