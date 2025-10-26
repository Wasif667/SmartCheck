// server.js
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

// Allow frontend requests (CORS)
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));

// --- Health check route ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "car-check-server", timestamp: new Date().toISOString() });
});


// --- DVLA Basic Check (Free API) ---
app.get("/api/check/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const response = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DVLA_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ registrationNumber: plate })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "DVLA API error", details: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("DVLA fetch error:", error);
    res.status(500).json({ error: "Server error fetching DVLA data" });
  }
});


// --- RapidCarCheck Full Vehicle Report ---
app.get("/api/full/:plate", async (req, res) => {
  const plate = req.params.plate.toUpperCase();

  try {
    const response = await fetch(`https://api.rapidcarcheck.co.uk/v1.0/vehicle?vrm=${plate}`, {
      headers: {
        "x-rapidapi-key": process.env.RAPIDCARCHECK_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "RapidCarCheck API error", details: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("RapidCarCheck fetch error:", error);
    res.status(500).json({ error: "Server error fetching RapidCarCheck data" });
