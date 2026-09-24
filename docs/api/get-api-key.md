---
title: How to Get an API Key
---

# How to Get an API Key

## Get an API Key



### Step 1: Access Nosana Deploy
Log in to the [Nosana Deploy](https://deploy.nosana.com) with your Nosana account and navigate to the `Account` page.

![API keys overview](/assets/image/api_keys.png)

### Step 2: Generate API Key
In the `API Keys` section on the Account page, you can view your existing API keys and create new ones.

Click `Create Key` to generate a new API key. Give your new key a descriptive name and an expiration date, and choose its **Permissions**. Once you've filled everything in, your API key will be shown with an option to copy it.

![Create API key](/assets/image/create_key.png)

### Step 3: Choose permissions
Permissions decide what the key can do. Every permission is ticked by default. Untick
whatever the key doesn't need: a key that only reads your credits and jobs can't spend
credits if it leaks.

Permissions can't be changed after the key is created. To change them, create a new key.
See [Permissions (Scopes)](/api/scopes) for what each one allows.

:::warning
Keep your API key **private**. Do not share it publicly, include it in client-side code, or commit it to version control. If you suspect your key has been exposed, revoke it immediately and create a new one.
:::
