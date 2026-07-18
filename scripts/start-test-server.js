import { createTicketApplication } from "../server/app.js";

const port = 4174;
const application = createTicketApplication({ databasePath: ":memory:" });

application.server.listen(port, "127.0.0.1", () => {
  console.log(`Playwright test server ready on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await application.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
