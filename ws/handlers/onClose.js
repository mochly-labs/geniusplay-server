function onClose(uuid, keepAliveInterval) {
  clearInterval(keepAliveInterval);
  console.log(`[WS] Client ${uuid} disconnected`);
}

module.exports = { onClose };
