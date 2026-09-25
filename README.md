# TaskFlow Pro

> Dependency-Aware Workflow and DAG Scheduling Engine

TaskFlow Pro is a smart project and task management platform for
workflows where task order and dependencies matter. It combines project
and task management with a Kanban board, dependency management, DAG
validation, dependency-aware READY/BLOCKED states, schedule propagation,
dependency visualization, and Gemini-powered AI workflow suggestions.

Built for the **Contata Hackathon 2026**.

## Features

-   Project creation and project switching
-   Task CRUD operations
-   Kanban workflow with `BACKLOG`, `IN_PROGRESS`, `REVIEW`, and `DONE`
-   Drag-and-drop task status updates
-   Task search and status filtering
-   Dependency creation, viewing, and deletion
-   Self-dependency prevention
-   Circular dependency prevention
-   DAG validation
-   Automatic READY/BLOCKED dependency state
-   Multi-level dependency propagation
-   Diamond dependency handling
-   Schedule propagation
-   Dependency graph visualization
-   Gemini AI workflow suggestions
-   AI suggestion accept/reject workflow
-   Dashboard statistics
-   Loading, empty, and error states
-   Dark-mode interface

## Problem

Normal task managers often treat tasks as independent records. Real
projects contain relationships such as:

``` text
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

If a task depends on another unfinished task, it should not be treated
as ready. TaskFlow Pro models these relationships as a directed acyclic
graph and uses them to calculate workflow readiness.

## Solution

TaskFlow Pro combines a deterministic dependency engine with an AI
assistance layer.

``` text
Create Project
      |
      v
Create Tasks
      |
      v
Create Dependencies
      |
      v
Validate DAG
      |
      v
Calculate READY / BLOCKED
      |
      v
Manage Kanban Workflow
      |
      v
Use AI Suggestions
      |
      v
Accept / Reject
```

## Architecture

``` text
                         TASKFLOW PRO
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        PROJECTS           TASK BOARD     DEPENDENCIES
              │               │               │
              │               │               ▼
              │               │          Dependency Graph
              │               │               │
              └───────────────┼───────────────┘
                              │
                         REST API
                              │
                              ▼
                    Node.js + Express
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
     Task Service        DAG Engine          AI Service
          │                   │                   │
          │          ┌────────┼────────┐          │
          │          │        │        │          ▼
          │       Cycle     READY   Schedule   Gemini API
          │       Check    /BLOCKED Propagation
          │          │        │        │
          └──────────┴────────┴────────┘
                              │
                              ▼
                         MySQL Database
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
           Projects          Tasks       Dependencies
                                              │
                                              ▼
                                       AI Suggestions
```

## Technology Stack

  Layer              Technology
  ------------------ ----------------------
  Frontend           Next.js 16
  UI                 React
  Styling            Tailwind CSS v4
  Backend            Node.js + Express.js
  Database           MySQL
  DB Driver          mysql2/promise
  AI                 Google Gemini API
  Authentication     JWT
  Password Hashing   bcryptjs
  Validation         express-validator
  API                REST
  Version Control    Git + GitHub

## Project Structure

``` text
taskflow-pro/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   ├── StatCard.js
│   │   │   ├── TaskCard.js
│   │   │   ├── TaskModal.js
│   │   │   ├── KanbanBoard.js
│   │   │   ├── ThemeToggle.js
│   │   │   ├── DependencyManager.js
│   │   │   ├── DependencyGraph.js
│   │   │   ├── AISuggestions.js
│   │   │   ├── ProjectModal.js
│   │   │   ├── TaskManager.js
│   │   │   ├── ProjectManager.js
│   │   │   ├── LoadingState.js
│   │   │   ├── EmptyState.js
│   │   │   ├── ErrorState.js
│   │   │   └── ProjectSelector.js
│   │   └── lib/
│   │       └── api.js
│   └── package.json
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   ├── schema.sql
│   ├── server.js
│   └── package.json
└── README.md
```

> The exact backend folder layout can vary with the final repository
> organization.

## Dependency Engine

Dependencies are represented as directed edges:

``` text
Predecessor → Successor
```

A valid workflow:

``` text
A → B → C
```

An invalid circular workflow:

``` text
A → B
B → C
C → A
```

The backend prevents:

-   Self-dependencies such as `A → A`
-   Circular dependencies
-   Invalid task relationships

### READY and BLOCKED

READY and BLOCKED are computed workflow states, not database task
statuses.

``` text
Requirements Analysis = IN_PROGRESS
          |
          v
