/**
 * Arc 4 · 취업 준비 (E4xx)
 * 나이: 23~27세
 * 핵심 플래그 생성: career_start
 * 핵심 플래그 소비: university_tier, major, financial_status, reputation
 *
 * 톤: 현실 충격. 스펙과 자존감 사이.
 *     학교 이름이 통하는 세계와 통하지 않는 세계를 동시에 경험하는 시기.
 *
 * 핵심 분기:
 *   major: medicine           → E406 전공의 선택 (완전 분리 루트)
 *   university_tier: top/mid  → E403 대기업 공채 접근
 *   financial_status: struggling/debt → E407 가중치 1.8
 *   reputation: high/medium   → E408 프리랜서/독립 루트
 */

const ARC4_JOB_HUNT = {
  id: "arc4",
  order: 4,
  title: "취업 준비",
  subtitle: "스펙과 자존감 사이",
  age_range: "23–27세",
  chapter_card: "졸업이 됐다. 학교 밖에서 처음으로 내 값을 매겨야 한다. 자소서 파일을 열었다가 닫기를 반복한다.",
  events_per_run: 3,

  events: [

    // ── E401: 첫 자소서 (방향 선택) — 공통 ──────────────────────────────────
    {
      id: "E401",
      arc: "arc4",
      title: "자기소개서 첫 줄",
      type: "direction_choice",
      tags: ["자소서", "방향", "정체성"],
      requires: {},
      excludes: { major: "medicine" },
      weight: 1.2,

      summary: `노트북 화면에 자기소개서 양식이 열려 있다.
"지원 동기를 작성하시오." 커서가 깜빡인다.
무슨 회사에 넣어야 할지, 내가 뭘 하고 싶은지, 솔직히 아직 잘 모른다.
이 빈칸을 채우는 방식이 앞으로의 방향을 결정할 것 같다.`,

      summary_variants: {
        "academic_effort:high": `학점도 있고, 활동도 했다. 쓸 게 없진 않다.
그런데 막상 쓰려니 이게 나를 설명하는 말인지 잘 모르겠다.
노트북 화면에 커서가 깜빡인다.`,
        "academic_effort:low": `쓸 수 있는 스펙이 많지 않다. 블라인드 채용이 유행이라는데,
블라인드를 해도 내용이 있어야 한다.
노트북 화면에 커서가 깜빡인다.`
      },

      actions: [
        {
          id: "target_big_corp",
          label: "대기업 공채를 목표로 스펙을 정리한다",
          outcome: `지원서를 20군데 넣었다. 서류에서 절반이 걸러졌다.
통과한 곳들이 있다. 이제 면접을 준비해야 한다.`,
          sets: {}
        },
        {
          id: "find_my_field",
          label: "규모보다 하고 싶은 일이 있는 곳을 찾는다",
          outcome: `큰 회사는 아니지만, 하는 일이 명확한 곳들을 골랐다.
면접에서 "왜 여기에요?"라는 질문에 막히지 않았다.`,
          sets: {}
        },
        {
          id: "delay_and_prepare",
          label: "아직 준비가 덜 됐다. 자격증이나 경험을 더 쌓겠다",
          outcome: `6개월을 더 썼다. 뭔가 더 생겼는지, 그냥 시간이 지난 건지.
주변이 취업하는 소식이 들릴 때마다 조금씩 조급해진다.`,
          sets: { financial_status: "struggling" }
        }
      ]
    },

    // ── E402: 탈락 (위기 대응) — 공통 ───────────────────────────────────────
    {
      id: "E402",
      arc: "arc4",
      title: "불합격 문자",
      type: "crisis_response",
      tags: ["탈락", "자존감", "좌절"],
      requires: {},
      excludes: { major: "medicine" },
      weight: 1.3,

      summary: `"귀하의 지원에 감사드립니다. 아쉽게도…"
이번이 세 번째다. 서류, 1차 면접, 최종 면접에서 각각 한 번씩 떨어졌다.
이 문자를 받을 때마다 다르다. 처음엔 억울했고, 두 번째엔 덤덤했고,
오늘은 이상하게 아무 감정이 없다.`,

      summary_variants: {
        "university_tier:top": `이 정도 스펙에서 최종 탈락이 나왔다.
뭐가 문제인지 알 수 없다. 면접관이 뭘 원했는지도 모른다.
이 문자를 보고 있다.`,
        "university_tier:low": `사실 기대를 많이 안 했다. 그래서인지 덜 아프다.
아니, 아픈 게 맞는데 그냥 익숙해진 것 같다.`
      },

      actions: [
        {
          id: "analyze_and_retry",
          label: "면접 내용을 복기하고 다음에 반영한다",
          outcome: `어디서 틀렸는지 찾았다. 다음 면접에서 달라진 부분이 있었다.
떨어지는 게 데이터가 됐다.`,
          sets: {}
        },
        {
          id: "lower_the_bar",
          label: "기준을 낮춰서 범위를 넓힌다",
          outcome: `원하던 곳은 아닌 곳들도 넣기 시작했다.
일단 들어가고 보자는 마음이 됐다.`,
          sets: {}
        },
        {
          id: "take_a_break",
          label: "잠깐 쉬면서 다른 가능성을 생각해본다",
          outcome: `2주를 아무것도 안 했다. 다시 시작하는 게 오히려 쉬웠다.
방향이 조금 달라진 것 같기도 하다.`,
          sets: {}
        }
      ]
    },

    // ── E403: 대기업 공채 최종 면접 (기회 선택) — university_tier: top/mid ─────
    {
      id: "E403",
      arc: "arc4",
      title: "최종 면접 전날 밤",
      type: "opportunity_choice",
      tags: ["대기업", "면접", "선택"],
      requires: { university_tier: ["top", "mid"] },
      excludes: { major: "medicine" },
      weight: 1.4,

      summary: `대기업 최종 면접 전날 밤이다.
내일 합격하면 안정적인 연봉, 복지, 이름값이 따라온다.
그런데 오늘 다른 곳에서 연락이 왔다. 더 작은 회사인데, 하는 일이 더 흥미롭다.
두 면접이 같은 날이다. 하나를 포기해야 한다.`,

      actions: [
        {
          id: "go_big_corp",
          label: "대기업 면접을 간다. 이름값과 안정성이 먼저다",
          outcome: `합격했다. 입사 통보를 받은 날 부모님이 기뻐했다.
첫 출근날, 사옥이 크다. 내가 작게 느껴진다.`,
          sets: { career_start: "major_corp" }
        },
        {
          id: "go_small_interesting",
          label: "작은 곳 면접을 간다. 하는 일이 더 중요하다",
          outcome: `대기업을 포기했다. 주변 반응이 엇갈린다.
첫 출근날, 사람이 적다. 내 이름이 빨리 불린다.`,
          sets: { career_start: "startup" }
        },
        {
          id: "try_both",
          label: "두 면접 일정을 조율해본다",
          outcome: `한 곳에 양해를 구했다. 날짜가 바뀌거나 안 바뀌거나.
어찌됐든 선택이 미뤄졌다.`,
          sets: {}
        }
      ]
    },

    // ── E404: 스타트업 오퍼 (리스크 선택) — 공통 ───────────────────────────
    {
      id: "E404",
      arc: "arc4",
      title: "스타트업 제안",
      type: "risk_choice",
      tags: ["스타트업", "리스크", "성장"],
      requires: {},
      excludes: { major: "medicine" },
      weight: 1.0,

      summary: `아는 선배가 창업한 스타트업에서 연락이 왔다.
팀이 15명이고, 시리즈 A 투자를 받은 직후다.
대기업보다 연봉이 20% 낮고, 스톡옵션이 있다.
성장하면 크게 돌아올 수 있고, 망하면 1~2년 후 다시 시작해야 한다.`,

      summary_variants: {
        "financial_status:debt": `연봉이 낮다는 게 문제다. 대출 상환이 있다.
스톡옵션이 현금이 되려면 몇 년이 걸린다.
머리로는 계산이 되는데 몸이 따라갈지 모르겠다.`,
        "financial_status:struggling": `지금 당장 돈이 필요하다. 낮은 연봉은 부담이다.
그런데 이 제안을 거절하면 이런 기회가 다시 올까.`
      },

      actions: [
        {
          id: "join_startup",
          label: "간다. 성장 가능성에 건다",
          outcome: `회의가 많고 역할이 넓다. 내가 한 일이 바로 보인다.
불안하지만 살아있는 느낌이다.`,
          sets: { career_start: "startup" }
        },
        {
          id: "decline_startup",
          label: "안정적인 곳을 계속 찾는다",
          outcome: `그 스타트업이 2년 후 어떻게 됐는지 가끔 찾아보게 된다.
잘 됐으면 아쉽고, 망했으면 다행이라는 생각이 드는 게 좀 그렇다.`,
          sets: {}
        }
      ]
    },

    // ── E405: 공무원 시험 (방향 선택) — 공통 ──────────────────────────────
    {
      id: "E405",
      arc: "arc4",
      title: "공시 준비를 시작할까",
      type: "direction_choice",
      tags: ["공무원", "안정", "공시"],
      requires: {},
      excludes: { major: "medicine", university_tier: "top" },
      weight: 1.0,

      summary: `공무원 시험을 준비하는 친구가 도서관에서 산다.
합격하면 정년 보장, 연금, 안정적인 생활.
준비 기간은 평균 2~3년. 그동안 수입이 없거나 거의 없다.
민간 취업과 공시, 둘 중 하나를 더 파야 할 시점이 왔다.`,

      summary_variants: {
        "financial_status:struggling": `2~3년을 버틸 여유가 있는지 모르겠다.
하지만 취업 시장도 쉽지 않다.
도서관 자리를 예약하면서 생각한다.`,
        "financial_status:debt": `대출 상환 중에 수입이 끊기면 버틸 수 있을까.
그래도 붙기만 하면 안정적인 상환이 가능해진다.`
      },

      actions: [
        {
          id: "go_public",
          label: "공시로 방향을 확정한다. 안정성이 최우선이다",
          outcome: `도서관 정기권을 끊었다. 하루 10시간.
합격한 날, 오래 참았다는 생각보다 이제 됐다는 생각이 먼저 든다.`,
          sets: { career_start: "public" }
        },
        {
          id: "try_both_briefly",
          label: "6개월만 준비해보고 안 되면 민간으로 간다",
          outcome: `6개월 안에 붙는 건 쉽지 않았다. 하지만 방향은 잡혔다.
기한을 정해둔 게 오히려 도움이 됐다.`,
          sets: { career_start: "public" }
        },
        {
          id: "skip_public",
          label: "공시는 내 길이 아닌 것 같다. 민간을 계속 본다",
          outcome: `공시 준비를 안 한 게 맞는지 틀렸는지 모른다.
적어도 내가 선택한 이유는 있다.`,
          sets: {}
        }
      ]
    },

    // ── E406: 전공의 선택 (방향 선택) — major: medicine 전용 ──────────────────
    {
      id: "E406",
      arc: "arc4",
      title: "어느 과를 선택할 것인가",
      type: "direction_choice",
      tags: ["의대", "전공의", "진로"],
      requires: { major: "medicine" },
      excludes: {},
      weight: 1.8,

      summary: `인턴 과정이 끝났다. 이제 전공의를 지원해야 한다.
내과, 외과, 소아과, 정신건강의학과, 피부과, 성형외과.
각자 다른 삶이 딸려온다. 보람, 수입, 워라밸, 사회적 인식.
지도교수님이 어느 과를 생각하고 있냐고 물어본다.`,

      actions: [
        {
          id: "choose_lifestyle_dept",
          label: "수입과 삶의 질을 보고 피부과·성형외과를 선택한다",
          outcome: `경쟁이 치열했다. 합격했다.
나중에 주변에서 왜 그 과를 갔냐고 묻는다. 솔직하게 말하기가 어렵다.`,
          sets: { career_start: "major_corp", reputation: "high", financial_status: "wealthy" }
        },
        {
          id: "choose_calling_dept",
          label: "힘들어도 하고 싶은 과를 선택한다",
          outcome: `수련이 혹독하다. 당직이 많고 잠이 부족하다.
그래도 이 길을 선택했다는 것이 버티게 한다.`,
          sets: { career_start: "major_corp", reputation: "high", financial_status: "stable" }
        },
        {
          id: "consider_leaving_medicine",
          label: "사실 의사 말고 다른 길을 생각하고 있다",
          outcome: `이 말을 꺼내는 게 쉽지 않다. 가족, 동기, 교수님.
하지만 10년 후를 생각하면 지금 말하는 게 나을 것 같다.`,
          sets: { career_start: "delayed", financial_status: "stable" }
        }
      ]
    },

    // ── E407: 부모님 압박 (위기 대응) — struggling/debt 시 weight 1.8 ──────────
    {
      id: "E407",
      arc: "arc4",
      title: "언제 취직할 거야",
      type: "crisis_response",
      tags: ["가족", "압박", "돈"],
      requires: {},
      excludes: { major: "medicine" },
      weight: 1.0,

      summary: `명절 저녁. 친척들이 모인 자리에서 큰아버지가 묻는다.
"요즘 뭐 하고 있어? 취직은?"
부모님은 옆에서 조용히 있다. 대신 대답해줄 것 같지 않다.
이 질문에 뭐라고 할 것인가.`,

      summary_variants: {
        "financial_status:struggling": `집에서 생활비를 받고 있는 상황이다.
이 질문이 지금 처한 현실 전체를 건드리는 것 같다.`,
        "financial_status:debt": `대출 상환 미루고 있다는 것도, 부모님이 알고 있다.
이 자리가 괴롭다.`
      },

      actions: [
        {
          id: "answer_honestly",
          label: "준비 중이라고, 쉽지 않다고 솔직하게 말한다",
          outcome: `친척 한 명이 "요즘 세상이 그렇지"라고 한다.
기대했던 반응은 아닌데, 나쁘지도 않다.
부모님이 나중에 조용히 "잘 말했다"고 한다.`,
          sets: {}
        },
        {
          id: "deflect",
          label: "적당히 둘러대고 화제를 바꾼다",
          outcome: `그냥 넘어갔다. 하지만 그 순간이 밥 먹는 내내 머릿속에 있다.`,
          sets: {}
        },
        {
          id: "take_any_job",
          label: "이 자리가 싫어서 돌아와 바로 아무 데나 지원한다",
          outcome: `감정으로 선택한 회사였다. 입사 후 잘 맞지 않는다는 걸 알게 된다.
하지만 일단 시작했다.`,
          sets: { career_start: "delayed" }
        }
      ]
    },

    // ── E408: 프리랜서·독립 (기회 선택) — reputation: high/medium ──────────────
    {
      id: "E408",
      arc: "arc4",
      title: "혼자 해볼 수 있을까",
      type: "opportunity_choice",
      tags: ["프리랜서", "독립", "자영업"],
      requires: { reputation: ["high", "medium"] },
      excludes: { major: "medicine" },
      weight: 1.1,

      summary: `대학원 지도교수나 인턴했던 회사에서 프로젝트 단위로 일해달라는 제안이 왔다.
정규직이 아니라 계약직이나 프리랜서 형태다.
수입이 불규칙하지만, 어떤 일을 할지는 내가 고를 수 있다.
이 방식으로 일하는 게 가능할까.`,

      summary_variants: {
        "financial_status:debt": `불규칙한 수입이 대출 상환에 걸린다.
매달 고정비용이 나가는데 수입이 들쭉날쭉하면 버틸 수 있을까.`,
        "financial_status:wealthy": `당장 돈 걱정은 없다. 이 방식이 더 자유롭고 맞을 수 있다.`
      },

      actions: [
        {
          id: "go_freelance",
          label: "프리랜서로 시작한다. 정규직이 전부는 아니다",
          outcome: `첫 달 수입이 예상보다 높았다. 두 달째엔 연락이 뜸했다.
이 불규칙함에 익숙해질 수 있을지 모르겠지만, 선택한 일을 하고 있다.`,
          sets: { career_start: "freelance" }
        },
        {
          id: "use_as_bridge",
          label: "정규직 구하면서 임시로 한다",
          outcome: `반쪽짜리 집중으로 반쪽짜리 결과가 나왔다.
하지만 공백 기간보단 나았다.`,
          sets: {}
        },
        {
          id: "pass",
          label: "정규직으로 가겠다. 이 방식은 지금은 아닌 것 같다",
          outcome: `프리랜서 제안을 정중히 거절했다.
나중에 다시 생각하게 될 기회일 수도 있다.`,
          sets: {}
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC4_JOB_HUNT;
} else {
  globalThis.ARC4_JOB_HUNT = ARC4_JOB_HUNT;
}
