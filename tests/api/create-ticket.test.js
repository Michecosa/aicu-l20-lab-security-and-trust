import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTicket,
  postTicket,
  startTestApplication
} from "../helpers/ticket-api.js";

test("POST /api/tickets calculates, persists and returns urgencyLabel", async (t) => {
  const baseUrl = await startTestApplication(t);
  const response = await postTicket(
    baseUrl,
    buildTicket({ priority: "alta", sourceChannel: "telefono" })
  );

  assert.equal(response.status, 201);

  const payload = await response.json();
  assert.equal(payload.ticket.urgencyLabel, "intervento rapido");

  const listResponse = await fetch(`${baseUrl}/api/tickets`);
  const listPayload = await listResponse.json();
  assert.equal(listPayload.tickets[0].urgencyLabel, "intervento rapido");
});

test("POST /api/tickets rejects whatsapp with VALIDATION_ERROR", async (t) => {
  const baseUrl = await startTestApplication(t);
  const response = await postTicket(
    baseUrl,
    buildTicket({ sourceChannel: "whatsapp" })
  );

  assert.equal(response.status, 400);

  const payload = await response.json();
  assert.equal(payload.code, "VALIDATION_ERROR");
  assert.equal(
    payload.fieldErrors.sourceChannel,
    "Canale di richiesta non valido."
  );

  const listResponse = await fetch(`${baseUrl}/api/tickets`);
  const listPayload = await listResponse.json();
  assert.equal(listPayload.tickets.length, 0);
});
