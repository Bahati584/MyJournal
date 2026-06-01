const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const ideaRoutes = require("./routes/ideas");
const outcomeRoutes = require("./routes/outcomes");
const summaryRoutes = require("./routes/summary");
const statsRoutes = require("./routes/stats");
const insightsRoutes = require("./routes/insights");
const tradesViewRoutes = require("./routes/tradesView");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ideas", ideaRoutes);
app.use("/api/outcomes", outcomeRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/trades-view", tradesViewRoutes);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Trading Journal API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});