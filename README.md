# Poké Bowl

A north–south, fully simulated Pokémon football game for desktop and mobile browsers.

**[Play the public game](https://poke-bowl-north-south.freshcut-revival.workers.dev/)** · **[Project board](https://github.com/users/nolaseoul/projects/1)**

## Watch a match

Open the game and select **WATCH MATCH**. Both teams call plays, pass, run, block, and defend automatically. Plays advance through a complete four-quarter game. Select 1×, 2×, or 4× broadcast speed, or pause the match.

- All 22 Pokémon have athletic ratings, position-specific skills, and scouting reports.
- Live box scores track passing, rushing, receiving, defense, and blocking.
- Animated plays include ball flight, catches, pursuit, jukes, tackles, and touchdown celebrations.
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
```

The checks cover full-game termination and reconciled box scores across 500 games, animation invariants across 76,106 frames, and both chiptune arrangements plus audio lifecycle behavior. GitHub Actions runs these checks on pushes and pull requests.

## Source

| File | Purpose |
| --- | --- |
| `dist/sim.js` | Roster, ratings, outcomes, and match statistics |
| `dist/motion.js` | Play choreography and animation frames |
| `dist/music.js` | Original procedural Web Audio soundtrack |
| `dist/game.js` | Canvas rendering, broadcast controls, and interface |
| `tests/` | Simulation, animation, and music checks |
| `wrangler.jsonc` | Cloudflare static asset deployment |

See [DEPLOYMENT.md](DEPLOYMENT.md) for publishing instructions. The public game loads without a GitHub, Cloudflare, or ChatGPT login.

## Credits

Created by [James Kuk (@nolaseoul)](https://github.com/nolaseoul). Fan-made football ratings are inspired by Pokémon designs and are not official Pokémon statistics. Sprites are sourced from [PokeAPI](https://github.com/PokeAPI/sprites). Pokémon names, characters, and sprites belong to their respective owners. The soundtrack consists of original compositions, with no official game recordings or samples.
