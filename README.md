# Friends Group — Tours, Memories & Payments

A private, responsive website for a friends group, built with Node.js, Express and SQLite. Members sign in to see group tours, their own contributions, announcements and eligible tour photos. Administrators manage the group from the same site.

## Run it in VS Code on Windows

1. Install **Node.js 22.5 or newer**. The app uses Node's built-in SQLite module.
2. In VS Code, open this project folder: `C:\Users\NEXT GEN IT\Desktop\f.website`.
3. Open **Terminal → New Terminal** and run `npm install` once.
4. Start the site with `npm run dev`.
5. Open **http://127.0.0.1:3000** in your browser.
6. On the first visit, create the admin account. There is no default username or password. Save the credentials somewhere safe.

If the terminal says `EADDRINUSE` or that port 3000 is already in use, another copy of this site is already using it. Go to that terminal and press **Ctrl+C** once, then run `npm run dev` again. If you cannot find the old terminal, use another PowerShell window and run `$env:PORT=3001; npm run dev`, then open **http://127.0.0.1:3001**. Do not start multiple copies on the same port.

When the terminal prints `Friends Group app ready at ...`, leave it open while using the site. To stop the site, focus that terminal and press **Ctrl+C**.

## Included features

- First-admin setup, login/logout, admin and member roles, hashed passwords, rate-limited login, and persistent SQLite sessions.
- Member self-registration with immediate access using a name, phone number, and password. Existing member records can be claimed by phone number.
- Self-service profile name, nickname, phone, bio, and photo editing, plus authenticated real-time group and private chat. Chat includes unread counts, typing status, online/last-seen privacy, read state, replies, edit/delete, emoji reactions, search, history paging, and 25 MB image/video/audio/document attachments.
- Consent-based one-time and live location shares in chat, plus one-to-one audio/video calls using browser WebRTC. Configure a TURN server for reliable calls across restrictive networks; STUN-only calls may fail behind some NAT/firewalls. Group voice/video calls, GIF/sticker search, and push notifications are not included.
- Member records, optional member logins, profile photos, active/inactive accounts, and admin-only phone numbers.
- Create and edit tours, select participants, set contribution/budget, status, dates, description and map coordinates; add ordered route stops; show maps and a live countdown.
- Record partial contributions, unique receipt numbers, receipt history and printable receipts; prevent duplicate transaction references and over-collection; waiver controls.
- Tour expenses and budget summary, payment history, CSV export, and downloadable SQLite backup.
- Private tour photo albums with multi-image upload, captions, location/date/featured metadata, editing and deletion.
- Group name, welcome text, contact link, logo, homepage hero-image, and SMS delivery status log settings.
- Group announcements, SMS provider status log, responsive English interface, and BDT amounts.
- Optional, consent-based live tour location sharing with bus/train markers on an OpenStreetMap route.

## Important setup notes

- The database is created at `data/friends.db`; uploaded photos are stored in `uploads/`.
- To change the port, set `PORT` before starting Node. Example PowerShell: `$env:PORT=3001; npm run dev`.
- Copy `.env.example` to `.env` before deployment. Set a long, random `SESSION_SECRET` and your `GROUP_NAME`. Keep `.env`, `data/`, and `uploads/` private and backed up.
- For payment SMS, create a Twilio account with an SMS-capable sender, then set `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` in `.env`. Copy `.env.example` to `.env`, enter the credentials privately, and restart the server. The member's saved phone must be in international format (for example, `+8801XXXXXXXXX`). Twilio accepting a message means queued for sending, not guaranteed delivery; delivery depends on carrier, account, sender, and destination-country permissions. bKash/Nagad entries are records only; the app does not verify online payments.
- For chat calls, set `TURN_URLS` and `TURN_SHARED_SECRET` to a TURN service configured with the TURN REST shared-secret mechanism. Keep the shared secret only in `.env`; the app returns short-lived credentials to signed-in users. Without TURN, calls use STUN and may not connect on all networks. Chat location is shared only after the browser asks permission; live updates stop when the user stops sharing or the share expires.
- The app is intended for a trusted group. Before exposing it to the internet, deploy behind HTTPS and review access, backups, and your SMS provider's API format.

## Deploy on Render

1. Open the web service in the Render Dashboard and select **Environment**.
2. Add `SESSION_SECRET` with a newly generated random value of at least 32 characters. In PowerShell, generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
3. Save and deploy. Keep this value private and stable; do not put it in source code or commit it to Git.
4. The service uses Render's `PORT` and binds to `0.0.0.0` in production. Local development continues to bind to `127.0.0.1`.

## Firebase setup

The server uses Firebase Admin SDK credentials; never place the service-account JSON or its private key in browser JavaScript or Git.

1. In Firebase Console, open project `f-website-f9e07`, create a **Cloud Firestore** database, and enable **Storage**.
2. In **Project settings → Service accounts**, generate a private key JSON and keep it on your computer.
3. In PowerShell, encode that file for Render: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\service-account.json"))`.
4. In Render → your web service → **Environment**, add `FIREBASE_PROJECT_ID=f-website-f9e07`, `FIREBASE_STORAGE_BUCKET` (copy the exact bucket name from Firebase Storage), and `FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64` (the encoded JSON). Keep the secret value private.
5. Save and deploy. Production startup checks both Firestore and Storage. New photo and chat-file uploads are copied to Storage and can be served after local files are absent.

The existing application data and login/session tables still use SQLite. Firestore is currently used for the connection check; moving all relational app records to Firestore requires an explicit data migration. The app does not automatically replace its local database with Firestore data on startup.

## Fixing a blank page

Keep the server terminal open and check that it says `app ready`. Open the exact address and port printed in that message. If the port was changed, use that port (for example `http://127.0.0.1:3001`). Refresh once. If it still appears blank, check the browser's developer console and the server terminal for errors.
