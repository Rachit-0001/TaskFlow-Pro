# TaskFlow Pro — System Design Document

## 1. Project Overview

**TaskFlow Pro** is a dependency-aware project and workflow management system designed for projects where the order of task execution matters.

Unlike a conventional task manager that primarily tracks task status, TaskFlow Pro models relationships between tasks as a **Directed Acyclic Graph (DAG)**. The dependency engine uses these relationships to determine whether tasks are READY or BLOCKED, prevents invalid circular dependencies, and propagates workflow and scheduling changes through dependent tasks.

The system also provides a Kanban-style task board, dependency management, dependency visualization, dashboard statistics, and AI-powered workflow suggestions using the Google Gemini API.

### Primary Goals

* Manage projects and tasks.
* Represent task dependencies.
* Prevent circular dependencies.
* Determine dependency-aware task readiness.
* Propagate dependency state through multi-level workflows.
* Support Kanban-based task management.
* Visualize workflow relationships.
* Provide AI-assisted workflow recommendations.
* Provide a clear REST API between frontend and backend.

---

# 2. High-Level Architecture

```text
                         TASKFLOW PRO
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
          Dashboard       Kanban Board    Dependencies
              |               |               |
              |               |               v
              |               |        Dependency Graph
              |               |               |
              +---------------+---------------+
                              |
                         REST API
                              |
                              v
                    Node.js + Express
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
     Task Service        DAG Engine          AI Service
          |                   |                   |
          |           +-------+-------+           |
          |           |       |       |           |
          |         Cycle   READY  Schedule       |
          |         Check  BLOCKED Propagation    |
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                         MySQL Database
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
           Projects         Tasks       Dependencies
                                              |
                                              v
                                       AI Suggestions

                                      AI Service
                                          |
                                          v
                                     Gemini API
```

---

# 3. Technology Stack

## Frontend

* Next.js 16
* React
* JavaScript
* Tailwind CSS v4

The frontend provides the user interface and communicates with the backend through REST APIs.

## Backend

* Node.js
* Express.js
* REST API
* MySQL
* `mysql2/promise`
* JWT
* bcryptjs
* express-validator
* Google Gemini API

## Database

The current implementation uses **MySQL**.

The core schema contains:

* `projects`
* `tasks`
* `dependencies`
* `ai_suggestions`

The project also uses supporting relational structures defined by the current database schema.

## AI

Google Gemini is used for task-level AI workflow suggestions.

---

# 4. Frontend Architecture

The frontend is implemented as a Next.js application.

```text
frontend/
│
└── src/
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.js
    │   └── page.js
    │
    ├── components/
    │   ├── Sidebar.js
    │   ├── StatCard.js
    │   ├── TaskCard.js
    │   ├── TaskModal.js
    │   ├── KanbanBoard.js
    │   ├── ThemeToggle.js
    │   ├── DependencyManager.js
    │   ├── DependencyGraph.js
    │   ├── AISuggestions.js
    │   ├── ProjectModal.js
    │   ├── TaskManager.js
    │   ├── ProjectManager.js
    │   ├── LoadingState.js
    │   ├── EmptyState.js
    │   ├── ErrorState.js
    │   └── ProjectSelector.js
    │
    └── lib/
        └── api.js
```

### Main frontend responsibilities

The frontend handles:

* Project selection
* Project creation
* Task creation and editing
* Task deletion
* Kanban workflow
* Drag-and-drop task movement
* Dependency management
* Dependency visualization
* AI suggestion generation
* AI suggestion review
* Dashboard statistics
* Loading states
* Empty states
* Error states

---

# 5. Backend Architecture

The backend provides the REST API and contains the main workflow logic.

```text
Client
  |
  v
Express Router
  |
  +-------------------+
  |                   |
  v                   v
Project/Task       Dependency
Routes             Routes
  |                   |
  v                   v
Task Service       DAG Engine
  |                   |
  |            +------+------+
  |            |             |
  |         Validation   Propagation
  |            |             |
  +------------+-------------+
               |
               v
             MySQL

AI Routes
    |
    v
AI Service
    |
    v
Gemini API
    |
    v
MySQL
```

The backend is responsible for enforcing workflow rules rather than relying on the frontend to enforce them.

---

# 6. REST API Architecture

The frontend communicates with the backend through HTTP REST endpoints.

The local API base URL is:

```text
http://localhost:5000/api
```

The frontend uses a centralized API utility:

```text
frontend/src/lib/api.js
```

This provides functions for:

* Projects
* Tasks
* Dependencies
* AI suggestions

This separation prevents UI components from containing repeated HTTP request logic.

---

# 7. Project Management

Projects provide the top-level container for workflow tasks.

### Project endpoints

```http
POST /api/projects
GET /api/projects
GET /api/projects/:id
```

