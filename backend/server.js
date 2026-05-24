
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const PORT = 3001;


const MONGO_URI = 'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rsBanco';

// URI de fallback a nodo único (modo desarrollo sin Replica Set)
const MONGO_URI_LOCAL = 'mongodb://localhost:27017';

const DB_NAME = 'banco_nexus';

const app = express();
app.use(cors());
app.use(express.json());

let db;
let client;
// Modo de conexión actual ('replica' o 'local')
let modoConexion = 'desconocido';


// Conexión al Replica Set 

async function conectarMongo() {
  // Intento 1: Replica Set
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,    
      retryWrites: true                  
    });
    await client.connect();
    db = client.db(DB_NAME);
    modoConexion = 'replica';
    console.log(`✅ Backend conectado al Replica Set rsBanco`);
    console.log(`   Nodos: 27017, 27018, 27019`);
  } catch (err) {
    // Intento 2: fallback a nodo local
    console.log('⚠️  Replica Set no disponible. Conectando a nodo local...');
    try {
      client = new MongoClient(MONGO_URI_LOCAL);
      await client.connect();
      db = client.db(DB_NAME);
      modoConexion = 'local';
      console.log(`✅ Backend conectado a nodo único (localhost:27017)`);
      console.log(`   ⚠️  Trabajando SIN replicación. Configura el Replica Set para alta disponibilidad.`);
    } catch (err2) {
      console.error('❌ No se pudo conectar a MongoDB:', err2.message);
      process.exit(1);
    }
  }
}


// Helper: manejo unificado de errores de réplica

function manejarErrorMongo(err, res) {
  console.error('Error MongoDB:', err.name, err.message);

  // El primario está caído o no se encontró servidor
  if (err.name === 'MongoServerSelectionError' || err.code === 'NoPrimary') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      detalle: 'No hay nodo primario disponible. El sistema podría estar en proceso de elección.',
      tipo: 'NO_PRIMARY'
    });
  }
  // Latencia 
  if (err.name === 'MongoNetworkTimeoutError' || /timed out/i.test(err.message)) {
    return res.status(504).json({
      error: 'Latencia alta',
      detalle: 'La base de datos tardó demasiado en responder.',
      tipo: 'TIMEOUT'
    });
  }
  
  return res.status(500).json({ error: err.message, tipo: 'GENERIC' });
}


// RUTAS DE CONSULTA


app.get('/api/health', async (req, res) => {
  try {
    const count = await db.collection('clientes').countDocuments();
    res.json({ status: 'ok', clientes: count, modo: modoConexion });
  } catch (err) {
    manejarErrorMongo(err, res);
  }
});

// NUEVO: estado del Replica Set
app.get('/api/replica/status', async (req, res) => {
  try {
    const inicio = Date.now();
    
    await db.command({ ping: 1 });
    const latencia = Date.now() - inicio;

    let info = { modo: modoConexion, latenciaMs: latencia };

    
    if (modoConexion === 'replica') {
      try {
        const admin = client.db('admin');
        const status = await admin.command({ replSetGetStatus: 1 });
        info.replicaSet = status.set;
        info.miembros = status.members.map(m => ({
          nombre: m.name,
          estado: m.stateStr,
          salud: m.health === 1 ? 'OK' : 'CAÍDO'
        }));
        const primarios = status.members.filter(m => m.stateStr === 'PRIMARY');
        info.tienePrimario = primarios.length > 0;
        info.primario = primarios[0]?.name || null;
      } catch (e) {
        info.replicaError = e.message;
      }
    }

    // Marca de alerta para el frontend
    if (latencia > 1000) info.alerta = 'LATENCIA_ALTA';
    if (modoConexion === 'replica' && info.tienePrimario === false) info.alerta = 'SIN_PRIMARIO';

    res.json(info);
  } catch (err) {
    manejarErrorMongo(err, res);
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const lista = await db.collection('clientes').find({}).toArray();
    res.json(lista);
  } catch (err) { manejarErrorMongo(err, res); }
});

