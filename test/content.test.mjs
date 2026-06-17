import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = ["public/index.html", "public/app.js"];
const forbiddenLegacyTerms = ["마법", "왕국", "기사", "마법사", "반란군"];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const term of forbiddenLegacyTerms) {
    assert.equal(content.includes(term), false, `${file} contains legacy term: ${term}`);
  }
}

const index = await readFile("public/index.html", "utf8");
const app = await readFile("public/app.js", "utf8");

assert.equal(index.includes("페르소나 궤적"), true, "index.html should show the game title");
assert.equal(index.includes("캐릭터 생성"), true, "index.html should show the character creation action");
assert.equal(app.includes("data-predict-character-id"), true, "app.js should render prediction choices");
assert.equal(app.includes("persona-brief-card"), true, "app.js should render the persona briefing card");
assert.equal(app.includes("prediction_hints"), true, "app.js should prepare prediction hints before choices");
assert.equal(app.includes("choice-tags"), true, "app.js should render choice-level reasoning tags");
assert.equal(app.includes("choice-probability"), false, "app.js should not reveal raw choice probabilities");
assert.equal(app.includes("visible_action_ids"), true, "app.js should render only surfaced choices");
assert.equal(app.includes("route_probability"), true, "app.js should track route probability");

console.log("content.test.mjs: ok");