The selected project determines which tasks are displayed in the task board and task management views.

---

# 8. Task Management

Tasks belong to a project.

### Task endpoints

```http
POST /api/projects/:id/tasks
GET /api/projects/:id/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

Tasks support workflow statuses:

```text
BACKLOG
IN_PROGRESS
REVIEW
DONE
```

These are the actual task statuses stored and manipulated by the workflow system.

READY and BLOCKED are dependency-derived states and are not treated as separate database task statuses.

---

# 9. Kanban Board

The Kanban board provides four workflow columns:

```text
+----------+-------------+--------+------+
| Backlog  | In Progress | Review | Done |
+----------+-------------+--------+------+
```

Each task is displayed as a task card.

The user can drag a task between columns to change its workflow status.

The frontend sends the resulting status change to the backend through the task update API.

```text
Drag Task
    |
    v
Select Destination Column
    |
    v
PATCH /api/tasks/:id
    |
    v
Backend Validation
    |
    v
Database Update
    |
    v
Refresh Workflow State
```

---

# 10. Dependency Model

A dependency represents:

```text
Predecessor → Successor
```

For example:

```text
Requirements Analysis
          |
          v
System Design
```

System Design depends on Requirements Analysis.

The dependency relationship is stored independently from the task's workflow status.

### Dependency endpoints

```http
POST /api/dependencies
GET /api/tasks/:id/dependencies
DELETE /api/dependencies/:id
```

---

# 11. DAG Engine

The dependency engine is the core workflow component of TaskFlow Pro.

The dependencies form a directed graph.

For example:

```text
A → B → C
```

is a valid directed acyclic graph.

The engine prevents cycles.

An invalid workflow is:

```text
A → B
B → C
C → A
```

This creates a cycle because the graph eventually returns to A.

## Why cycle prevention matters

Without cycle detection, the system could create a workflow where no task has a valid starting point.

For example:

```text
Task A waits for Task C
Task C waits for Task B
Task B waits for Task A
```

The workflow cannot progress.

Therefore, dependency creation is validated before the relationship is persisted.

---

# 12. Self-Dependency Prevention

The system also prevents a task from depending on itself.

Invalid:

```text
Task A → Task A
```

The backend rejects this relationship before it is created.

This is handled as a dependency validation rule rather than relying only on the frontend.

---

# 13. READY / BLOCKED Engine

READY and BLOCKED are calculated from dependency relationships.

### READY

A task is considered READY when its required predecessor tasks have been completed.

Example:

```text
Requirements Analysis = DONE
          |
          v
System Design = READY
```

### BLOCKED

A task becomes BLOCKED when a required predecessor is not complete.

Example:

```text
Requirements Analysis = IN_PROGRESS
          |
          v
System Design = BLOCKED
```

The dependency state is therefore derived from the current workflow state of predecessor tasks.

---

# 14. Multi-Level Dependency Propagation

TaskFlow Pro supports dependency chains containing multiple levels.

Example:

```text
A → B → C → D
```

If A is not complete:

```text
A = IN_PROGRESS
B = BLOCKED
C = BLOCKED
D = BLOCKED
```

After A becomes DONE:

```text
A = DONE
B = READY
C = BLOCKED
D = BLOCKED
```

After B becomes DONE:

```text
A = DONE
B = DONE
C = READY
D = BLOCKED
```

This allows workflow state to propagate through an entire dependency chain.

---

# 15. Diamond Dependency Handling

The engine also handles multiple predecessors.

Example:

```text
       A
      / \
     v   v
    B     C
     \   /
      v v
       D
```

D depends on both B and C.

Therefore:

```text
B = DONE
C = IN_PROGRESS
D = BLOCKED
```

Only after both predecessors are complete:

```text
B = DONE
C = DONE
D = READY
```

This prevents a task from becoming ready when only part of its dependency requirements have been satisfied.

---

# 16. Schedule Propagation

The backend also supports schedule propagation through dependency relationships.

When an upstream task affects the workflow schedule, dependent tasks can be recalculated accordingly.

Conceptually:

```text
Upstream Task
      |
      | Schedule Change
      v
Dependent Task
      |
      v
Downstream Tasks
```

This helps keep dependent workflow schedules consistent.

---

# 17. Dependency Graph

TaskFlow Pro provides a dependency-oriented graph view.

A simple workflow can be represented as:

```text
Requirements Analysis
          |
          v
    System Design
          |
          v
 Backend Development
          |
          v
       Testing
```

For more complex projects:

```text
             Requirements
                  |
                  v
              Design
             /      \
            v        v
        Backend    Frontend
            \        /
             v      v
              Testing
