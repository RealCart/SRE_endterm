const services = [
  { key: 'auth', title: 'Auth Service', route: '/auth', icon: 'AU' },
  { key: 'products', title: 'Product Service', route: '/products', icon: 'PR' },
  { key: 'orders', title: 'Order Service', route: '/orders', icon: 'OR' },
  { key: 'payments', title: 'Payment Service', route: '/payments', icon: 'PA' },
  { key: 'notifications', title: 'Notification Service', route: '/notifications', icon: 'NO' },
  { key: 'profiles', title: 'Profile Service', route: '/profiles', icon: 'PF' },
];

let activeService = services[1];
const healthGrid = document.querySelector('#healthGrid');
const serviceList = document.querySelector('#serviceList');
const itemsGrid = document.querySelector('#itemsGrid');
const requestLog = document.querySelector('#requestLog');
const activeServiceTitle = document.querySelector('#activeServiceTitle');
const activeRoute = document.querySelector('#activeRoute');
const itemForm = document.querySelector('#itemForm');
const itemName = document.querySelector('#itemName');
const itemStatus = document.querySelector('#itemStatus');
const overallStatus = document.querySelector('#overallStatus');
const statusRing = document.querySelector('#statusRing');
const lastUpdated = document.querySelector('#lastUpdated');

function setLoadingGrid() {
  healthGrid.innerHTML = '';
  services.forEach((service) => {
    const card = document.createElement('article');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-icon"></div>
      <div>
        <span class="metric-label">${service.title}</span>
        <strong class="metric-value">Checking...</strong>
        <small class="metric-route">${service.route}/health</small>
      </div>`;
    healthGrid.appendChild(card);
  });
}

function renderServiceButtons() {
  serviceList.innerHTML = services.map((service) => `
    <button class="service-button ${service.key === activeService.key ? 'active' : ''}" data-key="${service.key}">
      <strong>${service.title}</strong>
      <small>${service.route}/items</small>
    </button>
  `).join('');

  document.querySelectorAll('.service-button').forEach((button) => {
    button.addEventListener('click', async () => {
      activeService = services.find((service) => service.key === button.dataset.key);
      renderServiceButtons();
      updateActiveHeader();
      await loadItems();
    });
  });
}

function updateActiveHeader() {
  activeServiceTitle.textContent = activeService.title;
  activeRoute.textContent = `${activeService.route}/items`;
}

function logRequest(method, url, status, message = '') {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<strong>${method} ${status}</strong><small>${url}<br>${time}${message ? ` · ${message}` : ''}</small>`;
  requestLog.prepend(entry);
}

async function apiRequest(url, options = {}) {
  const method = options.method || 'GET';
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await response.json();
    logRequest(method, url, response.status, response.ok ? 'success' : data.detail || 'error');
    if (!response.ok) throw new Error(data.detail || `Request failed with ${response.status}`);
    return data;
  } catch (error) {
    logRequest(method, url, 'ERR', error.message);
    throw error;
  }
}

async function refreshHealth() {
  setLoadingGrid();
  const results = await Promise.allSettled(
    services.map(async (service) => ({ service, data: await apiRequest(`${service.route}/health`) }))
  );

  let healthy = 0;
  healthGrid.innerHTML = '';

  results.forEach((result) => {
    const service = result.value?.service || services[healthGrid.children.length];
    const ok = result.status === 'fulfilled' && result.value.data.status === 'healthy';
    if (ok) healthy += 1;

    const card = document.createElement('article');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-icon ${ok ? 'ok' : 'down'}"></div>
      <div>
        <span class="metric-label">${service.title}</span>
        <strong class="metric-value">${ok ? 'Healthy' : 'Unavailable'}</strong>
        <small class="metric-route">${service.route}/health</small>
      </div>`;
    healthGrid.appendChild(card);
  });

  const angle = Math.round((healthy / services.length) * 360);
  statusRing.textContent = `${healthy}/${services.length}`;
  statusRing.style.background = `conic-gradient(var(--accent-2) ${angle}deg, rgba(255,255,255,.1) ${angle}deg)`;
  overallStatus.textContent = healthy === services.length ? 'All systems operational' : `${healthy} services healthy`;
  overallStatus.style.color = healthy === services.length ? 'var(--good)' : 'var(--warn)';
  lastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
}

async function loadItems() {
  itemsGrid.innerHTML = '<div class="empty-state">Loading data from backend...</div>';
  try {
    const response = await apiRequest(`${activeService.route}/items`);
    const items = response.data || [];
    if (!items.length) {
      itemsGrid.innerHTML = '<div class="empty-state">No items returned by this service.</div>';
      return;
    }
    itemsGrid.innerHTML = items.map((item) => `
      <article class="item-card">
        <span>ID #${item.id ?? 'new'}</span>
        <strong>${escapeHtml(item.name || 'Unnamed item')}</strong>
        <span>Status: ${escapeHtml(item.status || 'unknown')}</span>
      </article>
    `).join('');
  } catch (error) {
    itemsGrid.innerHTML = `<div class="empty-state">Cannot load items: ${escapeHtml(error.message)}</div>`;
  }
}

async function createItem(event) {
  event.preventDefault();
  const payload = {
    name: itemName.value.trim(),
    status: itemStatus.value,
    createdFrom: 'frontend-dashboard',
    createdAt: new Date().toISOString(),
  };
  if (!payload.name) return;

  try {
    await apiRequest(`${activeService.route}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    itemForm.reset();
    itemStatus.value = 'active';
    await loadItems();
    await refreshHealth();
  } catch (error) {
    alert(`Failed to create item: ${error.message}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.querySelector('#refreshAllBtn').addEventListener('click', async () => {
  await refreshHealth();
  await loadItems();
});
document.querySelector('#loadSelectedBtn').addEventListener('click', loadItems);
document.querySelector('#clearLogBtn').addEventListener('click', () => requestLog.innerHTML = '');
itemForm.addEventListener('submit', createItem);

renderServiceButtons();
updateActiveHeader();
refreshHealth();
loadItems();
