/**
 * Arc 3 · 대학교 (E3xx)
 * 나이: 19~23세
 * 핵심 플래그 생성: university_tier, financial_status
 * 핵심 플래그 소비: exam_score, major (진입 분기), financial_status (아르바이트 이벤트)
 *
 * 톤: 자유와 방황. 처음으로 스스로 선택하는 삶.
 *     기대했던 대학이 전부가 아닐 수도 있다는 것을 서서히 알아가는 시기.
 *
 * 핵심 분기:
 *   exam_score: top + major: medicine/law → E303 (의대/법대 루트)
 *   exam_score: top (그 외)              → E304 (상위권 대학)
 *   exam_score: good                     → E305 (중위권 대학)
 *   exam_score: average                  → E306 (하위권 / 전문대 루트)
 *   major: arts                          → E308 (예술 전공 발표)
 *   financial_status: struggling/debt    → E307 가중치 상승
 */

const ARC3_UNIVERSITY = {
  id: "arc3",
  order: 3,
  title: "대학교",
  subtitle: "처음으로 스스로 선택하는 삶",
  age_range: "19–23세",
  chapter_card: "입학식 날 받은 학생증이 아직 어색하다. 이제 스스로 시간표를 짜고, 스스로 일어나야 한다.",
  events_per_run: 3,

  events: [

    // ── E301: 새내기 OT (정체성 선택) — 공통 ──────────────────────────────────
    {
      id: "E301",
      arc: "arc3",
      title: "새내기 배움터",
      type: "identity_choice",
      tags: ["MT", "무리", "술"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `입학 첫 주, 과 OT가 있다. 선배들이 이름표를 달아주고 게임을 시킨다.
술을 권하는 분위기다. 강요는 아닌 것 같지만, 안 마시면 이상해 보일 것 같다.
이 자리에서 어떻게 보이느냐가 앞으로 4년을 결정할 것 같다는 생각이 든다.
어떻게 할 것인가.`,

      actions: [
        {
          id: "dive_in",
          label: "적극적으로 어울린다. 첫인상이 중요하다",
          outcome: `게임에서 지고 벌칙을 받았다. 웃음소리가 크다.
이름을 외워줬다. 다음 날 선배가 먼저 아는 척한다. 무리에 들어간 느낌이다.`,
          sets: { social_role: "leader" }
        },
        {
          id: "be_polite_but_quiet",
          label: "웃으며 참여하되 술은 정중히 거른다",
          outcome: `"저 좀 못 마셔서요"라고 했다. 억지로 권하는 사람은 없었다.
조용히 있었는데, 비슷한 사람이 옆에 앉더니 말을 건다.`,
          sets: { social_role: "follower" }
        },
        {
          id: "leave_early",
          label: "중간에 조용히 빠져나온다",
          outcome: `버스에서 혼자 이어폰을 꽂았다. 이런 자리가 체질에 맞지 않는다.
나중에 같이 있었던 사람들이 기억하는 내 이름이 있을지 모르겠다.`,
          sets: { social_role: "loner" }
        }
      ]
    },

    // ── E302: 전공 첫 수업 (방향 선택) — 공통 ────────────────────────────────
    {
      id: "E302",
      arc: "arc3",
      title: "전공 첫 수업",
      type: "direction_choice",
      tags: ["전공", "공부", "방향"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `첫 전공 수업. 교수님이 실라버스를 나눠준다.
과제, 중간고사, 기말, 출석. 고등학교보다 자유롭지만 그만큼 내가 챙겨야 한다.
옆에 앉은 동기는 이미 전공 책을 읽어왔다.
당신은 이 전공을 어떻게 대할 것인가.`,

      summary_variants: {
        "major:medicine": `첫 해부학 강의. 교수님이 인체 모형 앞에 선다.
의사가 된다는 게 실감나기 시작한다. 동시에 6년이라는 시간이 어마어마하게 느껴진다.
이 길이 내가 원한 길인지, 아니면 점수가 데려온 길인지 아직 잘 모르겠다.`,
        "major:arts": `첫 실기 수업. 교수님이 작품 하나를 화면에 띄우고 아무 말도 않는다.
"어떻게 보여?" 라고 물어본다. 침묵이 흐른다.
고등학교 때 하던 방식이 여기서는 통하지 않을 것 같다.`
      },

      actions: [
        {
          id: "study_seriously",
          label: "전공 공부를 제대로 해본다. 이걸 잘하고 싶다",
          outcome: `첫 중간고사에서 나쁘지 않은 점수를 받았다.
교수님이 이름을 기억하는 것 같다. 뭔가 맞는 방향에 있는 느낌이다.`,
          sets: { academic_effort: "high", reputation: "medium" }
        },
        {
          id: "cruise_and_explore",
          label: "전공은 적당히 하고 다른 것들도 찾아본다",
          outcome: `학점이 그럭저럭이다. 대신 교양 수업에서 재미있는 걸 발견했다.
뭐가 더 중요한지 아직 모르겠다.`,
          sets: { academic_effort: "medium" }
        },
        {
          id: "skip_class",
          label: "출석만 하고 딱히 열심히 안 한다",
          outcome: `기말 직전에 공황이 왔다. 친구들한테 노트를 빌렸다.
어찌어찌 통과했지만, 배운 게 있는지는 잘 모르겠다.`,
          sets: { academic_effort: "low" }
        }
      ]
    },

    // ── E303: 의대·법대 생활 (위기 대응) — exam_score:top + major:medicine/law ──
    {
      id: "E303",
      arc: "arc3",
      title: "이 길이 맞는가",
      type: "crisis_response",
      tags: ["의대", "법대", "번아웃", "진로"],
      requires: { exam_score: "top", major: ["medicine", "law"] },
      excludes: {},
      weight: 1.5,

      summary: `3학년. 주변 친구들이 대학 생활을 즐기는 동안 당신은 시험 준비 중이다.
의대면 국가고시, 법대면 로스쿨 또는 사법시험 준비.
이 길에 들어섰을 때 원했던 게 무엇인지, 지금도 원하는지 점점 흐릿해진다.
후배가 "왜 이 전공 선택했어요?"라고 물어본다.`,

      actions: [
        {
          id: "stay_the_course",
          label: "여기까지 온 이상 끝까지 간다",
          outcome: `납득이 아니라 관성이다. 하지만 관성도 앞으로 나아간다.
졸업이 가까워지면서 오히려 단단해지는 부분이 생긴다.`,
          sets: { university_tier: "top", reputation: "high" }
        },
        {
          id: "double_major",
          label: "복수전공으로 숨통을 튼다",
          outcome: `다른 학과 수업을 들으니 세상이 넓어진 느낌이다.
졸업이 한 학기 늘어났지만, 뭔가 내 것이 생긴 것 같다.`,
          sets: { university_tier: "top", academic_effort: "high" }
        },
        {
          id: "transfer_or_quit",
          label: "전과 또는 자퇴를 진지하게 고민한다",
          outcome: `결정은 아직 못 했다. 하지만 이 길이 전부가 아닐 수 있다는 걸 처음으로 인정했다.
부모님한테 말하는 게 더 무섭다.`,
          sets: { university_tier: "top", financial_status: "struggling" }
        }
      ]
    },

    // ── E304: 상위권 대학 (방향 선택) — exam_score:top, major: 의·법대 제외 ─────
    {
      id: "E304",
      arc: "arc3",
      title: "기대했던 캠퍼스",
      type: "direction_choice",
      tags: ["상위권", "스펙", "자유"],
      requires: { exam_score: "top" },
      excludes: { major: ["medicine", "law"] },
      weight: 1.2,

      summary: `들어오고 싶었던 학교다. 캠퍼스가 크고 사람이 많다.
동기들은 대부분 공부를 잘했던 사람들이다. 그런데 여기서도 위아래가 갈린다.
취업이 보장되는 것도 아니고, 대학원을 가야 하는 전공도 있다.
이 4년을 어떻게 쓸 것인가.`,

      actions: [
        {
          id: "build_spec",
          label: "인턴, 학회, 대외활동으로 스펙을 쌓는다",
          outcome: `3학년 때 이미 이력서에 쓸 게 여럿 생겼다.
학점이 조금 흔들렸지만, 연결망이 생겼다.`,
          sets: { university_tier: "top", reputation: "high" }
        },
        {
          id: "go_deep_in_major",
          label: "전공 공부에 깊이 파고든다. 대학원도 고려한다",
          outcome: `교수님 연구실에 드나들기 시작했다. 논문 보조를 했다.
졸업 후 진로는 더 좁아졌지만, 더 선명해졌다.`,
          sets: { university_tier: "top", academic_effort: "high" }
        },
        {
          id: "enjoy_campus_life",
          label: "동아리, 여행, 연애. 지금 아니면 못 한다",
          outcome: `학점은 평범하다. 하지만 기억에 남는 시간들이 생겼다.
취업 시즌에 무기가 없다는 걸 그때 가서 알게 된다.`,
          sets: { university_tier: "top", financial_status: "stable" }
        }
      ]
    },

    // ── E305: 중위권 대학 생활 (우선순위 선택) — exam_score:good ──────────────
    {
      id: "E305",
      arc: "arc3",
      title: "여기서 뭘 증명해야 하나",
      type: "priority_choice",
      tags: ["대학", "학점", "자존심"],
      requires: { exam_score: "good" },
      excludes: {},
      weight: 1.2,

      summary: `수시로 붙었거나 정시 점수에 맞춰 온 학교다.
원하던 곳은 아닌데, 막상 와보니 나쁘지 않다.
문제는 취업할 때 어디 나왔냐는 게 아직 중요한 세상이라는 것.
이 4년을 어떻게 써야 할지 모르겠다.`,

      actions: [
        {
          id: "top_of_class",
          label: "학점 4.0 이상을 목표로 한다. 여기서 1등이 낫다",
          outcome: `전체 수석은 아니지만, 전공 상위 5%에 들었다.
장학금이 나왔다. 교수님 추천서도 받을 수 있게 됐다.`,
          sets: { university_tier: "mid", academic_effort: "high", financial_status: "stable" }
        },
        {
          id: "transfer_prep",
          label: "편입을 준비한다. 여기에 안주하기 싫다",
          outcome: `2년 동안 편입 공부를 병행했다. 학점 관리가 쉽지 않았다.
결국 편입 시험 결과가 나왔다. 어떻게 됐든, 움직이려 했다는 사실이 남는다.`,
          sets: { university_tier: "mid", academic_effort: "high" }
        },
        {
          id: "focus_on_what_i_like",
          label: "학교 이름보다 내가 하고 싶은 걸 한다",
          outcome: `학점이 그럭저럭이다. 대신 대외활동이나 개인 프로젝트가 늘었다.
이게 나중에 어떻게 보일지는 모르겠다.`,
          sets: { university_tier: "mid", reputation: "medium" }
        }
      ]
    },

    // ── E306: 낮은 점수로 온 대학 (리스크 선택) — exam_score:average ───────────
    {
      id: "E306",
      arc: "arc3",
      title: "이 자리에서 시작한다",
      type: "risk_choice",
      tags: ["전문대", "하위권", "현실"],
      requires: { exam_score: "average" },
      excludes: {},
      weight: 1.2,

      summary: `4년제인지 2년제인지, 지방인지 서울인지.
어쨌든 당신은 입학했다. 기대가 크지 않았기에 오히려 덤덤하다.
그런데 주변을 보면 묘하다. 의외로 열심히 하는 사람도 있고, 처음부터 포기한 사람도 있다.
여기서 어떻게 살 것인가.`,

      actions: [
        {
          id: "be_the_best_here",
          label: "여기서 1등을 한다. 시작점이 전부는 아니다",
          outcome: `학점 4.3, 자격증 두 개. 취업 시즌에 교수님 추천을 받았다.
출신 학교보다 무엇을 했냐로 평가받을 수 있다는 걸 믿어보기로 했다.`,
          sets: { university_tier: "low", academic_effort: "high", reputation: "medium" }
        },
        {
          id: "switch_path",
          label: "공무원 시험이나 자격증 준비로 방향을 튼다",
          outcome: `전공 수업보다 시험 공부 시간이 많아졌다.
졸업할 때 학점은 평범하지만 준비는 됐다는 느낌이다.`,
          sets: { university_tier: "low", career_start: "public" }
        },
        {
          id: "just_get_through",
          label: "졸업장만 받으면 된다고 생각하고 버틴다",
          outcome: `학교를 다녔다. 졸업도 했다.
이 시간이 어떤 의미였는지는 나중에 알게 될 것 같다.`,
          sets: { university_tier: "low", academic_effort: "low" }
        }
      ]
    },

    // ── E307: 돈이 부족하다 (위기 대응) — financial_status 취약 시 가중치 상승 ──
    {
      id: "E307",
      arc: "arc3",
      title: "등록금 고지서",
      type: "crisis_response",
      tags: ["돈", "알바", "가족"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `2학기 등록금 고지서가 나왔다. 집에서 더 이상 대주기 어렵다고 했다.
장학금은 아슬아슬하게 못 받았다. 학자금 대출을 받으면 졸업할 때 빚이 된다.
알바를 시작하면 공부할 시간이 줄어든다.
당신이 선택해야 한다.`,

      summary_variants: {
        "financial_status:struggling": `등록금은커녕 이번 달 생활비가 부족하다.
부모님한테 연락이 왔는데 미루고 있다.
이 상황을 어떻게 버텨낼 것인가.`,
        "financial_status:debt": `학자금 대출이 이미 있다. 이번 학기도 빌려야 한다.
숫자가 쌓여가는 게 눈에 보인다.`
      },

      actions: [
        {
          id: "take_loan",
          label: "학자금 대출을 받는다. 취업하고 갚으면 된다",
          outcome: `통장에 돈이 들어왔다. 공부에 집중할 수 있게 됐다.
하지만 졸업 후 매달 나갈 금액이 계산된다.`,
          sets: { financial_status: "debt" }
        },
        {
          id: "start_part_time",
          label: "알바를 시작한다. 직접 벌어서 쓴다",
          outcome: `카페, 편의점, 과외. 시간을 쪼개서 쓴다.
학점이 조금 흔들렸지만, 내 돈이라는 게 다르다.`,
          sets: { financial_status: "stable", academic_effort: "medium" }
        },
        {
          id: "ask_parents",
          label: "부모님께 한 번만 더 부탁드린다",
          outcome: `받았다. 미안하다는 말을 했다. 부모님은 괜찮다고 했다.
이 부탁이 무겁게 남는다.`,
          sets: { financial_status: "stable" }
        }
      ]
    },

    // ── E308: 예술 전공 발표 (기회 선택) — major:arts ───────────────────────
    {
      id: "E308",
      arc: "arc3",
      title: "첫 전시·발표",
      type: "opportunity_choice",
      tags: ["예술", "발표", "전시"],
      requires: { major: ["arts", "humanities"] },
      excludes: {},
      weight: 1.4,

      summary: `종강 전시나 학과 공연 날이다.
당신의 작품이나 무대가 사람들에게 공개된다. 교수님과 동기, 다른 과 사람들도 온다.
준비 과정은 고됐다. 결과물을 공개한다는 게 이상하게 무섭다.
마지막 순간, 어떤 태도로 이 자리에 설 것인가.`,

      actions: [
        {
          id: "go_bold",
          label: "하고 싶은 걸 다 담았다. 반응이 어떻든 이게 내 것이다",
          outcome: `반응이 갈렸다. 좋아하는 사람은 강하게 좋아했다.
교수님 피드백이 날카로웠지만 기억에 남는다.
이 경험이 방향을 하나 결정해준 것 같다.`,
          sets: { reputation: "medium", financial_status: "stable" }
        },
        {
          id: "play_it_safe",
          label: "무난하게 완성도에 집중했다",
          outcome: `나쁘지 않은 평가를 받았다. 깎일 것도 없었다.
하지만 뭔가 다 담지 못했다는 느낌이 남는다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "submit_to_competition",
          label: "이 작품을 외부 공모전에 낸다",
          outcome: `입상은 못 했다. 하지만 심사 피드백이 왔다.
자기 작품이 세상에서 어디쯤인지를 처음으로 알게 됐다.`,
          sets: { reputation: "high", financial_status: "stable" }
        }
      ]
    },

    // ── E309: 대학 연애 (관계 선택) — 공통 ──────────────────────────────────
    {
      id: "E309",
      arc: "arc3",
      title: "사귈까",
      type: "relationship_choice",
      tags: ["연애", "감정", "선택"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `좋아하는 사람이 생겼다. 같은 과거나, 동아리거나, 같이 수업을 듣는 사람이다.
상대방도 나에게 관심이 있는 것 같다는 신호가 왔다.
대학 생활 중 연애는 당연한 것처럼 느껴지는데, 당신에게는 어떨지 모르겠다.`,

      actions: [
        {
          id: "confess",
          label: "먼저 마음을 전한다",
          outcome: `말했다. 상대방이 잠깐 침묵하다가 답했다.
어떤 대답이든, 이제부터 이 사람과의 관계가 달라진다.`,
          sets: { relationship_history: "committed" }
        },
        {
          id: "keep_distance",
          label: "좋아하지만 지금은 때가 아닌 것 같아 거리를 둔다",
          outcome: `아무것도 안 했다. 그 감정이 조용히 식었다.
나중에 이 선택이 맞았는지 틀렸는지 알 수 없다.`,
          sets: { relationship_history: "none" }
        },
        {
          id: "casual",
          label: "진지하지 않게, 가볍게 만난다",
          outcome: `편하게 만났다. 서로 묶이지 않는다는 걸 알고 있었다.
언제까지 이럴 수 있을지 모르겠다.`,
          sets: { relationship_history: "casual" }
        }
      ]
    },

    // ── E310: 동아리 vs 스펙 (우선순위 선택) — 공통 ────────────────────────
    {
      id: "E310",
      arc: "arc3",
      title: "남은 시간을 어디에 쓸까",
      type: "priority_choice",
      tags: ["동아리", "스펙", "인턴"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `3학년이 됐다. 주변이 본격적으로 움직이기 시작한다.
인턴 지원서를 쓰는 사람, 교환학생을 가는 사람, 동아리를 계속 하는 사람.
남은 대학 시간을 어디에 써야 할지 자꾸 생각하게 된다.`,

      actions: [
        {
          id: "build_career",
          label: "인턴, 자격증, 공모전. 취업 준비를 시작한다",
          outcome: `바빠졌다. 동기들과 어울릴 시간이 줄었다.
하지만 이력서에 쓸 내용이 하나씩 생긴다.`,
          sets: { reputation: "high", financial_status: "stable" }
        },
        {
          id: "go_exchange",
          label: "교환학생을 간다. 다른 세상을 보고 싶다",
          outcome: `6개월, 다른 나라에서 살아봤다.
언어도, 사람도, 생각하는 방식도 달랐다. 돌아왔을 때 뭔가가 바뀐 것 같다.`,
          sets: { reputation: "medium", financial_status: "struggling" }
        },
        {
          id: "stay_in_club",
          label: "동아리를 끝까지 한다. 이 관계가 더 소중하다",
          outcome: `졸업할 때 같이 찍은 사진이 여럿 생겼다.
취업 시즌에 스펙이 얇다는 게 느껴진다. 그래도 후회는 없다.`,
          sets: { social_role: "leader", reputation: "medium" }
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC3_UNIVERSITY;
} else {
  globalThis.ARC3_UNIVERSITY = ARC3_UNIVERSITY;
}
