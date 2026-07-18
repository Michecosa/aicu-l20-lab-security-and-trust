import { createTicketApplication } from "./app.js";

const port = Number(process.env.PORT || 4173);
const application = createTicketApplication();

application.server.listen(port, "127.0.0.1", () => {
  console.log(`Ticketing quality app ready on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await application.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
