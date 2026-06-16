/**
 * 전역 플래그 정의
 * STORY_SPEC.md 섹션 2-1 참고
 *
 * 게임에서 직접 로드하지 않음 — content.js 병합 시 참조용
 */

const FLAG_DEFINITIONS = {
  childhood_pattern: {
    values: ["protective", "curious", "conformist", "resilient"],
    set_in: "arc0",
    description: "초등학교 시절 형성된 기본 반응 패턴"
  },
  first_interest: {
    values: ["stem", "humanities", "arts", "sports", "none"],
    set_in: "arc0~1",
    description: "어릴 때 발견한 첫 번째 관심 영역"
  },
  academic_effort: {
    values: ["high", "medium", "low"],
    set_in: "arc1~2",
    description: "학업에 투자한 노력의 정도"
  },
  social_role: {
    values: ["leader", "loner", "follower", "outsider"],
    set_in: "arc1~2",
    description: "또래 집단 내 역할"
  },
  exam_score: {
    values: ["top", "good", "average", "fail"],
    set_in: "arc2",
    description: "수능 결과. arc3 이후 대학/취업 선택지 폭을 결정",
    downstream: ["university_tier", "major", "E3xx 이벤트 분기"]
  },
  major: {
    values: ["medicine", "law", "stem", "business", "humanities", "arts", "gap_year"],
    set_in: "arc2~3",
    description: "전공 방향. arc4~5 커리어 이벤트를 결정"
  },
  university_tier: {
    values: ["top", "mid", "low", "none"],
    set_in: "arc3",
    description: "대학 수준. arc4 취업 이벤트 선택지 폭에 영향"
  },
  relationship_history: {
    values: ["committed", "casual", "none", "broken"],
    set_in: "arc2~4",
    description: "연애 경험과 현재 관계 상태"
  },
  financial_status: {
    values: ["wealthy", "stable", "struggling", "debt"],
    set_in: "arc3~6",
    description: "재정 상태. 선택 가능한 옵션 범위에 영향"
  },
  career_start: {
    values: ["major_corp", "startup", "public", "freelance", "delayed"],
    set_in: "arc4",
    description: "첫 직장 유형. arc5 이벤트 톤과 갈등 유형 결정"
  },
  reputation: {
    values: ["high", "medium", "low", "tainted"],
    set_in: "arc5~6",
    description: "사회/업계 내 평판. arc6~7 기회 이벤트 접근 조건"
  },
  family_structure: {
    values: ["married", "single", "divorced", "cohabiting"],
    set_in: "arc6",
    description: "30대 가족 구성 상태"
  },
  health: {
    values: ["good", "warning", "chronic"],
    set_in: "arc6~7",
    description: "건강 상태. arc7 이벤트 심각도 조정"
  }
};

/**
 * 플래그 초기 기본값
 * 캐릭터 생성 시 이 값으로 시작
 */
const FLAG_DEFAULTS = {
  childhood_pattern: null,
  first_interest: "none",
  academic_effort: "medium",
  social_role: "follower",
  exam_score: null,
  major: null,
  university_tier: null,
  relationship_history: "none",
  financial_status: "stable",
  career_start: null,
  reputation: "medium",
  family_structure: "single",
  health: "good"
};

/**
 * 플래그 조건 매칭 유틸
 * event.requires / event.excludes 평가용
 *
 * @param {object} flags - 현재 캐릭터 플래그 상태
 * @param {object} requires - { flagKey: value | value[] }
 * @param {object} excludes - { flagKey: value | value[] }
 * @returns {boolean}
 */
function matchesFlags(flags, requires = {}, excludes = {}) {
  for (const [key, required] of Object.entries(requires)) {
    const current = flags[key];
    const allowed = Array.isArray(required) ? required : [required];
    if (!allowed.includes(current)) return false;
  }
  for (const [key, excluded] of Object.entries(excludes)) {
    const current = flags[key];
    const blocked = Array.isArray(excluded) ? excluded : [excluded];
    if (blocked.includes(current)) return false;
  }
  return true;
}

module.exports = {
  FLAG_DEFINITIONS,
  FLAG_DEFAULTS,
  matchesFlags
};
