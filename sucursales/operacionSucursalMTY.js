

const { registrarTransaccion } = require('./_operacionSucursal');

async function correrSucursalMTY() {
  console.log('🏢 Sucursal MTY iniciando operaciones...');
  await registrarTransaccion('1001', 2500, 'deposito', 'MTY');
  await registrarTransaccion('1001', 1200, 'retiro',   'MTY');
  await registrarTransaccion('1010', 4000, 'deposito', 'MTY');
  console.log('🏢 Sucursal MTY terminó.');
}

if (require.main === module) {
  correrSucursalMTY();
}

module.exports = { correrSucursalMTY };
