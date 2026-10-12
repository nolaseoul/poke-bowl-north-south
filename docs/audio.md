# Stadium audio

Both original 64-bar tracks play at **130 BPM**, independently of simulation speed. Instruments use procedural 32 kHz, 16-bit-quantized PCM. The lead and brass have fast attacks and richer upper harmonics; short releases, staccato bass, sharper drum transients and reduced reverb keep notes defined. No official game music or recordings are included.

Field effects are independent of music. `dist/fx.js` synthesizes the snap, passing whoosh, catch pop, tackle impact, kicks, cheers and whistles. Cues cross the same simulation timestamps used by ball and player animation, once per event. Incomplete passes have no catch or tackle cue; sacks have no throw. Replay effects are quieter and do not repeat live quarterback cadence. Pausing or muting stops active FX voices.

The four bundled quarterback calls in `dist/assets/fx-{ready,set,hut,hike}.wav` say **“Hut! Hut! Hut! HIKE-CHU!”**. The first three huts rise in pitch; the final two-syllable shout finishes at the snap. `scripts/build-cadence.py` generates original speech with the installed macOS `say` voice `Reed (English (US))`, then trims, repitches the voice/formants by 1.8–2.1×, adds a little vocal wobble and brightness, peak-normalizes, and fades the edges. Clips are mono 32 kHz signed 16-bit WAV; they play from bundled files without a voice service. The internal ready/set IDs are retained for compatibility. A higher-pitched two-syllable procedural fallback plays if a clip cannot load.

The first hut begins 0.8 seconds before the play clock reaches zero; the remaining huts follow at −0.46 and −0.12 seconds, then HIKE-CHU begins 0.32 seconds before the 0.55-second snap. The play has a 0.85-second lead-in and stays at real-time speed so words remain intelligible at 1×, 2× and 4×. Live play accelerates after the snap. Browser playback begins after a user click/tap; the FX button saves its own mute preference.

## 130 BPM battle revision

Both tracks now use original minor-key battle phrases, a full opening beat,
distorted plucked power chords, staccato octave bass, sharp harmonized leads,
fast arpeggios and tom/snare fills. Guitar and tom PCM patches expand the
palette to thirteen instruments. Playback tempo remains 130 BPM at every
simulation speed. The internal track IDs remain compatible with saved choices.

## Scoring and the stadium referee

Touchdowns, extra points, two-point conversions and field goals each have an original major-key victory hook at 130 BPM. `celebrationScore()` in `dist/music.js` arranges brass, bells, keys, guitar, pad, bass and stadium drums. The touchdown hook lasts about 3.8 seconds; conversion hooks are shorter. Music ducks underneath the stinger, which starts 0.45 seconds after the call so the voice has room. Stingers follow the music toggle and volume slider.

Seven original creature-style referee voice clips are bundled locally: **Touch! Down!**, **It's good!**, **Two points!**, **No good!**, **Call the toss!**, **Heads!** and **Tails!**. `scripts/build-announcer.py` uses the same installed macOS voice and PCM pipeline as the quarterback cadence, with a lower 1.42–1.52× repitch to keep the words clear. No game recordings or external voice service are used. Referee speech follows the separate FX mute control. Deferred decoding is cancelled when a play stops, so an old call cannot spill into a new match.

Calls and stingers fire once when the live result resolves. Highlights do not repeat them. The referee's signal stays visible for 3.2 real seconds; missed kicks and stopped two-point tries hold the broadcast for 2.2 real seconds without playing victory music. Pause freezes the signal and hold. The original red-capped pixel referee hosts the toss and signals touchdowns, successful kicks and failed tries; see `docs/referee-art.md`.
