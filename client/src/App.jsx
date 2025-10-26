import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basicData, setBasicData] = useState(null);
  const [fullData, setFullData] = useState(null);

  // ---------- Basic DVLA Check ----------
  async function handleBasicCheck() {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    setFullData(null);

    try {
      const res = await fetch(`/api/check/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vehicle not found");
      setBasicData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Full RapidCarCheck ----------
  async function handleFullCheck() {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    setBasicData(null);

    try {
      const res = await fetch(`/api/full/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Full report not found");
      setFullData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Helper: render rows ----------
  const renderRow = (label, value) => {
    if (value === null || value === undefined || value === "")
      return null;
    return (
      <tr>
        <td>{label}</td>
        <td>{String(value)}</td>
      </tr>
    );
  };

  return (
    <div className="container">
      <h1>SmartCheck Vehicle Report</h1>
      <p>Enter a UK registration number to check a vehicle.</p>

      <div className="formRow">
        <input
          placeholder="AB12CDE"
          value={reg}
          onChange={(e) => setReg(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </div>

      <div className="buttonRow">
        <button onClick={handleBasicCheck} disabled={loading}>
          {loading ? "Checking..." : "Basic Check (DVLA)"}
        </button>
        <button
          onClick={handleFullCheck}
          disabled={loading}
          style={{ background: "#16a34a" }}
        >
          {loading ? "Fetching..." : "Full Vehicle Check"}
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {/* ---------- Basic DVLA Result ---------- */}
      {basicData && (
        <div className="result">
          <h2>Basic DVLA Vehicle Data</h2>
          <table>
            <tbody>
              {Object.entries(basicData).map(([key, value]) => renderRow(key, value))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Full RapidCarCheck Result ---------- */}
      {fullData && (
        <div className="result">
          <h2>Full Vehicle Report (RapidCarCheck)</h2>
          <table>
            <tbody>
              {renderRow("Registration", fullData.registrationNumber)}
              {renderRow("Make", fullData.make)}
              {renderRow("Model", fullData.model)}
              {renderRow("Colour", fullData.colour)}
              {renderRow("Fuel Type", fullData.fuelType)}
              {renderRow(
                "Engine Size",
                fullData.engineCapacity
                  ? `${fullData.engineCapacity} cc`
                  : "N/A"
              )}
              {renderRow("Transmission", fullData.transmission)}
              {renderRow(
                "Power",
                fullData.powerBhp ? `${fullData.powerBhp} bhp` : "N/A"
              )}
              {renderRow(
                "Torque",
                fullData.torqueNm ? `${fullData.torqueNm} Nm` : "N/A"
              )}
              {renderRow(
                "Top Speed",
                fullData.topSpeedMph ? `${fullData.topSpeedMph} mph` : "N/A"
              )}
              {renderRow("MPG", fullData.mpg)}
              {renderRow("CO₂ (g/km)", fullData.co2)}
              {renderRow("Body Type", fullData.bodyType)}
              {renderRow("Doors", fullData.doors)}
              {renderRow("Seats", fullData.seats)}
              {renderRow(
                "Finance Owed",
                fullData.financeOwed ? "❌ Yes" : "✅ Clear"
              )}
              {renderRow("Stolen", fullData.stolen ? "❌ Yes" : "✅ No")}
              {renderRow("Written Off", fullData.writeOff ? "❌ Yes" : "✅ No")}
              {renderRow("Mileage", fullData.mileage)}
              {renderRow("MOT Expiry", fullData.motExpiryDate)}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer">Data provided by DVLA & RapidCarCheck APIs</div>
    </div>
  );
}

