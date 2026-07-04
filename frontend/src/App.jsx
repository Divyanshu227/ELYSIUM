import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/workflow", label: "Workflow" },
  { to: "/setup", label: "Setup" },
  { to: "/api", label: "API" },
  { to: "/analysis", label: "Analysis" },
];

const setupSteps = [
  {
    title: "Install backend dependencies",
    body: "Run npm install inside /server so Express, Gemini, and GitHub integration are available.",
    command: "cd server && npm install",
  },
  {
    title: "Start the backend",
    body: "The backend exposes submission, auth, upload status, and disconnect endpoints on port 3000.",
    command: "npm run dev",
  },
  {
    title: "Load the extension",
    body: "Install the unpacked Chrome extension from /elysium-extension to capture accepted submissions.",
    command: "chrome://extensions",
  },
  {
    title: "Connect GitHub",
    body: "Authorize the GitHub OAuth route so uploads can create or update the Elysium-Submissions repo.",
    command: "http://localhost:3000/auth/github",
  },
];

const endpoints = [
  { method: "GET", path: "/health", desc: "Backend health probe" },
  { method: "GET", path: "/auth/github", desc: "GitHub OAuth redirect" },
  { method: "GET", path: "/auth/github/callback", desc: "OAuth callback receiver" },
  { method: "GET", path: "/upload/status", desc: "GitHub connection state" },
  { method: "POST", path: "/upload/disconnect", desc: "Clear stored token" },
  { method: "POST", path: "/submission", desc: "Accept captured solution payloads" },
];

const analysisFields = [
  {
    key: "cleaned_code",
    title: "Cleaned code",
    body: "Gemini returns a formatted version of the source so the GitHub archive reads cleanly.",
  },
  {
    key: "metadata",
    title: "Structured metadata",
    body: "The model returns difficulty, topics, and complexity labels for quick review.",
  },
  {
    key: "explanation_markdown",
    title: "Explanation markdown",
    body: "A human-friendly logic breakdown is rendered into markdown for problem folders.",
  },
];

function useBackendStatus() {
  const [state, setState] = useState({
    health: "Checking...",
    github: "Checking...",
    username: "Checking...",
    repo: "Elysium-Submissions",
    note: "Waiting for backend status.",
    busy: false,
  });

  const refresh = async () => {
    setState((current) => ({ ...current, busy: true }));

    try {
      const [healthResponse, authResponse] = await Promise.all([
        fetch("/health"),
        fetch("/upload/status"),
      ]);

      const healthData = healthResponse.ok ? await healthResponse.json() : null;
      const authData = authResponse.ok ? await authResponse.json() : null;

      setState({
        health: healthData?.ok ? "Online" : "Offline",
        github: authData?.authenticated ? "Connected" : "Disconnected",
        username: authData?.authenticated ? authData.username || "Unknown user" : "Not connected",
        repo: authData?.authenticated ? authData.repo || "Elysium-Submissions" : "Elysium-Submissions",
        note: authData?.authenticated
          ? "GitHub is connected and ready to receive submissions."
          : "Waiting for a GitHub token to be stored locally.",
        busy: false,
      });
    } catch (error) {
      setState({
        health: "Offline",
        github: "Unavailable",
        username: "Backend unavailable",
        repo: "Elysium-Submissions",
        note: "Start the backend server to load live GitHub status.",
        busy: false,
      });
    }
  };

  const disconnect = async () => {
    setState((current) => ({ ...current, busy: true }));
    try {
      const response = await fetch("/upload/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Disconnect failed");
      }

      await refresh();
    } catch (error) {
      setState((current) => ({
        ...current,
        note: "Unable to disconnect right now. Check the backend and try again.",
        busy: false,
      }));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    ...state,
    refresh,
    disconnect,
  };
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark">E</span>
          <span>
            <strong>ELYSIUM</strong>
            <small>AI-powered CP companion</small>
          </span>
        </a>

        <nav className="nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <a className="button button-primary" href="/auth/github" target="_blank" rel="noreferrer">
          Connect GitHub
        </a>
      </header>

      {children}

      <footer className="footer">
        <div>
          <strong>ELYSIUM</strong>
          <p>Captures accepted solutions, explains them, and syncs them to GitHub.</p>
        </div>
        <div className="footer-links">
          <a href="#/setup">Setup</a>
          <a href="#/api">API</a>
          <a href="/health">Health</a>
        </div>
      </footer>
    </div>
  );
}

