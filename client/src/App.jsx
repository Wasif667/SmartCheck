import React, { useRef, useState } from "react";
import "./styles.css";

function SectionCard({ title, accent = "blue", children }) {
  return (
    <div className={`card card-${accent}`}>
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="kv">
      <div className="kv-label">{label}</div>
      <div className="kv-value">{String(value)}</div>
    </div>
  );
}

function ListBadge({ text }) {
  return <span className="badge">{text}</span>;
}

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basic, setBasic] = useState(null);
  const [full, setFull] = useState(null);
  const reportRef = useRef(null);

  const run = async (endpoint, setter) => {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/${endpoint}/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setter(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // Use browser print. styles.css includes print styles to hide controls.
    window.print();
  };

  return (
    <div className="app">
      {/* Header / Brand */}
      <header className="topbar no-print">
        <div className="brand">
          <div className="logo">🚗</div>
          <div className="brand-text">
            <strong>SmartCheck</strong>
            <span>Vehicle Intelligence</span>
          </div>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={downloadPDF} disabled={!basic && !full}>
            ⬇️ Download PDF
          </button>
        </div>
      </header>

      {/* Search */}
      <section className="search no-print">
        <h1 className="title">Run a Vehicle Check</h1>
        <p className="subtitle">Dark, modern, and crystal-clear results — all on one page.</p>

        <div className="search-controls">
          <input
            placeholder="Enter registration e.g. AB12CDE"
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <div className="buttons">
            <button className="btn primary" disabled={loading} onClick={() => run("check", setBasic)}>
              {loading ? "Checking…" : "🔍 Simple Check (DVLA)"}
            </button>
            <button className="btn success" disabled={loading} onClick={() => run("full", setFull)}>
              {loading ? "Fetching…" : "⚡ Full Check (Premium)"}
            </button>
          </div>
        </div>

        {error && <div className="alert error">⚠️ {error}</div>}
      </section>

      {/* Loading */}
      {loading && (
        <div className="loading no-print">
          <div className="spinner" />
          <div>Fetching data…</div>
        </div>
      )}

      {/* Report Area */}
      <main className="report" ref={reportRef}>
        {/* Simple Check */}
        {basic && (
          <SectionCard title="Simple Check (DVLA)" accent="green">
            <div className="grid">
              <Row label="Registration" value={basic.registration} />
              <Row label="Make" value={basic.make} />
              <Row label="Model" value={basic.model} />
              <Row label="Colour" value={basic.colour} />
              <Row label="Fuel Type" value={basic.fuelType} />
              <Row label="Engine Size (cc)" value={basic.engineSize} />
              <Row label="Transmission" value={basic.transmission} />
              <Row label="Body Type" value={basic.bodyType} />
              <Row label="Year of Manufacture" value={basic.yearOfManufacture} />
              <Row label="CO₂ Emissions (g/km)" value={basic.co2Emissions} />
              <Row label="Tax Status" value={basic.taxStatus} />
              <Row label="Tax Due Date" value={basic.taxDueDate} />
              <Row label="MOT Status" value={basic.motStatus} />
              <Row label="MOT Expiry Date" value={basic.motExpiryDate} />
              <Row label="Date of Last V5C Issued" value={basic.dateOfLastV5CIssued} />
            </div>
          </SectionCard>
        )}

        {/* Full Check */}
        {full && (
          <>
            <SectionCard title="Vehicle Summary" accent="blue">
              <div className="grid">
                <Row label="Registration" value={full.summary?.registration} />
                <Row label="Make" value={full.summary?.make} />
                <Row label="Model" value={full.summary?.model} />
                <Row label="Colour" value={full.summary?.colour} />
                <Row label="Fuel Type" value={full.summary?.fuelType} />
                <Row label="Engine Size (cc)" value={full.summary?.engineSize} />
                <Row label="Transmission" value={full.summary?.transmission} />
                <Row label="CO₂ (g/km)" value={full.summary?.co2} />
                <Row label="MPG (combined)" value={full.summary?.mpg} />
                <Row label="Doors" value={full.summary?.doors} />
                <Row label="Seats" value={full.summary?.seats} />
              </div>
            </SectionCard>

            <SectionCard title="Vehicle History" accent="purple">
              <div className="grid">
                <Row label="Finance Owed" value={full.history?.financeOwed ? "❌ Yes" : "✅ Clear"} />
                <Row label="Stolen" value={full.history?.stolen ? "❌ Yes" : "✅ No"} />
                <Row label="Written Off" value={full.history?.writeOff ? "❌ Yes" : "✅ No"} />
                <Row label="Mileage" value={full.history?.mileage} />
              </div>

              <div className="subgroup">
                <h3>Previous Keepers</h3>
                {Array.isArray(full.history?.previousKeepers) && full.history.previousKeepers.length > 0 ? (
                  <div className="badge-list">
                    {full.history.previousKeepers.map((k, i) => (
                      <ListBadge key={i} text={`Keeper ${k.number} • ${k.lastChange || "-"}`} />
                    ))}
                  </div>
                ) : (
                  <div className="muted">No previous keepers listed.</div>
                )}
              </div>

              <div className="subgroup">
                <h3>Plate Changes</h3>
                {Array.isArray(full.history?.plateChanges) && full.history.plateChanges.length > 0 ? (
                  <div className="badge-list">
                    {full.history.plateChanges.map((p, i) => (
                      <ListBadge key={i} text={`${p.from || "-"} → ${p.to || "-"} • ${p.date || "-"}`} />
                    ))}
                  </div>
                ) : (
                  <div className="muted">No plate changes recorded.</div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Performance & Economy" accent="orange">
              <div className="grid">
                <Row label="Power (bhp)" value={full.performance?.powerBhp} />
                <Row label="Torque (Nm)" value={full.performance?.torqueNm} />
                <Row label="Top Speed (mph)" value={full.performance?.topSpeedMph} />
                <Row label="0–60 mph" value={full.performance?.acceleration} />
              </div>
            </SectionCard>

            <SectionCard title="Technical Details" accent="teal">
              <div className="grid">
                <Row label="VIN" value={full.technical?.vin} />
                <Row label="Engine Number" value={full.technical?.engineNumber} />
                <Row label="Body Type" value={full.technical?.bodyType} />
                <Row label="Wheelplan" value={full.technical?.wheelplan} />
                <Row label="Kerb Weight (kg)" value={full.technical?.kerbWeight} />
                <Row label="Gross Weight (kg)" value={full.technical?.grossWeight} />
                <Row label="Length (mm)" value={full.technical?.length} />
                <Row label="Width (mm)" value={full.technical?.width} />
                <Row label="Height (mm)" value={full.technical?.height} />
              </div>
            </SectionCard>
          </>
        )}

        {!basic && !full && !loading && (
          <div className="empty-state no-print">
            <div className="ghost">Start by entering a registration above.</div>
          </div>
        )}
      </main>

      <footer className="footer no-print">© {new Date().getFullYear()} SmartCheck. Data from DVLA & RapidCarCheck.</footer>
    </div>
  );
}

