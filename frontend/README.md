This frontend is a React + Vite app.

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually [http://localhost:5173](http://localhost:5173).

## Environment Variables

Set these for local development and Vercel deployment:

```env
VITE_API_URL=https://your-backend.example.com/api
VITE_API_ORIGIN=https://your-backend.example.com
VITE_SOCKET_URL=https://your-backend.example.com
```

For local development, the defaults point to `http://localhost:5000`, but production builds must use the deployed backend URL. If these are left unset on Vercel, the frontend will fall back to `localhost:5000` and login will fail from the public site.

## Build

```bash
npm run build
npm run preview
```

## Deploy

Use Vercel for the frontend and Render or another host for the backend. Make sure the backend allowlist includes the exact frontend origin, for example:

```env
CLIENT_URL=https://line-pe.vercel.app
CLIENT_URLS=https://line-pe.vercel.app
```

Also make sure the frontend env values point to the public backend URL, not `localhost`.