function Hero({ title, summary, actions, aside }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">AI-powered competitive programming companion</p>
        <h1>{title}</h1>
        <p className="lede">{summary}</p>
        <div className="hero-actions">{actions}</div>
      </div>
      <aside className="hero-panel">{aside}</aside>
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PageCard({ title, body, children, className = "" }) {
  return (
    <article className={`glass-card ${className}`.trim()}>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {children}
    </article>
  );
}

function HomePage() {
  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="Turn accepted submissions into a polished knowledge base."
          summary="ELYSIUM captures solved GeeksforGeeks submissions, analyzes the logic with Gemini, and syncs code plus explanation straight to your GitHub repo."
          actions={
            <>
              <a className="button button-primary" href="#/dashboard">
                Open dashboard
              </a>
              <a className="button button-secondary" href="#/setup">
                Follow setup
              </a>
            </>
          }
          aside={
            <div className="home-aside">
              <img className="banner-image" src="/assets/elysium_banner.png" alt="ELYSIUM banner" />
              <div className="mini-flow">
                <img src="/assets/elysium_flow.svg" alt="Workflow overview" />
              </div>
            </div>
          }
        />

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">At a glance</p>
            <h2>Everything you need to track, explain, and archive solutions.</h2>
          </div>

          <div className="metric-grid">
            <MetricCard label="Frontend" value="Vite + React" />
            <MetricCard label="Backend" value="Express + Gemini" />
            <MetricCard label="Sync target" value="GitHub repo" />
          </div>
        </section>

        <section className="section card-grid">
          <PageCard
            title="What happens after accepted code"
            body="The browser extension listens for the acceptance event, extracts the code, and posts the payload to the backend."
          >
            <ul className="feature-list">
              <li>Monaco / Ace / textarea extraction</li>
              <li>Title, platform, URL, and metadata capture</li>
              <li>Submission sent to /submission on the local backend</li>
            </ul>
          </PageCard>

          <PageCard
            title="What Gemini returns"
            body="The backend prompts Gemini for structured JSON so the GitHub archive contains both code and explanation."
          >
            <pre className="code-sample">{`{
  "metadata": {
    "time_complexity": "O(N)",
    "space_complexity": "O(1)"
  },
  "explanation_markdown": "..."
}`}</pre>
          </PageCard>
        </section>
      </main>
    </AppShell>
  );
}

function DashboardPage() {
  const { health, github, username, repo, note, busy, refresh, disconnect } = useBackendStatus();

  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="Mission control for your connected coding workflow."
          summary="Check backend health, verify GitHub auth, and disconnect the token from one place."
          actions={
            <>
              <button className="button button-primary" onClick={refresh} disabled={busy}>
                {busy ? "Refreshing..." : "Refresh status"}
              </button>
              <button className="button button-secondary" onClick={disconnect} disabled={busy}>
                Disconnect GitHub
              </button>
            </>
          }
          aside={
            <div className="status-stack">
              <MetricCard label="Backend" value={health} />
              <MetricCard label="GitHub" value={github} />
              <MetricCard label="Repository" value={repo} />
            </div>
          }
        />

        <section className="section card-grid">
          <PageCard title="Connected account" body={note}>
            <div className="status-pairs">
              <div>
                <span>Username</span>
                <strong>{username}</strong>
              </div>
              <div>
                <span>Repo</span>
                <strong>{repo}</strong>
              </div>
            </div>
          </PageCard>

          <PageCard title="Quick actions" body="Use these buttons to connect or inspect the backend state.">
            <div className="action-stack">
              <a className="button button-primary" href="/auth/github" target="_blank" rel="noreferrer">
                Start OAuth
              </a>
              <button className="button button-secondary" onClick={refresh} disabled={busy}>
                Check again
              </button>
            </div>
          </PageCard>
        </section>
      </main>
    </AppShell>
  );
}

