const assert = require("assert");
const engine = require("../public/engine");

const characters = [
  {
    id: "C_TEST_1",
    generated_name: "엘리안",
    prompt: "전쟁 중 태어난 아이. 아버지는 엄격한 기사였고 어머니는 굶주린 이웃을 몰래 도왔다. 어린 시절에는 자주 버려질까 두려워했고, 커서는 왕국의 기사로 인정받고 싶어 한다. 겁이 많지만 친구를 버리지 못한다."
  },
  {
    id: "C_TEST_2",
    generated_name: "세라핀",
    prompt: "귀족 가문에서 태어난 아이. 부모는 아이를 사랑했지만 가문의 명예와 성취를 더 중시했다. 어릴 때부터 마법과 정치 교육을 받았고, 인정받지 못하면 버려질 수 있다는 압박을 느꼈다. 커서는 금지된 힘으로 전쟁을 끝내고 싶어 한다."
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
