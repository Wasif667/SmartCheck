import React, { useState } from "react";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basicData, setBasicData] = useState(null);
  const [fullData, setFullData] = useState(null);

  // Basic DVLA check
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

  // RapidCarCheck full report
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

  return (
    <div className="card">
      <h1>Smart Car Check</h1>
      <p>Enter a UK number plate to check vehicle info.</p>

      <div className="formRow">
        <input
          placeholder="AB12CDE"
          value={reg}
          onChange={(e) => setReg(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1em" }}>
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

      {error && <div style={{ color: "#f87171" }}>⚠️ {error}</div>}

      {/* Basic DVLA info */}
      {basicData && (
        <div className="result">
          <h2>Basic DVLA Information</h2>
          <table>
            <tbody>
              <tr><td>Registration:</td><td>{basicData.registrationNumber}</td></tr>
              <tr><td>Make:</td><td>{basicData.make}</td></tr>
              <tr><td>Model:</td><td>{basicData.model}</td></tr>
              <tr><td>Colour:</td><td>{basicData.colour}</td></tr>
              <tr><td>Fuel Type:</td><td>{basicData.fuelType}</td></tr>
              <tr><td>Year of Manufacture:</td><td>{basicData.yearOfManufacture}</td></tr>
              <tr><td>Tax Status:</td><td>{basicData.taxStatus}</td></tr>
              <tr><td>MOT Status:</td><td>{basicData.motStatus}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Full RapidCarCheck info */}
      {fullData && (
        <div className="result">
          <h2>Full Vehicle Report</h2>
          <table>
            <tbody>
              <tr><td>Registration:</td><td>{fullData.vrm}</td></tr>
              <tr><td>Make:</td><td>{fullData.make}</td></tr>
              <tr><td>Model:</td><td>{fullData.model}</td></tr>
              <tr><td>Colour:</td><td>{fullData.colour}</td></tr>
              <tr><td>Fuel Type:</td><td>{fullData.fuelType}</td></tr>
              <tr><td>Engine Size:</td><td>{fullData.engineCapacity} cc</td></tr>
              <tr><td>Transmission:</td><td>{fullData.transmission}</td></tr>
              <tr><td>Finance Owed:</td><td>{fullData.financeOwed ? "⚠️ Yes" : "✅ Clear"}</td></tr>
              <tr><td>Stolen:</td><td>{fullData.stolen ? "⚠️ Yes" : "✅ No"}</td></tr>
              <tr><td>Written Off:</td><td>{fullData.writeOff ? "⚠️ Yes" : "✅ No"}</td></tr>
              <tr><td>Mileage:</td><td>{fullData.mileage || "N/A"}</td></tr>
            </tbody>
          </table>

          {fullData.motExpiryDate && (
            <p>MOT Expiry: <strong>{fullData.motExpiryDate}</strong></p>
          )}
        </div>
      )}

      <div className="footer">
        Data sources: DVLA Vehicle Enquiry API & RapidCarCheck API
      </div>
    </div>
  );
}

