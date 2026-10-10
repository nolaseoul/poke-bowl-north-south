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
npx wrangler@4.149.0 deploy --config wrangler.jsonc
```

Use `npx wrangler@4.149.0 login` if the Cloudflare CLI session has expired.
The Wrangler configuration enables the public `workers.dev` URL. Choose the
intended Cloudflare account at deployment time, or set `CLOUDFLARE_ACCOUNT_ID`
in your shell when your login has access to multiple accounts.

The deployed build was verified with anonymous HTTP requests: all 28 files
returned HTTP 200 and matched the local build. Browser kickoff, automatic
play advancement, and the music-on state were also verified.
