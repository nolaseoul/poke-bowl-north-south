# Stadium audio

Both original 64-bar tracks play at **120 BPM**, independently of simulation speed. Instruments use procedural 32 kHz, 16-bit-quantized PCM. The lead and brass have fast attacks and richer upper harmonics; short releases, staccato bass, sharper drum transients and reduced reverb keep notes defined. No official game music or recordings are included.

Field effects are independent of music. `dist/fx.js` synthesizes the snap, passing whoosh, catch pop, tackle impact, kicks, cheers and whistles. Cues cross the same simulation timestamps used by ball and player animation, once per event. Incomplete passes have no catch or tackle cue; sacks have no throw. Replay effects are quieter and do not repeat live quarterback cadence. Pausing or muting stops active FX voices.

The three bundled quarterback calls in `dist/assets/fx-{ready,set,hike}.wav` were generated locally with macOS `say`, voice `Reed (English (US))`, at 230 words/minute (Ready and Set) and 240 (Hike). They were converted to mono 22,050 Hz signed 16-bit WAV using `afconvert`, trimmed, peak-normalized to 26,000/32,767 and given short edge fades. A procedural cadence fallback plays if a clip cannot load. No voice service or runtime network dependency is needed.

Pre-snap cadence has a 0.85-second lead-in and stays at real-time speed so words remain intelligible at 1×, 2× and 4×. Live play accelerates after the snap. Browser playback begins after a user click/tap; the FX button saves its own mute preference.
