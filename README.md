# CI/CD Demo — Todo App

A minimal full-stack todo app (React, Express, MySQL) containerized with Docker, with GitHub Actions CI/CD.

## Running Locally

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

All tests run inside Docker. The only prerequisite is Docker itself.

```bash
# Backend unit tests
docker compose run --rm server npm test

# Frontend unit tests
docker build --target build -t client-test ./client
docker run --rm client-test npm test

# Integration tests
docker compose run --rm server npm run test:integration

# E2E tests
docker compose up -d --build
docker build -t e2e-test ./e2e
docker run --rm --network ci-cd-demo_default -e BASE_URL=http://client:80 e2e-test
docker compose down
```

## CI/CD Pipelines

**Tests** `.github/workflows/test.yml` runs on every push/PR to `main`:
1. Backend unit tests
2. Frontend unit tests
3. Integration tests
4. E2E tests

Each step depends on the previous — if unit tests fail, integration and E2E are skipped.

**Deploy** `.github/workflows/deploy.yml` runs automatically after Tests pass on `main`. Connects to the deployment server via Tailscale and deploys with Docker Compose.

---

## Deployment Setup Walkthrough

The deploy pipeline SSHs into your server over a Tailscale VPN. Here's how to set it up.

### 1. Server Prerequisites

On your deployment server (e.g., the Orange Pi):

- Install Docker
- Install Tailscale and run `sudo tailscale up`
- Clone the repository

### 2. Create an SSH Key Pair

On your deployment server, generate a key pair and add it to authorized keys:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
```

Print the private key so you can copy it for GitHub Secrets (you'll need this in step 5):

```bash
cat ~/.ssh/deploy_key
```

Copy the **entire** output, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines. These are a required part of the key format.

Once you've copied it, you can delete the private key from the server:

```bash
rm ~/.ssh/deploy_key
```

*Note: Removing the key is not strictly necessary, but it's good practice to avoid leaving private keys lying around.*

### 3. Create a Tailscale ACL Tag

Go to the [Tailscale ACL editor](https://login.tailscale.com/admin/acls/file) and add a tag to the `tagOwners` section:

```json
"tagOwners": {
  "tag:deploy": ["autogroup:admin"]
}
```

**Save the ACL file before proceeding.** The tag must exist in the saved ACL before you create the OAuth client, or it won't be available to select.

### 4. Create Tailscale OAuth Credentials

1. Go to [Tailscale Admin Console > Settings > OAuth clients](https://login.tailscale.com/admin/settings/oauth)
2. Create a new OAuth client
3. Grant it the **Auth Keys** scope with both **Read** and **Write**
4. Select `tag:deploy` as the allowed tag
5. Note the **Client ID** and **Client Secret**

### 5. Add GitHub Secrets

Go to your repo > Settings > Secrets and variables > Actions, and add the following as repository secrets:

| Secret | Value |
|--------|-------|
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID |
| `TS_OAUTH_SECRET` | Tailscale OAuth client secret |
| `DEPLOY_HOST` | Tailscale IP or hostname of your server |
| `DEPLOY_USER` | SSH username on the server (e.g. `root`) |
| `SSH_PRIVATE_KEY` | Full contents of the private key from step 2 |
| `DEPLOY_PATH` | Absolute path to the repo on the server (e.g. `/home/ci-cd-demo`) |

When pasting the private key, make sure there is no extra whitespace or newlines before or after it.

### 6. Test It

Push to `main`. The Tests workflow runs first, and if all tests pass, the Deploy workflow will:

1. Install Tailscale on the GitHub runner and join your tailnet
2. SSH to your server
3. Pull the latest code and rebuild the Docker containers

### Troubleshooting

**"sudo failed with exit code 1" during Tailscale setup:**
- The OAuth client ID or secret could be wrong. Check for trailing whitespace in the GitHub secrets.
- The tag in your workflow YAML might not match the tag in your ACL file and OAuth client. They must all be the same (e.g. `tag:deploy` everywhere).
- You might have created the OAuth client before saving the ACL with the tag. Delete the OAuth client, save the ACL, then recreate the client.

**"ssh: no key found":**
- You might have pasted the public key (starts with `ssh-ed25519`) instead of the private key (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`).
- You might not have included the `-----BEGIN` and `-----END` lines. These are required.