System Design = BLOCKED
```

After the predecessor becomes `DONE`:

``` text
Requirements Analysis = DONE
          |
          v
System Design = READY
```

### Multi-level propagation

For:

``` text
A → B → C → D
```

if A is incomplete, downstream tasks can remain blocked until their
required predecessors are completed.

### Diamond dependencies

TaskFlow Pro also handles:

``` text
       A
      /      v   v
    B     C
     \   /
      v v
       D
```

D becomes ready only after both B and C satisfy its dependency
requirements.

## Kanban Workflow

Tasks use four statuses:

``` text
BACKLOG
IN_PROGRESS
REVIEW
DONE
```

Example:

``` text
+----------+-------------+--------+------+
| Backlog  | In Progress | Review | Done |
+----------+-------------+--------+------+
```

Tasks can be moved between columns with drag and drop.

## AI Suggestions

The application integrates Google Gemini for task-level workflow
suggestions.

Flow:

``` text
Select Task
     |
     v
Generate Suggestion
     |
     v
POST /api/ai/suggestions
     |
     v
Gemini
     |
     v
Store Suggestion
     |
     v
Review
   /   Accept Reject
```

The current API accepts a task ID:

``` json
{
  "taskId": 1
}
```

AI suggestions are reviewed by the user before being accepted or
rejected.

## API Reference

Base URL:

``` text
http://localhost:5000/api
```

### Projects

``` http
POST /api/projects
GET /api/projects
GET /api/projects/:id
```

### Tasks

``` http
POST /api/projects/:id/tasks
GET /api/projects/:id/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

### Dependencies

``` http
POST /api/dependencies
GET /api/tasks/:id/dependencies
DELETE /api/dependencies/:id
```

### AI Suggestions

``` http
POST /api/ai/suggestions
GET /api/ai/suggestions
PATCH /api/ai/suggestions/:id/accept
PATCH /api/ai/suggestions/:id/reject
```

Generate request example:

``` json
{
  "taskId": 1
}
```

## Database Design

Core tables:

``` text
projects
   |
   +----< tasks
             |
             +----< dependencies
             |
             +----< ai_suggestions
```

### projects

Stores project information.

### tasks

Stores project tasks, descriptions, status, priority, and scheduling
information.

### dependencies

Stores directed relationships between tasks.

Conceptually:

``` text
predecessor_task
       |
       v
 dependency
       |
       v
successor_task
```

### ai_suggestions

Stores AI-generated recommendations and their review state.

## Getting Started

### Prerequisites

Install:

-   Node.js
-   npm
-   MySQL
-   Git
-   Google Gemini API key

Check Node.js:

``` bash
node -v
```

Check npm:

``` bash
npm -v
```

## Clone

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd taskflow-pro
```

## Backend Setup

``` bash
cd backend
npm install
```

Create `backend/.env`:

``` env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskflow_pro
DB_PORT=3306

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET=your_jwt_secret
```

Use your actual values.

## Database Setup

Create the database:

``` sql
CREATE DATABASE taskflow_pro;
```

Then:

``` sql
USE taskflow_pro;
```

Import:

``` text
backend/schema.sql
```

You can use MySQL Workbench or the MySQL command line.

## Start Backend

From `backend`:

``` bash
npm run dev
```

or:

``` bash
npm start
```

Backend:

``` text
http://localhost:5000
```

API:

``` text
http://localhost:5000/api
```

## Frontend Setup

Open another terminal:

``` bash
cd frontend
npm install
```

Create `frontend/.env.local`:

``` env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start:

``` bash
npm run dev
```

Frontend:

``` text
http://localhost:3000
```

## Running the Complete Project

Terminal 1:

``` bash
cd backend
npm run dev
```

Terminal 2:

``` bash
cd frontend
npm run dev
```

Open:

``` text
http://localhost:3000
```

