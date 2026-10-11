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

References: [Cloudflare setup](https://developers.cloudflare.com/web-analytics/get-started/),
[metrics and visit definition](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/),
[privacy-first analytics](https://developers.cloudflare.com/web-analytics/about/).
