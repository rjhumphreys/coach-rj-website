import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { syncStripe, isStripeUrl } from '../scripts/sync-stripe.mjs';

const product = { id: 'prod_test', name: 'Coaching', active: true, livemode: false };
const price = { id: 'price_month', product: product.id, type: 'recurring', active: true, livemode: false, billing_scheme: 'per_unit', unit_amount: 17500, currency: 'usd', recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' } };
function stripeMock({ existing = false, noPrices = false, live = false, fail = false, products, prices, links } = {}) {
  const calls = [];
  const portal = { id: 'bpc_test', active: true, metadata: { website: 'coach-rj-website', product: 'prod_test' }, login_page: { url: 'https://billing.stripe.com/p/login/test_portal' } };
  const oldLink = { id: 'plink_test', url: 'https://buy.stripe.com/test_checkout', metadata: { website: 'coach-rj-website', price: price.id } };
  const catalog = {
    products: products ?? [{ ...product, livemode: live }],
    prices: prices ?? (noPrices ? [] : [{ ...price, id: 'price_metered', recurring: { ...price.recurring, usage_type: 'metered' } }, price]),
    'billing_portal/configurations': existing ? [portal] : [],
    payment_links: links ?? (existing ? [oldLink] : []),
  };
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    const path = url.pathname.replace('/v1/', '');
    const body = new URLSearchParams(options.body);
    calls.push({ path, method: options.method, body, query: url.searchParams });
    let data;
    if (options.method === 'GET' && catalog[path]) {
      // One item per page exercises pagination across all catalog resources.
      const items = catalog[path];
      const cursor = url.searchParams.get('starting_after');
      const start = cursor ? items.findIndex(item => item.id === cursor) + 1 : 0;
      data = { data: items.slice(start, start + 1), has_more: start + 1 < items.length };
    } else if (options.method === 'POST' && path.startsWith('billing_portal/configurations')) {
      data = portal;
    } else if (options.method === 'POST' && path.startsWith('payment_links')) {
      data = path === 'payment_links' ? { id: `plink_${body.get('line_items[0][price]')}`, url: 'https://buy.stripe.com/test_checkout' } : { ...oldLink, id: path.split('/')[1] };
    } else throw new Error(`Unexpected endpoint ${path}`);
    return { ok: !fail, status: fail ? 401 : 200, json: async () => data };
  };
  return { calls, fetchImpl };
}
const credentials = { secretKey: 'sk_test_fake_for_tests', siteUrl: 'https://coach.example' };

test('provisions subscription checkout and authenticated portal; publishes only safe fields', async () => {
  const mock = stripeMock();
  const config = await syncStripe({ ...credentials, ...mock });
  assert.equal(config.plans.length, 1);
  assert.equal(config.plans[0].amount, 17500);
  assert.equal(config.portalUrl, 'https://billing.stripe.com/p/login/test_portal');
  assert.equal(JSON.stringify(config).includes(credentials.secretKey), false);
  assert.deepEqual(Object.keys(config).sort(), ['plans', 'portalUrl', 'sandbox']);
  const portal = mock.calls.find(c => c.path === 'billing_portal/configurations' && c.method === 'POST');
  assert.equal(portal.body.get('features[subscription_cancel][mode]'), 'at_period_end');
  assert.equal(portal.body.get('login_page[enabled]'), 'true');
  assert.equal(portal.body.get('features[payment_method_update][enabled]'), 'true');
  assert.equal(portal.body.get('default_return_url'), 'https://coach.example/portal/');
  const checkout = mock.calls.find(c => c.path === 'payment_links' && c.method === 'POST');
  assert.equal(checkout.body.get('line_items[0][price]'), 'price_month');
  assert.equal(checkout.body.get('line_items[0][quantity]'), '1');
  assert.equal(checkout.body.get('after_completion[type]'), 'redirect');
  assert.equal(checkout.body.get('after_completion[redirect][url]'), 'https://coach.example/portal/thanks/');
});

test('reruns reuse managed configuration and payment links', async () => {
  const mock = stripeMock({ existing: true });
  await syncStripe({ ...credentials, ...mock });
  assert.equal(mock.calls.filter(c => c.path === 'payment_links' && c.method === 'POST').length, 0);
  assert.ok(mock.calls.some(c => c.path === 'billing_portal/configurations/bpc_test' && c.method === 'POST'));
  const updated = mock.calls.find(c => c.path === 'payment_links/plink_test' && c.method === 'POST');
  assert.equal(updated.body.get('after_completion[redirect][url]'), 'https://coach.example/portal/thanks/');
});

test('accepts a local return origin and rejects missing or unsafe origins before API calls', async () => {
  const mock = stripeMock({ existing: true });
  await syncStripe({ ...credentials, ...mock, siteUrl: 'http://localhost:8000' });
  assert.equal(mock.calls.find(c => c.path === 'payment_links/plink_test').body.get('after_completion[redirect][url]'), 'http://localhost:8000/portal/thanks/');
  for (const siteUrl of [undefined, 'http://coach.example', 'https://user:password@coach.example', 'javascript:alert(1)', 'https://coach.example/unexpected']) {
    await assert.rejects(syncStripe({ ...credentials, siteUrl }), /SITE_URL/);
  }
});

