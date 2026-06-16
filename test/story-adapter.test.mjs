/**
 * story-adapter.test.mjs
 * Verifies the story adapter compatibility API and the dynamic stepper API.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const {
  createRun,
  buildRunEvents,
  applyActionFlags,
  defaultFlags,
  _resolveString
} = require("../content/adapter.js");
const arcs = require("../content/allArcs.js");

assert.equal(arcs.length, 9, "allArcs should expose the full story arc registry");

{
  const flags = defaultFlags();
  assert.equal(typeof flags, "object");
  assert.equal(flags.exam_score, null);
  assert.equal(flags.academic_effort, "medium");
}

{
  const events = buildRunEvents(arcs, { innateSeed: "test-seed-001" });
  assert.ok(Array.isArray(events), "buildRunEvents should return an array");
  assert.ok(events.length > 0, "buildRunEvents should produce events");

  for (const arc of arcs) {
    const count = events.filter(event => event.arc === arc.id).length;
    assert.ok(count <= arc.events_per_run, `${arc.id} exceeded events_per_run`);
  }
}

{
  const events = buildRunEvents(arcs, { innateSeed: "test-seed-002" });
  for (const event of events) {
    assert.equal(typeof event.id, "string", `${event.id}: id must be string`);
    assert.equal(typeof event.title, "string", `${event.id}: title must be string`);
    assert.equal(typeof event.summary, "string", `${event.id}: summary must be string`);
    assert.ok(event.summary.trim().length > 0, `${event.id}: summary must not be empty`);
    assert.ok(Array.isArray(event.actions), `${event.id}: actions must be array`);
    assert.ok(event.actions.length >= 2, `${event.id}: action count must be at least 2`);

    for (const action of event.actions) {
      assert.equal(typeof action.id, "string", `${event.id}.${action.id}: id required`);
      assert.equal(typeof action.label, "string", `${event.id}.${action.id}: label required`);
      assert.equal(typeof action.outcome, "string", `${event.id}.${action.id}: outcome required`);
      assert.ok(Array.isArray(action.embedding), `${event.id}.${action.id}: embedding must be array`);
      assert.equal(typeof action.sets, "object", `${event.id}.${action.id}: sets must be object`);
    }
  }
}

{
  const events = buildRunEvents(arcs, { innateSeed: "test-seed-003" });
  const orders = events.map(event => arcs.find(arc => arc.id === event.arc)?.order ?? 0);
  const sortedOrders = [...orders].sort((a, b) => a - b);
  assert.deepEqual(orders, sortedOrders, "events should preserve arc order");
}

{
  const seed = "deterministic-test";
  const events1 = buildRunEvents(arcs, { innateSeed: seed });
  const events2 = buildRunEvents(arcs, { innateSeed: seed });
  assert.equal(
    events1.map(event => event.id).join(","),
    events2.map(event => event.id).join(","),
    "same seed should produce same event sequence"
  );
}

{
  const results = new Set();
  for (let i = 0; i < 20; i++) {
    const events = buildRunEvents(arcs, { innateSeed: `seed-variant-${i}` });
    results.add(events.map(event => event.id).join(","));
  }
  assert.ok(results.size >= 2, `different seeds should vary event sampling (got ${results.size})`);
}

{
  const arc2 = arcs.find(arc => arc.id === "arc2");
  const eventsWithTop = buildRunEvents([arc2], {
    flags: { exam_score: "top" },
    innateSeed: "filter-test"
  });
  assert.equal(
    eventsWithTop.some(event => event.id === "E206"),
    false,
    "E206 should be filtered out for exam_score:top"
  );
}

{
  const summaryBase = "base summary";
  const variants = {
    "academic_effort:high": "studied hard",
    "academic_effort:low": "barely studied"
  };

  assert.equal(_resolveString(summaryBase, variants, { academic_effort: "high" }), "studied hard");
  assert.equal(_resolveString(summaryBase, variants, { academic_effort: "low" }), "barely studied");
  assert.equal(_resolveString(summaryBase, variants, { academic_effort: "medium" }), summaryBase);
  assert.equal(_resolveString(summaryBase, null, {}), summaryBase);
}

{
  const flags = defaultFlags();
  const action = { id: "sleep_early", sets: { exam_score: "good", academic_effort: "high" } };
  const newFlags = applyActionFlags(flags, action);

  assert.equal(newFlags.exam_score, "good");
  assert.equal(newFlags.academic_effort, "high");
  assert.equal(flags.exam_score, null, "applyActionFlags should not mutate original flags");
  assert.equal(flags.academic_effort, "medium", "applyActionFlags should not mutate original flags");
}

{
  const flags = defaultFlags();
  assert.deepEqual(applyActionFlags(flags, { id: "none", sets: {} }), flags);
  assert.deepEqual(applyActionFlags(flags, null), flags);
}

{
  const run = createRun(arcs, { innateSeed: "stepper-full-run" });
  const seen = [];
  let event = run.nextEvent();
  while (event) {
    seen.push(event);
    run.applyAction(event.actions[0]);
    event = run.nextEvent();
  }

  assert.ok(seen.length > 0, "createRun should produce events");
  assert.ok(seen.length <= arcs.reduce((sum, arc) => sum + arc.events_per_run, 0));
  assert.equal(new Set(seen.map(item => item.id)).size, seen.length, "stepper should not repeat events");

  for (const event of seen) {
    assert.ok(Array.isArray(event.event_embedding), `${event.id}: event_embedding must be array`);
    for (const action of event.actions) {
      assert.ok(Array.isArray(action.embedding), `${event.id}.${action.id}: embedding must be array`);
    }
  }
}

{
  const dynamicArcs = [
    {
      id: "test0",
      title: "Test 0",
      order: 0,
      events_per_run: 1,
      events: [{
        id: "T001",
        arc: "test0",
        title: "Gate opener",
        type: "choice",
        tags: ["test"],
        weight: 1,
        summary: "Open the gate.",
        actions: [
          { id: "open", label: "Open", outcome: "Gate opens.", sets: { gate: "open" } },
          { id: "wait", label: "Wait", outcome: "Gate stays shut.", sets: { gate: "closed" } }
        ]
      }]
    },
    {
      id: "test1",
      title: "Test 1",
      order: 1,
      events_per_run: 1,
      events: [{
        id: "T002",
        arc: "test1",
        title: "Only after gate",
        type: "choice",
        tags: ["test"],
        weight: 1,
        requires: { gate: "open" },
        summary: "The opened route appears.",
        actions: [
          { id: "enter", label: "Enter", outcome: "You enter.", sets: {} },
          { id: "leave", label: "Leave", outcome: "You leave.", sets: {} }
        ]
      }]
    }
  ];

  const run = createRun(dynamicArcs, { innateSeed: "dynamic-flag-route" });
  const first = run.nextEvent();
  assert.equal(first.id, "T001");
  run.applyAction(first.actions.find(action => action.id === "open"));
  const second = run.nextEvent();
  assert.equal(second.id, "T002", "actions should affect later event eligibility");
  assert.equal(run.getFlags().gate, "open");
}

console.log("story-adapter.test.mjs: ok");
