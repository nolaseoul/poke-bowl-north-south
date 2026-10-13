# Romantium

Romantium is an original game character, not an official Pokémon or Pokédex entry. Internal ID `1001` keeps him separate from the 151 Kanto species.

## Play

Choose **BUILD MY TEAM**, search **Romantium**, and draft him into any slot. His pearl-white and cobalt armor, golden crest, cyan eyes and amber reactor identify him on the field.

- Type: Steel/Electric.
- Base ratings: 100 OVR at all 16 positions; 110 Speed and Strength; 99 for other athletic and football skills.
- Signature ultimate: **Quantum Overdrive**, once per set of downs. It adds 12 to position skills, Speed and Strength, capped at 120, with cyan electric effects, a reactor pulse and arm-cannon windup.
- Field animation: native pixel rig with eight genuine directions, articulated running legs and arms, jet exhaust, action poses, hurt eyes and raised-arm celebrations.
- Victory dance: **Quantum Robot**.
- Supported in guest, ranked, roster sharing and friend duels. When drafted, his Speed makes him the fastest returner.

Automatic drafting, reserve selection and gym clubs exclude custom prospects. This preserves historical seeded rosters and results. The simulation's higher cap applies only to ID 1001; original players retain their existing 99 cap. No database migration is needed.

## Artwork

Generated with the built-in ImageGen tool, not the CLI. The transparent 1254 × 1254 PNG is saved unchanged at:

- `dist/assets/portraits/1001.png` — scouting, ultimate and profile portrait.
- `dist/assets/1001.png` — roster image.

The native field rig in `dist/romantium.js` is drawn in canvas code and shares the portrait's design cues. It is separate from the licensed PMDCollab animations used by Kanto characters.

Exact generation prompt:

> Use case: stylized-concept. Asset type: polished 16-bit pixel-art character portrait and full-body cutout for an original browser sports game. Create one completely original robot creature named Romantium, no lettering in the image. He is a cool youthful masculine robot mascot, entirely mechanical rather than a human child: a compact heroic biped with two articulated arms, two powerful legs, oversized jet boots, rounded armored fists, and an expressive friendly cyan digital eye visor in an angular helmet. Distinctive swept-back three-fin golden head crest, pearl-white armor over deep navy mechanical joints, cobalt blue shoulder and shin armor, cyan luminous circuit lines, a bright amber diamond-shaped reactor in his chest, small thruster vents. Confident cool forward-leaning athletic stance, one fist raised, the other open with a small glowing cyan energy orb, both boots and all limbs fully visible. Three-quarter front view, strong readable silhouette, rich but limited 16-bit colors, crisp square pixels and dark pixel outlines, detailed premium SNES-era sprite illustration, no smooth vector appearance. Center him with generous transparent margins, full body occupying about 80% of a square canvas. True alpha transparency, no floor, background, card border, text, watermark, logos or existing franchise characters. This is an original friendly sports-game robot character, not a depiction of a real person.

## Verification

`node tests/romantium.cjs` checks all positions, leading Speed/Strength, transparent artwork, eight distinct views across nine poses, share links, ultimate recharge and the fastest returner. It verifies 30 custom ranked replays and 75 unchanged historical replays across rules versions 1, 3 and 4. League and PvP integration tests also use Romantium through real game validation and persistence paths.
