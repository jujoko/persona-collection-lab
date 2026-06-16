/**
 * Arc 2 · 고등학교 (E2xx)
 * 나이: 16~18세
 * 핵심 플래그 생성: exam_score, major, relationship_history
 * 핵심 플래그 소비: academic_effort, social_role, first_interest
 *
 * 작성 기준: STORY_SPEC.md Arc 2 섹션
 */

const ARC2_HIGHSCHOOL = {
  id: "arc2",
  order: 2,
  title: "고등학교",
  subtitle: "선택이 미래를 결정하는 시절",
  age_range: "16–18세",
  chapter_card: "내신과 수능 사이에서, 그리고 꿈과 현실 사이에서. 고등학교 3년은 짧고 무겁다.",
  events_per_run: 3,

  events: [

    // ── E201: 이과 vs 문과 (방향 선택) ──────────────────────────────────
    {
      id: "E201",
      arc: "arc2",
      title: "문과냐 이과냐",
      type: "direction_choice",
      tags: ["진로", "적성", "선택"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `당신은 고등학교 1학년 2학기, 문·이과 선택 원서를 손에 들고 있다.
선생님은 "신중하게 생각하라"고 했지만 실제로는 이번 주 안에 내야 한다.
좋아하는 과목은 국어와 역사인데, 부모님은 "이과 가야 밥 먹고 산다"고 한다.
친한 친구는 이과를 선택했고, 짝꿍은 문과로 간다고 했다.`,

      summary_variants: {
        "first_interest:stem": `당신은 수학과 과학이 잘 맞는다는 걸 진작부터 알았다.
그래도 원서를 손에 드니 묘하게 망설여진다. 이 선택이 단순한 수업 편성이 아니라는 걸 느낀다.`,
        "first_interest:arts": `당신은 이미 알고 있다. 음악이든 미술이든, 이 틀 안에서는 답이 없을 수도 있다.
그럼에도 원서를 내야 한다. 예고 입시를 준비해야 할까, 아니면 일반고에서 버텨야 할까.`
      },

      actions: [
        {
          id: "choose_stem",
          label: "이과를 선택한다",
          outcome: `이과반에 배정된다. 수학과 과학 비중이 급격히 올라간다.
처음 한 달은 따라가기 벅차지만, 문제를 풀어내는 쾌감도 있다.
부모님은 안도한다.`,
          sets: { major: "stem", academic_effort: "medium" }
        },
        {
          id: "choose_humanities",
          label: "문과를 선택한다",
          outcome: `문과반에 배정된다. 국어와 사회 수업이 늘어난다.
좋아하는 걸 배우는 느낌이 든다. 하지만 부모님은 "나중에 후회한다"는 말을 반복한다.`,
          sets: { major: "humanities", academic_effort: "medium" }
        },
        {
          id: "pursue_arts",
          label: "예고 전학 또는 실기 준비를 결심한다",
          outcome: `선생님과 부모님 모두 놀란다.
설득의 과정은 길고 지치지만, 처음으로 내가 원하는 것을 말한 느낌이 든다.`,
          requires: { first_interest: ["arts"] },
          sets: { major: "arts", academic_effort: "high" }
        }
      ]
    },

    // ── E202: 공부 방식 선택 (방향 선택) ─────────────────────────────────
    {
      id: "E202",
      arc: "arc2",
      title: "나만의 공부법",
      type: "direction_choice",
      tags: ["학업", "자율", "습관"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `고등학교 2학년 첫 달, 주변 친구들은 저마다의 방식으로 공부하고 있다.
학원을 세 개씩 다니는 친구, 새벽 1시까지 독서실에 있는 친구,
유튜브로 강의를 골라 듣는 친구, 교과서만 파는 친구.
당신은 아직 나만의 방식을 찾지 못했다. 어떻게 공부할 것인가.`,

      actions: [
        {
          id: "intensive_private",
          label: "학원을 늘리고 타이트한 스케줄로 간다",
          outcome: `일주일에 6일은 학원에 있다. 잠이 부족하고 자유 시간이 없다.
성적은 오르지만, 뭔가를 잃어가는 느낌이 든다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "self_directed",
          label: "학원 없이 스스로 계획을 짜서 공부한다",
          outcome: `처음에는 의지대로 안 된다. 하지만 내 페이스를 찾아가면서
점점 집중력이 늘어난다. 결과는 불확실하지만 과정은 내 것이다.`,
          sets: { academic_effort: "medium" }
        },
        {
          id: "minimal_study",
          label: "최소한만 하고 나머지 시간을 내가 원하는 것에 쓴다",
          outcome: `성적은 평범하다. 하지만 그 시간에 책을 읽고, 음악을 듣고, 친구들과 어울렸다.
나중에 그 시절을 돌아볼 때 어떻게 기억될까, 아직은 모른다.`,
          sets: { academic_effort: "low" }
        }
      ]
    },

    // ── E203: 담임의 진로 압박 (도덕 딜레마) ─────────────────────────────
    {
      id: "E203",
      arc: "arc2",
      title: "담임의 말",
      type: "moral_dilemma",
      tags: ["권위", "진로", "자아"],
      requires: {},
      excludes: { major: "arts" },
      weight: 0.9,

      summary: `진로 상담 시간. 담임 선생님이 당신의 성적표를 보며 말한다.
"이 점수로 그쪽 과는 힘들어. 현실적으로 생각해야 해."
당신이 원하는 전공은 경쟁률도 높고, 취업이 불확실하다.
선생님의 말은 틀리지 않을 수 있다. 하지만 듣고 싶은 말이 아니다.`,

      actions: [
        {
          id: "accept_advice",
          label: "선생님 말이 맞다고 생각하고 현실적인 목표를 잡는다",
          outcome: `현실 가능한 목표로 수정한다. 마음 한구석이 조금 텅 빈 것 같지만,
나쁘지 않을 수도 있다는 생각도 든다.`,
          sets: {}
        },
        {
          id: "push_back",
          label: "원하는 방향을 끝까지 고수하겠다고 말한다",
          outcome: `선생님은 당신을 걱정 어린 눈으로 본다. 하지만 당신은 물러서지 않는다.
앞으로 이 선택을 혼자 증명해야 할 것이다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "stay_silent",
          label: "아무 말 없이 고개를 끄덕인다",
          outcome: `상담은 끝났다. 선생님의 말이 옳은지 그른지는 모르겠다.
하지만 속에 있는 말을 꺼내지 못했다는 느낌이 남는다.`,
          sets: {}
        }
      ]
    },

    // ── E204: 수능 D-1 (우선순위 선택) ────────────────────────────────────
    {
      id: "E204",
      arc: "arc2",
      title: "수능 전날 밤",
      type: "priority_choice",
      tags: ["수능", "컨디션", "선택"],
      requires: {},
      excludes: {},
      weight: 1.3,

      summary: `내일이 수능이다.
지금 시각 밤 10시. 책상에는 취약 단원 정리 노트가 펼쳐져 있다.
오늘 더 공부하면 한두 개 더 맞힐 수 있을지도 모른다.
하지만 수면 부족이 판단력에 영향을 준다는 것도 알고 있다.
엄마가 방문을 두드리며 "이제 자라"고 한다.`,

      summary_variants: {
        "academic_effort:high": `수개월간 하루도 빠짐없이 공부해 왔다. 할 건 다 했다는 느낌도 있고,
그렇지 않다는 불안함도 있다. 오늘 밤만 남았다.`,
        "academic_effort:low": `솔직히 준비가 충분하지 않았다. 오늘 밤을 어떻게 보내야 할지 모르겠다.
벼락치기가 의미가 있을까, 아니면 그냥 자야 할까.`
      },

      actions: [
        {
          id: "study_all_night",
          label: "새벽까지 취약 부분을 더 본다",
          outcome: `새벽 2시에 잠든다. 시험 당일 눈이 빨갛다.
몇 가지 공식이 머릿속에 남아있는 것도 같고, 머리가 무겁기도 하다.`,
          sets: { exam_score: "average" }
        },
        {
          id: "sleep_early",
          label: "일찍 자고 컨디션을 최우선으로 한다",
          outcome: `11시에 잠자리에 든다. 새벽에 한 번 깼지만 다시 잤다.
시험장에 들어설 때 머리가 맑다. 준비한 것들이 또렷이 떠오른다.`,
          sets: { exam_score: "good" }
        },
        {
          id: "cant_sleep",
          label: "공부도 잠도 안 되고 멍하니 있는다",
          outcome: `핸드폰만 보다 새벽 1시가 됐다. 억지로 불을 끄고 눕는다.
시험장에서 유독 첫 문제가 오래 걸린다.`,
          sets: { exam_score: "average" }
        }
      ]
    },

    // ── E205: 수능 성적 발표 (위기 대응) ─────────────────────────────────
    {
      id: "E205",
      arc: "arc2",
      title: "수능 성적 발표",
      type: "crisis_response",
      tags: ["수능", "결과", "가족"],
      requires: {},
      excludes: {},
      weight: 1.3,

      summary: `성적이 떴다.
화면을 보는 순간 머릿속이 하얘진다.
기대보다 낮다. 혹은 예상보다 훨씬 낮다.
부모님이 옆에서 기다리고 있다.`,

      summary_variants: {
        "academic_effort:high": `이만큼 했는데 이게 결과라니. 분하고 억울하다.
부모님이 옆에서 기다리고 있다. 뭐라고 말해야 할지 모르겠다.`,
        "academic_effort:low": `사실 예상은 했다. 하지만 막상 숫자를 보니 다른 느낌이다.
부모님이 옆에서 기다리고 있다.`
      },

      actions: [
        {
          id: "tell_truth",
          label: "점수를 그대로 보여드린다",
          outcome: `정적이 흐른다. 엄마가 한숨을 쉰다. 아빠는 말이 없다.
하지만 숨기지 않았다는 것, 그것만큼은 내 것이다.`,
          sets: {}
        },
        {
          id: "act_unbothered",
          label: "괜찮은 척하며 \"다음이 있어\"라고 말한다",
          outcome: `부모님은 잘 모르겠다는 표정이다. 당신도 모르겠다.
괜찮은 척이 언제까지 이어질 수 있을까.`,
          sets: {}
        },
        {
          id: "break_down",
          label: "그 자리에서 울음이 터진다",
          outcome: `엄마가 등을 두드린다. 아무 말도 하지 않는다.
한참 울다 보니 조금 가벼워진 것 같기도 하다.`,
          sets: {}
        }
      ]
    },

    // ── E206: 재수 결정 (방향 선택) ───────────────────────────────────────
    {
      id: "E206",
      arc: "arc2",
      title: "재수를 할까",
      type: "direction_choice",
      tags: ["재수", "진학", "선택"],
      requires: { exam_score: ["average", "fail"] },
      excludes: {},
      weight: 1.0,

      summary: `원하는 대학에 붙지 못했다.
지금 할 수 있는 선택은 세 가지다.
가고 싶지 않은 대학에 진학하거나, 1년을 더 준비하거나,
아예 다른 길을 찾거나.
주변 어른들의 의견은 제각각이다. 결국 당신이 결정해야 한다.`,

      actions: [
        {
          id: "go_anyway",
          label: "일단 붙은 대학에 입학한다",
          outcome: `최선이 아닐 수도 있지만, 지금 할 수 있는 선택이다.
새 학기가 시작되면 생각보다 적응이 빠를 수도 있다.`,
          sets: { university_tier: "mid", exam_score: "average" }
        },
        {
          id: "take_a_year",
          label: "재수를 결심한다",
          outcome: `다음 해 3월, 당신은 재수학원 책상에 앉는다.
1년 전으로 돌아온 것 같은 느낌. 이번엔 달라질까.`,
          sets: { university_tier: null, exam_score: null }
          // Arc 2.5 (재수 미니아크)로 진입
        },
        {
          id: "alternative_path",
          label: "대학 진학 대신 다른 길을 찾는다",
          outcome: `취업, 유학, 기술학교, 혹은 창업. 선택지는 많다.
주변 시선이 부담스럽지만, 남들이 정해준 길을 따르지 않겠다고 결심했다.`,
          sets: { university_tier: "none", career_start: "delayed" }
        }
      ]
    },

    // ── E207: 첫 연애 (관계 선택) ─────────────────────────────────────────
    {
      id: "E207",
      arc: "arc2",
      title: "고백할까",
      type: "relationship_choice",
      tags: ["연애", "감정", "선택"],
      requires: {},
      excludes: {},
      weight: 0.8,

      summary: `오래 알고 지낸 친구가 있다. 언제부터인가 그 사람이 신경 쓰인다.
학교 끝나고 같이 편의점에 가고, 문자가 오면 먼저 열어보고 있다.
상대방도 뭔가 다른 것 같기도 하고, 그냥 친한 것 같기도 하다.
수능까지 6개월이 남았다.`,

      actions: [
        {
          id: "confess",
          label: "마음을 전한다",
          outcome: `상대방도 비슷한 마음이었다. 고3 연인이 생겼다.
공부에 집중이 안 될 때도 있지만, 같이 있으면 힘이 나기도 한다.`,
          sets: { relationship_history: "committed" }
        },
        {
          id: "wait_after_suneung",
          label: "수능 끝나고 말하기로 한다",
          outcome: `수능이 끝난 날, 막상 말하려니 어색하다.
그 사이 상대방에게 다른 사람이 생겼다. 타이밍은 언제나 애매하다.`,
          sets: { relationship_history: "none" }
        },
        {
          id: "focus_on_study",
          label: "이 감정을 접어두고 공부에 집중한다",
          outcome: `감정을 눌렀다. 대신 공부가 조금 더 됐다.
그 사람이 가끔 생각나지만, 지금은 이게 맞는 것 같다.`,
          sets: { relationship_history: "none", academic_effort: "high" }
        }
      ]
    },

    // ── E208: 자퇴 유혹 (리스크 선택) ────────────────────────────────────
    {
      id: "E208",
      arc: "arc2",
      title: "학교를 그만둘까",
      type: "risk_choice",
      tags: ["자퇴", "도전", "선택"],
      requires: { first_interest: ["arts", "stem"] },
      excludes: {},
      weight: 0.6,

      summary: `같은 반 친구 하나가 학교를 그만뒀다.
유튜브를 시작했고, 벌써 구독자가 꽤 된다.
그 친구가 "너도 나와. 학교에서 배우는 건 필요없어"라고 한다.
솔직히 지금 하는 공부가 내 꿈과 직접 연결된다는 느낌이 없다.
하지만 학교를 나가면 다시는 돌아오기 어렵다는 것도 안다.`,

      summary_variants: {
        "first_interest:arts": `그 친구는 음악으로 이미 팬이 생기고 있다.
당신도 만들고 싶은 게 있다. 학교 시스템이 그것과 무슨 관계인지 모르겠다.`
      },

      actions: [
        {
          id: "quit_school",
          label: "자퇴를 결심한다",
          outcome: `담임선생님이 만류하고 부모님이 거세게 반대한다.
하지만 당신은 결심을 바꾸지 않는다. 이제부터는 증명의 시간이다.`,
          sets: { university_tier: "none", career_start: "freelance", academic_effort: "low" }
        },
        {
          id: "stay_in_school",
          label: "일단 졸업은 한다",
          outcome: `학교에 남는다. 하지만 그 친구가 성장하는 걸 SNS로 보며
뭔가를 놓치고 있는 건 아닐까 하는 생각이 들 때가 있다.`,
          sets: {}
        },
        {
          id: "side_project",
          label: "학교는 다니면서 방과 후에 따로 시작해본다",
          outcome: `하루에 2~3시간씩, 피곤하지만 뭔가 만들어가는 느낌이 있다.
작은 성과가 생기면 더 확신이 생기고, 없으면 흔들릴 것이다.`,
          sets: { academic_effort: "medium" }
        }
      ]
    },

    // ── E209: 내신 vs 수능 (우선순위 선택) ────────────────────────────────
    {
      id: "E209",
      arc: "arc2",
      title: "내신이냐 수능이냐",
      type: "priority_choice",
      tags: ["학업", "전략", "선택"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `고2 담임 면담. 선생님이 묻는다. "내신 관리할 거야, 수능에 올인할 거야?"
두 가지를 동시에 잘 하는 건 현실적으로 어렵다.
내신은 학교 수행평가와 지필고사, 수능은 모의고사 중심으로 공부 방향이 갈린다.
어떤 전략으로 갈 것인가.`,

      actions: [
        {
          id: "focus_naesin",
          label: "내신을 챙긴다. 수시로 승부한다",
          outcome: `학교 시험마다 긴장된다. 하지만 성실하게 쌓아가는 느낌이 있다.
수능 점수가 낮아도 수시 합격 가능성은 열려있다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "focus_suneung",
          label: "수능에 집중한다. 정시로 결판 낸다",
          outcome: `내신 시험에 신경을 덜 쓰다 보니 담임에게 잔소리를 듣는다.
하지만 모의고사 점수가 오르는 게 보인다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "balance_both",
          label: "적당히 균형을 맞춘다",
          outcome: `두 가지 다 어중간할 수 있다. 하지만 한 가지에 몰빵하는 것보다
선택지가 열려있을 수도 있다.`,
          sets: { academic_effort: "medium" }
        }
      ]
    },

    // ── E210: 야간자율학습 탈출 (도덕 딜레마) ─────────────────────────────
    {
      id: "E210",
      arc: "arc2",
      title: "야자 탈출",
      type: "moral_dilemma",
      tags: ["규칙", "자유", "친구"],
      requires: {},
      excludes: {},
      weight: 0.7,

      summary: `오늘 밤 야간자율학습 시간, 친한 친구 셋이 같이 탈출하자고 한다.
담 너머로 나가서 편의점에서 라면 먹고 오는 거라고.
선생님 몰래 나갔다가 걸리면 징계다. 하지만 걸릴 확률은 낮다.
그 친구들은 이미 여러 번 했고, 오늘 꼭 같이 가고 싶다고 한다.`,

      actions: [
        {
          id: "go_along",
          label: "같이 나간다",
          outcome: `편의점 라면은 맛있었다. 걸리지 않았다.
하지만 그 이후로 이 루트가 더 자주 열리게 된다.`,
          sets: {}
        },
        {
          id: "stay_and_study",
          label: "혼자 남아 공부한다",
          outcome: `친구들이 나간 교실에서 혼자 앉아 있다.
조용해서 집중은 잘 된다. 외롭기도 하고 잘한 것 같기도 하다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "decline_and_cover",
          label: "안 간다고 하고, 친구들이 들키지 않게 자리를 메워준다",
          outcome: `당신은 남고, 친구 자리에 책을 올려두고 선생님이 왔을 때 적당히 둘러댄다.
같이 안 나간 건 아니지만, 함께한 것 같기도 하다.`,
          sets: {}
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC2_HIGHSCHOOL;
} else {
  globalThis.ARC2_HIGHSCHOOL = ARC2_HIGHSCHOOL;
}
