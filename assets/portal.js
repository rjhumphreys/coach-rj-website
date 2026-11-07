(async function () {
  const status = document.getElementById('portal-status');
  const plans = document.getElementById('subscription-plans');
  const login = document.getElementById('portal-login');
  const prices = document.querySelectorAll('[data-service-price]');

  function stripeUrl(value, host, prefix) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || !url.pathname.startsWith(prefix)) throw new Error('Invalid billing link');
    return url.href;
  }

  function formatPrice(plan) {
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency });
    const divisor = 10 ** formatter.resolvedOptions().maximumFractionDigits;
    return `${formatter.format(plan.amount / divisor)} / ${plan.intervalCount === 1 ? plan.interval : `${plan.intervalCount} ${plan.interval}s`}`;
  }

  try {
    const response = await fetch('/assets/stripe-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Billing unavailable');
    const config = await response.json();
    if (config.sandbox !== true || !config.portalUrl || !Array.isArray(config.plans)) throw new Error('Billing not configured');
    // Validate every price and link before displaying billing actions.
    const portalUrl = stripeUrl(config.portalUrl, 'billing.stripe.com', '/p/login/');
    const catalog = config.plans.map(plan => {
      const url = stripeUrl(plan.url, 'buy.stripe.com', '/test_');
      if (!Number.isInteger(plan.amount) || plan.amount <= 0 || !['day', 'week', 'month', 'year'].includes(plan.interval) || !Number.isInteger(plan.intervalCount) || plan.intervalCount < 1) throw new Error('Invalid plan');
      return { ...plan, url, price: formatPrice(plan) };
    });

    if (plans) {
      const matching = catalog.filter(plan => plan.service === plans.dataset.service);
      const cards = matching.map(plan => {
        const card = document.createElement('article');
        card.className = 'card';
        const title = document.createElement('h3');
        title.textContent = plan.name;
        const price = document.createElement('p');
        price.textContent = plan.price;
        const link = document.createElement('a');
        link.className = 'button';
        link.href = plan.url;
        link.textContent = 'Subscribe →';
        card.append(title, price, link);
        return card;
      });
      plans.replaceChildren(...cards);
      if (status) status.textContent = cards.length
        ? 'Choose your subscription below. You’ll review the recurring price on Stripe before confirming.'
        : 'This service is not currently available to subscribe online. Please contact Coach RJ.';
    } else if (status) {
      status.textContent = 'Use the email address you entered at checkout to access your billing account.';
    }

    for (const element of prices) {
      const matching = catalog.filter(plan => plan.service === element.dataset.servicePrice);
      element.textContent = matching.length === 1 ? matching[0].price : 'View subscription options';
    }
    if (login) {
      login.href = portalUrl;
      login.hidden = false;
    }
  } catch {
    if (status) status.textContent = 'Online subscriptions are currently unavailable. Please contact Coach RJ for help.';
  }
})();
