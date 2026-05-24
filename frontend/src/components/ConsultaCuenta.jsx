import { useState } from 'react';

export default function ConsultaCuenta() {
  const [cuenta, setCuenta] = useState('');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para las operaciones (Etapa 2)
  const [monto, setMonto] = useState('');
  const [sucursal, setSucursal] = useState('CDMX');
  const [mensaje, setMensaje] = useState(null); // { tipo: 'exito'|'error', texto: '' }

  const SUCURSALES = ['CDMX', 'GDL', 'MTY', 'PUE', 'TIJ'];

  const formatoMoneda = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const formatoFecha = (f) => new Date(f).toLocaleDateString('es-MX');

  // --- Consultar cuenta ---
  const consultar = async () => {
    if (!cuenta.trim()) {
      setError('Ingresa un número de cuenta');
      return;
    }
    setError('');
    setMensaje(null);
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

  // --- Realizar operación (depósito o retiro) ---
  const operar = async (tipo) => {
    setMensaje(null);

    if (!datos) {
      setMensaje({ tipo: 'error', texto: 'Primero consulta una cuenta' });
      return;
    }
    const cantidad = Number(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido mayor a 0' });
      return;
    }

    try {
      const res = await fetch(`/api/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuenta: datos.cuenta, monto: cantidad, sucursal })
      });
      const data = await res.json();

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: `❌ ${data.error || 'Error en la operación'}` });
        return;
      }

      setMensaje({
        tipo: 'exito',
        texto: `✅ ${data.mensaje}. Nuevo saldo: ${formatoMoneda(data.saldoNuevo)}`
      });
      setMonto('');
      // Refrescar los datos de la cuenta
      await consultar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `❌ ${err.message}` });
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Operaciones bancarias</h2>
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

          {/* PANEL DE OPERACIONES (NUEVO ETAPA 2) */}
          <div className="card">
            <h3>Realizar operación</h3>
            <div className="form-row">
              <input
                type="number"
                placeholder="Monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="select-sucursal"
              >
                {SUCURSALES.map((s) => (
                  <option key={s} value={s}>Sucursal {s}</option>
                ))}
              </select>
            </div>
            <div className="form-row" style={{ marginTop: '10px' }}>
              <button onClick={() => operar('deposito')} className="btn-deposito">
                💰 Depositar
              </button>
              <button onClick={() => operar('retiro')} className="btn-retiro">
                💸 Retirar
              </button>
            </div>
            {mensaje && (
              <p className={mensaje.tipo === 'exito' ? 'exito' : 'error'}>
                {mensaje.texto}
              </p>
            )}
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
                    <th>Sucursal</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.movimientos.map((m, i) => (
                    <tr key={i}>
                      <td>{formatoFecha(m.fecha)}</td>
                      <td>{m.descripcion}</td>
                      <td><span className="badge-sucursal">{m.sucursal || 'N/A'}</span></td>
                      <td><span className={`badge ${m.tipo}`}>{m.tipo}</span></td>
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
