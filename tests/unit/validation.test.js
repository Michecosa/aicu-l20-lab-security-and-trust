import assert from "node:assert/strict";
import test from "node:test";

import { validateTicketInput } from "../../server/validation.js";

test("accepts a complete ticket with a supported source channel", () => {
  assert.deepEqual(
    validateTicketInput({
      title: "Errore fattura",
      customer: "Alfa S.r.l.",
      description: "Il PDF non si apre.",
      priority: "alta",
      sourceChannel: "email"
    }),
    {}
  );
});

test("rejects whatsapp with a field-level sourceChannel error", () => {
  const fieldErrors = validateTicketInput({
    title: "Errore fattura",
    customer: "Alfa S.r.l.",
    description: "Il PDF non si apre.",
    priority: "alta",
    sourceChannel: "whatsapp"
  });

  assert.equal(fieldErrors.sourceChannel, "Canale di richiesta non valido.");
});
