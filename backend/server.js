

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

// ---------- Configuración ----------
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

    // 1) Buscar la cuenta
    const cuenta = await db.collection('cuentas').findOne({ cuenta: numeroCuenta });
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // 2) Buscar el cliente dueño (relación cuenta.cliente -> cliente.curp)
    const cliente = await db.collection('clientes').findOne({ curp: cuenta.cliente });

    // 3) Últimas transacciones (ordenadas por fecha desc)
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
      historial.push({ fecha: t.fecha, saldo, descripcion: t.descripcion, tipo: t.tipo, monto: t.monto });
    }

    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


conectarMongo().then(() => {
  app.listen(PORT, () => {
    console.log(` API REST escuchando en http://localhost:${PORT}`);
    console.log(`   Prueba: http://localhost:${PORT}/api/health`);
    console.log(`   Prueba: http://localhost:${PORT}/api/cuenta/1001`);
  });
});
