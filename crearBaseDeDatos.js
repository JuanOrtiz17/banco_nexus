
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

function fechaHace(dias) {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  return f;
}

async function crearBD() {
  try {
    await client.connect();
    console.log(' Conectado a MongoDB');

    const db = client.db('banco_nexus');

    await db.collection('clientes').deleteMany({});
    await db.collection('cuentas').deleteMany({});
    await db.collection('transacciones').deleteMany({});
    console.log('🧹 Colecciones limpiadas');

    const clientes = db.collection('clientes');
    const cuentas = db.collection('cuentas');
    const transacciones = db.collection('transacciones');


    await clientes.insertMany([
      { curp: 'RUAA900101MDFXXX01', nombre: 'Ana Ruiz Álvarez',         email: 'ana.ruiz@mail.com',     telefono: '6121234501', ciudad: 'La Paz' },
      { curp: 'PELU850203HDFXXX02', nombre: 'Luis Pérez López',         email: 'luis.perez@mail.com',   telefono: '6121234502', ciudad: 'La Paz' },
      { curp: 'GOMC920415MDFXXX03', nombre: 'Carla Gómez Martínez',     email: 'carla.gomez@mail.com',  telefono: '6121234503', ciudad: 'Los Cabos' },
      { curp: 'HEMJ880722HDFXXX04', nombre: 'Jorge Hernández Mora',     email: 'jorge.h@mail.com',      telefono: '6121234504', ciudad: 'La Paz' },
      { curp: 'TOSM950310MDFXXX05', nombre: 'María Torres Sánchez',     email: 'maria.torres@mail.com', telefono: '6121234505', ciudad: 'Loreto' },
      { curp: 'RAVD910505HDFXXX06', nombre: 'David Ramírez Vega',       email: 'david.r@mail.com',      telefono: '6121234506', ciudad: 'La Paz' },
      { curp: 'CASL870818MDFXXX07', nombre: 'Lucía Castro Salinas',     email: 'lucia.c@mail.com',      telefono: '6121234507', ciudad: 'Los Cabos' },
      { curp: 'MEND930929HDFXXX08', nombre: 'Daniel Mendoza Nuño',      email: 'daniel.m@mail.com',     telefono: '6121234508', ciudad: 'La Paz' },
      { curp: 'FLOS890214MDFXXX09', nombre: 'Sofía Flores Ortega',      email: 'sofia.f@mail.com',      telefono: '6121234509', ciudad: 'Comondú' },
      { curp: 'AGUM861107HDFXXX10', nombre: 'Miguel Aguilar Pérez',     email: 'miguel.a@mail.com',     telefono: '6121234510', ciudad: 'La Paz' },
      { curp: 'VARP940628MDFXXX11', nombre: 'Patricia Vargas Reyes',    email: 'paty.v@mail.com',       telefono: '6121234511', ciudad: 'Mulegé' },
      { curp: 'SERR901230HDFXXX12', nombre: 'Roberto Serrano Ríos',     email: 'roberto.s@mail.com',    telefono: '6121234512', ciudad: 'La Paz' }
    ]);
    console.log('👥 12 clientes insertados');


    await cuentas.insertMany([
      { cuenta: '1001', cliente: 'RUAA900101MDFXXX01', tipo: 'ahorro',   saldo: 15800.50, fechaApertura: fechaHace(400) },
      { cuenta: '1002', cliente: 'PELU850203HDFXXX02', tipo: 'corriente',saldo:  8420.00, fechaApertura: fechaHace(350) },
      { cuenta: '1003', cliente: 'GOMC920415MDFXXX03', tipo: 'ahorro',   saldo: 23500.75, fechaApertura: fechaHace(300) },
      { cuenta: '1004', cliente: 'HEMJ880722HDFXXX04', tipo: 'corriente',saldo:  3200.00, fechaApertura: fechaHace(280) },
      { cuenta: '1005', cliente: 'TOSM950310MDFXXX05', tipo: 'ahorro',   saldo: 47000.10, fechaApertura: fechaHace(250) },
      { cuenta: '1006', cliente: 'RAVD910505HDFXXX06', tipo: 'corriente',saldo: 12300.00, fechaApertura: fechaHace(220) },
      { cuenta: '1007', cliente: 'CASL870818MDFXXX07', tipo: 'ahorro',   saldo:  6750.40, fechaApertura: fechaHace(200) },
      { cuenta: '1008', cliente: 'MEND930929HDFXXX08', tipo: 'corriente',saldo: 19000.00, fechaApertura: fechaHace(180) },
      { cuenta: '1009', cliente: 'FLOS890214MDFXXX09', tipo: 'ahorro',   saldo:  2500.00, fechaApertura: fechaHace(150) },
      { cuenta: '1010', cliente: 'AGUM861107HDFXXX10', tipo: 'corriente',saldo: 35400.90, fechaApertura: fechaHace(120) },
      { cuenta: '1011', cliente: 'VARP940628MDFXXX11', tipo: 'ahorro',   saldo:  9870.00, fechaApertura: fechaHace(100) },
      { cuenta: '1012', cliente: 'SERR901230HDFXXX12', tipo: 'corriente',saldo: 14250.00, fechaApertura: fechaHace(80)  },
      // Cuentas adicionales (clientes con más de una cuenta)
      { cuenta: '1013', cliente: 'RUAA900101MDFXXX01', tipo: 'corriente',saldo:  4000.00, fechaApertura: fechaHace(60)  },
      { cuenta: '1014', cliente: 'TOSM950310MDFXXX05', tipo: 'corriente',saldo:  1200.00, fechaApertura: fechaHace(40)  }
    ]);
    console.log('💳 14 cuentas insertadas');

   
    await transacciones.insertMany([
      // Cuenta 1001
      { cuenta: '1001', tipo: 'deposito', monto: 5000, fecha: fechaHace(30), descripcion: 'Depósito en sucursal' },
      { cuenta: '1001', tipo: 'retiro',   monto: 1200, fecha: fechaHace(25), descripcion: 'Retiro ATM' },
      { cuenta: '1001', tipo: 'deposito', monto: 3000, fecha: fechaHace(15), descripcion: 'Transferencia recibida' },
      { cuenta: '1001', tipo: 'retiro',   monto:  500, fecha: fechaHace(5),  descripcion: 'Pago servicios' },

      // Cuenta 1002
      { cuenta: '1002', tipo: 'deposito', monto: 4000, fecha: fechaHace(28), descripcion: 'Nómina' },
      { cuenta: '1002', tipo: 'retiro',   monto:  800, fecha: fechaHace(20), descripcion: 'Compra en línea' },
      { cuenta: '1002', tipo: 'retiro',   monto: 1500, fecha: fechaHace(8),  descripcion: 'Pago tarjeta' },

      // Cuenta 1003
      { cuenta: '1003', tipo: 'deposito', monto:10000, fecha: fechaHace(40), descripcion: 'Depósito inicial' },
      { cuenta: '1003', tipo: 'deposito', monto: 5000, fecha: fechaHace(22), descripcion: 'Transferencia' },
      { cuenta: '1003', tipo: 'retiro',   monto: 2000, fecha: fechaHace(10), descripcion: 'Retiro ATM' },

      // Cuenta 1004
      { cuenta: '1004', tipo: 'deposito', monto: 2000, fecha: fechaHace(18), descripcion: 'Transferencia' },
      { cuenta: '1004', tipo: 'retiro',   monto:  500, fecha: fechaHace(7),  descripcion: 'Pago renta' },

      // Cuenta 1005
      { cuenta: '1005', tipo: 'deposito', monto:20000, fecha: fechaHace(35), descripcion: 'Venta auto' },
      { cuenta: '1005', tipo: 'deposito', monto: 7000, fecha: fechaHace(20), descripcion: 'Nómina' },
      { cuenta: '1005', tipo: 'retiro',   monto: 3000, fecha: fechaHace(12), descripcion: 'Vacaciones' },

      // Cuenta 1006
      { cuenta: '1006', tipo: 'deposito', monto: 6000, fecha: fechaHace(26), descripcion: 'Pago de cliente' },
      { cuenta: '1006', tipo: 'retiro',   monto: 1000, fecha: fechaHace(14), descripcion: 'Retiro ATM' },

      // Cuenta 1007
      { cuenta: '1007', tipo: 'deposito', monto: 3000, fecha: fechaHace(21), descripcion: 'Transferencia familiar' },
      { cuenta: '1007', tipo: 'retiro',   monto:  450, fecha: fechaHace(9),  descripcion: 'Despensa' },

      // Cuenta 1008
      { cuenta: '1008', tipo: 'deposito', monto: 8000, fecha: fechaHace(31), descripcion: 'Nómina' },
      { cuenta: '1008', tipo: 'retiro',   monto: 2500, fecha: fechaHace(17), descripcion: 'Pago colegiatura' },

      // Cuenta 1009
      { cuenta: '1009', tipo: 'deposito', monto: 1500, fecha: fechaHace(11), descripcion: 'Depósito en sucursal' },

      // Cuenta 1010
      { cuenta: '1010', tipo: 'deposito', monto:15000, fecha: fechaHace(33), descripcion: 'Reembolso' },
      { cuenta: '1010', tipo: 'retiro',   monto: 5000, fecha: fechaHace(16), descripcion: 'Compra equipo' },

      // Cuenta 1011
      { cuenta: '1011', tipo: 'deposito', monto: 4500, fecha: fechaHace(13), descripcion: 'Nómina' },

      // Cuenta 1012
      { cuenta: '1012', tipo: 'deposito', monto: 7000, fecha: fechaHace(19), descripcion: 'Transferencia' },
      { cuenta: '1012', tipo: 'retiro',   monto: 1200, fecha: fechaHace(6),  descripcion: 'Pago servicios' }
    ]);
    console.log(' 27 transacciones insertadas');

    await clientes.createIndex({ curp: 1 }, { unique: true });
    await cuentas.createIndex({ cuenta: 1 }, { unique: true });
    await cuentas.createIndex({ cliente: 1 });
    await transacciones.createIndex({ cuenta: 1, fecha: -1 });
    console.log('🔑 Índices creados');

    console.log('\n Base de datos "banco_nexus" inicializada con éxito.');
  } catch (error) {
    console.error(' Error al crear la base de datos:', error);
  } finally {
    await client.close();
    console.log(' Conexión cerrada');
  }
}

crearBD();
