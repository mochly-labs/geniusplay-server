const { Server } = require("ws");
const { v4: uuidv4 } = require("uuid");

function setupWebSocket(server) {
  const wss = new Server({ server });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const uuid = uuidv4();
    console.log(`[WS] Client connected: ${clientIp} (UUID: ${uuid})`);

    ws.send(JSON.stringify({ type: "uuid", uuid }));

    const keepAliveInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "keepalive", message: "ping" }));
      }
    }, 30000);

    ws.on("message", (msg) => {
      console.log(`[WS] ${uuid} says:`, msg.toString());
    });

    ws.on("close", () => {
      console.log(`[WS] Client ${uuid} disconnected`);
      clearInterval(keepAliveInterval);
    });
  });
}

module.exports = { setupWebSocket };