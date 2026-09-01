import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const clientId = import.meta.env.VITE_NOSANA_CLIENT_ID;
const network = (import.meta.env.VITE_NOSANA_NETWORK || 'mainnet') as NosanaNetwork;

const app = document.getElementById('app')!;

function render(html: string): void {
  app.innerHTML = html;
}

if (!clientId) {
  render(
    `<p class="error">Set <code>VITE_NOSANA_CLIENT_ID</code> in <code>.env</code> (see <code>.env.example</code>) and reload.</p>`,
  );
  throw new Error('Missing VITE_NOSANA_CLIENT_ID');
}

// One client for the whole page. Passing a `connect` config makes the kit build
// the browser session and wire its (auto-refreshed) token into `client.api`. The
// network selects the matching auth issuer + API endpoints for you.
const client = createNosanaClient(network, {
  connect: { clientId, redirectUri: window.location.origin },
});
const connect = client.connect;

function showLoggedOut(): void {
  render(`<button id="login">Connect with Nosana</button>`);
  document.getElementById('login')!.addEventListener('click', () => {
    // Redirects to Nosana to sign in; comes back to redirectUri with a code.
    void connect.loginWithRedirect();
  });
}

async function showLoggedIn(): Promise<void> {
  render(`
    <p>Signed in ✓</p>
    <button id="balance">Fetch credit balance</button>
    <button id="logout" class="secondary">Log out</button>
    <pre id="out"></pre>
  `);
  const out = document.getElementById('out')!;

  const user = await connect.getUser().catch(() => null);
  if (user) out.textContent = `User\n${JSON.stringify(user, null, 2)}`;

  document.getElementById('balance')!.addEventListener('click', async () => {
    out.textContent = 'Loading…';
    try {
      const balance = await client.api.credits.balance();
      out.textContent = `Credit balance\n${JSON.stringify(balance, null, 2)}`;
    } catch (err) {
      out.textContent = `Error: ${(err as Error).message}`;
    }
  });

  document.getElementById('logout')!.addEventListener('click', async () => {
    await connect.logout();
    showLoggedOut();
  });
}

async function main(): Promise<void> {
  const params = new URLSearchParams(window.location.search);

  // We're back from Nosana with an authorization code.
  if (params.get('code') && params.get('state')) {
    render('<p>Finishing sign in…</p>');
    try {
      await connect.handleRedirectCallback();
      window.history.replaceState({}, '', window.location.origin); // drop code/state from the URL
      await showLoggedIn();
    } catch (err) {
      render(
        `<p class="error">Sign-in failed: ${(err as Error).message}</p><button id="retry">Try again</button>`,
      );
      document
        .getElementById('retry')!
        .addEventListener('click', () => (window.location.href = window.location.origin));
    }
    return;
  }

  if (await connect.isAuthenticated()) {
    await showLoggedIn();
  } else {
    showLoggedOut();
  }
}

void main();
