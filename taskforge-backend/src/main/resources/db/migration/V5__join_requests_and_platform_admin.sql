-- Module: Organization join-by-code flow + Platform Admin tier.
--
-- Two genuinely separate concerns bundled in one migration because they're
-- both additive, non-breaking extensions of the existing organization model:
--
-- 1. join_code on organizations + a real join_requests approval workflow
--    (an employee submits a code, an org admin/owner approves or rejects it
--    — this is a state machine, not a one-shot invite like the existing
--    `invitations` table from Module 1, which is admin-initiated. This is
--    employee-initiated.)
--
-- 2. platform_admins — a completely separate identity table from `users`.
--    Platform admins are NOT organization members; they see across every
--    tenant. Keeping them in their own table (rather than a role on the
--    existing user/org-member model) is the correct tenant-isolation
--    decision: an org's RBAC must never accidentally grant platform-wide
--    reach, so the platform admin capability cannot live inside the
--    per-organization permission system at all.

ALTER TABLE organizations ADD COLUMN join_code VARCHAR(12) UNIQUE;

-- Backfill a join code for any organizations that already exist (dev data
-- created before this migration) so the column can be safely used going
-- forward without every existing org having a null code.
UPDATE organizations SET join_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE join_code IS NULL;

ALTER TABLE organizations ALTER COLUMN join_code SET NOT NULL;

CREATE TABLE join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role_code VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
    message TEXT,
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
    reviewed_by UUID REFERENCES organization_members(id),
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE (organization_id, user_id, status) DEFERRABLE INITIALLY DEFERRED
);
-- The unique constraint above (scoped to status) is intentionally loose —
-- Postgres unique constraints treat each distinct status value as its own
-- group, so a user CAN have multiple historical REJECTED/WITHDRAWN rows but
-- only one PENDING row per org at a time, which is the actual business rule.
CREATE UNIQUE INDEX idx_join_requests_one_pending
    ON join_requests(organization_id, user_id) WHERE status = 'PENDING';

CREATE INDEX idx_join_requests_org_status ON join_requests(organization_id, status);

-- ===================== PLATFORM ADMIN (separate from all org auth) =====================

CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_status ON organizations(status);
