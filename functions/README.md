# AutoDoctor PRO KZ — AI mechanic setup

The AI chat is served by the Cloudflare Pages Function at `/api/mechanic`. The OpenAI key must only be stored as a server-side secret.

## Configure in Cloudflare Pages
1. Open the Pages project connected to this repository.
2. Go to **Settings → Variables and Secrets**.
3. Add secret `OPENAI_API_KEY` with your API key.
4. Optional: add `OPENAI_MODEL` with a model available to your API account (default: `gpt-4.1-mini`).
5. Redeploy the project.

Never put the API key in React code, Vite variables prefixed with `VITE_`, or commit it to GitHub.

If the secret is absent, the endpoint returns a clear setup message. API usage may incur charges and requires an API account with billing/access configured.

## Scope
This function provides preliminary troubleshooting guidance. It does not access vehicle service manuals or verified parts/fuse databases. Never treat generated advice as a substitute for factory documentation or professional inspection.
