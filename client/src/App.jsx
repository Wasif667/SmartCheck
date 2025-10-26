import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basicData, setBasicData] = useState(null);
  const [fullData, setFullData] = useState(null);

  const fetchData = async (endpoint, setter) => {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    setBasicData(null);
    setFullData(null);

    try {
      const res = await fetch(`/api/${endpoint}/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error fetching data");
      setter(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (label, value) =>
    value ? (
      <div className="row">
        <span className="label">{label}</span>
        <span className="value">{String(value)}</span>
      </div>
    ) : null;

  return (
    <div className="container">
      <h1>SmartCheck Vehicle Report</h1>
      <p>Enter a registration to run a quick DVLA or full check.</p>

      <div className="formRow">
        <input
          placeholder="e.g. AB12CDE"
          value={reg}
          onChange={(e) => setReg(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </div>

      <div className="buttonRow">
        <button onClick={() => fetchData("check", setBasicData)} disabled={loading}>
          {loading ? "Checking..." : "Simple Check (DVLA)"}
        </button>
        <button
          onClick={() => fetchData("full", setFullData)}
          disabled={loading}
          className="btnFull"
        >
          {loading ? "Fetching..." : "Full Vehicle Check"}
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {/* SIMPLE DVLA CHECK */}
      {basicData && (
        <div className="dvlaCard">
          <h2>DVLA Simple Vehicle Check</h2>
          {renderRow("Registration", basicData.registration)}
          {renderRow("Make", basicData.make)}
          {renderRow("Model", basicData.model)}
          {renderRow("Colour", basicData.colour)}
          {renderRow("Fuel Type", basicData.fuelType)}
          {renderRow("Engine Size (cc)", basicData.engineSize)}
          {renderRow("Transmission", basicData.transmission)}
          {renderRow("Body Type", basicData.bodyType)}
          {renderRow("Year of Manufacture", basicData.yearOfManufacture)}
          {renderRow("CO₂ Emissions (g/km)", basicData.co2Emissions)}
          {renderRow("Tax Status", basicData.taxStatus)}
          {renderRow("Tax Due Date", basicData.taxDueDate)}
          {renderRow("MOT Status", basicData.motStatus)}
          {renderRow("MOT Expiry Date", basicData.motExpiryDate)}
          {renderRow("Date of Last V5C Issued", basicData.dateOfLastV5CIssued)}
        </div>
      )}

      {/* FULL CHECK */}
      {fullData && (
        <div className="sectionGroup">
          <div className="section">
            <h2>Vehicle Summary</h2>
            {Object.entries(fullData.summary).map(([k, v]) => renderRow(k, v))}
          </div>
          <div className="section">
            <h2>Vehicle History</h2>
            {Object.entries(fullData.history).map(([k, v]) => renderRow(k, JSON.stringify(v)))}
          </div>
        </div>
      )}

      <footer className="footer">Data provided by DVLA & RapidCarCheck</footer>
    </div>
  );
}

