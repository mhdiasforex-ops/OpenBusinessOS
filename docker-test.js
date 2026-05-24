const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: '/api/v1' + path,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3001, path: '/api/v1' + path, method: 'GET',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject); req.end();
  });
}

function checkUrl(port, path) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port, path, method: 'GET' }, res => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.end();
  });
}

(async () => {
  let pass = 0, fail = 0;
  const ck = (name, ok, detail) => {
    if (ok) { pass++; console.log(`  PASS  ${name} ${detail||''}`); }
    else { fail++; console.log(`  FAIL  ${name} ${detail||''}`); }
  };

  console.log('=== OpenBusinessOS Docker Full Test ===\n');

  // Infra
  console.log('--- Infrastructure ---');
  const webCode = await checkUrl(3000, '/');
  ck('Web (Next.js)', webCode > 0 && webCode < 500, `HTTP ${webCode}`);
  const swaggerCode = await checkUrl(3001, '/api/v1/docs-json');
  ck('API Swagger', swaggerCode === 200, `HTTP ${swaggerCode}`);

  // Auth
  console.log('\n--- API Endpoints ---');
  const login = await post('/auth/login', { email: 'demo@openbusinessos.com', password: 'demo123' });
  const token = login.accessToken;
  ck('Auth Login', !!token, token ? 'token OK' : JSON.stringify(login).substring(0,80));

  const me = await get('/auth/me', token);
  ck('Auth /me', !!me.email, me.email || '');

  // Endpoints
  const tests = [
    ['Notifications', '/notifications', j => j.data !== undefined],
    ['Users List', '/users', j => !!j.data],
    ['Users Profile', '/users/profile', j => !!j.roles],
    ['Financial', '/financial/transactions?page=1&limit=3', j => !!j.data],
    ['CRM', '/crm/customers?page=1&limit=3', j => !!j.data],
    ['Products', '/products', j => !!j.data],
    ['Workflows', '/workflows', j => Array.isArray(j)],
    ['Analytics', '/analytics/metrics', j => j.income !== undefined],
    ['Onboarding', '/onboarding/config', j => !!j.name],
    ['Contracts', '/contracts', j => !!j.data],
    ['Suppliers', '/suppliers', j => !!j.data],
    ['Reports', '/reports', j => !!j.items],
    ['LGPD', '/lgpd/consent/customer-1', j => Array.isArray(j)],
    ['Payment Stats', '/payment/stats', j => j.totalConfirmed !== undefined],
  ];

  const orgId = me.organizationId;
  if (orgId) {
    const stats = await get('/organizations/' + orgId + '/stats', token);
    ck('Org Stats', !!stats.users, `users=${stats.users} products=${stats.products}`);
  }

  for (const [name, path, check] of tests) {
    try {
      const result = await get(path, token);
      ck(name, check(result), '');
    } catch(e) {
      ck(name, false, e.message);
    }
  }

  // Payment create
  try {
    const payment = await post('/payment', { method: 'PIX', amount: 42.50, description: 'Docker test', dueDate: '2026-08-01' });
    ck('Payment Create', !!payment.id, `status=${payment.status}`);
  } catch(e) { ck('Payment Create', false, e.message); }

  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
})();
