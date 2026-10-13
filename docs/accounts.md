# Accounts and league records

The browser supports email/password signup and sign-in, email confirmation,
password reset, Google OAuth with PKCE, and guest play. Supabase Auth manages
credentials and sessions. Cloudflare D1 stores the game profiles and records.
No password, email address, provider secret, or Supabase service-role key is
stored in D1 or returned by the public leaderboard.

## Activation

As of October 12, the dedicated **Poke Bowl (pokeball.gg)** project is healthy in
the free Poké Bowl organization. Project reference: `urkxyzvczwsmznudrqjz`.
The Worker configuration uses its public API URL and publishable key. Auth Site
URL is `https://www.pokeball.gg/`; the exact redirect allowlist includes that URL,
`https://pokeball.gg/` and the existing workers.dev game's root URL.

Email/password is enabled with confirmation required. Custom SMTP and Google
OAuth credentials are still pending. Public signup/email delivery, Google
consent and a real signed-in ranked result have **not** been verified. The
default email service is limited to project-team addresses; connecting the
project alone does not make public signup production-ready. Google stays
disabled in the game until provider setup and verification are complete.

The dedicated project is connected. Keep this game’s users separate from the
unrelated SchoolRoads and FreshCut projects. Remaining provider setup follows
the checklist below; do not recreate the project.

1. Enable email/password authentication, keep email confirmation enabled, and
   configure a custom SMTP sender so friends can receive confirmations and
   reset emails. Supabase's default mailer only sends to project team addresses.
2. Set the Auth Site URL to
   `https://www.pokeball.gg/` and add that exact
   URL to the redirect allowlist. Add the actual custom game domain separately
   when one is connected. For local testing, allow `http://127.0.0.1:8787/`.
3. Create a Google OAuth web client in the owner's Google Cloud project. Add the
   Supabase project's `https://<project-ref>.supabase.co/auth/v1/callback` as the
   authorized redirect URI. Configure the provider's client ID and secret in
   Supabase's Google provider settings. Keep the client secret out of this repo.
4. Set the Worker environment variables `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` to that project's URL and **publishable** key.
   These two values are intentionally public client configuration. Never use a
   service-role or secret key. Set `GOOGLE_ENABLED="true"` only after Google's
   provider is configured and its sign-in tested.
5. Deploy and verify signup with a disposable test email, confirmation, login,
   password recovery, Google redirect/return, and session restoration. Complete
   a signed-in game and check its profile/leaderboard from another browser.

### Provider setup checkpoint — October 12

A dedicated Google Cloud project, **Poke Bowl** (`main-sphere-511417-b7`), was
created without enabling paid services. Its consent setup is prepared for an
external audience, but the final Google API Services User Data Policy approval
is pending. No OAuth client or client secret has been created yet.

Resend sign-in was completed with the owner’s approval of its service terms.
The dedicated sender domain `auth.pokeball.gg` has been added (Resend domain ID
`248f3b60-8c27-43c2-9311-1d40cf76b027`). DNS verification is still pending:

- TXT `resend._domainkey.auth`: use the public DKIM value shown in Resend.
- CNAME `send.auth` → `send.forge.rmta.net` (DNS only).
- CNAME `rsend.auth` → `rsend.forge.rmta.net` (DNS only).

The Supabase SMTP form is prepared, **not saved**, with sender
`noreply@auth.pokeball.gg`, name `Poke Bowl`, host `smtp.resend.com`, port `465`,
and username `resend`. Its password must be a scoped Resend sending key; no key
has been created or entered. Keep that secret in Supabase, never in this repo.
The Cloudflare dashboard was stuck on its loading screen during this setup;
no DNS record was changed. Email confirmation remains required. Google remains
disabled until provider credentials are saved and real sign-in is verified.

