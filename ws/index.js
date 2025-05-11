const { Server } = require("ws");
const { onConnection } = require("./handlers/onConnection");

function setupWebSocket(server) {
  const wss = new Server({ server });
  wss.on("connection", onConnection);
}

module.exports = { setupWebSocket };
