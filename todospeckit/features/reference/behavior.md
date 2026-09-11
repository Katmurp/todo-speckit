# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

## Auth

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is **username + password** (not email) | `POST /todo/login`; username `trim().toLowerCase()` | Feature 1 |
| Passwords hashed with bcrypt, `SALT_ROUNDS = 10`; hashes never returned | Register controller; User `defaultScope` | Feature 1 |
| Session TTL is **24 hours**; reuse a non-expired session for the same user | JWT `expiresIn: 86400` + Session `expirationDate` | Feature 1 |
| New users get role `worker` | User model default | Feature 1 |
| Authenticated requests resolve `req.user.id` from the session token | `authenticate` middleware | Feature 1 |
| Logout revokes the server session, then clears `localStorage` key `user` | `POST /todo/logout`; `authServices.logoutUser` | Feature 1 |
| Missing/expired token → `401`; frontend clears `user` and redirects to login | `authenticate`; axios interceptor | Feature 1 |

## Validation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Registration email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."** | `emailRules` on Register | Feature 1 |
| Password at least 8 characters | Register form + API | Feature 1 |
| Duplicate username **"Username is already taken."**; duplicate email **"Email is already registered."** | Register API `400` | Feature 1 |
| Invalid login **"Invalid username or password."** (same message for unknown user or wrong password) | Login API `401` | Feature 1 |
| List name required (trimmed); max 100 characters | Create/rename API + Dashboard dialog | Feature 2 |
| Todo title required (trimmed); max 255 characters | Create/update todo API + items dialogs | Feature 3 |

## Ownership

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| `GET /todo/lists` returns only `userId = req.user.id`, sorted A–Z by name | `list.controller` `findAll` | Feature 2 |
| Create `userId` from `req.user.id` only — ignore body `userId` | `list.controller` `create` | Feature 2 |
| Cross-user list access → **404**, never 403 | `getAccessibleListOrNull` | Feature 2; ADR-0002 |
| Todo create only when parent list is owned; `userId`/`listId` from server context | `todo.controller` `create` | Feature 3 |
| Todo read/update/delete scoped to `userId = req.user.id` | `getAccessibleTodoOrNull` | Feature 3; ADR-0002 |
| Cross-user todo or parent-list access → **404**, never 403 | `getAccessibleListOrNull` / `getAccessibleTodoOrNull` | Feature 3; ADR-0002 |
| Todos ordered incomplete first, then `createdAt` ascending | `todo.controller` `findAllByList`; Dashboard sort | Feature 3 |
| Deleting a list deletes its todos | List `hasMany` Todo `onDelete: CASCADE` | Feature 3 |

## UI

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register are full-screen (no MenuBar) | `App.vue` hides MenuBar on those routes | Feature 1; Feature 2 chrome |
| MenuBar shows signed-in name and **Sign out** | `MenuBar.vue` | Feature 2 |
| Dashboard heading **My Lists**; empty copy **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| List rows have an Items icon that opens a list-items dialog; add/edit/delete todos use nested dialogs (no sidebar) | `Dashboard.vue` | Feature 3 |
| Items dialog empty copy **"No todos in this list yet."**; completed titles struck through | `Dashboard.vue` | Feature 3 |
| **+ Add Item** is only inside the items dialog | `Dashboard.vue` | Feature 3 |
| Unauthenticated visit to home → login; signed-in visit to login/register → home | `router.beforeEach` | Feature 1 |
| Session stored in `localStorage` under key `user` | `Utils.setStore("user", …)` | Feature 1 |
