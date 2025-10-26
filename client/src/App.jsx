import React, { useState, useRef } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basic, setBasic] = useState(null);
  const [full, setFull] = useState(null);
  const reportRef = useRef(null);

  const runCheck = async (type) => {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/${type}/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (type === "check") setBasic(data);
      if (type === "full") setFull(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => window.print();

  const renderSection = (title, obj) => {
    if (!obj || Object.keys(obj).length === 0) return null;
    return (
      <div className="card">
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="card-body grid">
          {Object.entries(obj).map(([key, value]) => (
            <div key={key} className="kv">
              <div className="kv-label">{formatLabel(key)}</div>
              <div className="kv-value">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "✅ Yes" : "❌ No";
    if (Array.isArray(value)) {
      return value.length > 0
        ? value.map((v, i) => <div key={i}>{JSON.stringify(v)}</div>)
        : "—";
    }
    if (typeof value === "object") {
      return (
        <div className="sub-grid">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="muted">{formatLabel(k)}:</span> {formatValue(v)}
            </div>
          ))}
        </div>
      );
    }
    return String(value);
  };

  return (
    <div className="app">
      {/* Header */}
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
        <p className="subtitle">Dark, modern, dynamic — powered by SmartCheck</p>

        <div className="search-controls">
          <input
            placeholder="Enter registration e.g. AB12CDE"
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <div className="buttons">
            <button className="btn primary" disabled={loading} onClick={() => runCheck("check")}>
              {loading ? "Checking…" : "🔍 Simple Check"}
            </button>
            <button className="btn success" disabled={loading} onClick={() => runCheck("full")}>
              {loading ? "Fetching…" : "⚡ Full Check"}
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

      {/* Results */}
      <main className="report" ref={reportRef}>
        {basic && (
          <>
            <div className="card card-green">
              <div className="card-header">
                <h2>Simple Check (DVLA)</h2>
              </div>
              <div className="card-body grid">
                {Object.entries(basic).map(([key, value]) => (
                  <div key={key} className="kv">
                    <div className="kv-label">{formatLabel(key)}</div>
                    <div className="kv-value">{formatValue(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {full && (
          <>
            {Object.entries(full).map(([sectionName, sectionData]) =>
              renderSection(sectionName, sectionData)
            )}
          </>
        )}

        {!basic && !full && !loading && (
          <div className="empty-state no-print">
            <div className="ghost">Start by entering a registration above.</div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer no-print">
        © {new Date().getFullYear()} SmartCheck • Data from DVLA & RapidCarCheck
      </footer>
    </div>
  );
}