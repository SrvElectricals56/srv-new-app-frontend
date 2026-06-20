const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const backendDir = 'C:\\Users\\dell\\Desktop\\ADMIN-BACKEND';
const outputPath = path.join(__dirname, 'e2e-results.json');
const base = 'http://127.0.0.1:3001';

function loadEnv(file) {
  const env = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[line.slice(0, index).trim()] = value;
  }
  return env;
}

const env = loadEnv(path.join(backendDir, '.env'));
const db = new Client({
  host: env.DB_HOST || 'localhost',
  port: Number(env.DB_PORT || 5432),
  user: env.DB_USERNAME || 'postgres',
  password: env.DB_PASSWORD || '',
  database: env.DB_DATABASE || 'srv_admin',
});
const tests = [];
const findings = [];

function record(module, name, status, details, durationMs = null) {
  tests.push({ id: `TC-${String(tests.length + 1).padStart(3, '0')}`, module, name, status, details, durationMs });
}

async function request(module, name, url, options = {}, validate = null) {
  const started = Date.now();
  try {
    const response = await fetch(`${base}${url}`, options);
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    const valid = response.ok && (!validate || validate(body, response));
    record(module, name, valid ? 'PASS' : 'FAIL', `HTTP ${response.status}${valid ? '' : `; response did not meet validation`}`, Date.now() - started);
    return { response, body, valid };
  } catch (error) {
    record(module, name, 'FAIL', error.message, Date.now() - started);
    return { response: null, body: null, valid: false };
  }
}

