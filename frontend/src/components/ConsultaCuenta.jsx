import { useState } from 'react';

export default function ConsultaCuenta() {
  const [cuenta, setCuenta] = useState('');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultar = async () => {
    if (!cuenta.trim()) {
      setError('Ingresa un número de cuenta');
      return;
    }
    setError('');
    setCargando(true);
    setDatos(null);
    try {
      const res = await fetch(`/api/cuenta/${cuenta}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al consultar');
      }
      const data = await res.json();
      setDatos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const formatoMoneda = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const formatoFecha = (f) => new Date(f).toLocaleDateString('es-MX');

  return (
    <div>
      <div className="card">
        <h2>Consulta de saldo y movimientos</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Número de cuenta (ej. 1001)"
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultar()}
          />
          <button onClick={consultar} disabled={cargando}>
            {cargando ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
        {error && <p className="error">⚠️ {error}</p>}
      </div>

      {datos && (
        <>
          <div className="card">
            <h3>Información del cliente</h3>
            <div className="info-grid">
              <div><span className="label">Titular:</span> {datos.cliente?.nombre}</div>
              <div><span className="label">CURP:</span> {datos.cliente?.curp}</div>
              <div><span className="label">Email:</span> {datos.cliente?.email}</div>
              <div><span className="label">Ciudad:</span> {datos.cliente?.ciudad}</div>
            </div>
            <hr />
            <div className="saldo-box">
              <div>
                <div className="label">Cuenta {datos.cuenta} ({datos.tipo})</div>
                <div className="saldo">{formatoMoneda(datos.saldo)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Movimientos recientes ({datos.movimientos.length})</h3>
            {datos.movimientos.length === 0 ? (
              <p>Sin movimientos.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.movimientos.map((m, i) => (
                    <tr key={i}>
                      <td>{formatoFecha(m.fecha)}</td>
                      <td>{m.descripcion}</td>
                      <td>
                        <span className={`badge ${m.tipo}`}>{m.tipo}</span>
                      </td>
                      <td className={m.tipo === 'deposito' ? 'positivo' : 'negativo'}>
                        {m.tipo === 'deposito' ? '+' : '-'}{formatoMoneda(m.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
