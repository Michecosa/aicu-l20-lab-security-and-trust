import { createTicketApplication } from "../server/app.js";

let ticketSequence = 0;
const application = createTicketApplication({
  databasePath: ":memory:",
  seed: false,
  idFactory: () => `TCK-L20-${++ticketSequence}`,
  logger: { error() {} }
});

await new Promise((resolve) => {
  application.server.listen(0, "127.0.0.1", resolve);
});

const address = application.server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const results = [];

try {
  await runCase("ticket valido", {
    expectedStatus: 201,
    expectedDelta: 1,
    request: jsonRequest(buildTicket())
  });

  await runCase("JSON malformato", {
    expectedStatus: 400,
    expectedCode: "INVALID_JSON",
    expectedDelta: 0,
    request: rawRequest("{\"title\":", "application/json")
  });

  await runCase("description con tipo errato", {
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedDelta: 0,
    request: jsonRequest(buildTicket({ description: ["non", "una", "stringa"] }))
  });

  await runCase("media type non supportato", {
    expectedStatus: 415,
    expectedCode: "UNSUPPORTED_MEDIA_TYPE",
    expectedDelta: 0,
    request: rawRequest(JSON.stringify(buildTicket()), "text/plain")
  });

  const htmlLikeDescription = "<strong>Cliente bloccato</strong>";
  await runCase("testo HTML-like valido", {
    expectedStatus: 201,
    expectedDelta: 1,
    expectedDescription: htmlLikeDescription,
    request: jsonRequest(buildTicket({ description: htmlLikeDescription }))
  });

  await runCase("valore fuori allowlist", {
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedDelta: 0,
    request: jsonRequest(buildTicket({ sourceChannel: "whatsapp" }))
  });
} finally {
  await application.close();
}

console.log("\nL20 request-boundary matrix\n");
for (const result of results) {
  const observed = `${result.actualStatus}/${result.actualDelta >= 0 ? "+" : ""}${result.actualDelta}`;
  const expected = `${result.expectedStatus}/${result.expectedDelta >= 0 ? "+" : ""}${result.expectedDelta}`;
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}`);
  console.log(`      atteso ${expected} | osservato ${observed}`);
  if (result.reason) {
    console.log(`      ${result.reason}`);
  }
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  console.error(`\n${failures.length} caso/i core ancora rossi.`);
  process.exitCode = 1;
} else {
  console.log("\nMatrice core verde: contratto e persistenza sono coerenti.");
}

async function runCase(name, expectations) {
  const before = await ticketCount();
  const response = await fetch(`${baseUrl}/api/tickets`, expectations.request);
  const payload = await readPayload(response);
  const after = await ticketCount();
  const actualDelta = after - before;
  const checks = [
    response.status === expectations.expectedStatus,
    actualDelta === expectations.expectedDelta
  ];

  if (expectations.expectedCode) {
    checks.push(payload.code === expectations.expectedCode);
  }

  if (expectations.expectedDescription) {
    checks.push(payload.ticket?.description === expectations.expectedDescription);
  }

  const reasons = [];
  if (response.status !== expectations.expectedStatus) {
    reasons.push(`status ${response.status}`);
  }
  if (actualDelta !== expectations.expectedDelta) {
    reasons.push(`delta database ${actualDelta}`);
  }
  if (expectations.expectedCode && payload.code !== expectations.expectedCode) {
    reasons.push(`code ${payload.code ?? "assente"}`);
  }
  if (
    expectations.expectedDescription &&
    payload.ticket?.description !== expectations.expectedDescription
  ) {
    reasons.push("testo valido non preservato");
  }

  results.push({
    name,
    ok: checks.every(Boolean),
    actualStatus: response.status,
    actualDelta,
    expectedStatus: expectations.expectedStatus,
    expectedDelta: expectations.expectedDelta,
    reason: reasons.join(", ")
  });
}

async function ticketCount() {
  const response = await fetch(`${baseUrl}/api/tickets`);
  const payload = await response.json();
  return payload.tickets.length;
}

async function readPayload(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function jsonRequest(body) {
  return rawRequest(JSON.stringify(body), "application/json");
}

function rawRequest(body, contentType) {
  return {
    method: "POST",
    headers: { "content-type": contentType },
    body
  };
}

function buildTicket(overrides = {}) {
  return {
    title: "Ticket di prova",
    customer: "Demo locale",
    description: "Richiesta valida.",
    priority: "normale",
    sourceChannel: "email",
    ...overrides
  };
}
