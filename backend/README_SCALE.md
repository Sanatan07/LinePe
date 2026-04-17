## Scale layer (Redis)

This backend can run **without Redis**. If `REDIS_URL` is set, it enables:

- Cross-instance Socket.IO events via `@socket.io/redis-adapter`
- Redis-backed online presence (so presence is not tied to one Node process)
- BullMQ queue for background jobs (notifications/email placeholders)

### Environment

- `REDIS_URL` (optional): `redis://localhost:6379`

### Run a worker (optional)

Start the API:

`npm run dev`

Start the background worker (in another terminal):

`npm run worker`

### Notes

- Presence uses per-user rooms (`user:<id>`) in Socket.IO, so emits work across instances when the Redis adapter is enabled.
- The queue currently contains a placeholder job `user:welcome` (logged by the worker) to demonstrate retryable async tasks.

