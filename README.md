# L20 - Starter studenti

Baseline per il lab sul confine HTTP. La gestione degli errori di L19 e' gia'
presente; restano da chiudere request malformate o fuori contratto senza
persistenza parziale.

## Requisiti

- Node.js 26 o successivo;
- pnpm 10 o successivo.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm demo:direct-request
pnpm check:requests
```

`pnpm check:requests` e' intenzionalmente rosso all'inizio e mostra status HTTP
e delta del database per ogni caso. Leggere `consegna.md` prima di modificare il
server.
