const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({ storage });

// Attach outcome to idea
router.post("/", upload.single("screenshot"), (req, res) => {
  const { idea_id, result_r } = req.body;

  // multer-storage-cloudinary puts the uploaded file's URL in req.file.path
  const screenshot_path = req.file ? req.file.path : null;

  const sql = `
    INSERT INTO trade_outcomes
    (idea_id, result_r, screenshot_path)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [idea_id, result_r, screenshot_path], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to attach outcome" });
    }

    res.json({
      message: "Outcome attached successfully",
    });
  });
});

module.exports = router;