const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const ideaRoutes = require("./routes/ideas");
const outcomeRoutes = require("./routes/outcomes");
const summaryRoutes = require("./routes/summary");
const app = express();
const statsRoutes = require("./routes/stats");


app.use(cors());
app.use(express.json());
app.use("/api/ideas", ideaRoutes);
app.use("/api/outcomes", outcomeRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.send("Trading Journal API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});