app.get('/api/cuenta/:cuenta', async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;
    const cuenta = await db.collection('cuentas').findOne({ cuenta: numeroCuenta });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const cliente = await db.collection('clientes').findOne({ curp: cuenta.cliente });
    const movimientos = await db.collection('transacciones')
      .find({ cuenta: numeroCuenta }).sort({ fecha: -1 }).toArray();

    res.json({
      cuenta: cuenta.cuenta, tipo: cuenta.tipo, saldo: cuenta.saldo,
      fechaApertura: cuenta.fechaApertura,
      cliente: cliente
        ? { nombre: cliente.nombre, curp: cliente.curp, email: cliente.email, ciudad: cliente.ciudad }
        : null,
      movimientos
    });
  } catch (err) { manejarErrorMongo(err, res); }
});

app.get('/api/historial/:cuenta', async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;
    const cuenta = await db.collection('cuentas').findOne({ cuenta: numeroCuenta });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const txs = await db.collection('transacciones')
      .find({ cuenta: numeroCuenta }).sort({ fecha: 1 }).toArray();

    let saldoInicial = cuenta.saldo;
    for (const t of txs) {
      if (t.tipo === 'deposito') saldoInicial -= t.monto;
      else if (t.tipo === 'retiro') saldoInicial += t.monto;
    }

    const historial = [{ fecha: cuenta.fechaApertura, saldo: saldoInicial, descripcion: 'Apertura' }];
    let saldo = saldoInicial;
    for (const t of txs) {
      saldo += t.tipo === 'deposito' ? t.monto : -t.monto;
      historial.push({
        fecha: t.fecha, saldo, descripcion: t.descripcion,
        tipo: t.tipo, monto: t.monto, sucursal: t.sucursal || 'N/A'
      });
    }
    res.json(historial);
  } catch (err) { manejarErrorMongo(err, res); }
});


// RUTAS DE OPERACIÓN (heredadas de Etapa 2)


app.post('/api/deposito', async (req, res) => {
  try {
    const { cuenta, monto, sucursal } = req.body;
    const cantidad = Number(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }
    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });

    await db.collection('transacciones').insertOne({
      cuenta: String(cuenta), tipo: 'deposito', monto: cantidad,
      fecha: new Date(),
      descripcion: `Depósito desde sucursal ${sucursal || 'N/A'}`,
      sucursal: sucursal || 'N/A'
    });

    await db.collection('cuentas').updateOne(
      { cuenta: String(cuenta) }, { $inc: { saldo: cantidad } }
    );

    const actualizada = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    res.json({
      mensaje: 'Depósito exitoso', cuenta: String(cuenta),
      monto: cantidad, sucursal: sucursal || 'N/A', saldoNuevo: actualizada.saldo
    });
  } catch (err) { manejarErrorMongo(err, res); }
});

app.post('/api/retiro', async (req, res) => {
  try {
    const { cuenta, monto, sucursal } = req.body;
    const cantidad = Number(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }
    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuentaDoc.saldo < cantidad) {
      return res.status(400).json({
        error: 'Fondos insuficientes', saldoActual: cuentaDoc.saldo, montoSolicitado: cantidad
      });
    }

    await db.collection('transacciones').insertOne({
      cuenta: String(cuenta), tipo: 'retiro', monto: cantidad,
      fecha: new Date(),
      descripcion: `Retiro desde sucursal ${sucursal || 'N/A'}`,
      sucursal: sucursal || 'N/A'
    });

    await db.collection('cuentas').updateOne(
      { cuenta: String(cuenta) }, { $inc: { saldo: -cantidad } }
    );

    const actualizada = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    res.json({
      mensaje: 'Retiro exitoso', cuenta: String(cuenta),
      monto: cantidad, sucursal: sucursal || 'N/A', saldoNuevo: actualizada.saldo
    });
  } catch (err) { manejarErrorMongo(err, res); }
});


conectarMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API REST escuchando en http://localhost:${PORT}`);
    console.log(`   GET  /api/replica/status   (nuevo en Etapa 3)`);
  });
});
