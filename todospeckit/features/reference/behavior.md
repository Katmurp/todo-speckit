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

## UI

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register are full-screen (no MenuBar) | `App.vue` has no MenuBar | Feature 1 |
| Protected home shows a welcome using the user's first name and a **Sign out** button | `Home.vue` | Feature 1 |
| Unauthenticated visit to home → login; signed-in visit to login/register → home | `router.beforeEach` | Feature 1 |
| Session stored in `localStorage` under key `user` | `Utils.setStore("user", …)` | Feature 1 |
