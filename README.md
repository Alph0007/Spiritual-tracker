# Spiritually Me

A private, single-device tracker for daily spiritual practice: a checklist, a streak,
fixed-length plans (like a 40-day fast), a daily Bible verse, an evening Examen journal,
and real push-notification reminders — even when the app is closed.

Your tasks, streak, and journal entries live only in this browser's local storage —
nothing is uploaded. The one exception: to send you a push notification while the app
is closed, a scheduled function needs to know *when* to remind you, so the reminder
schedule (task names + times, not your journal or checklist) and your push subscription
are stored in Netlify's built-in key-value store (Netlify Blobs).

## 1. Get the code onto Netlify

**Option A — Netlify CLI (fastest, no GitHub needed)**
```bash
npm install -g netlify-cli
cd spiritual-tracker
netlify login
netlify deploy --prod
```
Follow the prompts to create a new site. It will detect `netlify.toml` automatically
(publish dir `public`, functions in `netlify/functions`).

**Option B — GitHub + Netlify dashboard (recommended if you'll keep editing it)**
1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings are already set via `netlify.toml` — just click **Deploy**.
4. Every future `git push` auto-deploys.

## 2. Generate your push notification keys (VAPID)

Reminders use the Web Push standard, which needs a key pair.

```bash
npx web-push generate-vapid-keys
```

This prints a **Public Key** and a **Private Key**. In your Netlify site:
**Site settings → Environment variables**, add:

| Key | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | the public key |
| `VAPID_PRIVATE_KEY` | the private key |
| `VAPID_SUBJECT` | `mailto:youremail@example.com` |

Then trigger a redeploy (**Deploys → Trigger deploy**) so the functions pick up the
new environment variables.

## 3. Try it

- Open your deployed site. On phone, use **Add to Home Screen / Install app** — this
  matters most on iOS, where Safari only allows push notifications for installed PWAs
  (iOS 16.4+).
- Add a task or two under **Practices** (e.g. Confession, Holy Mass, Personal prayer
  time), optionally with a reminder time.
- Go to **Settings → Enable reminders** and allow the notification permission prompt.
- Check items off on **Today** to build your streak.

## How reminders actually fire

A Netlify Scheduled Function (`netlify/functions/send-reminders.js`) runs every 15
minutes, checks everyone's stored reminder times against their local time (using the
timezone your browser reported), and sends a real push notification if one is due.
Because it only runs every 15 minutes, a reminder can arrive up to ~15 minutes after
the time you set — tighten `*/15 * * * *` to e.g. `*/5 * * * *` in that file if you
want less drift (this uses a bit more of Netlify's free monthly credits).

## Data & backups

Since everything (besides the bare reminder schedule) stays on this one device/browser,
clearing your browser data or switching phones will lose it. Use **Settings → Export
backup** regularly, and **Import backup** to restore. If you'd rather your data synced
across devices instead of living only in local storage, that's a small architecture
change (swap localStorage for a Netlify Database or Supabase) — say the word and I'll
adapt it.

## Project structure

```
public/                  → static site (served as-is)
  index.html
  styles.css
  app.js                 → all app logic + localStorage
  service-worker.js       → offline caching + push display
  manifest.json
  icons/
netlify/functions/
  vapid-public-key.js     → serves the public VAPID key to the client
  subscribe.js             → stores push subscription + reminder times in Blobs
  send-reminders.js        → scheduled (cron) function that sends the pushes
netlify.toml
package.json
```
