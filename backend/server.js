
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const PORT = 3001;
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'banco_nexus';

const app = express();
app.use(cors());
app.use(express.json());

let db;
const client = new MongoClient(MONGO_URI);

async function conectarMongo() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    console.log(` Backend conectado a MongoDB -> ${DB_NAME}`);
  } catch (err) {
    console.error(' Error conectando a MongoDB:', err);
    process.exit(1);
  }
}


// RUTAS DE CONSULTA (heredadas de Etapa 1)

app.get('/api/health', async (req, res) => {
  try {
    const count = await db.collection('clientes').countDocuments();
    res.json({ status: 'ok', clientes: count });
  } catch (err) {
    res.status(500).json({ status: 'error', mensaje: err.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const lista = await db.collection('clientes').find({}).toArray();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cuenta/:cuenta', async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;
    const cuenta = await db.collection('cuentas').findOne({ cuenta: numeroCuenta });
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    const cliente = await db.collection('clientes').findOne({ curp: cuenta.cliente });
    const movimientos = await db
      .collection('transacciones')
      .find({ cuenta: numeroCuenta })
      .sort({ fecha: -1 })
      .toArray();

    res.json({
      cuenta: cuenta.cuenta,
      tipo: cuenta.tipo,
      saldo: cuenta.saldo,
      fechaApertura: cuenta.fechaApertura,
      cliente: cliente
        ? { nombre: cliente.nombre, curp: cliente.curp, email: cliente.email, ciudad: cliente.ciudad }
        : null,
      movimientos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/historial/:cuenta', async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;
    const cuenta = await db.collection('cuentas').findOne({ cuenta: numeroCuenta });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const txs = await db
      .collection('transacciones')
      .find({ cuenta: numeroCuenta })
      .sort({ fecha: 1 })
      .toArray();

    let saldoInicial = cuenta.saldo;
    for (const t of txs) {
      if (t.tipo === 'deposito') saldoInicial -= t.monto;
      else if (t.tipo === 'retiro') saldoInicial += t.monto;
    }

    const historial = [];
    let saldo = saldoInicial;
    historial.push({ fecha: cuenta.fechaApertura, saldo, descripcion: 'Apertura' });

    for (const t of txs) {
      saldo += t.tipo === 'deposito' ? t.monto : -t.monto;
      historial.push({
        fecha: t.fecha, saldo, descripcion: t.descripcion,
        tipo: t.tipo, monto: t.monto, sucursal: t.sucursal || 'N/A'
      });
    }

    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// RUTAS DE OPERACIÓN (NUEVAS EN ETAPA 2)

// --- DEPÓSITO ---
// Body esperado: { cuenta: "1001", monto: 500, sucursal: "CDMX" }
app.post('/api/deposito', async (req, res) => {
  try {
    const { cuenta, monto, sucursal } = req.body;

    // Validación 1: el monto debe ser un número positivo
    const cantidad = Number(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }

    // Validación 2: la cuenta debe existir
    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    if (!cuentaDoc) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Lógica: registrar la transacción y aumentar el saldo
    const nuevaTx = {
      cuenta: String(cuenta),
      tipo: 'deposito',
      monto: cantidad,
      fecha: new Date(),
      descripcion: `Depósito desde sucursal ${sucursal || 'N/A'}`,
      sucursal: sucursal || 'N/A'
    };
    await db.collection('transacciones').insertOne(nuevaTx);

    // $inc incrementa el saldo de forma atómica
    await db.collection('cuentas').updateOne(
      { cuenta: String(cuenta) },
      { $inc: { saldo: cantidad } }
    );

    const actualizada = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });

    res.json({
      mensaje: 'Depósito exitoso',
      cuenta: String(cuenta),
      monto: cantidad,
      sucursal: sucursal || 'N/A',
      saldoNuevo: actualizada.saldo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RETIRO ---
// Body esperado: { cuenta: "1001", monto: 500, sucursal: "GDL" }
app.post('/api/retiro', async (req, res) => {
  try {
    const { cuenta, monto, sucursal } = req.body;

    // Validación 1: monto positivo
    const cantidad = Number(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }

    // Validación 2: cuenta existe
    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    if (!cuentaDoc) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Validación 3: saldo suficiente
    if (cuentaDoc.saldo < cantidad) {
      return res.status(400).json({
        error: 'Fondos insuficientes',
        saldoActual: cuentaDoc.saldo,
        montoSolicitado: cantidad
      });
    }

    // Lógica: registrar transacción y restar saldo
    const nuevaTx = {
      cuenta: String(cuenta),
      tipo: 'retiro',
      monto: cantidad,
      fecha: new Date(),
      descripcion: `Retiro desde sucursal ${sucursal || 'N/A'}`,
      sucursal: sucursal || 'N/A'
    };
    await db.collection('transacciones').insertOne(nuevaTx);

    await db.collection('cuentas').updateOne(
      { cuenta: String(cuenta) },
      { $inc: { saldo: -cantidad } }
    );

    const actualizada = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });

    res.json({
      mensaje: 'Retiro exitoso',
      cuenta: String(cuenta),
      monto: cantidad,
      sucursal: sucursal || 'N/A',
      saldoNuevo: actualizada.saldo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Arrancar servidor

conectarMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API REST escuchando en http://localhost:${PORT}`);
    console.log(`   GET  /api/cuenta/1001`);
    console.log(`   POST /api/deposito  { cuenta, monto, sucursal }`);
    console.log(`   POST /api/retiro    { cuenta, monto, sucursal }`);
  });
});