Provider setup references: [password auth](https://supabase.com/docs/guides/auth/passwords),
[Google auth](https://supabase.com/docs/guides/auth/social-login/auth-google),
[custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), and
[redirect allowlists](https://supabase.com/docs/guides/auth/redirect-urls).

If Auth is not configured, the game clearly labels account sign-in as pending,
keeps guest play available, and rejects ranked writes. It never falls back to
an insecure local account or pretends a guest score was saved.

## Player experience

- Guests choose a country and play without an account. The country lasts for
  the current browser session. Their matches never call the save API or enter
  the standings. The header, guest entry, and final score repeat this notice.
- Signed-in coaches choose a public name and country. Their account record,
  rank, and ten most recent matches load from the server on each device.
- The leaderboard shows completed signed-in matches only: three points per
  win, one per draw. Ties use wins, then point difference, then stable user ID.
  The country filter retains each coach's global rank. There are no seeded or
  fabricated leaderboard entries.
- Ranked matches receive a server-generated seed and are reconstructed on the
  server using the saved lineup and exact sequence of calls. Clients cannot
  submit ratings or arbitrary scores. CPU calls must be automatic. Saving a
  match again is idempotent. Unfinished matches are not ranked.
- Failed signed-in saves are retained in this browser without credentials and
  retried when the same account signs in again. The result screen also has a
  retry action. A guest match cannot become ranked by signing in afterward.

## API and storage

The Worker checks bearer tokens against Supabase Auth's `/auth/v1/user` on
private requests. It rejects missing, invalid, expired, and anonymous sessions.
Identity comes from that validated response, never from a client-supplied user
ID or editable user metadata. SQL statements bind inputs. Authenticated
responses have `Cache-Control: private, no-store`. Public names are rendered
with `textContent` rather than HTML.

- `GET /api/config`: publishable Auth configuration and Google availability
- `GET /api/leaderboard?country=JP`: public completed-match standings
- `GET /api/profile`: current account's profile and recent matches
- `PATCH /api/profile`: update current account's public name and country
- `POST /api/matches`: create a ranked matchup with 22 unique species IDs
- `POST /api/matches/:id/finish`: verify and save a completed match once

D1 schema: `migrations/0001_league.sql`. The database is accessible through the
Worker binding; browser users have no direct SQL or database credentials.

## Checks and limitations

`tests/league.mjs` uses SQLite with the actual migration and Worker handlers,
plus a mocked identity provider. It covers deterministic replay, owner
isolation, guest exclusion, forged/incomplete scores, country filters, profile
edits, and duplicate saves. `tests/account.cjs` checks the client flows with a
mocked managed-auth SDK. Neither test claims to validate real Google consent or
email delivery; those require the configured services and real browser checks.

Server replay prevents arbitrary score payloads, but the client-visible seed
and rules do not make this a cheat-proof competitive platform. Rate limiting,
season rules, and stronger anti-abuse controls can be added as the league grows.


## October 11 auth audit and onboarding updates

The deployed config endpoint returned null URL/key and Google disabled. The
connected Supabase account listed only the paused SchoolRoads project; no
dedicated Poke Bowl auth project exists. The browser also exposes FreshCut
(Pro) and School Roads (Free) organizations. Do not reuse either unrelated
project's users or credentials. The owner was asked to select the organization
for a separate project. The MCP cost endpoint was unavailable, so no project
was created and no paid resource or auth setting was changed.

The guest, profile and leaderboard country selectors now put United States
first after the placeholder. Each has a country-name/code search box, a result
count and a no-match message. Filtering preserves an existing selection so
typing a query never changes the country that would be submitted.

OAuth callback errors are shown in the account dialog. Password-recovery mode
is preserved when an initial session restoration completes concurrently. Client
tests cover provider flows with a mock; real sign-in remains unverified until
the provider setup above is completed.

## Google provider checkpoint — October 12, 2026

The owner created the Google OAuth web client and saved its ID and secret in
Supabase. The public Auth settings report Google enabled. Cloudflare now serves
`GOOGLE_ENABLED="true"`, and the live game displays an enabled Continue with
Google button. No client secret is stored in this repository.

The browser test reached Supabase’s authorize endpoint but Chrome blocked that
navigation with `ERR_BLOCKED_BY_CLIENT`. A complete Google consent, callback,
session restoration and ranked-save test remains unverified. This checkpoint
supersedes earlier notes that Google credentials or button activation are pending.
