

const { MongoClient } = require('mongodb');
const { correrSucursalCDMX } = require('./operacionSucursalCDMX');
const { correrSucursalGDL }  = require('./operacionSucursalGDL');
const { correrSucursalMTY }  = require('./operacionSucursalMTY');
const { correrSucursalPUE }  = require('./operacionSucursalPUE');
const { correrSucursalTIJ }  = require('./operacionSucursalTIJ');

const uri = 'mongodb://localhost:27017';
const CUENTA = '1001';


const MOVIMIENTOS_1001 = [
  +1500, -500,   // CDMX
  +1000, -800,   // GDL
  +2500, -1200,  // MTY
  +900,  -300,   // PUE
  +1800, -600    // TIJ
];

async function obtenerSaldo() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('banco_nexus');
    const c = await db.collection('cuentas').findOne({ cuenta: CUENTA });
    return c ? c.saldo : null;
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('========================================');
  console.log('   SIMULACIÓN CONCURRENTE - BANCO NEXUS');
  console.log('========================================\n');

  // 1) Saldo inicial
  const saldoInicial = await obtenerSaldo();
  if (saldoInicial === null) {
    console.log('❌ La cuenta 1001 no existe. Corre primero crearBaseDeDatos.js');
    return;
  }
  console.log(`💰 Saldo INICIAL de cuenta ${CUENTA}: $${saldoInicial}\n`);

  // 2) Saldo esperado
  const cambioTotal = MOVIMIENTOS_1001.reduce((a, b) => a + b, 0);
  const saldoEsperado = saldoInicial + cambioTotal;
  console.log(`🧮 Cambio neto esperado en cuenta ${CUENTA}: $${cambioTotal}`);
  console.log(`🎯 Saldo ESPERADO si no hay errores: $${saldoEsperado}\n`);

  
  console.log('🚀 Lanzando 5 sucursales en paralelo (Promise.all)...\n');
  const inicio = Date.now();

  await Promise.all([
    correrSucursalCDMX(),
    correrSucursalGDL(),
    correrSucursalMTY(),
    correrSucursalPUE(),
    correrSucursalTIJ()
  ]);

  const duracion = Date.now() - inicio;
  console.log(`\n⏱️  Todas las sucursales terminaron en ${duracion} ms\n`);

 
  const saldoFinal = await obtenerSaldo();
  console.log(`💰 Saldo FINAL real de cuenta ${CUENTA}: $${saldoFinal}\n`);

  
  console.log('========================================');
  console.log('   ANÁLISIS DE CONSISTENCIA');
  console.log('========================================');
  console.log(`Saldo esperado: $${saldoEsperado}`);
  console.log(`Saldo real:     $${saldoFinal}`);

  const diferencia = saldoFinal - saldoEsperado;
  if (Math.abs(diferencia) < 0.001) {
    console.log('✅ SIN INCONSISTENCIAS: el saldo coincide con lo esperado.');
    console.log('   El operador $inc de MongoDB es atómico, por lo que las');
    console.log('   operaciones concurrentes no se pisaron entre sí.');
  } else {
    console.log(`⚠️  INCONSISTENCIA DETECTADA. Diferencia: $${diferencia}`);
    console.log('   Esto indicaría una condición de carrera (race condition).');
  }
  console.log('========================================');
}

main();
