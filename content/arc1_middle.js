/**
 * Arc 1 · 중학교 (E1xx)
 * 나이: 13~15세
 * 핵심 플래그 생성: social_role, academic_effort
 * 핵심 플래그 소비: childhood_pattern (arc0에서 넘어옴)
 *
 * 톤: 정체성 탐색. 집단 속 자기 위치를 찾는 혼란.
 * 또래 관계, 첫 감정, 어른에 대한 반항 포함.
 * Arc 0 연계: childhood_pattern: protective → E103 우선 노출 (weight 1.8)
 */

const ARC1_MIDDLE = {
  id: "arc1",
  order: 1,
  title: "중학교",
  subtitle: "집단 속에서 자기를 찾는 시절",
  age_range: "13–15세",
  chapter_card: "교복을 처음 입었다. 초등학교 때 알던 아이들이 어딘가 달라져 있다. 반이 바뀌었고, 선생님도 여럿이다.",
  events_per_run: 3,

  events: [

    // ── E101: 중학교 첫날 (정체성 선택) ─────────────────────────────────────
    {
      id: "E101",
      arc: "arc1",
      title: "첫날, 빈 자리",
      type: "identity_choice",
      tags: ["첫날", "무리", "자아"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `중학교 첫날. 배정된 교실에 들어서니 아는 얼굴이 거의 없다.
자리는 아직 정해지지 않았고, 선생님이 오기 전까지 각자 알아서 앉으면 된다.
창가 쪽에 이미 여러 명이 모여 시끄럽게 이야기하고 있고, 구석 자리는 조용하다.
당신은 잠깐 교실 입구에 서서 둘러본다.`,

      actions: [
        {
          id: "join_the_crowd",
          label: "시끄러운 무리 옆에 끼어 앉는다",
          outcome: `"야, 어느 초등학교 나왔어?" 바로 말을 걸어온다.
처음엔 어색했는데 금방 이름을 알게 됐다. 시끄럽지만 나쁘지 않다.
이 자리가 앞으로 내 자리가 될 것 같다.`,
          sets: { social_role: "leader" }
        },
        {
          id: "sit_in_the_corner",
          label: "조용한 구석 자리에 앉는다",
          outcome: `옆자리가 한동안 비어 있다가 나중에 누군가 앉는다.
서로 어색하게 인사한다. 시끄러운 쪽은 잘 들리지 않는다.
혼자가 편한지 외로운지 아직 잘 모르겠다.`,
          sets: { social_role: "loner" }
        },
        {
          id: "sit_in_the_middle",
          label: "아무도 없는 가운데 자리에 먼저 앉는다",
          outcome: `금방 양옆이 채워진다. 오른쪽 아이가 먼저 말을 걸어온다.
내가 고른 자리가 아닌 것 같은데, 결국 이 자리가 됐다.
주변 흐름에 맞춰 움직이는 게 나쁘지 않다.`,
          sets: { social_role: "follower" }
        }
      ]
    },

    // ── E102: 학원 등록 (우선순위 선택) ───────────────────────────────────────
    {
      id: "E102",
      arc: "arc1",
      title: "학원이냐 자유냐",
      type: "priority_choice",
      tags: ["학업", "자유", "부모"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `엄마가 이번 주부터 수학학원을 등록해뒀다고 한다. 주 3회, 저녁 7시부터 9시까지.
학교 끝나고 친구들이랑 어울리는 시간이 사라진다는 뜻이다.
학원비는 이미 냈다고 한다.
당신은 학교에서 돌아오는 버스 안에서 생각한다.`,

      actions: [
        {
          id: "attend_faithfully",
          label: "학원을 성실하게 다닌다",
          outcome: `처음 며칠은 지루했는데, 모르던 풀이 방법을 알게 되는 순간이 생긴다.
성적이 조금씩 올라간다. 친구들과 노는 시간이 줄었지만 후회는 없다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "skip_and_play",
          label: "학원에 간다고 하고 친구들이랑 논다",
          outcome: `처음엔 쉬웠다. 하지만 두 달 후 학원 원장이 엄마에게 전화한다.
들켰다. 엄마의 얼굴을 본다. 설명하기가 애매하다.`,
          sets: { academic_effort: "low" }
        },
        {
          id: "negotiate",
          label: "엄마에게 학원 과목을 줄여달라고 협상한다",
          outcome: `"수학 하나만 하면 나머지 시간엔 내가 알아서 할게요."
엄마가 잠깐 생각하더니 허락했다. 전부 이긴 건 아니지만, 뭔가 이룬 느낌이다.`,
          sets: { academic_effort: "medium" }
        }
      ]
    },

    // ── E103: 화장실 앞 (도덕 딜레마 — childhood_pattern: protective 우선) ────
    {
      id: "E103",
      arc: "arc1",
      title: "화장실 앞에서",
      type: "moral_dilemma",
      tags: ["왕따", "용기", "집단"],
      requires: { childhood_pattern: "protective" },
      excludes: {},
      weight: 1.8,

      summary: `쉬는 시간, 3층 남자 화장실 앞을 지나치다 멈춘다.
남자애 서너 명이 한 명을 벽 쪽으로 몰아세우고 있다. 말은 낮게 하는데, 분위기가 이상하다.
그 아이 얼굴이 보인다. 같은 반은 아닌데, 어디선가 본 얼굴이다.
복도에 다른 아이들은 지나치고 있다.`,

      actions: [
        {
          id: "step_in_directly",
          label: "직접 끼어들어 \"야, 그만해\"라고 말한다",
          outcome: `서너 명이 일제히 당신을 본다. 다리가 약간 떨린다.
"너 뭐야?"라는 말이 나왔지만, 그 자리에 서 있으니 분위기가 바뀐다.
결국 그들이 먼저 간다. 그 아이가 작게 고개를 숙인다.`,
          sets: { social_role: "leader" }
        },
        {
          id: "get_teacher",
          label: "교무실로 달려가 선생님을 데려온다",
          outcome: `직접 나서는 건 무서웠다. 하지만 선생님이 오자 상황이 정리된다.
그 아이가 나를 봤는지 모르겠다. 내가 뭔가를 했다는 것만은 안다.`,
          sets: { social_role: "follower" }
        },
        {
          id: "walk_away",
          label: "다른 화장실을 쓰기로 하고 자리를 피한다",
          outcome: `다음 수업 시간 내내 그 아이 얼굴이 머릿속에 있다.
오후에 복도에서 마주쳤는데, 그 아이가 먼저 눈길을 피했다.
괜찮은 걸 선택했는지 모르겠다.`,
          sets: { social_role: "loner" }
        }
      ]
    },

    // ── E104: 집단 따돌림 목격 (도덕 딜레마 — 일반) ──────────────────────────
    {
      id: "E104",
      arc: "arc1",
      title: "점심시간의 빈 의자",
      type: "moral_dilemma",
      tags: ["따돌림", "관계", "방관"],
      requires: {},
      excludes: { childhood_pattern: "protective" },
      weight: 1.0,

      summary: `급식실에서 밥을 들고 자리를 찾는데, 한 아이가 혼자 구석에 앉아 있다.
옆 자리에 앉으려는 아이들이 "여기 자리 없어"라며 막고 있다.
그 아이는 아무 말도 안 하고 밥을 먹고 있다.
당신 손에는 쟁반이 들려 있다. 어디에 앉을지 결정해야 한다.`,

      actions: [
        {
          id: "sit_beside",
          label: "그 아이 옆에 가서 앉는다",
          outcome: `막던 아이들이 당신을 본다. 잠깐 눈이 마주쳤지만 아무 말 없이 지나간다.
그 아이가 살짝 놀란 것 같다. 밥 먹는 동안 말을 거의 안 했지만, 나쁘지 않았다.`,
          sets: { social_role: "outsider" }
        },
        {
          id: "sit_with_friends",
          label: "친구들 자리를 찾아 그냥 앉는다",
          outcome: `친구들이랑 밥을 먹었다. 밥은 맛있었다.
그 아이가 어디 앉았는지는 나중에 생각났다.`,
          sets: { social_role: "follower" }
        },
        {
          id: "report_to_teacher",
          label: "식판을 들고 담임 선생님을 찾아간다",
          outcome: `선생님이 상황을 파악하러 갔다. 당신은 친구들 자리에 앉았다.
그 아이가 나를 알아볼지 모르겠다. 내가 한 게 맞는지도.`,
          sets: {}
        }
      ]
    },

    // ── E105: 첫 짝사랑 (관계 선택) ─────────────────────────────────────────
    {
      id: "E105",
      arc: "arc1",
      title: "짝사랑",
      type: "relationship_choice",
      tags: ["감정", "용기", "관계"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `2학기가 됐다. 반에 좋아하는 사람이 생겼다.
같은 자리는 아닌데, 눈이 자꾸 그쪽으로 간다.
친한 친구가 "표정만 봐도 알겠다"며 놀린다.
수행평가 발표가 끝나고 복도가 조용해지는 오후,
친구가 "어떻게 할 거야?"라고 묻는다.`,

      actions: [
        {
          id: "confess_directly",
          label: "직접 종이에 적어서 건넨다",
          outcome: `손이 조금 떨렸다. 그 아이가 종이를 읽는다.
결과가 어떻게 됐든, 그걸 건넨 자신이 조금 낯설게 느껴진다.
이제 마주칠 때 눈이 더 자주 마주친다.`,
          sets: { social_role: "leader" }
        },
        {
          id: "ask_friend_to_tell",
          label: "친한 친구에게 마음을 전해달라고 부탁한다",
          outcome: `친구가 다음날 "대답해줬어"라고 한다.
직접 말하지 못한 게 조금 아쉽다. 이 방식이 나한테 맞는지 모르겠다.`,
          sets: { social_role: "follower" }
        },
        {
          id: "do_nothing",
          label: "그냥 지켜보기로 한다",
          outcome: `학기말이 됐다. 그 감정이 조용히 사라지지는 않았다.
한 번쯤은 말했더라면 어땠을까 가끔 생각난다.`,
          sets: { social_role: "loner" }
        }
      ]
    },

    // ── E106: 담임의 규칙 (정체성 선택) ─────────────────────────────────────
    {
      id: "E106",
      arc: "arc1",
      title: "납득이 안 되는 규칙",
      type: "identity_choice",
      tags: ["권위", "반항", "규칙"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `담임이 오늘부터 새 규칙을 발표한다.
"수업 시작 전 핸드폰은 선생님 책상 위에 올려놓는다. 쉬는 시간에도 안 돼."
친구들이 술렁인다. 이유를 물어본 아이가 있었는데 "선생님이 그렇다고 하니까"라는 답이 왔다.
납득이 안 된다.`,

      actions: [
        {
          id: "question_alone",
          label: "수업 후 혼자 선생님께 조용히 이유를 묻는다",
          outcome: `선생님이 잠깐 멈추더니 설명을 했다. 납득이 가는 부분도, 여전히 이상한 부분도 있다.
하지만 직접 물어봤다는 사실이 뭔가 달랐다.`,
          sets: { social_role: "outsider" }
        },
        {
          id: "rally_classmates",
          label: "친구들을 모아 반장 통해 집단으로 이의를 제기한다",
          outcome: `반장이 쉬는 시간에 선생님 앞에서 반 의견을 전달했다.
규칙이 바뀌지는 않았지만, 우리가 말했다는 사실은 남는다.`,
          sets: { social_role: "leader" }
        },
        {
          id: "just_comply",
          label: "어차피 규칙이니까 그냥 따른다",
          outcome: `불만이 없는 건 아니다. 하지만 싸울 가치가 있는지 모르겠다.
핸드폰을 책상에 올려놓는 게 습관이 됐다.`,
          sets: { social_role: "follower" }
        }
      ]
    },

    // ── E107: 첫 중간고사 결과 (방향 선택) ───────────────────────────────────
    {
      id: "E107",
      arc: "arc1",
      title: "첫 성적표",
      type: "direction_choice",
      tags: ["성적", "공부", "자존심"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `중1 첫 중간고사 결과가 나왔다.
국어 74, 수학 61, 영어 58. 생각보다 낮다.
초등학교 때는 딱히 공부하지 않아도 괜찮았다.
집에 성적표를 들고 돌아가는 길,
이게 앞으로 어떻게 될지 결정해야 한다.`,

      summary_variants: {
        "academic_effort:high": `중1 첫 중간고사 결과가 나왔다.
국어 88, 수학 92, 영어 85. 나쁘지 않은 결과다.
학원도 다녔고 열심히 했는데, 이게 전부인지 아닌지 가늠이 안 된다.
집으로 돌아가는 길, 다음 시험을 어떻게 준비할지 생각한다.`
      },

      actions: [
        {
          id: "study_harder",
          label: "다음 시험엔 제대로 준비해보기로 한다",
          outcome: `다음 시험 2주 전부터 오답 노트를 만들었다.
기말고사 결과가 올랐다. 전략이 통했다는 게 기분 좋다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "accept_as_is",
          label: "이 정도면 괜찮다고 생각하고 넘긴다",
          outcome: `성적에 연연하지 않기로 했다. 할 건 하고 있으니까.
다음 시험도 비슷한 점수가 나왔다. 그게 나의 수준인 것 같다.`,
          sets: { academic_effort: "medium" }
        },
        {
          id: "blame_talent",
          label: "공부는 재능이라고 생각하고 다른 걸 찾기로 한다",
          outcome: `어차피 성적은 타고나는 거라는 결론을 내렸다.
교과서보다 다른 데서 흥미를 찾기 시작한다.`,
          sets: { academic_effort: "low" }
        }
      ]
    },

    // ── E108: 동아리 선택 (정체성 선택) ─────────────────────────────────────
    {
      id: "E108",
      arc: "arc1",
      title: "어느 동아리에 들어갈까",
      type: "identity_choice",
      tags: ["동아리", "관심사", "정체성"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `동아리 선택 기간이다.
벽에 붙은 포스터를 본다. 컴퓨터부, 미술부, 축구부, 독서토론부.
선생님은 "뭐든 1년은 해봐야 한다"고 했다.
이 선택이 별것 아닌 것 같으면서도, 이 학교에서 어떤 사람으로 지낼지와 연결될 것 같다.`,

      actions: [
        {
          id: "join_computer",
          label: "컴퓨터부 — 코딩과 게임을 만들어보고 싶다",
          outcome: `첫날 선배가 간단한 HTML을 가르쳐줬다. 화면에 내가 쓴 글자가 뜨는 게 신기하다.
뭔가를 만들 수 있다는 감각이 낯설고 좋다.`,
          sets: { first_interest: "stem" }
        },
        {
          id: "join_art",
          label: "미술부 — 그리고 만드는 게 좋다",
          outcome: `수채화, 드로잉, 포스터 작업. 결과물이 남는 게 좋다.
내가 만든 것이 벽에 걸리는 날, 뭔가 생긴 느낌이다.`,
          sets: { first_interest: "arts" }
        },
        {
          id: "join_soccer",
          label: "축구부 — 몸 쓰고 팀이랑 뛰는 게 좋다",
          outcome: `연습이 고되다. 그런데 경기에서 골을 넣는 순간,
땀 흘린 것들이 한꺼번에 보상받는 느낌이 든다.`,
          sets: { first_interest: "sports", social_role: "leader" }
        },
        {
          id: "join_reading",
          label: "독서토론부 — 책 읽고 이야기하는 게 재미있을 것 같다",
          outcome: `처음엔 말하기가 어색했다. 하지만 내 생각을 말로 풀어내는 연습이 된다.
책 한 권이 대화 한 시간이 된다는 게 이상하면서도 좋다.`,
          sets: { first_interest: "humanities" }
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC1_MIDDLE;
} else {
  globalThis.ARC1_MIDDLE = ARC1_MIDDLE;
}
