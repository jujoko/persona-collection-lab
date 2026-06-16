import engine from "../public/engine.js";

const PROMPTS = [
  "원칙적이고 책임감 강하지만 가족에게는 약한 사람",
  "사람들과 잘 어울리지만 위험 앞에서는 조용히 물러나는 사람",
  "새로운 방법을 좋아하고 권위에 쉽게 굴복하지 않는 사람",
  "주변을 돌보는 데 익숙하지만 인정받고 싶은 욕구도 큰 사람",
  "안정적인 삶을 원하지만 부당함을 보면 오래 참지 못하는 사람"
];

const SEEDS = Array.from({ length: 12 }, (_, index) => `bench-seed-${index + 1}`);

function distance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => {
    const delta = value - (b[index] || 0);
    return sum + delta * delta;
  }, 0));
}

function summarizeEvent(rows, eventId) {
  const eventRows = rows.filter(row => row.event_id === eventId);
  const counts = new Map();
  for (const row of eventRows) {
    counts.set(row.action, (counts.get(row.action) || 0) + 1);
  }
  const total = eventRows.length || 1;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const topShare = sorted[0] ? sorted[0][1] / total : 0;
  const avgShift = eventRows.reduce((sum, row) => sum + row.latent_shift, 0) / total;
  const avgProbability = eventRows.reduce((sum, row) => sum + row.action_probability, 0) / total;
  return {
    event_id: eventId,
    unique_actions: counts.size,
    top_action: sorted[0]?.[0] || null,
    top_share: Number(topShare.toFixed(3)),
    avg_action_probability: Number(avgProbability.toFixed(3)),
    avg_latent_shift: Number(avgShift.toFixed(3)),
    distribution: Object.fromEntries(sorted)
  };
}

function runBenchmark() {
  const rows = [];
  const routeSignatures = new Map();

  for (const prompt of PROMPTS) {
    for (const seed of SEEDS) {
      const character = {
        id: `bench-${engine.hashText ? engine.hashText(prompt + seed) : `${PROMPTS.indexOf(prompt)}-${seed}`}`,
        prompt,
        innate_seed: seed
      };
      const simulation = engine.simulate(character);
      const route = simulation.events.map(event => event.action).join("|");
      routeSignatures.set(route, (routeSignatures.get(route) || 0) + 1);
      for (const event of simulation.events) {
        rows.push({
          prompt,
          seed,
          event_id: event.event_id,
          action: event.action,
          action_probability: event.action_probability,
          latent_shift: distance(event.latent_before, event.latent_after),
          route_probability: event.route_probability,
          route_rarity: event.route_rarity
        });
      }
    }
  }

  const eventIds = engine.EVENTS.map(event => event.id);
  const eventSummary = eventIds.map(eventId => summarizeEvent(rows, eventId));
  const totalRuns = PROMPTS.length * SEEDS.length;
  const routeEntries = [...routeSignatures.entries()].sort((a, b) => b[1] - a[1]);
  const avgLatentShift = rows.reduce((sum, row) => sum + row.latent_shift, 0) / rows.length;
  const avgActionProbability = rows.reduce((sum, row) => sum + row.action_probability, 0) / rows.length;
  const collapsedEvents = eventSummary.filter(item => item.unique_actions <= 1 || item.top_share >= 0.85);

  return {
    prompts: PROMPTS.length,
    seeds_per_prompt: SEEDS.length,
    total_runs: totalRuns,
    total_decisions: rows.length,
    unique_routes: routeSignatures.size,
    most_common_route_count: routeEntries[0]?.[1] || 0,
    avg_action_probability: Number(avgActionProbability.toFixed(3)),
    avg_latent_shift: Number(avgLatentShift.toFixed(3)),
    collapsed_events: collapsedEvents.map(item => ({
      event_id: item.event_id,
      top_action: item.top_action,
      top_share: item.top_share,
      unique_actions: item.unique_actions
    })),
    event_summary: eventSummary
  };
}

const result = runBenchmark();

console.log("M2 dynamic latent benchmark");
console.log("==========================");
console.log(`prompts: ${result.prompts}`);
console.log(`seeds per prompt: ${result.seeds_per_prompt}`);
console.log(`total runs: ${result.total_runs}`);
console.log(`unique routes: ${result.unique_routes}`);
console.log(`most common route count: ${result.most_common_route_count}`);
console.log(`avg action probability: ${result.avg_action_probability}`);
console.log(`avg latent shift/event: ${result.avg_latent_shift}`);
console.log("");
console.table(result.event_summary.map(item => ({
  event: item.event_id,
  unique: item.unique_actions,
  top: item.top_action,
  top_share: item.top_share,
  avg_p: item.avg_action_probability,
  avg_shift: item.avg_latent_shift
})));

if (result.collapsed_events.length > 0) {
  console.log("");
  console.log("Collapsed or highly dominant events:");
  console.table(result.collapsed_events);
}

