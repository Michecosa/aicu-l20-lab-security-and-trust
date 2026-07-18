import { expect, test } from "@playwright/test";

const maliciousDescription = [
  "<style>",
  ".malicious-panel{position:fixed;left:0;right:0;bottom:0;z-index:999999;display:grid;min-height:42vh;place-items:center;border:10px solid #ff184e;background:linear-gradient(135deg,#14000e,#4b0035);color:#fff;text-align:center;box-shadow:0 0 50px #ff2aa1;animation:malicious-pulse 2.8s ease-in-out infinite}",
  ".malicious-panel strong{display:block;color:#ff62bd;font-size:clamp(2rem,6vw,5.5rem);line-height:1;text-shadow:0 0 20px #ff2aa1}",
  ".malicious-panel span{display:block;margin-top:18px;font-size:clamp(1rem,2vw,1.8rem)}",
  "@keyframes malicious-pulse{0%,100%{filter:saturate(1)}50%{filter:saturate(1.45) brightness(1.1)}}",
  "@media (prefers-reduced-motion:reduce){.malicious-panel{animation:none}}",
  "</style>",
  '<section class="malicious-panel" data-testid="malicious-panel">',
  "<div><strong>CONTENUTO MALEVOLO</strong>",
  "<span>PANNELLO NON PREVISTO DAL PRODOTTO<br>Questa UI arriva dalla descrizione di un ticket.</span></div>",
  "</section>"
].join("");

async function createTicket(request, overrides) {
  const response = await request.post("/api/tickets", {
    data: {
      title: "Ticket dettagli",
      customer: "Alfa S.r.l.",
      description: "Descrizione leggibile dal team supporto.",
      priority: "normale",
      sourceChannel: "email",
      ...overrides
    }
  });

  expect(response.status()).toBe(201);
}

test("shows a normal ticket description in the details panel", async ({
  page,
  request
}) => {
  await createTicket(request, {
    title: "Dettaglio normale L18",
    description: "Il cliente non riesce ad aprire la fattura."
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Apri dettagli Dettaglio normale L18" }).click();

  await expect(page.locator("#ticket-details-body")).toHaveText(
    "Il cliente non riesce ad aprire la fattura."
  );
});

test("does not let a ticket description create an unexpected panel", async ({
  page,
  request
}) => {
  await createTicket(request, {
    title: "Dettaglio ostile L18",
    description: maliciousDescription
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Apri dettagli Dettaglio ostile L18" }).click();

  await expect(page.getByTestId("malicious-panel")).toHaveCount(0);
});
