const DEFAULT_API_URL = 'https://staging.srvelectricals.in/api/v1';

const apiUrl = (process.env.STAGING_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const adminAccounts = [
  {
    label: 'Super Admin',
    role: 'super_admin',
    identifier: process.env.E2E_SUPER_ADMIN_IDENTIFIER || 'testsuper',
    password: process.env.E2E_SUPER_ADMIN_PASSWORD || 'testsuper@123',
  },
  {
    label: 'Admin',
    role: 'admin',
    identifier: process.env.E2E_ADMIN_IDENTIFIER || 'testadmin',
    password: process.env.E2E_ADMIN_PASSWORD || 'testadmin@123',
  },
  {
    label: 'Staff',
    role: 'staff',
    identifier: process.env.E2E_STAFF_IDENTIFIER || 'Soni@gmail.com',
    password: process.env.E2E_STAFF_PASSWORD || 'Soni@123',
  },
];

const mobileAccounts = [
  {
    label: 'Electrician',
    role: 'electrician',
    phone: process.env.E2E_ELECTRICIAN_PHONE || '6287268376',
    otp: process.env.E2E_MOBILE_OTP || '1234',
  },
  {
    label: 'Dealer',
    role: 'dealer',
    phone: process.env.E2E_DEALER_PHONE || '7009976900',
    otp: process.env.E2E_MOBILE_OTP || '1234',
  },
  {
    label: 'Customer',
    role: 'user',
    phone: process.env.E2E_CUSTOMER_PHONE || '1122334455',
    otp: process.env.E2E_MOBILE_OTP || '1234',
    password: process.env.E2E_CUSTOMER_PASSWORD || 'Manjeet@123',
  },
];

function normalizeError(body, fallback) {
  if (!body) return fallback;
  if (typeof body === 'string') return body;
  if (Array.isArray(body.message)) return body.message.join(', ');
  if (body.message) return String(body.message);
  if (body.error) return String(body.error);
  return fallback;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const error = new Error(normalizeError(body, response.statusText));
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function checkAdminLogin(account) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: account.identifier,
      password: account.password,
    }),
  });
  const actualRole = data?.admin?.role;
  if (!data?.accessToken) throw new Error('Missing access token');
  if (actualRole !== account.role) {
    throw new Error(`Expected role ${account.role}, got ${actualRole || 'empty'}`);
  }
  return {
    name: data.admin?.name,
    email: data.admin?.email,
    role: actualRole,
    token: data.accessToken,
  };
}

async function checkMobileOtp(account) {
  await request('/mobile/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone: account.phone,
      role: account.role,
    }),
  });
  const data = await request('/mobile/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone: account.phone,
      role: account.role,
      otp: account.otp,
    }),
  });
  if (!data?.accessToken) throw new Error('Missing mobile access token');
  return {
    name: data.user?.name,
    phone: data.user?.phone,
    status: data.user?.status,
    kycStatus: data.user?.kycStatus,
  };
}

async function checkMobilePassword(account) {
  if (!account.password) return null;
  const data = await request('/mobile/auth/password-login', {
    method: 'POST',
    body: JSON.stringify({
      phone: account.phone,
      role: account.role,
      password: account.password,
    }),
  });
  if (!data?.accessToken) throw new Error('Missing mobile access token');
  return {
    name: data.user?.name,
    phone: data.user?.phone,
    status: data.user?.status,
    kycStatus: data.user?.kycStatus,
  };
}

async function checkRoleRecord(token, account) {
  const endpointByRole = {
    electrician: '/electricians',
    dealer: '/dealers',
    user: '/app-users',
  };
  const endpoint = endpointByRole[account.role];
  if (!endpoint) return null;
  const data = await request(`${endpoint}?search=${encodeURIComponent(account.phone)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const matches = (data?.data || []).filter((item) => String(item.phone) === account.phone);
  if (matches.length === 0) throw new Error(`No ${account.label} record found for phone ${account.phone}`);
  return matches.map((item) => ({
    id: item.id,
    name: item.name,
    phone: item.phone,
    status: item.status,
    kycStatus: item.kycStatus,
  }));
}

async function runCheck(label, fn) {
  try {
    const data = await fn();
    return { label, ok: true, data };
  } catch (error) {
    return {
      label,
      ok: false,
      error: `[${error.status || 'ERR'}] ${error.message}`,
    };
  }
}

const results = [];

let superAdminToken = null;
for (const account of adminAccounts) {
  const result = await runCheck(`Admin login: ${account.label}`, () => checkAdminLogin(account));
  if (account.role === 'super_admin' && result.ok) superAdminToken = result.data.token;
  if (result.data?.token) delete result.data.token;
  results.push(result);
}

for (const account of mobileAccounts) {
  results.push(await runCheck(`Mobile OTP: ${account.label}`, () => checkMobileOtp(account)));
  if (account.password) {
    results.push(await runCheck(`Mobile password: ${account.label}`, () => checkMobilePassword(account)));
  }
}

if (superAdminToken) {
  for (const account of mobileAccounts) {
    results.push(await runCheck(`Role data: ${account.label}`, () => checkRoleRecord(superAdminToken, account)));
  }
}

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  const marker = result.ok ? 'PASS' : 'FAIL';
  console.log(`${marker} ${result.label}`);
  if (result.ok && result.data) console.log(`  ${JSON.stringify(result.data)}`);
  if (!result.ok) console.log(`  ${result.error}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} staging E2E check(s) failed.`);
  process.exit(1);
}

console.log('\nAll staging E2E checks passed.');
