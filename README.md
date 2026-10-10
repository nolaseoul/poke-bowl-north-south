# Poké Bowl

A horizontal Pokémon football game for desktop and mobile browsers. Call the plays, then watch your Pokémon execute automatically.

**[Play the public game](https://poke-bowl-north-south.freshcut-revival.workers.dev/)** · **[Project board](https://github.com/users/nolaseoul/projects/1)**

## Watch a match

A new browser automatically gets **22 unique starters from the 151 Kanto species**, with randomized picks for every offensive and defensive position. Swap any starter, select **RE-DRAFT** for a fresh team, or use **AUTO DRAFT** to fill an incomplete lineup. Select **LOCK LINEUP & KICK OFF** to start. The computer drafts a separate roster from the Pokémon you leave behind. Your lineup is saved on this browser.

**Coach mode** waits for your offensive play call. Choose Inside Run, Quick Pass, Deep Pass, Play Action, or Outside Run, preview the routes, then select **CALL PLAY**. Your team passes, runs, blocks, and defends automatically. Rocket Red calls its own plays. Special teams handle punts and field goals on fourth down.

Switch **AUTO** on to watch an uninterrupted four-quarter game with both teams calling their own plays. Select 1×, 2×, or 4× broadcast speed, or pause the match. Kanto Blue attacks right and Rocket Red attacks left; possession changes turn the horizontal field around. Phones support portrait and landscape, with a horizontally scrolling playbook.

- Every prospect has athletic ratings and different football skills and overall ratings for each position. Search by name or Pokédex number, filter by type, and compare position fit, speed, or strength.
- Scout both teams, replace individual starters, and undo a cleared lineup.
- Live box scores track passing, rushing, receiving, defense, and blocking.
- The side-on pixel stadium includes route previews, ball flight, catches, pursuit, jukes, tackles, and touchdown celebrations. Play choices change passing depth, release timing, completion risk, and rushing lanes.
- Pocket Stadium Radio has two original Game Boy-style tracks and touchdown fanfares, with separate music and sound-effect controls.

Version 1.0 is a local browser simulation against the computer. Friend-versus-friend play is planned for a later version.

## Run locally

No dependencies or build step are needed. Serve `dist/` with any static web server, for example:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Music starts after a click or tap.

## Validate

Node.js runs the dependency-free checks:

```sh
node tests/game.cjs
node tests/motion.cjs
node tests/music.cjs
node tests/draft.cjs
node tests/render.cjs
node tests/playbook.cjs
```

The checks cover full-game termination and reconciled box scores across 500 games, animation invariants across thousands of frames, both chiptune arrangements plus audio lifecycle behavior, and 100 additional games with distinct drafted teams. Draft checks cover all 151 species at all 16 positions, saved lineups, duplicate prevention, assigned player animations, and stat reconciliation. The browser rendering loop also runs 12 complete drafted matches across Coach and Auto modes, including highlight replay transitions, waiting without consuming downs, and pause behavior, with a canvas mock that rejects invalid drawing coordinates. Playbook checks exercise 2,500 outcomes, compare actual pass depth and completion risk, and verify route previews and both horizontal attack directions. GitHub Actions runs these checks on pushes and pull requests.

## Source

| File | Purpose |
| --- | --- |
| `dist/sim.js` | Roster, ratings, outcomes, and match statistics |
| `dist/kanto.js` | Bundled traits for all 151 Kanto species |
| `dist/draft.js` | Position projections, unique picks, Auto Draft, and computer rosters |
| `dist/draft-ui.js` | Draft interface and local lineup persistence |
| `scripts/build-kanto.py` | Regenerate species traits from PokeAPI CSV tables |
| `dist/motion.js` | Play choreography, route plans, and animation frames |
| `dist/stadium.js` | Horizontal projection and side-on pixel stadium renderer |
| `dist/music.js` | Original procedural Web Audio soundtrack |
| `dist/game.js` | Canvas rendering, broadcast controls, and interface |
| `tests/` | Simulation, animation, and music checks |
| `wrangler.jsonc` | Cloudflare static asset deployment |

See [DEPLOYMENT.md](DEPLOYMENT.md) for publishing instructions. The public game loads without a GitHub, Cloudflare, or ChatGPT login.

## Credits

Created by [James Kuk (@nolaseoul)](https://github.com/nolaseoul). Fan-made football ratings are inspired by Pokémon designs and are not official Pokémon statistics. Species traits are sourced from [PokeAPI data](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv); football projections use fictional formulas. Sprites are sourced from [PokeAPI](https://github.com/PokeAPI/sprites). Pokémon names, characters, and sprites belong to their respective owners. The soundtrack consists of original compositions, with no official game recordings or samples.
