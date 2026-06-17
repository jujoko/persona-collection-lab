import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const {
  FLAG_DEFINITIONS,
  FLAG_DEFAULTS,
  matchesFlags
} = require("../content/flags.js");

const arcs = require("../content/allArcs.js");

const KNOWN_TYPES = new Set([
  "home",
  "school",
  "friend",
  "exam",
  "romance",
  "conflict",
  "failure",
  "choice",
  "chance",
  "recovery",
  "identity_choice",
  "direction_choice",
  "moral_dilemma",
  "priority_choice",
  "crisis_response",
  "opportunity_choice",
  "relationship_choice",
  "risk_choice",
  "algorithmic_bias",
  "anonymous_whistleblowing",
  "authority_vs_conscience",
  "betrayal_from_inside",
  "care_burnout",
  "colleague_mistake_dilemma",
  "consequence_of_silence",
  "evidence_decision",
  "family_favor_request",
  "family_inheritance_dispute",
  "family_loyalty_dilemma",
  "final_compromise",
  "forbidden_means",
  "friendship_vs_integrity",
  "generational_workplace_conflict",
  "internal_transfer_decision",
  "journalist_contact",
  "petition_under_pressure",
  "public_shaming",
  "retaliation_after_testimony",
  "return_request_from_old_team",
  "scarcity_allocation",
  "startup_offer_with_known_risk",
  "unexpected_vindication",
  "whistleblowing_dilemma",
  "workplace_harassment_witness"
]);

const flagDefinitions = new Map(Object.entries(FLAG_DEFINITIONS));

function assertKnownFlag(key, context) {
  assert.ok(flagDefinitions.has(key), `${context}: unknown flag "${key}"`);
}

function assertAllowedFlagValue(key, value, context) {
  assertKnownFlag(key, context);
  if (value === null) return;
  const definition = flagDefinitions.get(key);
  assert.ok(
    definition.values.includes(value),
    `${context}: invalid ${key} value "${value}"`
  );
}

function assertConditionMap(conditions, context) {
  if (conditions == null) return;
  assert.equal(typeof conditions, "object", `${context}: condition must be object`);
  assert.ok(!Array.isArray(conditions), `${context}: condition must not be array`);

  for (const [key, expected] of Object.entries(conditions)) {
    const values = Array.isArray(expected) ? expected : [expected];
    assert.ok(values.length > 0, `${context}.${key}: condition must not be empty`);
    for (const value of values) {
      assertAllowedFlagValue(key, value, context);
    }
  }
}

function assertSetMap(sets, context) {
  if (sets == null) return;
  assert.equal(typeof sets, "object", `${context}: sets must be object`);
  assert.ok(!Array.isArray(sets), `${context}: sets must not be array`);

  for (const [key, value] of Object.entries(sets)) {
    assertAllowedFlagValue(key, value, context);
  }
}

function assertSummaryVariants(summaryVariants, context) {
  if (summaryVariants == null) return;
  assert.equal(typeof summaryVariants, "object", `${context}: must be object`);
  assert.ok(!Array.isArray(summaryVariants), `${context}: must not be array`);

  for (const key of Object.keys(summaryVariants)) {
    const [flagKey, flagValue] = key.split(":");
    assert.ok(flagKey && flagValue, `${context}: key "${key}" must be flag:value`);
    assertAllowedFlagValue(flagKey, flagValue, context);
  }
}

function assertText(value, context) {
  assert.equal(typeof value, "string", `${context}: must be string`);
  assert.ok(value.trim().length > 0, `${context}: must not be empty`);
}

for (const [key, definition] of Object.entries(FLAG_DEFINITIONS)) {
  assertText(key, "flag.key");
  assert.ok(Array.isArray(definition.values), `${key}: values must be array`);
  assert.ok(definition.values.length > 0, `${key}: values must not be empty`);
}

for (const [key, value] of Object.entries(FLAG_DEFAULTS)) {
  assertAllowedFlagValue(key, value, `FLAG_DEFAULTS.${key}`);
}

assert.equal(
  matchesFlags({ ...FLAG_DEFAULTS, social_role: "leader" }, { social_role: "leader" }),
  true
);
assert.equal(
  matchesFlags({ ...FLAG_DEFAULTS, social_role: "leader" }, {}, { social_role: "leader" }),
  false
);

const eventIds = new Set();

for (const arc of arcs) {
  assertText(arc.id, "arc.id");
  assertText(arc.title, `${arc.id}.title`);
  assert.equal(typeof arc.order, "number", `${arc.id}.order must be number`);
  assert.ok(Number.isFinite(arc.order), `${arc.id}.order must be finite`);
  assert.equal(
    Number.isInteger(arc.events_per_run),
    true,
    `${arc.id}.events_per_run must be integer`
  );
  assert.ok(arc.events_per_run > 0, `${arc.id}.events_per_run must be positive`);
  assert.ok(Array.isArray(arc.events), `${arc.id}.events must be array`);
  assert.ok(arc.events.length >= arc.events_per_run, `${arc.id}: not enough events`);

  for (const event of arc.events) {
    const eventContext = `${arc.id}.${event.id}`;
    assertText(event.id, `${eventContext}.id`);
    assert.ok(!eventIds.has(event.id), `${eventContext}: duplicate event id`);
    eventIds.add(event.id);

    assert.equal(event.arc, arc.id, `${eventContext}: arc mismatch`);
    assertText(event.title, `${eventContext}.title`);
    assert.ok(KNOWN_TYPES.has(event.type), `${eventContext}: unknown type ${event.type}`);
    assert.ok(Array.isArray(event.tags), `${eventContext}.tags must be array`);
    assert.ok(event.tags.length > 0, `${eventContext}.tags must not be empty`);
    assert.ok(typeof event.weight === "number", `${eventContext}.weight must be number`);
    assert.ok(event.weight > 0, `${eventContext}.weight must be positive`);
    assertText(event.summary, `${eventContext}.summary`);

    assertConditionMap(event.requires, `${eventContext}.requires`);
    assertConditionMap(event.excludes, `${eventContext}.excludes`);
    assertSummaryVariants(event.summary_variants, `${eventContext}.summary_variants`);

    assert.ok(Array.isArray(event.actions), `${eventContext}.actions must be array`);
    assert.ok(
      event.actions.length >= 2 && event.actions.length <= 4,
      `${eventContext}: action count must be 2-4`
    );

    const actionIds = new Set();
    for (const action of event.actions) {
      const actionContext = `${eventContext}.${action.id}`;
      assertText(action.id, `${actionContext}.id`);
      assert.ok(!actionIds.has(action.id), `${actionContext}: duplicate action id`);
      actionIds.add(action.id);

      assertText(action.label, `${actionContext}.label`);
      assertText(action.outcome, `${actionContext}.outcome`);
      assertConditionMap(action.requires, `${actionContext}.requires`);
      assertConditionMap(action.excludes, `${actionContext}.excludes`);
      assertSetMap(action.sets, `${actionContext}.sets`);
    }
  }
}

console.log("story-content.test.mjs: ok");
