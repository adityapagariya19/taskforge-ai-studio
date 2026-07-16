-- Module 1: Organizations, Departments, Teams, full RBAC, Invitations, Audit Log.
-- This migration also retrofits workspaces to belong to an organization (the
-- tenant root) instead of floating free.

-- ===================== ORGANIZATIONS =====================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id),
    plan_tier VARCHAR(20) NOT NULL DEFAULT 'FREE' CHECK (plan_tier IN ('FREE','TEAM','BUSINESS','ENTERPRISE')),
    status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED')),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== ROLES & PERMISSIONS =====================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system template
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, code)
);
-- Partial unique index so two system templates (organization_id IS NULL) can't share a code,
-- while still allowing each org to have its own row with the same code post-cloning.
CREATE UNIQUE INDEX idx_roles_system_code ON roles(code) WHERE organization_id IS NULL;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ===================== DEPARTMENTS & TEAMS =====================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    parent_department_id UUID REFERENCES departments(id),
    lead_organization_member_id UUID, -- FK added after organization_members exists below
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    name VARCHAR(150) NOT NULL,
    lead_organization_member_id UUID, -- FK added after organization_members exists below
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== ORGANIZATION MEMBERS (humans + AI, unified) =====================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- NULL when is_ai = true
    is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ai_agent_type VARCHAR(30), -- set when is_ai = true
    role_id UUID NOT NULL REFERENCES roles(id),
    department_id UUID REFERENCES departments(id),
    job_title VARCHAR(150),
    employment_status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE'
        CHECK (employment_status IN ('ACTIVE','INVITED','SUSPENDED','REMOVED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ,
    CHECK ( (is_ai = FALSE AND user_id IS NOT NULL) OR (is_ai = TRUE AND ai_agent_type IS NOT NULL) ),
    UNIQUE (organization_id, user_id)
);

ALTER TABLE departments ADD CONSTRAINT fk_dept_lead
    FOREIGN KEY (lead_organization_member_id) REFERENCES organization_members(id);
ALTER TABLE teams ADD CONSTRAINT fk_team_lead
    FOREIGN KEY (lead_organization_member_id) REFERENCES organization_members(id);

CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    organization_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, organization_member_id)
);

-- ===================== INVITATIONS =====================

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role_id UUID NOT NULL REFERENCES roles(id),
    invited_by UUID NOT NULL REFERENCES organization_members(id),
    token VARCHAR(64) NOT NULL UNIQUE,
    method VARCHAR(10) NOT NULL CHECK (method IN ('EMAIL','LINK','CODE')),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','REVOKED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- ===================== AUDIT LOG (single append-only ledger for the whole platform) =====================

CREATE TABLE audit_logs_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_organization_member_id UUID REFERENCES organization_members(id),
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Named audit_logs_v2 to avoid colliding with the existing per-issue `activity_logs`
-- table from Module "issue tracking" (different purpose: that one is a human/AI
-- readable timeline per issue; this one is a compliance-grade ledger per org).

-- ===================== RETROFIT: workspaces now belong to an organization =====================

ALTER TABLE workspaces ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- Backfill strategy for any pre-existing dev data: create one organization per
-- existing workspace owner and attach their workspace(s) to it, so this
-- migration never destroys local dev data created before Module 1 existed.
DO $$
DECLARE
    ws RECORD;
    new_org_id UUID;
BEGIN
    FOR ws IN SELECT * FROM workspaces WHERE organization_id IS NULL LOOP
        INSERT INTO organizations (name, slug, owner_id)
        VALUES (ws.name || ' Org', ws.slug || '-org-' || substr(ws.id::text, 1, 8), ws.owner_id)
        RETURNING id INTO new_org_id;
        UPDATE workspaces SET organization_id = new_org_id WHERE id = ws.id;
    END LOOP;
END $$;

ALTER TABLE workspaces ALTER COLUMN organization_id SET NOT NULL;

-- ===================== INDEXES =====================

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role_id);
CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_audit_v2_org ON audit_logs_v2(organization_id, created_at DESC);
CREATE INDEX idx_workspaces_org ON workspaces(organization_id);
