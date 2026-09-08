require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true, message: "E-commerce API is running" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));

const frontend = path.join(__dirname, "../frontend");
app.use(express.static(frontend));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ message: "API route not found" });
  res.sendFile(path.join(frontend, "index.html"));
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Store running at http://localhost:${PORT}`)))
  .catch(err => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
