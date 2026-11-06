(async function () {
  const status = document.getElementById('portal-status');
  const plans = document.getElementById('subscription-plans');
  const login = document.getElementById('portal-login');

  function stripeUrl(value, host, prefix) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || !url.pathname.startsWith(prefix)) throw new Error('Invalid billing link');
    return url.href;
  }

  try {
    const response = await fetch('/assets/stripe-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Billing unavailable');
    const config = await response.json();
    if (config.sandbox !== true || !config.portalUrl || !Array.isArray(config.plans)) throw new Error('Billing not configured');
    // Validate the whole configuration before enabling any action.
    const portalUrl = stripeUrl(config.portalUrl, 'billing.stripe.com', '/p/login/');
    const cards = config.plans.map(plan => {
      const checkoutUrl = stripeUrl(plan.url, 'buy.stripe.com', '/test_');
      if (!Number.isInteger(plan.amount) || plan.amount <= 0 || !['day', 'week', 'month', 'year'].includes(plan.interval) || !Number.isInteger(plan.intervalCount) || plan.intervalCount < 1) throw new Error('Invalid plan');
      const card = document.createElement('article');
      card.className = 'card';
      const title = document.createElement('h3');
      title.textContent = plan.name;
      const price = document.createElement('p');
      // Intl handles zero-decimal currencies as well as USD.
      const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency });
      const divisor = 10 ** formatter.resolvedOptions().maximumFractionDigits;
      price.textContent = `${formatter.format(plan.amount / divisor)} / ${plan.intervalCount === 1 ? plan.interval : `${plan.intervalCount} ${plan.interval}s`}`;
      const link = document.createElement('a');
      link.className = 'button';
      link.href = checkoutUrl;
      link.textContent = 'Start subscription →';
      card.append(title, price, link);
      return card;
    });
    plans.replaceChildren(...cards);
    login.href = portalUrl;
    login.hidden = false;
    status.textContent = cards.length
      ? 'Sandbox billing is ready. Choose a subscription below or log in to manage an existing one.'
      : 'No subscriptions are currently available to purchase. You can still log in to manage an existing subscription.';
  } catch {
    status.textContent = 'Online subscriptions are currently unavailable. Please contact Coach RJ for help.';
  }
})();
