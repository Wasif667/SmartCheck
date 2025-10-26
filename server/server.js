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

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "car-check-server", time: new Date().toISOString() });
});

// --- DVLA Basic Vehicle Check ---
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
        "Accept": "application/json",
      },
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
  }
});

// --- Serve React build (for Render) ---
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

