

const { registrarTransaccion } = require('./_operacionSucursal');

async function correrSucursalTIJ() {
  console.log('🏢 Sucursal TIJ iniciando operaciones...');
  await registrarTransaccion('1001', 1800, 'deposito', 'TIJ');
  await registrarTransaccion('1001',  600, 'retiro',   'TIJ');
  await registrarTransaccion('1012', 2200, 'deposito', 'TIJ');
  console.log('🏢 Sucursal TIJ terminó.');
}

if (require.main === module) {
  correrSucursalTIJ();
}

module.exports = { correrSucursalTIJ };
