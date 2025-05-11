const { v4: uuidv4 } = require("uuid");
const { getClientIp } = require("../utils/getClientIp.js");
const { onMessage } = require("./onMessage");
const { onClose } = require("./onClose");
const { sendKeepAlive } = require("./sendKeepAlive");
const auth = require("../utils/auth");
const { getPrettyVersion } = require("../utils/github");
async function onConnection(ws, req) {
  const remoteip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const uuid = uuidv4();
  auth.setIp(uuid, remoteip);

  const clientIp = getClientIp(req);

  console.log(`[WS] Client connected: ${clientIp} (UUID: ${uuid})`);
  ws.send(JSON.stringify({ type: "uuid", uuid }));
  

  const keepAliveInterval = sendKeepAlive(ws);

  ws.on("message", (msg) => onMessage(ws, uuid, msg));
  ws.on("close", () => onClose(uuid, keepAliveInterval));
  
  ws.send(
    JSON.stringify({
      type: "version",
      version: await getPrettyVersion(),
    })
  );
}

module.exports = { onConnection };
