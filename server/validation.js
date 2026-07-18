export const validPriorities = ["bassa", "normale", "alta"];
export const validSourceChannels = ["email", "telefono", "chat"];

export function normalizeTicketInput(body) {
  return {
    title: String(body.title || "").trim(),
    customer: String(body.customer || "").trim(),
    description: String(body.description || "").trim(),
    priority: String(body.priority || "").trim(),
    sourceChannel: String(body.sourceChannel || "").trim()
  };
}

export function validateTicketInput(input) {
  const fieldErrors = {};

  if (!input.title || input.title.length < 3) {
    fieldErrors.title = "Inserisci un titolo di almeno 3 caratteri.";
  }

  if (!input.customer || input.customer.length < 2) {
    fieldErrors.customer = "Inserisci il nome del cliente.";
  }

  if (!validPriorities.includes(input.priority)) {
    fieldErrors.priority = "Priorita' non valida.";
  }

  if (!validSourceChannels.includes(input.sourceChannel)) {
    fieldErrors.sourceChannel = "Canale di richiesta non valido.";
  }

  return fieldErrors;
}
