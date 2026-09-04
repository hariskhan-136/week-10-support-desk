# Support Desk API

A role-based customer support ticket management API built with NestJS, TypeScript, PostgreSQL, TypeORM, JWT authentication, and bcrypt.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- bcrypt
- class-validator
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
- View ticket events for their own tickets
- View available tags

### Agent

- Login
- View tickets
- Update tickets
- Assign tickets to agents/admins
- Change ticket status
- Add public and internal comments
- View internal comments
- Manage ticket tags
- View ticket events

### Admin

- Login
- All agent capabilities
- Create tags
- Delete tickets
- Manage administrative operations

## Seed Accounts

The database seed creates the following accounts.

| Role     | Email                       | Password        |
| -------- | --------------------------- | --------------- |
| Admin    | admin@supportdesk.local     | SupportDesk123! |
| Agent    | agent1@supportdesk.local    | SupportDesk123! |
| Agent    | agent2@supportdesk.local    | SupportDesk123! |
| Customer | customer1@supportdesk.local | SupportDesk123! |
| Customer | customer2@supportdesk.local | SupportDesk123! |
| Customer | customer3@supportdesk.local | SupportDesk123! |
| Customer | customer4@supportdesk.local | SupportDesk123! |
| Customer | customer5@supportdesk.local | SupportDesk123! |

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

Run the committed migration:

```bash
npm run migration:run
```

Then run the seed:

```bash
npm run seed
```

### Database setup order

1. Configure `.env`
2. Create the PostgreSQL database
3. Run migrations
4. Run the seed
5. Start the API

The application uses `synchronize=false`; database structure is managed through migrations.

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

A client cannot choose an elevated role during registration.

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

Customers can create tickets.

Priority determines the server-generated due date:

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

Customers only receive their own tickets.

### Get Ticket

```http
GET /tickets/:id
Authorization: Bearer <token>
```

### Update Ticket

```http
PATCH /tickets/:id
Authorization: Bearer <token>
```

### Assign Ticket

```http
PATCH /tickets/:id/assign
Authorization: Bearer <token>
```

Only an agent or admin can be assigned.

### Change Ticket Status

```http
PATCH /tickets/:id/status
Authorization: Bearer <token>
```

Allowed status flow:

```text
open → in_progress → resolved → closed
                       ↓
                  in_progress

closed → in_progress
```

Invalid transitions return `409 Conflict`.

Reopening a closed ticket requires a note.

### Delete Ticket

```http
DELETE /tickets/:id
Authorization: Bearer <token>
```

Admin only.

## Comments

### Create Comment

```http
POST /tickets/:ticketId/comments
Authorization: Bearer <token>
```

Comments can be public or internal.

Customers cannot create internal comments.

### List Comments

```http
GET /tickets/:ticketId/comments
Authorization: Bearer <token>
```

Customers only receive public comments.

Agents and admins can see internal comments.

## Tags

### List Tags

```http
GET /tags
Authorization: Bearer <token>
```

### Create Tag

```http
POST /tags
Authorization: Bearer <token>
```

Admin only.

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

Events are automatically written when:

- A ticket is assigned
- A ticket changes status

There is no direct event creation endpoint.

Events are returned newest first.

## Authorization

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

Role-based endpoints use declarative roles and a `RolesGuard`.

Unauthorized requests return `401`.

Authenticated users without the required role return `403`.

## Validation and Errors

The API uses global validation with:

- whitelist
- forbidNonWhitelisted

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

## Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run coverage:

```bash
npm run test:cov
```

Unit tests cover:

- Legal status transitions
- Illegal status transitions
- Closed-ticket reopening rule
- Due-date calculation for all priorities
- Customer ticket visibility

The unit tests mock repositories and do not require a running database.

## Build

```bash
npm run build
```

## Database Migration Commands

Generate a migration:

```bash
npm run migration:generate
```

Run migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

## Project Structure

```text
src/
├── auth/
├── comments/
├── common/
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

src/migrations/
└── InitialSchema migration
```

## CORS

The API allows the development frontend origin:

```text
http://localhost:3000
```

## CI

The project CI runs on pushes and pull requests.

CI performs:

```bash
npm ci
npm run build
npm test
```

CI uses Node.js 20.

## Database Design

The project contains six main tables:

- users
- tickets
- comments
- tags
- ticket_tags
- ticket_events

See [`docs/ERD.md`](docs/ERD.md) for the complete Mermaid ER diagram.

## Security

- Passwords are hashed using bcrypt.
- JWT is used for authentication.
- Password hashes are never returned in API responses.
- Customers cannot register as agents or admins.
- Internal comments are hidden from customers.
- Customer ticket visibility is restricted to their own tickets.
- Real secrets must be stored in environment variables.
````
