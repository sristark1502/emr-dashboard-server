# EMR Dashboard — Vercel Auto-Email Server

## What This Does
- Sends **DAILY BRC STATUS REPORT** email automatically at **9:00 AM IST**
- Works 24/7 even when your PC is OFF
- Sends to j.sudhakar@emr.global with CC to SHREELANJ@emr.global, service@emr.global
- Includes EMR branded HTML email + CSV attachment

---

## SETUP (One Time — 10 Minutes)

### Step 1: Get Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in with **mrsrivigneschemr@gmail.com**
3. If you don't see "App passwords":
   - First go to https://myaccount.google.com/security
   - Turn ON **2-Step Verification**
   - Then go back to App passwords
4. Click **"Create a new app password"**
5. Name it: `EMR Dashboard`
6. Click **Create** → Copy the 16-character password (like: `abcd efgh ijkl mnop`)
7. **Save this password** — you'll need it in Step 4

### Step 2: Push Code to GitHub
1. Go to https://github.com/new
2. Create a new repo named: `emr-dashboard-server`
3. Upload ALL files from this folder:
   - `vercel.json`
   - `package.json`
   - `api/send-email.js`
   - `public/index.html`
4. Make sure the folder structure is:
   ```
   emr-dashboard-server/
   ├── vercel.json
   ├── package.json
   ├── api/
   │   └── send-email.js
   └── public/
       └── index.html
   ```

### Step 3: Connect to Vercel
1. Go to https://vercel.com
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. After login, click **"Add New Project"**
4. Select your `emr-dashboard-server` repo
5. Click **"Deploy"**

### Step 4: Add Gmail Credentials
1. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
2. Add these TWO variables:

   | Name | Value |
   |------|-------|
   | `GMAIL_USER` | `mrsrivigneschemr@gmail.com` |
   | `GMAIL_APP_PASSWORD` | `your-16-char-app-password` |

3. Click **Save**
4. Go to **Deployments** → Click **"Redeploy"** (the 3 dots → Redeploy)

### Step 5: Test It
1. Visit `https://your-project.vercel.app/api/send-email`
2. You should see: `{"success": true, "message": "Email sent!"}`
3. Check j.sudhakar@emr.global's inbox!

---

## DONE! 🎉
The cron job will now send the email every day at 9:00 AM IST automatically.

## To Update Complaint Data
Edit `api/send-email.js` → update the `complaints` array → push to GitHub → Vercel auto-deploys.

## To Change Schedule Time
Edit `vercel.json` → change the cron schedule:
- `"30 3 * * *"` = 9:00 AM IST (3:30 AM UTC)
- `"0 4 * * *"` = 9:30 AM IST
- `"30 4 * * *"` = 10:00 AM IST

## To Test Manually
Visit `/api/send-email` in your browser — it sends immediately.
