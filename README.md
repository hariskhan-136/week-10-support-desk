````markdown
# Support Desk API

A role-based customer support ticket management API built with NestJS, TypeScript, PostgreSQL, TypeORM, JWT authentication, and bcrypt.

## Tech Stack

- NestJS 12
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- bcrypt
- class-validator
- Vitest
- Jest
- Supertest

## Roles

The API supports three roles:

### Customer

- Register and login
- Create tickets
- View only their own tickets
- Update their own tickets
- Add public comments
- View only public comments on their tickets
- View events for their own tickets
- View available tags

### Agent

- Login
- View all tickets
- Update tickets
- Assign tickets to agents/admins
- Change ticket status
- Add public and internal comments
- View internal comments
- Attach and remove ticket tags
- View ticket events

### Admin

- Login
- All agent capabilities
- Create tags
- Delete tickets
- Manage administrative operations

## Seed Accounts

The database seed creates the following accounts:

| Role     | Email                         | Password          |
| -------- | ----------------------------- | ----------------- |
| Admin    | `admin@supportdesk.local`     | `SupportDesk123!` |
| Agent    | `agent1@supportdesk.local`    | `SupportDesk123!` |
| Agent    | `agent2@supportdesk.local`    | `SupportDesk123!` |
| Customer | `customer1@supportdesk.local` | `SupportDesk123!` |
| Customer | `customer2@supportdesk.local` | `SupportDesk123!` |
| Customer | `customer3@supportdesk.local` | `SupportDesk123!` |
| Customer | `customer4@supportdesk.local` | `SupportDesk123!` |
| Customer | `customer5@supportdesk.local` | `SupportDesk123!` |

The seed is idempotent and can be run multiple times safely.

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=support_desk

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```
````

See `.env.example` for the required environment variable names.

Do not commit real secrets or passwords to the repository.

## Installation

```bash
npm install
```

## Database Setup

Make sure PostgreSQL is running and the `support_desk` database exists.

### Database Setup Order

1. Configure `.env`
2. Create the PostgreSQL database
3. Run the migration
4. Run the seed
5. Start the API

Run the committed migration:

```bash
npm run migration:run
```

Then run the seed:

```bash
npm run seed
```

The application uses `synchronize=false`. Database structure is managed through migrations.

## Running the Application

Development:

```bash
npm run start
```

Watch mode:

```bash
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

The API runs on:

```text
http://localhost:3000
```

## Authentication Endpoints

### Register

```http
POST /auth/register
```

Creates a customer account.

Registration always creates a `customer`.

A client cannot choose `agent` or `admin` through the registration request.

### Login

```http
POST /auth/login
```

Returns a JWT access token.

### Current User

```http
GET /auth/me

Authorization: Bearer <token>
```

Returns the authenticated user's profile without exposing the password hash.

## Ticket Endpoints

### Create Ticket

```http
POST /tickets

Authorization: Bearer <token>
```

Creates a ticket.

The due date is calculated server-side from the selected priority:

- `urgent` → 4 hours
- `high` → 24 hours
- `normal` → 72 hours
- `low` → 168 hours

`dueAt` cannot be supplied by the client.

### List Tickets

```http
GET /tickets

Authorization: Bearer <token>
```

Supports:

- `status`
- `priority`
- `assigneeId`
- `tag`
- `q`
- `overdue`
- `sort`
- `order`
- `page`
- `pageSize`

Example:

```text
GET /tickets?status=open&priority=high&page=1&pageSize=10
```

The filters can be combined.

The `q` parameter performs a case-insensitive search across the ticket subject and body.

The `overdue=true` filter returns tickets whose due date has passed and which are not resolved or closed.

Sorting supports:

- `createdAt`
- `dueAt`
- `priority`

Ordering supports:

- `asc`
- `desc`

Pagination uses `page` and `pageSize`.

The default `pageSize` is `20` and the maximum is `100`.

The response uses the following envelope:

```json
{
  "data": [],
  "page": 1,
  "pageSize": 20,
  "total": 0
}
```

`total` represents the number of records matching the filters before pagination.

Customers only receive their own tickets.

Agents and admins can view all tickets.

### Get Ticket

```http
GET /tickets/:id

Authorization: Bearer <token>
```

Returns a single ticket.

A customer attempting to access another customer's ticket receives `404 Not Found`.

### Update Ticket

```http
PATCH /tickets/:id

Authorization: Bearer <token>
```

The ticket requester or an authorized agent can update the ticket.

### Assign Ticket

```http
POST /tickets/:id/assign

Authorization: Bearer <token>
```

Only agents and admins can assign tickets.

The proposed assignee must be an agent or admin.

Assigning a customer returns `422 Unprocessable Entity`.

Every assignment creates a ticket event.

### Change Ticket Status

```http
POST /tickets/:id/status

Authorization: Bearer <token>
```

Only agents and admins can change ticket status.

Allowed status transitions are:

```text
open → in_progress
in_progress → resolved
resolved → closed
resolved → in_progress
closed → in_progress
```

Invalid status transitions return:

```text
409 Conflict
```

Reopening a closed ticket requires a non-empty note.

Every status change creates a ticket event.

### Delete Ticket

```http
DELETE /tickets/:id

Authorization: Bearer <token>
```

Admin only.

Deleting a ticket also removes its related comments and events.

## Comments

### Create Comment

```http
POST /tickets/:ticketId/comments

Authorization: Bearer <token>
```

Creates a public or internal comment.

Only agents and admins can create internal comments.

Customers attempting to create an internal comment receive `403 Forbidden`.

