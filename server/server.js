// ----------------------------
// SmartCheck Server (DVLA + RapidCarCheck, Fully Fixed)
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
// ✅ Simple DVLA Vehicle Check
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
    res.status(500).json({
      error: "Server error fetching DVLA data",
      details: error.message,
    });
  }
});

// ----------------------------
// ⚡ RapidCarCheck - Full Vehicle Check (Flexible Parsing)
// ----------------------------
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const apiKey = process.env.RAPIDCARCHECK_KEY;
    const domain = "https://smartcheck-9o2u.onrender.com";
    const url = `https://www.rapidcarcheck.co.uk/api/?key=${apiKey}&pro=1&json=1&domain=${domain}&plate=${plate}`;

    const response = await fetch(url);
    const text = await response.text();

    console.log("🔍 RapidCarCheck raw:", text.slice(0, 500));

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

    const result = parsed?.data?.result || {};
    const v = result.vehicle_details?.vehicle_identification || {};
    const c = result.vehicle_details?.colour_details || {};
    const m = result.model_details?.model_data || {};
    const perf = result.model_details?.performance || {};
    const fuel = result.model_details?.fuel_economy || {};
    const body = result.model_details?.body_details || {};
    const emissions = result.model_details?.emissions || {};
    const weights = result.model_details?.weights || {};
    const dims = result.model_details?.dimensions || {};
    const trans = result.model_details?.transmission || {};
    const keepers = result.vehicle_details?.keeper_change_list || [];
    const plates = result.vehicle_details?.plate_change_list || [];

    // 🧹 Clean and format output — ensures consistent key/value pairs
    const grouped = {
      summary: {
        registration: v.vehicle_registration_mark || plate,
        make: v.dvla_manufacturer_desc || m.manufacturer_desc || "N/A",
        model: v.dvla_model_desc || m.model_desc || "N/A",
        colour: c.colour || "N/A",
        fuelType: v.dvla_fuel_desc || m.ukvd_fuel_type_desc || "N/A",
        engineSize: v.engine_capacity_cc || m.engine_capacity_cc || "N/A",
        transmission: trans.transmission_type || "N/A",
        co2: emissions.co2_gkm || "N/A",
        mpg: fuel.combined_mpg || "N/A",
        doors: body.number_doors || "N/A",
        seats: body.number_seats || "N/A",
      },

      history: {
        financeOwed:
          result.finance_details?.is_finance_active ||
          result.financeOwed ||
          false,
        stolen:
          result.stolen_details?.is_stolen ||
          result.is_stolen ||
          false,
        writeOff:
          result.insurance_writeoff_details?.is_writeoff ||
          result.writeOff ||
          false,
        mileage:
          result.mileage || result.odometer_reading || "N/A",
        previousKeepers: Array.isArray(keepers)
          ? keepers.map((k) => ({
              number: k.number_previous_keepers,
              date: k.date_of_last_keeper_change,
            }))
          : [],
        plateChanges: Array.isArray(plates)
          ? plates.map((p) => ({
              from: p.previous_vehicle_registration_mark,
              to: p.current_vehicle_registration_mark,
              date: p.cherished_plate_transfer_date,
            }))
          : [],
      },

      performance: {
        powerBhp: perf?.power?.power_bhp || "N/A",
        torqueNm: perf?.torque?.torque_nm || "N/A",
        topSpeedMph: perf?.statistics?.top_speed_mph || "N/A",
        acceleration: perf?.statistics?.["0to60_mph"] || "N/A",
      },

      technical: {
        vin: v.vehicle_identification_number || "N/A",
        engineNumber: v.engine_number || "N/A",
        bodyType: body.ukvd_body_type_desc || "N/A",
        wheelplan: v.dvla_wheelplan || "N/A",
        length: dims.vehicle_length_mm || "N/A",
        width: dims.vehicle_width_mm || "N/A",
        height: dims.vehicle_height_mm || "N/A",
        kerbWeight: weights.min_kerbweight_kg || "N/A",
        grossWeight: weights.gross_vehicleweight_kg || "N/A",
      },
    };

    res.json(grouped);
  } catch (error) {
    console.error("RapidCarCheck fetch error:", error);
    res.status(500).json({
      error: "Server error fetching RapidCarCheck data",
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

// ----------------------------
app.listen(PORT, () =>
  console.log(`✅ SmartCheck server running on port ${PORT}`)
);
