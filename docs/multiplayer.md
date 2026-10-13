# Friend duels and team links

**Share team** encodes the team name and 22 ordered Pokémon IDs in a versioned URL fragment. It does not include a password, account or match token. Loading a link shows a preview; the recipient chooses whether to replace their saved draft. Incoming lineups and names are validated before use.

**Invite friend · 1v1** locks the host’s draft in a private Cloudflare Durable Object room. The friend opens the link, builds their own lineup and presses **Lock team & join duel**. Both players may play as guests. Each down requires one offensive call and one defensive counter; the server keeps both calls private until both coaches lock them. The server then simulates the down once. Each browser renders that outcome from its own team’s perspective; scores, stats and ultimate charges come from the same authoritative snapshot.

Invite URLs contain only a random room ID. Private 72-character coach tokens stay in local browser storage and request headers. A third coach cannot join a full room. Refreshing the invitation in the original browser restores your seat and current down. Closing a browser leaves the other coach waiting; reopen the invite to resume. There is no automatic CPU substitution or forfeit. Calls are locked once submitted. Both coaches must acknowledge special-team downs as well. Replays can be skipped independently without changing the match result.

Rooms expire 12 hours after creation and their storage is cleared by an alarm. Duels are friendly and do not count toward account standings. Team names remain device preferences; they are separate from account coach names.

Run `node tests/pvp.mjs` for two-client lifecycle, complete matches, hidden-call checks, concurrency, rejoin and expiry verification. The deployment must include the `PVP` Durable Object binding and the `pvp-v1` SQLite-class migration in `wrangler.jsonc`.
