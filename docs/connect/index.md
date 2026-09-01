# Connect with Nosana

Let people sign in to your app with their Nosana account — the same way sites offer
"Sign in with Google". Once they've signed in, your app can use the Nosana API on their
behalf, and they never have to copy and paste an API key.

The SDK handles the sign-in and keeps the login fresh for you, so there's very little to
write.

## First: register your app

In the Nosana dashboard, go to **Account → Connected Apps** and create an app. You'll get:

- a **Client ID** — a public identifier for your app
- a list of **Redirect URLs** — the page(s) in your app users return to after signing in

Add the URL of your sign-in callback page (for example `https://yourapp.com/callback`).

Then follow the steps for where your app runs:

- [Browser apps](#browser-apps) — a website or single-page app
- [Server apps](#server-apps) — sign-in handled by your own backend

Both use the same connection settings — add a **Client Secret** and it switches to the
server flow; leave it out and it stays a browser app.

## Browser apps

### 1. Add a "Connect with Nosana" button

Create the client with your Client ID — it sets up the connection for you, available as
`client.connect`. Send people to Nosana when they click your button:

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  connect: {
    clientId: 'your-client-id',
    redirectUri: 'https://yourapp.com/callback',
  },
});

// When the user clicks "Connect with Nosana":
await client.connect.loginWithRedirect();
```

### 2. Finish signing in

On your callback page, finish the sign-in. That's it — the user is now connected:

```ts
await client.connect.handleRedirectCallback();
```

### 3. Use the API

Now any API call is made as the signed-in user — no extra setup:

```ts
const balance = await client.api.credits.balance();
```

The SDK attaches the user's login to each request and refreshes it automatically, so it
keeps working without you managing tokens.

To sign out:

```ts
await client.connect.logout();
```

## Server apps

If your app has a backend, you can run the sign-in there instead. Mark your app as
**server-side** when you register it, so it gets a **Client Secret** to keep private on your
server.

Set up the connection with your Client ID and Secret — adding the secret is what switches
`createConnect` to the server flow:

```ts
import { createConnect } from '@nosana/kit';

const connect = createConnect({
  clientId: 'your-client-id',
  clientSecret: process.env.NOSANA_CLIENT_SECRET,
  redirectUri: 'https://yourapp.com/callback',
});
```

### 1. Send the user to Nosana

On the route behind your "Connect with Nosana" button, send them to Nosana to sign in:

```ts
// e.g. your /login route
response.redirect(await connect.getLoginUrl());
```

### 2. Finish signing in

On your callback route, hand the incoming URL to the SDK. It completes the sign-in — the
user is now connected:

```ts
// e.g. your /callback route
await connect.handleCallback(request.url);
```

### 3. Use the API

Give the client the connection and make calls as the signed-in user:

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, { connect });

const balance = await client.api.credits.balance();
```

### Handling many users

The example above signs in one user. In a real web server, each visitor needs their own
sign-in — so give `createConnect` a `store` that reads and writes the **current user's
session** (the same place you keep other logged-in state).

A store is just three functions — `get`, `set`, and `remove` — backed by the current
request's session:

```ts
// Build a connection for the user making this request.
function connectFor(session) {
  return createConnect({
    clientId: 'your-client-id',
    clientSecret: process.env.NOSANA_CLIENT_SECRET,
    redirectUri: 'https://yourapp.com/callback',
    store: {
      get: (key) => session[key] ?? null,
      set: (key, value) => { session[key] = value; },
      remove: (key) => { delete session[key]; },
    },
  });
}

// Then use it per request, exactly as before:
app.get('/login', (req, res) => res.redirect(await connectFor(req.session).getLoginUrl()));
app.get('/callback', async (req, res) => {
  await connectFor(req.session).handleCallback(req.url);
  res.redirect('/');
});
```

Everything else stays the same — each user's sign-in is kept in their own session.

## Good to know

- **Already using the Nosana dashboard's own login?** If your app runs on a `nosana.com`
  address, you don't need this — the SDK already recognises the signed-in user.
- Want the finer details — every option and method? They're in the
  [SDK Reference](/kit/reference/).
