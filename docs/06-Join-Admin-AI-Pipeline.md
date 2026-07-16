# Module 2 — Organization Join Flow, Platform Admin, AI Approval Pipeline

## 1. Organization join-by-code

Every organization gets an 8-character join code at creation (`Organization.joinCode`, generated from an unambiguous alphabet with no `0/O/1/I`). An employee submits `POST /api/v1/join-requests {joinCode, requestedRoleCode, message}` using their identity-only token (they aren't a member yet, so no org-scoped context exists). This creates a `PENDING` `JoinRequest` row and notifies every `ORG_OWNER`/`ORG_ADMIN` in that org in real time via the existing notification system.

An admin reviews requests at `GET /organizations/{id}/join-requests` and calls `.../approve` or `.../reject`. Approval is the only thing that actually creates the `OrganizationMember` row — nothing about submitting a request grants access on its own. A database-level partial unique index (`idx_join_requests_one_pending`) guarantees a user can't spam multiple pending requests to the same org, enforced even under concurrent requests, not just in application code.

This is deliberately a separate table and flow from the existing `invitations` (Module 1) — invitations are admin-initiated (an admin invites a specific email/link), join requests are employee-initiated (an employee has a code and asks to join). Both funnel into the same `OrganizationMember` creation path.

## 2. Platform Admin

A structurally separate identity tier — `platform_admins` is its own table, never a role inside any organization's RBAC. This is a deliberate tenant-isolation decision: if "platform admin" were just another org role, a misconfigured or compromised organization's role/permission setup could theoretically grant platform-wide reach. Keeping it in a separate table with its own JWT claim (`type: "PLATFORM_ADMIN"`) makes that structurally impossible.

- `POST /api/v1/admin/auth/login` — separate login endpoint, separate token type
- `GET /api/v1/admin/organizations` — every organization on the platform, with live member/AI-agent counts
- `POST /api/v1/admin/organizations/{id}/suspend` / `/reactivate`
- `GET /api/v1/admin/stats` — platform-wide totals

Every `@PreAuthorize("hasAuthority('PLATFORM_ADMIN')")` check requires the platform-admin token type specifically — a regular user's org-scoped token, no matter how privileged inside their own org, cannot satisfy it.

A default seed account ships for local development: `admin@taskforge.local` / `ChangeMe123!` — change this before any real deployment.

## 3. AI instruction box + approval pipeline

Replaces "leave a comment and hope" with an explicit state machine:

1. A human gives an agent **instructions** (`AIAgentController.InvokeRequest.instructions`) — stored on both the queue entry and the resulting execution record, and passed into `AgentContext` so the agent actually sees it, not just the issue's static title/description.
2. The agent delivers real output: a comment, optional sub-issues, and — for CodeAI — real files, now persisted structurally in `ai_generated_files` rather than existing only as markdown code fences.
3. For pipeline agents (`CODE_AI → REVIEWER_AI → TESTER_AI → DOCUMENTATION_AI`, defined explicitly in `AIPipeline`), the execution lands in `PENDING_REVIEW` instead of silently continuing.
4. A human calls `.../executions/{id}/approve` — this automatically enqueues the next agent in the pipeline. Or `.../request-changes {note}` — this re-queues the **same** agent with the reviewer's note folded into new instructions, a directed retry rather than a blind one.
5. `.../executions/{id}/download` streams a real zip (`java.util.zip`, no external dependency, no extra process) of every file that execution produced.

`ArchitectAI` and `ProjectManagerAI` remain entry points triggered by issue events, not part of this linear approval chain — they inform the work, they don't implement it, so gating them behind approval wouldn't match how they're actually used.
