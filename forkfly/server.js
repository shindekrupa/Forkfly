require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/owner", require("./routes/owner"));
app.use("/api/admin", require("./routes/admin"));

// serves the frontend (public/index.html)
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Server error" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () =>
    console.log("Forkfly running at http://localhost:" + (process.env.PORT || 5000))))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
