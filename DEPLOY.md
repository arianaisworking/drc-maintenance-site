# DRC Maintenance Website — Deployment Guide

## What's in this folder
- `index.html` — homepage
- `about.html` — about page
- `privacy.html` — privacy policy
- `terms.html` — terms of service
- `vendors.html` — **unlisted** vendor signup page (link-only, not in the nav)
- `cities.json` — US city/county lookup that powers the service-area picker on
  that page (loaded only when a vendor scrolls to the form)
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

## DRC Gear (merch section)

The homepage has a merch section that sits just above the footer. **It is
switched off right now**, so nothing appears on the live site until you turn
it on. Nobody sees placeholder products in the meantime.

Everything you edit lives in one block near the bottom of `index.html`.
Search the file for `const MERCH` and you'll land on it.

### Turning it on

1. **Create the store.** In Printify, go to **My Stores** -> **Add store** ->
   **Pop-Up Store**. Printify hosts it, handles checkout, payment, shipping,
   and returns, and takes its cut per sale. There is no monthly fee. It gives
   you a URL that looks like `https://your-name.printify.me`.
2. **Add your products** in Printify and publish them to that Pop-Up Store.
3. **Paste the store URL** into `storeUrl` in the `MERCH` block.
4. **Replace the products.** The list ships with six placeholders so you can
   see the layout. For each real product, fill in:
   - `name` and `price` as you want them shown
   - `blurb`, one short line
   - `image` — open the product in your Pop-Up Store, right-click the mockup,
     **Copy Image Address**, paste it here
   - `url` — the product's page link in your Pop-Up Store
5. **Set `enabled: true`** and commit. The section and a "DRC Gear" footer
   link both appear.

### Notes

- Prices in the `MERCH` block are display only. The price a customer actually
  pays is whatever Printify has set, so keep the two in sync or leave `price`
  empty to avoid the mismatch.
- A product with no `image` shows a "DRC" tile instead, and a broken image
  link falls back to the same tile, so a half-finished list still looks
  deliberate.
- Buy buttons open the store in a new tab. Your site never touches card
  details, which keeps payment handling entirely on Printify's side.
- The grid is four across on desktop, three on tablet, two on phones.
- If you outgrow the Pop-Up Store, Shopify plus Printify (about $39/month)
  would let a real cart live on the page itself. That is a bigger change.

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

Submissions go to the same `TO_EMAIL` inbox via the same Resend key, so there's
no extra setup beyond Step 5. The subject line is
`New Vendor Application: [Business Name] (trades) - [City, ST]`, which makes it
easy to filter into its own folder. The form has a hidden honeypot field to
absorb bot spam, and it asks vendors **not** to send EIN, SSN, or banking
details. Collect those during onboarding through a secure channel, not email.

### How the service-area picker works

Vendors pick their state, type their home city, and then tap the surrounding
cities they cover **with no trip charge**. A radius control (15/25/50/75 miles)
lists nearby cities sorted by distance, and "Add all" takes the whole radius in
one click. Nearby results cross state lines, so a vendor in Texarkana or
Kansas City gets both sides of the border.

Counties fill in automatically from whichever cities they pick, and they can add
more by hand. If a vendor checks **Property Preservation / REO**, counties become
required, since preservation work orders are assigned by county. The email flags
those vendors at the top so you can see it at a glance.

`cities.json` holds about 29,700 US cities with their counties and coordinates.
It is roughly 320 KB over the wire, loads only when someone scrolls to the form,
and is cached by Cloudflare after the first request. If it ever fails to load,
the form falls back to a plain text box where the vendor describes their area in
their own words, so nobody gets stuck.

### Insurance limits are stated on the page

The page publishes the COI limits vendors have to meet ($1M per occurrence /
$2M aggregate general liability, $1M combined single limit auto, workers' comp at
statutory limits, DRC named as certificate holder and additional insured). If
your actual requirements differ, edit the `coi-box` section of `vendors.html`
and the matching dropdown options in the Insurance & Compliance part of the form.

---

## Notes

- The phone number `+1 (214) 940-6359` is already set in the contact section
  of `index.html`. To change it later, search for that text in the file.
- The logo and stamp images are embedded directly in the HTML as base64,
  so there's nothing extra to upload for those — they're part of the page.
- Before truly going live, have an attorney review `privacy.html` and
  `terms.html` — the current text is solid boilerplate but not
  custom legal advice for your business or states of operation.
