# Cloudflare deployment

Custom game addresses: https://www.pokeball.gg/ and https://pokeball.gg/

Fallback: https://poke-bowl-north-south.freshcut-revival.workers.dev/

Domain registration stays at Namecheap. Authoritative DNS uses Cloudflare:
`lindsey.ns.cloudflare.com` and `tim.ns.cloudflare.com`. Both hostnames are
Worker custom domains declared in `wrangler.jsonc`; keep them on future deploys.
The zone uses the Free plan. Nameservers were saved on October 11, 2026;
initial DNS propagation and HTTPS activation must finish before the custom
addresses are reachable.

Cloudflare project: `poke-bowl-north-south` (Worker + Static Assets).
Private PvP rooms: SQLite Durable Object `PvPRoom`, binding `PVP` (12-hour expiry).
D1 database: `poke-bowl-league`, binding `LEAGUE`.
The browser game is in `dist/`; the API is in `worker/index.mjs`.
No login is required to play as a guest. Guest results are not saved.

## Local preview

```sh
npx wrangler@4.149.0 d1 migrations apply LEAGUE --local
npx wrangler@4.149.0 dev --port 8787
```

For real Auth, copy `.dev.vars.example` to the ignored `.dev.vars` and fill in
only the project's publishable configuration. See [account setup](docs/accounts.md).
Without that configuration, guest play and the empty real leaderboard work;
account sign-in stays clearly marked pending.

The committed browser Auth bundle is generated from pinned dependencies:

```sh
npm ci --ignore-scripts
npm run build:auth
```

Only regenerate it when the Auth SDK or client entry changes. Never place
provider secrets or service-role keys in `dist/` or public configuration.

## Check and publish

```sh
node tests/game.cjs
node tests/motion.cjs
node tests/music.cjs
node tests/draft.cjs
node tests/render.cjs
node tests/playbook.cjs
node tests/stadium.cjs
node tests/fx.cjs
node tests/sprites.cjs
node tests/account.cjs
node tests/league.mjs
node tests/team-links.cjs
node tests/blocking.cjs
node tests/pvp.mjs
npx wrangler@4.149.0 d1 migrations apply LEAGUE --remote
npx wrangler@4.149.0 deploy --config wrangler.jsonc
```

Use `npx wrangler@4.149.0 login` if the Cloudflare CLI session has expired.
Select the intended account if prompted. Preserve the existing D1 database ID;
do not create another database for each release. Migrations run before deploying
code that depends on their tables.

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `GOOGLE_ENABLED` as Worker
variables after the managed Auth project/providers are configured. Their purpose
and exact redirect URLs are documented in [docs/accounts.md](docs/accounts.md).
Provider client secrets belong only in Supabase's protected provider settings.

Public API checks after publishing:

- `/api/config`: returns publishable configuration, never private credentials
- `/api/leaderboard`: real standings, initially an empty `players` list
- `/api/profile`: rejects a request without a valid signed-in session
- Friend duel: create invite, join in a second browser, lock both hidden calls, verify mirrored scores, refresh/rejoin and independent replay skipping
- Team sharing: Unicode name and all 22 ordered starters survive a shared-link import
- New guest: country selection, kickoff, full game, explicit unsaved-result notice
- Configured Auth: email confirmation/login, Google return, profile restore,
  completed-match saving, second-device record and leaderboard
