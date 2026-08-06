const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const backendDir = process.env.SRV_BACKEND_DIR
  ? path.resolve(process.env.SRV_BACKEND_DIR)
  : path.resolve(__dirname, '..', '..', 'srv-new-app-backend');
const base = 'http://127.0.0.1:3001/api/v1';

function loadEnv(file) {
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map(line => line.trim()).filter(line => line && !line.startsWith('#'))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
}

async function timed(name, url, token, options = {}, validate = () => true) {
  const started = Date.now();
  const response = await fetch(`${base}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  const durationMs = Date.now() - started;
  return {
    name,
    status: response.ok && validate(body) ? 'PASS' : 'FAIL',
    httpStatus: response.status,
    durationMs,
  };
}

async function main() {
  const env = loadEnv(path.join(backendDir, '.env'));
  const db = new Client({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME || 'postgres',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'srv_admin',
  });
  await db.connect();
  try {
    const admin = (await db.query(`SELECT id, email, role, COALESCE("tokenVersion", 0) AS "tokenVersion" FROM admins WHERE "isActive" = true ORDER BY "createdAt" LIMIT 1`)).rows[0];
    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, tokenVersion: Number(admin.tokenVersion) },
      env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    const inactiveProduct = (await db.query(`SELECT sku FROM products WHERE "isActive" = false AND sku IS NOT NULL LIMIT 1`)).rows[0];
    const qrCode = (await db.query(`SELECT code FROM qr_codes ORDER BY "createdAt" DESC LIMIT 1`)).rows[0];
    const setting = (await db.query(`SELECT key, value FROM settings ORDER BY key LIMIT 1`)).rows[0];

    const tests = [];
    tests.push(await timed('Admin product search', `/products?search=${encodeURIComponent(inactiveProduct.sku)}&limit=50`, token, {}, body =>
      Array.isArray(body?.data) && body.data.some(product => product.sku === inactiveProduct.sku)));
    tests.push(await timed('Hidden product excluded from mobile', `/mobile/products?search=${encodeURIComponent(inactiveProduct.sku)}`, token, {}, body =>
      Array.isArray(body?.data) && !body.data.some(product => product.sku === inactiveProduct.sku)));
    tests.push(await timed('QR hub summary', '/qr-codes/hub?page=1&limit=25', token, {}, body =>
      Array.isArray(body?.data) && Number.isFinite(Number(body?.total))));
    tests.push(await timed('Optimized QR list', '/qr-codes?page=1&limit=50&includeDetails=false', token, {}, body =>
      Array.isArray(body?.data)));
    tests.push(await timed('QR scanner lookup', '/qr-codes/scan-lookup', token, {
      method: 'POST',
      body: JSON.stringify({ qrCode: qrCode.code }),
    }, body => Boolean(body)));
    tests.push(await timed('Sub-dealers dealer-equivalent response', '/dealers/sub-dealers?page=1&limit=25', token, {}, body =>
      Array.isArray(body?.data) && body.data.every(item => item.effectiveRole === 'dealer')));
    tests.push(await timed('Atomic app settings save', '/settings/bulk', token, {
      method: 'PUT',
      body: JSON.stringify({ settings: { [setting.key]: setting.value } }),
    }, body => body?.message === 'App settings saved successfully' && body?.updated === 1));

    const summary = {
      total: tests.length,
      passed: tests.filter(test => test.status === 'PASS').length,
      failed: tests.filter(test => test.status === 'FAIL').length,
      tests,
    };
    fs.writeFileSync(path.join(__dirname, 'feature-regression-results.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (summary.failed) process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
