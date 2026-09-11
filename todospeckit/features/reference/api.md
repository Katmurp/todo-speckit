# API Reference

**Status:** Features 1–4 — auth, lists, todos, and profile on `/todo`.

API mount path is `/todo` (see `backend/server.js`). Authenticated routes send `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create a user account and return a session |
| `POST` | `/todo/login` | No | Authenticate with username + password |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the authenticated user |
| `POST` | `/todo/lists` | Yes | Create a list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (title and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile |

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

## List payload

Create `201` / rename `200`:

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of those objects, sorted A–Z by `name`.

## Todo payload

Create `201` / update `200`:

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Create body: `{ "title": "Buy milk" }`. `userId` and `listId` are taken from the authenticated user and `:listId` — client `userId` in the body is ignored.

`GET /todo/lists/:listId/todos` returns an array of those objects, incomplete first, then by `createdAt` ascending.

## Profile payload

GET/PUT `200`:

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Update body includes `fName`, `lName`, `email`, and `username`. `password` is optional; omit it to leave the current password unchanged. `role` is read-only. Password hashes are never returned. Self-access only: `:id` must equal `req.user.id`.

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
| Empty list name | `400` | `"List name is required."` |
| List name longer than 100 characters | `400` | `"List name must be 100 characters or fewer."` |
| List not found or not owned | `404` | `"List with id=<id> not found."` |
| Empty todo title | `400` | `"Todo title is required."` |
| Todo title longer than 255 characters | `400` | `"Todo title must be 255 characters or fewer."` |
| Todo not found or not owned | `404` | `"Todo with id=<id> not found."` |
| User not found or not self | `404` | `"User with id=<id> not found."` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Authenticated routes: `Authorization: Bearer <token>`.
- Password hashes are never returned.

## Feature provenance

| Area | Introduced |
|------|------------|
| Register / login / logout | Feature 1 |
| Session Bearer auth | Feature 1 |
| List CRUD | Feature 2 |
| Todo items nested under lists | Feature 3 |
| Profile GET/PUT | Feature 4 |
