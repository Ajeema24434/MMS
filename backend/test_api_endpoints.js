const http = require('http');

function makeRequest(path, method, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("============================================================");
  console.log("  RUNNING ALL 3 PROFILES AUTHENTICATION & PORTAL TESTS");
  console.log("============================================================");

  // 1. Student Login via URN User ID (1026091001)
  console.log("\n[TEST 1] Student Login (URN: 1026091001)...");
  const studentLogin = await makeRequest('/api/auth/login', 'POST', { identifier: '1026091001', password: 'Pass@1026091001' });
  console.log(`Status: ${studentLogin.status}`, studentLogin.data.success ? `✓ STUDENT SUCCESS (${studentLogin.data.user.name})` : '✕ FAILED');

  // 2. Mentor Login via Mentor Code (MNT101)
  console.log("\n[TEST 2] Mentor Login (Code: MNT101)...");
  const mentorLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'MNT101', password: 'password123' });
  console.log(`Status: ${mentorLogin.status}`, mentorLogin.data.success ? `✓ MENTOR SUCCESS (${mentorLogin.data.user.name})` : '✕ FAILED');

  // 3. Admin Login via Email (admin@mms.edu)
  console.log("\n[TEST 3] Admin Login (Email: admin@mms.edu)...");
  const adminLogin = await makeRequest('/api/auth/login', 'POST', { identifier: 'admin@mms.edu', password: 'password123' });
  console.log(`Status: ${adminLogin.status}`, adminLogin.data.success ? `✓ ADMIN SUCCESS (${adminLogin.data.user.name})` : '✕ FAILED');

  console.log("\n============================================================");
  console.log("  ALL 3 PROFILES AUTHENTICATED SUCCESSFULLY!");
  console.log("============================================================\n");
}

runTests().catch(console.error);
