import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basic, setBasic] = useState(null);
  const [full, setFull] = useState(null);
  const [showRaw, setShowRaw] = useState(false); // 👈 NEW: toggle for raw JSON
  const [rawData, setRawData] = useState(null); // 👈 NEW: store raw JSON

  const runCheck = async (type) => {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    setBasic(null);
    setFull(null);
    setShowRaw(false);

    try {
      const res = await fetch(`/api/${type}/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (type === "check") setBasic(data);
      if (type === "full") setFull(data);

      setRawData(data); // 👈 Save raw response
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "✅ Yes" : "❌ No";
    return value;
  };

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  const Section = ({ title, data }) => {
    if (!data) return null;
    if (Array.isArray(data) && data.length === 0) return null;

    return (
      <div className="card">
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="card-body">
          {Array.isArray(data) ? (
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key) => (
                    <th key={key}>{formatLabel(key)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx}>
                    {Object.values(item).map((val, i) => (
                      <td key={i}>{formatValue(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid">
              {Object.entries(data).map(([key, val]) => (
                <div key={key} className="kv">
                  <div className="kv-label">{formatLabel(key)}</div>
                  <div className="kv-value">{formatValue(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">🚗</div>
          <div className="brand-text">
            <strong>SmartCheck</strong>
            <span>Vehicle Intelligence</span>
          </div>
        </div>
        <button
          className="btn ghost"
          onClick={() => window.print()}
          disabled={!basic && !full}
        >
          ⬇️ Download PDF
        </button>
      </header>

      <main className="content">
        <section className="search no-print">
          <h1>Smart Vehicle Check</h1>
          <p className="subtitle">Enter your registration to begin</p>

          <div className="search-bar">
            <input
              type="text"
              placeholder="e.g. S9VFA"
              value={reg}
              maxLength={8}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
            />
            <div className="buttons">
              <button
                className="btn primary"
                disabled={loading}
                onClick={() => runCheck("check")}
              >
                {loading ? "Checking…" : "🔍 Simple Check"}
              </button>
              <button
                className="btn success"
                disabled={loading}
                onClick={() => runCheck("full")}
              >
                {loading ? "Fetching…" : "⚡ Full Check"}
              </button>
            </div>
          </div>

          {error && <div className="alert error">⚠️ {error}</div>}
        </section>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Fetching data…</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {basic && <Section title="Simple Check (DVLA)" data={basic} />}

            {full && (
              <>
                <Section title="Summary" data={full.summary} />
                <Section title="Finance" data={full.finance} />
                <Section title="Keepers" data={full.keepers} />
                <Section title="Plate History" data={full.plateHistory} />
                <Section title="Condition" data={full.condition} />
                <Section title="Stolen Records" data={full.stolen} />
                <Section title="Colour Changes" data={full.colourChanges} />
                <Section title="Search History" data={full.searches} />
                <Section title="Technical Details" data={full.technical} />
              </>
            )}

            {/* 👇 NEW: Raw JSON toggle */}
            {rawData && (
              <div className="raw-section">
                <button
                  className="btn ghost"
                  onClick={() => setShowRaw((v) => !v)}
                >
                  {showRaw ? "🙈 Hide Raw Data" : "👀 Show Raw Data"}
                </button>
                {showRaw && (
                  <pre className="raw-json">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !basic && !full && (
          <div className="empty">
            <p>Start by entering a registration above 👆</p>
          </div>
        )}
      </main>

      <footer className="footer no-print">
        © {new Date().getFullYear()} SmartCheck • Data from DVLA & OneAutoAPI
      </footer>
    </div>
  );
}
