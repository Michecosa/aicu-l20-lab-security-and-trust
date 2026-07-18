# L20 - Il confine HTTP sotto pressione

## Prima di iniziare

Lavorerai sul confine HTTP di `POST /api/tickets`: il punto in cui il server
riceve media type e body, interpreta il JSON, valida i dati e decide se puo'
arrivare alla persistenza.

L'obiettivo e' rendere verde una matrice di request eseguibile, senza modificare
lo script automatico che esegue la verifica (`scripts/check-requests.js`).
L'output richiesto e' codice piu' evidenza eseguibile: non serve produrre un
report Markdown.

Usa esclusivamente dati locali e fittizi. Non inserire credenziali, token, file
`.env`, dati personali o codice aziendale nei prompt o negli output condivisi.

## Da quale repo partire

Usa questa repo L20 come base: contiene lo script automatico di verifica e i
comandi specifici del laboratorio.

Se hai completato lo sprint L19, puoi conservare quel lavoro. Porta nella repo
L20 **soltanto le modifiche al codice che hai realizzato tu in L19**, applicando
la patch o replicando le modifiche in modo controllato. Non sostituire con i
file di L19:

- `package.json` e `pnpm-lock.yaml`;
- la cartella `scripts/`;
- `consegna.md` e `AGENTS.md`.

L19 e L20 restano due esercizi distinti: L19 protegge il lavoro dell'agente e
la gestione di errori e log; L20 verifica il confine HTTP. Il codice puo'
proseguire, ma `scripts/check-requests.js` e i relativi comandi di L20 devono
restare quelli forniti qui.

Dopo aver riportato le modifiche L19, esegui tutti i comandi della sezione
seguente prima di iniziare il nuovo esercizio. Se il comportamento iniziale e'
diverso da quello descritto, controlla prima di tutto di non avere sostituito il
file di verifica `scripts/check-requests.js` o introdotto modifiche fuori scope.

## Prerequisiti

- Node.js 26 o successivo;
- pnpm 10 o successivo.

## Setup e stato iniziale

Dalla root della repo esegui:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm demo:direct-request
pnpm check:requests
```

All'inizio:

- `pnpm check` deve essere verde;
- `pnpm test` deve avere 14 test verdi;
- `pnpm demo:direct-request` deve mostrare il caso `text/plain` accettato
  erroneamente con `201` e una riga persistita;
- `pnpm check:requests` deve terminare rosso su tre casi: JSON malformato,
  `description` con tipo errato e media type non supportato.

Gli altri casi core sono gia' verdi e devono restarlo.

## Obiettivo

Rendi verde l'intera matrice core di `pnpm check:requests`, mantenendo verdi i
test esistenti e impedendo qualsiasi persistenza dopo una request rifiutata.

## Contratto core

| Caso | Status e codice attesi | Effetto sul database |
| --- | --- | --- |
| ticket JSON valido | `201` | `+1`, ticket persistito |
| JSON malformato | `400 INVALID_JSON` | `+0` |
| `description` con tipo errato | `400 VALIDATION_ERROR` | `+0` |
| `Content-Type: text/plain` | `415 UNSUPPORTED_MEDIA_TYPE` | `+0` |
| testo HTML-like valido | `201` | `+1`, testo preservato esattamente come dato |
| `sourceChannel: "whatsapp"` | `400 VALIDATION_ERROR` | `+0` |

Per il caso HTML-like il valore:

```html
<strong>Cliente bloccato</strong>
```

e' testo valido. Non vietare genericamente `<` e `>` e non trasformare il
contenuto: il rendering sicuro appartiene al punto in cui il dato viene mostrato
nella UI.

## Passaggi per risolvere l'esercizio

1. Esegui `pnpm check:requests` e scegli un solo caso rosso.
2. Segui il percorso della request fino al primo punto responsabile.
3. Distingui media type, parsing JSON, validazione di tipo e regola di dominio.
4. Applica la modifica minima necessaria per quel caso.
5. Riesegui l'intera matrice, non soltanto il caso appena corretto.
6. Controlla che una request rifiutata produca sempre delta database `+0`.
7. Ripeti il ciclo fino a ottenere tutta la matrice core verde.
8. Esegui la verifica finale completa.

## Verifica finale

```bash
pnpm check:requests
pnpm test
pnpm check
```

Tutti e tre i comandi devono terminare correttamente.

## Vincoli

Non:

- modificare `scripts/check-requests.js` per ottenere il verde;
- convertire automaticamente input errati con `String(...)`;
- bloccare genericamente caratteri HTML-like validi;
- aggiungere dipendenze;
- modificare schema SQLite, frontend o regola `urgencyLabel`;
- aggiungere auth, rate limiting o altre funzionalita';
- trasformare il task in un refactor generale.

Se usi un agente AI, limita lo scope al confine HTTP di
`POST /api/tickets`, controlla i file letti e verifica ogni modifica con i
comandi della consegna. Non chiedere all'agente di modificare
`scripts/check-requests.js`.

## Bonus facoltativo

Solo dopo aver reso verde tutta la matrice core puoi introdurre un limite
esplicito alla dimensione del body.

Comportamento atteso oltre il limite:

```txt
status: 413
code: CONTENT_TOO_LARGE
effetto sul database: +0
```

Il limite deve essere dichiarato, applicato durante la lettura e dimostrato con
un check o test aggiuntivo. Il bonus non e' necessario per completare il lab.

## Pronto quando

- tutti i casi di `pnpm check:requests` sono verdi;
- i 14 test esistenti continuano a passare;
- `pnpm check` termina correttamente;
- ogni request rifiutata lascia invariato il database;
- il testo HTML-like valido viene preservato come dato;
- il diff contiene soltanto modifiche necessarie al confine HTTP;
- non hai modificato `scripts/check-requests.js` e non hai aggiunto documenti
  di consegna.
