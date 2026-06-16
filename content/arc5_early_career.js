/**
 * Arc 5 · 사회초년생 (E5xx)
 * 나이: 25~30세
 * 핵심 플래그 생성: reputation
 * 핵심 플래그 소비: career_start, relationship_history
 *
 * 톤: 조직 안에서의 첫 마찰. 이상과 현실의 충돌.
 *     배운 것과 실제 돌아가는 방식 사이의 간극을 처음 직면하는 시기.
 *
 * 핵심 분기:
 *   career_start: major_corp  → E502 대기업 야근 문화
 *   career_start: startup     → E503 스타트업 위기
 *   career_start: public      → E504 공직의 보수성
 *   career_start: freelance/delayed → E510 독립 생존기
 *   relationship_history: committed → E507 summary_variant (연인에게 미안함)
 */

const ARC5_EARLY_CAREER = {
  id: "arc5",
  order: 5,
  title: "사회초년생",
  subtitle: "배운 것과 실제 사이",
  age_range: "25–30세",
  chapter_card: "처음으로 월급을 받았다. 생각보다 실수령이 적다. 회사라는 곳이 학교와 다르다는 걸 하루하루 배우고 있다.",
  events_per_run: 3,

  events: [

    // ── E501: 첫 출근 (정체성 선택) — 공통 ──────────────────────────────────
    {
      id: "E501",
      arc: "arc5",
      title: "첫 출근",
      type: "identity_choice",
      tags: ["첫날", "인상", "조직"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `첫 출근 아침. 사원증을 목에 걸고 엘리베이터를 탔다.
팀에 배치됐고, 자리가 생겼다. 주변 사람들이 바쁘게 움직인다.
누군가 인사를 건네온다. 당신이 어떻게 보이느냐가 앞으로의 몇 년을 결정할 것 같다.
어떤 첫인상을 만들 것인가.`,

      summary_variants: {
        "career_start:major_corp": `대형 사옥 로비. 직원들이 빠르게 지나간다.
내 자리가 어딘지, 누구한테 인사해야 하는지 아직 모른다.
사원증이 낯설다.`,
        "career_start:startup": `작은 사무실. 대표님이 직접 나와서 악수를 한다.
오늘부터 바로 일이 시작된다고 한다. 온보딩이 없다.`,
        "career_start:public": `청사 정문. 복장 규정이 엄격하다.
선배 공무원이 안내해준다. 모든 것이 절차에 따라 움직인다.`
      },

      actions: [
        {
          id: "proactive_intro",
          label: "먼저 팀원들에게 적극적으로 인사한다",
          outcome: `팀장이 "우리 팀에 활기찬 사람이 왔네"라고 한다.
이름을 빨리 기억해줬다. 앞으로 일하기 편할 것 같다.`,
          sets: { reputation: "medium", social_role: "leader" }
        },
        {
          id: "quiet_and_observe",
          label: "조용히 자리를 파악하고 흐름을 먼저 읽는다",
          outcome: `며칠 동안 말이 없었다. 팀원들이 어떤 사람인지 알게 됐다.
"말이 없네"라는 말을 들었지만, 틀리지 않은 선택 같다.`,
          sets: { reputation: "medium", social_role: "follower" }
        },
        {
          id: "ask_questions",
          label: "모르는 것을 바로 물어보면서 빠르게 파악한다",
          outcome: `질문이 많다는 말을 들었다. 어떤 사람에겐 칭찬이고 어떤 사람에겐 귀찮음이다.
하지만 업무 파악이 빨랐다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E502: 야근 강요 (도덕 딜레마) — career_start: major_corp ──────────────
    {
      id: "E502",
      arc: "arc5",
      title: "6시 이후",
      type: "moral_dilemma",
      tags: ["야근", "문화", "경계"],
      requires: { career_start: "major_corp" },
      excludes: {},
      weight: 1.5,

      summary: `퇴근 시간인 6시. 팀장이 아직 자리에 있다.
같이 일하는 선배가 눈짓으로 "아직 가지 말라"는 신호를 준다.
오늘 당신이 해야 할 업무는 이미 끝냈다. 내일 해도 되는 것들만 남아 있다.
어떻게 할 것인가.`,

      actions: [
        {
          id: "stay_without_reason",
          label: "자리를 지킨다. 분위기를 거스르기 싫다",
          outcome: `9시에 팀장이 먼저 일어섰다. 그제야 다들 퇴근했다.
뭘 했는지 잘 모르겠지만, 자리를 지켰다는 사실이 기록됐다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "leave_on_time",
          label: "업무가 끝났으니 정시 퇴근한다",
          outcome: `혼자 일어났다. 몇 사람이 쳐다봤다.
다음 날 아무 말이 없었다. 하지만 분위기가 조금 달라진 것 같다.`,
          sets: { reputation: "low" }
        },
        {
          id: "talk_to_senior",
          label: "선배에게 조용히 야근 문화에 대해 물어본다",
          outcome: `선배가 "그냥 그런 거야"라고 했다. 딱히 도움은 안 됐다.
하지만 이게 개인의 문제가 아니라 구조의 문제라는 걸 알게 됐다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E503: 스타트업이 흔들린다 (위기 대응) — career_start: startup ──────────
    {
      id: "E503",
      arc: "arc5",
      title: "투자가 끊길 수 있다",
      type: "crisis_response",
      tags: ["스타트업", "위기", "이직"],
      requires: { career_start: "startup" },
      excludes: {},
      weight: 1.5,

      summary: `사무실 분위기가 이상하다. 대표님이 투자자와 전화를 자주 한다.
채용 공고가 내려갔다. 동료 한 명이 조용히 이직 준비를 하고 있다는 말을 들었다.
아직 공식적으로 아무 말이 없다. 물어볼 수도 없는 분위기다.
어떻게 대응할 것인가.`,

      actions: [
        {
          id: "stay_and_help",
          label: "지금 회사에 필요한 사람이 되기로 한다",
          outcome: `다음 달 대표님이 전 직원을 모았다. "시리즈 B 투자 확정됐습니다."
살아남았다. 이 경험이 이력서에 남는다.`,
          sets: { reputation: "high" }
        },
        {
          id: "quietly_prepare_exit",
          label: "조용히 이직을 알아본다",
          outcome: `두 달 후 오퍼를 받았다. 떠나기 직전, 회사가 투자를 받았다는 발표가 났다.
떠나는 결정이 맞았는지 틀렸는지는 모르겠다.`,
          sets: { reputation: "medium", career_start: "major_corp" }
        },
        {
          id: "ask_directly",
          label: "대표님에게 직접 상황을 물어본다",
          outcome: `대표님이 솔직하게 말했다. 좋은 소식은 아니었다.
하지만 알고 준비하는 것과 모르고 당하는 것은 다르다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E504: 공직의 보수성 (방향 선택) — career_start: public ────────────────
    {
      id: "E504",
      arc: "arc5",
      title: "원래 이렇게 하는 겁니다",
      type: "direction_choice",
      tags: ["공직", "절차", "개혁"],
      requires: { career_start: "public" },
      excludes: {},
      weight: 1.5,

      summary: `담당 업무에서 더 효율적인 방법을 찾았다. 시간도 줄고, 민원인 편의도 좋아진다.
상급자에게 보고했다. 돌아온 말은 "원래 이렇게 하는 겁니다"였다.
바꾸려면 결재 라인을 다 거쳐야 하고, 그 과정에서 무산될 가능성이 높다.
어떻게 할 것인가.`,

      actions: [
        {
          id: "push_through_procedure",
          label: "절차를 밟아 공식적으로 개선안을 올린다",
          outcome: `6개월이 걸렸다. 두 단계에서 반려됐고 한 단계에서 통과됐다.
일부만 바뀌었지만, 아예 안 바뀐 것보다는 낫다.`,
          sets: { reputation: "high" }
        },
        {
          id: "work_within_rules",
          label: "지금 시스템 안에서 최선을 다한다",
          outcome: `바꾸는 것을 포기하지 않았지만 싸우지도 않기로 했다.
언젠가 권한이 생기면 그때 하자고 생각했다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "give_up_on_change",
          label: "변화는 여기서 안 된다는 걸 받아들인다",
          outcome: `안정은 유지됐다. 하지만 이 일을 왜 하는지에 대한 답이 흐릿해졌다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E505: 상사의 부당한 지시 (도덕 딜레마) — 공통 ──────────────────────
    {
      id: "E505",
      arc: "arc5",
      title: "이건 아닌 것 같은데",
      type: "moral_dilemma",
      tags: ["부당지시", "윤리", "상사"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `팀장이 보고서 수치를 "보기 좋게" 바꾸라고 했다.
틀린 수치는 아닌데, 불리한 부분을 삭제하고 유리한 부분만 남기는 방식이다.
외부에 나가는 자료다. 누군가는 이걸 보고 판단을 내릴 것이다.
당신은 컴퓨터 앞에 앉아 있다.`,

      actions: [
        {
          id: "do_as_told",
          label: "시키는 대로 한다. 내 결정이 아니다",
          outcome: `자료가 나갔다. 문제가 없었다. 팀장이 잘 했다고 했다.
이 일이 자꾸 생각난다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "raise_concern_quietly",
          label: "팀장에게 조용히 우려를 말한다",
          outcome: `팀장이 "알겠어, 그냥 해줘"라고 했다.
말은 했다. 결과는 바뀌지 않았다. 하지만 말한 것과 안 한 것은 다르다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "refuse",
          label: "이 방식으로는 못 하겠다고 한다",
          outcome: `분위기가 냉각됐다. 팀장이 다른 사람한테 시켰다.
당신이 불이익을 받을지, 나중에 인정받을지 아직 모른다.`,
          sets: { reputation: "high" }
        }
      ]
    },

    // ── E506: 팀 내 갈등 (관계 선택) — 공통 ────────────────────────────────
    {
      id: "E506",
      arc: "arc5",
      title: "같이 일하기 힘든 사람",
      type: "relationship_choice",
      tags: ["동료", "갈등", "협업"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `같은 팀의 동료가 일을 자꾸 미룬다. 결국 당신이 처리하는 경우가 반복된다.
그 사람이 나쁜 사람은 아닌 것 같다. 그냥 방식이 다른 것 같기도 하다.
팀 성과는 같이 엮여 있다.
어떻게 할 것인가.`,

      actions: [
        {
          id: "cover_for_them",
          label: "그냥 내가 한다. 같이 망하는 것보다 낫다",
          outcome: `팀 성과는 나왔다. 내 업무량은 늘었다.
그 사람은 모른다. 팀장도 모른다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "talk_directly",
          label: "그 동료에게 직접 이야기한다",
          outcome: `어색했다. 상대방이 방어적으로 나왔다.
며칠 후, 그 사람이 조금 달라졌다. 완전히 바뀐 건 아니지만.`,
          sets: { reputation: "high", social_role: "leader" }
        },
        {
          id: "report_to_manager",
          label: "팀장에게 보고한다",
          outcome: `팀장이 중재했다. 그 사람이 나를 어떻게 보는지 달라진 것 같다.
조직에서 이런 방식이 맞는 건지 아직 잘 모르겠다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E507: 번아웃 (위기 대응) — 공통, relationship_history: committed 분기 ──
    {
      id: "E507",
      arc: "arc5",
      title: "더 이상 아무것도 하기 싫다",
      type: "crisis_response",
      tags: ["번아웃", "피로", "한계"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `월요일 아침. 알람이 울렸는데 일어나기 싫다.
싫은 게 아니라 몸이 안 일어난다. 이런 날이 요즘 늘었다.
퇴근 후에는 아무것도 하기 싫고, 주말엔 그냥 누워 있다.
이 상태를 어떻게 해야 할지 모르겠다.`,

      summary_variants: {
        "relationship_history:committed": `연인이 오늘도 먼저 잠든다.
같이 있는데 같이 있지 않은 것 같다. 그 사람에게도 미안하다는 생각이 든다.
그 미안함이 쌓이고 있다.`,
        "relationship_history:broken": `최근 헤어졌다. 일도 힘들고 관계도 끝났다.
이 두 가지가 동시에 온 게 우연인지 원인과 결과인지 모르겠다.`
      },

      actions: [
        {
          id: "take_leave",
          label: "연차를 내고 며칠 쉰다",
          outcome: `3일을 쉬었다. 아무것도 안 했다. 마지막 날은 조금 나아진 것 같았다.
돌아가면 일이 쌓여 있겠지만, 지금은 괜찮다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "push_through_anyway",
          label: "그래도 간다. 쉬면 더 밀린다",
          outcome: `버텼다. 한 달이 지났다. 여전히 월요일이 싫다.
어디까지가 한계인지 조금씩 시험하고 있는 것 같다.`,
          sets: { reputation: "high" }
        },
        {
          id: "talk_to_someone",
          label: "가까운 사람이나 상담사에게 털어놓는다",
          outcome: `말하는 것만으로 조금 달랐다. 해결이 된 건 아니지만.
이 상태를 혼자 감당하는 게 의무는 아니라는 걸 처음으로 알았다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E508: 이직 제안 (기회 선택) — reputation: high/medium ─────────────────
    {
      id: "E508",
      arc: "arc5",
      title: "헤드헌터 연락",
      type: "opportunity_choice",
      tags: ["이직", "기회", "결정"],
      requires: { reputation: ["high", "medium"] },
      excludes: {},
      weight: 1.2,

      summary: `링크드인에 메시지가 왔다. 헤드헌터다.
지금보다 연봉이 20% 높고, 역할도 더 크다.
지금 회사에서 3년째다. 이제 자리가 잡힌 것 같기도 하고,
더 자리 잡으면 더 못 나갈 것 같기도 하다.`,

      summary_variants: {
        "career_start:major_corp": `대기업에서 대기업으로 가는 제안이다.
이름값이 비슷하다. 하지만 하는 일이 다르다.`,
        "career_start:startup": `대기업에서 제안이 왔다. 처음으로 큰 곳을 경험할 수 있다.
스타트업에서 배운 것들이 거기서도 통할까.`
      },

      actions: [
        {
          id: "move",
          label: "간다. 이 기회가 다시 올지 모른다",
          outcome: `이직했다. 첫 달에 아는 사람이 없다는 게 이렇게 불편한 줄 몰랐다.
하지만 새 명함이 낯설지 않다.`,
          sets: { reputation: "high" }
        },
        {
          id: "negotiate_at_current",
          label: "이직 제안을 협상 카드로 현 회사에서 대우 개선을 요구한다",
          outcome: `상사가 며칠 후 연봉 조정안을 가져왔다. 100%는 아니지만 좋아졌다.
이 방법이 깔끔한 방식인지는 모르겠다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "decline",
          label: "지금 자리에 남는다. 아직 여기서 배울 게 있다",
          outcome: `거절했다. 6개월 후 비슷한 제안이 다시 왔다.
기회는 한 번이 아닌 경우도 있다.`,
          sets: { reputation: "high" }
        }
      ]
    },

    // ── E509: 직장 내 비위 목격 (도덕 딜레마) — 공통 ──────────────────────
    {
      id: "E509",
      arc: "arc5",
      title: "알고 있다는 것",
      type: "moral_dilemma",
      tags: ["내부고발", "비리", "위험"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `우연히 알게 됐다. 팀장 선에서 경비 처리가 이상하다.
서류를 보다 보니 명백히 횡령처럼 보이는 내역이 있다.
당신 말고는 아무도 모르는 것 같다.
알고 있다는 것이 이미 짐이 됐다.`,

      actions: [
        {
          id: "report_internally",
          label: "내부 감사팀이나 인사팀에 신고한다",
          outcome: `조사가 시작됐다. 당신이 신고했다는 걸 팀장이 알게 됐다.
분위기가 차갑다. 결과가 나오기까지 시간이 걸린다.`,
          sets: { reputation: "high" }
        },
        {
          id: "stay_quiet",
          label: "모른 척한다. 내 일이 아니다",
          outcome: `6개월 후 다른 경로로 밝혀졌다. 당신이 알고 있었다는 건 나오지 않았다.
알고 있었다는 사실이 조용히 남아 있다.`,
          sets: { reputation: "medium" }
        },
        {
          id: "gather_evidence_first",
          label: "섣불리 움직이지 않고 더 확인한다",
          outcome: `한 달 동안 조용히 자료를 모았다. 확실해졌을 때 움직였다.
결과는 신고와 같았지만, 준비가 있었다.`,
          sets: { reputation: "high" }
        }
      ]
    },

    // ── E510: 독립 생존기 (위기 대응) — career_start: freelance/delayed ────────
    {
      id: "E510",
      arc: "arc5",
      title: "이달 수입이 없다",
      type: "crisis_response",
      tags: ["프리랜서", "수입", "생존"],
      requires: { career_start: ["freelance", "delayed"] },
      excludes: {},
      weight: 1.5,

      summary: `이달 들어온 프로젝트가 없다. 저번 달도 적었다.
통장 잔액을 본다. 2개월은 버틸 수 있다.
주변 친구들이 정규직에서 월급을 받는 동안 당신은 다음 달을 모른다.
이 방식을 계속할 것인가.`,

      summary_variants: {
        "financial_status:debt": `대출 상환일이 다음 주다. 잔액이 부족하다.
이달을 어떻게 버틸지 계산하다가 새벽이 됐다.`,
        "financial_status:stable": `비상금이 있다. 당장 무너지진 않는다.
하지만 이 상태가 얼마나 더 가면 흔들릴지 계산이 된다.`
      },

      actions: [
        {
          id: "hustle_new_clients",
          label: "신규 클라이언트를 적극적으로 찾는다",
          outcome: `콜드 메일 30통을 보냈다. 3개에서 답이 왔다. 1개가 계약이 됐다.
이 방식이 지속 가능한지는 모르겠지만, 이번 달은 넘겼다.`,
          sets: { reputation: "medium", financial_status: "stable" }
        },
        {
          id: "get_part_time",
          label: "당분간 알바나 계약직으로 수입을 확보한다",
          outcome: `자존심을 내려놓는 게 쉽지 않았다.
하지만 생활이 안정되니 오히려 다음 프로젝트에 집중할 수 있었다.`,
          sets: { financial_status: "stable" }
        },
        {
          id: "consider_employment",
          label: "정규직 전환을 진지하게 고민한다",
          outcome: `공고를 찾아봤다. 이력서를 업데이트했다.
이 생활을 포기하는 건 아니고, 다른 가능성을 닫지 않겠다는 것이다.`,
          sets: { career_start: "major_corp", reputation: "medium" }
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC5_EARLY_CAREER;
} else {
  globalThis.ARC5_EARLY_CAREER = ARC5_EARLY_CAREER;
}
