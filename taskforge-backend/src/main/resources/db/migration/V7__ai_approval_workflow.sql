-- Module: AI instruction box + human approval gate + pipeline chaining.
--
-- Replaces the implicit "comment thread" mental model for AI-assigned work
-- with an explicit state machine: a human gives an AI agent instructions,
-- the agent delivers real output (including real files, not just markdown),
-- a human reviews and either approves (which automatically enqueues the
-- next agent in the pipeline for that issue) or requests changes (which
-- re-queues the SAME agent with the human's note appended as new context).

ALTER TABLE ai_agent_executions ADD COLUMN instructions TEXT;
ALTER TABLE ai_agent_executions ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED'
    CHECK (approval_status IN ('NOT_REQUIRED','PENDING_REVIEW','APPROVED','CHANGES_REQUESTED'));
ALTER TABLE ai_agent_executions ADD COLUMN approved_by UUID REFERENCES organization_members(id);
ALTER TABLE ai_agent_executions ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE ai_agent_executions ADD COLUMN review_note TEXT;

ALTER TABLE ai_task_queue ADD COLUMN instructions TEXT;

CREATE TABLE ai_generated_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_generated_files_execution ON ai_generated_files(execution_id);
CREATE INDEX idx_ai_executions_approval ON ai_agent_executions(issue_id, approval_status);
