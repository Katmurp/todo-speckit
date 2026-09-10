# Data Model Reference

**Status:** Feature 1 — `users` and `sessions` tables.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default query scope |
| `role` | STRING(20) | Default `worker` |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |

## Associations

- User `hasMany` Session (`userId`, `as: "sessions"`, `onDelete: CASCADE`)
- Session `belongsTo` User (`userId`, `as: "user"`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users` / `sessions` | Feature 1 |
