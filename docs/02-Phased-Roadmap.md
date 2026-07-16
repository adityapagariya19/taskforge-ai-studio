# TaskForge AI Studio — Phased Delivery Roadmap

Three phases, each independently demoable and resume-worthy on its own. Build in order — do not skip Phase 1.

---

## PHASE 1 — MVP ("Mini-Jira with real AI teammates")

**Goal:** prove the core loop — humans and AI agents collaborating on issues — works end to end, single workspace, single team.

### Features
- Auth: register/login/logout (JWT)
- One workspace, multiple projects
- Project members: humans (Project Owner, Developer, Tester) + AI agents added as members
- Issues: Epic/Story/Task/Subtask/Bug, with parent/child hierarchy
- Backlog list + basic Kanban board (drag-drop, fixed default columns: Backlog/To Do/In Progress/In Review/Done)
- Comments + @mentions (human and AI)
- Labels, priority, due dates
- **All 6 AI agents wired and functional** via Ollama (this is the differentiator — don't cut this for "later")
- Basic in-app notifications (no email yet)
- Unified activity timeline (human + AI)
- Dark/light theme toggle

### Architecture
- Single Spring Boot app, single Postgres instance, Ollama running locally, no Redis yet (in-memory rate limiting/cache acceptable), no message broker — `@Scheduled` poller for the AI task queue, `ApplicationEventPublisher` for in-process domain events.
- Frontend: single Vite/React app, no SSR needed.
- Deployment: `docker-compose up` locally. No cloud deploy required yet (optional: free-tier Render/Railway for a live demo link on your resume).

### Database tables (subset of full catalog)
`users`, `workspaces`, `workspace_members`, `projects`, `project_members`, `issues`, `workflow_statuses`, `sprints` (basic), `labels`, `issue_labels`, `comments`, `mentions`, `activity_logs`, `notifications`, `ai_agent_executions`, `ai_agent_suggestions`, `ai_task_queue`, `ai_agent_settings`

### APIs
Auth, Workspaces (basic), Projects, Members (incl. AI agent add), Issues (CRUD + transition), Board (get/move), Comments, Notifications (list/read), AI invoke (manual `@mention` trigger) — see full catalog in the Architecture Specification §8.

### UI screens
1. Login / Register
2. Workspace switcher + create workspace
3. Project list
4. Project Board (Kanban)
5. Issue detail panel (description, comments, activity, AI suggestions with Accept/Reject)
6. Backlog list
7. Member management (add human / add AI agent)
8. Notification bell + dropdown

### Development roadmap (suggested pace: evenings/weekends, ~8–10 weeks)
| Week | Milestone |
|---|---|
| 1 | Project setup, Java 21 + Spring Boot skeleton, Postgres + Flyway, Docker Compose |
| 2 | Auth (register/login/JWT/refresh), `users`/`workspace_members` |
| 3 | Workspaces, Projects, Members (incl. AI agent rows) |
| 4 | Issues CRUD + hierarchy + workflow statuses |
| 5 | Frontend skeleton, auth flow, project/board pages |
| 6 | Kanban board (drag-drop) + issue detail panel + comments |
| 7 | Ollama setup, `AIAgent` interface, wire **ArchitectAI** end-to-end first (highest demo value) |
| 8 | Wire remaining 5 agents (Code/Tester/Reviewer/Docs/PM), task queue worker |
| 9 | Activity timeline, notifications, theme toggle, polish |
| 10 | README, demo video/GIF, deploy a live demo, resume bullet points |

**Phase 1 exit criteria (the actual "definition of done"):** you can create an Epic in the UI, watch ArchitectAI post sub-issues and a comment within seconds without you touching the database, and the activity timeline shows the AI action exactly like a human one would look.

---

## PHASE 2 — Professional Version

**Goal:** make it feel like a real product a team would pay for — sprints, analytics, search, file uploads, richer AI autonomy.

### Features (added on top of Phase 1)
- Full Scrum: sprint planning, start/complete sprint, sprint goal, burndown
- Configurable workflow statuses per project (not just the default 5)
- File attachments (MinIO)
- Email notifications + weekly digest (free SMTP)
- Full-text search (Postgres `tsvector`)
- Filters (assignee, label, priority, "only mine") + saved filters
- Issue links (Blocks/Relates to/Duplicates)
- Time tracking (log work, remaining estimate)
- Analytics dashboard: velocity, burndown/burnup, cycle time, AI contribution %
- Reports: Sprint Report (PDF), AI Productivity Report
- Redis-backed caching + WebSocket fan-out (real multi-user live updates)
- AI autonomy levels per project (Manual/Semi-auto/Auto) — see Architecture §18.7
- Teams (group members across projects)
- Custom roles (beyond the default 5)

### Architecture
- Introduce Redis (cache + WebSocket pub/sub backing for multi-instance readiness)
- Introduce object storage (MinIO container) for attachments
- Move AI task queue from pure DB polling to Redis-backed queue (still simple, but production-shaped)
- CI pipeline (GitHub Actions): build, test, lint, dependency scan on every PR
- Add OpenAPI/Swagger docs, structured JSON logging

### Database tables added
`teams`, `team_members`, `roles`, `permissions`, `role_permissions`, `attachments`, `issue_links`, `watchers`, `time_logs`, `analytics_snapshots`, `notification_preferences`, `refresh_tokens` (rotation), `audit_logs`

### APIs added
Sprints (full lifecycle), Attachments, Search, Analytics (`/velocity`, `/burndown`, `/ai-contribution`), Reports (PDF export), Teams, Roles/Permissions, Time logs, Filters (saved filter CRUD)

### UI screens added
9. Sprint planning / Backlog with "plan into sprint"
10. Scrum board (sprint-scoped board with burndown header)
11. Analytics dashboard (charts)
12. Reports page (generate/export)
13. Search results page + global search bar
14. Attachment viewer/uploader on issue detail
15. AI Agent Settings panel (autonomy dial per agent, per project)
16. Team management
17. Role & permission editor

### Development roadmap (~6–8 weeks on top of Phase 1)
| Week | Milestone |
|---|---|
| 1 | Sprints + Scrum board + burndown |
| 2 | Attachments (MinIO) + search |
| 3 | Filters, saved filters, issue links |
| 4 | Time tracking + analytics snapshots job |
| 5 | Analytics dashboard UI + charts |
| 6 | Reports (PDF) + email digest |
| 7 | Redis integration, WebSocket realtime, AI autonomy levels |
| 8 | Teams, custom roles, CI pipeline, polish |

---

## PHASE 3 — Enterprise Version

**Goal:** the version you'd actually pitch to a hiring manager as "I built something at the architectural level of a real SaaS company."

### Features
- SSO / OAuth2 (Google Workspace, Okta-style OIDC)
- Multi-tenancy hardening (per-workspace data isolation guarantees, optional schema-per-tenant)
- Project templates, bulk issue import/export (CSV, Jira-format import)
- Advanced permission scopes (field-level restrictions, e.g. "Tester can't change story points")
- Git integration (link commits/PRs to issues) — feeds real diffs to ReviewerAI/CodeAI instead of manual text
- Webhooks + public API for third-party integration
- Custom workflow builder (drag-drop status transitions per project)
- AI agent marketplace concept: pluggable custom agents beyond the original 6 (extensibility story)
- Multi-region readiness, SLA dashard, status page
- Full observability stack: tracing, metrics, alerting

### Architecture
- Extract **AI Orchestration** into its own service, communicating via Kafka/RabbitMQ (see Architecture §19, step 1–2)
- CQRS read models for analytics fully separated from transactional DB (read replicas)
- Kubernetes deployment (can still be free: a single-node k3s cluster on a home machine or free-tier cloud Kubernetes for the resume story; doesn't need to run 24/7 to be demonstrable)
- OpenTelemetry tracing, Prometheus + Grafana dashboards, centralized logging (Loki/ELK)
- Rate limiting and quotas per workspace (multi-tenant fairness)
- Database partitioning for `activity_logs` / `ai_agent_executions`

### Database tables added
`webhooks`, `integrations` (Git provider config), `project_templates`, `custom_workflow_transitions`, plus partitioned variants of high-volume tables.

### APIs added
Webhooks (register/manage), Git integration (`/projects/{id}/git/link`), Bulk import/export, Public API (separate API-key-based auth tier), Workflow builder endpoints.

### UI screens added
18. SSO login flow
19. Git integration settings (connect repo, view linked commits on issue)
20. Webhook management
21. Workflow builder (visual)
22. Admin/observability dashboard (system health, AI agent load, error rates)
23. Bulk import wizard

### Development roadmap (~8–10 weeks on top of Phase 2)
| Week | Milestone |
|---|---|
| 1–2 | Extract AI Orchestration service + message broker |
| 3 | SSO/OIDC integration |
| 4 | Git integration (read-only: link commits, fetch diff for ReviewerAI) |
| 5 | Webhooks + public API tier |
| 6 | Workflow builder |
| 7 | Observability stack (OTel, Prometheus, Grafana) |
| 8 | Kubernetes manifests/Helm chart, deploy |
| 9–10 | Multi-tenancy hardening, partitioning, load testing, polish |

---

## How to talk about this in interviews

- **Phase 1** answers: "Tell me about a project." — a working full-stack app with a genuinely novel angle (AI teammates with real permission boundaries, not a chatbot bolted on).
- **Phase 2** answers: "How do you handle X at scale?" for analytics, caching, search.
- **Phase 3** answers: "How would you evolve a monolith?" and "How do you secure a multi-tenant system?" — senior/staff-level questions.

You do not need to finish Phase 3 to put this on a resume. Phase 1, done well and deployed, is already a strong project. Phases 2–3 are what turn it into a portfolio centerpiece.
