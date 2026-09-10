# API Reference

**Status:** Feature 1 — authentication endpoints on `/todo`.

API mount path is `/todo` (see `backend/server.js`). Authenticated routes send `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create a user account and return a session |
| `POST` | `/todo/login` | No | Authenticate with username + password |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Lists owned by the authenticated user (empty until Feature 2) |

## Auth success payload

Login and register return flat JSON (no envelope):

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

- Register: `201`
- Login: `200`

## Errors

Errors: `{ "message": "..." }`.

| Situation | Status | Message |
|-----------|--------|---------|
| Missing required register/login field | `400` | e.g. `"Email is required."`, `"Username is required."` |
| Password shorter than 8 characters | `400` | `"Password must be at least 8 characters."` |
| Duplicate username | `400` | `"Username is already taken."` |
| Duplicate email | `400` | `"Email is already registered."` |
| Bad credentials | `401` | `"Invalid username or password."` |
| Missing Bearer token | `401` | `"Unauthorized! No token provided."` |
| Invalid or expired token | `401` | `"Unauthorized! Invalid or expired token."` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Authenticated routes: `Authorization: Bearer <token>`.
- Password hashes are never returned.

## Feature provenance

| Area | Introduced |
|------|------------|
| Register / login / logout | Feature 1 |
| Session Bearer auth | Feature 1 |
| `GET /todo/lists` stub (empty array) | Feature 1 |
