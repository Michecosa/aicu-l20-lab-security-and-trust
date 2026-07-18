import { expect, test } from "@playwright/test";

test("shows the server-calculated urgency label in the ticket list", async ({
  page
}) => {
  await page.goto("/");

  const ticketRow = page
    .getByRole("row")
    .filter({ hasText: "Impossibile accedere al portale clienti" });

  await expect(ticketRow).toContainText("prioritario");
});

test.fixme(
  "creates a ticket and shows intervento rapido in its row",
  async () => {}
);
