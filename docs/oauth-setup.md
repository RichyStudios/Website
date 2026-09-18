# Provider sign-in setup

Noble & New now uses its own provider sessions. The login screen does not expose a ChatGPT sign-in. To enable a provider, add its client ID and secret to the site's server environment, then register the exact callback URL below.

Use the deployed site URL for production and `http://localhost:3000` for local development.

| Provider | Environment variables | Callback URL |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `{SITE_URL}/api/auth/google/callback` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | `{SITE_URL}/api/auth/facebook/callback` |
| Outlook / Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `{SITE_URL}/api/auth/outlook/callback` |

Set `SITE_URL` to the public origin, for example `https://noble-new-studio.richynoble90.chatgpt.site`. The callback must match the registered URL exactly, including protocol and path.

The flow uses authorization code exchange, state validation, and PKCE where supported. A provider that has not been configured sends the visitor back to `/login?error=provider_not_configured` with an actionable message instead of failing silently.
