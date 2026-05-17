import { useState } from 'react';
import ConsultaCuenta from './components/ConsultaCuenta.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [vista, setVista] = useState('consulta');

  return (
    <div className="app">
      <header className="header">
        <h1>🏦 Banco Nexus</h1>
        <p className="subtitle">Sistema de gestión distribuida — Etapa 2</p>
      </header>

      <nav className="tabs">
        <button
          className={vista === 'consulta' ? 'tab active' : 'tab'}
          onClick={() => setVista('consulta')}
        >
          Operaciones bancarias
        </button>
        <button
          className={vista === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setVista('dashboard')}
        >
          Dashboard financiero
        </button>
      </nav>

      <main className="content">
        {vista === 'consulta' ? <ConsultaCuenta /> : <Dashboard />}
      </main>

      <footer className="footer">
        Banco Nexus © 2026 — Práctica de Bases de Datos Distribuidas
      </footer>
    </div>
  );
}
