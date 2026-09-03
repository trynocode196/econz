const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  try {
    console.log("Querying DB status...");
    const status = await makeRequest('http://localhost:5000/api/db-status');
    console.log("DB status response:", status.body);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
