const STORY_ARCS = (() => {
  const loadNodeArcs = () => [
    require("./arc0_elementary.js"),
    require("./arc1_middle.js"),
    require("./arc2_highschool.js"),
    require("./arc2_5_repeat.js"),
    require("./arc3_university.js"),
    require("./arc4_job_hunt.js"),
    require("./arc5_early_career.js"),
    require("./arc6_thirties.js"),
    require("./arc7_midlife.js")
  ];

  const loadBrowserArcs = () => [
    globalThis.ARC0_ELEMENTARY,
    globalThis.ARC1_MIDDLE,
    globalThis.ARC2_HIGHSCHOOL,
    globalThis.ARC2_5_REPEAT,
    globalThis.ARC3_UNIVERSITY,
    globalThis.ARC4_JOB_HUNT,
    globalThis.ARC5_EARLY_CAREER,
    globalThis.ARC6_THIRTIES,
    globalThis.ARC7_MIDLIFE
  ].filter(Boolean);

  const arcs = (typeof require === "function") ? loadNodeArcs() : loadBrowserArcs();
  return arcs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = STORY_ARCS;
} else {
  globalThis.STORY_ARCS = STORY_ARCS;
}
