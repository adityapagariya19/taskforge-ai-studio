-- Module: Sprint Management.
-- Adds a real sprints table (none existed previously) and links issues to
-- sprints. Status lifecycle is enforced in SprintService, not just by the
-- CHECK constraint: PLANNED -> ACTIVE -> COMPLETED, no skipping, no two
-- ACTIVE sprints per project at once (enforced in application code since
-- that rule spans multiple rows and can't be a single-row CHECK constraint).

CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','ACTIVE','COMPLETED')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CHECK (end_date >= start_date)
);

ALTER TABLE issues ADD COLUMN sprint_id UUID REFERENCES sprints(id);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_project_status ON sprints(project_id, status);
CREATE INDEX idx_issues_sprint ON issues(sprint_id);

-- A project may have at most one ACTIVE sprint at a time — enforced at the
-- database level too (not just in application code) via a partial unique
-- index, so this invariant holds even under concurrent requests.
CREATE UNIQUE INDEX idx_sprints_one_active_per_project
    ON sprints(project_id) WHERE status = 'ACTIVE';
