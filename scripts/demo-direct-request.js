import { createTicketApplication } from "../server/app.js";

const application = createTicketApplication({
  databasePath: ":memory:",
  seed: false,
  logger: { error() {} }
});

await new Promise((resolve) => {
  application.server.listen(0, "127.0.0.1", resolve);
});

const address = application.server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const before = await ticketCount();
  const response = await fetch(`${baseUrl}/api/tickets`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({
      title: "Ticket diretto",
      customer: "Gamma S.p.A.",
      priority: "normale",
      sourceChannel: "email",
      description: "Il body e' JSON, ma il media type dichiara testo."
    })
  });
  const payload = await response.json();
  const after = await ticketCount();

  console.log(`Status osservato: ${response.status}`);
  console.log(`Body osservato: ${JSON.stringify(payload)}`);
  console.log(`Delta database: ${after - before >= 0 ? "+" : ""}${after - before}`);
  console.log("Atteso dal contratto L20: 415 / UNSUPPORTED_MEDIA_TYPE / +0");
} finally {
  await application.close();
}

async function ticketCount() {
  const response = await fetch(`${baseUrl}/api/tickets`);
  const payload = await response.json();
  return payload.tickets.length;
}