## Example Workflow

A sample software project can use:

``` text
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

A more complex workflow:

``` text
                    +----------------------+
                    | Requirements Analysis|
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |    System Design     |
                    +----------+-----------+
                               |
                +--------------+--------------+
                |                             |
                v                             v
       +----------------+             +----------------+
       | Backend API    |             | Frontend UI    |
       +-------+--------+             +--------+-------+
               |                               |
               +---------------+---------------+
                               |
                               v
                    +----------------------+
                    |       Testing        |
                    +----------------------+
```

## Testing Checklist

1.  Create a project.
2.  Create multiple tasks.
3.  Create task dependencies.
4.  Verify READY/BLOCKED states.
5.  Move tasks through Kanban statuses.
6.  Complete upstream tasks and verify downstream state changes.
7.  Try to create a self-dependency and verify rejection.
8.  Try to create a circular dependency and verify rejection.
9.  Test multi-level dependencies.
10. Test diamond dependencies.
11. Generate an AI suggestion for a task.
12. Accept and reject AI suggestions.
13. Verify dashboard statistics.

## Important Design Decisions

### Why DAG?

A dependency graph should not contain cycles because a cycle can create
an impossible workflow.

``` text
A depends on B
B depends on C
C depends on A
```

There is no valid starting point. DAG validation prevents this.

### Why REST APIs?

Separating the frontend and backend:

-   Keeps UI and business logic independent
-   Centralizes database operations
-   Prevents direct database access from the browser
-   Allows independent deployment
-   Makes the backend reusable by other clients

### Why MySQL?

The application contains strongly related entities such as projects,
tasks, and dependencies. A relational database is appropriate for these
relationships and integrity constraints.

### Why Gemini?

Gemini adds an AI assistance layer on top of the deterministic
dependency engine.

``` text
Deterministic Workflow Rules
             +
       Gemini AI Layer
             =
   Smart Workflow Management
```

The dependency engine handles workflow rules, while AI provides
recommendations for human review.

## Security

Never commit:

``` text
.env
.env.local
API keys
JWT secrets
Database passwords
```

Recommended `.gitignore`:

``` gitignore
node_modules/
.env
.env.local
.next/
dist/
build/
```

Use parameterized SQL queries and request validation on the backend.

## Deployment

The frontend and backend can be deployed independently:

``` text
Users
  |
  v
Next.js Frontend
  |
  | HTTPS REST API
  v
Node.js + Express Backend
  |
  +----> MySQL
  |
  +----> Gemini API
```

For production, configure the frontend with the deployed backend URL:

``` env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

Keep all production secrets in the hosting provider's
environment-variable settings.

## Future Enhancements

Potential improvements:

-   User authentication UI
-   Team collaboration
-   Task assignment
-   Real-time updates
-   Gantt charts
-   Advanced DAG visualization
-   Critical-path analysis
-   Automatic task scheduling
-   Calendar integration
-   Notifications
-   Email notifications
-   AI task breakdown
-   AI dependency recommendations
-   AI risk detection
-   Project-level AI planning
-   Workflow analytics
-   Production-grade role and permission management

## Project Status

Implemented:

-   Project management
-   Task CRUD
-   Kanban workflow
-   Drag-and-drop status management
-   Dependency management
-   DAG validation
-   Self-dependency prevention
-   Circular dependency prevention
-   READY/BLOCKED calculation
-   Multi-level dependency propagation
-   Diamond dependency handling
-   Schedule propagation
-   Dependency graph
-   Gemini AI suggestions
-   AI suggestion accept/reject
-   Dashboard statistics
-   Loading states
-   Empty states
-   Error states
-   Dark UI
-   Project switching

## Author

**Rachit Gangwar**

B.Tech --- Computer Science & Engineering (Artificial Intelligence)

NIET, Greater Noida

## Acknowledgements

-   Contata Solutions --- Hackathon 2026
-   Google Gemini API
-   Next.js
-   React
-   Node.js
-   Express.js
-   MySQL
-   Tailwind CSS

## License

This project is currently intended for educational, hackathon, and
portfolio purposes.

If you plan to distribute it as open source, add an appropriate license
such as MIT.
