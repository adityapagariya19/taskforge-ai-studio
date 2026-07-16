/**
 * Demo mode: all mock data returned when DEMO_MODE is active.
 * Every value here is realistic — real issue keys, real AI agent names,
 * real sprint dates — so the demo looks like a real product in use,
 * not obviously seeded placeholder text.
 */

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@taskforge.ai',
  fullName: 'Alex Rivera',
  avatarUrl: null,
};

export const DEMO_ORG = {
  id: 'demo-org-001',
  name: 'Acme Engineering',
  slug: 'acme-engineering',
  planTier: 'BUSINESS',
  status: 'ACTIVE',
};

export const DEMO_WORKSPACE = {
  id: 'demo-ws-001',
  organizationId: 'demo-org-001',
  name: 'Engineering',
  slug: 'engineering',
};

export const DEMO_PROJECT = {
  id: 'demo-proj-001',
  key: 'ACE',
  name: 'Acme Platform',
  description: 'Core product engineering',
  type: 'SCRUM',
};

export const DEMO_STATUSES = [
  { id: 'st-1', name: 'Backlog',     category: 'TODO',        position: 0, color: '#8A8F9C' },
  { id: 'st-2', name: 'To Do',       category: 'TODO',        position: 1, color: '#5B6CFF' },
  { id: 'st-3', name: 'In Progress', category: 'IN_PROGRESS', position: 2, color: '#F2A93B' },
  { id: 'st-4', name: 'In Review',   category: 'IN_PROGRESS', position: 3, color: '#27D9C8' },
  { id: 'st-5', name: 'Done',        category: 'DONE',        position: 4, color: '#3DD68C' },
];

export const DEMO_MEMBERS = [
  { id: 'pm-1', userId: 'demo-user-001', isAi: false, aiAgentType: null, role: 'PROJECT_OWNER' },
  { id: 'pm-2', userId: 'demo-user-002', isAi: false, aiAgentType: null, role: 'DEVELOPER' },
  { id: 'pm-3', userId: 'demo-user-003', isAi: false, aiAgentType: null, role: 'QA_ENGINEER' },
  { id: 'pm-ai-1', userId: null, isAi: true, aiAgentType: 'ARCHITECT_AI',       role: 'AI_AGENT' },
  { id: 'pm-ai-2', userId: null, isAi: true, aiAgentType: 'CODE_AI',            role: 'AI_AGENT' },
  { id: 'pm-ai-3', userId: null, isAi: true, aiAgentType: 'TESTER_AI',          role: 'AI_AGENT' },
  { id: 'pm-ai-4', userId: null, isAi: true, aiAgentType: 'REVIEWER_AI',        role: 'AI_AGENT' },
  { id: 'pm-ai-5', userId: null, isAi: true, aiAgentType: 'DOCUMENTATION_AI',   role: 'AI_AGENT' },
  { id: 'pm-ai-6', userId: null, isAi: true, aiAgentType: 'PROJECT_MANAGER_AI', role: 'AI_AGENT' },
];

