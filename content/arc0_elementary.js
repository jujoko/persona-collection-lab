/**
 * Arc 0 · 초등학교 (E0xx)
 * 나이: 7~12세
 * 핵심 플래그 생성: childhood_pattern, first_interest
 * 핵심 플래그 소비: 없음 (최상위 아크)
 *
 * 톤: 순수하고 감각적. 아이의 눈높이로.
 * 도덕 딜레마보다 정체성/관심사 이벤트 비중을 높인다.
 */

const ARC0_ELEMENTARY = {
  id: "arc0",
  order: 0,
  title: "초등학교",
  subtitle: "규칙과 관계를 처음 배우는 시절",
  age_range: "7–12세",
  chapter_card: "세상이 교실 크기였던 시절. 점심 반찬이 중요하고, 쉬는 시간이 전부였다.",
  events_per_run: 3,

  events: [

    // ── E001: 어떤 시간이 제일 좋아? (정체성 선택) ─────────────────────────
    {
      id: "E001",
      arc: "arc0",
      title: "제일 좋아하는 시간",
      type: "identity_choice",
      tags: ["관심사", "적성", "자아"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `초등학교 3학년. 학교에서 보내는 하루가 익숙해졌다.
어느 시간이 제일 빨리 가고, 어떤 시간이 제일 지루할까.
선생님이 "가장 좋아하는 과목이 뭐야?" 라고 물어본다.
당신은 어떤 시간이 제일 좋은가.`,

      actions: [
        {
          id: "love_math_science",
          label: "수학이나 과학 시간이 좋다. 정답이 있는 게 좋아",
          outcome: `숫자 맞추는 게 재미있다. 도형이 뒤집어지고 짝이 맞는 순간이 좋다.
선생님이 "수학 머리가 있네"라고 한다. 뭔가 인정받은 느낌이 든다.`,
          sets: { first_interest: "stem" }
        },
        {
          id: "love_arts",
          label: "미술이나 음악 시간이 좋다. 뭔가 만드는 게 좋아",
          outcome: `도화지에 뭔가를 그릴 때, 시간이 금방 간다.
찰흙이든 색연필이든, 손으로 만드는 건 다 좋다. 내 것이 생기는 느낌.`,
          sets: { first_interest: "arts" }
        },
        {
          id: "love_pe_sports",
          label: "체육이 제일 좋다. 뛰는 게 좋아",
          outcome: `운동장에 나가면 생각이 없어진다. 달리고 차고 던지는 게 좋다.
교실 안에 있는 것보다 밖에 있을 때 내가 나 같다.`,
          sets: { first_interest: "sports" }
        },
        {
          id: "love_reading",
          label: "국어나 도서관 시간이 좋다. 이야기 읽는 게 좋아",
          outcome: `두꺼운 책이 무섭지 않다. 오히려 빨리 끝까지 읽고 싶다.
선생님이 독후감을 잘 쓴다고 했다. 글 쓰는 게 나쁘지 않다.`,
          sets: { first_interest: "humanities" }
        }
      ]
    },

    // ── E002: 쉬는 시간 (자기 표현) ────────────────────────────────────────
    {
      id: "E002",
      arc: "arc0",
      title: "10분의 쉬는 시간",
      type: "identity_choice",
      tags: ["관계", "자아", "놀이"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `수업이 끝나고 10분 쉬는 시간이다.
어떤 친구들은 운동장으로 달려가고, 어떤 친구들은 교실에 남는다.
당신에게 쉬는 시간은 어떤 시간인가.`,

      actions: [
        {
          id: "play_outside",
          label: "운동장으로 나가 몸을 쓰며 논다",
          outcome: `10분이 금방 지나간다. 교실로 돌아올 때 숨이 차고 뺨이 붉다.
그래도 기분이 좋다. 다음 쉬는 시간도 빨리 왔으면 싶다.`,
          sets: { childhood_pattern: "curious" }
        },
        {
          id: "stay_read_draw",
          label: "교실에서 책을 읽거나 그림을 그린다",
          outcome: `조용한 교실이 편하다. 혼자여도 심심하지 않다.
그러다 친구가 옆에 앉으면 반갑기도 하다.`,
          sets: { childhood_pattern: "curious" }
        },
        {
          id: "gather_friends",
          label: "친구들을 모아 뭔가를 같이 한다",
          outcome: `"우리 이거 하자" 하면 친구들이 따라온다. 같이 하는 게 혼자보다 재미있다.
오늘은 술래잡기, 내일은 주번 정하기, 모이게 만드는 게 내 역할 같다.`,
          sets: { childhood_pattern: "protective", social_role: "leader" }
        },
        {
          id: "stay_with_one_friend",
          label: "친한 친구 하나랑만 조용히 논다",
          outcome: `둘이서 이야기하다 보면 10분이 지난다.
사실 그 친구랑 있을 때 제일 편하다. 많은 친구보다 딱 맞는 한 명이 좋다.`,
          sets: { childhood_pattern: "protective" }
        }
      ]
    },

    // ── E003: 운동장의 약자 (도덕 딜레마) ────────────────────────────────────
    {
      id: "E003",
      arc: "arc0",
      title: "운동장에서 본 것",
      type: "moral_dilemma",
      tags: ["용기", "약자", "방관"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `쉬는 시간, 운동장 구석에서 5학년 아이 셋이 2학년 아이를 가운데 세워두고 있다.
위협하는 건 아닌 것 같은데, 그 아이가 울고 싶은 표정인 건 분명하다.
선생님은 보이지 않는다. 친구들은 그냥 지나친다.
당신의 발이 멈춘다.`,

      actions: [
        {
          id: "step_in",
          label: "그 아이 곁으로 걸어가 옆에 선다",
          outcome: `5학년 아이들이 당신을 본다. 무섭다.
하지만 그 아이 옆에 서 있으니까, 혼자는 아닌 것 같다.
결국 5학년들이 떠난다. 2학년 아이가 작게 "고마워"라고 한다.`,
          sets: { childhood_pattern: "protective" }
        },
        {
          id: "get_teacher",
          label: "선생님을 찾으러 달려간다",
          outcome: `직접 나서긴 무서웠다. 하지만 선생님을 데려왔다.
선생님이 상황을 정리한다. 2학년 아이는 내가 뛰어간 걸 봤을까.`,
          sets: { childhood_pattern: "conformist" }
        },
        {
          id: "walk_past",
          label: "못 본 척하고 지나친다",
          outcome: `교실로 돌아왔다. 수업이 시작됐다.
창문 너머 운동장을 본다. 그 아이가 아직 거기 있는 것 같다.`,
          sets: { childhood_pattern: "conformist" }
        }
      ]
    },

    // ── E004: 시험지 커닝 (도덕 딜레마) ──────────────────────────────────────
    {
      id: "E004",
      arc: "arc0",
      title: "받아쓰기 시험",
      type: "moral_dilemma",
      tags: ["정직", "우정", "규칙"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `국어 받아쓰기 시험. 선생님이 불러주는 단어를 받아 적고 있다.
문제는, 옆에 앉은 짝꿍이 슬쩍슬쩍 당신 답지를 보고 있다는 것이다.
짝꿍은 받아쓰기를 늘 어려워한다.
선생님은 앞을 보고 있다.`,

      actions: [
        {
          id: "cover_paper",
          label: "슬쩍 답지를 몸으로 가린다",
          outcome: `짝꿍이 눈치채고 잠깐 멈춘다.
시험이 끝나고 짝꿍은 아무 말 없다. 뭔가 어색해졌다.`,
          sets: {}
        },
        {
          id: "let_copy",
          label: "못 본 척하고 계속 쓴다",
          outcome: `짝꿍이 몇 개 훔쳐봤다. 시험이 끝나고 짝꿍이 웃으며 "고마워"라고 한다.
뭔가 찜찜하지만, 그 웃음이 나쁘지는 않다.`,
          sets: {}
        },
        {
          id: "tell_teacher",
          label: "시험 후 선생님께 말씀드린다",
          outcome: `짝꿍이 선생님에게 불려간다. 당신이 말했다는 걸 짝꿍이 안다.
며칠 동안 같이 밥을 안 먹는다. 맞는 일을 했는데 왜 이런지 모르겠다.`,
          sets: { childhood_pattern: "conformist" }
        }
      ]
    },

    // ── E005: 친구의 도시락 (공감/나눔) ────────────────────────────────────
    {
      id: "E005",
      arc: "arc0",
      title: "밥 없는 친구",
      type: "priority_choice",
      tags: ["나눔", "공감", "관계"],
      requires: {},
      excludes: {},
      weight: 0.9,

      summary: `점심시간. 옆반 아이가 도시락을 안 가져왔다.
이 아이는 가끔 이런다. 오늘도 혼자 빈 책상에 앉아 있다.
당신의 도시락은 오늘 엄마가 좋아하는 반찬을 넣어줬다.
급식을 먹은 친구들은 이미 운동장으로 나갔다.`,

      actions: [
        {
          id: "share_lunch",
          label: "옆에 앉아 같이 먹자고 한다",
          outcome: `그 아이가 처음엔 괜찮다고 했는데, 반찬을 건네니까 받는다.
둘이 먹으니 짧지만 충분하다. 내가 더 배부른 것 같다.`,
          sets: { childhood_pattern: "protective" }
        },
        {
          id: "tell_teacher",
          label: "선생님께 그 아이가 밥을 못 먹고 있다고 말한다",
          outcome: `선생님이 급식실에서 밥을 가져다준다. 문제는 해결됐다.
그 아이는 고마워하는지 모르겠다. 내가 말한 걸 아는지도 모른다.`,
          sets: { childhood_pattern: "conformist" }
        },
        {
          id: "ignore",
          label: "모른 척하고 내 도시락을 먹는다",
          outcome: `밥은 맛있었다. 하지만 창밖으로 그 아이가 보인다.
그냥 지나쳤다는 사실이 밥 먹는 내내 옆에 있다.`,
          sets: {}
        }
      ]
    },

    // ── E006: 선생님의 틀린 말 (권위 선택) ────────────────────────────────────
    {
      id: "E006",
      arc: "arc0",
      title: "선생님이 틀렸다",
      type: "moral_dilemma",
      tags: ["권위", "정직", "용기"],
      requires: {},
      excludes: {},
      weight: 0.7,

      summary: `과학 시간. 선생님이 설명한 내용이 어제 당신이 읽은 책과 다르다.
틀린 것 같다. 확실히.
하지만 선생님이고, 친구들은 다 받아 적고 있다.
손을 들면 이상한 아이가 될 수도 있다.`,

      actions: [
        {
          id: "raise_hand",
          label: "손을 들고 조심스럽게 말한다",
          outcome: `선생님이 잠깐 멈춘다. 확인하더니 "맞네, 고마워"라고 한다.
친구들이 나를 본다. 창피한 것도 같고 뿌듯한 것도 같다.`,
          sets: { childhood_pattern: "curious" }
        },
        {
          id: "note_in_book",
          label: "내 공책에 '선생님이 틀린 것 같음'이라고 적어둔다",
          outcome: `아무도 모른다. 나만 안다.
나중에 시험에서 내 공책에 적어둔 답이 맞는 걸 확인한다.`,
          sets: { childhood_pattern: "curious" }
        },
        {
          id: "copy_like_others",
          label: "그냥 다른 친구들처럼 받아 적는다",
          outcome: `수업이 무난하게 끝난다. 시험에서 그 문제가 나왔고, 틀렸다.
왜 그때 말하지 않았을까.`,
          sets: { childhood_pattern: "conformist" }
        }
      ]
    },

    // ── E007: 부모님의 싸움 (위기 대응) ──────────────────────────────────────
    {
      id: "E007",
      arc: "arc0",
      title: "밤의 소리",
      type: "crisis_response",
      tags: ["가족", "불안", "보호"],
      requires: {},
      excludes: {},
      weight: 0.8,

      summary: `밤 11시. 자려고 누웠는데 거실에서 목소리가 높아진다.
부모님이 싸우고 있다. 돈 얘기 같기도 하고, 다른 얘기 같기도 하다.
동생 방 불이 꺼져 있다. 깨어있을까.
당신은 이불 속에서 소리를 듣고 있다.`,

      actions: [
        {
          id: "go_to_sibling",
          label: "동생 방으로 가서 같이 있어준다",
          outcome: `동생이 깨어있었다. 아무 말 없이 동생 옆에 눕는다.
조금 있으니 조용해진다. 동생이 먼저 잠든다.`,
          sets: { childhood_pattern: "protective" }
        },
        {
          id: "open_the_door",
          label: "거실로 나가 부모님한테 그만 하라고 한다",
          outcome: `부모님이 멈춘다. 엄마가 "어, 잠 못 잤어?" 라고 한다.
어색하게 끝났지만, 뭔가 한 것 같다.`,
          sets: { childhood_pattern: "protective" }
        },
        {
          id: "stay_hidden",
          label: "이불을 뒤집어쓰고 끝나길 기다린다",
          outcome: `소리가 잦아든다. 언제인가 잠이 들었다.
아침에 식탁에 앉으면 어제 일이 없었던 것처럼 밥을 먹는다.
하지만 뭔가 달라진 것 같다.`,
          sets: { childhood_pattern: "resilient" }
        }
      ]
    },

    // ── E008: 반장이 될까 (리더십 선택) ──────────────────────────────────────
    {
      id: "E008",
      arc: "arc0",
      title: "반장 선거",
      type: "opportunity_choice",
      tags: ["리더십", "책임", "선택"],
      requires: {},
      excludes: {},
      weight: 0.7,

      summary: `학기 초, 반장 선거 날이다.
선생님이 후보를 묻는다. 친한 친구가 "너 해봐"라고 옆에서 민다.
반장이 되면 회의에 나가야 하고, 반 일을 챙겨야 한다.
귀찮기도 하고, 해보고 싶기도 하다.`,

      actions: [
        {
          id: "volunteer",
          label: "손을 들고 \"저요\"라고 한다",
          outcome: `투표 결과, 당선됐다. 이제 선생님과 친구들 사이 어딘가에 있어야 한다.
처음엔 어색했지만, 조금씩 익숙해진다.`,
          sets: { social_role: "leader", childhood_pattern: "protective" }
        },
        {
          id: "push_friend",
          label: "밀어준 친구를 오히려 추천한다",
          outcome: `친구가 당선됐다. 당신은 박수를 쳤다.
나서지 않아서 홀가분한 것 같기도 하고, 아쉬운 것 같기도 하다.`,
          sets: { social_role: "follower" }
        },
        {
          id: "decline_quietly",
          label: "조용히 고개를 젓는다",
          outcome: `눈치 없이 지나갔다. 다른 아이가 반장이 됐다.
앞에 나서는 것보다 내 할 일 하는 게 편하다.`,
          sets: { social_role: "loner" }
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC0_ELEMENTARY;
} else {
  globalThis.ARC0_ELEMENTARY = ARC0_ELEMENTARY;
}
