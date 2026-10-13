# Stadium presentation

The opening stadium menu takes visual cues from arcade football title screens, including the ALL-22 PRO reference: a large dimensional title, floodlit crowd, focused play menu and prominent characters. The layout and soundtrack are original to this project.

Field animation remains the credited eight-direction PMDCollab artwork. Logical directions use S/SW/W/NW/N/NE/E/SE, while the source atlas rows use S/SE/E/NE/N/NW/W/SW. `SpriteBank` maps between these orders before looking up either the image cell or its foot anchor. Formation facing overrides cached movement, engagement and dance directions through the snap boundary. East/west movement and blocking use the same conversion.

Live sprites are larger, with a dark edge shadow and selective name/position labels. Unmodified official-artwork portraits from PokeAPI/sprites are bundled for all 151 species and used in the title menu, scouting, draft selection and ultimate cut-ins. Their ownership is credited on the animation credits page. Portraits are illustrations; they do not replace directional gameplay animation.

Ultimate choreography uses the same server-resolved event and charge accounting. Each caster gets a scheduled moment based on its football role: a line engagement, QB release, handoff, catch or defensive hit. Charge poses plant the feet; effects draw above all players so the line cannot hide a strike. Electricity, fire, water/dragon, vines, psychic/ghost/fairy/poison, ice/rock/ground and physical/bug strikes have different visual forms. A caster marker, named field label, detailed portrait and sound cues identify the activation. Active windows run at 1x even when the broadcast is 2x/4x; pause and reduced effects are respected. Counter losses and once-per-set-of-downs limits are unchanged.

Friday Night Voltage is the new default original 130 BPM, 4/4 football arrangement, built from 16-bit PCM instruments. Sustained brass hooks, low bass, wide power chords, a marching snare cadence, tom fills and larger choruses replace the old default's high sixteenth-note lead. The two earlier tracks remain selectable, and audio mute/volume preferences persist. No audio from the reference site or Pokémon games is bundled.

Checks cover all 151 portraits, every elemental path on both teams, native atlas direction conversion, real-time ultimate readability at 4x, the account prompt after title entry, all three music arrangements and complete CPU/PvP game lifecycles.

## Quarter rumbles

`battle.js` schedules one cutaway per quarter at a roster-derived clock window,
after the completed football play, scoring celebration and any highlight. Its
separate seeded timeline lasts 6.4 real seconds at all broadcast speeds. Two
random opposing roster members trade six strikes, ending with two signature
ultimates and a zero-health pixel KO. The isometric diamond arena uses the
existing eight-direction artwork, plus red pixel splatter, sprite-colored
fragments, impact rings and smoke. `battle.css` supplies responsive health
bars, attack captions and an accessible Skip battle button.

The cutaway never calls the simulation RNG or changes football state. Ranked
call histories and old/new rules versions remain intact. PvP uses canonical
seat order when hashing the trigger, fighters and winner, then maps back into
each client's view. Rejoining a room skips already elapsed quarter windows.
Pause freezes the timeline; reduced effects retain health, attacks and the KO
without camera shake, movement, flying particles or smoke. First-down and
ultimate recharge rules continue exactly where the football play left them.

`tests/battle.cjs` verifies four varied rumbles across 50 full games, perspective
rotation, monotone health/KO, cue boundaries and finite rendering. The browser
loop test checks 48 actual rumbles at 4×, their real-time duration, pause and
unchanged scores, stats, plays and ranked histories during each cutaway.
