import React, { useState } from "react";
import "./styles.css";

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

  // Helper: render nested data as tables
  const renderSection = (title, obj) => {
    if (!obj || typeof obj !== "object") return null;
    return (
      <div className="section">
        <h3>{title}</h3>
        <table>
          <tbody>
            {Object.entries(obj).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <tr key={key}>
                    <td colSpan={2}>
                      <strong>{key.replace(/_/g, " ")}</strong>
                      {value.map((v, i) => (
                        <div key={i} className="subsection">
                          {renderSection(`${key} #${i + 1}`, v)}
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              } else if (typeof value === "object" && value !== null) {
                return (
                  <tr key={key}>
                    <td colSpan={2}>{renderSection(key.replace(/_/g, " "), value)}</td>
                  </tr>
                );
              } else {
                return (
                  <tr key={key}>
                    <td>{key.replace(/_/g, " ")}</td>
                    <td>{String(value)}</td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
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

      {basicData && (
        <div className="result">
          <h2>Basic DVLA Information</h2>
          {renderSection("DVLA Vehicle Data", basicData)}
        </div>
      )}

      {fullData && (
        <div className="result">
          <h2>Full Vehicle Report (RapidCarCheck)</h2>
          {fullData.vehicle_details &&
            renderSection("Vehicle Details", fullData.vehicle_details)}
          {fullData.model_details &&
            renderSection("Model Details", fullData.model_details)}
          {fullData.vehicle_history &&
            renderSection("Vehicle History", fullData.vehicle_history)}
          {renderSection("Other Data", fullData)}
        </div>
      )}

      <div className="footer">Data from DVLA & RapidCarCheck APIs</div>
    </div>
  );
}


