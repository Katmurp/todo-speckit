# Data Model Reference

**Status:** Features 1–5 — `users`, `sessions`, `lists`, and `todos` (with optional `dueDate`).

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `lName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `email` | STRING | Required, unique; editable via `PUT /todo/users/:id` |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via `PUT /todo/users/:id` |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default query scope; optional on profile update |
| `role` | STRING(20) | Default `worker`; read-only on profile API |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `dueDate` | DATEONLY | Nullable; optional on create/update; `YYYY-MM-DD` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- User `hasMany` Session (`userId`, `as: "sessions"`, `onDelete: CASCADE`)
- Session `belongsTo` User (`userId`, `as: "user"`)
- User `hasMany` List (`userId`, `as: "lists"`, `onDelete: CASCADE`)
- List `belongsTo` User (`userId`, `as: "user"`)
- List `hasMany` Todo (`listId`, `as: "todos"`, `onDelete: CASCADE`)
- Todo `belongsTo` List (`listId`, `as: "list"`)
- User `hasMany` Todo (`userId`, `as: "todos"`, `onDelete: CASCADE`)
- Todo `belongsTo` User (`userId`, `as: "user"`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users` / `sessions` | Feature 1 |
| Profile field editability (`PUT /todo/users/:id`) | Feature 4 |
| `lists` | Feature 2 |
| `todos` | Feature 3 |
| `todos.dueDate` | Feature 5 |