### List Comments

```http
GET /tickets/:ticketId/comments

Authorization: Bearer <token>
```

Customers only receive public comments.

Agents and admins can see internal comments.

Internal comments are never returned to customers.

## Tags

### List Tags

```http
GET /tags

Authorization: Bearer <token>
```

Available to all authenticated users.

### Create Tag

```http
POST /tags

Authorization: Bearer <token>
```

Admin only.

Creating a duplicate tag returns:

```text
409 Conflict
```

### Attach Tag

```http
POST /tickets/:ticketId/tags

Authorization: Bearer <token>
```

Agent/admin only.

### Remove Tag

```http
DELETE /tickets/:ticketId/tags/:tagId

Authorization: Bearer <token>
```

Agent/admin only.

## Ticket Events

### List Ticket Events

```http
GET /tickets/:ticketId/events

Authorization: Bearer <token>
```

Events are automatically created by the server when:

- A ticket is assigned
- A ticket changes status

Each event records the actor and the change.

There is no direct event creation endpoint.

Events are returned newest first.

## Authorization

All endpoints except registration and login require authentication.

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

Role-based endpoints use the declarative `@Roles()` decorator and `RolesGuard`.

Unauthorized requests return:

```text
401 Unauthorized
```

Authenticated users without the required role return:

```text
403 Forbidden
```

## Validation and Errors

The API uses a global `ValidationPipe` configured with:

- `whitelist`
- `forbidNonWhitelisted`

This rejects undeclared request properties such as a client-supplied `dueAt`.

Errors use a consistent response structure:

```json
{
  "message": "Error message",
  "error": "Bad Request",
  "statusCode": 400,
  "path": "/example",
  "timestamp": "2026-09-04T00:00:00.000Z"
}
```

The API uses appropriate HTTP status codes for authentication, authorization, validation, missing resources, invalid state transitions, and invalid assignments, including:

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Unprocessable Entity`

## Testing

### Unit Tests

Run:

```bash
npm test
```

Unit tests cover:

- All legal status transitions
- All illegal status transitions
- Closed-ticket reopening rule
- Due-date calculation for all four priorities
- Customer ticket visibility

The unit tests mock repositories and do not require a running database.

### End-to-End Tests

Run:

```bash
npm run test:e2e
```

The E2E suite uses Vitest with Supertest and boots the Nest application inside the test suite.

The test is self-contained and does not require a separately running API server.

The E2E suite explicitly verifies:

- Unauthenticated request returns `401`
- Invalid ticket request returns `400`
- Customer registration
- Login
- Ticket creation
- Ticket filtering and pagination
- Ticket assignment
- Legal status transition
- Illegal status transition returns `409`
- Public comment creation
- Customer isolation returns `404`

Latest successful verification:

```text
Test Files  1 passed (1)
Tests       10 passed (10)
```

### Coverage

```bash
npm run test:cov
```

## Build

```bash
npm run build
```

## Database Migration Commands

Run migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Generate a migration when required:

```bash
npm run migration:generate
```

The project contains one committed initial migration that creates the complete Support Desk schema.

## Project Structure

```text
src/
├── auth/
├── comments/
├── common/
├── migrations/
├── seed/
├── tags/
├── ticket-events/
├── ticket-tags/
├── tickets/
├── users/
├── app.module.ts
├── data-source.ts
└── main.ts

docs/
└── ERD.md

test/
├── app.e2e-spec.ts
├── jest-e2e.json
└── vitest-e2e.config.ts

README.md
package.json
tsconfig.json
jest.config.ts
.env.example

.github/
└── workflows/
    └── ci.yml
```

## Database Design

The project contains six tables:

- `users`
- `tickets`
- `comments`
- `tags`
- `ticket_tags`
- `ticket_events`

The database uses real PostgreSQL enum types for:

- Ticket status
- Ticket priority

See [`docs/ERD.md`](docs/ERD.md) for the complete Mermaid ER diagram.

The `tickets.assignee_id` relationship is nullable because a ticket may exist without an assignee.

## CORS

The API allows the development frontend origin:

```text
http://localhost:3000
```

## CI

The project uses GitHub Actions for continuous integration.

CI runs on:

- Push
- Pull request

CI uses Node.js 20 and performs:

```bash
npm ci
npm run build
npm test
```

The Week 10 CI workflow validates the application without requiring a running PostgreSQL server, external API, or committed secrets.

## Git and Contribution Workflow

All Week 10 grader fixes and documentation changes should be made through a feature/fix branch and pull request.

Required workflow:

```text
Create branch
    ↓
Make changes
    ↓
Run verification
    ↓
Commit changes
    ↓
Push branch
    ↓
Open Pull Request
    ↓
Collaborator review
    ↓
Collaborator merges PR
    ↓
Update local default branch
```

Direct pushes to the default branch should not be used for project changes that require review.

## Security

- Passwords are hashed using bcrypt.
- JWT is used for authentication.
- Password hashes are never returned in API responses.
- Customers cannot register as agents or admins.
- Internal comments are hidden from customers.
- Customer ticket visibility is restricted to their own tickets.
- Role-protected endpoints use `RolesGuard`.
- Real secrets must be stored in environment variables.
- `.env` is not committed to the repository.

---

## 👨‍💻 Developer

**Muhammad Haris**

GitHub: https://github.com/hariskhan-136

---

## 🎓 Internship

**Coding Pixel Full-Stack Internship Program**

**Week 10 — Support Desk Backend**

**Repository created for Week 10 Support Desk Backend internship exercise**

```

```
