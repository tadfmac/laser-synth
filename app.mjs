import http from 'http';
import express from 'express';

const LISTEN_IP = "127.0.0.1";
const LISTEN_PORT = 3000;

let webServer;
let app;

await runExpressApp();
await runWebServer();

async function runExpressApp() {
  app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ extended: true }));
  app.use('/',express.static("./www"));
}

async function runWebServer() {
  webServer = http.createServer(app);
  webServer.on('error', (err) => {
    console.error('starting web server failed:', err.message);
  });

  await new Promise((resolve) => {
    webServer.listen(LISTEN_PORT, () => {
      console.log('server is running PORT:'+LISTEN_PORT);
      resolve();
    });
  });
}
