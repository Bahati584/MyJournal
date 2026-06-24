require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const UPLOADS_DIR = path.join(__dirname, "uploads");

function uploadToCloudinary(localFilename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOADS_DIR, localFilename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found, skipping: ${localFilename}`);
      return resolve(null);
    }
    cloudinary.uploader.upload(
      filePath,
      { folder: "myjournal-screenshots" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
  });
}

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function migrateScreenshots() {
  db.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);
      process.exit(1);
    }
    runMigration();
  });
}

async function runMigration() {
  try {
    console.log("Fetching trade_ideas with local screenshots...");
    const ideas = await queryAsync(
      "SELECT id, before_screenshot FROM trade_ideas WHERE before_screenshot IS NOT NULL"
    );

    for (const idea of ideas) {
      const filename = path.basename(idea.before_screenshot);
      console.log(`Uploading idea #${idea.id} screenshot: ${filename}`);
      const url = await uploadToCloudinary(filename);
      if (url) {
        await queryAsync("UPDATE trade_ideas SET before_screenshot = ? WHERE id = ?", [url, idea.id]);
        console.log(`  -> Updated idea #${idea.id} to ${url}`);
      }
    }

    console.log("\nFetching trade_outcomes with local screenshots...");
    const outcomes = await queryAsync(
      "SELECT id, screenshot_path FROM trade_outcomes WHERE screenshot_path IS NOT NULL"
    );

    for (const outcome of outcomes) {
      const filename = path.basename(outcome.screenshot_path);
      console.log(`Uploading outcome #${outcome.id} screenshot: ${filename}`);
      const url = await uploadToCloudinary(filename);
      if (url) {
        await queryAsync("UPDATE trade_outcomes SET screenshot_path = ? WHERE id = ?", [url, outcome.id]);
        console.log(`  -> Updated outcome #${outcome.id} to ${url}`);
      }
    }

    console.log("\n✅ Migration complete!");
    db.end();
  } catch (err) {
    console.error("Migration failed:", err);
    db.end();
    process.exit(1);
  }
}

migrateScreenshots();