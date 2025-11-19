 # Google Cloud VM Deployment Guide
 
## Before / After

- **Before:** Backend was deployed on the previous PaaS host and pointed at a Supabase Postgres URL.
- **After:** Backend runs on a Google Cloud Compute Engine VM managed with PM2, uses Neon Postgres (pooled connection string for app traffic and optional direct string for migrations), and keeps Redis/other services external as needed. Legacy resources should be deleted once the new stack is live.
 
 ## 1. System Architecture
 
 1. **Compute** – A Compute Engine VM (Debian/Ubuntu) with Node.js 20+, PM2, and the Medusa backend build. ([Medusa deployment overview](https://docs.medusajs.com/v1/deployments))
 2. **Database** – Neon Postgres with pooled endpoint for runtime traffic and direct endpoint for migrations/maintenance. ([Neon connection pooling](https://neon.com/docs/connect/connection-pooling))
 3. **Cache/Queues** – Existing managed Redis (e.g., Upstash/GCP MemoryStore). Configure via `REDIS_URL`.
 4. **Process roles** – Two PM2 apps: `server` (API only) and `worker` (background jobs) per [Medusa worker mode guidance](https://docs.medusajs.com/v1/development/worker-mode).
 
 ## 2. Prerequisites
 
 - Google Cloud project with billing enabled and IAM permissions to create Compute Engine instances, firewall rules, and service accounts. ([Compute Engine startup scripts doc](https://cloud.google.com/compute/docs/instances/startup-scripts/linux))
 - Neon project with an initialized database and credentials for a least-privileged user.
 - Domain/DNS if you plan to expose the backend publicly.
 - Optional: Upstash/MemoryStore Redis URL for sessions + cache modules.
 
 ## 3. Configure Neon
 
 1. In the Neon console, create a pooled connection string (toggle **Connection pooling**) for runtime traffic and copy the direct string for migrations.
 2. Decide on auth method (`sslmode=require` + `channel_binding=require` is recommended per [Neon security guidance](https://neon.com/docs/connect/connect-securely)).
 3. Set strong DB user passwords and restrict roles.
4. Record the following secrets:
   - `DATABASE_URL` – pooled URI copied directly from Neon’s “Connection pooling” modal (toggle on, choose Node.js, and copy the connection string).
    - `DIRECT_DATABASE_URL` (optional) – direct URI for migrations/`psql` access.
 
 ## 4. Prepare Environment Variables
 
 Create/update `.env.production` (or use GCP Secret Manager) with:
 
 | Variable | Purpose |
 | --- | --- |
 | `DATABASE_URL` | Neon pooled string for the API/worker runtime. |
 | `DATABASE_SSL` | `true` to ensure Medusa config injects TLS driver options. |
 | `DB_SSL_REJECT_UNAUTHORIZED` | `true` if you upload the Neon root CA, otherwise `false` to accept Neon’s managed certificates. |
 | `MEDUSA_WORKER_MODE` | `server` on the API VM, `worker` on the worker VM/process. ([Medusa config docs](https://docs.medusajs.com/learn/configurations/medusa-config)) |
 | `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` | Standard Medusa variables (see `.env.template`). |
 
 Commit only templates/placeholders; inject real secrets via the VM environment or secret files.
 
 ## 5. Provision the Compute Engine VM
 
 1. **Create the instance:**
    - Machine type: `e2-medium` (2 vCPU / 4 GB RAM) or larger for production.
    - Boot disk: Debian/Ubuntu LTS, ≥30 GB SSD.
    - Enable “Allow HTTP/HTTPS traffic” for quick testing or manage via custom firewall rules later.
 2. **Attach service account** with minimal permissions (logging/monitoring) if you’ll use GCP APIs.
 3. **Set a startup script** or run manually (see next section). ([Startup scripts doc](https://cloud.google.com/compute/docs/instances/startup-scripts/linux))
 
 ## 6. Harden Networking
 
 Create ingress firewall rules to expose only the ports you need (for example, 80/443) and limit the source ranges. ([VPC firewall guide](https://cloud.google.com/firewall/docs/using-firewalls))
 
 Example `gcloud` command:
 
 ```bash
 gcloud compute firewall-rules create medusa-http \
   --direction=INGRESS --priority=1000 --network=default \
   --action=ALLOW --rules=tcp:80,tcp:443 \
   --source-ranges=0.0.0.0/0 --target-tags=medusa-backend
 ```
 
 Apply the same network tag (`medusa-backend`) to the VM so the rule applies only there.
 
 ## 7. Bootstrap the VM
 
 SSH into the VM and install runtime dependencies:
 
 ```bash
 sudo apt update && sudo apt install -y build-essential git curl
 curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
 sudo apt install -y nodejs
 sudo npm i -g pm2
 ```
 
 Optional startup script snippet (paste into the VM’s metadata so it re-runs on reboot):
 
 ```bash
 #! /bin/bash
 apt update && apt -y install build-essential git curl
 curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
 apt install -y nodejs
 npm install -g pm2
 ```
 
 (Derived from Google’s startup script example.)
 
 ## 8. Deploy the Medusa Backend
 
 1. **Clone repo & install:**
    ```bash
    git clone https://github.com/<your-org>/<repo>.git && cd backend
    npm install
    ```
 2. **Add environment file** (or export variables):
    ```bash
    cp .env.template .env.production
    nano .env.production  # paste secrets
    ```
 3. **Build & migrate:**
    ```bash
    npm run build
    npx medusa migrations run --env=production
    ```
 4. **Smoke test locally** with `npm run start` (press Ctrl+C afterward) to ensure connections work before daemonizing.
 
 ## 9. Manage Processes with PM2
 
 Create `/var/www/medusa/ecosystem.config.js` (two apps share the same code path) referencing the [PM2 ecosystem docs](https://pm2.keymetrics.io/docs/usage/application-declaration/):
 
 ```js
 module.exports = {
   apps: [
     {
       name: 'medusa-server',
       script: 'npm',
       args: 'run start',
       cwd: '/var/www/medusa/backend',
       env: {
         NODE_ENV: 'production',
         MEDUSA_WORKER_MODE: 'server'
       }
     },
     {
       name: 'medusa-worker',
       script: 'npm',
       args: 'run start',
       cwd: '/var/www/medusa/backend',
       env: {
         NODE_ENV: 'production',
         MEDUSA_WORKER_MODE: 'worker'
       }
     }
   ]
 }
 ```
 
 Start and persist:
 
 ```bash
 pm2 start ecosystem.config.js
 pm2 save
 pm2 startup systemd  # follow the printed command so PM2 restarts on boot
 ```
 
 ## 10. Validation & Maintenance
 
 1. **Health checks** – `curl https://api.example.com/store/regions` to confirm it responds.
 2. **Monitoring** – Use `pm2 status`, Cloud Logging, and Neon monitoring.
 3. **Backups** – Neon provides PITR on paid plans; schedule exports if needed.
 4. **Zero-downtime deploys** – Pull latest code, run `npm install && npm run build`, then `pm2 reload ecosystem.config.js`.
 5. **Security** – Rotate JWT/DB credentials regularly, keep VM patched (`unattended-upgrades`), and restrict SSH access.
 
## 11. Decommission the Previous Host

1. Delete the old PaaS services/projects to avoid accidental double billing.
2. Revoke any OAuth tokens or CI/CD integrations that were tied to the previous host.
3. Update documentation (this repo) to point only to the Google Cloud + Neon process.

Following this checklist moves the backend off the legacy stack and onto a controllable Google Cloud VM while following Medusa’s production best practices for separate server/worker runtimes and SSL-secured Neon connections.
