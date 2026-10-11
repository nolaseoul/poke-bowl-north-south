CREATE TABLE profiles (
 user_id TEXT PRIMARY KEY,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 20),
 country TEXT NOT NULL CHECK(length(country) = 2),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE matches (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES profiles(user_id),
 seed INTEGER NOT NULL,
 lineup TEXT NOT NULL,
 started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 completed_at TEXT,
 points_for INTEGER,
 points_against INTEGER,
 plays INTEGER,
 CHECK((completed_at IS NULL AND points_for IS NULL AND points_against IS NULL) OR
       (completed_at IS NOT NULL AND points_for >= 0 AND points_against >= 0 AND plays > 0))
);
CREATE INDEX matches_user ON matches(user_id, completed_at);
CREATE VIEW standings AS
 SELECT p.user_id, p.name, p.country, count(m.id) AS games,
 coalesce(sum(m.points_for > m.points_against),0) AS wins,
 coalesce(sum(m.points_for < m.points_against),0) AS losses,
 coalesce(sum(m.points_for = m.points_against),0) AS draws,
 coalesce(sum(CASE WHEN m.points_for > m.points_against THEN 3 WHEN m.points_for = m.points_against THEN 1 ELSE 0 END),0) AS trophies,
 coalesce(sum(m.points_for-m.points_against),0) AS differential
 FROM profiles p LEFT JOIN matches m ON m.user_id=p.user_id AND m.completed_at IS NOT NULL GROUP BY p.user_id;
