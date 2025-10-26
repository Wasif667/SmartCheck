// ----------------------------
// SmartCheck Server
// ----------------------------

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// ----------------------------
// Health Check
// ----------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "SmartCheck API", time: new Date().toISOString() });
});

// ----------------------------
// DVLA Vehicle Check
// ----------------------------
app.get("/api/check/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const response = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DVLA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationNumber: plate }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DVLA API error:", text);
      res.status(response.status).json({ error: "DVLA API error", details: text });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("DVLA fetch error:", error);
    res.status(500).json({ error: "Server error fetching DVLA data", details: error.message });
  }
});

// ----------------------------
// RapidCarCheck Full Vehicle Report (Direct API)
// ----------------------------
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const apiKey = process.env.RAPIDCARCHECK_KEY;
    const domain = "https://smartcheck-9o2u.onrender.com"; // your Render domain
    const url = `https://www.rapidcarcheck.co.uk/api/?key=${apiKey}&pro=1&domain=${domain}&plate=${plate}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("RapidCarCheck API error:", text);
      res.status(response.status).json({
        error: "RapidCarCheck API error",
        details: text
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("RapidCarCheck fetch error:", error);
    res.status(500).json({
      error: "Server error fetching RapidCarCheck data",
      details: error.message
    });
  }
});

// ----------------------------
// Serve React Frontend (Production)
// ----------------------------
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ----------------------------
// Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`✅ SmartCheck server running on port ${PORT}`);
});
