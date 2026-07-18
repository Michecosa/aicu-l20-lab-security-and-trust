import { createTicketApplication } from "../../server/app.js";

let nextId = 1;

export function buildTicket(overrides = {}) {
  return {
    title: "Errore fattura",
    customer: "Alfa S.r.l.",
    description: "Il PDF non si apre.",
    priority: "normale",
    sourceChannel: "email",
    ...overrides
  };
}

export function postTicket(baseUrl, ticket) {
  return fetch(`${baseUrl}/api/tickets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ticket)
  });
}

export async function startTestApplication(t, options = {}) {
  const application = createTicketApplication({
    databasePath: ":memory:",
    seed: false,
    idFactory: () => `TCK-TEST-${nextId++}`,
    ...options
  });

  await new Promise((resolve) => {
    application.server.listen(0, "127.0.0.1", resolve);
  });

  t.after(async () => {
    await application.close();
  });

  const address = application.server.address();
  return `http://127.0.0.1:${address.port}`;
}
