const form = document.querySelector("#ticket-form");
const ticketTableBody = document.querySelector("#ticket-table-body");
const ticketCount = document.querySelector("#ticket-count");
const formStatus = document.querySelector("#form-status");
const emptyPanel = document.querySelector("#empty-panel");
const payloadPreview = document.querySelector("#payload-preview");
const responsePreview = document.querySelector("#response-preview");
const reloadButton = document.querySelector("#reload-button");
const serverFieldPreview = document.querySelector("#server-field-preview");
const ticketDetails = document.querySelector("#ticket-details");
const ticketDetailsTitle = document.querySelector("#ticket-details-title");
const ticketDetailsCustomer = document.querySelector("#ticket-details-customer");
const ticketDetailsBody = document.querySelector("#ticket-details-body");
const closeDetailsButton = document.querySelector("#close-details");

let ticketsById = new Map();

function getFormPayload() {
  const data = new FormData(form);

  return {
    title: String(data.get("title") || "").trim(),
    customer: String(data.get("customer") || "").trim(),
    description: String(data.get("description") || "").trim(),
    priority: String(data.get("priority") || ""),
    sourceChannel: String(data.get("sourceChannel") || "")
  };
}

function updatePayloadPreview() {
  payloadPreview.textContent = JSON.stringify(getFormPayload(), null, 2);
  serverFieldPreview.textContent = "urgencyLabel: da calcolare";
}

function setStatus(message, type = "neutral") {
  formStatus.textContent = message;
  formStatus.dataset.type = type;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderTickets(tickets) {
  ticketCount.textContent = String(tickets.length);
  emptyPanel.hidden = tickets.length !== 0;
  ticketsById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  ticketTableBody.replaceChildren();

  for (const ticket of tickets) {
    const row = document.createElement("tr");
    row.append(
      createTextCell(`#${ticket.id}`, "ticket-id"),
      createTextCell(ticket.title),
      createTextCell(ticket.customer),
      createBadgeCell(ticket.priority, `pill priority-${ticket.priority}`),
      createTextCell(ticket.sourceChannel),
      createBadgeCell(
        ticket.urgencyLabel || "da calcolare",
        `server-value ${ticket.urgencyLabel ? "is-ready" : ""}`
      ),
      createStatusCell(ticket),
      createActionCell(ticket)
    );
    ticketTableBody.append(row);
  }
}

function createTextCell(value, className = "") {
  const cell = document.createElement("td");
  const text = document.createElement(className ? "strong" : "span");
  text.textContent = value;
  text.className = className;
  cell.append(text);
  return cell;
}

function createBadgeCell(value, className) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = className;
  badge.textContent = value;
  cell.append(badge);
  return cell;
}

function createStatusCell(ticket) {
  const cell = document.createElement("td");
  const status = document.createElement("span");
  const date = document.createElement("small");
  status.className = "status-pill";
  status.textContent = ticket.status;
  date.textContent = formatDate(ticket.createdAt);
  cell.append(status, date);
  return cell;
}

function createActionCell(ticket) {
  const cell = document.createElement("td");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost-button details-button";
  button.dataset.ticketId = ticket.id;
  button.setAttribute("aria-label", `Apri dettagli ${ticket.title}`);
  button.textContent = "Dettagli";
  cell.append(button);
  return cell;
}

function showTicketDetails(ticket) {
  ticketDetailsTitle.textContent = ticket.title;
  ticketDetailsCustomer.textContent = ticket.customer;
  ticketDetailsBody.replaceChildren();

  ticketDetailsBody.textContent = ticket.description || "Nessuna descrizione.";

  ticketDetails.hidden = false;
}

async function loadTickets() {
  setStatus("Caricamento ticket...", "loading");

  const response = await fetch("/api/tickets");
  const payload = await response.json();

  responsePreview.textContent = JSON.stringify(payload, null, 2);
  renderTickets(payload.tickets);
  setStatus("Ticket caricati.", "success");
}

async function createTicket(payload) {
  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responsePayload = await response.json();
  responsePreview.textContent = JSON.stringify(responsePayload, null, 2);

  if (!response.ok) {
    const firstError = Object.values(responsePayload.fieldErrors || {})[0];
    throw new Error(firstError || responsePayload.message || "Errore salvataggio ticket.");
  }

  return responsePayload.ticket;
}

form.addEventListener("input", updatePayloadPreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = getFormPayload();
  payloadPreview.textContent = JSON.stringify(payload, null, 2);

  setStatus("Salvataggio in corso...", "loading");

  try {
    const ticket = await createTicket(payload);

    form.reset();
    updatePayloadPreview();
    await loadTickets();

    setStatus(`Ticket ${ticket.id} creato.`, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Errore imprevisto.", "error");
  }
});

reloadButton.addEventListener("click", () => {
  loadTickets().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Errore caricamento ticket.", "error");
  });
});

ticketTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ticket-id]");

  if (!button) {
    return;
  }

  const ticket = ticketsById.get(button.dataset.ticketId);

  if (ticket) {
    showTicketDetails(ticket);
  }
});

closeDetailsButton.addEventListener("click", () => {
  ticketDetails.hidden = true;
});

updatePayloadPreview();
loadTickets().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Errore caricamento ticket.", "error");
});
