import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [basicData, setBasicData] = useState(null);

  // ----------------------------
  // Fetch Basic DVLA Check
  // ----------------------------
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

  // ----------------------------
  // Fetch Full RapidCarCheck
  // ----------------------------
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

  const renderRow = (label, value) => {
    if (!value && value !== 0) return null;
    return (
      <div className="row">
        <span className="label">{label}</span>
        <span className="value">{String(value)}</span>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>SmartCheck Vehicle Report</h1>
      <p>Enter a UK vehicle registration to run a check.</p>

      <div className="formRow">
        <input
          placeholder="e.g. AB12CDE"
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
          className="btnFull"
        >
          {loading ? "Fetching..." : "Full Vehicle Check"}
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {/* ----------------------------
          BASIC DVLA CHECK RESULT
      ---------------------------- */}
      {basicData && (
        <div className="section">
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
          {renderRow("Tax Due Date", basicData.taxDueDate)}
          {renderRow("Tax Status", basicData.taxStatus)}
          {renderRow("MOT Status", basicData.motStatus)}
          {renderRow("MOT Expiry Date", basicData.motExpiryDate)}
          {renderRow("Date of Last V5C Issued", basicData.dateOfLastV5CIssued)}
        </div>
      )}

      {/* ----------------------------
          FULL VEHICLE CHECK RESULT
      ---------------------------- */}
      {fullData && (
        <div className="sectionGroup">
          {/* VEHICLE SUMMARY */}
          <div className="section">
            <h2>Vehicle Summary</h2>
            {renderRow("Registration", fullData.summary.registration)}
            {renderRow("Make", fullData.summary.make)}
            {renderRow("Model", fullData.summary.model)}
            {renderRow("Colour", fullData.summary.colour)}
            {renderRow("Fuel Type", fullData.summary.fuelType)}
            {renderRow("Engine Size (cc)", fullData.summary.engineSize)}
            {renderRow("Transmission", fullData.summary.transmission)}
            {renderRow("CO₂ Emissions (g/km)", fullData.summary.co2)}
            {renderRow("MPG (Combined)", fullData.summary.mpg)}
            {renderRow("Doors", fullData.summary.doors)}
            {renderRow("Seats", fullData.summary.seats)}
          </div>

          {/* VEHICLE HISTORY */}
          <div className="section">
            <h2>Vehicle History</h2>
            {renderRow("Finance Owed", fullData.history.financeOwed ? "❌ Yes" : "✅ Clear")}
            {renderRow("Stolen", fullData.history.stolen ? "❌ Yes" : "✅ No")}
            {renderRow("Written Off", fullData.history.writeOff ? "❌ Yes" : "✅ No")}
            {renderRow("Mileage", fullData.history.mileage)}
            <div className="subsection">
              <h3>Previous Keepers</h3>
              {fullData.history.previousKeepers.length > 0 ? (
                fullData.history.previousKeepers.map((k, i) => (
                  <div key={i} className="row">
                    Keeper {k.number} – Changed on {k.lastChange}
                  </div>
                ))
              ) : (
                <p>No previous keepers listed.</p>
              )}
            </div>

            <div className="subsection">
              <h3>Plate Changes</h3>
              {fullData.history.plateChanges.length > 0 ? (
                fullData.history.plateChanges.map((p, i) => (
                  <div key={i} className="row">
                    {p.from} → {p.to} ({p.date})
                  </div>
                ))
              ) : (
                <p>No plate changes recorded.</p>
              )}
            </div>
          </div>

          {/* PERFORMANCE & ECONOMY */}
          <div className="section">
            <h2>Performance & Economy</h2>
            {renderRow("Power (bhp)", fullData.performance.powerBhp)}
            {renderRow("Torque (Nm)", fullData.performance.torqueNm)}
            {renderRow("Top Speed (mph)", fullData.performance.topSpeedMph)}
            {renderRow("0–60 mph", fullData.performance.acceleration)}
          </div>

          {/* TECHNICAL DETAILS */}
          <div className="section">
            <h2>Technical Details</h2>
            {renderRow("VIN", fullData.technical.vin)}
            {renderRow("Engine Number", fullData.technical.engineNumber)}
            {renderRow("Body Type", fullData.technical.bodyType)}
            {renderRow("Wheelplan", fullData.technical.wheelplan)}
            {renderRow("Kerb Weight (kg)", fullData.technical.kerbWeight)}
            {renderRow("Gross Weight (kg)", fullData.technical.grossWeight)}
            {renderRow("Length (mm)", fullData.technical.length)}
            {renderRow("Width (mm)", fullData.technical.width)}
            {renderRow("Height (mm)", fullData.technical.height)}
          </div>
        </div>
      )}

      <footer className="footer">
        Data provided by DVLA & RapidCarCheck APIs
      </footer>
    </div>
  );
}


