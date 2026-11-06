import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const OWNER = 'coach-rj-website';

// Only this setup script, run locally or in GitHub Actions, sees the Stripe secret.
export async function syncStripe({ secretKey, siteUrl, fetchImpl = fetch }) {
  if (!/^sk_test_/.test(secretKey || '')) throw new Error('STRIPE_SANDBOX_SECRET_KEY must be a sandbox secret key.');
  let origin;
  try {
    const url = new URL(siteUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    origin = url.origin;
  } catch { throw new Error('SITE_URL must be the HTTPS website origin, or an HTTP localhost origin for testing.'); }
  const completion = {
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': `${origin}/portal/thanks/`,
  };

  async function api(path, params, method = 'GET') {
    const form = new URLSearchParams(params);
    const response = await fetchImpl(`https://api.stripe.com/v1/${path}${method === 'GET' ? `?${form}` : ''}`, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Stripe-Version': '2026-10-28.endive',
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(method === 'POST' ? { body: form } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    // Never log Stripe response bodies or request details; they may contain sensitive data.
    if (!response.ok) throw new Error(`Stripe ${method} ${path.split('/')[0]} failed (HTTP ${response.status}). Check the sandbox account configuration.`);
    return response.json();
  }

  async function list(path, params = {}) {
    const items = [];
    let cursor;
    do {
      const page = await api(path, { ...params, limit: '100', ...(cursor ? { starting_after: cursor } : {}) });
      items.push(...page.data);
      cursor = page.has_more ? page.data.at(-1)?.id : null;
    } while (cursor);
    return items;
  }

  const products = new Map((await list('products', { active: 'true' }))
    .filter(product => product.active && product.livemode === false)
    .map(product => [product.id, product]));
  const prices = (await list('prices', { active: 'true', type: 'recurring' }))
    .filter(price => products.has(price.product) && price.active && price.type === 'recurring' && price.livemode === false && price.billing_scheme === 'per_unit' && Number.isInteger(price.unit_amount) && price.unit_amount > 0 && price.recurring?.usage_type === 'licensed' && !price.transform_quantity && !price.custom_unit_amount)
    .sort((a, b) => products.get(a.product).name.localeCompare(products.get(b.product).name) || a.id.localeCompare(b.id));

  const configs = await list('billing_portal/configurations');
  // Reuse the previous single-product configuration when upgrading to catalog sync.
  const owned = configs.find(config => config.active && config.metadata?.website === OWNER);
  const portal = await api(`billing_portal/configurations${owned ? `/${owned.id}` : ''}`, {
    'metadata[website]': OWNER,
    'metadata[product]': '',
    'business_profile[headline]': 'Manage your Coach RJ subscription',
    default_return_url: `${origin}/portal/`,
    'features[invoice_history][enabled]': 'true',
    'features[payment_method_update][enabled]': 'true',
    'features[subscription_cancel][enabled]': 'true',
    'features[subscription_cancel][mode]': 'at_period_end',
    'login_page[enabled]': 'true',
  }, 'POST');
  if (!portal.active || !isStripeUrl(portal.login_page?.url, 'billing.stripe.com', '/p/login/')) throw new Error('Stripe did not return an active portal login link.');

  const existingLinks = await list('payment_links', { active: 'true' });
  const plans = [];
  for (const price of prices) {
    const product = products.get(price.product);
    let link = existingLinks.find(link => link.metadata?.website === OWNER && link.metadata?.price === price.id);
    if (!link) {
      link = await api('payment_links', {
        'line_items[0][price]': price.id,
        'line_items[0][quantity]': '1',
        'metadata[website]': OWNER,
        'metadata[price]': price.id,
        'subscription_data[metadata][website]': OWNER,
        ...completion,
      }, 'POST');
    } else {
      // Update existing links too, so rerunning setup changes the return destination.
      link = await api(`payment_links/${link.id}`, completion, 'POST');
    }
    if (!isStripeUrl(link.url, 'buy.stripe.com', '/test_')) throw new Error('Stripe did not return a sandbox checkout link.');
    plans.push({ name: product.name, amount: price.unit_amount, currency: price.currency, interval: price.recurring.interval, intervalCount: price.recurring.interval_count, url: link.url });
  }
  // Stop selling archived/unsupported products and prices through our old links.
  // Existing subscriptions and links created elsewhere are left alone.
  const currentPrices = new Set(prices.map(price => price.id));
  for (const link of existingLinks) {
    if (link.metadata?.website === OWNER && link.metadata?.price && !currentPrices.has(link.metadata.price)) {
      await api(`payment_links/${link.id}`, { active: 'false' }, 'POST');
    }
  }
  // Explicit allowlist: no keys, customer records, or raw API responses are published.
  return { sandbox: true, portalUrl: portal.login_page.url, plans };
}

export function isStripeUrl(value, host, prefix) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password && url.pathname.startsWith(prefix);
  } catch { return false; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = await syncStripe({ secretKey: process.env.STRIPE_SANDBOX_SECRET_KEY, siteUrl: process.env.SITE_URL || 'https://coach-rj.com' });
    await writeFile('assets/stripe-config.json', `${JSON.stringify(config, null, 2)}\n`);
    console.log('Updated public sandbox subscription links.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
