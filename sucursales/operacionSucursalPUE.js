
const { registrarTransaccion } = require('./_operacionSucursal');

async function correrSucursalPUE() {
  console.log('🏢 Sucursal PUE iniciando operaciones...');
  await registrarTransaccion('1001',  900, 'deposito', 'PUE');
  await registrarTransaccion('1001',  300, 'retiro',   'PUE');
  await registrarTransaccion('1002', 1500, 'deposito', 'PUE');
  console.log('🏢 Sucursal PUE terminó.');
}

if (require.main === module) {
  correrSucursalPUE();
}

module.exports = { correrSucursalPUE };
