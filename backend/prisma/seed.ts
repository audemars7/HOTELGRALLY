import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.reservation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.room.deleteMany();

  console.log('🗑️ Datos existentes eliminados');

  // Crear las 19 habitaciones según las especificaciones
  const rooms = [
    // 13 habitaciones de Plaza 1/2 (20 soles)
    ...Array.from({ length: 13 }, (_, i) => ({
      number: i + 1,
      type: 'PLAZA_MEDIA' as const,
      price: 20.0,
      isAvailable: true
    })),
    
    // 5 habitaciones de 2 plazas (25 soles)
    ...Array.from({ length: 5 }, (_, i) => ({
      number: i + 14,
      type: 'DOS_PLAZAS' as const,
      price: 25.0,
      isAvailable: true
    })),
    
    // 1 habitación doble (40 soles)
    {
      number: 19,
      type: 'DOBLE' as const,
      price: 40.0,
      isAvailable: true
    }
  ];

  // Insertar habitaciones
  for (const room of rooms) {
    await prisma.room.create({
      data: room
    });
  }

  console.log('🏨 Habitaciones creadas:');
  console.log(`   - ${13} habitaciones Plaza 1/2 (20 soles)`);
  console.log(`   - ${5} habitaciones 2 plazas (25 soles)`);
  console.log(`   - ${1} habitación doble (40 soles)`);
  console.log(`   Total: ${rooms.length} habitaciones`);

  // Crear algunos clientes de ejemplo
  const sampleClients = [
    {
      name: 'Juan Pérez',
      dni: '12345678',
      origin: 'Lima',
      occupation: 'Estudiante'
    },
    {
      name: 'María García',
      dni: '87654321',
      origin: 'Arequipa',
      occupation: 'Comerciante'
    },
    {
      name: 'Carlos López',
      dni: '11223344',
      origin: 'Trujillo',
      occupation: null
    }
  ];

  for (const client of sampleClients) {
    await prisma.client.create({
      data: client
    });
  }

  console.log('👥 Clientes de ejemplo creados');

  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });