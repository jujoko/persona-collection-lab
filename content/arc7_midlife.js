/**
 * Arc 7 · 중년 (E7xx)
 * 나이: 38~50세
 * 핵심 플래그 생성: 없음 (플래그 소비 → 엔딩 수렴)
 * 핵심 플래그 소비: 모든 플래그 조합
 *
 * 톤: 성찰. 빠르지 않고 무겁고 조용한 톤.
 *     어떤 선택이 옳았는지보다, 그 선택들이 어떤 삶을 만들었는지를 보여준다.
 *     판단보다 묘사. 결론보다 질문.
 *
 * 구조: 6개 이벤트 전부 엔딩 수렴용.
 *       summary_variants를 통해 과거 플래그들이 이 장면에 다르게 울린다.
 *       events_per_run: 3
 */

const ARC7_MIDLIFE = {
  id: "arc7",
  order: 7,
  title: "중년",
  subtitle: "어떤 삶이었는가",
  age_range: "38–50세",
  chapter_card: "마흔이 됐다. 예상했던 것들이 있고, 예상 못 했던 것들이 있다. 이제 앞보다 뒤를 돌아보는 일이 늘었다.",
  events_per_run: 4,

  events: [

    // ── E701: 동창회 (정체성 선택) — 공통 ──────────────────────────────────
    {
      id: "E701",
      arc: "arc7",
      title: "오랜만에 만난 얼굴들",
      type: "identity_choice",
      tags: ["동창", "비교", "성찰"],
      requires: {},
      excludes: {},
      weight: 1.2,

      summary: `초등학교 혹은 중학교 동창회. 삼십 년 만에 연락이 닿은 얼굴들이다.
누군가는 잘 됐고, 누군가는 그렇지 않다. 당신은 어떻게 보일까.
그리고 다른 사람의 삶이 당신의 눈에 어떻게 들어오는가.`,

      summary_variants: {
        "reputation:high": `이름이 알려진 편이다. 누군가가 먼저 알아보고 인사를 한다.
그 눈빛이 부러움인지 호기심인지 알 수 없다.
당신이 이 자리를 어떻게 느끼는지가 중요하다.`,
        "reputation:tainted": `한때 있었던 일을 아는 사람이 이 자리에도 있을 것 같다.
그 사람이 먼저 말을 걸어올지, 못 본 척할지 모른다.`,
        "financial_status:debt": `남들이 집 이야기, 투자 이야기를 할 때 조용히 있었다.
내 사정을 말하고 싶지 않다. 그런데 말하지 않아도 드러나는 것들이 있다.`,
        "family_structure:single": `결혼했냐는 질문이 반드시 나온다. 익숙한 질문이다.
이 자리에서 그 대답이 아직도 어색한지, 이제는 괜찮은지.`
      },

      actions: [
        {
          id: "engage_warmly",
          label: "반갑게 어울린다. 오랜만에 만난 사람들이 좋다",
          outcome: `밥을 먹고 술을 마셨다. 시간이 빠르게 갔다.
집으로 오는 길에, 이 사람들과 함께 컸다는 게 새삼 신기하게 느껴졌다.`,
          sets: {}
        },
        {
          id: "leave_early",
          label: "인사만 하고 일찍 나온다",
          outcome: `오래 있기가 불편했다. 비교하게 되거나 비교당하는 느낌.
나온 것이 후련하다. 집에 돌아와 조용히 앉아 있었다.`,
          sets: {}
        },
        {
          id: "reconnect_with_one",
          label: "한두 명과 따로 연락을 이어간다",
          outcome: `오래된 친구와 다시 만났다. 동창회보다 이 쪽이 더 편했다.
어릴 때 이야기가 나왔다. 기억이 서로 달랐다.`,
          sets: {}
        }
      ]
    },

    // ── E702: 부모님을 보내다 (위기 대응) — 공통 ────────────────────────────
    {
      id: "E702",
      arc: "arc7",
      title: "마지막 인사",
      type: "crisis_response",
      tags: ["부모", "상실", "죽음"],
      requires: {},
      excludes: {},
      weight: 1.3,

      summary: `부모님 중 한 분이 돌아가셨다. 오래 편찮으셨거나, 갑작스럽게.
장례를 치르는 며칠 동안, 해야 할 일들이 많다.
그 일들을 하면서 생각이 찾아온다.
충분히 잘 해드렸는지. 해드리지 못한 것들이 있는지.`,

      summary_variants: {
        "childhood_pattern:protective": `어릴 때부터 가족을 챙겼다. 그 습관이 장례 내내 이어졌다.
형제들이 당신을 중심으로 움직였다.
정작 당신이 슬퍼할 시간이 없었다.`,
        "childhood_pattern:resilient": `감정을 티 내지 않는 쪽이었다. 그게 이번에도 그랬다.
혼자 있을 때, 생각보다 오래 앉아 있었다.`,
        "family_structure:married": `배우자가 곁에 있었다. 이 사람이 있어서 다행이라는 생각이 처음으로 들었다.`,
        "family_structure:single": `혼자 이 모든 것을 감당했다. 힘들었지만 할 수 있었다.
나중에야 힘들었다는 걸 알았다.`,
        "financial_status:debt": `장례 비용이 걱정됐다. 이 슬픔 옆에 그 계산이 함께 있었다.
그게 불편했다.`
      },

      actions: [
        {
          id: "be_present_fully",
          label: "모든 절차에 직접 있는다. 마지막까지 곁에 있겠다",
          outcome: `3일이 지나갔다. 무엇을 했는지보다 그 자리에 있었다는 게 남는다.
집으로 돌아온 첫날 밤, 조용했다.`,
          sets: {}
        },
        {
          id: "handle_practical_things",
          label: "감정보다 해야 할 일들을 먼저 챙긴다",
          outcome: `서류, 연락, 음식. 움직이면서 생각을 덜었다.
일이 끝난 후에야 현실이 왔다.`,
          sets: {}
        },
        {
          id: "let_grief_come",
          label: "슬픔이 오면 그냥 둔다",
          outcome: `울었다. 어디서 어떻게 나온 건지 모르게.
다 울고 나서, 좀 지났다는 느낌이 들었다.`,
          sets: {}
        }
      ]
    },

    // ── E703: 자녀의 갈림길 (방향 선택) — family_structure: married/cohabiting ─
    {
      id: "E703",
      arc: "arc7",
      title: "아이의 선택 앞에서",
      type: "direction_choice",
      tags: ["자녀", "교육", "부모"],
      requires: { family_structure: ["married", "cohabiting"] },
      excludes: {},
      weight: 1.4,

      summary: `아이가 고3이다. 수능이 얼마 남지 않았다.
아이가 원하는 진로가 있는데, 당신이 생각하는 방향과 다르다.
내가 살아온 방식을 아이에게 권해야 하는지, 아이의 길을 따라가야 하는지.
이 대화가 지금 필요하다.`,

      summary_variants: {
        "exam_score:top": `당신은 좋은 성적으로 상위권 대학을 갔다. 그 경험이 이 대화에 무게를 준다.
아이에게 그 길을 권하는 게 맞는 건지, 아닌지.`,
        "exam_score:fail": `당신은 재수를 했다. 그 1년이 어떤 해였는지 안다.
아이가 비슷한 선택의 기로에 서 있다.`,
        "career_start:startup": `당신은 안정보다 도전을 선택했다. 아이도 비슷한 길을 원한다.
응원이 되는지, 걱정이 되는지 구분이 안 된다.`,
        "career_start:public": `안정적인 길의 좋은 점과 답답한 점을 안다.
아이에게 솔직하게 말할 수 있는가.`
      },

      actions: [
        {
          id: "support_childs_choice",
          label: "아이가 원하는 길을 지지한다",
          outcome: `아이가 고마워했다. 당신이 말하지 않은 걱정도 있다.
하지만 이 아이의 선택이 이 아이의 삶이라는 걸 안다.`,
          sets: {}
        },
        {
          id: "share_my_experience",
          label: "내 경험을 솔직하게 이야기한다. 강요는 하지 않는다",
          outcome: `아이가 듣고 있었다. 얼마나 받아들였는지는 모른다.
말하고 나서 내가 그때 어떻게 선택했는지를 다시 생각했다.`,
          sets: {}
        },
        {
          id: "push_safer_path",
          label: "안전한 길을 권한다. 고생을 대신 해줄 수는 없어도 막을 수는 있다",
          outcome: `아이가 조용히 들었다. 동의한 건지 참은 건지 모르겠다.
나중에 아이가 어떤 길을 선택하든, 이 대화가 남아 있을 것이다.`,
          sets: {}
        }
      ]
    },

    // ── E704: 커리어의 끝자락 (방향 선택) — 공통 ─────────────────────────────
    {
      id: "E704",
      arc: "arc7",
      title: "이 일을 언제까지 할 것인가",
      type: "direction_choice",
      tags: ["은퇴", "커리어", "마무리"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `마흔다섯. 이 일을 언제까지 할 수 있을지, 해야 할지 생각하게 됐다.
젊은 사람들이 올라오고 있다. 조직은 변하고 있다.
여기서 더 버틸 것인지, 정리할 것인지, 다른 걸 시작할 것인지.
선택의 무게가 예전과 다르다.`,

      summary_variants: {
        "reputation:high": `이름이 있다. 원하면 아직 더 할 수 있다.
하지만 하고 싶은 것과 할 수 있는 것이 같은지 다른지.`,
        "reputation:tainted": `완전히 회복하지 못한 채로 여기까지 왔다.
이 일을 계속하는 게 맞는지, 아닌지.`,
        "career_start:public": `정년이 있다. 그 날짜가 보이기 시작했다.
이 안정성이 지금 이 순간 다르게 느껴진다.`,
        "career_start:freelance": `정년도 없고, 보장도 없다. 계속 움직여야 한다.
몸과 마음이 얼마나 더 버텨줄지.`,
        "financial_status:debt": `은퇴를 생각하기엔 아직 빚이 남아 있다.
선택의 여지가 좁다.`
      },

      actions: [
        {
          id: "keep_going",
          label: "할 수 있을 때까지 계속한다",
          outcome: `더 했다. 지치는 날도 있었지만, 이 일 자체가 나를 붙잡아줬다.
언젠가 정말 마지막이 오겠지만, 그때 가서 생각하기로 한다.`,
          sets: {}
        },
        {
          id: "plan_retirement",
          label: "언제 끝낼지를 정하고 준비한다",
          outcome: `날짜를 정했다. 구체적이 되니 남은 시간이 다르게 보인다.
하루하루를 이전과 다르게 쓰게 됐다.`,
          sets: { financial_status: "stable" }
        },
        {
          id: "pivot_to_something_new",
          label: "지금 하는 일 말고 다른 것을 시작한다",
          outcome: `새 시작이 낯설다. 나이 들어 처음 하는 것들이 어색하다.
하지만 어색함이 죽은 건 아니라는 걸 보여주는 것 같기도 하다.`,
          sets: { reputation: "medium" }
        }
      ]
    },

    // ── E705: 몸의 한계 (위기 대응) — health 취약 시 weight 1.8 ─────────────────
    {
      id: "E705",
      arc: "arc7",
      title: "예전 같지 않다",
      type: "crisis_response",
      tags: ["건강", "나이", "수용"],
      requires: {},
      excludes: {},
      weight: 1.0,

      summary: `무릎이 아프다. 피로가 사흘이 가도 안 빠진다. 잠을 자도 개운하지 않다.
검사를 받으러 갔더니 의사가 "이제 관리를 해야 합니다"라고 했다.
몸이 지금까지 살아온 방식의 청구서를 보내고 있다.
어떻게 받아들일 것인가.`,

      summary_variants: {
        "health:chronic": `오래 전부터 신호가 왔었다. 그걸 무시하고 살았다.
이제는 더 이상 무시할 수 없는 상태가 됐다.`,
        "health:warning": `경고가 경고로 끝나지 않았다. 다음 단계가 됐다.`,
        "health:good": `그나마 관리를 해왔다. 그런데도 이렇다.
나이라는 것이 공평하게 온다는 걸 실감한다.`,
        "academic_effort:high": `열심히 살았다. 그 대가가 몸에 기록돼 있다.`
      },

      actions: [
        {
          id: "accept_and_adapt",
          label: "몸의 변화를 받아들이고 생활을 바꾼다",
          outcome: `술을 끊거나 줄이고, 걷기 시작하고, 잠을 더 잤다.
처음엔 불편했다. 한 달이 지나자 몸이 달라졌다.
이걸 더 일찍 했더라면 하는 생각도 했다.`,
          sets: { health: "warning" }
        },
        {
          id: "push_through",
          label: "아직 할 일이 있다. 조금만 더 버틴다",
          outcome: `버텼다. 일을 마쳤다.
하지만 몸이 기억한다. 다음에 더 큰 청구서로 올 것 같다.`,
          sets: { health: "chronic" }
        },
        {
          id: "slow_down_everything",
          label: "속도를 줄인다. 이제 그럴 때가 됐다",
          outcome: `바쁘게 움직이지 않으니 다른 것들이 보이기 시작했다.
처음엔 뒤처지는 것 같았는데, 시간이 지나자 그게 아니었다.`,
          sets: { health: "good" }
        }
      ]
    },

    // ── E706: 어떤 사람으로 기억될까 (정체성 선택) — 공통, 엔딩 수렴 ──────────
    {
      id: "E706",
      arc: "arc7",
      title: "어떤 사람이었는가",
      type: "identity_choice",
      tags: ["성찰", "기억", "삶"],
      requires: {},
      excludes: {},
      weight: 1.5,

      summary: `마흔다섯, 또는 쉰.
삶이 여기까지 왔다. 앞이 있지만 뒤가 더 길어졌다.
오늘 누군가 당신에게 묻는다. 아이든, 후배든, 오래된 친구든.
"어떤 사람으로 살고 싶었어요?"
잠깐 침묵이 흘렀다.`,

      summary_variants: {
        "childhood_pattern:protective": `어릴 때부터 남을 챙겼다. 그게 지금도 이어졌다.
그게 내 사람들을 지켰는지, 내 자신을 소진시켰는지.`,
        "childhood_pattern:curious": `늘 뭔가를 알고 싶었다. 그 호기심이 지금도 살아있는가.`,
        "childhood_pattern:resilient": `감당하고, 또 감당했다. 그것이 강함이었는지 습관이었는지.`,
        "reputation:high": `이름이 남았다. 그게 내가 원했던 것이었는지.`,
        "reputation:tainted": `흠이 있다. 그 흠이 전부가 아니라는 것을 알지만,
다른 사람들이 그렇게 봐줄지는 모른다.`,
        "family_structure:married": `곁에 사람이 있다. 이 사람과 여기까지 왔다.`,
        "family_structure:single": `혼자 여기까지 왔다. 그게 외로움이었는지, 자유였는지.`,
        "financial_status:debt": `여유롭지 않았다. 그 안에서도 살아냈다.`,
        "health:chronic": `몸이 한계를 먼저 알았다. 그 신호를 언제부터 무시했을까.`
      },

      actions: [
        {
          id: "answer_with_pride",
          label: "지금 살아온 방식이 내 답이라고 생각한다",
          outcome: `완벽하지 않았다. 후회도 있다.
하지만 내가 한 선택들이 모여서 이 사람이 됐다.
그걸 부끄러워하지 않기로 했다.`,
          sets: {}
        },
        {
          id: "answer_with_regret",
          label: "달리 살았더라면 하는 생각이 있다",
          outcome: `그 생각을 솔직하게 말했다.
말하고 나서, 그 후회가 조금 가벼워진 것 같았다.
아직 살아있다는 게 그 의미이기도 하다.`,
          sets: {}
        },
        {
          id: "dont_know_yet",
          label: "아직 모르겠다. 더 살아봐야 알 것 같다",
          outcome: `그 대답이 오히려 솔직했다.
살아가는 중에 답이 만들어지는 것인지도 모른다.
질문이 닫히지 않은 채로, 계속 살아간다.`,
          sets: {}
        }
      ]
    },

    // ── ME010: 마지막 제안 ────────────────────────────────────────────────────
    {
      id: "ME010",
      arc: "arc7",
      title: "마지막 제안",
      type: "final_compromise",
      tags: ["권력", "안전", "정체성"],
      requires: {},
      excludes: {},
      weight: 1.1,
      summary: `모든 사건 뒤, 큰 조직이 조용한 자리를 제안한다.
받아들이면 안전과 영향력을 얻지만 지금까지의 문제 제기를 멈춰야 한다.
거절하면 불안정하지만 자기 길을 유지한다.`,
      event_embedding: [-0.18, 0.34, 0.68, -0.08, 0.76, -0.18, 0.5, 0.18],
      actions: [
        {
          id: "accepts_compromise",
          label: "제안을 받아들이고 내부에서 움직인다",
          embedding: [-0.12, 0.18, 0.24, 0.04, 0.58, 0.18, 0.56, 0.18],
          bias: 0.02,
          outcome: "안정된 자리와 영향력을 얻지만, 날카로운 목소리는 작아진다.",
          endingWeight: { conformist: 2, survivor: 2, reformer: 1 },
          memory: "사무실은 넓어졌고 명함도 바뀌었다. 전에 하던 말은 더 이상 꺼내지 않는다.",
          sets: {}
        },
        {
          id: "rejects_compromise",
          label: "제안을 거절하고 독립적으로 남는다",
          embedding: [0.18, -0.32, 0.72, 0.16, 0.34, 0.28, -0.62, 0.74],
          bias: 0,
          outcome: "불안정하지만 지금까지의 선택을 끝까지 책임진다.",
          endingWeight: { whistleblower: 2, exile: 1, martyr: 1, changemaker: 1 },
          memory: "제안을 거절한 날, 통장 잔고가 그 어느 때보다 낮았다. 그래도 잠은 잘 잤다.",
          sets: {}
        },
        {
          id: "uses_offer_publicly",
          label: "제안 내용을 공개해 협상 카드로 쓴다",
          embedding: [0.08, -0.2, 0.82, 0.22, 0.7, 0.18, -0.36, 0.66],
          bias: -0.01,
          outcome: "큰 파장을 만들며 판을 흔들지만, 돌아갈 길도 사라진다.",
          endingWeight: { changemaker: 3, whistleblower: 2, exile: 1 },
          memory: "제안서를 공개한 날, 핸드폰이 멈출 때까지 울렸다. 그 뒤로 조용한 날이 없었다.",
          sets: {}
        }
      ]
    },

    // ── E707: 후배의 소식 [requires: mentored_someone] ───────────────────────
    {
      id: "E707",
      arc: "arc7",
      title: "후배의 소식",
      type: "mentor_legacy",
      tags: ["후배", "흔적", "의미"],
      requires: { mentored_someone: true },
      excludes: {},
      weight: 1.2,

      summary: `그 후배가 자기 일을 시작했다고 연락이 왔다.
작은 규모지만, 자기가 원하던 방향으로 가고 있다고 했다.
'선배 덕분이에요'라는 말도 덧붙였다.
그 말이 맞는 말인지 모르겠다. 그때 내가 뭘 해준 게 있는지 떠올려봤다.`,

      summary_variants: {
        "mentee_outcome:pushed": `'버텨보라고 하셔서 버텼어요. 지금 생각하면 그게 맞았던 것 같아요.'
내가 그렇게 말했다는 게 잘한 건지, 운이 좋았던 건지 모르겠다.`,
        "mentee_outcome:supported": `'그만둬도 된다고 해주셔서 그만둘 수 있었어요.'
그 말 한마디가 그 사람의 방향을 바꿨다는 게 낯설게 느껴진다.`,
        "mentee_outcome:talking": `그때 이후로 가끔 연락이 닿았다. 그게 쌓였던 것 같다.`
      },

      actions: [
        {
          id: "feels_glad",
          label: "잘 됐다고, 진심으로 기뻐한다",
          outcome: `기뻤다. 이 기분이 낯설었다. 내 일이 아닌데 내 일 같았다.
어떤 흔적을 남기는 방식이 있다는 걸 처음으로 실감했다.`,
          sets: {}
        },
        {
          id: "deflects_credit",
          label: "본인이 잘 한 거라고, 내 덕분이 아니라고 한다",
          outcome: `후배가 '그래도 선배 덕분이에요'라고 했다. 그 말을 받아들이는 게 어려웠다.
왜 어려운지는 잘 모르겠다.`,
          sets: {}
        },
        {
          id: "meets_and_listens",
          label: "만나서 직접 이야기를 들어보자고 한다",
          outcome: `밥을 같이 먹었다. 그때 그 점심 자리보다 후배가 훨씬 말이 많아졌다.
그 변화가 느껴졌다.`,
          sets: {}
        }
      ]
    },

    // ── E708: 빈 방 (고독 정산) — 공통 ──────────────────────────────────────
    {
      id: "E708",
      arc: "arc7",
      title: "빈 방",
      type: "solitude_reckoning",
      tags: ["혼자", "공간", "정리"],
      requires: {},
      excludes: {},
      weight: 1.1,

      summary: `오늘 집이 조용하다. 예전보다 훨씬 조용하다.
자녀가 독립했거나, 오래된 관계가 끝났거나, 혼자 살아온 것이 새삼 다르게 느껴지거나.
이유는 달라도 이 공간이 처음으로 온전히 내 것이 된 것 같다.
그게 자유인지 비어있음인지 아직 모르겠다.`,

      summary_variants: {
        "family_structure:married": `배우자가 오래 아파 요양원에 들어갔다. 집에 혼자 남았다.
이런 상황이 올 거라고는 생각했는데, 이렇게 조용할 줄은 몰랐다.`,
        "family_structure:single": `혼자가 익숙하다고 생각했다. 그런데 이 조용함이 오늘따라 다르게 온다.
어딘가가 달라진 건지, 내가 달라진 건지 모르겠다.`,
        "family_structure:cohabiting": `파트너가 요즘 자주 집을 비운다. 이 조용함이 나쁘지 않다.
그게 다행인지 걱정인지 구분이 안 된다.`
      },

      actions: [
        {
          id: "sits_with_it",
          label: "이 조용함을 그냥 둔다",
          outcome: `저녁 내내 아무것도 안 했다. 티비도 켜지 않았다.
한 시간쯤 지나자 이 공간이 낯설지 않아졌다.`,
          sets: {}
        },
        {
          id: "fills_the_space",
          label: "뭔가로 채운다. 음악이든, 약속이든",
          outcome: `조용한 것이 불편했다. 뭔가를 틀었다.
편해졌다. 그 편함이 회피인지 적응인지는 모르겠지만.`,
          sets: {}
        },
        {
          id: "reorders_the_room",
          label: "방을 새로 정리한다. 내 방식대로",
          outcome: `가구 위치를 바꿨다. 예전부터 불편했던 것들을 치웠다.
바뀐 방이 낯설다. 동시에 내 것 같다.`,
          sets: {}
        }
      ]
    },

    // ── ME025: 전 팀의 연락 [requires: transferred_away] ──────────────────────
    {
      id: "ME025",
      arc: "arc7",
      title: "전 팀의 연락",
      type: "return_request_from_old_team",
      tags: ["책임", "경계", "동료"],
      requires: { transferred_away: true },
      excludes: {},
      weight: 1.2,
      summary: `이동한 지 여섯 달이 됐다. 전 팀에서 메시지가 왔다. 그때 같이 일했던 후배 정 사원이다.
'선배, 저희 지금 너무 힘들어요. 그 프로젝트 후속 건인데 선배가 맡던 부분이 아직 정리가 안 됐어요. 도와주실 수 있어요?'
새 팀 업무도 한창이다. 돌아보는 건 의무가 아니다.
하지만 그 팀이 힘든 건 당신이 빠진 것과 무관하지 않다.`,
      event_embedding: [0.48, 0.22, 0.18, 0.62, -0.08, 0.14, 0.28, 0.32],
      actions: [
        {
          id: "helps_after_hours",
          label: "퇴근 후에 따로 시간을 내 도와준다",
          embedding: [0.62, 0.14, 0.08, 0.74, -0.18, 0.22, 0.18, 0.28],
          bias: 0,
          outcome: "두 주 동안 저녁마다 통화했다. 전 팀은 고마워했다. 피로가 쌓였다.",
          endingWeight: { caregiver: 3, martyr: 1 },
          memory: "자정에 통화를 끊고 나서 새 팀 업무가 쌓여 있는 걸 봤다.",
          sets: {}
        },
        {
          id: "sets_boundary_kindly",
          label: "미안하지만 지금은 여력이 없다고 정중히 말한다",
          embedding: [0.18, -0.14, 0.22, 0.34, 0.28, 0.32, 0.38, 0.44],
          bias: -0.01,
          outcome: "후배는 '그렇구나요'라고 했다. 섭섭한 것 같았다. 어쩔 수 없다.",
          endingWeight: { survivor: 2, exile: 1, reformer: 1 },
          sets: {}
        },
        {
          id: "escalates_to_management",
          label: "인수인계 문제라며 관리자 선에서 해결하도록 넘긴다",
          embedding: [0.12, 0.08, 0.34, 0.22, 0.42, 0.44, 0.52, 0.38],
          bias: 0.01,
          outcome: "관리자가 처리했다. 후배에게는 직접 연락하지 않았다.",
          endingWeight: { conformist: 1, opportunist: 1, survivor: 2 },
          sets: {}
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC7_MIDLIFE;
} else {
  globalThis.ARC7_MIDLIFE = ARC7_MIDLIFE;
}
