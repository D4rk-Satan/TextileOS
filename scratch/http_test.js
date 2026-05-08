/**
 * HTTP-based UI route testing for TextileOS
 * Tests that all pages return 200 (or expected redirects)
 * and validates page content.
 */

const http = require('http');
const https = require('https');

const BASE = 'http://localhost:3000';
const results = [];
const pass = (name) => { results.push(`✅ ${name}`); };
const fail = (name, detail) => { results.push(`❌ ${name} — ${detail}`); };
const warn = (name, detail) => { results.push(`⚠️  ${name} — ${detail}`); };

function get(path, cookieStr = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Cookie': cookieStr,
        'User-Agent': 'TextileOS-Test/1.0',
      }
    };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function post(path, data, cookieStr = '') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Cookie': cookieStr,
        'User-Agent': 'TextileOS-Test/1.0',
      }
    };
    const req = http.request(opts, (res) => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: resBody }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function testRoute(label, path, { expectedStatus = 200, shouldContain = null, cookieStr = '', allowRedirect = false } = {}) {
  try {
    const res = await get(path, cookieStr);
    const statusOk = res.status === expectedStatus || (allowRedirect && [301,302,307,308].includes(res.status));
    const contentOk = !shouldContain || res.body.includes(shouldContain);
    
    if (statusOk && contentOk) {
      pass(`${label} — GET ${path} → ${res.status}`);
    } else if (!statusOk) {
      fail(`${label}`, `Expected ${expectedStatus}, got ${res.status} at ${path}`);
    } else {
      fail(`${label}`, `Page loaded (${res.status}) but missing content: "${shouldContain}"`);
    }
    return res;
  } catch (e) {
    fail(`${label}`, `Network error: ${e.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n====== TextileOS HTTP Route Test Suite ======\n');

  // ─── PUBLIC ROUTES ────────────────────────────────────────────────────────
  await testRoute('Login page loads', '/login', { shouldContain: 'TextileOS' });
  await testRoute('Signup page loads', '/signup', { shouldContain: 'TextileOS' });
  await testRoute('Root redirects', '/', { expectedStatus: 308, allowRedirect: true });

  // ─── PROTECTED ROUTES (unauthenticated → should redirect) ────────────────
  const dashRes = await testRoute('Dashboard redirects if unauthenticated', '/dashboard', { expectedStatus: 307, allowRedirect: true });
  if (dashRes && [307, 302, 301, 308].includes(dashRes.status)) {
    pass('Dashboard auth guard: redirects unauthenticated users');
  }

  const superAdminRes = await testRoute('SuperAdmin redirects if unauthenticated', '/superadmin', { expectedStatus: 307, allowRedirect: true });
  if (superAdminRes && [307, 302, 301, 308].includes(superAdminRes.status)) {
    pass('SuperAdmin auth guard: redirects unauthenticated users');
  }

  // ─── SIMULATE LOGIN (get session cookies) ─────────────────────────────────
  console.log('\n--- Simulating Login via Next.js Server Action ---');
  // Next.js server actions can't be called via raw HTTP POST like a REST API.
  // We test the login page form action path.
  const loginPageRes = await get('/login');
  if (loginPageRes && loginPageRes.status === 200) {
    pass('Login page accessible (status 200)');
  }

  // Test API-style: check if Next.js action endpoint returns anything useful
  // In Next.js 16 (App Router), actions go through POST to the page path
  const loginActionRes = await post('/login', { email: 'admin@testtextile.com', password: 'Admin@1234' });
  if (loginActionRes) {
    // Next.js returns 200 or redirect for form actions
    if ([200, 302, 307, 308].includes(loginActionRes.status)) {
      pass(`Login action endpoint responds — status ${loginActionRes.status}`);
    } else {
      warn('Login action endpoint', `Unexpected status ${loginActionRes.status}`);
    }
  }

  // ─── VERIFY KEY PAGES CONTAIN CORRECT CONTENT ────────────────────────────
  console.log('\n--- Checking page content ---');

  // Check that login page has the sign-in form
  const loginContent = await get('/login');
  if (loginContent && loginContent.body.includes('Sign in')) pass('Login page: "Sign in" text present');
  else fail('Login page content', 'Missing "Sign in" text');

  if (loginContent && loginContent.body.includes('Business Email')) pass('Login page: Email field present');
  else fail('Login page content', 'Missing email field');

  // Check signup page
  const signupContent = await get('/signup');
  if (signupContent && signupContent.body.includes('Sign up')) pass('Signup page: "Sign up" text present');
  else warn('Signup page content', 'Missing "Sign up" text (may be rendered client-side)');

  // ─── VERIFY SERVER IS RESPONDING FAST ────────────────────────────────────
  console.log('\n--- Performance checks ---');
  const start = Date.now();
  await get('/login');
  const elapsed = Date.now() - start;
  if (elapsed < 2000) pass(`Login page response time: ${elapsed}ms (< 2000ms)`);
  else warn('Login page performance', `Slow response: ${elapsed}ms`);

  // ─── CHECK NEXT.JS API ROUTES ─────────────────────────────────────────────
  // Check if there are any API routes
  const apiRes = await get('/api/health').catch(() => null);
  if (apiRes && apiRes.status === 200) pass('Health API endpoint exists');
  else warn('API Health endpoint', 'Not found — may not be implemented (OK)');

  // ─── FINAL REPORT ────────────────────────────────────────────────────────
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  const warned = results.filter(r => r.startsWith('⚠️')).length;
  
  console.log('\n======================================');
  console.log(`  HTTP ROUTE RESULTS: ${passed} PASSED, ${failed} FAILED, ${warned} WARNINGS`);
  console.log('======================================\n');
  results.forEach(r => console.log(r));
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