```

The graph makes task relationships easier to understand than a flat task list.

---

# 18. AI Service

TaskFlow Pro includes a Gemini-powered AI service.

The current frontend workflow is task-oriented.

The user:

1. Selects a task.
2. Clicks Generate Suggestion.
3. The frontend sends the task ID.
4. The backend processes the request.
5. Gemini is used for AI-assisted analysis.
6. The resulting suggestion is stored.
7. The suggestion is returned for review.
8. The user can accept or reject it.

Flow:

```text
              User
               |
               v
          Select Task
               |
               v
      Generate Suggestion
               |
               v
POST /api/ai/suggestions
               |
               v
          AI Service
               |
               v
         Gemini API
               |
               v
      Store AI Suggestion
               |
               v
       Review Suggestion
          /         \
         v           v
      Accept       Reject
```

### Generate endpoint

```http
POST /api/ai/suggestions
```

Request:

```json
{
  "taskId": 1
}
```

### Other AI endpoints

```http
GET /api/ai/suggestions

PATCH /api/ai/suggestions/:id/accept

PATCH /api/ai/suggestions/:id/reject
```

---

# 19. AI Suggestion Review Model

AI recommendations are not automatically treated as final workflow decisions.

The application provides a human review step:

```text
AI Recommendation
       |
       v
    Review
    /    \
Accept   Reject
```

This allows the user to decide whether an AI-generated recommendation should be applied.

---

# 20. Database Design

The current project uses MySQL.

The main entities are:

```text
+------------+
|  projects  |
+-----+------+
      |
      | 1:N
      v
+------------+
|   tasks    |
+-----+------+
      |
      +----------------------+
      |                      |
      |                      |
      v                      v
+-------------+       +----------------+
| dependencies|       | ai_suggestions |
+-------------+       +----------------+
```

## Projects

The `projects` table stores project-level information.

A project can contain multiple tasks.

Relationship:

```text
Project 1 ─────── N Tasks
```

## Tasks

The `tasks` table stores workflow task information such as:

* Project relationship
* Title
* Description
* Status
* Priority
* Scheduling information

## Dependencies

The `dependencies` table stores relationships between tasks.

Conceptually:

```text
predecessor_id
      |
      v
dependencies
      |
      v
successor_id
```

This creates the directed graph used by the DAG engine.

## AI Suggestions

The `ai_suggestions` table stores generated AI recommendations and their review state.

---

# 21. Data Flow

A normal task update follows:

```text
User
 |
 v
Next.js UI
 |
 v
api.js
 |
 | PATCH
 v
Express API
 |
 v
Task / Workflow Logic
 |
 v
MySQL
 |
 v
Updated Task
 |
 v
Frontend Refresh
```

A dependency creation follows:

```text
User
 |
 v
Dependency Manager
 |
 v
POST /api/dependencies
 |
 v
Dependency Validation
 |
 +---- Self Dependency?
 |
 +---- Circular Dependency?
 |
 +---- Valid?
 |
 v
MySQL
 |
 v
Updated Dependency Graph
```

---

# 22. Dashboard Data Flow

The dashboard aggregates workflow information such as:

* Total tasks
* Completed tasks
* READY tasks
* BLOCKED tasks
* Dependencies
* Pending AI suggestions

Conceptually:

```text
Projects / Tasks / Dependencies / AI Suggestions
                    |
                    v
              Backend APIs
                    |
                    v
               Dashboard
                    |
        +-----------+-----------+
        |           |           |
       Total      READY      BLOCKED
       Tasks      Tasks       Tasks
```

---

# 23. Error Handling

The application contains reusable frontend states:

```text
LoadingState
EmptyState
ErrorState
```

### Loading

Displayed while API data is being fetched.

### Empty

Displayed when a section has no records.

Examples:

```text
No tasks yet
No dependencies yet
No pending suggestions
```

### Error

Displayed when an API operation fails.

The error state can provide a retry action where appropriate.

---

# 24. Environment Configuration

The frontend uses:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

The backend uses environment variables for configuration such as:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskflow_pro
DB_PORT=3306

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET=your_jwt_secret
```

Production values should be configured through the deployment platform rather than committed to GitHub.

---

# 25. Security Considerations

The backend architecture uses:

* JWT for stateless authentication where authentication is enabled.
* bcryptjs for password hashing.
* Parameterized SQL queries through the MySQL driver.
* Request validation using `express-validator`.
* Environment variables for secrets.
* Backend-side dependency validation.

Secrets must never be committed to the public repository.

Recommended `.gitignore` entries:

```gitignore
node_modules/
.env
.env.local
.next/
dist/
build/
```

---

# 26. Deployment Architecture

The frontend and backend can be deployed independently.

```text
                 Users
                   |
                   v
        +----------------------+
        | Next.js Frontend     |
        | Production Hosting   |
        +----------+-----------+
                   |
                   | HTTPS REST API
                   v
        +----------------------+
        | Node.js + Express    |
        | Backend              |
        +----------+-----------+
                   |
          +--------+--------+
          |                 |
          v                 v
      MySQL DB         Gemini API
```

