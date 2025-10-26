
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

// CORS for local dev (client at 5173)
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigin }));

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "car-check-server" });
});

// DVLA proxy endpoint
app.get("/api/check/:plate", async (req, res) => {
  const plate = req.params.plate?.toUpperCase?.() || "";
  if (!plate || !/^[A-Z0-9]{1,8}$/.test(plate)) {
    return res.status(400).json({ error: "Invalid registration format." });
  }

  try {
    const response = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DVLA_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ registrationNumber: plate })
    });

    // Pass-through status and error handling
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Vehicle not found or invalid registration.", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error("DVLA fetch error:", e);
    res.status(500).json({ error: "Server error while contacting DVLA." });
  }
});

// Serve static production build if present (client build copied to server/public)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get("*", (req, res, next) => {
  const maybeIndex = path.join(publicDir, "index.html");
  res.sendFile(maybeIndex, (err) => {
    if (err) next(); // if no build found, ignore and let API routes handle
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
