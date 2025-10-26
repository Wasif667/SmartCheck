
import React, { useState } from 'react'

export default function App() {
  const [reg, setReg] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  async function handleCheck(e) {
    e.preventDefault()
    setError(null)
    setData(null)

    const trimmed = reg.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a registration number.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/check/${encodeURIComponent(trimmed)}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Lookup failed')
      }
      setData(json)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1>UK Car Check</h1>
      <div className="meta">Enter a UK number plate to get basic DVLA details.</div>
      <form onSubmit={handleCheck} className="formRow">
        <input
          placeholder="AB12CDE"
          value={reg}
          onChange={(e) => setReg(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}

      {data && (
        <>
          <h3>Result</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
      )}

      <div className="footer">
        Data source: DVLA Vehicle Enquiry API. <a href="https://developer-portal.vehicleenquiry.service.gov.uk/" target="_blank" rel="noreferrer">Get an API key</a>.
      </div>
    </div>
  )
}
