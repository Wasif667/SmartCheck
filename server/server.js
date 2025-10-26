// ----------------------------
// SmartCheck Server (Render-Ready, Fixed RapidCarCheck Nested Structure)
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
  res.json({
    ok: true,
    service: "SmartCheck API",
    time: new Date().toISOString(),
  });
});

// ----------------------------
// DVLA Basic Vehicle Check
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

    if (!response.ok) {
      const text = await response.text();
      console.error("DVLA API error:", text);
      return res.status(response.status).json({ error: "DVLA API error", details: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("DVLA fetch error:", error);
    res.status(500).json({
      error: "Server error fetching DVLA data",
      details: error.message,
    });
  }
});

// ----------------------------
// RapidCarCheck Full Vehicle Report (correctly handles nested data)
// ----------------------------
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const apiKey = process.env.RAPIDCARCHECK_KEY;
    const domain = "https://smartcheck-9o2u.onrender.com";
    const url = `https://www.rapidcarcheck.co.uk/api/?key=${apiKey}&pro=1&json=1&domain=${domain}&plate=${plate}`;

    const response = await fetch(url);
    const text = await response.text();

    // 👇 Log what RapidCarCheck returns for debugging
    console.log("🔍 RapidCarCheck raw response:", text.slice(0, 500));

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return res.status(500).json({
        error: "RapidCarCheck returned non-JSON data",
        details: clean.slice(0, 300),
      });
    }

    // Navigate into the correct nested structure
    const result = parsed?.data?.result || {};

    const v = result.vehicle_details?.vehicle_identification || {};
    const c = result.vehicle_details?.colour_details || {};
    const m = result.model_details?.model_data || {};
    const perf = result.model_details?.performance?.power || {};
    const torque = result.model_details?.performance?.torque || {};
    const fuel = result.model_details?.fuel_economy || {};
    const trans = result.model_details?.transmission || {};
    const body = result.model_details?.body_details || {};
    const emissions = result.model_details?.emissions || {};

    // Flattened object for frontend display
    const flattened = {
      registrationNumber:
        v.vehicle_registration_mark || plate,
      make:
        v.dvla_manufacturer_desc ||
        m.manufacturer_desc ||
        null,
      model:
        v.dvla_model_desc ||
        m.model_desc ||
        null,
      colour: c.colour || null,
      fuelType:
        v.dvla_fuel_desc ||
        m.ukvd_fuel_type_desc ||
        null,
      engineCapacity:
        v.engine_capacity_cc ||
        m.engine_capacity_cc ||
        null,
      transmission:
        trans.transmission_type || "N/A",
      powerBhp: perf.power_bhp || null,
      torqueNm: torque.torque_nm || null,
      topSpeedMph:
        result.model_details?.performance?.statistics?.top_speed_mph || null,
      co2: emissions.co2_gkm || null,
      mpg: fuel.combined_mpg || null,
      financeOwed: result.financeOwed || false,
      stolen: result.stolen || false,
      writeOff: result.writeOff || false,
      mileage: result.mileage || "N/A",
      motExpiryDate: result.motExpiryDate || null,
      bodyType: body.ukvd_body_type_desc || null,
      doors: body.number_doors || null,
      seats: body.number_seats || null,
    };

    res.json(flattened);
  } catch (error) {
    console.error("RapidCarCheck fetch error:", error);
    res.status(500).json({
      error: "Server error fetching RapidCarCheck data",
      details: error.message,
    });
  }
});

// ----------------------------
// Serve React Frontend
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

