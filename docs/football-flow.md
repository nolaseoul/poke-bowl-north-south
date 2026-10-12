# Coin toss, kicking and conversions

New CPU matches, ranked tickets and friend rooms use football rules version 3.
Previously issued ranked tickets and existing friend rooms keep their original
rules so a deployment cannot change a game already in progress. The rules
version is persisted with the ranked lineup or durable room, never taken from
an untrusted finish payload. No database migration is required.

The opening coach calls heads or tails. The seeded toss winner chooses kick or
receive. The opening receiver kicks after halftime. A kickoff uses a horizontal
power meter and an animated flight/return: power changes the landing point,
a deep kick gives a touchback at the 25, and shorter kicks allow a return.

A touchdown awards six points and holds possession for the conversion choice:

- Extra point: a vertical arrow moves up and down. Stop it in the green middle
  24% of the meter to add one point. Outside that zone misses.
- Two points: one normal offensive play from the 2-yard line, with the opposing
  coach able to choose a counter. Crossing the goal line adds two points.
  Conversion rushing/passing yards and TDs do not inflate ordinary box scores.

After either attempt, the scoring team kicks to the other team. Field goals
also lead to a kickoff; the team conceding a safety kicks away. A conversion
still takes place when a touchdown uses the final seconds of a half or game.
The final whistle follows that conversion; a finished game has no extra kickoff.

Auto controls both sides' decisions and meters. CPU decisions proceed in Coach
mode when the computer owns the action. Pause freezes meters and coin reveals;
broadcast speed cannot accelerate the player's meter. Touch/click and Space
can stop a kick meter. The pause button remains above the mobile meter panel.

In PvP, the server verifies which coach owns a coin/receive/conversion/kick
choice. These decisions resolve once, while scrimmage and two-point calls still
require both hidden choices. Each action is durable and replayed from the room
seed. Snapshots rotate actor, winner and receiving-team identities for the
visiting coach. Ranked histories likewise replay every decision and kick value.

The red-zone camera continues following through the goal line. Inside the
opponent's 22, it gives the end zone extra space, including at the cropped
mobile viewport. Defensive pre-snap positions stop at the back of the end zone.

Verification: `tests/football.cjs` covers 100 complete new-rules replays and
forced final-play/halftime/FG/safety/try cases; `tests/pvp.mjs` covers new and
legacy room clients; `tests/league.mjs` saves both ticket formats through SQL.
`tests/render.cjs` drives complete Coach/Auto matches, replays, celebrations and
meters. Browser checks exercise mobile and desktop controls and both end zones.
