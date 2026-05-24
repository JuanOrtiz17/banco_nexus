

const { registrarTransaccion } = require('./_operacionSucursal');

async function correrSucursalCDMX() {
  console.log('🏢 Sucursal CDMX iniciando operaciones...');
  await registrarTransaccion('1001', 1500, 'deposito', 'CDMX');
  await registrarTransaccion('1001',  500, 'retiro',   'CDMX');
  await registrarTransaccion('1003', 2000, 'deposito', 'CDMX');
  console.log('🏢 Sucursal CDMX terminó.');
}

if (require.main === module) {
  correrSucursalCDMX();
}

module.exports = { correrSucursalCDMX };
