function sendKeepAlive(ws) {
  return setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "keepalive", message: "ping" }));
    }
  }, 30000);
}

module.exports = { sendKeepAlive };