/**
 * Arc 2.5 · 재수 (E25x)
 * 나이: 19세
 * 핵심 플래그 생성: exam_score (재설정), university_tier (초기화)
 * 핵심 플래그 소비: exam_score (average / fail 진입 조건)
 *
 * 톤: 조용하고 고립된 시간. 같은 또래가 대학에 간 사이 혼자 남겨진 느낌.
 *     포기하고 싶은 충동과 다시 해보려는 의지 사이.
 *
 * 진입 조건: exam_score가 average 또는 fail인 경우에만 이벤트 등장.
 * 모든 이벤트에 requires: { exam_score: ["average", "fail"] } 부여.
 * events_per_run: 4 (풀 전부 노출 — 미니아크이므로)
 */

const ARC2_5_REPEAT = {
  id: "arc2_5",
  order: 2.5,
  title: "재수",
  subtitle: "다시 한 번, 혼자",
  age_range: "19세",
  chapter_card: "친구들이 대학 단톡방을 만들었다. 당신은 아직 거기 없다. 3월이 왔지만 교복이 아닌 사복 차림으로 학원 앞에 서 있다.",
  events_per_run: 4,

  events: [

    // ── E251: 재수 생활 설계 (방향 선택) ───────────────────────────────────────
    {
      id: "E251",
      arc: "arc2_5",
      title: "어떻게 할 거야",
      type: "direction_choice",
      tags: ["재수", "선택", "계획"],
      requires: { exam_score: ["average", "fail"] },
      excludes: {},
      weight: 1.2,

      summary: `수능 성적표를 받은 지 두 달이 지났다.
친구들은 하나둘 입학 준비를 하고, 당신은 결정을 해야 했다.
재수를 하기로 했다. 문제는 어떻게 할 것이냐다.
종로 학원가 앞에서 팸플릿을 손에 쥐고 선다.`,

      summary_variants: {
        "exam_score:fail": `수능 점수가 생각보다 훨씬 낮았다.
원하는 학교는커녕 갈 수 있는 곳을 찾는 것도 쉽지 않았다.
재수 외에는 선택지가 없다는 느낌이다.
학원가 앞에서 팸플릿을 손에 쥐고 선다.`
      },

      actions: [
        {
          id: "intensive_hagwon",
          label: "종합반 학원에 등록한다. 구조가 있어야 버틴다",
          outcome: `오전 8시 등원, 오후 11시 귀가. 하루가 정해진 대로 돌아간다.
자유가 없는 대신 생각할 틈이 없다. 이게 맞는지 모르겠지만 일단 간다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "self_study",
          label: "독학으로 한다. 내 방식대로",
          outcome: `학원비를 아꼈다. 대신 하루를 내가 설계해야 한다.
첫 주는 잘 됐다. 두 번째 주부터 흔들리기 시작한다.`,
          sets: { academic_effort: "medium" }
        },
        {
          id: "part_time_and_study",
          label: "알바를 병행하면서 준비한다",
          outcome: `돈도 벌고 공부도 한다는 계획이었다.
하루가 빠듯하다. 어느 쪽도 제대로 못 하는 느낌이 들기 시작한다.`,
          sets: { academic_effort: "medium", financial_status: "stable" }
        }
      ]
    },

    // ── E252: 고시원 vs 통학 (우선순위 선택) ────────────────────────────────────
    {
      id: "E252",
      arc: "arc2_5",
      title: "어디서 지낼 것인가",
      type: "priority_choice",
      tags: ["고시원", "독립", "가족"],
      requires: { exam_score: ["average", "fail"] },
      excludes: {},
      weight: 1.0,

      summary: `학원은 학교 근처보다 강남 쪽이 낫다는 말을 들었다.
집에서 다니려면 왕복 두 시간이 걸린다.
고시원을 구하면 더 집중할 수 있겠지만, 한 달에 40만 원이 든다.
부모님이 결정을 당신에게 맡겼다.`,

      actions: [
        {
          id: "move_out",
          label: "고시원을 얻는다. 집중하려면 거리가 필요하다",
          outcome: `4평짜리 방. 창문이 작고 냄새가 약간 난다.
하지만 밤 11시에도 책상 앞에 앉아있을 수 있다.
외롭지만, 이 외로움이 공부가 된다고 생각하기로 한다.`,
          sets: { financial_status: "struggling" }
        },
        {
          id: "commute",
          label: "집에서 다닌다. 어차피 1년이다",
          outcome: `왕복 두 시간이 피곤하지만, 엄마 밥을 먹을 수 있다.
가족 눈치가 보이는 날도 있다. 하지만 혼자보다는 낫다.`,
          sets: {}
        }
      ]
    },

    // ── E253: 8월의 슬럼프 (위기 대응) ──────────────────────────────────────────
    {
      id: "E253",
      arc: "arc2_5",
      title: "8월의 벽",
      type: "crisis_response",
      tags: ["슬럼프", "포기", "의지"],
      requires: { exam_score: ["average", "fail"] },
      excludes: {},
      weight: 1.3,

      summary: `8월이다. 재수를 시작한 지 다섯 달째.
처음 세 달은 성적이 올랐다. 그런데 지난 두 달은 제자리다.
친구가 대학 축제 사진을 올렸다. 오늘 모의고사에서 실수를 했다.
오늘은 학원 자습실 책상 앞에 앉아서 문제지를 보고 있는데, 아무 생각이 없다.`,

      actions: [
        {
          id: "push_through",
          label: "그래도 오늘 분량을 끝낸다. 감정은 나중에",
          outcome: `결국 오늘 계획을 다 했다. 잠들기 전에 별 생각이 없다.
이게 맞는지 틀렸는지 모르지만, 하루를 버텼다.`,
          sets: { academic_effort: "high" }
        },
        {
          id: "take_a_break",
          label: "오늘은 쉬기로 한다. 억지로 앉아있어 봤자다",
          outcome: `집에 돌아와 유튜브를 몇 시간 봤다. 잘 쉬었는지 모르겠다.
다음날 아침엔 조금 가벼운 것 같기도 하다.`,
          sets: {}
        },
        {
          id: "call_someone",
          label: "대학 간 친구에게 전화한다",
          outcome: `친구가 한 시간 동안 들어줬다. 별 조언은 없었는데 그게 나았다.
전화를 끊고 나서 문제집을 다시 펼쳤다.`,
          sets: {}
        }
      ]
    },

    // ── E254: 수능 재응시 결과 (방향 선택) ──────────────────────────────────────
    {
      id: "E254",
      arc: "arc2_5",
      title: "두 번째 수능",
      type: "direction_choice",
      tags: ["수능", "결과", "대학"],
      requires: { exam_score: ["average", "fail"] },
      excludes: {},
      weight: 1.5,

      summary_variants: {
        "academic_effort:high": `시험장 안은 작년과 같은 냄새가 난다.
이번엔 달랐다. 문제를 보는 순간 손이 자동으로 움직였다.
점수가 나왔다. 작년보다 올랐다. 이제 어디를 쓸지 결정해야 한다.`,
        "academic_effort:medium": `시험장 안은 작년과 같다.
이번엔 어땠을까. 결과가 나왔다. 조금 올랐지만 목표엔 못 미쳤다.
이제 현실적인 선택을 해야 한다.`,
        "academic_effort:low": `시험장에 들어서는 발걸음이 무겁다.
결과가 나왔다. 작년과 비슷하거나 더 낮다.
이제 선택해야 한다.`
      },

      summary: `시험장 안은 작년과 같은 냄새가 난다.
1년을 버텼다. 결과가 나왔다.
이제 그 숫자로 무엇을 할지 결정해야 한다.`,

      actions: [
        {
          id: "aim_top_school",
          label: "성적에 맞는 최선의 학교를 선택한다",
          outcome: `원서를 썼다. 합격 통보가 왔다.
1년이 무의미하지 않았다는 걸 이제 안다.`,
          sets: { exam_score: "good", university_tier: "mid" }
        },
        {
          id: "take_what_i_can",
          label: "일단 붙을 수 있는 곳을 쓴다. 더 이상 기다리기 싫다",
          outcome: `합격했다. 원하던 곳은 아니지만, 이제 대학생이다.
뭔가 놓친 것 같기도 하고, 이제 됐다 싶기도 하다.`,
          sets: { exam_score: "average", university_tier: "low" }
        },
        {
          id: "try_again",
          label: "한 번 더 한다. 이 점수로는 안 된다",
          outcome: `삼수를 결심했다. 주변 반응은 엇갈린다.
당신은 아직 그 숫자에 납득하지 못했다.`,
          sets: { exam_score: "fail", university_tier: null }
        }
      ]
    }

  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARC2_5_REPEAT;
} else {
  globalThis.ARC2_5_REPEAT = ARC2_5_REPEAT;
}
