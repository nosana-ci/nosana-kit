# Connect browser demo

A tiny browser app that uses [`@nosana/kit`](../../../kit) to sign a user in with
**Connect with Nosana** and then make a couple of API calls on their behalf.

This is a **standalone example, not a workspace package** — it installs on its own and
consumes the SDK the way a real integrator would. It's wired to the local kit build via a
`link:` dependency so you can try the unreleased Connect work; once `@nosana/kit` ships with
Connect, swap that for the published version (`"@nosana/kit": "^x.y.z"`) and it's a plain
external app.

## What it shows

- `createNosanaClient(network, { connect: { clientId, redirectUri } })` — the kit builds
  the browser session for you.
- `client.connect.loginWithRedirect()` / `handleRedirectCallback()` — the sign-in.
- `client.api.credits.balance()` — an authenticated call, with the token attached for you.

It's ~90 lines of vanilla TS in [`src/main.ts`](./src/main.ts).

## Run it

1. **Register a Browser app.** In the Nosana dashboard → **Account → Connected Apps**,
   create an app that runs *in the browser*, with redirect URL **`http://localhost:3000`**.
   Copy its **Client ID**.

2. **Configure.** From this folder:

   ```bash
   cp .env.example .env
   # then edit .env: paste your Client ID and set VITE_NOSANA_NETWORK
   # (mainnet or devnet — the kit picks the matching endpoints)
   ```

3. **Build the kit** (the demo links its built output). From the repo root:

   ```bash
   pnpm install
   pnpm --filter @nosana/kit build:with-deps
   ```

4. **Install and run the demo** (it's standalone, so install it on its own). From this
   folder:

   ```bash
   pnpm install --ignore-workspace
   pnpm dev
   ```

   Open <http://localhost:3000>, click **Connect with Nosana**, sign in, then
   **Fetch credit balance**.

## Notes

- Port **3000** matters: the token exchange runs from `http://localhost:3000`, an origin the
  dev gateway's CORS allowlist already permits.
- The redirect URL you register must match exactly (`http://localhost:3000`).
