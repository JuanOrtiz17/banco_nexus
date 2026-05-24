
const { registrarTransaccion } = require('./_operacionSucursal');

async function correrSucursalGDL() {
  console.log('🏢 Sucursal GDL iniciando operaciones...');
  await registrarTransaccion('1001', 1000, 'deposito', 'GDL');
  await registrarTransaccion('1001',  800, 'retiro',   'GDL');
  await registrarTransaccion('1005', 3000, 'deposito', 'GDL');
  console.log('🏢 Sucursal GDL terminó.');
}

if (require.main === module) {
  correrSucursalGDL();
}

module.exports = { correrSucursalGDL };
