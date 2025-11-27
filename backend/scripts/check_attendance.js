const http = require('http');

// Simple helper for POST JSON
function postJson(url, path, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body || '{}');
          resolve({ statusCode: res.statusCode, body: parsedBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(JSON.stringify(data));
    req.end();
  });
}

// Simple helper for GET JSON
function getJson(url, path) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body || 'null');
          resolve({ statusCode: res.statusCode, body: parsedBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function run() {
  const base = process.env.ATTENDANCE_API_BASE || 'http://localhost:5000';
  const postPath = process.env.ATTENDANCE_POST_PATH || '/api/attendances';
  const getPath = process.env.ATTENDANCE_GET_PATH || '/api/attendances';
  const employeeId = process.env.TEST_EMPLOYEE_ID || '0085231178';

  console.log(`Testing attendance endpoints against ${base}`);
  try {
    console.log('POSTing clock-in/out for employeeId =', employeeId);
    const postRes = await postJson(base, postPath, { employeeId });
    console.log('POST response status:', postRes.statusCode);
    console.log('POST response body:', JSON.stringify(postRes.body, null, 2));

    console.log('\nFetching attendances (GET)');
    const getRes = await getJson(base, getPath);
    console.log('GET response status:', getRes.statusCode);
    if (Array.isArray(getRes.body)) {
      console.log(`GET returned ${getRes.body.length} record(s). Sample:`);
      console.log(JSON.stringify(getRes.body.slice(0, 5), null, 2));
      if (getRes.body.length === 0) process.exitCode = 2; // signal empty
    } else {
      console.log('GET response body:', JSON.stringify(getRes.body, null, 2));
      process.exitCode = 3; // unexpected
    }
  } catch (err) {
    console.error('Error testing attendance endpoints:', err);
    process.exitCode = 1;
  }
}

run();
