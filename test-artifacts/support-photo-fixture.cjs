const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = {};
for (const raw of fs.readFileSync('C:\\Users\\dell\\Desktop\\ADMIN-BACKEND\\.env', 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const index = line.indexOf('=');
  if (index < 1) continue;
  env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
}
const client = new Client({ host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 5432), user: env.DB_USERNAME || 'postgres', password: env.DB_PASSWORD || '', database: env.DB_DATABASE || 'srv_admin' });
const subject = 'E2E attachment gallery verification';
const photos = [
  'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#2563eb"/><text x="100" y="68" text-anchor="middle" fill="white" font-size="24">Photo 1</text></svg>').toString('base64'),
  'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#16a34a"/><text x="100" y="68" text-anchor="middle" fill="white" font-size="24">Photo 2</text></svg>').toString('base64'),
  'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#7c3aed"/><text x="100" y="68" text-anchor="middle" fill="white" font-size="24">Photo 3</text></svg>').toString('base64'),
];
async function main() {
  await client.connect();
  await client.query('DELETE FROM support_tickets WHERE subject = $1', [subject]);
  if (process.argv[2] !== 'delete') {
    await client.query(`INSERT INTO support_tickets (id,"userName","userRole",subject,message,"photoUrl","photoUrls",status,priority,replies,"createdAt","updatedAt") VALUES (gen_random_uuid(),'E2E Test User','electrician',$1,'Verify that all three attachments are visible in the admin enquiry detail.',$2,$3,'open','medium','[]',NOW(),NOW())`, [subject, photos[0], photos]);
    console.log('Support photo fixture created');
  } else console.log('Support photo fixture removed');
  await client.end();
}
main().catch(async error => { console.error(error.message); try { await client.end(); } catch {} process.exitCode = 1; });
