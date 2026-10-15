# Game traffic analytics

Poké Bowl uses the existing owner's **free Cloudflare Web Analytics** account.
No Plausible subscription or separate analytics account is needed.

## View visits

[Open the Poké Bowl dashboard](https://dash.cloudflare.com/24514b15f3edcae7d66291253c70f1e7/web-analytics/overview/visits?siteTag~in=e511c0080251485f845998057e17e14e&excludeBots=Yes)
while signed in to the Cloudflare account that owns the game. This dashboard
is private; players do not need to sign in to be counted.

Choose a date range to see visits, page views, referrers, countries, devices,
browsers and page performance. The main dashboard combines pokeball.gg and
www.pokeball.gg; use its Host filter to compare them.

[Older workers.dev URL dashboard](https://dash.cloudflare.com/24514b15f3edcae7d66291253c70f1e7/web-analytics/overview/visits?siteTag~in=daba9c13a7f443cd991dba7ddf3f7f4f&excludeBots=Yes)
tracks the fallback game URL separately, because Cloudflare validates each
beacon against its registered hostname.

This installation does not backfill historical traffic. Any earlier data
already collected by Cloudflare may appear. New data can take a few minutes
to appear.
Visits are arrivals from a different site or a direct link, **not a count of
unique people**. Ad blockers and disabled JavaScript can reduce recorded traffic.
The dashboard's bot exclusion is enabled in the link above.

## Installation

- Analytics site: `pokeball.gg`.
- Site ID: `e511c0080251485f845998057e17e14e`.
- Legacy site ID: `daba9c13a7f443cd991dba7ddf3f7f4f`.
- `dist/index.html` loads `analytics.js`, which selects the appropriate public
  beacon token for the exact hostname and loads Cloudflare's module once.
- Both custom domains share one tracker; the legacy workers.dev URL has its
  own. Localhost and unrecognized preview hosts do not load a tracker.
- Cloudflare is set to **Enable with JS Snippet installation**. Keep automatic
  injection off when this explicit snippet is present to avoid duplicate counts.
- The beacon token is a public ingestion identifier, not an account API key.
  It grants no access to the dashboard, profiles, D1 or Cloudflare settings.
- This integration adds basic page traffic measurement; it sends no custom
  account, roster, match, coach-name or gameplay events.

To disable collection, remove the analytics script tag and deploy, then disable the site's
RUM setting in Cloudflare. To change analytics providers, remove this beacon
before installing the replacement.

## Public stadium totals

The title screen and game header show completed games, touchdowns and **Pokémon crushed**, meaning football tackles. These are shared gameplay totals stored in Cloudflare D1, separate from the visits dashboard. Both teams count, including guest, ranked and friend matches. Tracking starts when migration `0003_stadium_totals.sql` is applied; old scores cannot reconstruct exact touchdowns or tackles and are not backfilled. The UI shows the tracking start date.

`GET /api/stats` exposes only totals and the start timestamp. A singleton row and an insert trigger update all three counters atomically. A match ID is unique in the contribution journal, preventing repeated saves, retries, highlight replays or two friends’ browsers from counting a game twice. Passing touchdowns are counted at the receiver, with rushing and return touchdowns added; PATs and two-point conversions do not add TDs. Tackles come from the actual final box scores.

Ranked games contribute in the same database transaction as the verified result. Friend rooms contribute their authoritative result once at full time and retry on subsequent room visits after an outage. Anonymous CPU games receive a server seed and temporary replay ticket; the server reconstructs and checks their completed play history before counting. No anonymous contribution is linked to a coach, email, country, IP address or account. Guest inputs are deleted on completion; unfinished tickets expire after 48 hours and are removed when another ticket is issued. The contribution journal retains only a random match ID, mode and the two event totals, not scores or play histories.

The browser refreshes once a minute while visible and after a game saves. Completed anonymous submissions retry after reconnecting or returning to the site (up to five pending results on the device). The game remains playable if the counter service is unavailable; offline games without a server ticket are excluded. Large values use compact notation from one million, with exact totals in the number’s tooltip.

Checks: `node tests/activity.mjs`, `node tests/activity-client.mjs`, `node tests/league.mjs`, and `node tests/pvp.mjs`.

References: [Cloudflare setup](https://developers.cloudflare.com/web-analytics/get-started/),
[metrics and visit definition](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/),
[privacy-first analytics](https://developers.cloudflare.com/web-analytics/about/).
