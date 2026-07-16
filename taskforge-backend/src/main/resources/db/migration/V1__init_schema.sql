CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER','ADMIN','MEMBER','GUEST')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    key VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(10) NOT NULL DEFAULT 'KANBAN' CHECK (type IN ('SCRUM','KANBAN')),
    next_issue_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ,
    UNIQUE (workspace_id, key)
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ai_agent_type VARCHAR(30),
    role VARCHAR(20) NOT NULL CHECK (role IN ('PROJECT_OWNER','DEVELOPER','TESTER','AI_AGENT','VIEWER')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(15) NOT NULL CHECK (category IN ('TODO','IN_PROGRESS','DONE')),
    position INT NOT NULL,
    color VARCHAR(10)
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_key VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('EPIC','STORY','TASK','SUBTASK','BUG')),
    parent_issue_id UUID REFERENCES issues(id),
    epic_id UUID REFERENCES issues(id),
    status_id UUID NOT NULL REFERENCES workflow_statuses(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOWEST','LOW','MEDIUM','HIGH','HIGHEST')),
    story_points INT,
    assignee_id UUID REFERENCES users(id),
    assignee_is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    assignee_ai_type VARCHAR(30),
    reporter_id UUID REFERENCES users(id),
    reporter_is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    reporter_ai_type VARCHAR(30),
    due_date DATE,
    board_position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE (project_id, issue_key)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    author_is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    author_ai_type VARCHAR(30),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id),
    actor_id UUID REFERENCES users(id),
    actor_is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    actor_ai_type VARCHAR(30),
    action_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link VARCHAR(500),
    actor_id UUID,
    actor_is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_task_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    agent_type VARCHAR(30) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','DONE','FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE TABLE ai_agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    agent_type VARCHAR(30) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
    output_summary TEXT,
    model_used VARCHAR(50),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issues_project ON issues(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_assignee ON issues(assignee_id);
CREATE INDEX idx_comments_issue ON comments(issue_id);
CREATE INDEX idx_activity_issue ON activity_logs(issue_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_ai_queue_status ON ai_task_queue(status);
CREATE INDEX idx_ai_exec_issue ON ai_agent_executions(issue_id);

-- Seed the 5 default Kanban statuses for any new project (applied by ProjectService at project-creation time,
-- this migration only documents the expected category values used everywhere else in the codebase).
