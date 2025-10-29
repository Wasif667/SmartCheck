// ==========================================================
// SmartCheck - Vehicle Check Backend
// Supports: DVLA, OneAutoAPI (Full Check), and MOT History
// ==========================================================

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// For serving frontend files on Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================================
// 1️⃣ DVLA SIMPLE CHECK (basic vehicle data)
// ==========================================================
app.get("/api/check/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const DVLA_API_KEY = process.env.DVLA_API_KEY;

  try {
    const response = await fetch(
      `https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`,
      {
        method: "POST",
        headers: {
          "x-api-key": DVLA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber: plate }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("DVLA API error:", data);
      return res
        .status(response.status)
        .json({ error: "DVLA API error", details: data });
    }

    console.log(`✅ DVLA data fetched for ${plate}`);
    res.json(data);
  } catch (error) {
    console.error("DVLA fetch error:", error);
    res.status(500).json({ error: "Server error fetching DVLA data" });
  }
});

// ==========================================================
// 2️⃣ FULL VEHICLE CHECK (OneAutoAPI)
// ==========================================================
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const ONEAUTO_KEY = process.env.ONEAUTO_API_KEY;

  try {
    const url = `https://api.oneautoapi.com/experian/autocheck/v3?vehicle_registration_mark=${plate}`;
    const response = await fetch(url, {
      headers: { "x-api-key": ONEAUTO_KEY },
    });

    const text = await response.text();
    console.log("OneAutoAPI raw response:", text);

    const data = JSON.parse(text);
    if (!response.ok || !data.success) {
      console.error("❌ OneAutoAPI error:", data);
      return res
        .status(response.status)
        .json({ error: "OneAutoAPI error", details: data });
    }

    console.log(`✅ Full vehicle check complete for ${plate}`);
    res.json(data.result || data);
  } catch (error) {
    console.error("OneAutoAPI fetch error:", error);
    res
      .status(500)
      .json({ error: "Server error fetching OneAutoAPI data", details: error });
  }
});

// ==========================================================
// 3️⃣ MOT HISTORY CHECK
// ==========================================================
app.get("/api/mot/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const MOT_API_KEY = process.env.MOT_API_KEY;

  try {
    const response = await fetch(
      `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${plate}`,
      {
        headers: {
          "x-api-key": MOT_API_KEY,
          Accept: "application/json+v6",
        },
      }
    );

    const text = await response.text();
    console.log("MOT API raw response:", text);

    if (!response.ok) {
      console.error("❌ MOT API error:", text);
      return res
        .status(response.status)
        .json({ error: "MOT API failed", details: text });
    }

    const data = JSON.parse(text);
    console.log(`✅ MOT data fetched for ${plate}`);
    res.json(data);
  } catch (error) {
    console.error("MOT fetch error:", error);
    res.status(500).json({ error: "Server error fetching MOT history" });
  }
});

// ==========================================================
// Serve Frontend (React build)
// ==========================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================================
// Start Server
// ==========================================================
app.listen(PORT, () => {
  console.log(`🚀 SmartCheck backend running on port ${PORT}`);
});

