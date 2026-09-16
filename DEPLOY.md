# DRC Maintenance Website — Deployment Guide

## What's in this folder
- `index.html` — homepage
- `about.html` — about page
- `privacy.html` — privacy policy
- `terms.html` — terms of service
- `vendors.html` — **unlisted** vendor signup page (link-only, not in the nav)
- `functions/api/contact.js` — Cloudflare Pages Function that sends quote-request
  form submissions to your inbox via Resend
- `functions/api/vendor.js` — same thing for the vendor application form
- `_headers` — tells Cloudflare to add a `noindex` header on `vendors.html`

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
4. Then visit `/vendors.html`, submit the vendor application, and confirm a
   "New Vendor Application" email arrives in the same inbox
4. Check the Cloudflare Pages → Functions logs if something doesn't arrive —
   it'll show any errors from the function

---

## The unlisted vendor page

`vendors.html` is the vendor signup page. It is **not linked from anywhere** on
the site — no nav item, no footer link — so the only way to reach it is to be
given the URL:

```
https://drcmaintenance.com/vendors.html
```

Two things keep it out of search results:

1. A `<meta name="robots" content="noindex,nofollow,...">` tag in the page itself
2. An `X-Robots-Tag: noindex` header set in `_headers`

It is deliberately **not** listed in a `robots.txt` file — a `Disallow` line there
would publish the URL to anyone who looks at `robots.txt`.

Keep in mind this is "unlisted," not "private." Anyone you send the link to can
forward it, and the page has no password. That's usually the right trade-off for
a vendor application, but if you ever want it locked down, Cloudflare Access can
put a one-time email code in front of the page.

Submissions go to the same `TO_EMAIL` inbox via the same Resend key — no extra
setup needed beyond Step 5. The subject line is
`New Vendor Application — [Business Name] (trades)`, so it's easy to filter into
its own folder. The form has a hidden honeypot field to absorb bot spam, and it
asks vendors **not** to send EIN, SSN, or banking details — collect those during
onboarding through a secure channel, not email.

---

## Notes

- The phone number `+1 (214) 940-6359` is already set in the contact section
  of `index.html`. To change it later, search for that text in the file.
- The logo and stamp images are embedded directly in the HTML as base64,
  so there's nothing extra to upload for those — they're part of the page.
- Before truly going live, have an attorney review `privacy.html` and
  `terms.html` — the current text is solid boilerplate but not
  custom legal advice for your business or states of operation.
