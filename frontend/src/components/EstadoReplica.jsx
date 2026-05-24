import { useEffect, useState } from 'react';


export default function EstadoReplica() {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(null);

  const consultarEstado = async () => {
    try {
      const res = await fetch('/api/replica/status');
      if (!res.ok) throw new Error('Error al consultar estado');
      const data = await res.json();
      setEstado(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setEstado(null);
    }
  };

  // Consulta cada 5 segundos
  useEffect(() => {
    consultarEstado();
    const intervalo = setInterval(consultarEstado, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // 1) Sin conexión al backend
  if (error) {
    return (
      <div className="alerta alerta-error">
        🔴 Sin conexión con el servidor. Verifica que el backend esté corriendo.
      </div>
    );
  }

  if (!estado) return null;

  // 2) Sin primario disponible
  if (estado.alerta === 'SIN_PRIMARIO') {
    return (
      <div className="alerta alerta-error">
        ⚠️ Nodo primario no disponible. El sistema está eligiendo uno nuevo.
        Las operaciones pueden tardar.
      </div>
    );
  }

  // 3) Latencia alta
  if (estado.alerta === 'LATENCIA_ALTA') {
    return (
      <div className="alerta alerta-warning">
        🐢 Latencia alta detectada ({estado.latenciaMs} ms). El sistema puede ir lento.
      </div>
    );
  }

  // 4) Modo local (sin Replica Set configurado todavía)
  if (estado.modo === 'local') {
    return (
      <div className="alerta alerta-info">
        ℹ️ Modo desarrollo (sin Replica Set). Latencia: {estado.latenciaMs} ms.
      </div>
    );
  }

  // 5) Todo bien: indicador verde compacto
  return (
    <div className="alerta alerta-ok">
      ✅ Replica Set <strong>{estado.replicaSet}</strong> activo —{' '}
      Primario: <strong>{estado.primario}</strong> — Latencia: {estado.latenciaMs} ms
      {estado.miembros && (
        <span className="nodos">
          {estado.miembros.map((m, i) => (
            <span key={i} className={`nodo nodo-${m.salud === 'OK' ? 'ok' : 'caido'}`}>
              {m.nombre.replace('localhost:', ':')} ({m.estado})
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
