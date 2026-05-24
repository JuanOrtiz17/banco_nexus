
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';

async function registrarTransaccion(cuenta, monto, tipo, sucursal) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('banco_nexus');
    const transacciones = db.collection('transacciones');
    const cuentas = db.collection('cuentas');

    // 1) Registrar la transacción con su sucursal de origen
    const nueva = {
      cuenta: String(cuenta),
      monto,
      tipo,
      sucursal,
      descripcion: `${tipo === 'deposito' ? 'Depósito' : 'Retiro'} concurrente desde ${sucursal}`,
      fecha: new Date()
    };
    await transacciones.insertOne(nueva);

    // 2) Modificar el saldo 
    
    const operador = tipo === 'deposito' ? 1 : -1;
    await cuentas.updateOne(
      { cuenta: String(cuenta) },
      { $inc: { saldo: operador * monto } }
    );

    console.log(`✅ [${sucursal}] ${tipo} de $${monto} en cuenta ${cuenta}`);
  } catch (err) {
    console.error(`❌ [${sucursal}] Error:`, err.message);
  } finally {
    await client.close();
  }
}

module.exports = { registrarTransaccion };
