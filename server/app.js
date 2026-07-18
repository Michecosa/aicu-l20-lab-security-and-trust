import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { computeUrgencyLabel } from "./ticket-rules.js";
import { normalizeTicketInput, validateTicketInput } from "./validation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = resolve(__dirname, "..");
const defaultDataDir = join(defaultRootDir, "data");

export function createTicketApplication({
  databasePath = join(defaultDataDir, "tickets.sqlite"),
  rootDir = defaultRootDir,
  seed = true,
  now = () => new Date(),
  idFactory = () => `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
  requestIdFactory = () => `req-${Math.floor(100000 + Math.random() * 900000)}`,
  logger = console
} = {}) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      customer TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL,
      source_channel TEXT NOT NULL,
      urgency_label TEXT,
      status TEXT NOT NULL DEFAULT 'aperto',
      created_at TEXT NOT NULL
    );
  `);

  if (seed) {
    seedTickets(database, now);
  }

  backfillUrgencyLabels(database);

  function listTickets() {
    return database
      .prepare(
        `
          SELECT
            id,
            title,
            customer,
            description,
            priority,
            source_channel AS sourceChannel,
            urgency_label AS urgencyLabel,
            status,
            created_at AS createdAt
          FROM tickets
          ORDER BY created_at DESC
        `
      )
      .all();
  }

  function createTicket(input) {
    const id = idFactory();
    const createdAt = now().toISOString();
    const urgencyLabel = computeUrgencyLabel(
      input.priority,
      input.sourceChannel
    );

    database.prepare(
      `
        INSERT INTO tickets (
          id,
          title,
          customer,
          description,
          priority,
          source_channel,
          urgency_label,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      id,
      input.title,
      input.customer,
      input.description,
      input.priority,
      input.sourceChannel,
      urgencyLabel,
      "aperto",
      createdAt
    );

    return database
      .prepare(
        `
          SELECT
            id,
            title,
            customer,
            description,
            priority,
            source_channel AS sourceChannel,
            urgency_label AS urgencyLabel,
            status,
            created_at AS createdAt
          FROM tickets
          WHERE id = ?
        `
      )
      .get(id);
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestId = requestIdFactory();
    let operation = "serve_static";

    try {
      if (request.method === "GET" && url.pathname === "/api/tickets") {
        operation = "list_tickets";
        sendJson(response, 200, { tickets: listTickets() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/tickets") {
        operation = "create_ticket";
        const body = await readJsonBody(request);
        const input = normalizeTicketInput(body);
        const fieldErrors = validateTicketInput(input);

        if (Object.keys(fieldErrors).length > 0) {
          sendJson(response, 400, {
            code: "VALIDATION_ERROR",
            message: "Controlla i campi del ticket.",
            fieldErrors
          });
          return;
        }

        sendJson(response, 201, { ticket: createTicket(input) });
        return;
      }

      serveStatic(request, response, rootDir);
    } catch (error) {
      if (error instanceof InvalidJsonError) {
        sendJson(response, 400, {
          code: "INVALID_JSON",
          message: "Il body della richiesta non e' JSON valido."
        });
        return;
      }

      logger.error({
        operation,
        errorCode: operation === "create_ticket" ? "DB_WRITE_FAILED" : "UNEXPECTED_ERROR",
        requestId
      });
      sendJson(response, 500, {
        code: "INTERNAL_ERROR",
        message: "Errore interno del server."
      });
    }
  });

  return {
    database,
    server,
    async close() {
      if (server.listening) {
        await new Promise((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) {
              rejectClose(error);
              return;
            }

            resolveClose();
          });
        });
      }

      database.close();
    }
  };
}

function seedTickets(database, now) {
  const count = database.prepare("SELECT COUNT(*) AS count FROM tickets").get().count;

  if (count > 0) {
    return;
  }

  const insert = database.prepare(`
    INSERT INTO tickets (
      id,
      title,
      customer,
      description,
      priority,
      source_channel,
      urgency_label,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const createdAt = now().toISOString();

  for (const ticket of [
    {
      id: "TCK-10482",
      title: "Impossibile accedere al portale clienti",
      customer: "Alfa S.r.l.",
      description: "Errore login su account amministrativo.",
      priority: "alta",
      sourceChannel: "email",
      status: "aperto"
    },
    {
      id: "TCK-10481",
      title: "Errore 500 durante il caricamento",
      customer: "Beta Consulting",
      description: "Errore intermittente nella pagina fatture.",
      priority: "normale",
      sourceChannel: "chat",
      status: "in lavorazione"
    }
  ]) {
    insert.run(
      ticket.id,
      ticket.title,
      ticket.customer,
      ticket.description,
      ticket.priority,
      ticket.sourceChannel,
      computeUrgencyLabel(ticket.priority, ticket.sourceChannel),
      ticket.status,
      createdAt
    );
  }
}

function backfillUrgencyLabels(database) {
  const tickets = database
    .prepare(
      `
        SELECT id, priority, source_channel AS sourceChannel
        FROM tickets
        WHERE urgency_label IS NULL
      `
    )
    .all();
  const update = database.prepare(
    "UPDATE tickets SET urgency_label = ? WHERE id = ?"
  );

  for (const ticket of tickets) {
    const urgencyLabel = computeUrgencyLabel(
      ticket.priority,
      ticket.sourceChannel
    );

    if (urgencyLabel) {
      update.run(urgencyLabel, ticket.id);
    }
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

class InvalidJsonError extends Error {}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new InvalidJsonError("Il body della richiesta non e' JSON valido.");
  }
}

function serveStatic(request, response, rootDir) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = resolve(rootDir, `.${requestedPath}`);
  const relativePath = relative(rootDir, filePath);

  if (
    relativePath.startsWith("..") ||
    isAbsolute(relativePath) ||
    !existsSync(filePath)
  ) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  };

  response.writeHead(200, {
    "content-type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  response.end(readFileSync(filePath));
}