The frontend uses the deployed backend URL through:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

---

# 27. Known Limitations

The current implementation has several limitations that should be considered before production use.

## 27.1 Local Development Configuration

The default frontend API URL points to:

```text
http://localhost:5000/api
```

Production deployment requires the appropriate environment configuration.

## 27.2 AI Suggestions Are Task-Level

The current AI generation endpoint accepts a specific task:

```json
{
  "taskId": 1
}
```

The current implementation therefore provides task-level AI suggestions rather than a fully autonomous project-wide planning system.

## 27.3 AI Suggestions Require Human Review

AI recommendations are presented for review and can be accepted or rejected.

The AI should not be treated as the authoritative source for workflow decisions.

## 27.4 Dependency Rules Are Deterministic

The DAG engine follows explicit dependency rules.

AI does not replace the dependency validation engine.

This is intentional because cycle prevention and workflow validity require deterministic rules.

## 27.5 Production Authentication and Authorization

The backend architecture supports authentication-related technologies such as JWT and role-based access control, but a complete production-grade identity and permission system would require additional deployment and security configuration.

## 27.6 Scalability

The current project is designed primarily as a hackathon/portfolio application.

Large-scale production deployment would require additional work around:

* Database indexing
* Caching
* Horizontal scaling
* Background jobs
* Rate limiting
* Observability
* Centralized logging
* Production monitoring

## 27.7 Real-Time Collaboration

The current workflow uses REST-based updates. Real-time multi-user collaboration would require an additional mechanism such as WebSockets or Server-Sent Events.

---

# 28. Example End-to-End Workflow

Consider a software project:

```text
Task 1: Requirements Analysis
Task 2: System Design
Task 3: Backend Development
Task 4: Testing
```

Dependencies:

```text
Task 1 → Task 2
Task 2 → Task 3
Task 3 → Task 4
```

Initial state:

```text
Requirements Analysis     IN_PROGRESS
System Design             BLOCKED
Backend Development       BLOCKED
Testing                   BLOCKED
```

After Requirements Analysis is completed:

```text
Requirements Analysis     DONE
System Design             READY
Backend Development       BLOCKED
Testing                   BLOCKED
```

After System Design is completed:

```text
Requirements Analysis     DONE
System Design             DONE
Backend Development       READY
Testing                   BLOCKED
```

After Backend Development is completed:

```text
Requirements Analysis     DONE
System Design             DONE
Backend Development       DONE
Testing                   READY
```

This demonstrates the main value of the dependency-aware workflow engine.

---

# 29. Complete System Flow

```text
                         TASKFLOW PRO
                              |
                              v
                    Next.js + React UI
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
   Projects              Kanban Board          Dependencies
       |                      |                      |
       |                      |                      v
       |                      |               Dependency Graph
       |                      |                      |
       +----------------------+----------------------+
                              |
                              v
                         REST API
                              |
                              v
                    Node.js + Express
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
  Task Service           DAG Engine             AI Service
       |                      |                      |
       |                +-----+------+               |
       |                |     |      |               v
       |              Cycle READY Schedule        Gemini
       |              Check BLOCKED Propagation     API
       |                      |                      |
       +----------------------+----------------------+
                              |
                              v
                         MySQL Database
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
       Projects             Tasks          Dependencies
                                                  |
                                                  v
                                           AI Suggestions
```

---

# 30. Design Principles

TaskFlow Pro follows these main design principles:

### 1. Backend as the source of workflow truth

Critical dependency validation is performed on the backend rather than trusting only the frontend.

### 2. Deterministic dependency validation

DAG and circular dependency rules are deterministic and enforceable.

### 3. Derived workflow state

READY and BLOCKED are calculated from dependency relationships instead of being treated as independent task statuses.

### 4. Human-in-the-loop AI

AI recommendations are reviewed by the user before being accepted or rejected.

### 5. Separation of concerns

```text
Frontend
   ↓
REST API
   ↓
Backend Services
   ↓
Database / AI
```

Each layer has a specific responsibility.

---

# 31. Conclusion

TaskFlow Pro extends traditional project management with dependency-aware workflow intelligence.

Its core architecture combines:

```text
Project Management
        +
Task Management
        +
Kanban Workflow
        +
DAG Dependency Engine
        +
READY / BLOCKED Calculation
        +
Schedule Propagation
        +
Dependency Visualization
        +
Gemini AI Assistance
        =
TaskFlow Pro
```

The system is designed so that project dependencies are treated as first-class workflow information rather than simple task metadata.

The deterministic DAG engine ensures that dependency relationships remain valid, while the AI layer provides additional workflow assistance that can be reviewed by the user.
