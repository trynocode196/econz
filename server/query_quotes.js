const http = require('http');

function postRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const data = JSON.stringify(payload);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

function getRequest(url, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function run() {
  try {
    console.log("Logging in...");
    const loginRes = await postRequest('http://localhost:5000/api/auth/login', {
      email: 'admin@econz.cloud',
      password: 'password'
    });
    console.log("Login Status:", loginRes.statusCode);
    console.log("Login Body:", loginRes.body);

    const loginData = JSON.parse(loginRes.body);
    if (!loginData.token) {
      console.error("Login failed, no token returned");
      return;
    }

    console.log("Fetching quotes...");
    const quotesRes = await getRequest('http://localhost:5000/api/quotes', loginData.token);
    console.log("Quotes Status:", quotesRes.statusCode);
    console.log("Quotes Body:", quotesRes.body);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
