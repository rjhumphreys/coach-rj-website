# Coach RJ website

This is a static HTML and CSS site. There is no framework or content-management system.

## Edit page content

Each page lives in an `index.html` file:

- Home: `index.html`
- About: `about/index.html`
- Services: `services/index.html`
- Contact: `contact/index.html`
- Training questionnaire: `questionnaire/index.html`
- Work: `work/index.html`
- Blog: `blog/index.html`

Most text can be edited directly between the HTML tags. Site-wide styling lives in
`assets/styles.css`.

## Preview and build

```bash
npm run build
npx wrangler dev
```

`npm run build` copies the site into `dist/`, which Wrangler serves and deploys.

## Questionnaire

The questionnaire is displayed on this site and submits responses to the existing
Google Form. If the Google Form is replaced, update the form `action` and the
`entry.*` field names in `questionnaire/index.html`.

## Customer subscriptions (Stripe sandbox)

The `/portal/` page offers new subscriptions through Stripe Payment Links and
existing subscription management through Stripe's hosted, email-verified customer
portal. Customers use their checkout email to log in; the site does not store
passwords, card details, or customer records. The portal supports payment method
updates, invoices, and cancellation at the end of the billing period. Subscription
creation and billing are handled by Stripe; this site does not grant access to
TeamBuildr or provision coaching automatically.

### Initial setup

1. Keep `STRIPE_SANDBOX_SECRET_KEY` in GitHub Actions repository secrets.
   `STRIPE_SANDBOX_PRODUCT_ID` is no longer used and may be removed;
   `STRIPE_SANDBOX_PUBLIC_KEY` is not needed for hosted checkout.
2. Manage products and prices directly in the sandbox that belongs to this key.
   Every active product with an active, fixed, positive recurring price is listed.
   One-time, metered, tiered, and custom-amount prices are excluded. The sync never
   creates products/prices or guesses amounts from the Services page. To change a
   price in Stripe, add its replacement and archive the old price so both are not
   offered. These changes affect new purchases; existing subscriptions keep their
   current Stripe billing terms.
3. After merging to `main`, **Configure Stripe sandbox** runs daily at 10:17 UTC
   (5:17 a.m. Eastern standard time / 6:17 a.m. daylight time) and on changes to
   its script/workflow/tests. GitHub may delay scheduled runs.
   For an immediate refresh: open the repository's **Actions** tab, select
   **Configure Stripe sandbox**, click **Run workflow**, select **main**, then
   click **Run workflow**. It uses the same secret and sync as the daily run.
   GitHub can disable schedules in public repositories after 60 days without
   repository activity; re-enable the workflow in Actions if that happens.
4. Allow this workflow to write repository contents. It commits only the generated
   public checkout URLs, portal login URL, product names, and price display data to
   `assets/stripe-config.json`. If branch protection blocks the bot's push, allow
   this workflow through your normal repository policy or run the script locally
   with the secrets in environment variables and submit the public JSON via a PR.
5. The existing Cloudflare Git integration must deploy the resulting commit using
   `npm run build` as usual. No new Cloudflare credentials or backend are needed.
   The workflow itself does not deploy to Cloudflare.

The workflow creates a dedicated portal configuration and tags it and payment
links with `metadata.website=coach-rj-website`. Subsequent runs reuse those resources;
it does not change unrelated Stripe configurations or links. Archived products and
prices disappear from the website on the next sync, and the sync deactivates their
previously generated checkout links. Existing subscriptions remain unchanged.
An empty catalog still allows existing customers to log in and manage billing.
Only changed public data is committed, so unchanged daily runs do not trigger
unnecessary site deployments.

Until configuration is generated, billing actions remain hidden and the page
shows a contact fallback. GitHub secrets cannot be read from a local checkout.

### Verification

For local Stripe validation, put `STRIPE_SANDBOX_SECRET_KEY` in a `.env` file and run:

```bash
node --env-file=.env scripts/sync-stripe.mjs
```

`.env` and `.env.*` are gitignored (except `.env.example`). This command creates or
reuses sandbox checkout and portal links and updates only the public configuration.

After checkout, Stripe automatically redirects customers to
`https://coach-rj.com/portal/thanks/`. The billing portal also includes a return
link to `https://coach-rj.com/portal/`. The thank-you page directs customers to
their confirmation email and billing portal for the actual payment status;
visiting it alone does not verify a payment or grant access to training.

To test the return page locally, run
`SITE_URL=http://localhost:8000 node --env-file=.env scripts/sync-stripe.mjs`.
This updates the shared sandbox links' return destination. Run the sync again
with `SITE_URL=https://coach-rj.com` to restore the deployed destination. Actions
defaults to `https://coach-rj.com`; set the repository variable `SITE_URL` to
override it if the site's domain changes.

Run `npm test` and `npm run build` locally. Tests mock Stripe and verify provisioning,
resource reuse, sandbox-only credentials, safe public output, URL validation,
pricing display, and unavailable states.

After the workflow and Cloudflare deployment succeed, visit `/portal/`, complete
a subscription using Stripe's sandbox payment details, then use the same email
with **Log in to manage subscription**. Verify invoices, a payment method change,
and end-of-period cancellation in Stripe. Sandbox email delivery can differ from
live mode; follow Stripe's sandbox login instructions. Never use a real card.

This integration intentionally accepts sandbox keys only and labels the page as
sandbox billing. Taking real subscriptions requires a separate live-mode setup
with live products, links, credentials, and updated page messaging.
