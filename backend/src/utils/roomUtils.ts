import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica si una habitación está ocupada en un momento específico
 */
export const isRoomOccupiedAt = (reservations: any[], targetDate: Date): boolean => {
  return reservations.some(reservation => {
    if (reservation.status !== 'ACTIVE') return false;
    
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    
    // La habitación está ocupada si la fecha target está entre check-in (inclusivo) y check-out (exclusivo)
    // Esto significa que en el momento exacto del checkout, la habitación ya está disponible
    return targetDate >= checkIn && targetDate < checkOut;
  });
};

/**
 * Verifica si una habitación está ocupada actualmente
 */
export const isRoomCurrentlyOccupied = (reservations: any[]): boolean => {
  const now = new Date();
  return isRoomOccupiedAt(reservations, now);
};

/**
 * Obtiene todas las habitaciones con su estado de ocupación calculado
 */
export const getRoomsWithOccupancyStatus = async () => {
  const rooms = await prisma.room.findMany({
    include: {
      reservations: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          client: true
        }
      }
    },
    orderBy: {
      number: 'asc'
    }
  });

  const now = new Date();

  return rooms.map(room => {
    const isOccupied = isRoomCurrentlyOccupied(room.reservations);
    
    // Buscar la reserva actual si está ocupada
    const currentReservation = room.reservations.find(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      // Usar la misma lógica: inclusivo en check-in, exclusivo en check-out
      return now >= checkIn && now < checkOut;
    });

    // Buscar la próxima reserva si está disponible
    const nextReservation = room.reservations
      .filter(reservation => {
        const checkIn = new Date(reservation.checkIn);
        return checkIn > now;
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0];

    let additionalInfo = null;
    
    if (isOccupied && currentReservation) {
      // Si está ocupada, mostrar hasta cuándo
      const checkOut = new Date(currentReservation.checkOut);
      additionalInfo = {
        type: 'occupied_until',
        time: checkOut.toLocaleString('es-PE', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Lima'
        })
      };
    } else if (!isOccupied && nextReservation) {
      // Si está disponible pero tiene reserva futura
      const checkIn = new Date(nextReservation.checkIn);
      additionalInfo = {
        type: 'available_until',
        time: checkIn.toLocaleString('es-PE', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Lima'
        })
      };
    }

    return {
      ...room,
      isOccupied,
      additionalInfo
    };
  });
};

/**
 * Obtiene habitaciones disponibles para una fecha específica
 */
export const getRoomsAvailabilityForDate = async (targetDate: Date) => {
  const rooms = await prisma.room.findMany({
    include: {
      reservations: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          client: true
        }
      }
    },
    orderBy: {
      number: 'asc'
    }
  });

  return rooms.map(room => {
    // Verificar si la habitación está disponible para mantenimiento
    if (!room.isAvailable) {
      return {
        ...room,
        availableAt: false,
        reason: 'En mantenimiento'
      };
    }

    // Verificar conflictos con reservas activas
    const hasConflict = isRoomOccupiedAt(room.reservations, targetDate);

    // Buscar reservas que pueden afectar la hora consultada
    // Solo incluir reservas que se superponen con el momento consultado o son futuras en el mismo día
    const relevantReservations = room.reservations.filter(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      
      // Incluir la reserva si:
      // 1. La consulta está dentro del rango de la reserva, O
      // 2. La reserva empieza después de la hora consultada en el mismo día
      return (targetDate >= checkIn && targetDate < checkOut) || 
             (checkIn > targetDate && checkIn.toDateString() === targetDate.toDateString());
    });

    // Encontrar la próxima reserva después de la hora consultada
    const nextReservation = relevantReservations
      .filter(reservation => {
        const checkIn = new Date(reservation.checkIn);
        return checkIn > targetDate;
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0];

    // Encontrar la reserva actual si está ocupada
    const currentReservation = relevantReservations
      .filter(reservation => {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        // Usar la misma lógica: inclusivo en check-in, exclusivo en check-out
        return targetDate >= checkIn && targetDate < checkOut;
      })[0];

    let additionalInfo = null;
    
    if (hasConflict && currentReservation) {
      // Si está ocupada, mostrar hasta cuándo
      const checkOut = new Date(currentReservation.checkOut);
      additionalInfo = {
        type: 'occupied_until',
        time: checkOut.toLocaleString('es-PE', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Lima'
        })
      };
    } else if (!hasConflict && nextReservation) {
      // Si está disponible pero tiene reserva futura
      const checkIn = new Date(nextReservation.checkIn);
      additionalInfo = {
        type: 'available_until',
        time: checkIn.toLocaleString('es-PE', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Lima'
        })
      };
    }

    return {
      ...room,
      availableAt: !hasConflict,
      reason: hasConflict ? 'Ocupada en ese horario' : 'Disponible',
      additionalInfo
    };
  });
};

/**
 * Calcula estadísticas de ocupación
 */
export const calculateRoomStats = async () => {
  const rooms = await getRoomsWithOccupancyStatus();
  
  const total = rooms.length;
  const occupied = rooms.filter(room => isRoomCurrentlyOccupied(room.reservations)).length;
  const available = rooms.filter(room => room.isAvailable && !isRoomCurrentlyOccupied(room.reservations)).length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100 * 10) / 10 : 0;

  const roomsByType = await prisma.room.groupBy({
    by: ['type'],
    _count: {
      type: true
    }
  });

  return {
    total,
    occupied,
    available,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    byType: roomsByType
  };
}; 