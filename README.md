# Aitrainer

React Native + Expo (TypeScript), FastAPI, PostgreSQL, and a separate Python agent service.

```text
apps/mobile -> backend:8000 -> agent:8001 -> optional AI provider
                    |
                PostgreSQL
```

## Structure

- `apps/mobile/`: Expo app for Android, iOS, and web.
- `services/backend/`: API, SQLAlchemy models, and Alembic migrations.
- `services/agent/`: internal agent HTTP API and provider integration.
- `compose.yaml`: database, migration job, backend, agent, optional Expo container.
- `scripts/smoke.mjs`: end-to-end API and persistence check.

## Start development

Requirements: Docker with its engine running, and Node.js 22 LTS for local Expo development.
Python is provided by the containers.

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
cd apps/mobile
Copy-Item .env.example .env
npm ci
npx expo start
```

Open the QR code with a compatible Expo Go app, or press `a` for Android / `w` for web.
An iOS simulator requires macOS. The native app runs on your device or emulator; containers run the services and optionally the Expo development server.

- API docs: http://localhost:8000/docs
- Backend health: http://localhost:8000/health
- Chat: `POST /api/v1/chat` with `{"message":"Hello"}`
- Latest saved exchanges: `GET /api/v1/chat?limit=20`

Docker Compose waits for PostgreSQL, runs migrations, and starts the backend after the agent is healthy. PostgreSQL data persists in a named volume. PostgreSQL is available on your computer at `127.0.0.1:5433`. Set `POSTGRES_PORT` in the root `.env` to choose another host port. Containers connect to PostgreSQL at `db:5432`; the agent port is internal to Compose. Apply port changes with `docker compose up -d db`.

### Connect a phone

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:
- Web / iOS simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:8000`

Phone and computer must share a network, and the firewall must allow ports 8000 and 8081. Restart Expo after changing environment variables. If you access web through a LAN hostname, add its exact origin (including port) to `CORS_ORIGINS` in the root `.env` and recreate the backend.

### Expo in a container

```powershell
docker compose --profile mobile up --build
```

Open http://localhost:8081. For native devices, set `REACT_NATIVE_PACKAGER_HOSTNAME` to the computer's LAN IP and `EXPO_PUBLIC_API_URL` to its API URL in the root `.env`. Recreate the mobile container. Local Expo is usually easier for device development. Container source is copied at build time; rebuild after edits.

## Account screen preview

The app opens with the welcome screen. Create Account opens sign-up; Already Have an account opens login; Forgot your password opens password reset. These screens use React Navigation 7 and reusable React Native UI components styled to match the account wireframes. Forms validate locally, but authentication is not implemented: valid sign-up details navigate into the onboarding assessment, and login accepts any email/password and navigates straight to the main app, but no account is actually created or credentials checked. Password reset still only shows a preview notice; no email is sent.

Web routes are `/`, `/sign-up`, `/login`, `/forgot-password`, and the full onboarding, plan, and workout flow under `/assessment/*`, `/plan/*`, and `/workout/*`. The chat demo is now the Coach tab of the main app, still reachable at `/chat`. Reload Expo Go after rebuilding the mobile container to see changes.

## App colors

`apps/mobile/src/theme.ts` owns all component and navigation color tokens. The active `mono` palette is a neutral grayscale (chosen after a design review for a more professional, serious feel) with a dark charcoal accent reserved for CTAs, the active tab, and key metrics. `default` (white/taupe/yellow/black) and `classic` (the earlier account palette) remain as alternatives. Change `activeTheme` in that file and reload/rebuild to preview one; there is no user-facing theme switch yet. All three themes are light themes.

## Agent and AI

Default `AGENT_PROVIDER=demo` returns an explicitly labeled placeholder, so the whole stack works without credentials. No actual model runs in demo mode.

For real local AI, install and run Ollama on the host, download a model with `ollama pull llama3.2`, then set these root `.env` values:

```dotenv
AGENT_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2
```

Ollama must listen on an interface reachable from Docker (configure `OLLAMA_HOST` if needed). Recreate the agent using `docker compose up -d --force-recreate agent`.

For a hosted free-tier provider (works the same in dev and after deployment, unlike Ollama), get a free API key from [Google AI Studio](https://aistudio.google.com/apikey) and set:

```dotenv
AGENT_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.6-flash
```

Then recreate the agent: `docker compose up -d --force-recreate agent`.

Provider errors are returned as API errors; the agent never silently substitutes demo output.
Add other provider adapters inside `services/agent/app/`; keep provider secrets on the server.
Agent requests are currently single-turn; saved exchanges are history, not model conversation memory.

## Validation

```powershell
docker compose config --quiet
docker compose up --build -d --wait
node scripts/smoke.mjs
cd apps/mobile
npx tsc --noEmit
npx expo install --check
```

The smoke test creates one saved exchange. Agent health checks process availability; model availability is checked when sending a message.

## Database changes

```powershell
docker compose run --rm -v ./services/backend/migrations:/app/migrations backend alembic revision --autogenerate -m "describe change"
docker compose run --rm migrate
```

Review generated migrations before applying them. Stop services with `docker compose down`; this preserves database data.

## Scope

This is a local development starter. Chat history is shared and unauthenticated. Add authentication, per-user ownership, rate limits, production secrets, TLS, and deployment configuration before exposing it publicly. The included database password is for local development only. Python dependency ranges are bounded; resolve a lock file before production deployment.

References: [Expo project creation](https://docs.expo.dev/more/create-expo/), [FastAPI containers](https://fastapi.tiangolo.com/deployment/docker/), [Ollama chat API](https://docs.ollama.com/api/chat).

## Service tests without Docker

With Python 3.12 or newer installed, create a root virtual environment and install the backend development requirements (these also include the agent test dependencies):

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/backend/requirements-dev.txt
cd services/backend
..\..\.venv\Scripts\python.exe -m pytest -q
cd ../agent
..\..\.venv\Scripts\python.exe -m pytest -q
```

Backend unit tests use SQLite and mocked agent responses. The separate smoke test exercises real PostgreSQL and service communication through Compose.

## Initial verification

- 7 backend tests and 3 agent tests passed.
- TypeScript checking and Expo web export passed.
- Expo's offline dependency compatibility check passed.
- Docker Compose configuration validated; container builds and PostgreSQL smoke testing were not run because the local Docker engine was stopped.
- npm audit reported 10 moderate transitive tooling advisories through Expo / xcode / uuid. The suggested automatic fix downgraded Expo to SDK 46 and was not applied.

This Windows environment required its trusted root certificates for npm to work behind its certificate-inspecting network. Dependencies are already installed. If future installs report `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, configure `NODE_EXTRA_CA_CERTS` with your organization's approved PEM certificate bundle; keep TLS verification enabled.
