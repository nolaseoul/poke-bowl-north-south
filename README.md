# Poké Bowl

A horizontal Pokémon football game for desktop and mobile browsers. Call the plays, then watch your Pokémon execute automatically.

**[Play the public game](https://poke-bowl-north-south.freshcut-revival.workers.dev/)** · **[Project board](https://github.com/users/nolaseoul/projects/1)**

## Watch a match

A new browser automatically gets **22 unique starters from the 151 Kanto species**, with randomized picks for every offensive and defensive position. Swap any starter, select **RE-DRAFT** for a fresh team, or use **AUTO DRAFT** to fill an incomplete lineup. Select **LOCK LINEUP & KICK OFF** to start. The computer drafts a separate roster from the Pokémon you leave behind. Your lineup is saved on this browser.

**Coach mode** waits for your offensive and defensive play calls. Choose Inside Run, Quick Pass, Deep Pass, Play Action, or Outside Run, preview the routes, then select **CALL PLAY**. Your team passes, runs, blocks, and defends automatically. Rocket Red calls its own plays. On defense, predict its hidden offensive play with Gap Blitz (Inside Run), Press Blitz (Quick Pass), Deep Trap (Deep Pass), QB Spy (Play Action), or Edge Blitz (Outside Run), then select **CALL DEFENSE**. A correct counter triggers exactly one ready defender’s signature ultimate on the opposing QB, sacks them for a uniformly random **5–10-yard loss**, and spends that defender’s once-per-set charge. Wrong reads play out normally. If every defender’s ultimate is spent, the read cannot trigger a special until the next set of downs. A hit in the offense’s end zone becomes a safety. The CPU chooses counters independently under the same rules; it cannot inspect your selected offense. Special teams handle punts and field goals on fourth down and cannot be ultimate-countered.

Switch **AUTO** on to watch an uninterrupted four-quarter game with both teams calling offense and defensive counters. Select 1×, 2×, or 4× broadcast speed, or pause the match. Kanto Blue attacks right and Rocket Red attacks left; possession changes turn the horizontal field around. Phones support portrait and landscape, with a horizontally scrolling playbook.

- Every prospect has athletic ratings and different football skills and overall ratings for each position. Search by name or Pokédex number, filter by type, and compare position fit, speed, or strength.
- Scout both teams, replace individual starters, and undo a cleared lineup.
- Every one of the 151 Pokémon has one fixed signature ultimate, visible while drafting and scouting. The simulation triggers relevant players’ moves automatically on both teams, adding +12 to their position skills for that play (capped at 99). Each Pokémon can use its ultimate once per set of downs. A first down, change of possession, or halftime kickoff recharges both teams. Ordinary downs and other quarter changes preserve spent charges. Expand **YOUR ULTIMATES** to see readiness; live move callouts, elemental effects and a power-up sound announce activations.
- Live box scores track passing, rushing, receiving, defense, blocking, and ultimate uses (ULT).
- Successful defensive counters show the defender charging the QB, firing their elemental signature, and knocking the QB down, with synchronized ultimate/impact sounds. A counter callout and a 1.25-second real-time hold keep the hit visible at 4×; highlight replays follow.
- Touchdowns, made field goals, and safeties get a 4.8-second celebration: the scorer performs a species-specific victory dance (151 stable routines), the stadium scoreboard switches to a synchronized Dance Cam close-up, teammates jump, fans cheer, confetti flies, a fanfare plays, and the updated score appears with the scorer. This real-time pause lasts at every broadcast speed; pause freezes it and reduced effects keeps the readable score moment without the extra motion. Highlights replay afterwards, then the next drive begins automatically in Auto mode.
- The side-on 16-bit stadium includes a packed illustrated grandstand, animated foreground fans and flags, touchdown cheers, sunset floodlights, a live stadium scoreboard, and crisp rendering on high-density screens. It also includes route previews, ball flight, catches, pursuit, jukes, tackles, and touchdown celebrations. Play choices change passing depth, release timing, completion risk, and rushing lanes.
- Stadium Radio has two original 130 BPM, 64-bar arrangements: Victory Voltage (SNES Battle Mix) and Midnight Rival (SNES Boss Mix). Thirteen procedural 16-bit PCM instruments supply synth leads, electric keys, brass, pads, bells, bass and a full drum kit, with distorted power chords, galloping bass, harmonic-minor leads, rapid arpeggios, stereo placement, reverb and touchdown fanfares. The full rhythm section hits on the first beat. Music and sound effects have separate controls.
- Field FX include voiced “Ready, set, hike” cadence, the snap, passing whoosh, catch pop, tackle impact, kicks, whistles and touchdown cheers. FX start enabled after a click/tap and save their own mute preference. Cadence remains readable at every broadcast speed.
- Field players are about 55% larger for recognizable silhouettes. All 151 species use real eight-direction PMDCollab sprite sheets, with idle, movement, action and hurt animations. Players face their travel direction, including diagonals, and turn on possession changes. See [animation credits](dist/sprite-credits.html) and the bundled license.

Version 1.0 simulates matches against the computer. Country selection and guest play are available. The account system supports email/password and Google sign-in; enabling those providers requires the separate Auth project setup in [docs/accounts.md](docs/accounts.md). Signed-in profiles and server-verified match records use a shared Cloudflare D1 leaderboard. Guest results are never recorded. Friend-versus-friend play is planned for a later version.

## Run locally

For the complete game and API, use the pinned Wrangler CLI after applying local D1 migrations (see [DEPLOYMENT.md](DEPLOYMENT.md)). A static-only guest preview can also serve `dist/`:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Music starts after a click or tap.

## Validate

Node.js 22.13+ runs the checks (the league check uses built-in SQLite):

```sh
node tests/game.cjs
node tests/ultimates.cjs
node tests/defense.cjs
node tests/motion.cjs
node tests/music.cjs
node tests/draft.cjs
node tests/render.cjs
node tests/playbook.cjs
node tests/stadium.cjs
node tests/dances.cjs
node tests/fx.cjs
node tests/sprites.cjs
node tests/account.cjs
node tests/league.mjs
```

The checks cover full-game termination and reconciled box scores across 500 games, animation invariants across thousands of frames, both 64-bar stereo arrangements, distinct PCM instruments, bounded instrument caching, output-device sample-rate compatibility, audio lifecycle behavior, and 100 additional games with distinct drafted teams. Draft checks cover all 151 species at all 16 positions, saved lineups, duplicate prevention, assigned player animations, and stat reconciliation. The browser rendering loop also runs 12 complete drafted matches across Coach and Auto modes, including highlight replay transitions, waiting without consuming downs, and pause behavior, with a canvas mock that rejects invalid drawing coordinates. Counter checks cover all 25 offense/defense combinations on both teams, uniform 5–10-yard losses, charge exhaustion and fallback defenders, safeties, special teams, hidden CPU choices and deterministic ranked histories containing defensive calls. Playbook checks exercise 2,500 outcomes, compare actual pass depth and completion risk, and verify route previews and both horizontal attack directions. Field FX checks verify one-shot cue timing at all three speeds, replay cadence suppression, mute and outcome-specific sounds. Sprite checks validate 602 eight-direction atlases covering every Kanto species, frame timing and changes in facing. GitHub Actions runs these checks on pushes and pull requests.

## Source

| File | Purpose |
| --- | --- |
| `dist/ultimates.js` | Fixed signature moves for all 151 species and position skill effects |
| `dist/sim.js` | Roster, ratings, outcomes, and match statistics |
| `dist/kanto.js` | Bundled traits for all 151 Kanto species |
| `dist/draft.js` | Position projections, unique picks, Auto Draft, and computer rosters |
| `dist/draft-ui.js` | Draft interface and local lineup persistence |
| `scripts/build-kanto.py` | Regenerate species traits from PokeAPI CSV tables |
| `dist/motion.js` | Play choreography, route plans, and animation frames |
| `dist/stadium.js` | Horizontal projection, generated grandstand, animated crowd and retina rendering |
| `docs/stadium-art.md` | Stadium asset provenance and generation prompt |
| `dist/music.js` | Original procedural Web Audio soundtrack |
| `dist/fx.js` | Synchronized field effects and quarterback cadence |
| `dist/sprites.js` | Eight-way facing and sprite animation playback |
| `dist/sprite-data.js` | Atlas metadata for all 151 species |
| `scripts/import-directional-sprites.py` | Reimport pinned PMDCollab atlases and credits (Python + Pillow + curl) |
| `dist/account.js` | Managed sign-in, country profiles, guest mode and league UI |
| `dist/league.js` | Shared deterministic ranked-match rules |
| `worker/index.mjs` | Authenticated profile and match APIs; public leaderboard |
| `migrations/0001_league.sql` | Persistent profiles, matches and standings |
| `dist/game.js` | Canvas rendering, broadcast controls, and interface |
| `tests/` | Simulation, animation, and music checks |
| `wrangler.jsonc` | Cloudflare Worker, assets and D1 configuration |

See [DEPLOYMENT.md](DEPLOYMENT.md) for publishing instructions. The public game loads without a GitHub, Cloudflare, or ChatGPT login.

## Credits

Created by [James Kuk (@nolaseoul)](https://github.com/nolaseoul). Fan-made football ratings are inspired by Pokémon designs and are not official Pokémon statistics. Species traits are sourced from [PokeAPI data](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv); football projections use fictional formulas. Sprites are sourced from [PokeAPI](https://github.com/PokeAPI/sprites). Pokémon names, characters, and sprites belong to their respective owners. The soundtrack consists of original compositions and procedural instruments, with no official game recordings or samples. Stadium grandstand art was generated with ImageGen; see [artwork notes](docs/stadium-art.md).
