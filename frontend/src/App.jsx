import { useEffect } from "react";

const NEXT_APP_ORIGIN = import.meta.env.VITE_NEXT_APP_ORIGIN || "http://localhost:3000";

const getNextUrl = () => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${NEXT_APP_ORIGIN.replace(/\/+$/, "")}${currentPath}`;
};

const App = () => {
  useEffect(() => {
    window.location.replace(getNextUrl());
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 px-6">
      <div className="max-w-md rounded-xl border border-base-300 bg-base-100 p-6 text-center shadow-xl">
        <h1 className="text-2xl font-bold">LinePe moved to Next.js</h1>
        <p className="mt-3 text-sm text-base-content/70">
          Redirecting to the server-rendered app.
        </p>
        <a className="btn btn-primary mt-5" href={getNextUrl()}>
          Continue
        </a>
      </div>
    </main>
  );
};

export default App;
