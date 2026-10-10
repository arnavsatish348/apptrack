CREATE TABLE IF NOT EXISTS applications (
    id           SERIAL PRIMARY KEY,
    company      TEXT        NOT NULL,
    role         TEXT        NOT NULL,
    track        TEXT        NOT NULL DEFAULT 'full-stack',
    location     TEXT,
    work_setup   TEXT,
    job_url      TEXT,
    status       TEXT        NOT NULL DEFAULT 'applied',
    applied_on   DATE        NOT NULL DEFAULT CURRENT_DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('saved','applied','interview','offer','rejected','ghosted'))
);

-- Every status change is recorded so the app can show a timeline and response rates
CREATE TABLE IF NOT EXISTS status_history (
    id              SERIAL PRIMARY KEY,
    application_id  INTEGER     NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status     TEXT,
    to_status       TEXT        NOT NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_history_application ON status_history(application_id);
