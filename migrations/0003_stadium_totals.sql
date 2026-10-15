-- Anonymous aggregate activity. No coach, country, email, score or play history.
CREATE TABLE stadium_totals (
 id INTEGER PRIMARY KEY CHECK(id=1),
 games INTEGER NOT NULL DEFAULT 0,
 touchdowns INTEGER NOT NULL DEFAULT 0,
 tackles INTEGER NOT NULL DEFAULT 0,
 since TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO stadium_totals(id) VALUES(1);
CREATE TABLE stadium_games (
 id TEXT PRIMARY KEY,
 mode TEXT NOT NULL CHECK(mode IN ('guest','ranked','friend')),
 touchdowns INTEGER NOT NULL CHECK(touchdowns>=0),
 tackles INTEGER NOT NULL CHECK(tackles>=0)
);
CREATE TRIGGER stadium_game_count AFTER INSERT ON stadium_games BEGIN
 UPDATE stadium_totals SET games=games+1,touchdowns=touchdowns+NEW.touchdowns,tackles=tackles+NEW.tackles WHERE id=1;
END;
-- Temporary guest replay tickets expire after 48 hours and are deleted on completion.
CREATE TABLE stadium_tickets (
 id TEXT PRIMARY KEY,
 seed INTEGER NOT NULL,
 lineup TEXT NOT NULL,
 opponent TEXT NOT NULL,
 expires INTEGER NOT NULL
);
CREATE INDEX stadium_ticket_expiry ON stadium_tickets(expires);
