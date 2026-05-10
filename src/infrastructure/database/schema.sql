CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(11) UNIQUE;

CREATE TABLE IF NOT EXISTS exercises (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(100),
  body_part   VARCHAR(100),
  equipment   VARCHAR(100),
  level       VARCHAR(50),
  rating      NUMERIC(3, 1),
  rating_desc VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS workouts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  goal        VARCHAR(100),
  difficulty  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id           SERIAL PRIMARY KEY,
  workout_id   INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
  position     INTEGER NOT NULL DEFAULT 1,
  sets         INTEGER,
  reps         INTEGER,
  duration_sec INTEGER,
  notes        TEXT
);

ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS rest_time_sec INTEGER DEFAULT 60;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workouts_updated_at ON workouts;
CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO users (name, email, cpf)
VALUES ('Demo User', 'demo@gymworkout.ai', '11144477735')
ON CONFLICT (email) DO UPDATE SET cpf = EXCLUDED.cpf;

CREATE TABLE IF NOT EXISTS user_profile (
  user_id               INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_muscles     TEXT[],
  preferred_difficulty  VARCHAR(50),
  preferred_equipment   TEXT[],
  default_num_exercises INTEGER,
  goals_mentioned       JSONB,
  last_summary          TEXT,
  last_summary_at       TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
