const http = require('http');

const data = JSON.stringify({
  email: "debug@test.com",
  password: "testpass123"
});

const options = {
  hostname: 'localhost',
  port: 8788,
  path: '/api/auth/register-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();

setTimeout(() => process.exit(0), 3000);
