# Friends Group Website

The existing Node.js/Express application is preserved. Its HTML/CSS/JS frontend is published by Netlify; the Express API runs as a separate Node web service. The application continues to use SQLite, its existing authentication/session logic, and its existing Server-Sent Events (SSE) chat. No features or database schema are replaced for deployment.

## Recommended deployment layout

- **Netlify:** publishes `public/` through the configured `dist/` build. A generated proxy sends `/api/*` and `/uploads/*` requests to the backend, keeping browser requests same-origin so existing session cookies and frontend URLs continue to work.
- **Render Web Service:** runs `server.js` as a long-running Express server. This keeps the current SSE chat stream on a persistent server instead of trying to run it as a short-lived Netlify Function.
- **Render persistent disk:** stores SQLite records, SQLite sessions, and uploaded files below `/var/data`. The included `render.yaml` configures a 1 GB disk and one backend instance. Do not scale this service to multiple instances: chat presence/broadcast and SQLite currently depend on one process/disk.

Netlify static publishing and external proxy rewrites are described in the [Netlify build configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/) and [proxy rewrite documentation](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/). Netlify Functions can stream responses but have a 60-second streaming execution limit; they are not a replacement for this app's long-lived SSE endpoint ([Netlify Functions API](https://docs.netlify.com/build/functions/api/)).

## Deploy from GitHub

### 1. Push the project to GitHub safely

1. Commit the source and deployment files.
2. Do **not** commit `.env`, `data/`, `uploads/`, a SQLite database, a service-account JSON, or passwords. These are ignored by `.gitignore`.
3. `FIREBASE_PROJECT_ID` is a public project identifier; service-account credentials are private and must stay out of GitHub.

### 2. Create the backend from Render Blueprint

1. In Render, choose **New → Blueprint** and connect the GitHub repository.
2. Render reads `render.yaml` and previews the backend service and its cost. Review/confirm the paid service and disk before creating it.
3. Wait for the first deployment to become live. Render generates `SESSION_SECRET`; the Blueprint sets `DB_PATH=/var/data/friends.db` and `UPLOADS_DIR=/var/data/uploads`.
4. Copy the backend URL, for example `https://f-website-backend.onrender.com`.
5. Check `https://YOUR-BACKEND-URL/healthz`; it should return `{"ok":true}`.

The current Render pricing lists the small paid web instance at **$7/month** and persistent disks at **$0.25/GB/month**. With the configured 1 GB disk, the starting estimate is about **$7.25/month**, before bandwidth or other usage/tax. Prices can change; review the Render cost preview before creating the Blueprint. A free Render web service sleeps after 15 minutes without traffic and loses local file changes on sleep/redeploy. Free Postgres expires after 30 days, so neither is suitable for this SQLite/upload configuration ([Render free limits](https://render.com/docs/free), [disk behavior](https://render.com/docs/disks), [pricing](https://render.com/pricing/)).

### 3. Publish the frontend on Netlify

1. In Netlify, choose **Add new site → Import an existing project** and connect the same GitHub repository.
2. Netlify reads `netlify.toml`: build command `npm run build:netlify`, publish folder `dist`.
3. Before the first production deploy, open **Site configuration → Environment variables** and add `BACKEND_URL` with the exact HTTPS Render backend origin (no trailing path, for example `https://f-website-backend.onrender.com`). Give it **Builds** scope, then trigger a new deploy.
4. Netlify's build writes the API and upload proxy rules into `dist/_redirects`. The browser uses same-origin `/api` requests, cookies, and SSE endpoint; no permissive wildcard CORS is required.
5. Open the Netlify HTTPS URL and test registration, sign-in, member pages, uploads and chat with two browser sessions.

Netlify's current Free plan includes **300 monthly credits** with a hard limit; the site pauses after the limit until the next cycle, rather than charging over the Free limit. The exact credit usage depends on deploys, bandwidth, requests, and other enabled services ([Netlify pricing](https://www.netlify.com/pricing/), [how credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)).

## Persistent data and existing local records

The server now honors `DB_PATH` and `UPLOADS_DIR`; its default local paths remain `data/friends.db` and `uploads/`. The Render Blueprint points both to the persistent disk. Sessions are stored in the same SQLite database. Uploaded album images and chat attachments use the persistent upload directory.

**No local database or upload migration is performed by these deployment changes.** The local `data/friends.db` and `uploads/` remain on your computer and are not sent to GitHub or Render. The first backend start creates a new empty database on its persistent disk. If you need your current local members/tours/payments/photos, do not invite members or create production records before arranging a verified migration. SQLite records and uploaded files need separate backups; blindly replacing an already-used production database can destroy online records. Stop writes, back up both the database and uploads, verify the copies, and only then transfer/restore them to the disk. This project does not yet include a one-click production restore/import tool.

The current application database remains SQLite on Render's persistent disk. The prior Firebase Admin integration is optional and can mirror new uploaded files to Firebase Storage when service-account credentials and a bucket are configured; **Firestore is not currently the source of truth for users, tours, payments, sessions, or chat**. Changing those records to Firestore/Postgres would require a separately planned and validated data migration; this deployment does not do that.

## Environment variables

The Render Blueprint sets `NODE_ENV`, `SESSION_SECRET`, `DB_PATH`, `UPLOADS_DIR`, `GROUP_NAME`, and `TIMEZONE`. Configure optional values in the Render service's Environment page:

- SMS: `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- WebRTC connectivity: `TURN_URLS`, `TURN_SHARED_SECRET`; STUN alone may fail on restrictive networks.
- Optional Firebase Storage file copy: `FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64`, `FIREBASE_STORAGE_BUCKET`, and optionally `FIREBASE_PROJECT_ID`. Never expose the private key in frontend code, Netlify variables, or GitHub.

See `.env.example` for local development variable names. Keep production secrets in Render's environment settings. Do not enable Firebase variables until the Firebase Storage bucket and service account are correctly configured.

## Run locally

1. Install Node.js 22.5 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://127.0.0.1:3000`.

If port 3000 is already used, stop the other server with Ctrl+C or choose a different `PORT`.

## Checks and deployment status

Run `npm run build:netlify` locally to verify the static publish build (without `BACKEND_URL` it builds static assets only). On Netlify, `BACKEND_URL` is required. Run `node --check server.js` and `node --check scripts/build-netlify.js` for syntax checks. This repository has no automated test suite yet.

No Netlify or Render account was accessed and no live deployment has been performed from this workspace. A successful local build does not prove online registration, cookies, uploads, or SSE chat; verify those against the deployed URLs before sharing the site.
