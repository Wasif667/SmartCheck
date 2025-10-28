// ----------------------------
// SmartCheck Server (DVLA + OneAutoAPI Experian AutoCheck v3)
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
// Health
// ----------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "SmartCheck API", time: new Date().toISOString() });
});

// ----------------------------
// ✅ Simple DVLA Check
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
// ⚡ OneAutoAPI Experian AutoCheck Premium Check
// ----------------------------
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const apiKey = process.env.ONEAUTO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OneAutoAPI key" });
  }

  const url = `https://api.oneautoapi.com/experian/autocheck/v3?vehicle_registration_mark=${plate}`;

  try {
    console.log("🌐 Fetching OneAutoAPI:", url);

    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    const text = await response.text();
    console.log("🔍 OneAutoAPI raw response:", text.slice(0, 400));

    if (!response.ok) {
      return res.status(response.status).json({ error: "OneAutoAPI error", details: text });
    }

    const data = JSON.parse(text);
    const result = data.result || {};

    // 🧹 Clean + map response
    const grouped = {
      summary: {
        registration: result.vehicle_registration_mark || plate,
        make: result.dvla_manufacturer_desc || "N/A",
        model: result.dvla_model_desc || "N/A",
        fuelType: result.dvla_fuel_desc || "N/A",
        bodyType: result.dvla_body_desc || "N/A",
        transmission: result.dvla_transmission_desc || "N/A",
        numberGears: result.number_gears || "N/A",
        colour: result.colour || "N/A",
        yearOfManufacture: result.manufactured_year || "N/A",
        registrationDate: result.registration_date || "N/A",
        vin: result.vehicle_identification_number || "N/A",
        engineNumber: result.engine_number || "N/A",
        co2Emissions: result.co2_gkm || "N/A",
        engineCapacity: result.engine_capacity_cc || "N/A",
      },

      status: {
        isScrapped: result.is_scrapped || false,
        isExported: result.is_exported || false,
        isImported: result.is_imported || false,
        isNonEuImport: result.is_non_eu_import || false,
        stolen: result.stolen_vehicle_data_items?.some((i) => i.is_stolen) || false,
      },

      finance: (result.finance_data_items || []).map((f) => ({
        startDate: f.finance_start_date,
        type: f.finance_type,
        company: f.finance_company,
        contact: f.finance_company_contact_number,
        agreement: f.finance_agreement_number,
      })),

      keepers: (result.keeper_data_items || []).map((k) => ({
        numberPreviousKeepers: k.number_previous_keepers,
        dateLastChange: k.date_of_last_keeper_change,
      })),

      plates: (result.cherished_data_items || []).map((p) => ({
        from: p.previous_vehicle_registration_mark,
        to: p.current_vehicle_registration_mark,
        date: p.cherished_plate_transfer_date,
      })),

      colours: (result.colour_data_items || []).map((c) => ({
        previousColour: c.last_colour,
        dateChanged: c.date_of_last_colour_change,
      })),

      technical: {
        grossVehicleWeightKg: result.gross_vehicleweight_kg || "N/A",
        kerbWeightKg: result.min_kerbweight_kg || "N/A",
        maxPowerKw: result.max_netpower_kw || "N/A",
        maxBrakedTowKg: result.max_braked_towing_weight_kg || "N/A",
        maxUnbrakedTowKg: result.max_unbraked_towing_weight_kg || "N/A",
        powerWeightRatio: result.power_weight_ratio_kw_kg || "N/A",
      },

      condition: (result.condition_data_items || []).map((c) => ({
        status: c.vehicle_status,
        theftIndicator: c.theft_indicator,
        insurer: c.insurer_name,
        claimNumber: c.insurer_claim_number,
        lossType: c.loss_type,
      })),
    };

    res.json(grouped);
  } catch (error) {
    console.error("🔥 OneAutoAPI fetch error:", error);
    res.status(500).json({ error: "Server error fetching OneAutoAPI data", details: error.message });
  }
});

// ----------------------------
// Serve React frontend
// ----------------------------
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT, () => console.log(`✅ SmartCheck running on port ${PORT}`));