function auth(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function firstUser(table) {
  const result = await db.query(`SELECT id, phone, COALESCE("tokenVersion", 0) AS "tokenVersion" FROM ${table} WHERE COALESCE(status::text, 'active') <> 'suspended' AND phone IS NOT NULL ORDER BY id LIMIT 1`);
  return result.rows[0];
}

async function main() {
  await db.connect();
  try {
    await request('Platform', 'Backend health endpoint', '/health', {}, body => body?.status === 'ok');
    const swaggerResult = await request('Platform', 'OpenAPI specification available', '/api/docs-json', {}, body => Object.keys(body?.paths || {}).length >= 150);

    const publicCases = [
      ['Catalog', 'Active product catalog', '/api/v1/mobile/products', body => Array.isArray(body?.data) && body.data.length > 0],
      ['Catalog', 'Product category catalog', '/api/v1/mobile/products/categories', body => Array.isArray(body?.data ?? body) && (body?.data ?? body).length > 0],
      ['Content', 'Mobile banners', '/api/v1/mobile/banners', body => Array.isArray(body?.data ?? body)],
      ['Settings', 'Maintenance configuration', '/api/v1/mobile/settings/maintenance', body => !!body],
      ['Settings', 'Application settings', '/api/v1/mobile/app-settings', body => !!body],
      ['Marketing', 'Offers feed', '/api/v1/mobile/offers', body => Array.isArray(body?.data ?? body)],
      ['Content', 'Testimonials feed', '/api/v1/mobile/testimonials', body => Array.isArray(body?.data ?? body)],
      ['Rewards', 'Gift product catalog', '/api/v1/mobile/gift-products', body => Array.isArray(body?.data ?? body)],
      ['Rewards', 'Reward schemes', '/api/v1/mobile/reward-schemes', body => Array.isArray(body?.data ?? body)],
      ['Content', 'Festival theme endpoint', '/api/v1/mobile/festival/theme', body => !!body],
    ];
    for (const item of publicCases) await request(...item);

    const roleTables = { electrician: 'electricians', dealer: 'dealers', user: 'app_users', counterboy: 'counterboys' };
    const mobileTokens = {};
    const mobileUsers = {};
    for (const [role, table] of Object.entries(roleTables)) {
      const user = await firstUser(table);
      mobileUsers[role] = user;
      if (!user) {
        record('Authentication', `${role} test identity exists`, 'BLOCKED', `No active ${role} identity available`);
        continue;
      }
      const token = jwt.sign({ sub: user.id, phone: user.phone, role, tokenVersion: Number(user.tokenVersion || 0) }, env.JWT_SECRET, { expiresIn: '30m' });
      mobileTokens[role] = token;
      const headers = auth(token);
      await request('Authentication', `${role} profile authorization`, '/api/v1/mobile/auth/profile', { headers }, body => body?.id === user.id);
      const roleCases = [
        ['Notifications', `${role} notification inbox`, '/api/v1/mobile/notifications'],
        ['Support', `${role} support ticket history`, '/api/v1/mobile/support/tickets'],
        ['Orders', `${role} product order history`, '/api/v1/mobile/profile/orders'],
        ['Profile', `${role} profile QR`, '/api/v1/mobile/profile/qr-code'],
        ['Wallet', `${role} wallet summary`, '/api/v1/mobile/wallet'],
        ['QR & Rewards', `${role} scan history`, '/api/v1/mobile/scan-history'],
        ['Rewards', `${role} redemption history`, '/api/v1/mobile/redemptions'],
        ['Referral', `${role} referral details`, '/api/v1/mobile/referral'],
        ['Feedback', `${role} app rating endpoint`, '/api/v1/mobile/rating'],
        ['Media', `${role} plays feed`, '/api/v1/mobile/plays'],
        ['Cart', `${role} cart endpoint`, '/api/v1/mobile/cart'],
      ];
      for (const [module, name, url] of roleCases) await request(module, name, url, { headers });
    }

    const adminResult = await db.query(`SELECT id, email, role, name, COALESCE("tokenVersion", 0) AS "tokenVersion" FROM admins WHERE "isActive" = true ORDER BY CASE WHEN role::text ILIKE '%super%' THEN 0 ELSE 1 END, "createdAt" LIMIT 1`);
    const admin = adminResult.rows[0];
    let adminToken = null;
    if (admin) {
      adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role, tokenVersion: Number(admin.tokenVersion || 0) }, env.JWT_SECRET, { expiresIn: '30m' });
      await request('Admin Authentication', 'Admin profile authorization', '/api/v1/auth/profile', { headers: auth(adminToken) }, body => body?.id === admin.id || body?.admin?.id === admin.id);
    } else {
      record('Admin Authentication', 'Active admin test identity exists', 'BLOCKED', 'No active administrator available');
    }

    const supportUser = mobileUsers.electrician || mobileUsers.user || mobileUsers.dealer || mobileUsers.counterboy;
    const supportRole = mobileUsers.electrician ? 'electrician' : mobileUsers.user ? 'user' : mobileUsers.dealer ? 'dealer' : 'counterboy';
    const supportToken = mobileTokens[supportRole];
    let createdTicketId = null;
    if (supportUser && supportToken) {
      await db.query(`DELETE FROM support_tickets WHERE subject = 'Automated E2E multi-photo test'`);
      const imagePayloads = [115, 116, 117].map(byte => `data:image/jpeg;base64,${Buffer.alloc(260000, byte).toString('base64')}`);
      const ticket = await request('Support', 'Create support query with three realistic-size photos', '/api/v1/mobile/support', {
        method: 'POST', headers: auth(supportToken), body: JSON.stringify({
          subject: 'Automated E2E multi-photo test',
          comment: 'Temporary ticket generated by the deployment readiness suite.',
          photoUrl: imagePayloads[0],
          photoUrls: imagePayloads,
        }),
      }, body => !!body?.ticketId);
      createdTicketId = ticket.body?.ticketId;
      if (createdTicketId) {
        const stored = await db.query(`SELECT cardinality("photoUrls") AS count FROM support_tickets WHERE id = $1`, [createdTicketId]);
        record('Support', 'Database preserves every uploaded support photo', Number(stored.rows[0]?.count) === 3 ? 'PASS' : 'FAIL', `Stored photo count: ${stored.rows[0]?.count ?? 0}`);
        if (adminToken) {
          await request('Support', 'Admin support API returns all ticket photos', `/api/v1/support/tickets/${createdTicketId}`, { headers: auth(adminToken) }, body => Array.isArray(body?.photoUrls) && body.photoUrls.length === 3);
        }
      }
    }

    if (adminToken && swaggerResult.body?.paths) {
      const safeGets = [];
      for (const [url, methods] of Object.entries(swaggerResult.body.paths)) {
        const operation = methods.get;
        if (!operation || url.includes('{') || url.includes('/mobile/') || url.includes('/api/docs')) continue;
        const requiredQuery = (operation.parameters || []).some(parameter => parameter.in === 'query' && parameter.required);
        if (!requiredQuery) safeGets.push([url, operation.summary || `GET ${url}`]);
      }
      for (const [url, summary] of safeGets) {
        await request('Admin API Regression', summary, url, { headers: auth(adminToken) });
      }
    }

    const integrityQueries = [
      ['Catalog', 'Active products available', `SELECT COUNT(*)::int AS value FROM products WHERE "isActive" = true`, value => value > 0],
      ['Catalog', 'Active products have names', `SELECT COUNT(*)::int AS value FROM products WHERE "isActive" = true AND (name IS NULL OR btrim(name) = '')`, value => value === 0],
      ['Catalog', 'Active products have unique SKU values', `SELECT COUNT(*)::int AS value FROM (SELECT sku FROM products WHERE "isActive" = true AND sku IS NOT NULL GROUP BY sku HAVING COUNT(*) > 1) d`, value => value === 0],
      ['Catalog', 'Active products have valid nonnegative prices', `SELECT COUNT(*)::int AS value FROM products WHERE "isActive" = true AND COALESCE(price, 0) < 0`, value => value === 0],
      ['Catalog', 'Active products are in stock', `SELECT COUNT(*)::int AS value FROM products WHERE "isActive" = true AND COALESCE(stock, 0) <= 0`, value => value === 0],
      ['Content', 'Active banners have image references', `SELECT COUNT(*)::int AS value FROM banners WHERE "isActive" = true AND ("imageUrl" IS NULL OR btrim("imageUrl") = '')`, value => value === 0],
      ['QR & Rewards', 'QR inventory exists', `SELECT COUNT(*)::int AS value FROM qr_codes`, value => value > 0],
      ['Orders', 'Product orders exist for workflow validation', `SELECT COUNT(*)::int AS value FROM product_orders`, value => value > 0],
    ];
    for (const [module, name, sql, validate] of integrityQueries) {
      try {
        const result = await db.query(sql);
        const value = Number(result.rows[0]?.value || 0);
        const passed = validate(value);
        record(`${module} Data Integrity`, name, passed ? 'PASS' : 'FAIL', `Database count: ${value}`);
        if (!passed) findings.push({ module, name, value, severity: name.includes('in stock') ? 'HIGH' : 'MEDIUM' });
      } catch (error) {
        record(`${module} Data Integrity`, name, 'FAIL', error.message);
      }
    }

    const productSummary = await db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "isActive")::int AS active, COUNT(*) FILTER (WHERE "isActive" AND COALESCE(stock,0) <= 0)::int AS zero_stock FROM products`);
    const categorySummary = await db.query(`SELECT COUNT(*)::int AS total FROM product_categories`);
    const bannerSummary = await db.query(`SELECT COUNT(*)::int AS total FROM banners WHERE "isActive" = true`);
    const qrSummary = await db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "isScanned" = true)::int AS scanned FROM qr_codes`);

    if (createdTicketId) await db.query(`DELETE FROM support_tickets WHERE id = $1`, [createdTicketId]);

    const summary = {
      executedAt: new Date().toISOString(),
      environment: 'Local development backend with live project database',
      total: tests.length,
      passed: tests.filter(test => test.status === 'PASS').length,
      failed: tests.filter(test => test.status === 'FAIL').length,
      blocked: tests.filter(test => test.status === 'BLOCKED').length,
      catalog: {
        productsTotal: productSummary.rows[0].total,
        productsActive: productSummary.rows[0].active,
        activeZeroStock: productSummary.rows[0].zero_stock,
        categories: categorySummary.rows[0].total,
        activeBanners: bannerSummary.rows[0].total,
        qrTotal: qrSummary.rows[0].total,
        qrScanned: qrSummary.rows[0].scanned,
      },
    };
    fs.writeFileSync(outputPath, JSON.stringify({ summary, findings, tests }, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
