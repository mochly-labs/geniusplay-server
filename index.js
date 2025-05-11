require("dotenv").config();
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const { setupWebSocket } = require("./ws");
const routes = require("./routes");
const path = require("path");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(morgan("combined"));
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

setupWebSocket(server);

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
