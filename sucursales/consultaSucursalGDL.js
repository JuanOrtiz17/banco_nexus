

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';

async function consultar(cuenta) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('banco_nexus');

    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta: String(cuenta) });
    if (!cuentaDoc) {
      console.log(`❌ [GDL] Cuenta ${cuenta} no encontrada`);
      return;
    }

    const totalTx = await db.collection('transacciones')
      .countDocuments({ cuenta: String(cuenta) });

    console.log('───────────────────────────────────────');
    console.log(`📊 [Consulta desde GDL] Cuenta ${cuenta}`);
    console.log(`   Saldo actual:      $${cuentaDoc.saldo}`);
    console.log(`   Total movimientos: ${totalTx}`);
    console.log('───────────────────────────────────────');
  } catch (err) {
    console.error('❌ [GDL] Error:', err.message);
  } finally {
    await client.close();
  }
}

// Toma el número de cuenta del argumento de línea de comandos
const cuenta = process.argv[2] || '1001';
consultar(cuenta);
