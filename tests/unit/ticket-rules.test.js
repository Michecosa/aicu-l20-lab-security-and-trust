import assert from "node:assert/strict";
import test from "node:test";

import { computeUrgencyLabel } from "../../server/ticket-rules.js";

const cases = [
  ["alta", "telefono", "intervento rapido"],
  ["alta", "chat", "prioritario"],
  ["alta", "email", "prioritario"],
  ["normale", "telefono", "da gestire"],
  ["normale", "chat", "da gestire"],
  ["normale", "email", "standard"],
  ["bassa", "telefono", "monitorare"],
  ["bassa", "chat", "monitorare"],
  ["bassa", "email", "monitorare"]
];

for (const [priority, sourceChannel, expected] of cases) {
  test(`${priority} + ${sourceChannel} -> ${expected}`, () => {
    assert.equal(computeUrgencyLabel(priority, sourceChannel), expected);
  });
}

test("returns null when the combination is outside the product rule", () => {
  assert.equal(computeUrgencyLabel("normale", "whatsapp"), null);
});
