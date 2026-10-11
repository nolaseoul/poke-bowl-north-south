# Google Search setup

The canonical game URL is https://www.pokeball.gg/. Google Search Console uses the
Domain property `pokeball.gg`, verified on October 11, 2026 using a public TXT
record in Cloudflare DNS. Keep the `google-site-verification` TXT record in place
to retain ownership verification. No Google access to the Cloudflare account is
needed for this manual DNS method.

[Open Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Apokeball.gg)

## Search metadata

- The homepage title and description identify the free Pokémon football browser
  game, drafting, play calling, CPU and friend matches, and desktop/mobile support.
- The sprite credits page has its own title, description and clean canonical URL.
- Both pages allow indexing. The homepage allows large image previews and keeps
  the existing social cover. Metadata and JSON-LD are included in the initial HTML.
- JSON-LD describes the website and free web application. It makes no rating or
  review claims and does not guarantee a Google rich result.
- `robots.txt` allows the public site and assets, excludes `/api/`, and advertises
  the sitemap. Robots exclusions are crawl guidance, not access control.
- `sitemap.xml` lists the homepage and `/sprite-credits`. Hash-based team and duel
  links are app states, so they are not separate sitemap pages.

## Verification on October 11, 2026

Google’s live smartphone inspection returned “URL is available to Google,” with
crawling allowed, a successful page fetch and indexing allowed. It detected
https://www.pokeball.gg/ as the user-declared canonical.

The homepage indexing request was accepted into Google’s priority crawl queue.
The sitemap was submitted successfully, but its initial processing status was
“Couldn’t fetch.” The public URL returned HTTP 200 with valid XML, and Google’s
live inspection separately fetched the sitemap successfully. Check the Sitemaps
report for the next processing result before treating its URLs as discovered.

## Maintenance

Update sitemap `lastmod` dates only when the corresponding pages materially
change. Add new public pages with a unique title, useful description and matching
canonical URL. Deploy the static assets, then check their public URLs. The Worker
returns 404 for unknown paths; keep that behavior to avoid soft 404s.

Search Console reports search impressions, clicks, indexing and crawl issues;
Cloudflare Web Analytics separately reports visits. Google chooses whether and
when to index pages and can rewrite search titles/descriptions. Submission does
not guarantee indexing, rankings or immediate traffic.
