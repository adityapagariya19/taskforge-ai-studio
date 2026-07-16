# TaskForge AI Studio

> An AI-native Engineering Operating System where AI agents are real teammates — not chatbots.

[![Demo](https://img.shields.io/badge/demo-live-27D9C8?style=flat-square)](https://taskforge.ai)
[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3-6366F1?style=flat-square)](https://spring.io)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20TypeScript-5B6CFF?style=flat-square)](https://react.dev)
[![License](https://img.shields.io/badge/license-MIT-3DD68C?style=flat-square)](LICENSE)

---

## What is this?

TaskForge is a Jira-grade project management platform where your AI agents — ArchitectAI, CodeAI, TesterAI, ReviewerAI, DocumentationAI, ProjectManagerAI — appear as real project members. Assign a task to CodeAI and it writes the code. Create an Epic and ArchitectAI breaks it into subtasks and sketches the architecture. All on the same activity timeline as your human team.

---

## Demo Mode

No backend, no account, no setup. Click **Try live demo** on the login page.

Demo mode intercepts all API calls client-side and returns realistic sample data — a full engineering team working on a multiplayer game, with AI agents actively posting comments and subtasks. Works anywhere you can serve the frontend files, including Vercel/Netlify.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Java 21, Spring Boot 3.3, Spring Security 6, Flyway |
| Database | PostgreSQL 16 |
| AI (local dev) | Ollama (`llama3.1:8b`) |
| AI (production) | Any OpenAI-compatible API — Groq (free), OpenRouter, OpenAI |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Icons | Lucide React |
| Auth | JWT (identity + org-scoped tokens) |

---

## Quick Start

```bash
# 1. Infrastructure (Postgres + Ollama)
docker compose up -d
docker exec -it $(docker ps -qf "ancestor=ollama/ollama") ollama pull llama3.1:8b

# 2. Backend
cd taskforge-backend
./mvnw spring-boot:run

# 3. Frontend
cd taskforge-frontend
npm install
npm run dev
# → http://localhost:5173
```

Visit `http://localhost:5173` — click **Try live demo** to explore without a backend, or register a real account.

---

## Cloud AI (Production)

Switch from local Ollama to any cloud provider with two env vars:

```bash
TASKFORGE_AI_PROVIDER=cloud
TASKFORGE_AI_CLOUD_BASE_URL=https://api.groq.com/openai/v1   # Groq is free
TASKFORGE_AI_CLOUD_API_KEY=your_key_here
TASKFORGE_AI_CLOUD_MODEL=llama-3.3-70b-versatile
```

See `docs/05-AI-Provider-Guide.md` for full provider options.

---

## RBAC

16 roles, 49 permission codes, fully enforced on both backend (`@PreAuthorize`) and frontend. Every AI agent is an `OrganizationMember` row with role `AI_AGENT` — same permission system, no special cases.

---

## Folder Structure

```
taskforge-ai-studio/
├── taskforge-backend/       Spring Boot, Java 21
│   ├── src/main/java/com/taskforge/
│   │   ├── identity/        Auth, JWT, users
│   │   ├── organization/    Multi-tenant orgs, org-scoped tokens
│   │   ├── permission/      16 roles, 49 permissions, PermissionEvaluator
│   │   ├── department/      Departments, teams
│   │   ├── invitation/      Email / link / code invitations
│   │   ├── audit/           Append-only compliance audit log
│   │   ├── workspace/       Workspaces (tenant-scoped)
│   │   ├── project/         Projects, workflow statuses
│   │   ├── issue/           Issues (Epic/Story/Task/Subtask/Bug)
│   │   ├── sprint/          Sprint management, burndown
│   │   ├── collaboration/   Comments, mentions
│   │   ├── activity/        Unified human+AI activity timeline
│   │   ├── notification/    In-app notifications
│   │   └── aiagent/         6 AI agents + Ollama/Cloud LLM client
│   └── src/main/resources/db/migration/   Flyway V1–V4
├── taskforge-frontend/      React 18, TypeScript, Tailwind
│   └── src/
│       ├── lib/             api.ts, auth, demo, organization, project, theme
│       ├── pages/           Landing, Login, Register, Board, Sprint
│       └── components/      Avatar, TopBar, IssueCard, IssueDetailModal, …
└── docs/                    Architecture, AI provider, roadmap guides
```

---

## Completed Modules

- ✅ Multi-tenant organizations (Module 1)
- ✅ 16 roles, 49 permissions, full RBAC
- ✅ Departments, teams, nested structure
- ✅ Invitations (email / link / code)
- ✅ Compliance audit log
- ✅ Issue tracking (Epic → Story → Task → Subtask → Bug)
- ✅ Kanban board with AI swimlanes
- ✅ Sprint management with real burndown data
- ✅ 6 AI agents (event-driven + manual invoke)
- ✅ Cloud AI provider abstraction (Groq, OpenRouter, OpenAI)
- ✅ Demo mode (100% client-side, no backend required)
- ✅ Premium dark UI with AI visual identity

## Roadmap

- ⬜ Realtime collaboration (WebSocket presence)
- ⬜ Profile system with productivity analytics
- ⬜ Owner/Admin/Engineering dashboards
- ⬜ Global search
- ⬜ File attachments (MinIO/S3)
- ⬜ Release management, milestones
- ⬜ Rate limiting, refresh token rotation
