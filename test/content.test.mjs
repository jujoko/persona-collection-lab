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

console.log("content.test.mjs: ok");
