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
  events_per_run: 5,

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

    // ── E509: 수상한 서류 (발견 → ME001 연계) — 공통 ──────────────────────
    {
      id: "E509",
      arc: "arc5",
      title: "수상한 서류",
      type: "moral_dilemma",
      tags: ["내부고발", "비리", "발견"],
      requires: {},
      excludes: {},
      weight: 1.3,

      summary: `잔업 중에 공유 폴더에서 파일 하나를 잘못 열었다.
팀장 이름으로 된 경비 정산 내역인데, 숫자가 이상하다.
날짜가 중복됐고, 같은 금액이 다른 항목으로 두 번 올라가 있다.
실수일 수도 있다. 그냥 닫으면 아무 일도 없다.
하지만 손가락이 멈췄다.`,

      actions: [
        {
          id: "close_and_forget",
          label: "창을 닫는다. 내가 본 게 아니다",
          outcome: `창을 닫았다. 다음 날 아무 일도 없었다.
며칠이 지나도 그 숫자가 가끔 떠올랐다. 잊으려 했지만 잊혀지지 않는 것들이 있다.`,
          sets: {}
        },
        {
          id: "check_quietly",
          label: "더 열어본다. 실수인지 아닌지 확인하고 싶다",
          outcome: `15분 동안 파일을 더 들여다봤다. 실수가 아니었다.
같은 방식으로 처리된 내역이 세 건 더 있었다. 이제 알아버렸다.`,
          sets: { fraud_discovered: true }
        },
        {
          id: "screenshot_just_in_case",
          label: "일단 화면을 캡처해둔다. 나중을 위해",
          outcome: `캡처를 저장했다. 무엇을 위한 준비인지는 아직 모른다.
파일을 닫고 자리로 돌아왔다. 오늘 남은 업무를 끝냈다.`,
          sets: { fraud_discovered: true }
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
    },

    // ── ME022: 선배의 방식 (신입 관행 딜레마) ─────────────────────────────────
    {
      id: "ME022",
      arc: "arc5",
      title: "선배의 방식",
      type: "generational_workplace_conflict",
      tags: ["직장", "관행", "세대"],
      requires: {},
      excludes: {},
      weight: 1.2,
      summary: `입사한 지 두 달이 됐다. 팀에서 가장 경력이 긴 윤 차장이 오늘도 당신 옆에 앉았다.
"이 보고서는 원래 이렇게 쓰는 거야."
그런데 그 방식은 느리고, 수치를 임의로 반올림하며, 공식 양식도 아니다.
회사 전체가 이 방식으로 수년째 보고해왔다.
문제를 제기하면 '신입이 뭘 안다고'가 될 것을 안다. 그냥 따르면 이 방식이 계속된다.`,
      event_embedding: [-0.08, 0.24, 0.42, 0.18, 0.36, 0.12, 0.54, 0.38],
      actions: [
        {
          id: "follows_senior",
          label: "일단 선배 방식대로 따른다",
          embedding: [-0.18, 0.34, -0.48, 0.12, 0.42, -0.22, 0.68, -0.44],
          bias: 0.04,
          outcome: "윤 차장이 흡족해했다. 적응했다는 말을 들었다. 보고서는 오늘도 그 방식으로 올라갔다.",
          endingWeight: { conformist: 3, survivor: 2 },
          sets: { workplace_stance: "conformist" }
        },
        {
          id: "raises_issue_privately",
          label: "윤 차장에게 개인적으로 다른 방식을 제안해본다",
          embedding: [0.28, -0.12, 0.44, 0.38, 0.14, 0.32, 0.22, 0.58],
          bias: -0.01,
          outcome: "윤 차장은 잠시 생각하더니 '한번 해봐' 했다. 의외였다.",
          endingWeight: { reformer: 2, caregiver: 1, whistleblower: 1 },
          memory: "윤 차장이 '한번 해봐'라고 했을 때, 예상치 못한 대답이라 잠시 말을 잃었다.",
          sets: { workplace_stance: "reformer" }
        },
        {
          id: "reports_to_team_lead_quietly",
          label: "팀장에게 조용히 문의한다",
          embedding: [0.12, 0.08, 0.32, 0.24, 0.28, 0.38, 0.44, 0.46],
          bias: 0.01,
          outcome: "팀장은 '예전부터 그랬어'라고만 했다. 문제는 팀장도 알고 있었다.",
          endingWeight: { reformer: 1, survivor: 1, conformist: 1 },
          sets: { workplace_stance: "cautious" }
        }
      ]
    },

    // ── ME019: 동료의 보고서 (동료 실수 딜레마) ───────────────────────────────
    {
      id: "ME019",
      arc: "arc5",
      title: "동료의 보고서",
      type: "colleague_mistake_dilemma",
      tags: ["동료", "책임", "조직"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `내일 오전 임원 보고가 있다. 퇴근 준비를 하다가 같은 팀 최 대리의 보고서에서 수치 오류를 발견했다.
작은 실수가 아니다. 이 숫자가 그대로 올라가면 임원이 잘못된 방향으로 의사결정을 내릴 수 있다.
최 대리는 이미 퇴근했다. 연락을 하면 야근을 해야 하고, 최 대리 실수가 드러난다.
아무 말 안 하면 내일 보고가 그대로 올라간다.`,
      event_embedding: [0.18, 0.12, 0.48, 0.32, 0.22, 0.38, 0.54, 0.62],
      actions: [
        {
          id: "contacts_colleague",
          label: "최 대리에게 바로 연락한다",
          embedding: [0.44, -0.14, 0.42, 0.56, -0.12, 0.48, 0.32, 0.68],
          bias: 0,
          outcome: "최 대리는 당황했지만 고마워했다. 둘이 늦게까지 수정했다.",
          endingWeight: { caregiver: 2, reformer: 1, whistleblower: 1 },
          sets: {}
        },
        {
          id: "fixes_silently",
          label: "말없이 혼자 수정해서 올린다",
          embedding: [0.34, -0.08, 0.22, 0.44, 0.08, 0.28, 0.44, 0.48],
          bias: 0.01,
          outcome: "보고는 무사히 넘어갔다. 최 대리는 모른다. 당신만 안다.",
          endingWeight: { survivor: 2, caregiver: 2 },
          memory: "최 대리가 보고 잘 됐다며 웃을 때 아무 말도 하지 않았다.",
          sets: {}
        },
        {
          id: "reports_to_team_lead",
          label: "팀장에게 먼저 보고한다",
          embedding: [0.22, 0.08, 0.38, 0.28, 0.34, 0.42, 0.62, 0.52],
          bias: -0.01,
          outcome: "팀장이 처리했다. 최 대리는 다음날 팀장에게 불려갔다.",
          endingWeight: { conformist: 1, reformer: 1, opportunist: 1 },
          sets: {}
        }
      ]
    },

    // ── ME001: 내부 고발 (E509 발견 이후 결단) ────────────────────────────────
    {
      id: "ME001",
      arc: "arc5",
      title: "내부 고발",
      type: "whistleblowing_dilemma",
      tags: ["조직", "정직", "용기"],
      requires: { fraud_discovered: true },
      excludes: {},
      weight: 1.2,
      summary: `며칠 전 우연히 열었던 그 파일이 머릿속에서 지워지지 않는다.
팀장이 경비를 조직적으로 빼돌리고 있다는 게 확실하다. 혼자서만 알고 있다.
신고하면 조직 전체가 흔들리고, 팀장과 연결된 사람들이 위험해진다.
침묵하면 이 구조는 계속된다. 그리고 나는 알면서 모른 척한 사람이 된다.`,
      event_embedding: [0.12, -0.22, 0.58, 0.28, 0.34, 0.16, 0.44, 0.62],
      actions: [
        {
          id: "reports_to_authorities",
          label: "감사 부서 혹은 외부 기관에 신고한다",
          embedding: [0.18, -0.32, 0.72, 0.36, -0.18, 0.28, -0.24, 0.82],
          bias: 0.01,
          outcome: "회사 내 부정이 드러나고 처리되지만, 직장 내 관계는 냉각된다.",
          endingWeight: { whistleblower: 3, reformer: 2, martyr: 1 },
          memory: "신고서를 제출하고 나오던 날, 엘리베이터 안에서 혼자였다. 아무도 기다리지 않았다.",
          sets: { integrity_stance: "reported" }
        },
        {
          id: "stays_silent",
          label: "모른 척하고 넘어간다",
          embedding: [-0.14, 0.24, -0.58, -0.28, 0.22, -0.18, 0.66, -0.62],
          bias: 0.03,
          outcome: "부정이 계속되고, 알면서 침묵한 사람으로 기억된다.",
          endingWeight: { conformist: 3, opportunist: 2, survivor: 1 },
          memory: "그 자료를 본 날 밤이 가끔 떠오른다. 모른 척하는 법을 배운 날이었다.",
          sets: { integrity_stance: "silent" }
        },
        {
          id: "confronts_directly",
          label: "팀장에게 직접 따진다",
          embedding: [0.44, -0.18, 0.56, 0.52, 0.12, 0.14, -0.36, 0.44],
          bias: -0.01,
          outcome: "팀장과의 긴장이 높아지지만, 내부에서 해결의 실마리를 찾는다.",
          endingWeight: { whistleblower: 1, reformer: 1, exile: 1 },
          sets: { integrity_stance: "confronted" }
        }
      ]
    },

    // ── ME005: 조직의 압력 (허위 보고서 지시) ─────────────────────────────────
    {
      id: "ME005",
      arc: "arc5",
      title: "조직의 압력",
      type: "authority_vs_conscience",
      tags: ["권위", "양심", "직장"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `팀장이 허위 데이터로 보고서를 꾸미라고 지시한다.
거절하면 불이익이 예상되고, 따르면 회사 전체가 잘못된 의사결정을 한다.`,
      event_embedding: [-0.12, 0.28, 0.44, -0.18, 0.52, -0.22, 0.62, 0.38],
      actions: [
        {
          id: "obeys_order",
          label: "지시를 따르고 넘어간다",
          embedding: [-0.24, 0.36, -0.66, -0.32, 0.42, -0.18, 0.78, -0.54],
          bias: 0.04,
          outcome: "불이익을 피하지만, 조직의 왜곡에 기여한 사람으로 남는다.",
          endingWeight: { conformist: 3, opportunist: 1 },
          memory: "그 보고서를 올린 뒤로 거울을 보는 게 불편해졌다.",
          sets: {}
        },
        {
          id: "refuses_order",
          label: "거절하고 불이익을 감수한다",
          embedding: [0.22, -0.28, 0.72, 0.34, -0.24, 0.38, -0.52, 0.82],
          bias: 0,
          outcome: "직장에서 불이익을 받지만, 양심을 지킨 사람으로 기억된다.",
          endingWeight: { martyr: 2, whistleblower: 1, exile: 1 },
          memory: "책상을 비우면서 오히려 숨이 트였다. 그때는 그게 시작인 줄 몰랐다.",
          sets: {}
        },
        {
          id: "reports_upward",
          label: "더 윗선에 문제를 알린다",
          embedding: [0.28, -0.14, 0.44, 0.28, 0.16, 0.52, 0.46, 0.62],
          bias: -0.02,
          outcome: "리스크가 있지만, 조직 내 정당한 경로로 문제를 해결한다.",
          endingWeight: { reformer: 2, changemaker: 1, whistleblower: 1 },
          sets: {}
        }
      ]
    },

    // ── ME006: 친구의 부탁 (채용 추천 딜레마) ─────────────────────────────────
    {
      id: "ME006",
      arc: "arc5",
      title: "친구의 부탁",
      type: "friendship_vs_integrity",
      tags: ["우정", "정직", "책임"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `오랜 친구가 채용 심사에서 자기 이력을 좋게 말해 달라고 부탁한다.
실제로는 큰 프로젝트 실패를 숨기고 있다.
도와주면 친구는 살아나지만, 팀은 위험한 사람을 뽑을 수 있다.`,
      event_embedding: [0.36, 0.18, 0.12, 0.62, -0.12, 0.24, 0.28, 0.42],
      actions: [
        {
          id: "protects_friend",
          label: "친구를 위해 좋은 말만 해준다",
          embedding: [0.62, 0.46, -0.26, 0.72, 0.16, -0.18, -0.22, -0.28],
          bias: 0.03,
          outcome: "친구는 기회를 얻지만, 나중에 문제가 터질 가능성을 떠안는다.",
          endingWeight: { caregiver: 2, opportunist: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "tells_balanced_truth",
          label: "장점과 실패를 모두 솔직히 말한다",
          embedding: [0.34, -0.28, 0.58, 0.38, -0.14, 0.46, 0.48, 0.66],
          bias: 0,
          outcome: "친구와 잠시 멀어지지만, 관계와 책임을 모두 지키려 한다.",
          endingWeight: { reformer: 2, whistleblower: 1, caregiver: 1 },
          sets: {}
        },
        {
          id: "refuses_reference",
          label: "추천 자체를 거절한다",
          embedding: [-0.18, -0.12, 0.42, -0.2, 0.1, 0.54, 0.68, 0.38],
          bias: -0.01,
          outcome: "책임을 피했다는 비난을 받지만, 직접 거짓말하지는 않는다.",
          endingWeight: { survivor: 2, exile: 1, conformist: 1 },
          sets: {}
        }
      ]
    },

    // ── ME011: 증인이 되어달라는 요청 ────────────────────────────────────────
    {
      id: "ME011",
      arc: "arc5",
      title: "증인이 되어달라는 요청",
      type: "workplace_harassment_witness",
      tags: ["직장", "용기", "구조"],
      requires: {},
      excludes: {},
      weight: 1.1,
      summary: `3년 전, 당신이 처음 입사했을 때 팀을 이끌었던 박 과장.
지금은 다른 부서로 옮겼지만, 그 시절 그가 여성 후배들에게 했던 말과 행동을 당신은 기억하고 있다.
이번에 내부 조사가 시작됐다. 피해자 중 한 명이 공식 신고를 했고, HR 담당자에게서 전화가 왔다.
'당시 목격한 사실이 있으면 진술해주시겠습니까?'
박 과장은 지금도 회사 안에 인맥이 두텁다. 당신의 현재 팀장과도 친분이 있다.`,
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
          sets: { testified_against_park: true }
        },
        {
          id: "claims_poor_memory",
          label: "정확히 기억나지 않는다고 한다",
          embedding: [-0.18, 0.34, -0.52, -0.22, 0.36, -0.28, 0.62, -0.58],
          bias: 0.03,
          outcome: "통화를 끊고 나서 한동안 핸드폰을 내려다봤다. 기억은 선명했다.",
          endingWeight: { conformist: 3, survivor: 2, forgotten: 1 },
          memory: "기억이 안 난다는 말을 하면서 눈을 마주치지 못했다. 그날 밤 꿈에 그 복도가 나왔다.",
          sets: { denied_testimony: true }
        },
        {
          id: "asks_for_time",
          label: "생각할 시간이 필요하다고 답을 미룬다",
          embedding: [-0.08, 0.16, 0.14, 0.12, 0.08, 0.12, 0.38, 0.22],
          bias: -0.01,
          outcome: "시간을 달라고 했다. 어떻게 할지 아직 모른다.",
          endingWeight: { survivor: 2, exile: 1 },
          sets: {}
        }
      ]
    },

    // ── ME012: 박 과장이 돌아왔다 [requires: testified_against_park] ──────────
    {
      id: "ME012",
      arc: "arc5",
      title: "박 과장이 돌아왔다",
      type: "retaliation_after_testimony",
      tags: ["직장", "보복", "선택"],
      requires: { testified_against_park: true },
      excludes: {},
      weight: 1.3,
      summary: `두 달이 지났다. 증거 불충분 판정으로 박 과장에 대한 조사가 종결됐고, 그가 원래 부서 옆 팀으로 복귀했다.
당신이 진술을 했다는 사실은 이미 새어 나갔다. 지난주부터 팀 회의에서 발언 기회가 줄었고, 팀장이 당신의 보고서 검토를 자꾸 미룬다.
그리고 오늘, 박 과장이 직접 메시지를 보내왔다. '커피 한잔 어때요?'`,
      event_embedding: [-0.12, 0.44, 0.38, 0.28, 0.18, 0.24, -0.14, 0.56],
      actions: [
        {
          id: "meets_park",
          label: "만나기로 한다",
          embedding: [0.24, 0.22, 0.28, 0.48, 0.12, 0.18, 0.22, 0.44],
          bias: 0,
          outcome: "테이블 맞은편에 앉은 박 과장은 웃고 있었다. 무슨 말이 나올지 알 수 없었다.",
          endingWeight: { whistleblower: 1, reformer: 1, survivor: 1 },
          sets: {}
        },
        {
          id: "seeks_legal_protection",
          label: "거절하고 공익신고자 보호 상담부터 받는다",
          embedding: [0.18, -0.24, 0.72, 0.36, -0.14, 0.58, 0.16, 0.78],
          bias: -0.01,
          outcome: "변호사 사무실 복도에서 오래 기다렸다. 준비가 된 건지 아직 모르겠다.",
          endingWeight: { whistleblower: 2, changemaker: 2, martyr: 1 },
          memory: "법률 상담 예약을 잡으면서 이게 맞는 건지 물어볼 사람이 없었다.",
          sets: {}
        },
        {
          id: "quietly_job_hunts",
          label: "아무 말 없이 이직을 준비한다",
          embedding: [-0.28, 0.18, -0.14, -0.12, 0.44, -0.32, 0.52, -0.44],
          bias: 0.02,
          outcome: "이력서를 수정하면서 이 회사 이름을 다시 보게 됐다. 생각보다 오래 있었다.",
          endingWeight: { exile: 2, survivor: 2 },
          memory: "이직 사이트를 처음 켠 날, 창을 몇 번이나 껐다가 다시 열었다.",
          sets: {}
        }
      ]
    },

    // ── ME013: 후배의 메시지 [requires: denied_testimony] ─────────────────────
    {
      id: "ME013",
      arc: "arc5",
      title: "후배의 메시지",
      type: "consequence_of_silence",
      tags: ["책임", "연대", "후회"],
      requires: { denied_testimony: true },
      excludes: {},
      weight: 1.3,
      summary: `진술을 거부한 지 석 달이 지났다. 같은 팀에 새로 들어온 이 사원에게서 메신저가 왔다.
'잠깐 시간 괜찮으세요?' 직접 만나 얘기를 들어보니, 박 과장에게 비슷한 일을 당했다고 한다.
목소리가 떨렸다. '그때 언니가 말해줬더라면 제가 이 일을 안 당했을 텐데요.'
그 말이 끝나자 둘 다 한동안 말이 없었다.`,
      event_embedding: [0.46, 0.38, 0.42, 0.62, -0.18, 0.34, 0.14, 0.64],
      actions: [
        {
          id: "joins_second_report",
          label: "이번에는 함께 신고하겠다고 한다",
          embedding: [0.52, -0.12, 0.68, 0.72, -0.22, 0.58, -0.14, 0.82],
          bias: 0,
          outcome: "그 애 손을 잠깐 잡았다. 늦었지만 지금이라도.",
          endingWeight: { whistleblower: 3, reformer: 1, martyr: 2 },
          memory: "그 애 손을 잡으면서 3년 전의 내가 생각났다. 누군가 이렇게 해줬으면 어땠을까.",
          sets: {}
        },
        {
          id: "apologizes_and_retreats",
          label: "미안하다고만 하고 자리를 피한다",
          embedding: [-0.38, 0.44, -0.48, -0.28, 0.22, -0.42, 0.56, -0.64],
          bias: 0.03,
          outcome: "미안하다는 말밖에 할 수가 없었다. 그 애는 고개를 끄덕이며 나갔다.",
          endingWeight: { forgotten: 3, conformist: 1 },
          memory: "그 애가 나간 뒤 화장실에서 한참 있었다. 거울을 보지 않으려 했다.",
          sets: {}
        },
        {
          id: "helps_anonymously",
          label: "직접 나서는 대신 익명 신고 경로를 알려준다",
          embedding: [0.32, 0.08, 0.22, 0.44, -0.08, 0.28, 0.34, 0.42],
          bias: -0.01,
          outcome: "직접 나서지는 못했지만, 할 수 있는 것을 했다.",
          endingWeight: { caregiver: 2, survivor: 2, reformer: 1 },
          sets: {}
        }
      ]
    },

    // ── ME015: K의 합류 제안 ─────────────────────────────────────────────────
    {
      id: "ME015",
      arc: "arc5",
      title: "K의 합류 제안",
      type: "startup_offer_with_known_risk",
      tags: ["우정", "신뢰", "선택"],
      requires: {},
      excludes: {},
      weight: 1.0,
      summary: `대학 때 가장 친했던 K에게서 오랜만에 연락이 왔다. 자신이 창업한 스타트업에 합류해달라고 한다.
조건도 나쁘지 않고, K와 함께라면 해볼 만하다는 생각도 든다.
그런데 당신은 기억하고 있다. 몇 년 전 K가 첫 번째 스타트업에서 공동창업자를 밀어낸 일.
그 공동창업자는 지분도 제대로 받지 못하고 쫓겨났다. 당신 말고는 아무도 그 내막을 모른다.`,
      event_embedding: [0.22, 0.18, 0.32, 0.54, 0.38, 0.16, 0.28, 0.44],
      actions: [
        {
          id: "joins_k",
          label: "합류하기로 한다",
          embedding: [0.42, 0.34, -0.18, 0.62, 0.44, -0.12, 0.28, -0.22],
          bias: 0.03,
          outcome: "합류했다. K는 반가워했다. 지금은 좋다. 지금은.",
          endingWeight: { opportunist: 2, caregiver: 1, survivor: 1 },
          sets: { joined_k_startup: true }
        },
        {
          id: "declines_and_tells_k",
          label: "과거의 일을 솔직히 말하고 거절한다",
          embedding: [0.28, -0.14, 0.62, 0.44, -0.18, 0.48, 0.22, 0.72],
          bias: -0.01,
          outcome: "K는 한동안 말이 없었다. 통화가 끊겼다. 잘한 건지 모르겠다.",
          endingWeight: { whistleblower: 2, reformer: 1, exile: 1 },
          memory: "K에게 그 일을 꺼내는 데 생각보다 오래 걸렸다. 말을 시작하고 나서야 손이 떨리는 걸 알았다.",
          sets: { told_k_truth: true }
        },
        {
          id: "declines_with_excuse",
          label: "다른 핑계를 대고 거절한다",
          embedding: [-0.12, 0.22, -0.28, 0.14, 0.32, -0.24, 0.58, -0.38],
          bias: 0.01,
          outcome: "요즘 바쁘다고 했다. K는 아쉽다며 끊었다. 불편한 침묵이 오래 남았다.",
          endingWeight: { conformist: 2, survivor: 2 },
          sets: {}
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
