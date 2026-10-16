import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const certificatePath = process.argv[2];
const packageName = process.argv[3] || 'com.srvelectricals.app';

if (!certificatePath || !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName)) {
  console.error('Usage: node scripts/compute-sms-app-hash.mjs <deployment_cert.der> [package.name]');
  process.exitCode = 1;
} else {
  const certificateHex = readFileSync(certificatePath).toString('hex');
  const appHash = createHash('sha256')
    .update(`${packageName} ${certificateHex}`, 'utf8')
    .digest('base64')
    .slice(0, 11);
  console.log(appHash);
}
