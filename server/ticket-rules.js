const urgencyLabels = {
  alta: {
    telefono: "intervento rapido",
    chat: "prioritario",
    email: "prioritario"
  },
  normale: {
    telefono: "da gestire",
    chat: "da gestire",
    email: "standard"
  },
  bassa: {
    telefono: "monitorare",
    chat: "monitorare",
    email: "monitorare"
  }
};

export function computeUrgencyLabel(priority, sourceChannel) {
  return urgencyLabels[priority]?.[sourceChannel] ?? null;
}
