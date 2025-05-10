const express = require("express");
const router = express.Router();

router.get("/", (_, res) => {
  res.sendFile(`${__dirname}/../public/status.html`);
});

router.get("/api/check", (_, res) => {
  res.status(200).json({ message: "Hello, world!" });
});

module.exports = router;