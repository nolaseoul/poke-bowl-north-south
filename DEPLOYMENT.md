# Cloudflare deployment

Public game: https://poke-bowl-north-south.freshcut-revival.workers.dev/

Cloudflare project: `poke-bowl-north-south` (Workers Static Assets).
The complete browser game is in `dist/`. No build step or login is required to play.
Only `dist/` is uploaded; tests and hosting configuration stay local.

To check and publish an update from this directory:

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
npx wrangler@4.149.0 deploy --config wrangler.jsonc
```

Use `npx wrangler@4.149.0 login` if the Cloudflare CLI session has expired.
The Wrangler configuration enables the public `workers.dev` URL. Select the intended
Cloudflare account when prompted if your login has access to multiple accounts.
