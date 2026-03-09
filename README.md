# CI/CD Demo — Todo App

A minimal full-stack todo app (React, Express, MySQL) containerized with Docker, with GitHub Actions CI/CD.

## Running Locally

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

All tests run inside Docker — the only prerequisite is Docker itself.

```bash
# Backend unit tests
docker compose run --rm server npm test

# Frontend unit tests
docker build --target build -t client-test ./client
docker run --rm client-test npm test

# Integration tests (starts MySQL automatically)
docker compose run --rm server npm run test:integration

# E2E tests (start the app first)
docker compose up -d --build
docker build -t e2e-test ./e2e
docker run --rm --network cicd-demo_default -e BASE_URL=http://client:80 e2e-test
docker compose down
```

## CI/CD Pipelines

**Tests** (`.github/workflows/test.yml`) — runs on every push/PR to `main`:
1. Backend unit tests
2. Frontend unit tests
3. Integration tests (API → MySQL)
4. E2E tests (Playwright)

Each step depends on the previous — if unit tests fail, integration and E2E are skipped.

**Deploy** (`.github/workflows/deploy.yml`) — runs automatically after Tests pass on `main`. Connects to the deployment server via Tailscale and deploys with Docker Compose.

---

## Deployment Setup Walkthrough

The deploy pipeline SSHs into your server over a Tailscale VPN. Here's how to set it up:

### 1. Server Prerequisites

On your deployment server (e.g. Orange Pi):
- Install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Install [Tailscale](https://tailscale.com/download) and run `sudo tailscale up`
- Clone this repo: `git clone <your-repo-url> /path/to/app`

### 2. Create an SSH Key Pair

On your local machine, generate a key pair for CI:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ci_deploy -N ""
```

Copy the **public** key to your server:

```bash
ssh-copy-id -i ~/.ssh/ci_deploy.pub user@<server-tailscale-ip>
```

### 3. Create Tailscale OAuth Credentials

1. Go to [Tailscale Admin Console → Settings → OAuth clients](https://login.tailscale.com/admin/settings/oauth)
2. Create a new OAuth client
3. Grant it the `Devices: Write` scope so it can register the CI runner on your tailnet
4. Note the **Client ID** and **Client Secret**

You also need to create an ACL tag for the CI runner. In your Tailscale ACL policy, add:

```json
"tagOwners": {
  "tag:ci": ["autogroup:admin"]
}
```

### 4. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions, and add:

| Secret | Value |
|--------|-------|
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID |
| `TS_OAUTH_SECRET` | Tailscale OAuth client secret |
| `DEPLOY_HOST` | Tailscale IP or hostname of your server |
| `DEPLOY_USER` | SSH username on the server |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/ci_deploy` (the **private** key) |
| `DEPLOY_PATH` | Absolute path to the repo on the server (e.g. `/home/user/cicd-demo`) |

### 5. Test It

Push to `main`. The Tests workflow runs first, and if all tests pass, the Deploy workflow will:
1. Install Tailscale on the GitHub runner and join your tailnet
2. SSH to your server
3. Pull the latest code and rebuild the Docker containers