test('rejects live credentials before contacting Stripe', async () => {
  await assert.rejects(syncStripe({ secretKey: 'sk_live_fake' }), /sandbox secret key/);
});

test('discovers multiple products, renamed products, and changed prices across pages', async () => {
  const mock = stripeMock({
    products: [{ ...product, name: 'Updated coaching name' }, { ...product, id: 'prod_premium', name: 'Premium' }],
    prices: [price, { ...price, id: 'price_premium', product: 'prod_premium', unit_amount: 37500 }],
  });
  const config = await syncStripe({ ...credentials, ...mock });
  assert.deepEqual(config.plans.map(plan => [plan.name, plan.amount]), [['Premium', 37500], ['Updated coaching name', 17500]]);
  assert.equal(mock.calls.filter(call => call.path === 'payment_links' && call.method === 'POST').length, 2);
  assert.ok(mock.calls.filter(call => call.path === 'products' || call.path === 'prices').every(call => call.query.get('active') === 'true'));
});

test('excludes archived, live, one-time, metered, and unsupported prices', async () => {
  const config = await syncStripe({ ...credentials, ...stripeMock({
    products: [product, { ...product, id: 'prod_archived', active: false }, { ...product, id: 'prod_live', livemode: true }],
    prices: [price,
      { ...price, id: 'price_archived_product', product: 'prod_archived' },
      { ...price, id: 'price_live_product', product: 'prod_live' },
      { ...price, id: 'price_inactive', active: false },
      { ...price, id: 'price_one_time', type: 'one_time', recurring: null },
      { ...price, id: 'price_tiered', billing_scheme: 'tiered' },
      { ...price, id: 'price_metered', recurring: { ...price.recurring, usage_type: 'metered' } },
    ],
  }) });
  assert.equal(config.plans.length, 1);
  assert.equal(config.plans[0].amount, price.unit_amount);
});

test('archiving the last product removes its listing and managed link while retaining portal login', async () => {
  const mock = stripeMock({ existing: true, products: [], links: [
    { id: 'plink_test', metadata: { website: 'coach-rj-website', price: price.id } },
    { id: 'plink_unrelated', metadata: { price: 'price_other' } },
  ] });
  const config = await syncStripe({ ...credentials, ...mock });
  assert.deepEqual(config.plans, []);
  const disabled = mock.calls.filter(call => call.body.get('active') === 'false');
  assert.deepEqual(disabled.map(call => call.path), ['payment_links/plink_test']);
  const elements = await renderPortal(config);
  assert.equal(elements.get('portal-login').hidden, false);
  assert.match(elements.get('portal-status').textContent, /No subscriptions are currently available/);
});

test('API failure does not expose secrets or response bodies', async () => {
  await assert.rejects(syncStripe({ ...credentials, ...stripeMock({ fail: true }) }), error => {
    assert.match(error.message, /HTTP 401/);
    assert.equal(error.message.includes(credentials.secretKey), false);
    return true;
  });
});

test('validates exact Stripe hosts, HTTPS, and sandbox checkout paths', () => {
  assert.equal(isStripeUrl('https://buy.stripe.com/test_ok', 'buy.stripe.com', '/test_'), true);
  for (const url of ['https://buy.stripe.com.evil.test/test_bad', 'javascript:alert(1)', 'http://buy.stripe.com/test_bad', 'https://buy.stripe.com/live', 'https://user@buy.stripe.com/test_bad']) {
    assert.equal(isStripeUrl(url, 'buy.stripe.com', '/test_'), false);
  }
});

async function renderPortal(config, ok = true) {
  const elements = new Map();
  function element() { return { children: [], hidden: true, append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; } }; }
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element };
  const source = await readFile(new URL('../assets/portal.js', import.meta.url), 'utf8');
  await vm.runInNewContext(source, { document, URL, Intl, fetch: async () => ({ ok, json: async () => config }) });
  return elements;
}

test('portal displays Stripe prices and enables verified billing links', async () => {
  const config = await syncStripe({ ...credentials, ...stripeMock() });
  const elements = await renderPortal(config);
  assert.equal(elements.get('portal-login').hidden, false);
  assert.equal(elements.get('portal-login').href, config.portalUrl);
  const card = elements.get('subscription-plans').children[0];
  assert.equal(card.children[1].textContent, '$175.00 / month');
  assert.equal(card.children[2].href, config.plans[0].url);
});

test('portal fails safely for unconfigured, unreachable, or untrusted billing', async () => {
  for (const config of [{ sandbox: true, portalUrl: null, plans: [] }, { sandbox: true, portalUrl: 'https://evil.test/', plans: [price] }]) {
    const elements = await renderPortal(config);
    assert.equal(elements.get('portal-login').hidden, true);
    assert.match(elements.get('portal-status').textContent, /currently unavailable/);
  }
  const elements = await renderPortal(null, false);
  assert.equal(elements.get('portal-login').hidden, true);
});
