// ----------------------------
// SmartCheck Server (DVLA + OneAutoAPI Integration)
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
// ✅ DVLA Simple Check
// ----------------------------
app.get("/api/check/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  try {
    const response = await fetch(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.DVLA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber: plate }),
      }
    );

    const text = await response.text();
    if (!response.ok) {
      console.error("DVLA API error:", text);
      return res.status(response.status).json({ error: "DVLA API error", details: text });
    }

    const data = JSON.parse(text);

    const cleaned = {
      registration: data.registrationNumber || plate,
      make: data.make || null,
      model: data.model || null,
      colour: data.colour || null,
      fuelType: data.fuelType || null,
      engineSize: data.engineCapacity || null,
      transmission: data.transmission || null,
      bodyType: data.bodyType || null,
      yearOfManufacture: data.yearOfManufacture || null,
      co2Emissions: data.co2Emissions || null,
      taxDueDate: data.taxDueDate || null,
      taxStatus: data.taxStatus || null,
      motStatus: data.motStatus || null,
      motExpiryDate: data.motExpiryDate || null,
      dateOfLastV5CIssued: data.dateOfLastV5CIssued || null,
    };

    res.json(cleaned);
  } catch (error) {
    console.error("DVLA fetch error:", error);
    res.status(500).json({ error: "Server error fetching DVLA data", details: error.message });
  }
});

// ----------------------------
// ⚡ OneAutoAPI Premium Check
// ----------------------------
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const apiKey = process.env.ONEAUTO_API_KEY;

  try {
    const response = await fetch(
      `https://api.oneautoapi.co.uk/vehicle?registration=${plate}`,
      {
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    const text = await response.text();
    console.log("🔍 OneAutoAPI raw response:", text.slice(0, 400));

    if (!response.ok) {
      return res.status(response.status).json({ error: "OneAutoAPI error", details: text });
    }

    const data = JSON.parse(text);

    // 🧩 Map and clean output
    const v = data.vehicle || {};
    const tax = data.tax || {};
    const mot = data.mot || {};
    const tech = data.technical || {};
    const perf = data.performance || {};
    const dims = data.dimensions || {};
    const history = data.history || {};

    const grouped = {
      summary: {
        registration: v.registration || plate,
        make: v.make || "N/A",
        model: v.model || "N/A",
        colour: v.colour || "N/A",
        fuelType: v.fuelType || "N/A",
        engineSize: v.engineSize || "N/A",
        transmission: v.transmission || "N/A",
        bodyType: v.bodyType || "N/A",
        yearOfManufacture: v.yearOfManufacture || "N/A",
        co2Emissions: tech.co2Emissions || "N/A",
        taxStatus: tax.status || "N/A",
        motStatus: mot.status || "N/A",
        motExpiry: mot.expiryDate || "N/A",
      },

      technical: {
        vin: tech.vin || "N/A",
        powerBhp: perf.powerBhp || "N/A",
        torqueNm: perf.torqueNm || "N/A",
        topSpeedMph: perf.topSpeedMph || "N/A",
        acceleration: perf.zeroToSixty || "N/A",
        weightKg: tech.weight || "N/A",
        lengthMm: dims.length || "N/A",
        widthMm: dims.width || "N/A",
        heightMm: dims.height || "N/A",
      },

      history: {
        previousKeepers: history.previousKeepers || "N/A",
        plateChanges: history.plateChanges || "N/A",
        writeOff: history.writeOff || false,
        finance: history.financeOwed || false,
        stolen: history.stolen || false,
        mileage: history.mileage || "N/A",
      },
    };

    res.json(grouped);
  } catch (error) {
    console.error("OneAutoAPI fetch error:", error);
    res.status(500).json({
      error: "Server error fetching OneAutoAPI data",
      details: error.message,
    });
  }
});

// ----------------------------
// Serve Frontend
// ----------------------------
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT, () => console.log(`✅ SmartCheck running on port ${PORT}`));

