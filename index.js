const express = require('express');
const http = require('http');
const { Server } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Status</title>
      <style>
        body {
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #1e1e1e;
          color: #bb86fc;
          font-family: Arial, sans-serif;
          font-size: 24px;
        }
      </style>
    </head>
    <body>
      <div>The service is running</div>
    </body>
    </html>
  `);
});

app.get('/api/check', (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
});

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`Client connected from IP: ${clientIp}`);

  const uuid = uuidv4();
  console.log(`Generated UUID for client: ${uuid}`);
  ws.send(JSON.stringify({ type: 'uuid', uuid }));

  const keepAliveInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      console.log(`Sending keepalive to client ${uuid}`);
      ws.send(JSON.stringify({ type: 'keepalive', message: 'ping' }));
    }
  }, 30000);

  ws.on('message', (message) => {
    console.log(`Received from client ${uuid}:`, message);
  });

  ws.on('close', () => {
    console.log(`Client ${uuid} disconnected`);
    clearInterval(keepAliveInterval);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});