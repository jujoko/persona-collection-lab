import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = ["public/index.html", "public/app.js"];
const forbiddenLegacyTerms = ["몰락 직전의 왕국", "엄격한 기사", "귀족 가문", "마법과 정치", "반란군 지휘관"];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const term of forbiddenLegacyTerms) {
    assert.equal(content.includes(term), false, `${file} contains legacy term: ${term}`);
  }
}

const index = await readFile("public/index.html", "utf8");
const app = await readFile("public/app.js", "utf8");
assert.equal(index.includes("예측 캠페인"), true, "index.html should describe the prediction campaign");
assert.equal(app.includes("data-predict-character-id"), true, "app.js should render prediction choices");

console.log("content.test.mjs: ok");
