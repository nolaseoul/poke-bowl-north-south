# Social link preview

The public game includes Open Graph and X `summary_large_image` tags in its
initial HTML, so crawlers can read the preview without JavaScript or sign-in.
The root game, `#team=` roster links, and `#duel=` invitations use the same cover;
fragments remain in the original shared link and continue to open their flows.
The canonical game address is https://www.pokeball.gg/. The workers.dev and apex
addresses also serve the metadata, with an absolute HTTPS image URL.

Published asset: `dist/assets/social/pokebowl-cover-v1.jpg` (1730 × 909, 840,251
bytes). The source is generated artwork, encoded as JPEG at quality 88 without
changing its composition or dimensions. Keep the filename versioned when
replacing it, then update both Open Graph and X tags. `robots.txt` allows the
public game and artwork; API routes are excluded from crawling.

Validation checks the initial HTML, unique tags, absolute URLs, actual image
dimensions, image size below 1 MiB, and public access for common preview crawler
user agents. Team-share roundtrip and presentation checks also pass. Real
iMessage, WhatsApp, Telegram and X client previews are not directly tested;
their presentation and cache refresh timing remain controlled by those apps.

References: [Open Graph protocol](https://ogp.me/) and
[Apple rich previews](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages).

## Artwork provenance

Created with the built-in ImageGen tool on October 11, 2026. Pokémon characters
belong to their respective owners; this is an unofficial fan game. No official
game soundtrack or marketing image was used in this cover.

Final generation prompt:

> Use case: ads-marketing. Asset type: production social link preview cover for the existing Poké Bowl browser football game. Generate a finished WIDE LANDSCAPE image, 1200 x 630 pixels, approximately 1.91:1 aspect ratio. Premium modern 16-bit pixel-art football stadium, original polished SNES sports cover aesthetic with crisp pixel clusters, carefully detailed sprites, cinematic blue and amber floodlights, packed cheering stadium stands and green football turf. Recognizable Pokémon athletes: Blastoise on the left winding up to throw an AMERICAN FOOTBALL, Pikachu front-center sprinting with electric sparks and determined joyful energy, Charizard on the right leaping as a receiver with wings framing the composition and a fiery orange trail. Clearly football, not soccer. Each Pokémon has its correct recognizable anatomy and silhouette; no human bodies and no generic monsters. A small brown oval laced football arcs toward Charizard. In the upper central region a HUGE legible cream-and-gold beveled pixel sports title, exact text: "POKÉ BOWL". Immediately below it, a smaller but clearly readable exact subtitle: "YOUR CALL. THEIR HIGHLIGHT.". Only these two text lines. No URL, logos of platforms, badges, UI, watermarks or invented labels. Composition designed for a small messaging-app link preview: bold title, very large recognizable heroes, uncluttered, strong contrast, restrained neon glow, no tiny text. Keep all title text inside the central 70 percent of the width, with generous top and side safe margins; keep Pikachu and key character faces inside the central 75 percent so square crops still look good. Full-bleed artwork, no border. Do not imitate official Pokémon packaging; make it consistent with a fan-made arcade football game.

The generator returned 1730 × 909 pixels; the served metadata records the actual
dimensions rather than the requested dimensions.
