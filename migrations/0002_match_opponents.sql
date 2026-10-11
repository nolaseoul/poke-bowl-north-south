-- Keep the chosen opponent authoritative for replay verification. Old games remain random.
ALTER TABLE matches ADD COLUMN opponent TEXT NOT NULL DEFAULT 'random';