function WorkflowPage() {
  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="A clean pipeline from accepted code to committed documentation."
          summary="The system is designed to watch for acceptance, analyze the solution, and archive the result with minimal friction."
          actions={
            <>
              <a className="button button-primary" href="#/setup">
                Set up the stack
              </a>
              <a className="button button-secondary" href="#/analysis">
                Inspect analysis
              </a>
            </>
          }
          aside={
            <div className="timeline">
              <div className="timeline-item">
                <span>01</span>
                <div>
                  <strong>Capture</strong>
                  <p>Detect the solved event in GeeksforGeeks pages.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span>02</span>
                <div>
                  <strong>Analyze</strong>
                  <p>Send the payload to Gemini for cleaning and explanation.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span>03</span>
                <div>
                  <strong>Archive</strong>
                  <p>Store locally and push into the GitHub repository.</p>
                </div>
              </div>
            </div>
          }
        />

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Workflow map</p>
            <h2>The system stays simple where it matters.</h2>
          </div>

          <div className="card-grid three-up">
            <PageCard title="Extension" body="The content script watches accepted pages and extracts the latest code snapshot." />
            <PageCard title="Backend" body="Express handles submission analysis, GitHub sync, and OAuth status management." />
            <PageCard title="GitHub" body="Every accepted solution can become a durable folder with code and README output." />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SetupPage() {
  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="Setup that matches the project instead of fighting it."
          summary="These are the exact steps needed to run the backend, install the extension, and connect GitHub."
          actions={
            <>
              <a className="button button-primary" href="/auth/github" target="_blank" rel="noreferrer">
                Open OAuth
              </a>
              <a className="button button-secondary" href="#/api">
                Read the API
              </a>
            </>
          }
          aside={
            <div className="media-card">
              <video controls poster="/assets/elysium_banner.png">
                <source src="/assets/elysiumintro.mp4" type="video/mp4" />
              </video>
            </div>
          }
        />

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Runbook</p>
            <h2>Four steps to go from clone to working pipeline.</h2>
          </div>

          <div className="setup-grid">
            {setupSteps.map((step, index) => (
              <article className="setup-step" key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <code>{step.command}</code>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function ApiPage() {
  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="A compact API surface that keeps the frontend honest."
          summary="The frontend only relies on a few endpoints, which makes the integration easy to understand and easy to test."
          actions={
            <>
              <a className="button button-primary" href="/health">
                Check health
              </a>
              <a className="button button-secondary" href="#/dashboard">
                Open dashboard
              </a>
            </>
          }
          aside={
            <div className="endpoint-panel">
              <div className="endpoint-head">
                <span>Payload shape</span>
                <strong>/submission</strong>
              </div>
              <pre className="code-sample">{`{
  "title": "Problem title",
  "code": "source",
  "platform": "GFG",
  "metadata": {
    "difficulty": "Medium"
  }
}`}</pre>
            </div>
          }
        />

        <section className="section card-grid">
          <PageCard title="Endpoints" body="These are the routes the frontend and extension rely on.">
            <div className="endpoint-list">
              {endpoints.map((endpoint) => (
                <div className="endpoint-row" key={endpoint.path}>
                  <span className={`method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                  <code>{endpoint.path}</code>
                  <p>{endpoint.desc}</p>
                </div>
              ))}
            </div>
          </PageCard>

          <PageCard title="Frontend contract" body="The React app assumes the backend is available on the same origin.">
            <ul className="feature-list">
              <li>Fetch /health for backend liveliness</li>
              <li>Fetch /upload/status for GitHub connection state</li>
              <li>POST /upload/disconnect to clear the token</li>
            </ul>
          </PageCard>
        </section>
      </main>
    </AppShell>
  );
}

function AnalysisPage() {
  return (
    <AppShell>
      <main className="page-shell">
        <Hero
          title="What the AI analysis contract looks like."
          summary="The server asks Gemini for valid JSON so the output can be stored, rendered, and committed without brittle parsing."
          actions={
            <>
              <a className="button button-primary" href="#/workflow">
                View workflow
              </a>
              <a className="button button-secondary" href="#/api">
                View endpoints
              </a>
            </>
          }
          aside={
            <div className="analysis-card">
              <div className="analysis-highlight">
                <span>Target output</span>
                <strong>Valid JSON only</strong>
              </div>
              <div className="analysis-note">
                The backend trims accidental text and parses the model response before it is used downstream.
              </div>
            </div>
          }
        />

        <section className="section card-grid">
          {analysisFields.map((field) => (
            <PageCard key={field.key} title={field.title} body={field.body} />
          ))}
        </section>

        <section className="section">
          <PageCard
            title="Why the format matters"
            body="Structured output lets the GitHub folder contain both the solution and the explanation without extra cleanup."
          >
            <pre className="code-sample">{`{
  "metadata": {
    "time_complexity": "O(N)",
    "space_complexity": "O(1)"
  },
  "explanation_markdown": {
    "Optimized": "..."
  }
}`}</pre>
          </PageCard>
        </section>
      </main>
    </AppShell>
  );
}

function NotFoundPage() {
  return (
    <AppShell>
      <main className="page-shell">
        <section className="not-found">
          <p className="eyebrow">404</p>
          <h1>This route does not exist.</h1>
          <p className="lede">Use the navigation to get back to the dashboard, setup guide, or API reference.</p>
          <a className="button button-primary" href="#/">
            Go home
          </a>
        </section>
      </main>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/api" element={<ApiPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
