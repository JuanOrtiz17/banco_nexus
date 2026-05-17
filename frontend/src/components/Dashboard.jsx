import { useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Dashboard() {
  const [cuenta, setCuenta] = useState('');
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarHistorial = async () => {
    if (!cuenta.trim()) {
      setError('Ingresa un número de cuenta');
      return;
    }
    setError('');
    setCargando(true);
    try {
      const res = await fetch(`/api/historial/${cuenta}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al consultar');
      }
      const data = await res.json();
      const formateado = data.map((t) => ({
        fecha: new Date(t.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        saldo: Number(t.saldo.toFixed(2))
      }));
      setDatos(formateado);
    } catch (err) {
      setError(err.message);
      setDatos([]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Dashboard Financiero — Evolución del saldo</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Número de cuenta (ej. 1001)"
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarHistorial()}
          />
          <button onClick={cargarHistorial} disabled={cargando}>
            {cargando ? 'Cargando...' : 'Ver evolución'}
          </button>
        </div>
        {error && <p className="error">⚠️ {error}</p>}
      </div>

      {datos.length > 0 && (
        <div className="card">
          <h3>Evolución del saldo en el tiempo</h3>
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip
                  formatter={(v) =>
                    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#0a6cff"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Saldo (MXN)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
