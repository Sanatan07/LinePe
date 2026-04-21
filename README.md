# LinePe

LinePe is a full-stack real-time chat application built with React, Vite, Express, MongoDB, Socket.IO, Redis, and PostgreSQL. It supports authenticated one-to-one and group messaging, live presence, typing indicators, message status updates, attachments, invites, audit logs, and session management.

## Features

- Email OTP signup and cookie-based JWT authentication
- Access and refresh token rotation with device/session controls
- Real-time messaging with Socket.IO
- Online presence, typing indicators, delivered/read status, and message sync
- Direct chats and group conversations
- Group membership and admin management
- Message search and conversation search
- Image/file attachment upload through Cloudinary
- User search and invite flow
- Audit logging for auth and operational events
- Health endpoint with service and metric snapshots
- Optional Redis-backed Socket.IO adapter, presence store, and background queue
- Optional PostgreSQL registry for synced registered-user records
- Docker Compose and Kubernetes deployment manifests

## Tech Stack

**Frontend**

- React 19
- Vite
- Tailwind CSS 4
- DaisyUI
- Zustand
- Axios
- Socket.IO Client
- React Router

**Backend**

- Node.js
- Express 5
- Socket.IO
- MongoDB with Mongoose
- Redis
- PostgreSQL
- BullMQ
- Cloudinary
- Nodemailer
- Helmet, CORS, cookie-parser, rate limiting

## Project Structure

```text
.
+-- backend/              # Express API, Socket.IO server, jobs, models, routes
+-- frontend/             # React/Vite client
+-- k8s/                  # Kubernetes manifests
+-- Dockerfile            # Production image for the full app
+-- docker-compose.yml    # Local production-like stack
`-- README.md
```

## Prerequisites

- Node.js 20 or newer recommended
- npm
- MongoDB
- Optional: Redis for scaled realtime presence, Socket.IO adapter, and queues
- Optional: PostgreSQL for the registered user registry
- Optional: Cloudinary account for profile images and message attachments
- Optional: SMTP credentials or a Resend API key for signup OTP emails

## Environment Variables

Create a `backend/.env` file:

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
TRUST_PROXY=1

MONGODB_URI=mongodb://localhost:27017/linepe

# Required in production. In development, missing values are generated temporarily.
JWT_SECRET=replace-with-a-long-random-jwt-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret

# Optional but recommended for realtime scaling and background queues.
REDIS_URL=redis://localhost:6379

# Optional registered-user registry.
POSTGRES_URL=postgres://linepe:linepe@localhost:5432/linepe
POSTGRES_SSL=false

# Cookie settings. Use COOKIE_SECURE=true behind HTTPS in production.
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false

# Cloudinary uploads.
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Invite links.
INVITE_BASE_URL=http://localhost:5173

# Email via SMTP.
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM="LinePe <no-reply@example.com>"

# Or email via Resend.
RESEND_API_KEY=your-resend-api-key
```

Create a `frontend/.env` file if the API is not running at the default development URL:

```env
VITE_API_URL=http://localhost:5000/api
```

## Local Development

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start MongoDB locally, then run the backend:

```bash
cd backend
npm run dev
```

In a second terminal, run the frontend:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

## Running With Docker Compose

The compose file starts MongoDB, Redis, PostgreSQL, and the production app container:

```bash
docker compose up --build
```

The app is exposed at:

```text
http://localhost:5000
```

Before using this for anything beyond local testing, replace the placeholder JWT secrets and service credentials in `docker-compose.yml`.

## Available Scripts

Backend scripts:

```bash
npm run dev                      # Start API with nodemon
npm start                        # Start API with node
npm run worker                   # Start background worker
npm run seed:users               # Seed sample users
npm run seed:admin               # Seed admin user
npm run migrate:users:postgres   # Sync existing Mongo users into PostgreSQL
```

Frontend scripts:

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Overview

The backend exposes these main route groups:

```text
GET  /api/health

/api/auth       # Signup, OTP verification, login, logout, refresh, profile, sessions
/api/messages   # Users, conversations, direct messages, groups, search, uploads, read status
/api/invites    # Create, inspect, and redeem invite links
/api/users      # User search and invite target lookup
/api/logs       # Admin-only audit log access
```

Authentication is cookie based. The frontend sends requests with credentials enabled and refreshes sessions through `/api/auth/refresh-token` when possible.

## Realtime Events

Socket.IO authenticates using the `accessToken` cookie. The server supports:

- Online user broadcasting
- Typing start/stop events
- Message delivered acknowledgements
- Message sync requests
- Per-user rooms for targeted message events

If `REDIS_URL` is configured, Socket.IO uses the Redis adapter and Redis-backed presence. Without Redis, it falls back to in-memory presence, which is suitable for a single backend instance.

## Data Stores

- MongoDB stores users, messages, conversations, invites, and audit logs.
- PostgreSQL stores a synchronized `registered_users` table when `POSTGRES_URL`, `POSTGRES_URI`, or `DATABASE_URL` is configured.
- Redis is used for optional realtime scaling, presence, and queue support.

## Deployment Notes

- Build the frontend before serving the full app in production.
- Set `NODE_ENV=production`.
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Set `COOKIE_SECURE=true` when serving over HTTPS.
- Configure `CLIENT_URLS` with every trusted browser origin, separated by commas.
- Configure Cloudinary before enabling image uploads.
- Configure SMTP or Resend before enabling signup OTP emails.
- Review and customize files in `k8s/` before deploying to a cluster.

## Kubernetes

The `k8s/` directory includes example manifests:

```text
namespace.yaml
configmap.yaml
secret.example.yaml
deployment.yaml
service.yaml
ingress.yaml
```

Copy `secret.example.yaml`, replace placeholder values, and apply the manifests in an order appropriate for your cluster.

## Security Notes

- Do not commit real secrets.
- Rotate placeholder secrets before production use.
- Keep CORS origins restricted through `CLIENT_URLS`.
- Use HTTPS in production so secure cookies can be enabled.
- The audit route is currently restricted to the configured admin username in backend route logic.

## License

This project currently uses the license declared in `backend/package.json`: ISC.
