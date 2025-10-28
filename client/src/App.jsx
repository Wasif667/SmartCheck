import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const runCheck = async (type) => {
    if (!reg.trim()) return alert("Please enter a registration number");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/${type}/${reg.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      console.log("✅ API Response:", data);
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Safely render any object (even deeply nested)
  const renderObject = (obj) => {
    if (!obj) return <p className="muted">No data available</p>;

    if (typeof obj !== "object") {
      return <span>{String(obj)}</span>;
    }

    if (Array.isArray(obj)) {
      return (
        <div className="array-section">
          {obj.map((item, i) => (
            <div key={i} className="array-item">
              {renderObject(item)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="kv">
            <div className="kv-label">{formatLabel(key)}</div>
            <div className="kv-value">{renderObject(value)}</div>
          </div>
        ))}
      </div>
    );
  };

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

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
          disabled={!result}
        >
          ⬇️ Download PDF
        </button>
      </header>

      <main className="content">
        <section className="search no-print">
          <h1>Smart Vehicle Check</h1>
          <p className="subtitle">Enter a registration to begin</p>

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
            <p>Fetching vehicle data…</p>
          </div>
        )}

        {!loading && result && (
          <div className="card">
            <div className="card-header">
              <h2>Vehicle Check Results</h2>
            </div>
            <div className="card-body">{renderObject(result)}</div>
          </div>
        )}

        {!loading && !result && (
          <div className="empty">
            <p>Start by entering a registration above 👆</p>
          </div>
        )}

        {/* 👇 Show Raw JSON toggle */}
        {result && (
          <div className="raw-section">
            <button
              className="btn ghost"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "🙈 Hide Raw Data" : "👀 Show Raw Data"}
            </button>
            {showRaw && (
              <pre className="raw-json">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </main>

      <footer className="footer no-print">
        © {new Date().getFullYear()} SmartCheck • Data from DVLA & OneAutoAPI
      </footer>
    </div>
  );
}