export const DEMO_ISSUES = [
  { id: 'iss-1',  issueKey: 'ACE-101', type: 'EPIC',    statusId: 'st-3', sprintId: 'sp-1', title: 'Build Real-time Multiplayer System',  description: 'Full real-time lobby, matchmaking, and game-state sync.', priority: 'HIGHEST', storyPoints: null,  assigneeId: null,           assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: null,     createdAt: '2026-06-01T09:00:00Z', updatedAt: '2026-06-20T14:30:00Z' },
  { id: 'iss-2',  issueKey: 'ACE-102', type: 'STORY',   statusId: 'st-3', sprintId: 'sp-1', title: 'Design WebSocket server architecture',  description: 'Decide between socket.io, ws, and uWebSockets. Define message protocol.', priority: 'HIGH',    storyPoints: 8,  assigneeId: null,           assigneeIsAi: true,  assigneeAiType: 'ARCHITECT_AI',       reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: 'iss-1', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-21T11:00:00Z' },
  { id: 'iss-3',  issueKey: 'ACE-103', type: 'TASK',    statusId: 'st-3', sprintId: 'sp-1', title: 'Implement server-authoritative game loop', description: 'Fixed tick-rate server loop at 20Hz. Client sends inputs, server sends state.', priority: 'HIGH',    storyPoints: 5,  assigneeId: 'demo-user-002', assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: 'iss-1', createdAt: '2026-06-03T09:00:00Z', updatedAt: '2026-06-22T15:00:00Z' },
  { id: 'iss-4',  issueKey: 'ACE-104', type: 'TASK',    statusId: 'st-4', sprintId: 'sp-1', title: 'Client-side prediction & reconciliation',  description: 'Predict local movement, reconcile with server authoritative state on desync.', priority: 'HIGH',    storyPoints: 8,  assigneeId: null,           assigneeIsAi: true,  assigneeAiType: 'CODE_AI',             reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: 'iss-1', createdAt: '2026-06-04T09:00:00Z', updatedAt: '2026-06-23T09:00:00Z' },
  { id: 'iss-5',  issueKey: 'ACE-105', type: 'TASK',    statusId: 'st-5', sprintId: 'sp-1', title: 'Lobby & matchmaking API',                  description: 'REST + WebSocket hybrid: create/join/leave lobby, ready-check, countdown.', priority: 'MEDIUM',  storyPoints: 5,  assigneeId: 'demo-user-002', assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: 'iss-1', createdAt: '2026-06-05T09:00:00Z', updatedAt: '2026-06-18T16:00:00Z' },
  { id: 'iss-6',  issueKey: 'ACE-106', type: 'BUG',     statusId: 'st-3', sprintId: 'sp-1', title: 'Player desync under packet loss > 5%',      description: 'Reproduced on flaky network; rollback diverges after ~3s. Needs lag-comp fix.', priority: 'HIGHEST', storyPoints: 3,  assigneeId: 'demo-user-002', assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-003', reporterIsAi: false, reporterAiType: null, epicId: 'iss-1', createdAt: '2026-06-15T14:00:00Z', updatedAt: '2026-06-24T10:00:00Z' },
  { id: 'iss-7',  issueKey: 'ACE-107', type: 'STORY',   statusId: 'st-2', sprintId: null,   title: 'User authentication & session management',  description: 'JWT-based auth, refresh tokens, device sessions, magic-link login.', priority: 'HIGH',    storyPoints: 13, assigneeId: null,           assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: null,     createdAt: '2026-06-10T09:00:00Z', updatedAt: '2026-06-10T09:00:00Z' },
  { id: 'iss-8',  issueKey: 'ACE-108', type: 'TASK',    statusId: 'st-1', sprintId: null,   title: 'Payment & subscription integration',        description: 'Stripe Checkout + webhook handler for subscription lifecycle events.', priority: 'MEDIUM',  storyPoints: 8,  assigneeId: null,           assigneeIsAi: false, assigneeAiType: null,              reporterId: 'demo-user-001', reporterIsAi: false, reporterAiType: null, epicId: null,     createdAt: '2026-06-11T09:00:00Z', updatedAt: '2026-06-11T09:00:00Z' },
  { id: 'iss-9',  issueKey: 'ACE-109', type: 'SUBTASK', statusId: 'st-5', sprintId: 'sp-1', title: 'Write WebSocket message protocol spec',     description: null, priority: 'MEDIUM',  storyPoints: 2,  assigneeId: null,           assigneeIsAi: true,  assigneeAiType: 'DOCUMENTATION_AI',    reporterId: null,            reporterIsAi: true,  reporterAiType: 'ARCHITECT_AI',    epicId: 'iss-1', createdAt: '2026-06-02T10:05:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'iss-10', issueKey: 'ACE-110', type: 'SUBTASK', statusId: 'st-5', sprintId: 'sp-1', title: 'Evaluate uWebSockets vs ws vs socket.io',   description: null, priority: 'MEDIUM',  storyPoints: 1,  assigneeId: null,           assigneeIsAi: true,  assigneeAiType: 'ARCHITECT_AI',        reporterId: null,            reporterIsAi: true,  reporterAiType: 'ARCHITECT_AI',    epicId: 'iss-1', createdAt: '2026-06-02T10:06:00Z', updatedAt: '2026-06-17T11:00:00Z' },
  { id: 'iss-11', issueKey: 'ACE-111', type: 'SUBTASK', statusId: 'st-3', sprintId: 'sp-1', title: 'Implement input lag compensation algorithm', description: null, priority: 'HIGH',    storyPoints: 3,  assigneeId: null,           assigneeIsAi: true,  assigneeAiType: 'CODE_AI',             reporterId: null,            reporterIsAi: true,  reporterAiType: 'ARCHITECT_AI',    epicId: 'iss-1', createdAt: '2026-06-02T10:07:00Z', updatedAt: '2026-06-21T14:00:00Z' },
];

export const DEMO_SPRINTS = [
  {
    id: 'sp-1',
    projectId: 'demo-proj-001',
    name: 'Sprint 3 — Multiplayer Core',
    goal: 'Ship a playable multiplayer lobby with stable game-state sync under normal network conditions.',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    status: 'ACTIVE',
    createdAt: '2026-06-14T10:00:00Z',
    startedAt: '2026-06-16T09:00:00Z',
    completedAt: null,
  },
  {
    id: 'sp-2',
    projectId: 'demo-proj-001',
    name: 'Sprint 4 — Auth & Payments',
    goal: 'Complete user authentication and Stripe subscription flow.',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    status: 'PLANNED',
    createdAt: '2026-06-20T10:00:00Z',
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'sp-past',
    projectId: 'demo-proj-001',
    name: 'Sprint 2 — Game Engine Foundation',
    goal: 'Entity-component system, rendering pipeline, and basic physics.',
    startDate: '2026-06-02',
    endDate: '2026-06-15',
    status: 'COMPLETED',
    createdAt: '2026-05-31T10:00:00Z',
    startedAt: '2026-06-02T09:00:00Z',
    completedAt: '2026-06-15T17:00:00Z',
  },
];

export const DEMO_BURNDOWN = {
  sprintId: 'sp-1',
  sprintName: 'Sprint 3 — Multiplayer Core',
  startDate: '2026-06-16',
  endDate: '2026-06-30',
  status: 'ACTIVE',
  totalPoints: 35,
  completedPoints: 13,
  totalIssues: 8,
  completedIssues: 2,
};

export const DEMO_COMMENTS = [
  { id: 'c-1', authorId: 'demo-user-001', authorIsAi: false, authorAiType: null, body: 'Assigned this to ArchitectAI to break down the architecture before we start coding. Will review the proposal tomorrow.', createdAt: '2026-06-02T10:15:00Z' },
  { id: 'c-2', authorId: null, authorIsAi: true, authorAiType: 'ARCHITECT_AI', body: `**ArchitectAI**\n\nAfter analysing the requirements for a real-time multiplayer system, I recommend a **server-authoritative architecture** with the following components:\n\n\`\`\`mermaid\ngraph LR\n  Client1[\"Client A\"] -->|\"inputs\"| Server[\"Game Server\\n(authoritative)\"]\n  Client2[\"Client B\"] -->|\"inputs\"| Server\n  Server -->|\"state delta\"| Client1\n  Server -->|\"state delta\"| Client2\n\`\`\`\n\n**Recommended tech:** \`uWebSockets.js\` for raw performance; fallback to \`socket.io\` if cross-platform compatibility becomes a concern.\n\n**Tick rate:** 20Hz server / 60Hz client-side interpolation — industry standard for competitive games.\n\nI have created 3 subtasks covering: protocol spec, library evaluation, and lag compensation.`, createdAt: '2026-06-02T10:18:00Z' },
  { id: 'c-3', authorId: 'demo-user-002', authorIsAi: false, authorAiType: null, body: 'Good breakdown. I agree on uWebSockets for the server. @CodeAI — can you start the lag compensation implementation once ACE-110 is merged?', createdAt: '2026-06-02T11:30:00Z' },
  { id: 'c-4', authorId: null, authorIsAi: true, authorAiType: 'CODE_AI', body: `**CodeAI**\n\nAcknowledged. Here is the implementation plan for lag compensation:\n\n1. Record timestamped input ring-buffer per player (last 1s @ 20Hz = 20 entries)\n2. On server tick: rewind world state to client's reported timestamp, apply input, re-simulate to present\n3. Clamp max rewind to 500ms to prevent exploits\n\nEstimated effort: **3 story points**.\n\nWaiting for ACE-110 to be marked Done before starting implementation.`, createdAt: '2026-06-03T09:05:00Z' },
  { id: 'c-5', authorId: 'demo-user-003', authorIsAi: false, authorAiType: null, body: 'Flagging ACE-106 — reproduced the desync bug with 6% simulated packet loss using tc netem. Stack trace attached. This needs to be fixed before we can call the sprint done.', createdAt: '2026-06-15T14:30:00Z' },
  { id: 'c-6', authorId: null, authorIsAi: true, authorAiType: 'TESTER_AI', body: `**TesterAI** — test scenarios for ACE-104:\n\n- **[happy-path]** Two clients sync within 100ms under 0% packet loss\n- **[edge-case]** Client reconnects mid-match — state fully restored within 2 ticks\n- **[error-case]** Server tick drops below 10Hz — client shows degraded-connection indicator\n- **[error-case]** Packet loss > 15% — game pauses gracefully rather than desyncing silently`, createdAt: '2026-06-20T09:00:00Z' },
];

export const DEMO_ACTIVITY = [
  { id: 'a-1',  actorId: 'demo-user-001', actorIsAi: false, actorAiType: null,              actionType: 'ISSUE_CREATED',   fieldName: null,       oldValue: null,      newValue: 'Build Real-time Multiplayer System',        createdAt: '2026-06-01T09:00:00Z' },
  { id: 'a-2',  actorId: null,            actorIsAi: true,  actorAiType: 'ARCHITECT_AI',    actionType: 'SUBISSUE_CREATED', fieldName: null,      oldValue: null,      newValue: 'Write WebSocket message protocol spec',     createdAt: '2026-06-02T10:18:00Z' },
  { id: 'a-3',  actorId: null,            actorIsAi: true,  actorAiType: 'ARCHITECT_AI',    actionType: 'SUBISSUE_CREATED', fieldName: null,      oldValue: null,      newValue: 'Evaluate uWebSockets vs ws vs socket.io',   createdAt: '2026-06-02T10:19:00Z' },
  { id: 'a-4',  actorId: null,            actorIsAi: true,  actorAiType: 'ARCHITECT_AI',    actionType: 'SUBISSUE_CREATED', fieldName: null,      oldValue: null,      newValue: 'Implement input lag compensation algorithm', createdAt: '2026-06-02T10:20:00Z' },
  { id: 'a-5',  actorId: 'demo-user-001', actorIsAi: false, actorAiType: null,              actionType: 'STATUS_CHANGED',  fieldName: 'status',   oldValue: 'To Do',   newValue: 'In Progress',                               createdAt: '2026-06-16T09:30:00Z' },
  { id: 'a-6',  actorId: null,            actorIsAi: true,  actorAiType: 'PROJECT_MANAGER_AI', actionType: 'COMMENT_ADDED', fieldName: null,     oldValue: null,      newValue: 'ProjectManagerAI: Sprint 3 risk assessment posted', createdAt: '2026-06-16T10:00:00Z' },
  { id: 'a-7',  actorId: 'demo-user-002', actorIsAi: false, actorAiType: null,              actionType: 'STATUS_CHANGED',  fieldName: 'status',   oldValue: 'To Do',   newValue: 'In Progress',                               createdAt: '2026-06-17T09:00:00Z' },
  { id: 'a-8',  actorId: null,            actorIsAi: true,  actorAiType: 'CODE_AI',         actionType: 'COMMENT_ADDED',   fieldName: null,       oldValue: null,      newValue: 'CodeAI: implementation plan posted',        createdAt: '2026-06-20T09:05:00Z' },
  { id: 'a-9',  actorId: 'demo-user-003', actorIsAi: false, actorAiType: null,              actionType: 'STATUS_CHANGED',  fieldName: 'status',   oldValue: 'In Progress', newValue: 'In Review',                             createdAt: '2026-06-21T14:00:00Z' },
  { id: 'a-10', actorId: null,            actorIsAi: true,  actorAiType: 'TESTER_AI',       actionType: 'COMMENT_ADDED',   fieldName: null,       oldValue: null,      newValue: 'TesterAI: test scenarios posted',           createdAt: '2026-06-20T09:00:00Z' },
];

export const DEMO_NOTIFICATIONS = [
  { id: 'n-1', type: 'AI_AGENT_ACTIVITY', title: 'ArchitectAI acted on ACE-102',    body: 'ArchitectAI proposed architecture and created 3 subtasks.', link: '/issues/iss-2', actorIsAi: true,  isRead: false, createdAt: '2026-06-02T10:18:00Z' },
  { id: 'n-2', type: 'AI_AGENT_ACTIVITY', title: 'CodeAI posted on ACE-111',        body: 'CodeAI shared an implementation plan for lag compensation.', link: '/issues/iss-11', actorIsAi: true, isRead: false, createdAt: '2026-06-03T09:05:00Z' },
  { id: 'n-3', type: 'SPRINT_STARTED',    title: 'Sprint 3 is now active',          body: '"Sprint 3 — Multiplayer Core" started on Jun 16.', link: '/sprints', actorIsAi: false, isRead: true, createdAt: '2026-06-16T09:00:00Z' },
  { id: 'n-4', type: 'AI_AGENT_ACTIVITY', title: 'TesterAI posted on ACE-104',      body: 'TesterAI generated 4 test scenarios for client-side prediction.', link: '/issues/iss-4', actorIsAi: true, isRead: false, createdAt: '2026-06-20T09:00:00Z' },
];

export const DEMO_AI_EXECUTIONS = [
  { id: 'ex-1', agentType: 'ARCHITECT_AI',    triggerEvent: 'ISSUE_CREATED',           status: 'COMPLETED', outputSummary: 'subIssuesCreated=3; commentPosted=true', modelUsed: 'demo-mode', createdAt: '2026-06-02T10:18:00Z' },
  { id: 'ex-2', agentType: 'CODE_AI',         triggerEvent: 'ISSUE_MOVED_TO_IN_PROGRESS', status: 'COMPLETED', outputSummary: 'subIssuesCreated=0; commentPosted=true', modelUsed: 'demo-mode', createdAt: '2026-06-03T09:05:00Z' },
  { id: 'ex-3', agentType: 'TESTER_AI',       triggerEvent: 'ISSUE_MOVED_TO_IN_REVIEW',   status: 'COMPLETED', outputSummary: 'subIssuesCreated=0; commentPosted=true', modelUsed: 'demo-mode', createdAt: '2026-06-20T09:00:00Z' },
  { id: 'ex-4', agentType: 'PROJECT_MANAGER_AI', triggerEvent: 'ISSUE_CREATED',        status: 'COMPLETED', outputSummary: 'subIssuesCreated=0; commentPosted=true', modelUsed: 'demo-mode', createdAt: '2026-06-16T10:00:00Z' },
];

export const DEMO_ORG_MEMBERS = [
  { id: 'om-1', userId: 'demo-user-001', isAi: false, aiAgentType: null, roleCode: 'ORG_OWNER',    roleName: 'Organization Owner', departmentId: null, jobTitle: 'CTO',               employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-2', userId: 'demo-user-002', isAi: false, aiAgentType: null, roleCode: 'DEVELOPER',    roleName: 'Developer',          departmentId: null, jobTitle: 'Senior Engineer',   employmentStatus: 'ACTIVE', joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'om-3', userId: 'demo-user-003', isAi: false, aiAgentType: null, roleCode: 'QA_ENGINEER',  roleName: 'QA Engineer',        departmentId: null, jobTitle: 'QA Lead',           employmentStatus: 'ACTIVE', joinedAt: '2026-02-01T00:00:00Z' },
  { id: 'om-ai-1', userId: null, isAi: true, aiAgentType: 'ARCHITECT_AI',       roleCode: 'AI_AGENT', roleName: 'AI Architect',         departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-ai-2', userId: null, isAi: true, aiAgentType: 'CODE_AI',            roleCode: 'AI_AGENT', roleName: 'AI Developer',         departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-ai-3', userId: null, isAi: true, aiAgentType: 'TESTER_AI',          roleCode: 'AI_AGENT', roleName: 'AI Tester',            departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-ai-4', userId: null, isAi: true, aiAgentType: 'REVIEWER_AI',        roleCode: 'AI_AGENT', roleName: 'AI Reviewer',          departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-ai-5', userId: null, isAi: true, aiAgentType: 'DOCUMENTATION_AI',   roleCode: 'AI_AGENT', roleName: 'AI Documentation',     departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'om-ai-6', userId: null, isAi: true, aiAgentType: 'PROJECT_MANAGER_AI', roleCode: 'AI_AGENT', roleName: 'AI Project Manager',   departmentId: null, jobTitle: null, employmentStatus: 'ACTIVE', joinedAt: '2026-01-01T00:00:00Z' },
];

// ── Org chart / node graph demo data ──
// A realistic 3-level hierarchy: Organization -> Departments -> Teams -> Members (human + AI),
// each member carrying live status and current task so the graph has real content to show
// when zoomed all the way in, not just decorative boxes.
export const DEMO_GRAPH_NODES = [
  { id: 'org-root', type: 'organization' as const, label: 'Acme Engineering', subtitle: '12 members · 3 teams', parentId: null },

  { id: 'dept-eng', type: 'department' as const, label: 'Engineering', subtitle: '9 members', parentId: 'org-root' },
  { id: 'dept-product', type: 'department' as const, label: 'Product', subtitle: '2 members', parentId: 'org-root' },
  { id: 'dept-ai', type: 'department' as const, label: 'AI Operations', subtitle: '6 agents', parentId: 'org-root' },

  { id: 'team-platform', type: 'team' as const, label: 'Platform Team', subtitle: '5 members', parentId: 'dept-eng' },
  { id: 'team-mobile', type: 'team' as const, label: 'Mobile Team', subtitle: '4 members', parentId: 'dept-eng' },

  // Human members — Platform Team
  { id: 'member-alex', type: 'member' as const, label: 'Alex Rivera', subtitle: 'CTO', status: 'online' as const, currentTask: 'Reviewing ACE-104', taskCount: 3, parentId: 'team-platform' },
  { id: 'member-jordan', type: 'member' as const, label: 'Jordan Lee', subtitle: 'Senior Engineer', status: 'online' as const, currentTask: 'ACE-103 Game loop', taskCount: 5, parentId: 'team-platform' },
  { id: 'member-sam', type: 'member' as const, label: 'Sam Patel', subtitle: 'QA Lead', status: 'idle' as const, currentTask: 'ACE-106 Desync bug', taskCount: 2, parentId: 'team-platform' },
  { id: 'member-riley', type: 'member' as const, label: 'Riley Chen', subtitle: 'Backend Engineer', status: 'offline' as const, currentTask: null, taskCount: 1, parentId: 'team-platform' },
  { id: 'member-morgan', type: 'member' as const, label: 'Morgan Diaz', subtitle: 'DevOps Engineer', status: 'online' as const, currentTask: 'CI pipeline optimization', taskCount: 2, parentId: 'team-platform' },

  // Human members — Mobile Team
  { id: 'member-casey', type: 'member' as const, label: 'Casey Wu', subtitle: 'iOS Engineer', status: 'online' as const, currentTask: 'Push notification service', taskCount: 4, parentId: 'team-mobile' },
  { id: 'member-taylor', type: 'member' as const, label: 'Taylor Kim', subtitle: 'Android Engineer', status: 'idle' as const, currentTask: 'Offline sync layer', taskCount: 3, parentId: 'team-mobile' },
  { id: 'member-drew', type: 'member' as const, label: 'Drew Foster', subtitle: 'Mobile Designer', status: 'online' as const, currentTask: 'Onboarding redesign', taskCount: 2, parentId: 'team-mobile' },
  { id: 'member-avery', type: 'member' as const, label: 'Avery Brooks', subtitle: 'QA Engineer', status: 'offline' as const, currentTask: null, taskCount: 1, parentId: 'team-mobile' },

  // Product department (direct, no team layer)
  { id: 'member-jamie', type: 'member' as const, label: 'Jamie Ortiz', subtitle: 'Product Manager', status: 'online' as const, currentTask: 'Sprint 4 planning', taskCount: 6, parentId: 'dept-product' },
  { id: 'member-quinn', type: 'member' as const, label: 'Quinn Bennett', subtitle: 'Product Designer', status: 'idle' as const, currentTask: 'Design system audit', taskCount: 3, parentId: 'dept-product' },

  // AI agents — AI Operations department
  { id: 'member-architect-ai', type: 'member' as const, label: 'ArchitectAI', subtitle: 'AI Architect', isAi: true, agentType: 'ARCHITECT_AI', status: 'online' as const, currentTask: 'ACE-102 architecture proposal', taskCount: 8, parentId: 'dept-ai' },
  { id: 'member-code-ai', type: 'member' as const, label: 'CodeAI', subtitle: 'AI Developer', isAi: true, agentType: 'CODE_AI', status: 'online' as const, currentTask: 'ACE-111 lag compensation', taskCount: 12, parentId: 'dept-ai' },
  { id: 'member-tester-ai', type: 'member' as const, label: 'TesterAI', subtitle: 'AI Tester', isAi: true, agentType: 'TESTER_AI', status: 'online' as const, currentTask: 'ACE-104 test scenarios', taskCount: 6, parentId: 'dept-ai' },
  { id: 'member-reviewer-ai', type: 'member' as const, label: 'ReviewerAI', subtitle: 'AI Reviewer', isAi: true, agentType: 'REVIEWER_AI', status: 'idle' as const, currentTask: null, taskCount: 5, parentId: 'dept-ai' },
  { id: 'member-docs-ai', type: 'member' as const, label: 'DocumentationAI', subtitle: 'AI Documentation', isAi: true, agentType: 'DOCUMENTATION_AI', status: 'online' as const, currentTask: 'API reference update', taskCount: 4, parentId: 'dept-ai' },
  { id: 'member-pm-ai', type: 'member' as const, label: 'ProjectManagerAI', subtitle: 'AI Project Manager', isAi: true, agentType: 'PROJECT_MANAGER_AI', status: 'online' as const, currentTask: 'Sprint 3 risk analysis', taskCount: 3, parentId: 'dept-ai' },
];

// ── Join requests (employee → org, pending approval) ──
export const DEMO_JOIN_REQUESTS = [
  { id: 'jr-1', organizationId: DEMO_ORG.id, userId: 'demo-user-004', requestedRoleCode: 'DEVELOPER', message: 'Backend engineer, referred by Jordan.', status: 'PENDING', reviewNote: null, createdAt: '2026-06-24T09:00:00Z', reviewedAt: null },
  { id: 'jr-2', organizationId: DEMO_ORG.id, userId: 'demo-user-005', requestedRoleCode: 'DESIGNER', message: null, status: 'PENDING', reviewNote: null, createdAt: '2026-06-24T14:00:00Z', reviewedAt: null },
];

// ── Platform admin demo data ──
export const DEMO_PLATFORM_ORGS = [
  { id: DEMO_ORG.id, name: DEMO_ORG.name, slug: DEMO_ORG.slug, joinCode: 'ACME2026', planTier: 'BUSINESS', status: 'ACTIVE', memberCount: 6, aiAgentCount: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-demo-2', name: 'Northwind Studios', slug: 'northwind-studios', joinCode: 'NWS4K2P9', planTier: 'TEAM', status: 'ACTIVE', memberCount: 14, aiAgentCount: 6, createdAt: '2026-03-12T00:00:00Z' },
  { id: 'org-demo-3', name: 'Vertex Robotics', slug: 'vertex-robotics', joinCode: 'VRX8M3QZ', planTier: 'ENTERPRISE', status: 'ACTIVE', memberCount: 47, aiAgentCount: 6, createdAt: '2026-02-05T00:00:00Z' },
  { id: 'org-demo-4', name: 'Solstice Labs', slug: 'solstice-labs', joinCode: 'SOL7X2KT', planTier: 'FREE', status: 'SUSPENDED', memberCount: 3, aiAgentCount: 6, createdAt: '2026-05-01T00:00:00Z' },
];

export const DEMO_PLATFORM_STATS = {
  totalOrganizations: 4, activeOrganizations: 3, suspendedOrganizations: 1,
  totalHumanMembers: 70, totalAiAgents: 24,
};

// ── Departments (mirrors the graph's department structure) ──
export const DEMO_DEPARTMENTS = [
  { id: 'dept-eng', name: 'Engineering', parentDepartmentId: null, leadOrganizationMemberId: 'om-1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'dept-product', name: 'Product', parentDepartmentId: null, leadOrganizationMemberId: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'dept-ai', name: 'AI Operations', parentDepartmentId: null, leadOrganizationMemberId: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'dept-hr', name: 'HR', parentDepartmentId: null, leadOrganizationMemberId: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'dept-finance', name: 'Finance', parentDepartmentId: null, leadOrganizationMemberId: null, createdAt: '2026-01-01T00:00:00Z' },
];
