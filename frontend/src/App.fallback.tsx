import React, { useEffect, useState } from 'react'

export default function AppFallback() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/health` : 'http://localhost:8000/health')
        if (res.ok) setStatus('ok')
        else setStatus('error')
      } catch (e) {
        setStatus('error')
      }
    }
    check()
  }, [])

  return (
    <div className="fallback-root">
      <header className="fallback-header">
        <h1>NutriSathi (Fallback UI)</h1>
        <p className="muted">A minimal UI while the main frontend is being fixed.</p>
      </header>

      <main className="fallback-main">
        <section className="card">
          <h2>Backend status</h2>
          <div className={`status ${status}`}>{status === 'checking' ? 'Checking...' : status === 'ok' ? 'Connected' : 'Unavailable'}</div>
        </section>

        <section className="card">
          <h2>Quick Actions</h2>
          <div className="buttons">
            <a className="btn" href="/">Open App</a>
            <a className="btn" href="/">Log Meal</a>
            <a className="btn" href="/">History</a>
          </div>
        </section>

        <section className="card">
          <h2>About</h2>
          <p>This is a lightweight fallback UI that does not rely on Tailwind. Use it to verify the backend and basic flows while we repair the main frontend.</p>
        </section>
      </main>

      <footer className="fallback-footer">© {new Date().getFullYear()} NutriSathi</footer>
    </div>
  )
}
