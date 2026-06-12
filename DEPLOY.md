# DRC Maintenance Website — Deployment Guide

## What's in this folder
- `index.html` — homepage
- `about.html` — about page
- `privacy.html` — privacy policy
- `terms.html` — terms of service
- `functions/api/contact.js` — Cloudflare Pages Function that sends form
  submissions to your inbox via Resend

---

## Step 1 — Push to GitHub

1. Create a new repository on GitHub (e.g. `drc-maintenance-site`)
2. Upload all files in this folder, **keeping the folder structure**
   (the `functions/api/contact.js` path matters — don't flatten it)
3. Commit to the `main` branch

---

## Step 2 — Connect to Cloudflare Pages

1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Select your new GitHub repo
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/` (root)
4. Click **Save and Deploy**

Cloudflare will give you a live URL like `drc-maintenance-site.pages.dev`
within about a minute.

---

## Step 3 — Connect drcmaintenance.com

1. In your Cloudflare Pages project, go to **Custom domains**
2. Add `drcmaintenance.com` and `www.drcmaintenance.com`
3. If your domain's DNS is already on Cloudflare, this is one click.
   If not, Cloudflare will show you the DNS records to add at your registrar.

---

## Step 4 — Set up Resend (for the contact form)

1. Sign up at [resend.com](https://resend.com) (free tier is plenty to start)
2. **Verify your domain** `drcmaintenance.com` under Resend → Domains
   - This adds a few DNS records (same place as Step 3) — Resend walks you through it
   - Verification can take a few minutes to a few hours depending on DNS propagation
3. Create an API key under Resend → API Keys

---

## Step 5 — Add environment variables in Cloudflare Pages

In your Cloudflare Pages project → **Settings** → **Environment variables**,
add these for the **Production** environment:

| Variable          | Value                                             |
|-------------------|---------------------------------------------------|
| `RESEND_API_KEY`  | the API key from Resend                            |
| `FROM_EMAIL`      | e.g. `quotes@drcmaintenance.com` (must be on the verified domain) |
| `TO_EMAIL`        | the inbox where you want quote requests delivered |

After saving, **redeploy** (Cloudflare Pages → Deployments → re-run latest deployment)
so the function picks up the new variables.

---

## Step 6 — Test it

1. Visit your live site
2. Scroll to the contact form, fill it out with a test name/email, and submit
3. You should see "Request Received" on the site, and an email should land
   in `TO_EMAIL` within a few seconds
4. Check the Cloudflare Pages → Functions logs if something doesn't arrive —
   it'll show any errors from the function

---

## Notes

- The phone number `+1 (214) 940-6359` is already set in the contact section
  of `index.html`. To change it later, search for that text in the file.
- The logo and stamp images are embedded directly in the HTML as base64,
  so there's nothing extra to upload for those — they're part of the page.
- Before truly going live, have an attorney review `privacy.html` and
  `terms.html` — the current text is solid boilerplate but not
  custom legal advice for your business or states of operation.
