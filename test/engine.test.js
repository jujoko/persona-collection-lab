const assert = require("assert");
const engine = require("../public/engine");

const characters = [
  {
    id: "C_TEST_1",
    generated_name: "민준",
    prompt: "서울 외곽의 형편이 어려운 가정에서 자랐다. 아버지는 성적과 규율에 엄격했고 어머니는 형편이 더 어려운 이웃을 자주 도왔다. 안정적인 직장을 원하지만 부당한 일을 보면 외면하지 못한다."
  },
  {
    id: "C_TEST_2",
    generated_name: "서연",
    prompt: "전문직 가정에서 자랐고 부모는 성취와 체면을 중시했다. 코딩과 토론을 잘하며 실패하면 인정받지 못할까 두려워한다. 기술 창업으로 사회 문제를 해결하고 싶지만 성공에 대한 집착도 강하다."
  }
];

for (const character of characters) {
  const schema = engine.getPersonaStructurePrior(character);
  const neuralModel = engine.createTrainableModel(schema, character.id);
  const simulation = engine.simulate(character, null, neuralModel);
  assert.strictEqual(simulation.model_pipeline.structure_model.id, "M3_latent_persona_schema_designer");
  assert.strictEqual(simulation.prompt_interpretation.model_id, "M1_prompt_to_persona_interpreter");
  assert.strictEqual(simulation.persona_structure_prior.model_id, "M3_latent_persona_schema_designer");
  assert.ok(simulation.persona_structure_prior.latent_dimension >= 8);
  assert.strictEqual(simulation.persona_structure_prior.latent_dimensions.length, simulation.persona_structure_prior.latent_dimension);
  assert.ok(simulation.prompt_interpretation.prompt_fragments.length > 0);
  assert.strictEqual(simulation.infant_latent_persona.length, simulation.persona_structure_prior.latent_dimension);
  assert.strictEqual(simulation.developmental_logs.length, 4);
  assert.strictEqual(simulation.events.length, 5);
  assert.ok(simulation.ending.id.startsWith("END_"));
  assert.strictEqual(simulation.latent_persona.length, simulation.persona_structure_prior.latent_dimension);
  assert.ok(simulation.latent_edges.length > 0);
  assert.notDeepStrictEqual(simulation.infant_latent_persona, simulation.latent_persona);
  for (const log of simulation.developmental_logs) {
    assert.ok(log.latent_before.length === simulation.persona_structure_prior.latent_dimension);
    assert.ok(log.latent_after.length === simulation.persona_structure_prior.latent_dimension);
    assert.ok(log.adaptation_label);
    assert.ok(log.prompt_evidence);
    assert.ok(log.rationale.includes(log.prompt_evidence));
  }
  for (const event of simulation.events) {
    assert.strictEqual(event.model_id, "M2_persona_to_prompt_interpreter");
    assert.ok(event.prompt_evidence);
    assert.ok(event.rationale.includes(event.prompt_evidence));
  }
  for (const value of simulation.latent_persona) {
    assert.ok(value >= -1 && value <= 1);
  }

  const firstEvent = simulation.events[0];
  const updated = engine.updateLatentWithFeedback(
    simulation.latent_persona,
    firstEvent.action_embedding,
    "consistent"
  );
  assert.strictEqual(updated.length, simulation.persona_structure_prior.latent_dimension);
  assert.notDeepStrictEqual(updated, simulation.latent_persona);

  const dynamicRun = engine.simulateWorldEvents(
    character,
    updated,
    simulation.persona_structure_prior,
    "test_rerun",
    neuralModel
  );
  assert.strictEqual(dynamicRun.events.length, 5);
  assert.strictEqual(dynamicRun.run_label, "test_rerun");
  assert.strictEqual(dynamicRun.latent_persona.length, simulation.persona_structure_prior.latent_dimension);
  assert.ok(dynamicRun.ending.id.startsWith("END_"));

  const trainResult = engine.trainDeepLearningModel(neuralModel, [{
    latent_before: simulation.latent_persona,
    action_embedding: firstEvent.action_embedding,
    feedback_signal: "consistent"
  }], { epochs: 4, learningRate: 0.02 });
  assert.strictEqual(trainResult.trained_examples, 1);
  assert.ok(trainResult.last_loss !== null);
  assert.ok(trainResult.model.trained_steps > 0);
}

const timidKnight = engine.simulate(characters[0]);
const coldMage = engine.simulate(characters[1]);
assert.notDeepStrictEqual(
  timidKnight.latent_persona,
  coldMage.latent_persona
);

console.log("engine.test.js: ok");
