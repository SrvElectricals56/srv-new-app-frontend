const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const backendDir = 'C:\\Users\\dell\\Desktop\\ADMIN-BACKEND';
const env = {};
for (const raw of fs.readFileSync(path.join(backendDir, '.env'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const index = line.indexOf('=');
  if (index < 1) continue;
  let value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  env[line.slice(0, index).trim()] = value;
}

const client = new Client({ host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 5432), user: env.DB_USERNAME || 'postgres', password: env.DB_PASSWORD || '', database: env.DB_DATABASE || 'srv_admin' });
const email = 'codex.e2e@srvelectricals.test';

async function main() {
  await client.connect();
  if (process.argv[2] === 'delete') {
    await client.query('DELETE FROM admins WHERE email = $1', [email]);
    console.log('Temporary administrator removed');
  } else {
    const hash = await bcrypt.hash('E2E-Test-2026!', 10);
    await client.query(`DELETE FROM admins WHERE email = $1`, [email]);
    await client.query(`INSERT INTO admins (id,email,password,name,role,"isActive","tokenVersion","createdAt","updatedAt") VALUES (gen_random_uuid(),$1,$2,'E2E Test Administrator','super_admin',true,0,NOW(),NOW())`, [email, hash]);
    console.log('Temporary administrator created');
  }
  await client.end();
}
main().catch(async error => { console.error(error.message); try { await client.end(); } catch {} process.exitCode = 1; });
